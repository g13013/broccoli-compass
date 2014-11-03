var totalTime = 0;
var rsvp = require('rsvp');
var CompassCompiler = require('./index');
var broccoli = require('broccoli');
var rimraf = require('rimraf').sync;
var a_slice = Array.prototype.slice;
var tree = CompassCompiler('test/fixture/sample', {
    cssDir: 'css',
    sassDir: 'scss',
    imagesDir: 'img'
  });

rsvp.on('error', function(reason) {
  console.assert(false, reason);
});

rimraf('.sass-cache');
rimraf('tmp');

function reportError(err) {
	console.log(err);
}

function printDiffTime(desc, diff) {
  var time = diff[0] * 1e9 + diff[1];
  var ms =  Math.floor(time / 1e6);
  console.log(desc + ': ' + ms + 'ms');
  totalTime += ms;
}
function traceTime(desc, func) {
  var args = a_slice.call(arguments, 2);
  var start = process.hrtime();
  var result = func.apply(this, args);
  if (result && typeof result.then === 'function') {
    return result.then(function (result) {
      printDiffTime(desc, process.hrtime(start));
      return rsvp.Promise.resolve(result);
    });
  } 
  printDiffTime(desc, process.hrtime(start));
  return result;
}

tree.prepareCompileDir = traceTime.bind(tree, 'Prepare compile dir', tree.prepareCompileDir);
tree.walkDir = traceTime.bind(tree, 'Walk the tree', tree.walkDir);
tree.compile = traceTime.bind(tree, 'Compass compile', tree.compile);
tree.moveToDest = traceTime.bind(tree, 'Move to destination', tree.moveToDest);

new broccoli.Builder(tree).build().then(function(dir) {
	console.log('Total Time: ', totalTime);
	return dir;
}, reportError);
