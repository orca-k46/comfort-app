// api/provide-data.js
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }
  try {
    const { decibel } = req.body;
    const timestamp = new Date().toISOString();
    const data = { decibel, timestamp };
    const dbPath = path.join(__dirname, '..', 'db.json');
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);
  } catch (e) {
    console.error('[provide-data] Write Error:', e);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
