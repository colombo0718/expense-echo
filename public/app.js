const userLabel = document.getElementById('user-label');
const logoutBtn = document.getElementById('logout-btn');
const thread = document.getElementById('chat-thread');
const textInput = document.getElementById('text-input');
const imageInput = document.getElementById('image-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');

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

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

sendBtn.addEventListener('click', async () => {
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
  await sendText(text);
});

imageInput.addEventListener('change', async () => {
  const file = imageInput.files?.[0];
  if (!file) return;
  appendMessage({
    id: `local-${Date.now()}`,
    role: 'user',
    msg_type: 'image',
    content: file.name,
    ts: Math.floor(Date.now() / 1000),
  });
  imageInput.value = '';
  await sendImage(file);
});

textInput.addEventListener('input', () => {
  textInput.style.height = 'auto';
  textInput.style.height = Math.min(textInput.scrollHeight, 160) + 'px';
});

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
  try {
    recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    alert('沒拿到麥克風權限、檢查瀏覽器設定～');
    return;
  }
  const mime = pickAudioMime();
  const options = mime ? { mimeType: mime } : undefined;
  try {
    mediaRecorder = new MediaRecorder(recordingStream, options);
  } catch {
    mediaRecorder = new MediaRecorder(recordingStream);
  }
  recordedChunks = [];
  mediaRecorder.addEventListener('dataavailable', (e) => {
    if (e.data && e.data.size > 0) recordedChunks.push(e.data);
  });
  mediaRecorder.addEventListener('stop', handleRecordingStop);
  mediaRecorder.start();
  micBtn.classList.add('recording');
  micBtn.textContent = '⏹';
  micBtn.title = '再按一下停止';
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  if (recordingStream) {
    recordingStream.getTracks().forEach((t) => t.stop());
    recordingStream = null;
  }
  micBtn.classList.remove('recording');
  micBtn.classList.add('busy');
  micBtn.textContent = '⋯';
  micBtn.title = '處理中';
}

async function handleRecordingStop() {
  const mime = mediaRecorder?.mimeType || 'audio/webm';
  const blob = new Blob(recordedChunks, { type: mime });
  recordedChunks = [];
  if (blob.size === 0) {
    resetMicBtn();
    return;
  }
  try {
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : 'webm';
    const fd = new FormData();
    fd.append('audio', blob, `recording.${ext}`);
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      credentials: 'same-origin',
      body: fd,
    });
    const data = await res.json();
    if (!res.ok || !data.text) {
      appendMessage({
        id: `err-stt-${Date.now()}`,
        role: 'system',
        msg_type: 'text',
        content: data.hint || '（語音轉文字失敗、再試一次）',
        ts: Math.floor(Date.now() / 1000),
      });
      return;
    }
    // 塞進輸入框、user 自己決定要不要再修 / 送
    textInput.value = (textInput.value ? textInput.value + ' ' : '') + data.text;
    textInput.dispatchEvent(new Event('input'));
    textInput.focus();
  } catch (err) {
    console.error(err);
  } finally {
    resetMicBtn();
  }
}

function resetMicBtn() {
  micBtn.classList.remove('recording', 'busy');
  micBtn.textContent = '🎤';
  micBtn.title = '按一下開始錄音、再按一下停止';
}

micBtn.addEventListener('click', () => {
  if (micBtn.classList.contains('busy')) return;
  if (micBtn.classList.contains('recording')) {
    stopRecording();
  } else {
    startRecording();
  }
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
})();
