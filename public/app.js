const userLabel = document.getElementById('user-label');
const logoutBtn = document.getElementById('logout-btn');
const thread = document.getElementById('chat-thread');
const textInput = document.getElementById('text-input');
const imageInput = document.getElementById('image-input');
const sendBtn = document.getElementById('send-btn');

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
