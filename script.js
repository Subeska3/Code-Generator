    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('theme-btn').textContent = savedTheme === 'dark' ? '☼' : '☾';
    });

    let ollamaUrl = localStorage.getItem('ollama_url') || 'http://localhost:11434';
    let currentModel = localStorage.getItem('model') || 'gemma4';
    let systemPrompt = 'You are an expert coding assistant. Be concise, write clean code, and always explain your reasoning briefly.';
    let history = [];
    let isStreaming = false;

    document.getElementById('ollama-url').value = ollamaUrl;
    document.getElementById('endpoint-display').textContent = ollamaUrl.replace('http://', '').replace('https://', '');
    document.getElementById('model-select').value = currentModel;
    document.getElementById('model-badge').textContent = currentModel;

    async function checkConnection() {
      try {
        const r = await fetch(ollamaUrl + '/api/tags', { signal: AbortSignal.timeout(2000) });
        if (r.ok) {
          document.getElementById('status-dot').classList.remove('offline');
          return true;
        }
      } catch { }
      document.getElementById('status-dot').classList.add('offline');
      return false;
    }

    checkConnection();

    function updateModel(val) {
      currentModel = val;
      document.getElementById('model-badge').textContent = val;
      localStorage.setItem('model', val);
    }

    function saveSettings() {
      ollamaUrl = document.getElementById('ollama-url').value.replace(/\/$/, '');
      localStorage.setItem('ollama_url', ollamaUrl);
      document.getElementById('endpoint-display').textContent = ollamaUrl.replace('http://', '').replace('https://', '');
      document.getElementById('settings-modal').classList.remove('open');
      checkConnection().then(ok => {
        if (!ok) showToast('Cannot reach Ollama at ' + ollamaUrl + '. Is it running?');
        else showToast('Connected!', true);
      });
    }

    function setPreset(btn, prompt) {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      systemPrompt = prompt;
    }

    function autoResize(el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 160) + 'px';
    }

    function handleKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); sendMessage(); }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    }

    function insertSnippet() {
      const ta = document.getElementById('user-input');
      const v = ta.value;
      ta.value = v + (v ? '\n' : '') + '```\n\n```';
      ta.focus();
      autoResize(ta);
    }

    function insertSnippet2() {
      const ta = document.getElementById('user-input');
      ta.value = 'Explain this code:\n\n```\n\n```';
      ta.focus();
      autoResize(ta);
    }

    function sendChip(text) {
      document.getElementById('user-input').value = text;
      autoResize(document.getElementById('user-input'));
      sendMessage();
    }

    function clearChat() {
      history = [];
      const msgs = document.getElementById('messages');
      msgs.innerHTML = '';
      const welcome = document.createElement('div');
      welcome.className = 'welcome';
      welcome.id = 'welcome';
      welcome.innerHTML = `
    <div class="welcome-icon">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M6 9l5 5-5 5M13 19h9" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </div>
    <h2>Gemma 4 — on your machine</h2>
    <p>100% local. No tokens billed. Your code never leaves your Mac.</p>
    <div class="welcome-chips">
      <button class="chip" onclick="sendChip('Explain how async/await works in Python')">async/await in Python</button>
      <button class="chip" onclick="sendChip('Write a Dockerfile for a Node.js app')">Dockerfile for Node</button>
      <button class="chip" onclick="sendChip('Review this code for bugs:\\n\\ndef divide(a, b):\\n    return a / b')">Review code for bugs</button>
      <button class="chip" onclick="sendChip('What is the time complexity of quicksort?')">Quicksort complexity</button>
    </div>`;
      msgs.appendChild(welcome);
    }

    function showToast(msg, success = false) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.style.color = success ? 'var(--accent)' : 'var(--red)';
      t.style.borderColor = success ? '#4ade8040' : '#f8717140';
      t.style.background = success ? '#0d1a10' : '#1e1010';
      t.classList.add('show');
      setTimeout(() => t.classList.remove('show'), 3000);
    }

    function now() {
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Setup marked.js renderer
    const renderer = new marked.Renderer();
    renderer.code = function (codeOrToken, language) {
      let codeText = typeof codeOrToken === 'object' ? codeOrToken.text : codeOrToken;
      let lang = typeof codeOrToken === 'object' ? codeOrToken.lang : language;
      const langTag = lang ? `<span class="lang-tag">${lang}</span>` : '';
      const escapedCode = codeText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      return `<pre><button class="copy-btn" onclick="copyCode(this)">copy</button>${langTag}<code>${escapedCode}</code></pre>`;
    };
    marked.setOptions({ renderer });
    marked.use(markedKatex({ throwOnError: false }));

    function renderBubble(text) {
      return marked.parse(text);
    }

    function copyCode(btn) {
      const code = btn.closest('pre').querySelector('code').textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'copied!';
        setTimeout(() => btn.textContent = 'copy', 1500);
      });
    }

    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      document.getElementById('theme-btn').textContent = next === 'dark' ? '☼' : '☾';
    }

    function appendMsg(role, text) {
      const welcome = document.getElementById('welcome');
      if (welcome) welcome.remove();

      const msgs = document.getElementById('messages');
      const wrap = document.createElement('div');
      wrap.className = 'msg ' + role;

      const avatar = role === 'assistant' ? 'G4' : 'you';
      const time = now();

      wrap.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-content">
      <div class="msg-bubble" id="bubble-latest"></div>
      <div class="msg-time">${time}</div>
    </div>`;

      msgs.appendChild(wrap);
      msgs.scrollTop = msgs.scrollHeight;
      const bubble = wrap.querySelector('#bubble-latest');
      if (text) bubble.innerHTML = renderBubble(text);
      bubble.removeAttribute('id');
      return bubble;
    }

    async function sendMessage() {
      if (isStreaming) return;
      const ta = document.getElementById('user-input');
      const text = ta.value.trim();
      if (!text) return;

      ta.value = '';
      autoResize(ta);
      document.getElementById('send-btn').disabled = true;
      isStreaming = true;

      appendMsg('user', text);
      history.push({ role: 'user', content: text });

      const thinkWrap = document.createElement('div');
      thinkWrap.className = 'msg assistant';
      thinkWrap.innerHTML = `<div class="msg-avatar">G4</div><div class="msg-content"><div class="thinking-indicator"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div></div>`;
      document.getElementById('messages').appendChild(thinkWrap);
      document.getElementById('scroll-anchor').scrollIntoView({ behavior: 'smooth', block: 'end' });

      const temp = parseFloat(document.getElementById('temp-slider').value) / 100;

      try {
        const res = await fetch(ollamaUrl + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: currentModel,
            stream: true,
            options: { temperature: temp },
            messages: [
              { role: 'system', content: systemPrompt },
              ...history
            ]
          })
        });

        if (!res.ok) throw new Error('HTTP ' + res.status);

        thinkWrap.remove();
        const bubble = appendMsg('assistant', '');
        let full = '';

        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let buffer = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            if (buffer.trim()) {
              try {
                const j = JSON.parse(buffer);
                if (j.message?.content) {
                  full += j.message.content;
                  bubble.innerHTML = renderBubble(full);
                  document.getElementById('scroll-anchor').scrollIntoView({ block: 'end' });
                }
              } catch { }
            }
            break;
          }
          buffer += dec.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop();
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const j = JSON.parse(line);
              if (j.message?.content) {
                full += j.message.content;
                bubble.innerHTML = renderBubble(full);
                document.getElementById('scroll-anchor').scrollIntoView({ block: 'end' });
              }
            } catch { }
          }
        }
        history.push({ role: 'assistant', content: full });

      } catch (err) {
        thinkWrap.remove();
        const connected = await checkConnection();
        if (!connected) {
          showToast('Ollama not reachable. Run: ollama serve');
        } else {
          showToast('Model error: ' + err.message + '. Try: ollama pull ' + currentModel);
        }
      } finally {
        isStreaming = false;
        document.getElementById('send-btn').disabled = false;
        document.getElementById('user-input').focus();
      }
    }
