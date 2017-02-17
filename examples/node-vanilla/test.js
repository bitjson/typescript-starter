// Node.js should resolve this to the root of the repo. Since the path returns a
// directory, node will look for the `main` property in `package.json`, which
// should point to the `main` build.
var starter = require('typescript-starter');

// now we can use the library
var assert = require('assert');

assert(starter.double(6) === 12);
console.log("✔ starter.double(6) === 12");

assert(starter.power(3,4) === 81);
console.log("✔ starter.power(3,4) === 81");

starter.asyncABC().then( abc => console.log("✔ asyncABC returned:", abc) );
