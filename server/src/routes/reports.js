const express = require('express');
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

function buildReport(rows, start, end) {
  const values = rows.map((r) => Number(r.value));
  if (!values.length) {
    return {
      range: { start: fmt(start), end: fmt(end) },
      count: 0,
      highest: null,
      lowest: null,
      average: null,
      readings: rows,
    };
  }
  const sum = values.reduce((a, b) => a + b, 0);
  return {
    range: { start: fmt(start), end: fmt(end) },
    count: values.length,
    highest: Math.max(...values),
    lowest: Math.min(...values),
    average: Math.round((sum / values.length) * 10) / 10,
    readings: rows,
  };
}

// GET /api/reports?date=YYYY-MM-DD&type=daily|mtd|monthly
router.get('/', async (req, res) => {
  const { date, type = 'daily' } = req.query;
  const selected = date ? new Date(date) : new Date();
  if (isNaN(selected)) return res.status(400).json({ error: 'Invalid date.' });
  selected.setHours(0, 0, 0, 0);

  let start, end;
  if (type === 'mtd') {
    start = new Date(selected.getFullYear(), selected.getMonth(), 1);
    end = selected;
  } else if (type === 'monthly') {
    start = new Date(selected.getFullYear(), selected.getMonth() - 1, 1);
    end = new Date(selected.getFullYear(), selected.getMonth(), 0);
  } else {
    start = selected;
    end = selected;
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, date, slot, value FROM readings
       WHERE user_id = $1 AND date BETWEEN $2 AND $3
       ORDER BY date ASC, slot ASC`,
      [req.user.id, fmt(start), fmt(end)]
    );
    res.json(buildReport(rows, start, end));
  } catch {
    res.status(500).json({ error: 'Could not generate report.' });
  }
});

module.exports = router;
