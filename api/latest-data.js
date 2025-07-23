// api/latest-data.js
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).end(); // Method Not Allowed
    return;
  }
  try {
    const dbPath = path.join(__dirname, '..', 'db.json');
    const raw = fs.readFileSync(dbPath, 'utf8');
    const data = JSON.parse(raw);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (e) {
    console.error('[latest-data] Read Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
