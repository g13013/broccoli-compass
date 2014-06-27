var compassCompile = require('../index');
var broccoli = require('broccoli');
var fse = require('fs-extra');
var path = require('path');
var rsvp = require('rsvp');
var expect = require('chai').expect;
var merge = require('merge');

describe('broccoli-compass', function() {
  const cssDir = 'css';
  const sassDir = 'scss';
  var defaultOptions = {
    cssDir: cssDir,
    sassDir: sassDir,
    imagesDir: 'img'
  };

  var srcDir = __dirname + '/fixture/testSrcDir';
  var destDir = path.join('test', 'tmp');

  beforeEach(function() {
    fse.ensureDirSync(destDir);
  });

/*
  afterEach(function() {
    fse.remove(destDir, function(err) {
      expect(err).to.equal(null);
    });
  });


  afterEach(function(){
    console.log('delete: ' + path.normalize(path.join(__dirname, '../tmp \n')));
  });
*/

  it('should contain all style relevant src tree files', function(){
    var tree = compassCompile(srcDir, defaultOptions);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var cssFile = path.join(cssDir, 'test.css');

      assertCssFilesExist(path.join(dir.directory, cssDir));

      var srcCssFile = path.join(dir.graph.tree.inputTree, cssFile);
      expect(fse.existsSync(srcCssFile), 'Source CssFile').to.equal(false);

      const fontsDir = path.join(dir.directory, 'fonts');
      expect(
        fse.existsSync(path.join(fontsDir, 'stub.ttf')),
        'Fonts directory'
      ).to.equal(true);

      const imgDir = path.join(dir.directory, 'img');
      expect(
        fse.existsSync(path.join(imgDir, 'stub.png')),
        'Images directory'
      ).to.equal(true);
    });
  });

  it('should not have sass related content in the destination directory', function(){
    var tree = compassCompile(srcDir, defaultOptions);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var cacheDir = path.join(dir.directory, '.sass-cache');
      expect(fse.existsSync(cacheDir), 'Sass cache directory').to.equal(false);
      var sassDir = path.join(dir.directory, 'scss');
      expect(fse.existsSync(sassDir), 'Sass source file directory').to.equal(false);
    }).then(null, function(err) {
      expect(err).to.equal(null);
    });
  });

  it('should delete default sass directory when none given', function(){
    var orgSassdir = path.join(srcDir, 'scss');
    var defaultSassdir = path.join(srcDir, 'sass');
    return renameDir(orgSassdir, defaultSassdir)
      .then(function(){
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
      }).then(function() {
        return renameDir(defaultSassdir, orgSassdir);
      }).then(
      null,
      function(err) { // finally
        renameDir(defaultSassdir, orgSassdir);
        expect(err).to.equal(null);
      });
  });

  it('should not have generated css content in the source directory', function(){
    var tree = compassCompile(srcDir, defaultOptions);
    var builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir){
      assertCssFilesExist(path.join(dir.directory, cssDir), false);
    });
  });

  it('should remove only the css files from source when css dir is root', function(){
    var options = merge(defaultOptions, { cssDir: '.' });
    JSON.stringify(options);
    var tree = compassCompile(srcDir, options);

    var builder = new broccoli.Builder(tree);
    builder.build().then(function(dir) {
      assertCssFilesExist(dir.directory);
      // just check a single dir if its still there
      expect(fse.existsSync(path.join(dir.directory, 'img')), 'source images dir').to.equal(true);
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
    return new rsvp.Promise(function(resolve, reject){
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
