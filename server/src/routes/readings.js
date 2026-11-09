const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { SLOTS, validateReading } = require('../utils/validation');

const router = express.Router();
router.use(authMiddleware);

async function countForDay(userId, date) {
  const { rows } = await pool.query(
    'SELECT COUNT(*)::int AS c FROM readings WHERE user_id = $1 AND date = $2',
    [userId, date]
  );
  return rows[0].c;
}

async function slotExists(userId, date, slot, excludeId = null) {
  const { rows } = await pool.query(
    `SELECT id FROM readings WHERE user_id = $1 AND date = $2 AND slot = $3 ${excludeId ? 'AND id != $4' : ''}`,
    excludeId ? [userId, date, slot, excludeId] : [userId, date, slot]
  );
  return rows.length > 0;
}

// GET /api/readings?date=YYYY-MM-DD&page=1&limit=20
router.get('/', async (req, res) => {
  const { date, page = 1, limit = 20 } = req.query;
  const params = [req.user.id];
  let where = 'WHERE user_id = $1';
  if (date) {
    params.push(date);
    where += ` AND date = $${params.length}`;
  }
  const lim = Math.min(Number(limit) || 20, 100);
  const off = (Math.max(Number(page) || 1, 1) - 1) * lim;
  params.push(lim, off);
  try {
    const { rows } = await pool.query(
      `SELECT id, date, slot, value, created_at, updated_at FROM readings ${where}
       ORDER BY date DESC, slot ASC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const { rows: c } = await pool.query(
      `SELECT COUNT(*)::int AS total FROM readings ${where}`,
      params.slice(0, -2)
    );
    res.json({ readings: rows, total: c[0].total, page: Number(page) || 1, limit: lim });
  } catch {
    res.status(500).json({ error: 'Could not fetch readings.' });
  }
});

// POST /api/readings
router.post('/', async (req, res) => {
  const { date, slot, value } = req.body || {};
  const existingCount = date ? await countForDay(req.user.id, date) : 0;
  const { errors } = validateReading({ date, slot, value }, existingCount);
  if (errors) return res.status(400).json({ errors });

  if (await slotExists(req.user.id, date, slot)) {
    return res.status(409).json({
      errors: { slot: `You already have a ${slot} reading for this date.` },
    });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO readings (user_id, date, slot, value) VALUES ($1, $2, $3, $4)
       RETURNING id, date, slot, value, created_at, updated_at`,
      [req.user.id, date, slot, Number(value)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        errors: { slot: `You already have a ${slot} reading for this date.` },
      });
    }
    res.status(500).json({ error: 'Could not save reading.' });
  }
});

// PUT /api/readings/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { date, slot, value } = req.body || {};

  const { rows: existing } = await pool.query(
    'SELECT * FROM readings WHERE id = $1 AND user_id = $2',
    [id, req.user.id]
  );
  if (!existing.length) return res.status(404).json({ error: 'Reading not found.' });
  const current = existing[0];

  const newDate = date || current.date;
  const newSlot = slot || current.slot;
  const newValue = value !== undefined && value !== null && value !== '' ? value : current.value;

  const count = await countForDay(req.user.id, newDate);
  const { errors } = validateReading(
    { date: newDate, slot: newSlot, value: newValue },
    newDate === current.date ? count - 1 : count
  );
  if (errors) return res.status(400).json({ errors });

  if (await slotExists(req.user.id, newDate, newSlot, Number(id))) {
    return res.status(409).json({
      errors: { slot: `You already have a ${newSlot} reading for this date.` },
    });
  }

  try {
    const { rows } = await pool.query(
      `UPDATE readings SET date = $1, slot = $2, value = $3, updated_at = NOW()
       WHERE id = $4 AND user_id = $5
       RETURNING id, date, slot, value, created_at, updated_at`,
      [newDate, newSlot, Number(newValue), id, req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        errors: { slot: `You already have a ${newSlot} reading for this date.` },
      });
    }
    res.status(500).json({ error: 'Could not update reading.' });
  }
});

// DELETE /api/readings/:id
router.delete('/:id', async (req, res) => {
  const { rows } = await pool.query(
    'DELETE FROM readings WHERE id = $1 AND user_id = $2 RETURNING id',
    [req.params.id, req.user.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Reading not found.' });
  res.json({ message: 'Reading deleted.' });
});

module.exports = router;
module.exports.SLOTS = SLOTS;
