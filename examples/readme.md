# Usage Examples

This directory (`/examples`) can be deleted when forking this project. It contains some simple examples of how forks of `typescript-starter` can be used by other projects. (Usually you'll want to provide these instructions in your root `readme.md`.)

## Node (Vanilla)

This shows the simplest use case – a quick, hacked-together Node.js project with no type safety, and no pre-processing. This is the way most of the Node.js ecosystem currently expects to import a node modules.

```bash
cd examples/node-vanilla

# install and run the example
npm install
npm run
```

## Node (Typescript)

This is for larger and more established Node.js projects which use Typescript for type safety. You'll notice that the type declarations and inline documentation from `typescript-starter` are accessible to [Typescript-compatible editors](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) like [vscode](https://code.visualstudio.com/).

```bash
cd examples/node-typescript

 # install the dependencies
npm install
# type-check and build the example
npm run build
# run the example
npm start
```

## Browser (tree-shaking with Rollup)

This project imports the `power` and `asyncABC` functions from the ES6 output of `typescript-starter`, without importing the `double` function. This allows for the `double` method to be completely excluded from output via [Rollup's tree-shaking](http://rollupjs.org/), making the final javascript bundle potentially much smaller, even before using a minifier like [Uglify](https://github.com/mishoo/UglifyJS2).

To demonstrate, this example doesn't minify or remove comments. You can see where some javascript has been excluded from the bundle.

```bash
cd examples/browser

# install the dependencies
npm install
# build the javascript bundle
npm run build
# start a server and open the test in a browser
npm start
```
