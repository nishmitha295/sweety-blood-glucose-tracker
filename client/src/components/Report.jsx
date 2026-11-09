import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { api } from '../api.js';

const TYPES = [
  { key: 'daily', label: 'Daily' },
  { key: 'mtd', label: 'Month-to-date' },
  { key: 'monthly', label: 'Monthly (prev.)' },
];

export default function Report({ date }) {
  const [type, setType] = useState('daily');
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.report({ date, type })
      .then(setReport)
      .catch((e) => setError(e.message));
  }, [date, type]);

  const chartData = report?.readings?.map((r) => ({
    name: `${String(r.date).slice(5)} ${r.slot.split(' ')[0]}`,
    value: Number(r.value),
  })) || [];

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Report</h3>
        <div className="flex gap-1">
          {TYPES.map((t) => (
            <button
              key={t.key}
              onClick={() => setType(t.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium ${type === t.key ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!report && !error && <p className="text-gray-400 text-sm">Loading…</p>}

      {report && report.count === 0 && (
        <p className="text-gray-500 text-sm py-6 text-center">
          No readings for {report.range.start === report.range.end ? report.range.start : `${report.range.start} – ${report.range.end}`} yet. Add a reading to see your report!
        </p>
      )}

      {report && report.count > 0 && (
        <>
          <div className="grid grid-cols-4 gap-2 text-center mb-4">
            {[
              ['Readings', report.count],
              ['Highest', `${report.highest} mg/dl`],
              ['Lowest', `${report.lowest} mg/dl`],
              ['Average', `${report.average} mg/dl`],
            ].map(([label, val]) => (
              <div key={label} className="bg-teal-50 rounded-lg p-2">
                <div className="text-lg font-bold text-teal-700">{val}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            ))}
          </div>

          {type === 'daily' && (
            <ul className="divide-y text-sm mb-3">
              {report.readings.map((r) => (
                <li key={r.id} className="py-1.5 flex justify-between">
                  <span className="text-gray-600">{r.slot}</span>
                  <span className="font-medium">{r.value} mg/dl</span>
                </li>
              ))}
            </ul>
          )}

          {chartData.length > 1 && (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis domain={['dataMin - 20', 'dataMax + 20']} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </>
      )}
    </div>
  );
}
