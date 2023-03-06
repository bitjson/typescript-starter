import test from 'ava';

import { sha256, sha256Native } from './hash.js';

test(
  'sha256',
  async (t, input: string, expected: string) => {
    t.is(await sha256(input), expected);
    t.is(sha256Native(input), expected);
  },
  'test',
  '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
);
