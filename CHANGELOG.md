### 0.2.1
* Fix travis complain about missing `mocha` module.

### 0.2.0
* Now all broccoli-compass instances and subsequent builds share the same .sass-cache located in `tmp/.sass-cache`
* Fixed `EMFILE` errors, see [PR](https://github.com/g13013/broccoli-compass/issues/22), now all operations are synchronious.
* Updated Tests.
* Updated README.md file.
* Added benchmarks to measure every step of the build. 
* Complete refactor to enhance build speed.
* Use `symlink-or-copy` that tries to symlink to avoid copying.
* Deprecate the `exclude` option in favor of the `cleanOutput` option.
* Added `cleanOutput` option to issue only compiled css and their linked images and fonts.
* Dropping usage of `broccoli-caching-writer`, now using `broccoli-writer` with an internal reusable cache.
* Dropping usage of `fs-extra`.
* Dropping usage of `grunt`, to run test, now we use `npm test`.
* Dropping usage of `glob-expand`.
* Dropping usage of `chai` in favor of `expect.js`.

### 0.1.2
* Fixed compass configuration documentation link in README.md
* Make sure that the CachingWriter constructor is called and add filterFromCache to the ignoredOptions
* Fixed variable use
* Fixed exec function not returning after reject

### 0.1.1
* Added .jshintrc file.
* Updated `broccoli-caching-writer` to `0.4.2` that fixes an important bug, see [PR](https://github.com/rwjblue/broccoli-caching-writer/pull/7).

### 0.1.0
* The compass command line is now generated only one time on construct and is available via `cmdLine` property.
* Added "exclude" option.
* Update `broccoli-caching-writer` to version `~0.4.0`.
* Add more details to reported compass errors.
* [DEPRECATION] escaping cssDir spaces when generating compass command line (need more general escaping fo all values)
* [DEPRECATION] deprecate passing files to compile as second parameter, now it's part of options object.
* [BUG] Fixed a bug preventing css files from being copied when cssDir is the same as sassDir.

### 0.0.9
* Include dot files when moving files to dest directory.
* Fixed a regression on tests.

### 0.0.8
* Added tests
* Fixed the issue with relative paths pointing to tmp directories, see [issue](https://github.com/g13013/broccoli-compass/issues/7)
* Added ignoreErrors option

### 0.0.7
* Use `dargs` module in place of builtin generateArgs function
* Use `merge` module in place of builtin merge function

### 0.0.6
* Added CHANGELOG.md file
* Use `broccoli-caching-writer` in place of `broccoli-writer` to improve performance

### 0.0.5
* Better error reporting
* Added support for compass multiple values options (example: multiple import-path)

### 0.0.4
* [Bugfix] A bug relative to command line generation, see [commit](https://github.com/g13013/broccoli-compass/commit/80908a012943c95d76431d19bad688163c2bf27a).
* Add ability to specify an alternative compass command
