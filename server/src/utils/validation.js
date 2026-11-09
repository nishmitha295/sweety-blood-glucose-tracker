const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

function validateReading(body, existingCount) {
  const { date, slot, value } = body;
  const errors = {};

  if (!date) errors.date = 'Please select a date.';
  else if (isNaN(Date.parse(date))) errors.date = 'Please enter a valid date.';
  else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    if (d > today) errors.date = 'Date cannot be in the future.';
  }

  if (!slot) errors.slot = 'Please select a time slot.';
  else if (!SLOTS.includes(slot)) errors.slot = 'Invalid time slot.';

  if (value === undefined || value === null || value === '') {
    errors.value = 'Please enter a glucose value.';
  } else {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 40 || n > 600) {
      errors.value = 'Value must be between 40 and 600 mg/dl.';
    }
  }

  if (Object.keys(errors).length) return { errors };

  if (existingCount >= 4) {
    return { errors: { general: 'You can add only 4 readings per day.' } };
  }

  return { errors: null };
}

module.exports = { SLOTS, validateReading };
