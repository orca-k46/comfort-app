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
  // localStorage から復元
  const saved = localStorage.getItem('comfortData');
  if (saved) {
    try {
      const { decibel, timestamp } = JSON.parse(saved);
      updateUI(decibel, timestamp);
    } catch (e) {
      console.error('restore error', e);
    }
  }
  // サーバから最新取得
  try {
    const res = await fetch(api.latest);
    if (res.ok) {
      const { decibel, timestamp } = await res.json();
      updateUI(decibel, timestamp);
    }
  } catch (e) {
    console.error('load error', e);
  }
}

// UI 更新ロジック
function updateUI(rawValue, ts) {
  // rawValue は 0–60 の正規化デシベル
  const value = Number.isFinite(rawValue) ? rawValue : 0;
  elements.db.textContent = value.toFixed(1);
  elements.ts.textContent = ts ? new Date(ts).toLocaleString() : '--';

  // 0–60dB を 6 段階（0–5）に分割し、
  // 静か(0dB)が快適度5、大きい(>=50dB)が快適度0になるよう反転
  const bucket = Math.min(5, Math.floor(value / 10));
  const lvl = Math.max(0, 5 - bucket);
  const icons = ['😡','😫','😟','😐','🙂','😌'];
  elements.icon.textContent = icons[lvl];
  elements.text.textContent = `快適度レベル ${lvl}`;
  elements.card.className = `comfort-level-${lvl}`;

  // localStorage に保存
  try {
    localStorage.setItem(
      'comfortData',
      JSON.stringify({ decibel: value, timestamp: ts })
    );
  } catch (e) {
    console.error('save error', e);
  }
}

// 音量測定＆送信
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

    while (Date.now() < end) {
      analyser.getFloatTimeDomainData(buffer);
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        sumSq += buffer[i] * buffer[i];
      }
      const rms = Math.sqrt(sumSq / buffer.length);
      // raw dBFS (negative or -Infinity)
      const rawDb = 20 * Math.log10(rms || 1e-8);
      // 0–60範囲に正規化（rawDb + 60 を 0–60 にクランプ）
      const normDb = Math.max(0, Math.min(60, rawDb + 60));
      sum += normDb;
      count++;
      await new Promise(r => setTimeout(r, 200));
    }

    const avg = sum / count;
    const safe = Number.isFinite(avg) ? avg : 0;

    const res = await fetch(api.provide, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decibel: safe })
    });
    if (!res.ok) {
      console.error('API Error', res.status, await res.text());
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
