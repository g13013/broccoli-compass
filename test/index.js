var compassCompile = require('../index');
var broccoli = require('broccoli');
var fs = require('fs');
var path = require('path');
var rsvp = require('rsvp');
var expect = require('expect.js');
var merge = require('merge');
var rimraf = require('rimraf').sync;
var mkdirp = require('mkdirp').sync;
var walkTree = require('../lib/walk_cached_sync');
var symlinkOrCopy = require('symlink-or-copy').sync;

//TODO: add test for files options

describe('broccoli-compass', function() {
  var srcDir = 'tmp/sample';
  var cssDir = 'css';
  var sassDir = 'scss';
  var defaultOptions;

  this.timeout(20000);

  var sampleProject = 'test/fixture/sample';
  var sampleFiles = walkTree(sampleProject).paths;

  beforeEach(function() {
    var file;
    mkdirp(srcDir);
    for (file in sampleFiles) {
      if (sampleFiles[file].isDirectory) {
        fs.mkdirSync(srcDir + '/' + file);
        continue;
      }
      symlinkOrCopy(sampleProject + '/' + file, srcDir + '/' + file);
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
  var cleanup = process.env.CLEANUP ? process.env.CLEANUP === 'true' : true;
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

  it('cleanOutput ON', function() {
    defaultOptions.cleanOutput = true;
    var tree = compassCompile(srcDir, defaultOptions);
    var builder = new broccoli.Builder(tree);
    var expectedFiles = [
      'fonts',
      'fonts/MyFont.ttf',
      'fonts/MyFont.otf',
      'fonts/MyFont.svg',
      'fonts/MyFont.woff',
      'fonts/MyFont.eot',
      'css',
      'css/file1.css',
      'css/sub',
      'css/sub/subfile.css',
      'img',
      'img/icons-sa10faadd8f.png',
      'img/arrow_right_grey.png'
    ];
    return builder.build().then(function (r) {
        if (r.directory !== tree.tmpDestDir) {
          expect().fail('destDir should be tmpDestDir, got \n\t' + r + '\n\n instead of\n\t' + tree.tmpDestDir);
        }
        files = walkTree(r.directory);
        expect(files.paths).to.only.have.keys(expectedFiles);
      }).catch(function (err) {
        expect().fail(err);
      });
  });

  //test makeCompileDir function ?
  it('cleanOutput OFF', function() {
    defaultOptions.cleanOutput = false;
    var tree = compassCompile(srcDir, defaultOptions);
    var builder = new broccoli.Builder(tree);
    return builder.build().then(function (r) {
        if (r.directory !== tree.sassCompileDir) {
          expect().fail('destDir should be sassCompileDir, got \n\t' + r.directory + '\n\n instead of\n\t' + tree.sassCompileDir);
        }
      }).catch(function (err) {
        expect().fail(err);
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
