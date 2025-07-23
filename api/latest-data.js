// api/latest-data.js
const os   = require('os');
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(os.tmpdir(), 'db.json');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    // ファイルがなければデフォルト値を返す
    let raw;
    try {
      raw = fs.readFileSync(DB_PATH, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        return res.status(200).json({ decibel: 0, timestamp: '' });
      }
      throw err;
    }

    const data = JSON.parse(raw);
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(data);

  } catch (err) {
    console.error('[latest-data] Error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
