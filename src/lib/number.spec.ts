import { test } from 'ava'
import { double, power } from 'typescript-starter'

test('double', t => {
  t.deepEqual(double(2), 4)
})

test('power', t => {
  t.deepEqual(power(2,4), 16)
})
