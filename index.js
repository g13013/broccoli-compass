var path = require('path');
var exec = require('child_process').exec;
var merge = require('merge');
var dargs = require('dargs');
var Writer = require('broccoli-caching-writer');
var rsvp = require('rsvp');
var ignoredOptions = [
      'compassCommand'
    ];

function compile(cmdLine, options) {
  return new rsvp.Promise(function(resolve, reject) {
    exec(cmdLine, options, function(err, stdout, stderr) {
      if (err) {
        reject(err);
      }
      resolve();
    });
  });
}

function CompassCompiler(inputTree, files, options) {
  var op;
  if (arguments.length === 2 && files !== null && typeof files === 'object' && !(files instanceof Array)) {
    options = files;
    files = [];
  }

  if (!(this instanceof CompassCompiler)){
    return new CompassCompiler(inputTree, files, options);
  }
  this.inputTree = inputTree;
  this.files = [].concat(files || []);
  merge(this.options, options);
}

CompassCompiler.prototype = Object.create(Writer.prototype);
CompassCompiler.prototype.constructor = CompassCompiler;
CompassCompiler.prototype.updateCache = function (srcDir, destDir) {
  var cmdLine;
  var options = merge(true, this.options);
  var cmd = [options.compassCommand, 'compile'];
  var cmdArgs = cmd.concat(this.files); //src is project dir or specifed files
  var cssDir = path.join(destDir, options.cssDir || '');

  //make cssDir relative to SRC
  cssDir = path.relative(srcDir, cssDir);
  options.cssDir = '"'+ cssDir + '"';
  cmdLine = cmdArgs.concat( dargs(options, ignoredOptions) ).join(' ');

  return compile(cmdLine, {cwd: srcDir}).then(function () {
    return destDir;
  }, function (err) {
    msg = err.message || err;
    console.log('[broccoli-compass] Error: ', msg + '\narguments: `' + cmdLine + '`');
  });
};

CompassCompiler.prototype.options = {
  relativeAssets: true,
  sassDir: '.',
  compassCommand: 'compass'
};

module.exports = CompassCompiler;
