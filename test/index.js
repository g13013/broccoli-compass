var compassCompile = require('../index');
var broccoli = require('broccoli');
var fse = require('fs-extra');
var path = require('path');
var rsvp = require('rsvp');
var expect = require('chai').expect;

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

  afterEach(function() {
    fse.remove(destDir, function(err) {
      expect(err).to.be.null;
    });
  });

  after(function(){
    console.log('dirname: ' + __dirname);
  });

  function renameDir(from, to){
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

  it('should contain all style relevant src tree files', function(){
    var tree = compassCompile(srcDir, 'scss/test.scss', defaultOptions);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var cssFile = path.join(cssDir, 'test.css');

      var destCssFile = path.join(dir.directory, cssFile);
      expect(fse.existsSync(destCssFile), 'Destination CssFile').to.be.true;
      //fse.existsSync(destCssFile).should.equal(true);

      var srcCssFile = path.join(dir.graph.tree.inputTree, cssFile);
      expect(fse.existsSync(srcCssFile), 'Source CssFile').to.be.false;
      //fse.existsSync(destCssFile).should.equal(false);

      const fontsDir = path.join(dir.directory, 'fonts');
      expect(
        fse.existsSync(path.join(fontsDir, 'stub.ttf')),
        'Fonts directory'
      ).to.be.true;

      const imgDir = path.join(dir.directory, 'img');
      expect(
        fse.existsSync(path.join(imgDir, 'stub.png')),
        'Images directory'
      ).to.be.true;
    }).then(null, function(err) {
      expect(err).to.be.null;
    });
  });

  it('should not have sass related content in the destination directory', function(){
    var tree = compassCompile(srcDir, defaultOptions);

    var builder = new broccoli.Builder(tree);
    return builder.build().then(function(dir) {
      var cacheDir = path.join(dir.directory, '.sass-cache');
      expect(fse.existsSync(cacheDir), 'Sass cache directory').to.be.false;
      var sassDir = path.join(dir.directory, 'scss');
      expect(fse.existsSync(sassDir), 'Sass source file directory').to.be.false;
    }).then(null, function(err) {
      expect(err).to.be.null;
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
        .to.be.false;
      expect(
        fse.existsSync(sassDir),
        'Sass source file directory')
      .to.be.false;
    }).then(function() {
      return renameDir(defaultSassdir, orgSassdir);
    }).then(
      null,
      function(err) { // finally
        renameDir(defaultSassdir, orgSassdir);
        expect(err).to.be.null;
      });
  });

});
