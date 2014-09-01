var path = require('path');
var exec = require('child_process').exec;
var merge = require('merge');
var dargs = require('dargs');
var Writer = require('broccoli-caching-writer');
var rsvp = require('rsvp');
var fse = require('fs-extra');
var expand = require('glob-expand');

var ignoredOptions = [
      'compassCommand',
      'ignoreErrors',
      'exclude',
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
        err.message = "[broccoli-compass] failed while executing compass command line\n" +
                      "[broccoli-compass] Working directory:\n" + options.cwd + "\n" +
                      "[broccoli-compass] Executed:\n" + cmdLine + "\n" +
                      "[broccoli-compass] stdout:\n" + stdout + "\n" +
                      "[broccoli-compass] stderr:\n" + stderr + "\n";
        reject(err);
      }
      resolve();
    });
  });
}

/**
 * Copies all files except for the sass(-cache) files. Basically that is everything
 * that can be deployed further.
 * @param srcDir  The source directory where compass ran.
 * @param destDir The Broccoli destination directory
 * @param options The options used to call broccoli-compass.
 * @returns Promise[] A collection promises for each directory or file that has to be copied.
 */
function copyRelevant(srcDir, destDir, options) {
  var result;
  var copyPromises = [];

  result = expand({ cwd: srcDir, dot:true, filter: 'isFile'}, ['**/*'].concat(options.exclude));
  for(var i = 0; i < result.length; i++) {
    copyPromises.push(
      copyDir(
        path.join(srcDir, result[i]),
        path.join(destDir, result[i])));
  }
  return rsvp.all(copyPromises);
}

/**
 * A promise to copy a directory or file.
 * @param srcDir  The source directory to copy.
 * @param destDir The destination to copy the srcDir contents to.
 */
function copyDir(srcDir, destDir) {
  return new rsvp.Promise(function(resolve, reject) {
    fse.copy( srcDir, destDir,
      function(err) {
        if (err) {
          return reject(err);
        }

        resolve();
      }
    );
  });
}

/**
 * @param srcDir  The source directory where compass ran.
 * @param options The options used to call broccoli-compass.
 */
function cleanupSource(srcDir, options) {
  return new rsvp.Promise(function(resolve, reject) {
    var result = expand({ cwd: srcDir }, '**/*.css');
    if(options.cssDir) {
      var cssDir = options.cssDir;
      if(cssDir && cssDir !== '.') {
        result.push(cssDir);
      }
    }

    var resLength = result.length;
    for(var i = 0; i < resLength; i++) {
      // a async delete does not delete the hidden .sass-cache dir
      fse.removeSync(path.join(srcDir, result[i]));
    }
    resolve();
  });
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
    console.log('DEPRECATION: passing files to broccoli-compass constructor as second parameter is deprecated, ' +
                'use options.files instead');
    options.files = files;
  }

  if (!(this instanceof CompassCompiler)) {
    return new CompassCompiler(inputTree, options);
  }

  var sassDir = options.sassDir;
  var cssDir = options.cssDir;
  var exclude = ['!.sass-cache/**'];

  this.inputTree = inputTree;
  this.options = merge(true, this.defaultOptions);
  merge(this.options, options);

  //if sassDir is the same as srcDir or cssDir we just exclude scss/sass files. Otherwise all the sassDir
  if (sassDir === '.' || sassDir === cssDir) {
    exclude.push('!**/*.{scss,sass}');
  } else {
    exclude.push('!' + sassDir + '/**');
  }

  if (Array.isArray(options.exclude)) {
    this.options.exclude = options.exclude.map(function (pattern) {
      return '!' + pattern;
    }).concat(exclude);
  } else {
    this.options.exclude = exclude;
  }

  this.generateCmdLine();
}

CompassCompiler.prototype = Object.create(Writer.prototype);
CompassCompiler.prototype.constructor = CompassCompiler;
CompassCompiler.prototype.generateCmdLine = function () {
  var cmd = [this.options.compassCommand, 'compile'];
  var cmdArgs = cmd.concat(this.options.files); // specefic files to compile
  this.cmdLine = cmdArgs.concat( dargs(this.options, ignoredOptions) ).join(' ');
};
CompassCompiler.prototype.updateCache = function (srcDir, destDir) {
  var self = this;
  var options = this.options;

  return compile(this.cmdLine, {cwd: srcDir})
    .then(function() {
      return copyRelevant(srcDir, destDir, self.options);
    })
    .then(function() {
      return cleanupSource(srcDir, options);
    })
    .then(function() {
      return destDir;
    }, function (err) {
      msg = err.message || err;
      if (options.ignoreErrors === false) {
        throw err;
      } else {
        console.log(msg);
      }
    });
};

/**
 * Default options that are merged onto given options making sure these options
 * are always set.
 */
CompassCompiler.prototype.defaultOptions = {
  // plugin options
  ignoreErrors: false,
  compassCommand: 'compass'
};

module.exports = CompassCompiler;
