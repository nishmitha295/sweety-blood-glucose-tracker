require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, initDb } = require('./index');

const SLOTS = ['Morning (fasting)', 'After breakfast', 'After lunch', 'After dinner'];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function seed() {
  await initDb();
  const email = 'demo@sweety.app';
  const hash = await bcrypt.hash('password123', 10);
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ('Demo User', $1, $2)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [email, hash]
  );
  const userId = rows[0].id;

  await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);

  const sample = [];
  for (let d = 0; d < 14; d++) {
    const date = daysAgo(d);
    const count = d % 3 === 0 ? 3 : 4;
    for (let s = 0; s < count; s++) {
      sample.push([userId, date, SLOTS[s], 90 + Math.floor(Math.random() * 160)]);
    }
  }
  for (const r of sample) {
    await pool.query(
      `INSERT INTO readings (user_id, date, slot, value) VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, date, slot) DO NOTHING`,
      r
    );
  }
  console.log(`Seeded demo user ${email} / password123 with ${sample.length} readings.`);
  await pool.end();
}

seed().catch((e) => { console.error(e); process.exit(1); });
