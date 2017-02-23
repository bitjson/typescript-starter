import { test } from 'ava'
import { asyncABC } from 'typescript-starter'

test('getABC', async t => {
  t.deepEqual(await asyncABC(), ['a','b', 'c'])
})
