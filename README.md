[![Build Status](https://travis-ci.org/bitjson/typescript-starter.svg?branch=master)](https://travis-ci.org/bitjson/typescript-starter)
[![Codecov](https://img.shields.io/codecov/c/github/bitjson/typescript-starter.svg)](https://codecov.io/gh/bitjson/typescript-starter)
[![NPM version](https://img.shields.io/npm/v/typescript-starter.svg)](https://www.npmjs.com/package/typescript-starter)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![dependencies Status](https://david-dm.org/bitjson/typescript-starter/status.svg)](https://david-dm.org/bitjson/typescript-starter)
[![devDependencies Status](https://david-dm.org/bitjson/typescript-starter/dev-status.svg)](https://david-dm.org/bitjson/typescript-starter?type=dev)

# typescript-starter
A typescript starter for building javascript libraries and projects:

* Write **standard, future javascript** – with stable es7 features – today ([stage 3](https://github.com/tc39/proposals) or [finished](https://github.com/tc39/proposals/blob/master/finished-proposals.md) features)
* [Optionally use typescript](https://basarat.gitbooks.io/typescript/content/docs/why-typescript.html) to improve tooling, linting, and documentation generation
* Export as a [javascript module](http://jsmodules.io/), making your work **fully tree-shakable** for consumers using [es6 imports](https://github.com/rollup/rollup/wiki/pkg.module) (like [Rollup](http://rollupjs.org/) or [Webpack 2](https://webpack.js.org/))
* Export Typescript type declarations to improve your downstream development experience
* Backwards compatibility for Node.js-style (CommonJS) imports
* Both [strict](config/tsconfig.strict.json) and [flexible](config/tsconfig.flexible.json) Typescript configurations available

So we can have nice things:
* Generate API documentation (HTML or JSON) [without a mess of JSDoc tags](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) to maintain
* Collocated, atomic, concurrent unit tests with [AVA](https://github.com/avajs/ava)
* Source-mapped code coverage reports with [nyc](https://github.com/istanbuljs/nyc)
* Configurable code coverage testing (for continuous integration)

## Get started

Before you start, consider configuring or switching to an [editor with good typescript support](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) like [vscode](https://code.visualstudio.com/).

To see how this starter can be used, check out the [`examples`](./examples) folder.

## Development zen


This starter includes watch tasks which make development faster and more interactive. They're particularly helpful for [TDD](https://en.wikipedia.org/wiki/Test-driven_development)/[BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) workflows.

To start working, run:

```
$ yarn watch:build
```

which will build and watch the entire project for changes (to both the library source files and test source files). In another tab or terminal window, run:

```
$ yarn watch:test
```

As you develop, you can add tests for new functionality – which will initially fail – before developing the new functionality. Each time you save, any changes will be rebuilt and retested.

Since only changed files are rebuilt and retested, this workflow remains fast even for large projects.

## Enable stronger type checking (recommended)

To make getting started easier, the default `tsconfig.json` is using the `config/tsconfig.flexible` configuration. This will allow you to get started without many warning from Typescript.

To enable additional Typescript type checking features (a good idea for mission-critical or large projects), change the `extends` value in `tsconfig.json` to `./config/tsconfig.strict`.

## View test coverage

To generate and view test coverage, run:
```bash
$ yarn cov
```

This will create an HTML report of test coverage – source-mapped back to Typescript – and open it in your default browser.

## Generate your API docs

The src folder is analyzed and documentation is automatically generated using [typedoc](https://github.com/TypeStrong/typedoc).

```bash
$ yarn docs
```
This command generates API documentation for your library in HTML format.

Since types are tracked by Typescript, there's no need to indicate types in JSDoc format. For more information, see the [typedoc documentation](http://typedoc.org/guides/doccomments/).

For more advanced documentation generation, you can provide your own [typedoc theme](http://typedoc.org/guides/themes/), or [build your own documentation](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) using the JSON typedoc export:

```bash
$ yarn docs:json
```

## Generate/update changelog & release

This project is tooled for [Conventional Changelog](https://github.com/conventional-changelog/conventional-changelog) to make managing releases easier. See the [standard-version](https://github.com/conventional-changelog/standard-version) documentation for more information on the workflow.

```bash
# bump package.json version, update CHANGELOG.md, git tag the release
$ yarn release
# Release without bumping package.json version
$ yarn release -- --first-release
# PGP sign the release
$ yarn release -- --sign
```

## All package scripts

You can run the `info` script for information on each available package script.

```
$ yarn run info

info:
  Display information about the scripts
build:
  (Trash and re)build the library
lint:
  Lint all typescript source files
unit:
  Run unit tests
test:
  Lint and test the library
watch:build:
  Watch source files, rebuild library on changes
watch:unit:
  Watch the build, rerun relevant tests on changes
cov:
  Run tests, generate the HTML coverage report, and open it in a browser
html-coverage:
  Output HTML test coverage report
send-coverage:
  Output lcov test coverage report and send it to codecov
docs:
  Generate API documentation and open it in a browser
docs:json:
  Generate API documentation in typedoc JSON format
release:
  Bump package.json version, update CHANGELOG.md, tag a release
```
## Notes

### Browser libraries

This starter currently does **not** run tests in a browser ([AVA](https://github.com/avajs/ava) tests in Node exclusively). While the current testing system will be sufficient for most use cases, some projects will (also) need to implement a browser-based testing system like [karma-ava](https://github.com/avajs/karma-ava). (Pull requests welcome!)

### Dependency on `tslib`

By default, this project requires [tslib](https://github.com/Microsoft/tslib) as a dependency. This is the recommended way to use Typescript's es6 &amp; es7 transpiling for sizable projects, but you can remove this dependency by removing the `importHelpers` compiler option in `tsconfig.json`. Depending on your usage, this may increase the size of your library significantly, as the Typescript compiler will inject it's helper functions directly into every file which uses them. (See also: [`noEmitHelpers` &rarr;](https://www.typescriptlang.org/docs/handbook/compiler-options.html))

### Targeting older environments

By default, this library targets environments with native (or already-polyfilled) support for es6 features. If your library needs to target Internet Explorer, outdated Android browsers, or versions of Node older than v4, you may need to change the `target` in `tsconfig.json` to `es5` (rather than `es6`) and bring in a Promise polyfill (such as [es6-promise](https://github.com/stefanpenner/es6-promise)).

It's a good idea to maintain 100% unit test coverage, and always test in the environments you target.
