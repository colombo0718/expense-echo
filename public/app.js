const userLabel = document.getElementById('user-label');
const logoutBtn = document.getElementById('logout-btn');
const thread = document.getElementById('chat-thread');
const textInput = document.getElementById('text-input');
const cameraInput = document.getElementById('camera-input');
const galleryInput = document.getElementById('gallery-input');
const actionBtn = document.getElementById('action-btn');

// 跨裝置增量同步：記錄目前看到的最大 chat id、切回 tab 時拉新訊息 append
let lastMsgId = 0;
const seenIds = new Set();

const fmtTs = (ts) =>
  new Date(ts * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

const isImageKey = (s) => typeof s === 'string' && /^[0-9a-f-]{36}\/\d+-[0-9a-f-]+\.jpg$/i.test(s);

function el(tag, className, ...children) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  for (const c of children) {
    if (c == null) continue;
    if (typeof c === 'string') e.appendChild(document.createTextNode(c));
    else e.appendChild(c);
  }
  return e;
}

function renderMessage(msg) {
  const wrap = el('div', `msg msg-${msg.role}`);
  wrap.dataset.id = msg.id;

  if (msg.role === 'yiyi') {
    wrap.appendChild(el('div', 'avatar', '🧮'));
  }

  const bubbleWrap = el('div', 'bubble-wrap');
  const bubble = el('div', `bubble bubble-${msg.role} bubble-${msg.msg_type}`);

  if (msg.msg_type === 'image') {
    bubble.appendChild(el('div', 'img-placeholder', '📷 收據'));
  } else if (msg.msg_type === 'result') {
    let payload = {};
    try { payload = JSON.parse(msg.payload || '{}'); } catch {}
    if (payload.amount != null) {
      const head = el('div', 'result-head', `✓ ${payload.vendor || payload.category || '消費'} · ${payload.amount} 元`);
      bubble.appendChild(head);
      if (payload.category) bubble.appendChild(el('div', 'result-sub', `分類：${payload.category}`));
      if (payload.items?.length) {
        const itemsStr = payload.items.map((i) => `${i.name}${i.price != null ? ` (${i.price})` : ''}`).join('、');
        bubble.appendChild(el('div', 'result-sub', `品項：${itemsStr}`));
      }
      if (payload.latency_ms != null) bubble.appendChild(el('div', 'result-meta', `${payload.model || ''} · ${payload.latency_ms}ms`));
    } else {
      bubble.appendChild(el('div', 'result-sub', '（沒抓到資料）'));
    }
  } else {
    bubble.textContent = msg.content || '';
  }

  bubbleWrap.appendChild(bubble);
  if (msg.ts) bubbleWrap.appendChild(el('div', 'ts', fmtTs(msg.ts)));
  wrap.appendChild(bubbleWrap);

  return wrap;
}

function appendMessage(msg) {
  // 真實 DB id（number）才 dedup、local-/r-/err- 開頭的不算
  if (typeof msg.id === 'number') {
    if (seenIds.has(msg.id)) return;
    seenIds.add(msg.id);
    if (msg.id > lastMsgId) lastMsgId = msg.id;
  }
  thread.appendChild(renderMessage(msg));
  thread.scrollTop = thread.scrollHeight;
}

function appendPending(role, text) {
  const wrap = el('div', `msg msg-${role} msg-pending`);
  if (role === 'yiyi') wrap.appendChild(el('div', 'avatar', '🧮'));
  const bubbleWrap = el('div', 'bubble-wrap');
  const bubble = el('div', `bubble bubble-${role} bubble-pending`);
  bubble.textContent = text;
  bubbleWrap.appendChild(bubble);
  wrap.appendChild(bubbleWrap);
  thread.appendChild(wrap);
  thread.scrollTop = thread.scrollHeight;
  return wrap;
}

async function ensureLogin() {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (res.status === 401) {
    window.location.replace('/login.html');
    return null;
  }
  const data = await res.json();
  return data.user;
}

async function loadChats() {
  thread.innerHTML = '';
  seenIds.clear();
  lastMsgId = 0;
  const res = await fetch('/api/chats?limit=80', { credentials: 'same-origin' });
  if (!res.ok) {
    thread.appendChild(el('div', 'loading', '對話載入失敗、再整理一次頁面試試'));
    return;
  }
  const data = await res.json();
  if (!data.chats?.length) {
    appendMessage({
      id: 'greet',
      role: 'yiyi',
      msg_type: 'text',
      content: '嗨～奴家是依依～公子今天想記點什麼、還是直接傳張收據給奴家看看～',
      ts: Math.floor(Date.now() / 1000),
    });
    return;
  }
  for (const c of data.chats) appendMessage(c);
}

// 切回 tab / window focus 時觸發、拉 lastMsgId 之後的新訊息 append
let syncInFlight = false;
async function syncNewChats() {
  if (syncInFlight) return;
  if (lastMsgId === 0) return; // 還沒初始 load 完
  syncInFlight = true;
  try {
    const res = await fetch(`/api/chats?since_id=${lastMsgId}&limit=200`, {
      credentials: 'same-origin',
    });
    if (!res.ok) return;
    const data = await res.json();
    for (const c of data.chats ?? []) appendMessage(c);
  } catch (err) {
    console.warn('[sync] failed:', err);
  } finally {
    syncInFlight = false;
  }
}

// 輪詢同步：tab 可見時每 8 秒拉一次新訊息、隱藏自動暫停
// 早期 user 量小、優先體感、口碑起來再省
const SYNC_POLL_MS = 8000;
let pollTimer = null;

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible' && lastMsgId > 0) {
      syncNewChats();
    }
  }, SYNC_POLL_MS);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    syncNewChats();   // 切回來立刻補同步
    startPolling();   // 重啟輪詢
  } else {
    stopPolling();    // 隱藏就停
  }
});

window.addEventListener('focus', syncNewChats);

async function sendText(text) {
  const pending = appendPending('yiyi', '依依正在看⋯⋯');
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    pending.remove();
    if (!res.ok) {
      appendMessage({
        id: `err-${Date.now()}`,
        role: 'system',
        msg_type: 'text',
        content: '（發送失敗、再試一次）',
        ts: Math.floor(Date.now() / 1000),
      });
      return;
    }
    const data = await res.json();
    if (data.parsed) {
      appendMessage({
        id: `r-${data.expense_id}`,
        role: 'system',
        msg_type: 'result',
        payload: JSON.stringify({
          ...data.parsed,
          model: data.metrics?.data_layer?.model,
          latency_ms: data.metrics?.data_layer?.latency_ms,
        }),
        ts: Math.floor(Date.now() / 1000),
      });
    }
    appendMessage({
      ...data.yiyi_msg,
      ts: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    pending.remove();
    console.error(err);
  }
}

async function sendImage(file) {
  const pending = appendPending('yiyi', '依依正在解析收據⋯⋯');
  try {
    const fd = new FormData();
    fd.append('image', file);
    const res = await fetch('/api/chat', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    pending.remove();
    if (!res.ok) {
      appendMessage({
        id: `err-${Date.now()}`,
        role: 'system',
        msg_type: 'text',
        content: '（上傳失敗、再試一次）',
        ts: Math.floor(Date.now() / 1000),
      });
      return;
    }
    const data = await res.json();
    if (data.parsed) {
      appendMessage({
        id: `r-${data.expense_id}`,
        role: 'system',
        msg_type: 'result',
        payload: JSON.stringify({
          ...data.parsed,
          model: data.metrics?.data_layer?.model,
          latency_ms: data.metrics?.data_layer?.latency_ms,
        }),
        ts: Math.floor(Date.now() / 1000),
      });
    }
    appendMessage({
      ...data.yiyi_msg,
      ts: Math.floor(Date.now() / 1000),
    });
  } catch (err) {
    pending.remove();
    console.error(err);
  }
}

// === 輸入欄 dual-mode（空文字 = 🎤 / 有文字 = ➤）===
function refreshActionBtn() {
  if (actionBtn.classList.contains('recording') || actionBtn.classList.contains('busy')) return;
  const hasText = textInput.value.trim().length > 0;
  if (hasText) {
    actionBtn.classList.add('send-mode');
    actionBtn.textContent = '➤';
    actionBtn.title = '傳送';
  } else {
    actionBtn.classList.remove('send-mode');
    actionBtn.textContent = '🎤';
    actionBtn.title = '錄音';
  }
}

async function sendCurrentText() {
  const text = textInput.value.trim();
  if (!text) return;
  appendMessage({
    id: `local-${Date.now()}`,
    role: 'user',
    msg_type: 'text',
    content: text,
    ts: Math.floor(Date.now() / 1000),
  });
  textInput.value = '';
  textInput.style.height = 'auto';
  refreshActionBtn();
  await sendText(text);
}

textInput.addEventListener('input', () => {
  textInput.style.height = 'auto';
  textInput.style.height = Math.min(textInput.scrollHeight, 160) + 'px';
  refreshActionBtn();
});

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (textInput.value.trim()) sendCurrentText();
  }
});

function attachImageInput(input) {
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (!file) return;
    appendMessage({
      id: `local-${Date.now()}`,
      role: 'user',
      msg_type: 'image',
      content: file.name,
      ts: Math.floor(Date.now() / 1000),
    });
    input.value = '';
    await sendImage(file);
  });
}
attachImageInput(cameraInput);
attachImageInput(galleryInput);

// === 語音輸入（Whisper STT）===
let mediaRecorder = null;
let recordedChunks = [];
let recordingStream = null;

function pickAudioMime() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return '';
}

async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia) {
    alert('這個瀏覽器不支援錄音、用打字或拍照吧～');
    return;
  }

  // 中間態：等系統權限對話框
  actionBtn.classList.remove('send-mode');
  actionBtn.classList.add('busy');
  actionBtn.textContent = '⋯';
  actionBtn.title = '等麥克風權限⋯';

  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    actionBtn.classList.remove('busy');
    refreshActionBtn();
    const msg = err?.name || err?.message || String(err);
    alert('麥克風無法啟動：' + msg + '\n（檢查瀏覽器網址列旁的權限設定）');
    return;
  }

  const mime = pickAudioMime();
  const options = mime ? { mimeType: mime } : undefined;
  try {
    mediaRecorder = new MediaRecorder(recordingStream, options);
  } catch {
    try {
      mediaRecorder = new MediaRecorder(recordingStream);
    } catch (err) {
      recordingStream.getTracks().forEach((t) => t.stop());
      recordingStream = null;
      actionBtn.classList.remove('busy');
      refreshActionBtn();
      alert('MediaRecorder 啟動失敗：' + (err?.message || err));
      return;
    }
  }

  recordedChunks = [];
  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  });
  mediaRecorder.addEventListener('stop', handleRecordingStop);
  mediaRecorder.start();

  // 拿到 permission、進真正錄音狀態
  actionBtn.classList.remove('busy');
  actionBtn.classList.add('recording');
  actionBtn.textContent = '⏹';
  actionBtn.title = '再按一下停止';
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (recordingStream) {
    recordingStream.getTracks().forEach((t) => t.stop());
    recordingStream = null;
  }
  actionBtn.classList.remove('recording');
  actionBtn.classList.add('busy');
  actionBtn.textContent = '⋯';
  actionBtn.title = '處理中';
}

async function handleRecordingStop() {
  const mime = mediaRecorder?.mimeType || 'audio/webm';
  const blob = new Blob(recordedChunks, { type: mime });
  recordedChunks = [];
  console.log('[mic] recording stopped, blob size:', blob.size, 'mime:', mime);

  if (blob.size === 0) {
    alert('沒錄到聲音、blob 是空的、再試一次');
    resetMicBtn();
    return;
  }

  let res;
  try {
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    const fd = new FormData();
    fd.append('audio', blob, `recording.${ext}`);
    console.log('[mic] uploading', blob.size, 'bytes to /api/transcribe');
    res = await fetch('/api/transcribe', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    console.log('[mic] /api/transcribe responded:', res.status);
  } catch (err) {
    console.error('[mic] fetch error:', err);
    alert('呼叫 /api/transcribe 失敗：' + (err?.message || err));
    resetMicBtn();
    return;
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    alert('/api/transcribe 回應不是 JSON、status=' + res.status);
    resetMicBtn();
    return;
  }
  console.log('[mic] transcribe response:', data);

  if (!res.ok) {
    alert('轉文字失敗（status ' + res.status + '）：\n' + JSON.stringify(data, null, 2));
    resetMicBtn();
    return;
  }

  if (!data.text) {
    alert('Whisper 回了 200 但沒文字：\n' + JSON.stringify(data, null, 2));
    resetMicBtn();
    return;
  }

  // 塞進輸入框、user 自己決定要不要再修 / 送
  textInput.value = (textInput.value ? textInput.value + ' ' : '') + data.text;
  textInput.dispatchEvent(new Event('input'));
  textInput.focus();
  resetMicBtn();
}

function resetMicBtn() {
  actionBtn.classList.remove('recording', 'busy');
  refreshActionBtn();
}

actionBtn.addEventListener('click', () => {
  if (actionBtn.classList.contains('busy')) return;
  if (actionBtn.classList.contains('recording')) {
    stopRecording();
    return;
  }
  // 有文字 → 傳送、沒文字 → 錄音
  if (textInput.value.trim()) {
    sendCurrentText();
    return;
  }
  startRecording();
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/login.html');
});

(async () => {
  const user = await ensureLogin();
  if (!user) return;
  userLabel.textContent = `${user.name ?? user.email} · ${user.tier}`;
  await loadChats();
  startPolling();
})();
