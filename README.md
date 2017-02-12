# es7-typescript-starter
An es7/typescript starter for building javascript libraries:

* Write **standard, future javascript** – with stable es7 features – today ([stage 3](https://github.com/tc39/proposals) or [finished](https://github.com/tc39/proposals/blob/master/finished-proposals.md) features)
* [Optionally use typescript](https://basarat.gitbooks.io/typescript/content/docs/why-typescript.html) to improve tooling, linting, and documentation generation
* Export as a [javascript module](http://jsmodules.io/), making your work **fully tree-shakable** for consumers using [es6 imports](https://github.com/rollup/rollup/wiki/pkg.module) (like [Rollup](http://rollupjs.org/) or [Webpack 2](https://webpack.js.org/))
* Export typescript declarations to improve your downstream development experience
* Backwards compatibility for Node.js-style (CommonJS) imports (v4 or greater)
* Both [strict](config/tsconfig.strict.json) and [flexible](config/tsconfig.flexible.json) typing configurations available

So we can have nice things:
* Generate API documentation (HTML or JSON) [without a mess of JSDoc tags](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) to maintain
* Collocated, atomic, concurrent unit tests with [AVA](https://github.com/avajs/ava)
* Source-mapped code coverage reports with [nyc](https://github.com/istanbuljs/nyc)
* Configurable code coverage testing (for continuous integration)

## Get started

Before you start, consider configuring or switching to an [editor with good typescript support](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support).

To see how this starter can be used, check out the [`examples`](./examples) folder.

## Development zen


This starter includes watch tasks which make development faster and more interactive. They're particularly helpful for TDD/BDD workflows.

To start working, run:

```
$ yarn watch:build
```

which will build and watch the entire project for changes (to both the library and test sources). In another tab or terminal window, run:

```
$ yarn watch:test
```

As you develop, you can add tests for new functionality – which will initially fail – before developing the new functionality. Each time you save, any changes will be rebuilt and retested.

Since only changed files are rebuilt and retested, this workflow remains fast even for large projects.

## Enable stronger typechecking (Recommended)

To make getting started easier, the default `tsconfig.json` is using the `config/tsconfig.flexible` configuration. This will allow you to get started without many warning from Typescript.

To enable additional Typescript typechecking features (a good idea for mission-critical or large projects), change the `extends` value in `tsconfig.json` to `./config/tsconfig.strict`.

## View test coverage

To generate and view test coverage, run:
```bash
$ yarn cov
```

This will create an HTML report of test coverage – source-mapped back to Typescript – and open in in your default browser.

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

## Generate Changelog & Release

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

This starter currently doesn't run tests in a browser ([AVA](https://github.com/avajs/ava) tests in Node exclusively). While the current testing system will be sufficient for most use cases, some projects will (also) need to implement a browser-based testing system like [karma-ava](https://github.com/avajs/karma-ava). (Pull requests welcome!)

### Dependency on `tslib`

By default, this project requires [tslib](https://github.com/Microsoft/tslib) as a dependency. This is the recommended way to use Typescript's es6 &amp; es7 transpiling for sizable projects, but you can remove this dependency by removing the `importHelpers` compiler option in `tsconfig.json`. Depending on your usage, this may increase the size of your library significantly, as the Typescript compiler will inject it's helper functions directly into every file which uses them.

### Targetting Old Environments

By default, this library targets environments with native (or already-polyfilled) support for es6 features. If your library needs to target Internet Explorer, outdated Android browsers, or versions of Node older than v4, you may need to change the `target` in `tsconfig.json` to `es5` (rather than `es6`) and bring in a Promise polyfill (such as [es6-promise](https://github.com/stefanpenner/es6-promise)).

It's a good idea to maintain 100% unit test coverage, and always test in the environments you target.
