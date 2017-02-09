import { test } from 'ava'
import * as lib from './'

test('functions can be used without es imports', (t) => {
  t.true(typeof lib.double === 'function')
  t.true(typeof lib.power === 'function')
  t.true(typeof lib.asyncABC === 'function')
})
