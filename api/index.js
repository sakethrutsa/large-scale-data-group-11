const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const db = require('./database');

app.post('/search', async (req, res) => {
  try {
    var { user_id, query } = req.body;

    // debug change user_id to 1 for now
    user_id = 1;

    await db.query('INSERT INTO SEARCH_QUERY (user_id, query) VALUES (?, ?)', [user_id, query]);

    const startDate = new Date();
    startDate.setDate(1);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

    const existingTrend = await db.query('SELECT * FROM TREND WHERE keyword = ? AND start_date = ? AND end_date = ?', [query, startDate, endDate]);

    if (existingTrend.length > 0) {
      await db.query('UPDATE TREND SET count = count + 1 WHERE keyword = ? AND start_date = ? AND end_date = ?', [query, startDate, endDate]);
    } else {
      await db.query('INSERT INTO TREND (keyword, count, start_date, end_date) VALUES (?, 1, ?, ?)', [query, startDate, endDate]);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.sendStatus(500);
  }
});

app.get('/trends/popular', async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(1);

    const trends = await db.query('SELECT keyword, count FROM TREND WHERE start_date = ? ORDER BY count DESC', [startDate]);

    res.json(trends);
  } catch (error) {
    console.error('Error in trends popular endpoint:', error);
    res.sendStatus(500);
  }
});

app.get('/trends/timeline/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { start, end } = req.query;

    const query = 'SELECT keyword, count, start_date, end_date FROM TREND WHERE keyword = ?';
    const params = [keyword];

    if (start) {
      query += ' AND start_date >= ?';
      params.push(start);
    }

    if (end) {
      query += ' AND end_date <= ?';
      params.push(end);
    }

    const timeline = await db.query(query, params);

    res.json(timeline);
  } catch (error) {
    console.error('Error in trends timeline endpoint:', error);
    res.sendStatus(500);
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});