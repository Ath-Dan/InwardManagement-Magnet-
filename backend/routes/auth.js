// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSheets } = require('../utils/googleSheets');
const dotenv = require('dotenv')
dotenv.config()

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;
console.log(SPREADSHEET_ID);

const USERS_RANGE = 'Users!A:D';

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    const sheets = await getSheets();

    // Check if user already exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });
    const users = response.data.values || [];
    if (users.some(user => user[1] === email)) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Add new user
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
      valueInputOption: 'RAW',
      resource: {
        values: [[Date.now().toString(), email, hashedPassword, userType]],
      },
    });

    const payload = { user: { email } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const sheets = await getSheets();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });
    const users = response.data.values || [];
    const user = users.find(user => user[1] === email);

    if (!user) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user[2]);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const payload = { user: { email } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
      if (err) throw err;
      res.json({ token, userType: user[3] });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get all users (for admin)
router.get('/users', async (req, res) => {
  try {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_RANGE,
    });
    const users = response.data.values || [];
    res.json(users.map(user => ({ id: user[0], email: user[1], userType: user[3] })));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;