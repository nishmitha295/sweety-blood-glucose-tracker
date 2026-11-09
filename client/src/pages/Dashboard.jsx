import { useCallback, useEffect, useState } from 'react';
import { api, getUser, clearSession } from '../api.js';
import ReadingForm from '../components/ReadingForm.jsx';
import Report from '../components/Report.jsx';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Dashboard() {
  const [date, setDate] = useState(todayStr());
  const [readings, setReadings] = useState([]);
  const [editing, setEditing] = useState(null);
  const user = getUser();

  const load = useCallback(() => {
    api.listReadings({ date }).then((d) => setReadings(d.readings)).catch(() => {});
  }, [date]);

  useEffect(load, [load]);

  const addReading = async (body) => {
    if (editing) {
      await api.updateReading(editing.id, body);
      setEditing(null);
    } else {
      await api.createReading(body);
    }
    load();
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this reading?')) return;
    await api.deleteReading(id);
    load();
  };

  const logout = () => { clearSession(); window.location.href = '/login'; };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-teal-700">Sweety</h1>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">{user?.name}</span>
          <button onClick={logout} className="text-red-600 hover:underline">Log out</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 space-y-4">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Date:</label>
          <input
            type="date"
            max={todayStr()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded-lg px-3 py-2"
          />
          <span className="text-sm text-gray-500">{readings.length}/4 readings</span>
        </div>

        <ReadingForm
          date={date}
          existingSlots={readings.map((r) => r.slot)}
          onSubmit={addReading}
          initial={editing}
          onCancel={editing ? () => setEditing(null) : null}
        />

        {readings.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border divide-y">
            {readings.map((r) => (
              <div key={r.id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                <span className="text-gray-600">{r.slot}</span>
                <span className="font-medium">{r.value} mg/dl</span>
                <span className="flex gap-3">
                  <button className="text-teal-600 hover:underline" onClick={() => setEditing(r)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => remove(r.id)}>Delete</button>
                </span>
              </div>
            ))}
          </div>
        )}

        <Report date={date} />
      </main>
    </div>
  );
}
