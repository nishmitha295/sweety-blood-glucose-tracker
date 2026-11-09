const { test } = require('node:test');
const assert = require('node:assert');
const { validateReading, SLOTS } = require('../src/utils/validation');

test('missing value gives required error', () => {
  const { errors } = validateReading({ date: '2026-10-15', slot: SLOTS[0], value: '' }, 0);
  assert.strictEqual(errors.value, 'Please enter a glucose value.');
});

test('non-integer / out of range value rejected', () => {
  const { errors } = validateReading({ date: '2026-10-15', slot: SLOTS[0], value: 'abc' }, 0);
  assert.strictEqual(errors.value, 'Value must be between 40 and 600 mg/dl.');
  const { errors: e2 } = validateReading({ date: '2026-10-15', slot: SLOTS[0], value: 700 }, 0);
  assert.strictEqual(e2.value, 'Value must be between 40 and 600 mg/dl.');
});

test('future date rejected', () => {
  const future = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const { errors } = validateReading({ date: future, slot: SLOTS[0], value: 100 }, 0);
  assert.strictEqual(errors.date, 'Date cannot be in the future.');
});

test('max 4 readings per day', () => {
  const { errors } = validateReading({ date: '2026-10-15', slot: SLOTS[0], value: 100 }, 4);
  assert.strictEqual(errors.general, 'You can add only 4 readings per day.');
});

test('valid input passes', () => {
  const { errors } = validateReading({ date: '2026-10-15', slot: SLOTS[2], value: 120 }, 2);
  assert.strictEqual(errors, null);
});
