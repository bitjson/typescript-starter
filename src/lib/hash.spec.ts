import { test } from 'ava'
import { sha256 } from 'typescript-starter'

test('sha256', t => {
  t.deepEqual(sha256('test'), '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08')
})
