<img height="0" width="0" alt="Typescript Starter Dark" src="https://cloud.githubusercontent.com/assets/904007/23006840/4e2b0c6c-f3d2-11e6-8f32-11384ee0cc4b.png"><img alt="typescript-starter" src="https://cloud.githubusercontent.com/assets/904007/23006836/4c67a3b8-f3d2-11e6-8784-12f0a34284d1.png">

[![Build Status](https://travis-ci.org/bitjson/typescript-starter.svg?branch=master)](https://travis-ci.org/bitjson/typescript-starter)
[![Codecov](https://img.shields.io/codecov/c/github/bitjson/typescript-starter.svg)](https://codecov.io/gh/bitjson/typescript-starter)
[![NPM version](https://img.shields.io/npm/v/typescript-starter.svg)](https://www.npmjs.com/package/typescript-starter)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![dependencies Status](https://david-dm.org/bitjson/typescript-starter/status.svg)](https://david-dm.org/bitjson/typescript-starter)
[![devDependencies Status](https://david-dm.org/bitjson/typescript-starter/dev-status.svg)](https://david-dm.org/bitjson/typescript-starter?type=dev)

# typescript-starter

A [typescript](https://www.typescriptlang.org/) starter for building javascript libraries and projects:

* Write **standard, future javascript** – with stable es7 features – today ([stage 3](https://github.com/tc39/proposals) or [finished](https://github.com/tc39/proposals/blob/master/finished-proposals.md) features)
* [Optionally use typescript](https://basarat.gitbooks.io/typescript/content/docs/why-typescript.html) to improve tooling, linting, and documentation generation
* Export as a [javascript module](http://jsmodules.io/), making your work **fully tree-shakable** for consumers using [es6 imports](https://github.com/rollup/rollup/wiki/pkg.module) (like [Rollup](http://rollupjs.org/) or [Webpack 2](https://webpack.js.org/))
* Export type declarations to improve your downstream development experience
* Backwards compatibility for Node.js-style (CommonJS) imports
* Both [strict](config/tsconfig.strict.json) and [flexible](config/tsconfig.flexible.json) typescript configurations available

So we can have nice things:
* Generate API documentation (HTML or JSON) [without a mess of JSDoc tags](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) to maintain
* Collocated, atomic, concurrent unit tests with [AVA](https://github.com/avajs/ava)
* Source-mapped code coverage reports with [nyc](https://github.com/istanbuljs/nyc)
* Configurable code coverage testing (for continuous integration)

## Get started

Before you start, consider using an [editor with good typescript support](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support).

[VS Code](https://code.visualstudio.com/) (below) is a popular option. Editors with typescript support can provide helpful autocomplete, inline documentation, and code refactoring features.

<p align="center">
  <img alt="Typescript Editor Support – vscode" width="600" src="https://cloud.githubusercontent.com/assets/904007/23042221/ccebd534-f465-11e6-838d-e2449899282c.png">
</p>

To see how this starter can be used as a dependency in other projects, check out the [`examples`](./examples) folder. The example above is from [`examples/node-typescript`](./examples/node-typescript).

## Development zen


This starter includes a watch task which makes development faster and more interactive. It's particularly helpful for [TDD](https://en.wikipedia.org/wiki/Test-driven_development)/[BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) workflows.

To start working, [install Yarn](https://yarnpkg.com/en/docs/getting-started) and run:

```
yarn watch
```

which will build and watch the entire project for changes (to both the library source files and test source files). As you develop, you can add tests for new functionality – which will initially fail – before developing the new functionality. Each time you save, any changes will be rebuilt and retested.

Typescript builds on the left, tests run on the right:

<p align="center">
  <img alt="Typescript and AVA watch task" src="https://cloud.githubusercontent.com/assets/904007/22908704/f4a83b20-f21d-11e6-8006-da6a851fb057.png">
</p>

Since only changed files are rebuilt and retested, this workflow remains fast even for large projects.

## Enable stronger type checking (recommended)

To make getting started easier, the default `tsconfig.json` is using the `config/tsconfig.flexible` configuration. This will allow you to get started without many warnings from Typescript.

To enable additional Typescript type checking features (a good idea for mission-critical or large projects), change the `extends` value in `tsconfig.json` to `./config/tsconfig.strict`.

## View test coverage

To generate and view test coverage, run:
```bash
yarn cov
```

This will create an HTML report of test coverage – source-mapped back to Typescript – and open it in your default browser.

<p align="center">
  <img height="600" alt="source-mapped typescript test coverage example" src="https://cloud.githubusercontent.com/assets/904007/22909301/5164c83a-f221-11e6-9d7c-72c924fde450.png">
</p>

## Generate your API docs

The src folder is analyzed and documentation is automatically generated using [typedoc](https://github.com/TypeStrong/typedoc).

```bash
yarn docs
```
This command generates API documentation for your library in HTML format.

Since types are tracked by Typescript, there's no need to indicate types in JSDoc format. For more information, see the [typedoc documentation](http://typedoc.org/guides/doccomments/).

<p align="center">
  <img height="500" alt="typedoc documentation example" src="https://cloud.githubusercontent.com/assets/904007/22909419/085b9e38-f222-11e6-996e-c7a86390478c.png">
</p>

For more advanced documentation generation, you can provide your own [typedoc theme](http://typedoc.org/guides/themes/), or [build your own documentation](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) using the JSON typedoc export:

```bash
yarn docs:json
```

## Generate/update changelog & release

This project is tooled for [Conventional Changelog](https://github.com/conventional-changelog/conventional-changelog) to make managing releases easier. See the [standard-version](https://github.com/conventional-changelog/standard-version) documentation for more information on the workflow, or [`CHANGELOG.md`](CHANGELOG.md) for an example.

```bash
# bump package.json version, update CHANGELOG.md, git tag the release
yarn release
# Release without bumping package.json version
yarn release -- --first-release
# PGP sign the release
yarn release -- --sign
```

## All package scripts

You can run the `info` script for information on each available package script.

```
yarn run info

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
  watch:
    Watch source files, rebuild library on changes, rerun relevant tests
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
