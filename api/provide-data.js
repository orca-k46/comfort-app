// api/provide-data.js
const fs   = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // POST 以外は拒否
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  // ─── ボディの手動パース ───
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (err) {
    console.error('[provide-data] JSON parse error:', err);
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  // decibel を取り出し、数値チェック
  const decibel = Number(payload.decibel);
  if (!Number.isFinite(decibel)) {
    console.error('[provide-data] Invalid decibel:', payload.decibel);
    res.status(400).json({ error: 'Invalid decibel' });
    return;
  }

  // タイムスタンプ付きデータを作成＆書き込み
  const timestamp = new Date().toISOString();
  const data = { decibel, timestamp };
  const dbPath = path.join(__dirname, '..', 'db.json');

  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[provide-data] Write error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
    return;
  }

  // 正常レスポンス
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(data);
};
