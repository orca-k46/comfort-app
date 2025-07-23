// api/provide-data.js
const os   = require('os');
const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(os.tmpdir(), 'db.json');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  // ボディを手動パース
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error('[provide-data] JSON parse error:', err);
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  const decibel = Number(payload.decibel);
  if (!Number.isFinite(decibel)) {
    console.error('[provide-data] Invalid decibel:', payload.decibel);
    return res.status(400).json({ error: 'Invalid decibel' });
  }

  const timestamp = new Date().toISOString();
  const data = { decibel, timestamp };

  try {
    // /tmp/db.json に書き込む
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('[provide-data] wrote:', data);
  } catch (err) {
    console.error('[provide-data] Write error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
};
