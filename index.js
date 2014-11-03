var path = require('path');
var exec = require('child_process').exec;
var quickTemp = require('quick-temp');
var symlinkOrCopy = require('symlink-or-copy').sync;
var merge = require('merge');
var dargs = require('dargs');
var Writer = require('broccoli-writer');
var walkCachedSync = require('./lib/walk_cached_sync');
var mkdirp = require('mkdirp').sync;
var rsvp = require('rsvp');
var fs = require('fs');
var urlRe = /url\('((?:\/|.{2})?[^\?\)']+)/g;

var ignoredOptions = [
      'compassCommand',
      'ignoreErrors',
      'cleanOutput',
      'files'
    ];

//TODO: collect sass/scss on construct to build the list css generated files for copy.

/**
 * Executes the cmdLine statement in a Promise.
 * @param cmdLine   The compass compile command line statement.
 * @param options   The options for exec.
 * @returns {exports.Promise}
 */
function compile(cmdLine, options) {
  return new rsvp.Promise(function(resolve, reject) {
    exec(cmdLine, options, function(err, stdout, stderr) {
      if (err) {
        // Provide a robust error message in case of failure.
        // compass sends errors to sdtout, so it's important to include that
        err.message = '[broccoli-compass] failed while executing compass command line\n' +
                      '[broccoli-compass] Working directory:\n' + options.cwd + '\n' +
                      '[broccoli-compass] Executed:\n' + cmdLine + '\n' +
                      '[broccoli-compass] stdout:\n' + stdout + '\n' +
                      '[broccoli-compass] stderr:\n' + stderr + '\n';

        return reject(err);
      }

      resolve();
    });
  });
}

/**
 * Walks the tree and looks for css files under css directory, if `cleanOutput` is TRUE, css content is read to extract
 * images and fonts paths to add them to the queue. Note that this function simply return srcDir if `cleanOutput` is false.
 *
 * @param  {String} srcDir  Source directory
 * @param  {String} destDir Destination
 */
function moveToDest(srcDir, destDir) {
  if (!this.options.cleanOutput) {
    return srcDir;
  }
  var content, cssDir, src;
  var copiedCache = this.copiedCache || {};
  var copied = {};
  var options = this.options;
  var tree = this.walkDir(srcDir, {cache: this.cache, ignore: /^\.sass-cache/});
  var cache = tree.paths;
  var generated = tree.changed;
  var linkedFiles = [];
  for (var i = 0; i < generated.length; i += 1) {
    file = generated[i];
    if (cache[file].isDirectory || copiedCache[file] === cache[file].statsHash) {
      continue;
    }
    src = srcDir + '/' + file;
    if (file.substr(-4) === '.css') {
      content = fs.readFileSync(src);
      cssDir = path.dirname(file);
      while ((linkedFile = urlRe.exec(content))) {
        linkedFile = (linkedFile[1][0] === '/') ? linkedFile[1].substr(1) : path.normalize(cssDir + '/' + linkedFile[1]);
        linkedFiles.push(linkedFile);
      }
    }
    mkdirp(destDir + '/' + path.dirname(file));
    symlinkOrCopy(src, destDir + '/' + file);
    copied[file] = cache[file].statsHash;
  }

  for (i = 0; i < linkedFiles.length; i += 1) {
    file = linkedFiles[i];
    if (file in copied) { continue; }
    if (!cache[file] || copiedCache[file] !== cache[file].statsHash) {
      copied[file] = cache[file] && cache[file].statsHash;
      mkdirp(destDir + '/' + path.dirname(file));
      symlinkOrCopy(srcDir + '/' + file, destDir + '/' + file);
    }
  }
  this.copiedCache = copied;
  return destDir;
}

/**
 * Symlink files source into destination, this will avoid pulluting source directory
 * with files generated at compile time.
 * 
 * @param  {String} source      Source directory
 * @param  {String} destination Destination directory
 */
function makeCompileDir(target, source, tempKey, cache) {
  var src;
  var destDir;
  var paths = target.cache.paths;
  var list = Object.keys(paths);
  quickTemp.makeOrRemake(target, tempKey);
  destDir = target[tempKey];
  for (var i = 0; i < list.length; i++) {
    sub = list[i];
    if (paths[sub].isDirectory) {
      fs.mkdirSync(destDir + '/' + sub);
      continue;
    }
    symlinkOrCopy(source + '/' + sub, destDir + '/' + sub);
  }
}

/**
 * broccoli-compass Constructor.
 * @param inputTree   Any Broccoli tree.
 * @param files       [Optional] An array of sass files to compile.
 * @param options     The compass options.
 * @returns {CompassCompiler}
 */
function CompassCompiler(inputTree, files, options) {
  options = arguments.length > 2 ? (options || {}) : (files || {});
  if (arguments.length > 2) {
    console.log('[broccoli-compass] DEPRECATION: passing files to broccoli-compass constructor as second parameter is deprecated, ' +
                'use options.files instead');
    options.files = files;
  }

  if (!(this instanceof CompassCompiler)) {
    return new CompassCompiler(inputTree, options);
  }

  if (options.exclude) {
    console.log('[broccoli-compass] DEPRECATION: The exclude option has been deprecated in favour of the `cleanOutput` option');
  }

  this.options = merge(true, this.defaultOptions);
  merge(this.options, options);
  options = this.options;
  options.files = (options.files instanceof Array) ? options.files : [];
  this.generateCmdLine();
  this.inputTree = inputTree;
}

CompassCompiler.prototype = Object.create(Writer.prototype);
CompassCompiler.prototype.constructor = CompassCompiler;
CompassCompiler.prototype.compile = compile;
CompassCompiler.prototype.moveToDest = moveToDest;
CompassCompiler.prototype.generateCmdLine = function () {
  var value;
  var filtredOptions = {};
  var options = this.options;
  var cmd = [options.compassCommand, 'compile'];
  var cmdArgs = cmd.concat(this.options.files); // specific files to compile
  // dargs doesn't escape spaces, we filter and escape before using it ;(
  for (var key in options) {
    if (ignoredOptions.indexOf(key) !== -1) { continue; }
    value = options[key];
    if (typeof value === 'string' && value.indexOf(' ') !== -1) {
      filtredOptions[key] = '"' + value + '"';
      continue;
    }
    filtredOptions[key] = value;
  }

  this.cmdLine = cmdArgs.concat( dargs(filtredOptions) ).join(' ');
  return this.cmdLine;
};

CompassCompiler.prototype.read = function (readTree) {
  var cleanOutput = this.options.cleanOutput;
  return readTree(this.inputTree).then(function (srcDir) {
    this.cache = this.walkDir(srcDir, {cache: this.cache, ignore: /^\.sass-cache/});
    if (this.cache.changed.length === 0) {
      return this.lastDestDir;
    }
    if (cleanOutput) {
      quickTemp.makeOrRemake(this, 'tmpDestDir');
    }
    return this.write(srcDir, this.tmpDestDir).then(function (destDir) {
      this.lastDestDir = destDir;
      return destDir;
    }.bind(this));
  }.bind(this));
};

CompassCompiler.prototype.write = function (srcDir, destDir) {
  var options = this.options;
  // Compass compiler generates css files, images and the .sass-cache folder, we could compile in srcDir
  // and issue changed files to dest but it will pollute srcDir, to avoid this, we compile in a mirrored tmp dir
  makeCompileDir(this, srcDir, 'sassCompileDir');
  return this.compile(this.cmdLine, {cwd: this.sassCompileDir})
    .then(this.moveToDest.bind(this, this.sassCompileDir, destDir))
    .then(function(destination) {
      return destination;
    }, function (err) {
      var msg = err.message || err;
      if (options.ignoreErrors === false) {
        throw err;
      } else {
        console.log(msg);
      }
    });
};

// instead of using broccoli-cache-writer we use a builtin function in order to reuse stats
// as we need to check changed files after.
CompassCompiler.prototype.walkDir = walkCachedSync;

/**
 * Default options that are merged onto given options making sure these options
 * are always set.
 */
CompassCompiler.prototype.defaultOptions = {
  // plugin options
  cleanOutput: true,
  ignoreErrors: false,
  compassCommand: 'compass'
};

module.exports = CompassCompiler;
