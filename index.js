var path = require('path');
var exec = require('child_process').exec;
var Writer = require('broccoli-caching-writer');
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
CompassCompiler.prototype.updateCache = function (srcDir, destDir) {
  var cmdLine;
  var options = merge({}, this.options);
  var cmd = [options.compassCommand, 'compile'];
  var cmdArgs = cmd.concat(this.files); //src is project dir or specifed files
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
    msg = err.message || err;
    console.log('[broccoli-compass] Error: ', msg + '\narguments: `' + cmdLine + '`');
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

//TODO export this fonction from a module and integrate tests
function generateArgs(options) {//generate command line options in a format that compass understands
  var i, op, option, value;
  var option = '';
  var args = [];
  for (op in options) {
    if (options.hasOwnProperty(op)) {
      value = options[op];

      if (value === false || value === null) {
        continue;
      }

      op = '--' + op.replace(/([A-Z])/g, '-$1').toLowerCase();
      if (value === true) {
         args.push(op);
         continue;
      }

      if (value instanceof Array) {
        //multiple value `--option value1 --option value2`
        for (i = 0; i < value.length; i++) {
          option = option + ' ' + op + ' ' + value[i];
        }
      } else {
        //single value `--option value`
        option = op + ' ' + value;
      }

      args.push(option.trim());
    }
  }
  return args;
}

module.exports = CompassCompiler;
