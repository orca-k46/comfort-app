const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// データファイル
const DB = path.join(__dirname, 'db.json');
// public 配下を静的配信
app.use('/', express.static(path.join(__dirname, 'public')));

// 最新データ取得
app.get('/api/latest-data', (_, res) => {
  const data = JSON.parse(fs.readFileSync(DB, 'utf-8'));
  res.json(data);
});

// データ受信・保存
app.post('/api/provide-data', (req, res) => {
  const { decibel } = req.body;
  const timestamp = new Date().toISOString();
  const data = { decibel, timestamp };
  fs.writeFileSync(DB, JSON.stringify(data, null, 2));
  res.json(data);
});

// ポート起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
