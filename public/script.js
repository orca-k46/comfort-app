// public/script.js

const api = {
  latest: '/api/latest-data',
  provide: '/api/provide-data'
};
const elements = {
  db: document.getElementById('db-value'),
  ts: document.getElementById('timestamp'),
  icon: document.getElementById('icon'),
  text: document.getElementById('level-text'),
  card: document.getElementById('status-card'),
  feedback: document.getElementById('feedback-message'),
  btnMeasure: document.getElementById('btn-measure'),
  btnMain: document.getElementById('btn-main'),
  btnAdmin: document.getElementById('btn-admin'),
  mainView: document.getElementById('main-view'),
  adminView: document.getElementById('admin-view')
};

// ページ切替
elements.btnMain.addEventListener('click', () => {
  elements.btnMain.classList.add('active');
  elements.btnAdmin.classList.remove('active');
  elements.mainView.style.display = '';
  elements.adminView.style.display = 'none';
});
elements.btnAdmin.addEventListener('click', () => {
  elements.btnAdmin.classList.add('active');
  elements.btnMain.classList.remove('active');
  elements.adminView.style.display = '';
  elements.mainView.style.display = 'none';
});

// 最新データ取得→表示
async function loadAndDisplay() {
  try {
    const res = await fetch(api.latest);
    const { decibel, timestamp } = await res.json();
    updateUI(decibel, timestamp);
  } catch (e) {
    console.error('[Comfort App] loadAndDisplay Error:', e);
  }
}

// UI 更新ロジック
function updateUI(db, ts) {
  // db は数値前提。念のため fallback
  const value = Number.isFinite(db) ? db : 0;
  elements.db.textContent = value.toFixed(1);
  elements.ts.textContent = ts ? new Date(ts).toLocaleString() : '--';
  const lvl = Math.min(5, Math.floor(value / 10));
  const icons = ['😌','🙂','😐','😟','😫','😡'];
  elements.icon.textContent = icons[lvl];
  elements.text.textContent = `快適度レベル ${lvl}`;
  elements.card.className = `comfort-level-${lvl}`;
}

// 音量測定＆送信
elements.btnMeasure.addEventListener('click', async () => {
  elements.feedback.textContent = '測定中…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    ctx.createMediaStreamSource(stream).connect(analyser);
    analyser.fftSize = 2048;
    const data = new Uint8Array(analyser.frequencyBinCount);
    let sum = 0, count = 0;

    // 3秒間サンプリング（200ms 間隔）
    const end = Date.now() + 3000;
    while (Date.now() < end) {
      analyser.getByteFrequencyData(data);
      const rms = Math.sqrt(data.reduce((a, v) => a + v * v, 0) / data.length);
      const db = 20 * Math.log10(rms);
      sum += db;
      count++;
      await new Promise(r => setTimeout(r, 200));
    }

    const avgDb = sum / count;
    // NaN / Infinity 対策：有限数でなければ 0
    const safeDb = Number.isFinite(avgDb) ? avgDb : 0;

    // サーバへ送信
    const res = await fetch(api.provide, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decibel: safeDb })
    });
    const json = await res.json();
    updateUI(json.decibel, json.timestamp);
    elements.feedback.textContent = '送信完了！';
  } catch (e) {
    console.error('[Comfort App] Measurement Error:', e);
    elements.feedback.textContent = 'エラーが発生しました';
  }
});

// 初回ロード
loadAndDisplay();
