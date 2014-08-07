
# broccoli-compass [![Build Status](https://travis-ci.org/g13013/broccoli-compass.svg?branch=refactor)](https://travis-ci.org/g13013/broccoli-compass)

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
    outputStyle: 'expanded' //include here compass options. Note: some options might be ignored as they are automatically filled
  });

```
if `files` is omitted the entire folder will be compiled.

##### Plugin Options

* **compassCommand**: Command to execute compass. default to `compass`

##### Compass Options

Please refer to the [compass configuration](http://compass-style.org/help/tutorials/configuration-reference/) for more details about the available options


## Credits
* [Aboubakr Gasmi](https://github.com/g13013)
* [Ferry de Boer](https://github.com/ferrydeboer) for his big contribution and for providing tests.
* All the contributors.

##License
[MIT](https://github.com/g13013/broccoli-compass/blob/master/LICENSE.md)
