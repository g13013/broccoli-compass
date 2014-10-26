var compassCompile = require('../index');
var broccoli = require('broccoli');
var fs = require('fs');
var path = require('path');
var rsvp = require('rsvp');
var expect = require('expect.js');
var merge = require('merge');
var rimraf = require('rimraf').sync;
var mkdirp = require('mkdirp').sync;
var copyRecursive = require('symlink-or-copy/node_modules/copy-dereference').sync;

//TODO: add test for files options

describe('broccoli-compass', function() {
  var srcDir = 'tmp/sample';
  var cssDir = 'css';
  var sassDir = 'scss';
  var defaultOptions;

  this.timeout(20000);

  var sampleProject = 'test/fixture/sample';

  beforeEach(function() {
    var stats, file;
    var entries = fs.readdirSync(sampleProject).sort();
    mkdirp(srcDir);
    for (var i = 0; i < entries.length; i++) {
      copyRecursive(sampleProject + '/' + entries[i], srcDir + '/' + entries[i]);
    }
    defaultOptions = {
      cssDir: cssDir,
      sassDir: sassDir,
      imagesDir: 'img'
    };
  });

  afterEach(function() {
    rimraf(srcDir);
  });

  /**
   * Removes the Broccoli temp directory.
   * set cleanup to false to leave tmp dir.
   */
  var cleanup = true;
  before(function() {
    rimraf('tmp');
  });  

  after(function() {
    if(cleanup){
      rimraf('tmp');
    }
  });

  it('should cache the result', function() {
    var tree = compassCompile(srcDir, defaultOptions);
    var compile = tree.compile;
    var calls = 0;
    var builder = new broccoli.Builder(tree);
    tree.compile = function () {
      calls++;
      return compile.apply(this, arguments);
    };
    return builder.build().then(function (r1) {
        return builder.build().then(function (r2) {
          if (r1.directory !== r2.directory || calls !== 1){
            return expect().fail('Should return the same directory');
          }
          fs.writeFileSync(srcDir + '/' + sassDir + '/new.scss', '//comment');
          return builder.build().then(function (r3) {
            if (r1.directory === r3.directory || calls !== 2){
              return expect().fail('Should detect changes and compile again');
            }
          });
        });
      }).catch(function (err) {
        expect().fail(err.message);
      });
  });

  it('should ignore errors when ignoreErrors is set to TRUE', function() {
    var options = merge(defaultOptions, { compassCommand: 'notExistantTool' });
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    builder.build().then(function () {
      expect(1).to.be.ok();
    }, function(err) {
      expect().fail('Should not raise errors');
    });
  });

  it('should raise errors when ignoreErrors is set to FALSE', function() {
    var options = merge(defaultOptions, { compassCommand: 'notExistantTool', ignoreErrors: true });
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    builder.build().then(function () {
      expect().fail('Should raise errors');
    }, function(err) {
      expect(1).to.be.ok();
    });
  });
});
