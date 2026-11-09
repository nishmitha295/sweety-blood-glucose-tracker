import { useState } from 'react';

export const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

export default function ReadingForm({ date, existingSlots = [], onSubmit, onCancel, initial }) {
  const [slot, setSlot] = useState(initial?.slot || '');
  const [value, setValue] = useState(initial?.value ?? '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const usedSlots = existingSlots.filter((s) => s !== initial?.slot);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!slot) errs.slot = 'Please select a time slot.';
    if (value === '') errs.value = 'Please enter a glucose value.';
    else if (!Number.isInteger(Number(value)) || Number(value) < 40 || Number(value) > 600) {
      errs.value = 'Value must be between 40 and 600 mg/dl.';
    }
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await onSubmit({ date, slot, value: Number(value) });
      setSlot(''); setValue(''); setErrors({});
    } catch (err) {
      setErrors(err.errors || { general: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white p-4 rounded-xl shadow-sm border space-y-3">
      <h3 className="font-semibold text-gray-800">{initial ? 'Edit reading' : 'Add reading'}</h3>
      <div className="grid grid-cols-2 gap-3">
        <select
          className="border rounded-lg px-3 py-2"
          value={slot}
          onChange={(e) => setSlot(e.target.value)}
          data-testid="slot-select"
        >
          <option value="">Select slot…</option>
          {SLOTS.map((s) => (
            <option key={s} value={s} disabled={usedSlots.includes(s)}>{s}</option>
          ))}
        </select>
        <input
          className="border rounded-lg px-3 py-2"
          type="number"
          placeholder="mg/dl"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          data-testid="value-input"
        />
      </div>
      {errors.slot && <p className="text-red-600 text-sm">{errors.slot}</p>}
      {errors.value && <p className="text-red-600 text-sm">{errors.value}</p>}
      {errors.general && <p className="text-red-600 text-sm">{errors.general}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? 'Saving…' : initial ? 'Save changes' : 'Add'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
