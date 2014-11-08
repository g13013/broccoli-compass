
# broccoli-compass [![Build Status](https://travis-ci.org/g13013/broccoli-compass.svg?branch=master)](https://travis-ci.org/g13013/broccoli-compass) [![Code Climate](https://codeclimate.com/github/g13013/broccoli-compass/badges/gpa.svg)](https://codeclimate.com/github/g13013/broccoli-compass)

Compiles compass project using [compass](https://github.com/chriseppstein/compass), so you need to have compass installed on your machine.

## Installation

```bash
npm install --save-dev broccoli-compass
```

## Tests

```bash
npm install
npm test
```

## Usage

Note: The API might change in subsequent 0.x versions.

```js
var compileSass = require('broccoli-compass');
var compassTree = compileSass(tree, files, {
    outputStyle: 'expanded'
  });
```
if `files` is omitted the entire folder will be compiled.

##### Plugin Options

* **compassCommand**: Command to execute compass. Default to `compass`.
* **ignoreErrors**: If set to `true`, Broccoli will only print the error instead of raising an exception. Default to `false`
* **cleanOutput** (slower): if `true`, css files will be processed to extract the list of images and fonts to be copied, instead the destination folder will contain all files. Default to `false`
* **exclude** [DEPRECATED]: deprecated in favor of `cleanOutput` option.

##### Compass Options

Please refer to the [compass configuration](http://compass-style.org/help/documentation/configuration-reference/) for more details about the available options


## Credits
* [Aboubakr Gasmi](https://github.com/g13013)
* All the contributors.

##License
[MIT](https://github.com/g13013/broccoli-compass/blob/master/LICENSE.md)
