// this script watches the tests exported by typescript, copies them to the test directories, and modifies the require("PKG.NAME") statements to test each build
const cpx = require("cpx");
const path = require("path");
const Transform = require("stream").Transform;
const pkg = require('../../package');

const req = (path) => `require("${path}")`;

// replace instances of pkg.name with the proper route to the build being tested
const makeTransform = (rootDir, buildPath, specPath) => {
  const specDir = path.dirname(specPath)
  const testDir = specDir.replace(path.join(rootDir, 'build'), path.join(rootDir, 'test'))

  const newRequire = path.relative(testDir, buildPath)
    .split(path.sep).join('/')

  return new Transform({
    transform(chunk, encoding, done) {
      const str = chunk
        .toString()
        .replace(req(pkg.name), req(newRequire))
      this.push(str);
      done();
    }
  });
}

// copy, then watch for changes to the tests
const testsFromRoot = 'build/main/**/*.spec.js';
const watchMode = process.argv.indexOf('-w') !== -1 ? true : false;
const browserTests = process.argv.indexOf('--no-browser') !== -1 ? true : false;
const task = watchMode ? cpx.watch : cpx.copy;

const rootDir = path.resolve('.');
const mainBuildPath = path.resolve(pkg.main);

task(testsFromRoot, 'test/main', {
  transform: (specPath) => makeTransform(
    rootDir,
    mainBuildPath,
    path.resolve(specPath))
});

if (!browserTests) {
  const browserBuildPath = path.resolve(pkg.browser);

  task(testsFromRoot, 'test/browser', {
    transform: (specPath) => makeTransform(
      rootDir,
      browserBuildPath.replace('.js', '.cjs.js'),
      path.resolve(specPath))
  });
}