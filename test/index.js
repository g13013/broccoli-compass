var compassCompile = require('../index');
var broccoli = require('broccoli');
var fse = require('fs-extra');
var path = require('path');
var rsvp = require('rsvp');
var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;
var merge = require('merge');

//TODO: add test for files options

describe('broccoli-compass', function() {
  var cssDir = 'css';
  var sassDir = 'scss';
  var defaultOptions = {
    cssDir: cssDir,
    sassDir: sassDir,
    imagesDir: 'img'
  };

  this.timeout(20000);

  var srcDir = __dirname + '/fixture/testSrcDir';
  var destDir = ('/');

  beforeEach(function() {
    fse.ensureDirSync(destDir);
  });

  /**
   * Removes the Broccoli temp directory.
   * set cleanup to false to leave tmp dir.
   */
  var cleanup = true;
  after(function() {
    if(cleanup){
      var broccoliTempPath = path.normalize(path.join(__dirname, '../tmp'));
      fse.removeSync(broccoliTempPath, function(err) {
        expect(err, err.message).to.equal(null);
      });
    }
  });

  it('should contain all style relevant src tree files', function() {
    var tree = compassCompile(srcDir, defaultOptions);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var cssFile = path.join(cssDir, 'test.css');

      assertCssFilesExist(path.join(dir.directory, cssDir));

      var srcCssFile = path.join(dir.graph.tree.inputTree, cssFile);
      expect(fse.existsSync(srcCssFile), 'Source CssFile').to.equal(false);

      var fontsDir = path.join(dir.directory, 'fonts');
      expect(
        fse.existsSync(path.join(fontsDir, 'stub.ttf')),
        'Fonts directory'
      ).to.equal(true);

      var imgDir = path.join(dir.directory, 'img');
      expect(
        fse.existsSync(path.join(imgDir, 'stub.png')),
        'Images directory'
      ).to.equal(true);
    });
  });


  it('should exclude files defined by options.exclude', function() {
    var options = Object.create(defaultOptions);
    options.exclude = ['fonts/**'];
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var fontsDir = path.join(dir.directory, 'fonts');
      expect(
        fse.existsSync(fontsDir),
        'Fonts directory'
      ).to.equal(false);
    });
  });

  it('should not have sass related content in the destination directory', function(done){
    var tree = compassCompile(srcDir, defaultOptions);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var cacheDir = path.join(dir.directory, '.sass-cache');
      expect(fse.existsSync(cacheDir), 'Sass cache directory').to.equal(false);
      var sassDir = path.join(dir.directory, 'scss');
      expect(fse.existsSync(sassDir), 'Sass source file directory').to.equal(false);
      done();
    }).then(null, done);
  });

  it('should delete default sass directory when none given', function(done){
    var orgSassdir = path.join(srcDir, 'scss');
    var defaultSassdir = path.join(srcDir, 'sass');
    return renameDir(orgSassdir, defaultSassdir)
      .then(function() {
        var options = {
          cssDir: cssDir,
          imagesDir: 'img'
        };

        var tree = compassCompile(srcDir, options);
        var builder = new broccoli.Builder(tree);

        return builder.build();
      }).then(function(dir) {
        var sassDir = path.join(dir.directory, 'sass');
        expect(
          fse.existsSync(sassDir),
          'Sass source file directory')
          .to.equal(false);
        expect(
          fse.existsSync(sassDir),
          'Sass source file directory')
          .to.equal(false);
        done();
      }).then(function() {
        renameDir(defaultSassdir, orgSassdir);
      }, function () {
        renameDir(defaultSassdir, orgSassdir);
        done();
      });
  });

  it('should not have generated css content in the source directory', function() {
    var tree = compassCompile(srcDir, defaultOptions);
    var builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir) {
      assertCssFilesExist(path.join(dir.directory, cssDir), false);
    });
  });

  it('should remove only the css files from source when css dir is root', function() {
    var options = merge(defaultOptions, { cssDir: '.' });
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    builder.build().then(function(dir) {
      assertCssFilesExist(dir.directory);
      // just check a single dir if its still there
      expect(fse.existsSync(path.join(dir.directory, 'img')), 'source images dir').to.equal(true);
    });
  });

  it('should ignore errors when ignoreErrors is set to TRUE', function() {
    var options = merge(defaultOptions, { cssDir: '.', compassCommand: 'notExistantTool' });
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    builder.build().then(function () {
      assert.notOk(true, 'Should not raise errors');
    }, function(err) {
      assert.ok(err, 'Should not raise errors');
    });
  });

  it('should raise errors when ignoreErrors is set to FALSE', function() {
    var options = merge(defaultOptions, { cssDir: '.', compassCommand: 'notExistantTool', ignoreErrors: true });
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    builder.build().then(function () {
      assert.ok(true, 'Should raise errors');
    }, function(err) {
      assert.notOk(err, 'Should raise errors');
    });
  });

  function assertCssFilesExist(dir, exist) {
    exist = exist || true;

    var destCssFile = path.join(dir, 'test.css');
    expect(fse.existsSync(destCssFile), 'Destination CssFile 1').to.equal(exist);

    var destCssFile2 = path.join(dir, 'test2.css');
    expect(fse.existsSync(destCssFile2), 'Destination CssFile 2').to.equal(exist);
  }

  function renameDir(from, to) {
    return new rsvp.Promise(function(resolve, reject) {
      fse.rename(from, to, function(err) {
        if(err) {
          console.log('error: ' + err);
          reject(err);
        }
        resolve();
      });
    });
  }
});
