import test from 'ava';

import { double, power } from './number.js';

// eslint-disable-next-line functional/no-return-void
test('double', (t) => {
  t.is(double(2), 4);
});

// eslint-disable-next-line functional/no-return-void
test('power', (t) => {
  t.is(power(2, 4), 16);
});
