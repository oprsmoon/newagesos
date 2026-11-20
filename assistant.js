// Suraksha AI Assistant – Gemini-powered, animated avatar + voice in/out.
// SECURITY: the Gemini API key is entered by the user and stored ONLY in this
// device's localStorage. NEVER hardcode or commit API keys to the repository.

(() => {
  const KEY_STORE = 'suraksha-gemini-key';
  const history = [];
  let speaking = false, listening = false, thinking = false;

  const SYSTEM = `You are Suraksha AI, a calm, reassuring safety assistant inside an Indian personal-safety app used during emergencies.
Rules:
- ALWAYS reply in the same language the user used (Hindi, English, Hinglish, or any Indian language).
- Financial fraud/scam: tell them to call 1930 IMMEDIATELY (golden hour), then file at cybercrime.gov.in.
- Harassment/blackmail/sextortion: do not pay or panic, preserve evidence (screenshots), report at cybercrime.gov.in, FIR at local police station. Women's helpline: 181.
- Physical danger: call 112 and press the SOS button in this app.
- Be practical, step-by-step, under 80 words. Warm and steady tone, like a trained operator.
- Offer emotional reassurance. Never invent legal guarantees or pretend to be police.`;

  /* ---------------- Gemini ---------------- */
  async function askGemini(text) {
    const key = localStorage.getItem(KEY_STORE);
    if (!key) return '⚠️ Add your Gemini API key in the ⚙️ settings below to activate me.';
    history.push({ role: 'user', parts: [{ text }] });
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(key), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_instruction: { parts: [{ text: SYSTEM }] }, contents: history.slice(-12) })
      });
      const data = await res.json();
      const reply = (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0].text)
        || ('⚠️ ' + ((data.error && data.error.message) || 'No response from Gemini'));
      history.push({ role: 'model', parts: [{ text: reply }] });
      return reply;
    } catch (e) {
      return '⚠️ Network error: ' + e.message;
    }
  }

  /* ---------------- Text to speech (mouth sync via speaking flag) ---------------- */
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const clean = text.replace(/[*_#`>\-]/g, ' ');
    const u = new SpeechSynthesisUtterance(clean);
    const wantHi = /[\u0900-\u097F]/.test(text) || (typeof lang !== 'undefined' && lang === 'hi');
    u.lang = wantHi ? 'hi-IN' : 'en-IN';
    const voices = speechSynthesis.getVoices();
    const v = voices.find(v => v.lang === u.lang) || voices.find(v => v.lang.startsWith(u.lang.slice(0, 2)));
    if (v) u.voice = v;
    u.rate = 1.02; u.pitch = 1.05;
    u.onstart = () => { speaking = true; setAiStatus('🗣️ Speaking…'); };
    u.onend = () => { speaking = false; setAiStatus('🟢 Ready'); };
    speechSynthesis.speak(u);
  }

  /* ---------------- Speech recognition (voice input) ---------------- */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec = null;
  function startListening() {
    if (!SR) { setAiStatus('⚠️ Voice input not supported in this browser – type instead.'); return; }
    if (listening) { rec.stop(); return; }
    rec = new SR();
    rec.lang = (typeof lang !== 'undefined' && lang === 'hi') ? 'hi-IN' : 'en-IN';
    rec.interimResults = false;
    rec.onstart = () => { listening = true; setAiStatus('🎧 Listening…'); document.getElementById('aiMicBtn').classList.add('active'); };
    rec.onend = () => { listening = false; document.getElementById('aiMicBtn').classList.remove('active'); };
    rec.onresult = e => {
      const text = e.results[0][0].transcript;
      document.getElementById('aiInput').value = text;
      sendToAI();
    };
    rec.onerror = () => { listening = false; setAiStatus('⚠️ Mic error – try typing.'); };
    rec.start();
  }

  /* ---------------- Chat UI ---------------- */
  function setAiStatus(t) { document.getElementById('aiStatus').textContent = t; }
  function addBubble(text, who) {
    const log = document.getElementById('chatLog');
    const div = document.createElement('div');
    div.className = 'bubble ' + who;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  async function sendToAI() {
    const input = document.getElementById('aiInput');
    const text = input.value.trim();
    if (!text || thinking) return;
    input.value = '';
    addBubble(text, 'user');
    thinking = true;
    setAiStatus('🤔 Thinking…');
    const reply = await askGemini(text);
    thinking = false;
    addBubble(reply, 'ai');
    speak(reply);
  }

  document.getElementById('aiSendBtn').onclick = sendToAI;
  document.getElementById('aiInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendToAI(); });
  document.getElementById('aiMicBtn').onclick = startListening;
  document.getElementById('saveKey').onclick = () => {
    const k = document.getElementById('geminiKey').value.trim();
    if (k) {
      localStorage.setItem(KEY_STORE, k);
      document.getElementById('geminiKey').value = '';
      setAiStatus('🟢 Ready – key saved on this device only');
    }
  };
  if (localStorage.getItem(KEY_STORE)) setAiStatus('🟢 Ready');

  /* ---------------- Animated avatar (canvas, zero dependencies) ---------------- */
  const canvas = document.getElementById('avatarCanvas');
  const ctx = canvas.getContext('2d');
  let blink = 0, nextBlink = Date.now() + 2000;

  function drawAvatar(ts) {
    const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);

    // Background glow ring – pulses when listening/speaking
    const pulse = 6 + Math.sin(ts / 250) * (speaking ? 8 : listening ? 5 : 2);
    const ring = ctx.createRadialGradient(cx, cy, 60, cx, cy, 105 + pulse);
    ring.addColorStop(0, 'rgba(14,165,233,0)');
    ring.addColorStop(0.8, speaking ? 'rgba(124,58,237,0.55)' : 'rgba(14,165,233,0.45)');
    ring.addColorStop(1, 'rgba(14,165,233,0)');
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, w, h);

    // Head
    const head = ctx.createLinearGradient(cx - 70, cy - 70, cx + 70, cy + 70);
    head.addColorStop(0, '#1e293b'); head.addColorStop(1, '#0f172a');
    ctx.fillStyle = head;
    ctx.beginPath(); ctx.arc(cx, cy, 72, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(14,165,233,0.7)'; ctx.lineWidth = 3; ctx.stroke();

    // Antenna
    ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx, cy - 72); ctx.lineTo(cx, cy - 88); ctx.stroke();
    ctx.fillStyle = speaking ? '#a78bfa' : '#38bdf8';
    ctx.beginPath(); ctx.arc(cx, cy - 93, 5 + (speaking ? Math.sin(ts / 120) * 2 : 0), 0, Math.PI * 2); ctx.fill();

    // Eyes (blink)
    if (Date.now() > nextBlink) { blink = 1; nextBlink = Date.now() + 2200 + Math.random() * 2500; }
    if (blink > 0) blink -= 0.12;
    const eyeH = Math.max(2, 14 * (1 - Math.max(0, blink)));
    ctx.fillStyle = '#7dd3fc';
    ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 12;
    [cx - 26, cx + 26].forEach(ex => {
      ctx.beginPath();
      ctx.ellipse(ex, cy - 14, 10, eyeH / 2 + 4, 0, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Mouth – animates while speaking
    const mouthW = 46;
    const mouthH = speaking ? 6 + Math.abs(Math.sin(ts / 90)) * 16 + Math.random() * 4 : (thinking ? 4 + Math.sin(ts / 300) * 2 : 5);
    ctx.fillStyle = speaking ? '#a78bfa' : '#38bdf8';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(cx - mouthW / 2, cy + 24 - mouthH / 2, mouthW, mouthH, 8);
    else ctx.rect(cx - mouthW / 2, cy + 24 - mouthH / 2, mouthW, mouthH);
    ctx.fill();

    requestAnimationFrame(drawAvatar);
  }
  requestAnimationFrame(drawAvatar);

  /* ---------------- AI joins the call as a participant tile ---------------- */
  const avatarHome = document.getElementById('avatarWrap');
  let aiTile = null;
  document.getElementById('aiJoinBtn').onclick = () => {
    if (aiTile) return;
    aiTile = document.createElement('div');
    aiTile.className = 'video-tile ai-tile';
    aiTile.appendChild(canvas); // move the live avatar canvas into the call grid
    const label = document.createElement('span');
    label.className = 'tile-name'; label.textContent = '🤖 Suraksha AI';
    aiTile.appendChild(label);
    document.getElementById('videoGrid').appendChild(aiTile);
    speak((typeof lang !== 'undefined' && lang === 'hi')
      ? 'नमस्ते, मैं सुरक्षा AI हूँ। मैं आपके साथ हूँ, घबराएं नहीं। मदद रास्ते में है।'
      : 'Hello, I am Suraksha AI. I am here with you. Stay calm, help is on the way. You can ask me anything.');
  };

  // When the call panel hides (hang up), return the avatar to its card
  new MutationObserver(() => {
    const hidden = document.getElementById('callPanel').classList.contains('hidden');
    if (hidden && aiTile) {
      avatarHome.appendChild(canvas);
      aiTile.remove(); aiTile = null;
      speechSynthesis.cancel(); speaking = false;
    }
  }).observe(document.getElementById('callPanel'), { attributes: true, attributeFilter: ['class'] });

  // Preload voices (some browsers load them async)
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
})();
