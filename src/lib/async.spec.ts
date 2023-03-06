import test from 'ava';

import { asyncABC } from './async.js';

test('getABC', async (t) => {
  t.deepEqual(await asyncABC(), ['a', 'b', 'c']);
});
