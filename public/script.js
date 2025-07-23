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
  const saved = localStorage.getItem('comfortData');
  if (saved) {
    try {
      const { decibel, timestamp } = JSON.parse(saved);
      updateUI(decibel, timestamp);
    } catch (e) { console.warn('restore failed', e); }
  }
  try {
    const res = await fetch(api.latest);
    if (res.ok) {
      const { decibel, timestamp } = await res.json();
      updateUI(decibel, timestamp);
    }
  } catch (e) { console.error('load error', e); }
}

// UI 更新ロジック
function updateUI(db, ts) {
  const value = Number.isFinite(db) ? db : 0;
  elements.db.textContent = value.toFixed(1);
  elements.ts.textContent = ts ? new Date(ts).toLocaleString() : '--';
  const lvl = Math.min(5, Math.floor(value / 10));
  const icons = ['😌','🙂','😐','😟','😫','😡'];
  elements.icon.textContent = icons[lvl];
  elements.text.textContent = `快適度レベル ${lvl}`;
  elements.card.className = `comfort-level-${lvl}`;
  try {
    localStorage.setItem('comfortData',
      JSON.stringify({ decibel: value, timestamp: ts }));
  } catch {}
}

// 音量測定＆送信（time domain に切替）
elements.btnMeasure.addEventListener('click', async () => {
  elements.feedback.textContent = '測定中…';
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const buffer = new Float32Array(analyser.fftSize);
    let sum = 0, count = 0;

    const end = Date.now() + 3000;
    console.log('[measure] start sampling');
    while (Date.now() < end) {
      analyser.getFloatTimeDomainData(buffer);
      // RMS 計算
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) sumSq += buffer[i] * buffer[i];
      const rms = Math.sqrt(sumSq / buffer.length);
      const dbInstant = 20 * Math.log10(rms);
      console.log(
        '[measure] rms:', rms.toFixed(3),
        ' dbInstant:', isFinite(dbInstant) ? dbInstant.toFixed(1) : 'NaN'
      );
      sum += isFinite(dbInstant) ? dbInstant : 0;
      count++;
      await new Promise(r => setTimeout(r, 200));
    }
    console.log('[measure] end sampling');

    const avgDb = sum / count;
    const safeDb = Number.isFinite(avgDb) ? avgDb : 0;

    const res = await fetch(api.provide, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decibel: safeDb })
    });
    if (!res.ok) {
      console.error('API error', await res.text());
      elements.feedback.textContent = `サーバーエラー(${res.status})`;
      return;
    }
    const json = await res.json();
    updateUI(json.decibel, json.timestamp);
    elements.feedback.textContent = '送信完了！';
  } catch (e) {
    console.error('Measurement Error:', e);
    elements.feedback.textContent = 'エラーが発生しました';
  }
});

// 初回ロード
loadAndDisplay();
