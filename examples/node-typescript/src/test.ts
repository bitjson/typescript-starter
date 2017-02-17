// Typescript should resolve this using the same algorithm as Node.js.
// See examples/node-vanilla for more info.
import { double, power, asyncABC } from 'typescript-starter'
import * as assert from 'assert'

assert(double(6) === 12)
console.log('✔ double(6) === 12')

assert(power(3,4) === 81)
console.log('✔ power(3,4) === 81')

asyncABC().then( abc => console.log('✔ asyncABC returned:', abc) )
