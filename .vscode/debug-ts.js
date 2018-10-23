'use strict';
const meow = require('meow');
const path = require('path');

const tsFile = getTSFile();
const jsFile = TS2JS(tsFile);

replaceCLIArg(tsFile, jsFile);

// Ava debugger
require('ava/profile');

/**
 * get ts file path from CLI args
 *
 * @return string path
 */
function getTSFile() {
  const cli = meow();
  return cli.input[0];
}

/**
 * get associated compiled js file path
 *
 * @param tsFile  path
 * @return string path
 */
function TS2JS(tsFile) {
  const srcFolder = path.join(__dirname, '..', 'src');
  const distFolder = path.join(__dirname, '..', 'build', 'main');

  const tsPathObj = path.parse(tsFile);

  return path.format({
    dir: tsPathObj.dir.replace(srcFolder, distFolder),
    ext: '.js',
    name: tsPathObj.name,
    root: tsPathObj.root
  });
}

/**
 * replace a value in CLI args
 *
 * @param search  value to search
 * @param replace  value to replace
 * @return void
 */
function replaceCLIArg(search, replace) {
  process.argv[process.argv.indexOf(search)] = replace;
}