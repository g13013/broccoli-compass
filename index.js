var path = require('path');
var exec = require('child_process').exec;
var Writer = require('broccoli-writer');
var rsvp = require('rsvp');

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
CompassCompiler.prototype.write = function (readTree, destDir) {
  var self = this;
  return readTree(this.inputTree).then(function (srcDir) {
    var cmdLine;
    var options = merge({}, self.options);
    var cmdArgs = [options.compassCommand, 'compile', self.files]; //src is project dir or specifed files
    var cssDir = path.join(destDir, options.cssDir || '');

    delete options.compassCommand;

    //make cssDir relative to SRC
    cssDir = path.relative(srcDir, cssDir);
    options.cssDir = '"'+ cssDir + '"';

    cmdArgs = cmdArgs.concat( generateArgs(options) );
    cmdLine = cmdArgs.join(' ');
    return compile(cmdLine, {cwd: srcDir}).then(function () {
      return destDir;
    }, function (err) {
      console.log('[broccoli-compass] Error: ', err.message + '. The command-line arguments was: `' + cmdLine + '`');
    });
  });
};

CompassCompiler.prototype.options = {
  relativeAssets: true,
  sassDir: '.',
  compassCommand: 'compass'
};

function merge(obj1, obj2) {
  var key;
  obj1 = obj1 || {};
  obj2 = obj2 || {};
  for (key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      obj1[key] = obj2[key];
    }
  }
  return obj1;
}

function generateArgs(options) {//generate command line options in format that compass understands
  var op, option, value,
      args = [];
  for (op in options) {
    if (options.hasOwnProperty(op)) {
      value = options[op];
      if (value === false || value === null) {
        continue;
      }
      option = '--' + op.replace(/([A-Z])/, '-$1').toLowerCase();
      if (value === true) {
        value = '';
      } else {
        value = ' ' + value;
      }
      args.push(option + value);
    }
  }
  return args;
}
module.exports = CompassCompiler;
