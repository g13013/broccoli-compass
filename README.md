
# broccoli-compass

Compiles compass project using [compass](https://github.com/chriseppstein/compass), so you need to have compass installed on your machine.

## Installation

```bash
npm install --save-dev broccoli-compass
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

### Options

#### `compassCommand`

Command to execute compass.

**Default:** `compass`


Please refere to the [compass configuration](http://compass-style.org/help/tutorials/configuration-reference/) for more details about the available options


##License
[MIT](https://github.com/g13013/broccoli-compass/blob/master/LICENSE.md)
