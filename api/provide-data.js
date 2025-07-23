// api/provide-data.js
const fs   = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  console.log('▶︎ [provide-data] start');  
  console.log('▶︎ [provide-data] method:', req.method);
  console.log('▶︎ [provide-data] headers:', req.headers);

  if (req.method !== 'POST') {
    console.log('✖️ [provide-data] wrong method');
    res.status(405).end();
    return;
  }

  // ボディを手動で読み込む
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
  }
  console.log('▶︎ [provide-data] raw body:', raw);

  let payload;
  try {
    payload = JSON.parse(raw);
    console.log('▶︎ [provide-data] parsed payload:', payload);
  } catch (err) {
    console.error('[provide-data] JSON parse error:', err);
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const decibel = Number(payload.decibel);
  if (!Number.isFinite(decibel)) {
    console.error('[provide-data] Invalid decibel:', payload.decibel);
    res.status(400).json({ error: 'Invalid decibel' });
    return;
  }

  const timestamp = new Date().toISOString();
  const data = { decibel, timestamp };
  const dbPath = path.join(__dirname, '..', 'db.json');

  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    console.log('▶︎ [provide-data] wrote db.json:', data);
  } catch (err) {
    console.error('[provide-data] Write error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
};
