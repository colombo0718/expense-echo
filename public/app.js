const userLabel = document.getElementById('user-label');
const logoutBtn = document.getElementById('logout-btn');
const textForm = document.getElementById('text-form');
const textInput = document.getElementById('text-input');
const imageForm = document.getElementById('image-form');
const imageInput = document.getElementById('image-input');
const resultBox = document.getElementById('result');
const recentList = document.getElementById('recent');

async function ensureLogin() {
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (res.status === 401) {
    window.location.replace('/login.html');
    return null;
  }
  const data = await res.json();
  return data.user;
}

async function loadRecent() {
  const res = await fetch('/api/expenses?limit=20', { credentials: 'same-origin' });
  if (!res.ok) {
    recentList.textContent = '載入失敗';
    return;
  }
  const data = await res.json();
  recentList.innerHTML = '';
  if (!data.expenses?.length) {
    recentList.textContent = '還沒有紀錄。';
    return;
  }
  for (const row of data.expenses) {
    const li = document.createElement('li');
    const ts = new Date(row.ts * 1000).toLocaleString('zh-TW', { hour12: false });
    li.innerHTML = `
      <span class="amt">${row.currency ?? 'TWD'} ${row.amount}</span>
      <span class="vendor">${row.vendor ?? row.category ?? '消費'}</span>
      <span class="ts">${ts}</span>
    `;
    recentList.appendChild(li);
  }
}

function showResult(label, payload) {
  const ok = !payload.error;
  resultBox.className = `result-area ${ok ? 'ok' : 'err'}`;
  if (ok) {
    const items = (payload.items ?? []).map((i) => `${i.name}${i.price != null ? ` (${i.price})` : ''}`).join('、');
    resultBox.innerHTML = `
      <div><strong>${label}：${payload.vendor ?? '消費'} ${payload.amount} 元</strong></div>
      ${payload.category ? `<div>分類：${payload.category}</div>` : ''}
      ${items ? `<div>品項：${items}</div>` : ''}
      ${payload.latency_ms != null ? `<div class="meta">${payload.model ?? ''} · ${payload.latency_ms}ms</div>` : ''}
    `;
  } else {
    resultBox.textContent = payload.hint ?? payload.error ?? '失敗';
  }
}

textForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = textInput.value.trim();
  if (!text) return;
  resultBox.textContent = '處理中…';
  resultBox.className = 'result-area pending';
  const res = await fetch('/api/parse-text', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  const data = await res.json();
  showResult('文字記帳', data);
  if (res.ok) {
    textInput.value = '';
    await loadRecent();
  }
});

imageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = imageInput.files?.[0];
  if (!file) return;
  resultBox.textContent = '上傳並解析中…';
  resultBox.className = 'result-area pending';
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch('/api/parse-image', {
    method: 'POST',
    credentials: 'same-origin',
    body: fd,
  });
  const data = await res.json();
  showResult('收據', data);
  if (res.ok) {
    imageInput.value = '';
    await loadRecent();
  }
});

logoutBtn.addEventListener('click', async () => {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/login.html');
});

(async () => {
  const user = await ensureLogin();
  if (!user) return;
  userLabel.textContent = `${user.name ?? user.email} (${user.tier})`;
  await loadRecent();
})();
