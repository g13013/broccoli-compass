var compassCompile = require('../index');
var broccoli = require('broccoli');
var fs = require('fs');
var path = require('path');
var rsvp = require('rsvp');
var expect = require('expect.js');
var merge = require('merge');
var rimraf = require('rimraf').sync;
var mkdirp = require('mkdirp').sync;
var symlinkOrCopy = require('symlink-or-copy').sync;

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
      symlinkOrCopy(sampleProject + '/' + entries[i], srcDir + '/' + entries[i]);
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
