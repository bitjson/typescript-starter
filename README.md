<img height="0" width="0" alt="Typescript Starter Dark" src="https://cloud.githubusercontent.com/assets/904007/23006840/4e2b0c6c-f3d2-11e6-8f32-11384ee0cc4b.png"><img alt="typescript-starter" src="https://cloud.githubusercontent.com/assets/904007/23006836/4c67a3b8-f3d2-11e6-8784-12f0a34284d1.png">

[![NPM version](https://img.shields.io/npm/v/typescript-starter.svg)](https://www.npmjs.com/package/typescript-starter)
[![Build Status](https://travis-ci.org/bitjson/typescript-starter.svg?branch=master)](https://travis-ci.org/bitjson/typescript-starter)
[![Codecov](https://img.shields.io/codecov/c/github/bitjson/typescript-starter.svg)](https://codecov.io/gh/bitjson/typescript-starter)
[![Standard Version](https://img.shields.io/badge/release-standard%20version-brightgreen.svg)](https://github.com/conventional-changelog/standard-version)
[![GitHub stars](https://img.shields.io/github/stars/bitjson/typescript-starter.svg?style=social&logo=github&label=Stars)](https://github.com/bitjson/typescript-starter)

# typescript-starter

### A clean, simple [typescript](https://www.typescriptlang.org/) starter for building javascript libraries and Node.js applications.

<p align="center">
  <img alt="demo of the typescript-starter command-line interface" src="https://cdn.rawgit.com/bitjson/typescript-starter/c3e3b7ec/demo.svg">
</p>

## Start Now

Run one simple command to install and use the interactive project generator. You'll need [Node](https://nodejs.org/) `v8.9` (the current LTS release) or later.

```bash
npx typescript-starter
```

The interactive CLI will help you create and configure your project automatically.

> Since this repo includes [the CLI and it's tests](./src/cli), you'll only need to fork or clone this project if you want to contribute. If you find this project useful, please consider [leaving a star](https://github.com/bitjson/typescript-starter/stargazers) so others can find it. Thanks!

# Features

* Write **standard, future javascript** – with stable ESNext features – today ([stage 3](https://github.com/tc39/proposals) or [finished](https://github.com/tc39/proposals/blob/master/finished-proposals.md) features)
* [Optionally use typescript](https://medium.freecodecamp.org/its-time-to-give-typescript-another-chance-2caaf7fabe61) to improve tooling, linting, and documentation generation
* Export as a [javascript module](http://jsmodules.io/), making your work **fully tree-shakable** for consumers capable of using [es6 imports](https://github.com/rollup/rollup/wiki/pkg.module) (like [Rollup](http://rollupjs.org/), [Webpack](https://webpack.js.org/), or [Parcel](https://parceljs.org/))
* Export type declarations to improve your downstream development experience
* Backwards compatibility for Node.js-style (CommonJS) imports
* Both strict and flexible [typescript configurations](config/tsconfig.json) available

So we can have nice things:

* Generate API documentation (HTML or JSON) [without a mess of JSDoc tags](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) to maintain
* Collocated, atomic, concurrent unit tests with [AVA](https://github.com/avajs/ava)
* Source-mapped code coverage reports with [nyc](https://github.com/istanbuljs/nyc)
* Configurable code coverage testing (for continuous integration)
* Automatic linting and formatting using [TSLint](https://github.com/palantir/tslint) and [Prettier](https://prettier.io/)
* Automatically check for known vulnerabilities in your dependencies with [`nsp`](https://github.com/nodesecurity/nsp)

## But first, a good editor

Before you start, consider using an [editor with good typescript support](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support).

[VS Code](https://code.visualstudio.com/) (below) is a popular option. Editors with typescript support can provide helpful autocomplete, inline documentation, and code refactoring features.

Also consider installing editor extensions for [TSLint](https://github.com/Microsoft/vscode-tslint) and [Prettier](https://github.com/prettier/prettier-vscode). These extensions automatically format your code each time you save, and may quickly become invaluable.

<p align="center">
  <img alt="Typescript Editor Support – vscode" width="600" src="https://cloud.githubusercontent.com/assets/904007/23042221/ccebd534-f465-11e6-838d-e2449899282c.png">
</p>

# Developing with typescript-starter

## Development zen

To start working, run the `watch` task using [`npm`](https://docs.npmjs.com/getting-started/what-is-npm) or [`yarn`](https://yarnpkg.com/).

```bash
npm run watch
```

This starter includes a watch task which makes development faster and more interactive. It's particularly helpful for [TDD](https://en.wikipedia.org/wiki/Test-driven_development)/[BDD](https://en.wikipedia.org/wiki/Behavior-driven_development) workflows.

The watch task will build and watch the entire project for changes (to both the library source files and test source files). As you develop, you can add tests for new functionality – which will initially fail – before developing the new functionality. Each time you save, any changes will be rebuilt and retested.

<p align="center">
  <!-- PR request: capture the magic of using a test-running watch task for development -->
  <img alt="typescript-starter's watch task" src="https://user-images.githubusercontent.com/904007/37270842-c05f5192-25a6-11e8-83bb-1981ae48e38e.png">
</p>

Since only changed files are rebuilt and retested, this workflow remains fast even for large projects.

## Enable stronger type checking (recommended)

To make getting started easier, the default `tsconfig.json` is using a very flexible configuration. This will allow you to get started without many warnings from Typescript.

To enable additional Typescript type checking features (a good idea for mission-critical or large projects), review the commented-out lines in your [typescript compiler options](./tsconfig.json).

## View test coverage

To generate and view test coverage, run:

```bash
npm run cov
```

This will create an HTML report of test coverage – source-mapped back to Typescript – and open it in your default browser.

<p align="center">
  <img height="600" alt="source-mapped typescript test coverage example" src="https://cloud.githubusercontent.com/assets/904007/22909301/5164c83a-f221-11e6-9d7c-72c924fde450.png">
</p>

## Generate your API docs

The src folder is analyzed and documentation is automatically generated using [TypeDoc](https://github.com/TypeStrong/typedoc).

```bash
npm run docs
```

This command generates API documentation for your library in HTML format and opens it in a browser.

Since types are tracked by Typescript, there's no need to indicate types in JSDoc format. For more information, see the [TypeDoc documentation](http://typedoc.org/guides/doccomments/).

To generate and publish your documentation to [GitHub Pages](https://pages.github.com/) use the following command:

```bash
npm run docs:publish
```

Once published, your documentation should be available at the proper GitHub Pages URL for your repo. See [`typescript-starter`'s GitHub Pages](https://bitjson.github.io/typescript-starter/) for an example.

<p align="center">
  <img height="500" alt="TypeDoc documentation example" src="https://cloud.githubusercontent.com/assets/904007/22909419/085b9e38-f222-11e6-996e-c7a86390478c.png">
</p>

For more advanced documentation generation, you can provide your own [TypeDoc theme](http://typedoc.org/guides/themes/), or [build your own documentation](https://blog.cloudflare.com/generating-documentation-for-typescript-projects/) using the JSON TypeDoc export:

```bash
npm run docs:json
```

## Update the changelog, commit, & tag release

It's recommended that you install [`commitizen`](https://github.com/commitizen/cz-cli) to make commits to your project.

```bash
npm install -g commitizen

# commit your changes:
git cz
```

This project is tooled for [conventional changelog](https://github.com/conventional-changelog/conventional-changelog) to make managing releases easier. See the [standard-version](https://github.com/conventional-changelog/standard-version) documentation for more information on the workflow, or [`CHANGELOG.md`](CHANGELOG.md) for an example.

```bash
# bump package.json version, update CHANGELOG.md, git tag the release
npm run changelog
```

## One-step publish preparation script

Bringing together many of the steps above, this repo includes a one-step release preparation command.

```bash
# Prepare a standard release:
npm run prepare-release
```

You can also prepare a non-standard release:

```bash
# Or a non-standard release:

# Build everything
npm run all

# Then version it
npm run version -- --first-release # don't bump package.json version
npm run version -- --sign # PGP sign it
npm run version -- --prerelease alpha # alpha release

# And don't forget to push the docs to GitHub pages:
npm run docs:publish
```

This command runs the following tasks:

* `reset`: cleans the repo by removing all untracked files and resetting `--hard` to the latest commit. (**Note: this could be destructive.**)
* `test`: build and fully test the project
* `docs:html`: generate the latest version of the documentation
* `docs:publish`: publish the documentation to GitHub Pages
* `changelog`: bump package.json version, update CHANGELOG.md, and git tag the release

When the script finishes, it will log the final command needed to push the release commit to the repo and publish the package on the `npm` registry:

```bash
git push --follow-tags origin master; npm publish
```

Look over the release if you'd like, then execute the command to publish everything.

## Get scripts info

You can run the `info` script for information on each script intended to be individually run.

```
npm run info

> npm-scripts-info

info:
  Display information about the package scripts
build:
  Clean and rebuild the project
fix:
  Try to automatically fix any linting problems
test:
  Lint and unit test the project
watch:
  Watch and rebuild the project on save, then rerun relevant tests
cov:
  Rebuild, run tests, then create and open the coverage report
doc:
  Generate HTML API documentation and open it in a browser
doc:json:
  Generate API documentation in typedoc JSON format
changelog:
  Bump package.json version, update CHANGELOG.md, tag release
reset:
  Delete all untracked files and reset the repo to the last commit
release:
  One-step: clean, build, test, publish docs, and prep a release
```

# FAQs

## Why are there two builds? (`main` and `module`)

The `src` of `typescript-starter` is compiled into two separate builds: `main` and `module`. The `main` build is [configured to use the CommonJS module system](https://github.com/bitjson/typescript-starter/blob/master/tsconfig.json#L8). The `module` build [uses the new es6 module system](https://github.com/bitjson/typescript-starter/blob/master/config/tsconfig.module.json).

Because Node.js LTS releases do not yet support the es6 module system, some projects which depend on your project will follow the `main` field in [`package.json`](https://github.com/bitjson/typescript-starter/blob/master/package.json). Tools which support the new system (like [Rollup](https://github.com/rollup/rollup), [Webpack](https://webpack.js.org/), or [Parcel](https://parceljs.org/)) will follow the `module` field, giving them the ability to statically analyze your project. These tools can tree-shake your `module` build to import only the code they need.

## Why put tests next to the source code?

By convention, sample tests in this project are adjacent to the files they test.

* Such tests are easy to find.
* You see at a glance if a part of your project lacks tests.
* Nearby tests can reveal how a part works in context.
* When you move the source (inevitable), you remember to move the test.
* When you rename the source file (inevitable), you remember to rename the test file.

(Bullet points taken from [Angular's Testing Guide](https://angular.io/guide/testing#q-spec-file-location).)

## Can I move the tests?

Yes. For some projects, separating tests from the code they test may be desirable. This project is already configured to test any `*.spec.ts` files located in the `src` directory, so reorganize your tests however you'd like. You can put them all in a single folder, add tests that test more than one file, or mix and match strategies (e.g. for other types of tests, like integration or e2e tests).

## Can I use ts-node for all the things?

Tests are compiled and performed on the final builds in the standard Node.js runtime (rather than an alternative like [ts-node](https://github.com/TypeStrong/ts-node)) to ensure that they pass in that environment. If you are build a Node.js application, and you are using [ts-node in production](https://github.com/TypeStrong/ts-node/issues/104), you can modify this project to use `ts-node` rather than a `build` step.

**However, if you're building any kind of library, you should always compile to javascript.**

Library authors sometimes make the mistake of distributing their libraries in typescript. Intuitively, this seems like a reasonable course of action, especially if all of your intended consumers will be using typescript as well.

TypeScript has versions, and different versions of TypeScript may not be compatible. Upgrading to a new major version of TypeScript sometimes requires code changes, and must be done project-by-project. Additionally, if you're using the latest version of TypeScript to build your library, and one of your consumers is using an older version in their application, their compiler will be unable to compile your library.

## How do I bundle my library for the browser?

The short answer is: **don't pre-bundle your library**.

Previous versions of `typescript-starter` included browser bundling using [Rollup](https://github.com/rollup/rollup). This feature has since been removed, since very few libraries should ever be pre-bundled.

If the consumer of your library is using Node.js, bundling is especially unnecessary, since Node.js can reliably resolve dependencies, and bundling may even make debugging more difficult.

If the consumer of your library is a browser application, **the application likely has its own build tooling**. Very few serious applications are manually bundling their javascript, especially with easy to use, no configuration tools like [Parcel](https://parceljs.org/) available.

Your library is most useful to downstream consumers as a clean, modular codebase, properly exporting features using es6 exports. Consumers can import the exact es6 exports they need from your library, and tree-shake the rest.

## How can my library provide different functionality between Node.js and the browser?

In the past, complex javascript libraries have used solutions like [Browserify](http://browserify.org/) to bundle a version of their application for the browser. Most of these solutions work by allowing library developers to extensively configure and manually override various dependencies with respective browser versions.

For example, where a Node.js application might use Node.js' built-in [`crypto` module](https://nodejs.org/api/crypto.html), a browser version would need to fall back to a polyfill-like alternative dependency like [`crypto-browserify`](https://github.com/crypto-browserify/crypto-browserify).

With es6, this customization and configuration is no longer necessary. Your library can now export different functionality for different consumers. While browser consumers may import a native JavaScript crypto implementation which your library exports, Node.js users can choose to import a different, faster implementation which your library exports.

See [hash.ts](./src/lib/hash.ts) for a complete example. Two different functions are exported, `sha256`, and `sha256Native`. Browser consumers will not be able to import `sha256Native`, since their bundler will be unable to resolve the built-in Node.js dependency (their bundler will throw an error). Node.js users, however, will be able to import it normally. Each consumer can import the exact functionality they need.

One perceived downside of this solution is that it complicates the library's API. Browser consumers will sometimes import one feature while Node.js users import another. While this argument has merit, we should weigh it against the benefits.

Providing a public API where consumer code is the same between browsers and Node.js is desirable, but it comes at the cost of significant configuration and complexity. In many cases, it requires that code be aware of its environment at runtime, requiring additional complexity and testing.

A better way to provide this developer experience is to provide similar APIs for each environment, and then encourage the use of es6 import aliasing to standardize between them.

For example, in the documentation for `typescript-starter`, we encourage Node.js users to import `sha256Native as sha256`. With this convention, we get a standard API without loaders or dependency substitution hacks.

```js
// browser-application.js
import { sha256 } from 'typescript-starter';

// fully-portable code
console.log(sha256('test'));
```

```js
// node-application.js
import { sha256Native as sha256 } from 'typescript-starter';

// fully-portable code
console.log(sha256('test'));
```

## What about Git hooks to validate commit messages?

This project uses [standard-version](https://github.com/conventional-changelog/standard-version) to automatically update the changelog based on commit messages since the last release. To do this, each relevant commit must be properly formatted.

To ensure all commits follow the proper conventions, you can use a package like [commitlint](https://github.com/marionebl/commitlint) with [Husky](https://github.com/typicode/husky). However, keep in mind that commit hooks can be confusing, especially for new contributors. They also interfere with some development tools and workflows.

If your project is private, or will primarily receive contributions from long-running contributors, this may be a good fit. Otherwise, this setup may raise the barrier to one-off contributions slightly.

Note, as a maintainer, if you manage your project on GitHub or a similar website, you can now use the `Squash and Merge` option to add a properly formatted, descriptive commit messages when merging each pull request. This is likely to be more valuable than trying to force one-time contributors to adhere to commit conventions, since you can also maintain a more consistent language style. Because this is the best choice for the vast majority of projects, `typescript-starter` does not bundle any commit message validation.

# Contributing

To work on the CLI, clone and build the repo, then use `npm link` to install it globally.

```
git clone https://github.com/bitjson/typescript-starter.git
cd typescript-starter
npm install
npm test
npm link
```

To manually test the CLI, you can use the `TYPESCRIPT_STARTER_REPO_URL` environment variable to test a clone from your local repo. Run `npm run watch` as you're developing, then in a different testing directory:

```
mkdir typescript-starter-testing
cd typescript-starter-testing
TYPESCRIPT_STARTER_REPO_URL='/local/path/to/typescript-starter' typescript-starter
```

You can also `TYPESCRIPT_STARTER_REPO_URL` to any valid Git URL, such as your fork of this repo:

```
TYPESCRIPT_STARTER_REPO_URL='https://github.com/YOUR_USERNAME/typescript-starter.git' typescript-starter
```

If you're using [VS Code](https://code.visualstudio.com/), the `Debug CLI` launch configuration also allows you to immediately build and step through execution of the CLI.

# In the wild

You can find more advanced configurations, usage examples, and inspiration from other projects using `typescript-starter`:

* [BitAuth](https://github.com/bitauth/) – A universal identity and authentication protocol, based on bitcoin
* [s6: Super Simple Secrets \* Simple Secure Storage](https://gitlab.com/td7x/s6/) – An NPM library and tool to sprawl secrets with S3, ease, and encryption

Using `typescript-starter` for your project? Please send a pull request to add it to the list!
