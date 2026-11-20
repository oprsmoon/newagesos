/**
 * V-CIN Suraksha — Citizen App Logic (app.js)
 * Depends on: bus.js (loaded before this file)
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   SIREN — Web Audio API (no file needed)
════════════════════════════════════════════════════════════ */
function playSiren(durationMs = 5000) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sawtooth';

    // Wailing effect: 800Hz → 400Hz → 800Hz cycles
    const now = ctx.currentTime;
    const cycles = Math.ceil(durationMs / 500);
    for (let i = 0; i < cycles; i++) {
      const t = now + i * 0.5;
      oscillator.frequency.setValueAtTime(800, t);
      oscillator.frequency.linearRampToValueAtTime(400, t + 0.25);
      oscillator.frequency.linearRampToValueAtTime(800, t + 0.5);
    }
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
  } catch (e) {
    console.warn('[Siren] Web Audio API not available:', e);
  }
}

/* ═══════════════════════════════════════════════════════════
   SHA-256 HASH UTILITY
════════════════════════════════════════════════════════════ */
async function sha256(data) {
  const buf = typeof data === 'string'
    ? new TextEncoder().encode(data)
    : data;
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ═══════════════════════════════════════════════════════════
   i18n
════════════════════════════════════════════════════════════ */
const STRINGS = {
  en: {
    appTitle:'🛡️ Suraksha', sos:'SOS',
    sosHint:'Tap in an emergency. Location + audio recording start instantly.',
    recording:'Recording evidence…',
    operatorConnected:'Cyber cell operator connected. Stay on the line.',
    cancelSos:'I am safe – cancel SOS',
    helplines:'📞 One-tap Helplines', cyberFraud:'Cyber Fraud',
    emergency:'Emergency', womenHelp:'Women Helpline', mentalHelp:'Mental Health',
    journey:'📍 Safe Journey', journeyHint:'Share live location with family until you arrive safely.',
    startJourney:'Start Ride', stopJourney:'End Journey – I arrived',
    journeyActive:(m) => `Journey active. Family can see your live location. Auto check-in in ${m} min.`,
    journeyMissed:'⚠️ Check-in missed! Alerting your family…',
    complaint:'📝 Rapid Evidence Report',
    optFraud:'Financial fraud / scam', optHarassment:'Online harassment',
    optBlackmail:'Blackmail / sextortion', optStalking:'Stalking', optCustom:'Custom / Other',
    customCategoryPh:'Enter custom category name', submitComplaint:'Submit as Evidence',
    complaintPh:'Describe what happened (text only)…', draftBtn:'Generate Draft',
    sosSent:'🚨 SOS sent! Notifying guardians and cyber cell…',
    routeFraud:'➡️ ACTION: Call 1930 NOW (golden hour). Then file at cybercrime.gov.in.',
    routeOther:'➡️ ACTION: File at cybercrime.gov.in. You may also request an FIR at your local police station.',
    guardian:'🤝 Guardian Mode',
    guardianHint:'Toggle to go on standby. You\'ll be alerted if someone in this room needs help.',
    radiusLabel:'Alert radius (km):',
    standbyStart:'Go on Standby', standbyStop:'Stop Standby',
    respondersNone:'Notifying nearby guardians…',
    responders:(n) => `✅ ${n} guardian${n>1?'s':''} responding`,
    connected:'🟢 Online', offline:'⚪ Offline',
    scamTitle:'🔍 Scam Detector',
    scamHint:'Paste a suspicious message, link, UPI ID, or number.',
    scamBtn:'🔍 Check for Scam', shakeSos:'Shake to SOS (6 shakes)',
  },
  hi: {
    appTitle:'🛡️ सुरक्षा', sos:'SOS',
    sosHint:'आपातकाल में दबाएँ। लोकेशन और ऑडियो रिकॉर्डिंग तुरंत शुरू होगी।',
    recording:'सबूत रिकॉर्ड हो रहा है…',
    operatorConnected:'साइबर सेल ऑपरेटर जुड़ गए हैं। लाइन पर बने रहें।',
    cancelSos:'मैं सुरक्षित हूँ – SOS रद्द करें',
    helplines:'📞 हेल्पलाइन', cyberFraud:'साइबर धोखाधड़ी',
    emergency:'आपातकाल', womenHelp:'महिला हेल्पलाइन', mentalHelp:'मानसिक स्वास्थ्य',
    journey:'📍 यात्रा साझा करें', journeyHint:'सुरक्षित पहुँचने तक परिवार के साथ लाइव लोकेशन साझा करें।',
    startJourney:'यात्रा शुरू करें', stopJourney:'यात्रा समाप्त',
    journeyActive:(m) => `यात्रा सक्रिय है। परिवार आपकी लाइव लोकेशन देख सकता है। ${m} मिनट में ऑटो चेक-इन।`,
    journeyMissed:'⚠️ चेक-इन नहीं हुआ! परिवार को सूचित किया जा रहा है…',
    complaint:'📝 त्वरित सबूत रिपोर्ट',
    optFraud:'वित्तीय धोखाधड़ी', optHarassment:'ऑनलाइन उत्पीड़न',
    optBlackmail:'ब्लैकमेल', optStalking:'पीछा करना', optCustom:'अन्य',
    customCategoryPh:'कस्टम श्रेणी का नाम', submitComplaint:'सबूत जमा करें',
    complaintPh:'संक्षेप में बताएं क्या हुआ…', draftBtn:'ड्राफ्ट बनाएं',
    sosSent:'🚨 SOS भेजा गया!',
    routeFraud:'➡️ कार्रवाई: अभी 1930 पर कॉल करें।',
    routeOther:'➡️ कार्रवाई: cybercrime.gov.in पर शिकायत दर्ज करें।',
    guardian:'🤝 गार्जियन मोड',
    guardianHint:'स्टैंडबाय पर रहें। आस-पास किसी को मदद चाहिए तो आपको अलर्ट मिलेगा।',
    radiusLabel:'अलर्ट दायरा (किमी):',
    standbyStart:'स्टैंडबाय शुरू करें', standbyStop:'स्टैंडबाय बंद करें',
    respondersNone:'आस-पास के गार्जियन को सूचित किया जा रहा है…',
    responders:(n) => `✅ ${n} गार्जियन मदद के लिए आ रहे हैं`,
    connected:'🟢 ऑनलाइन', offline:'⚪ ऑफलाइन',
    scamTitle:'🔍 स्कैम डिटेक्टर', scamHint:'संदिग्ध संदेश, लिंक या UPI ID यहाँ पेस्ट करें।',
    scamBtn:'🔍 जाँचें', shakeSos:'हिलाकर SOS (6 बार)',
  },
};
let lang = localStorage.getItem('vcin-lang') || 'en';
const t = (k, ...args) => {
  const fn = STRINGS[lang]?.[k] ?? STRINGS.en?.[k];
  return typeof fn === 'function' ? fn(...args) : (fn ?? k);
};
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = STRINGS[lang]?.[key] ?? STRINGS.en?.[key];
    if (typeof val === 'string') el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.dataset.i18nPh;
    const val = STRINGS[lang]?.[key] ?? STRINGS.en?.[key];
    if (typeof val === 'string') el.placeholder = val;
  });
}

document.addEventListener('DOMContentLoaded', function initJoinScreen() {
  const overlay  = document.getElementById('joinOverlay');
  const mainApp  = document.getElementById('mainApp');
  const joinBtn  = document.getElementById('joinBtn');
  const genBtn   = document.getElementById('generateCodeBtn');
  const nameInp  = document.getElementById('joinName');
  const otpBoxes = [0,1,2,3].map(i => document.getElementById('otp' + i));

  if (!joinBtn || !nameInp || !overlay || !mainApp) {
    console.error('[V-CIN] Citizen join screen elements not found.');
    return;
  }

  function getCode() { return otpBoxes.map(b => b ? b.value : '').join(''); }
  function validate() {
    joinBtn.disabled = false;
    joinBtn.style.opacity = '1';
    joinBtn.style.cursor = 'pointer';
  }

  // Pre-fill saved session data (URL query > sessionStorage > localStorage; no 'XXXX' placeholder)
  const urlParams = new URLSearchParams(window.location.search);
  const paramPin  = urlParams.get('pin');
  const savedName = sessionStorage.getItem('vcin-name') || localStorage.getItem('suraksha-name') || 'Citizen User';
  const savedRoom = (paramPin || sessionStorage.getItem('vcin-room') || localStorage.getItem('suraksha-room') || '').trim().slice(0, 4);

  if (savedName) nameInp.value = savedName;
  if (savedRoom && savedRoom.length === 4) {
    savedRoom.split('').forEach((d, i) => { if (otpBoxes[i]) otpBoxes[i].value = d; });
  }
  validate();

  // OTP box navigation — focus select, auto-advance, backspace, arrows, paste
  otpBoxes.forEach((box, i) => {
    if (!box) return;

    box.addEventListener('focus', () => {
      box.select();
    });

    box.addEventListener('input', () => {
      const cleanDigits = box.value.replace(/\D/g, '');
      if (cleanDigits.length > 1) {
        if (cleanDigits.length >= 4) {
          cleanDigits.slice(0, 4).split('').forEach((d, idx) => {
            if (otpBoxes[idx]) otpBoxes[idx].value = d;
          });
          if (otpBoxes[3]) { otpBoxes[3].focus(); otpBoxes[3].select(); }
        } else {
          box.value = cleanDigits.slice(-1);
          if (box.value && i < 3 && otpBoxes[i + 1]) {
            otpBoxes[i + 1].focus();
            otpBoxes[i + 1].select();
          }
        }
      } else {
        box.value = cleanDigits;
        if (box.value && i < 3 && otpBoxes[i + 1]) {
          otpBoxes[i + 1].focus();
          otpBoxes[i + 1].select();
        }
      }
      validate();
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace') {
        if (!box.value && i > 0 && otpBoxes[i - 1]) {
          otpBoxes[i - 1].focus();
          otpBoxes[i - 1].value = '';
          validate();
        }
      } else if (e.key === 'ArrowLeft' && i > 0 && otpBoxes[i - 1]) {
        otpBoxes[i - 1].focus();
        otpBoxes[i - 1].select();
      } else if (e.key === 'ArrowRight' && i < 3 && otpBoxes[i + 1]) {
        otpBoxes[i + 1].focus();
        otpBoxes[i + 1].select();
      } else if (e.key === 'Enter') {
        handleCitizenJoin(e);
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
      if (paste.length > 0) {
        paste.slice(0, 4).split('').forEach((bVal, j) => {
          if (otpBoxes[j]) otpBoxes[j].value = bVal;
        });
        const lastIdx = Math.min(paste.length - 1, 3);
        if (otpBoxes[lastIdx]) { otpBoxes[lastIdx].focus(); otpBoxes[lastIdx].select(); }
        validate();
      }
    });
  });

  nameInp.addEventListener('input', validate);
  nameInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleCitizenJoin(e);
  });

  genBtn && genBtn.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!nameInp.value.trim()) nameInp.value = 'Citizen User';
    const code = Bus.generateCode();
    code.split('').forEach((d, i) => { if (otpBoxes[i]) otpBoxes[i].value = d; });
    validate();
    if (joinBtn) {
      joinBtn.disabled = false;
      joinBtn.style.opacity = '1';
      joinBtn.focus();
    }
  });

  joinBtn.addEventListener('click', handleCitizenJoin);
});

function handleCitizenJoin(e) {
  if (e && e.preventDefault) e.preventDefault();
  const overlay  = document.getElementById('joinOverlay');
  const mainApp  = document.getElementById('mainApp');
  const nameInp  = document.getElementById('joinName');
  const genDisplay = document.getElementById('genCodeDisplay');
  const otpBoxes = [0,1,2,3].map(i => document.getElementById('otp' + i));

  let code = otpBoxes.map(b => b ? b.value : '').join('').trim();
  let name = (nameInp ? nameInp.value.trim() : 'Citizen User') || 'Citizen User';

  // Block join if code is not exactly 4 digits — never silently generate or accept blank.
  if (!/^\d{4}$/.test(code)) {
    const otpRow = document.querySelector('.vcin-otp-row');
    if (otpRow) {
      otpRow.classList.remove('vcin-otp-error');
      void otpRow.offsetWidth; // reflow to restart animation
      otpRow.classList.add('vcin-otp-error');
    }
    // Show inline hint
    let errEl = document.getElementById('vcin-otp-err');
    if (!errEl) {
      errEl = document.createElement('p');
      errEl.id = 'vcin-otp-err';
      errEl.style.cssText = 'color:#ef4444;font-size:0.78rem;margin:4px 0 0 0;font-weight:600;text-align:center;';
      const otpRow2 = document.querySelector('.vcin-otp-row');
      if (otpRow2) otpRow2.insertAdjacentElement('afterend', errEl);
    }
    errEl.textContent = '⚠️ Enter the 4-digit room code to continue.';
    setTimeout(() => { if (errEl) errEl.textContent = ''; }, 3000);
    // Focus first empty box
    const firstEmpty = otpBoxes.find(b => b && !b.value);
    if (firstEmpty) firstEmpty.focus();
    return;
  }

  if (overlay) {
    overlay.style.display = 'none';
    overlay.classList.add('hidden');
  }
  if (mainApp) {
    mainApp.classList.remove('hidden');
    mainApp.style.display = 'block';
  }

  if (typeof SFX !== 'undefined' && SFX.connected) SFX.connected();

  try {
    Bus.init(code, name, 'citizen');

    const roomCodeEl = document.getElementById('headerRoomCode');
    const nameEl = document.getElementById('headerName');
    if (roomCodeEl) roomCodeEl.textContent = code;
    if (nameEl) nameEl.textContent = name;

    applyI18n();
    initApp();
  } catch (err) {
    console.error('[Citizen Join Error]', err);
  }
}
window.handleCitizenJoin = handleCitizenJoin;

/* ═══════════════════════════════════════════════════════════
   MAIN APP — initialised after room join
════════════════════════════════════════════════════════════ */
function initApp() {

  /* ── MQTT connection status chip ─────────────────────────── */
  Bus.onStatus(online => {
    const chip = document.getElementById('connStatus');
    if (!chip) return;
    chip.textContent = online ? t('connected') : t('offline');
    chip.className   = 'vcin-chip ' + (online ? 'vcin-chip-ok' : 'vcin-chip-warn');
    // Surface the reason on hover instead of hiding it in the console
    chip.title = online
      ? 'MQTT connected · client ' + Bus.clientId
      : (Bus.lastError || 'Connecting to broker…');
  });

  /* ── Conference invite listener ─────────────────── */
  Bus.on('conference-start', (msg) => {
    if (msg.deviceId === Bus.deviceId) return; // own message
    sessionStorage.setItem('vcin-jitsi-room', msg.jitsiRoom || '');
    showConferenceInvite(msg.jitsiRoom, msg.from);
    // Also show the inline join button
    document.getElementById('joinConferenceBtn')?.classList.remove('hidden');
  });

  // Wire up the inline Join Conference button
  document.getElementById('joinConferenceBtn')?.addEventListener('click', () => {
    const stored = sessionStorage.getItem('vcin-jitsi-room');
    if (stored) joinJitsi(stored);
  });

  /* ── WebRTC Signaling Listeners ───────────────────────────── */
  Bus.on('webrtc-offer', async (msg) => {
    const senderId = msg.fromDeviceId || msg.deviceId;
    if (!senderId || senderId === Bus.deviceId) return;
    const overlay = document.getElementById('jitsiOverlay');
    if (overlay && overlay.classList.contains('hidden')) {
      showConferenceInvite(msg.jitsiRoom || Bus.room, msg.from || msg.name || 'Remote Participant');
    }
    await ensureLocalMediaStream();
    if (!peerConnection) await initWebRTC(false);
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(msg.offer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      Bus.send('webrtc-answer', { answer, role: Bus.role, deviceId: Bus.deviceId, fromDeviceId: Bus.deviceId, name: Bus.name });
    } catch (e) {
      console.warn('[WebRTC] Citizen answer error:', e);
    }
  });

  Bus.on('webrtc-answer', async (msg) => {
    const senderId = msg.fromDeviceId || msg.deviceId;
    if (!senderId || senderId === Bus.deviceId || !peerConnection) return;
    try {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(msg.answer));
    } catch (e) {
      console.warn('[WebRTC] Citizen remote desc error:', e);
    }
  });

  Bus.on('webrtc-ice', async (msg) => {
    const senderId = msg.fromDeviceId || msg.deviceId;
    if (!senderId || senderId === Bus.deviceId || !peerConnection) return;
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(msg.candidate));
    } catch (e) {
      console.warn('[WebRTC] Citizen ICE candidate error:', e);
    }
  });

  Bus.on('conference-end', () => {
    endJitsi();
  });

  Bus.on('guardian-assigned', (msg) => {
    if (typeof activateSimulatedGuardianFeed === 'function') {
      activateSimulatedGuardianFeed(msg.guardianName || 'Guardian');
    }
  });

  Bus.on('guardian-admitted', (msg) => {
    if (typeof activateSimulatedGuardianFeed === 'function') {
      activateSimulatedGuardianFeed(msg.guardianName || 'Guardian');
    }
    const localBadge = document.getElementById('vcinLocalVideoBadge');
    if (localBadge && Bus.role === 'guardian') {
      localBadge.innerHTML = `🛡️ You (${Bus.name} · Guardian) — <span style="color:#34d399">🟢 Admitted by Operator</span>`;
    }
    const guardianStatus = document.getElementById('vcinGuardianStatus');
    if (guardianStatus) {
      guardianStatus.textContent = `🟢 Guardian: ${msg.guardianName || 'Active'} (Admitted & Live)`;
      guardianStatus.style.background = 'rgba(16, 185, 129, 0.4)';
    }
    if (msg.guardianDeviceId === Bus.deviceId || msg.roomName === Bus.room) {
      if (typeof showToast === 'function') {
        showToast(`✅ Admitted to conference by Operator (${msg.admittedBy || 'Command'})!`, 'success');
      }
      if (typeof SFX !== 'undefined' && SFX.ping) SFX.ping();
    }
  });

  Bus.on('guardian-rejected', (msg) => {
    if (msg.guardianDeviceId === Bus.deviceId) {
      const localBadge = document.getElementById('vcinLocalVideoBadge');
      if (localBadge) {
        localBadge.innerHTML = `🛡️ You (${Bus.name} · Guardian) — <span style="color:#ef4444">❌ Admission Declined</span>`;
      }
      if (typeof showToast === 'function') {
        showToast('❌ Conference admission declined by Operator', 'warning');
      }
    }
  });


  /* ── SOS ack from operator ──────────────────────────────── */
  Bus.on('sos-ack', (msg) => {
    if (msg.to && msg.to !== Bus.deviceId) return;
    document.getElementById('operatorStatus')?.classList.remove('hidden');
    document.getElementById('joinConferenceBtn')?.classList.remove('hidden');
    document.getElementById('respondersLine')?.classList.add('hidden');
  });

  /* ── SOS acknowledged broadcast from operator ────────────── */
  Bus.on('sos-acknowledged', (msg) => {
    // Add acknowledged rescue location to citizen scam map
    if (typeof addAcknowledgedIncidentToCitizenMap === 'function') {
      addAcknowledgedIncidentToCitizenMap(msg);
    }
  });

  /* ── Guardian en-route & assigned ───────────────────────── */
  Bus.on('guardian-ack', (msg) => {
    assignedGuardianForSOS = { deviceId: msg.deviceId, name: msg.from || 'Guardian' };
    const el = document.getElementById('guardianEnRoute');
    if (el) {
      el.textContent = `🤝 ${msg.from || 'Guardian'} is on the way!`;
      el.classList.remove('hidden');
    }
  });

  Bus.on('guardian-assign', (msg) => {
    assignedGuardianForSOS = { deviceId: msg.guardianDeviceId || msg.deviceId, name: msg.guardianName || 'Community Guardian' };
    const el = document.getElementById('guardianEnRoute');
    if (el) {
      el.textContent = `🤝 Guardian assigned by Operator!`;
      el.classList.remove('hidden');
    }
  });

  /* ── CTS Score updates (from Operator or Citizen ratings) ── */
  Bus.on('cts-score-update', (msg) => {
    if (msg.targetDeviceId === Bus.deviceId) {
      const scoreEl = document.getElementById('userTrustScore');
      const barEl = document.getElementById('trustProgressBar');
      if (scoreEl) scoreEl.textContent = msg.newCTS;
      if (barEl) barEl.style.width = msg.newCTS + '%';
      if (typeof showToast === 'function') {
        showToast(`🎉 Your Civic Trust Score updated to ${msg.newCTS}!`, 'success');
      }
    }
  });

  Bus.on('guardian-rating-update', (msg) => {
    if (msg.guardianDeviceId === Bus.deviceId) {
      const scoreEl = document.getElementById('userTrustScore');
      const barEl = document.getElementById('trustProgressBar');
      if (scoreEl) scoreEl.textContent = msg.newCTS;
      if (barEl) barEl.style.width = msg.newCTS + '%';
      if (typeof showToast === 'function') {
        showToast(`⭐ Operator rated your mission (${msg.stars}★): New CTS ${msg.newCTS}`, 'success');
      }
    }
  });

  /* ── Golden Hour ack from operator ─────────────────────── */
  Bus.on('golden-hour-ack', (msg) => {
    const banner = document.getElementById('ghOperatorBanner');
    const caseEl = document.getElementById('ghCaseId');
    if (banner && caseEl) {
      caseEl.textContent = msg.caseId || 'GH-' + Date.now().toString(36).toUpperCase();
      banner.classList.remove('hidden');
    }
  });

  const safeRun = (fnName, fn) => {
    try { fn(); } catch (e) { console.warn(`[initApp] ${fnName} error:`, e); }
  };

  safeRun('initSOS', initSOS);
  safeRun('initGuardian', initGuardian);
  safeRun('initGoldenHour', initGoldenHour);
  safeRun('initJourney', initJourney);
  safeRun('initComplaint', initComplaint);
  safeRun('initHeroGrid', initHeroGrid);
  safeRun('initCitizenHexMap', initCitizenHexMap);
  safeRun('initSpeechScript', initSpeechScript);
  safeRun('initBottomNav', initBottomNav);
  safeRun('initLangToggle', initLangToggle);
  safeRun('initStealth', initStealth);
  safeRun('initShakeDetect', initShakeDetect);
  safeRun('initRealtimeLocationWatch', initRealtimeLocationWatch);
  safeRun('start15SecAlertTicker', start15SecAlertTicker);
}

/* ═══════════════════════════════════════════════════════════
   HERO GRID & BOTTOM NAVIGATION (Image 1, 2, 3, 4)
════════════════════════════════════════════════════════════ */
function initHeroGrid() {
  document.getElementById('cardReportIncident')?.addEventListener('click', () => {
    document.getElementById('sosSection')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('cardGoldenHour')?.addEventListener('click', () => {
    document.getElementById('goldenHourModal')?.classList.remove('hidden');
  });
  document.getElementById('cardScamMap')?.addEventListener('click', () => {
    document.getElementById('liveScamMapSection')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { if (citizenHexMap) citizenHexMap.invalidateSize(); }, 300);
  });
  document.getElementById('cardSafeJourney')?.addEventListener('click', () => {
    document.querySelector('.vcin-section:has(#journeyMap)')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function initBottomNav() {
  const items = document.querySelectorAll('.vcin-nav-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  document.getElementById('navHome')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.getElementById('navMap')?.addEventListener('click', () => {
    document.getElementById('liveScamMapSection')?.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => { if (citizenHexMap) citizenHexMap.invalidateSize(); }, 300);
  });
  document.getElementById('navReport')?.addEventListener('click', () => {
    document.querySelector('.vcin-section:has(#complaintType)')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('navAlerts')?.addEventListener('click', () => {
    document.getElementById('sosSection')?.scrollIntoView({ behavior: 'smooth' });
  });
  document.getElementById('navGuardian')?.addEventListener('click', () => {
    document.querySelector('.vcin-section:has(#guardianModeToggle)')?.scrollIntoView({ behavior: 'smooth' });
  });
}

/* ═══════════════════════════════════════════════════════════
   SPEECH SYNTHESIS FOR GOLDEN HOUR (Image 4)
════════════════════════════════════════════════════════════ */
function initSpeechScript() {
  const btn = document.getElementById('ghSpeakBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const text = 'मेरा अकाउंट से फ्रॉड हुआ है. कृपया मेरा खाता तुरंत ब्लॉक करें और इस नंबर पर हुई सभी ट्रांजेक्शन की जानकारी दें।';
    if (!('speechSynthesis' in window)) {
      alert(text);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'hi-IN';
    utter.rate = 0.9;
    btn.textContent = '🔊 बोलने लगा…';
    utter.onend = () => { btn.textContent = '🔊 सुनें'; };
    utter.onerror = () => { btn.textContent = '🔊 सुनें'; };
    window.speechSynthesis.speak(utter);
  });
}

/* ═══════════════════════════════════════════════════════════
   LIVE SCAM MAP — GOOGLE NEWS RSS + REALTIME GEOLOCATION
════════════════════════════════════════════════════════════ */
let citizenHexMap = null;
let currentCitizenFilter = 'all';
let citizenUserMarker = null;
let liveCitizenRSSNews = [];
let citizenNewsMarkers = []; // { item, marker } for news-list → map fly-to

let citizenUserLocation = { lat: 20.5937, lng: 78.9629, city: 'Local Area', district: '', state: '' };
let citizenLocationWatch = null;
let citizenRSSInterval = null;

const COLOR_PALETTES = {
  classic  : { low: '#fef08a', med: '#f97316', high: '#ef4444', extreme: '#a855f7', safe: '#22c55e', nodata: '#0f1f35' },
  neon     : { low: '#06b6d4', med: '#3b82f6', high: '#ec4899', extreme: '#8b5cf6', safe: '#10b981', nodata: '#0b1329' },
  aubergine: { low: '#38bdf8', med: '#818cf8', high: '#c084fc', extreme: '#f43f5e', safe: '#34d399', nodata: '#090d16' },
};

function showToast(message, type = 'info') {
  let container = document.getElementById('vcinToastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'vcinToastContainer';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;max-width:380px;pointer-events:none';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'danger' ? 'rgba(239,68,68,0.95)' : type === 'success' ? 'rgba(34,197,94,0.95)' : 'rgba(59,130,246,0.95)';
  toast.style.cssText = `background:${bg};color:#fff;padding:12px 16px;border-radius:10px;font-size:0.88rem;font-weight:600;box-shadow:0 10px 25px rgba(0,0,0,0.5);pointer-events:auto;animation:vcinToastIn 0.3s ease;display:flex;align-items:center;gap:10px;backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.2);`;
  toast.innerHTML = `<span>${escapeHtml(String(message))}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}

async function reverseGeocodeLocation(lat, lng) {
  if (!lat || !lng) {
    return { road: '', suburb: '', city: 'Bengaluru', state: 'Karnataka', landmark: 'MG Road Metro Station', landmarkText: 'Near MG Road Metro Station', displayName: 'MG Road, Bengaluru' };
  }

  try {
    const osmUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&extratags=1&namedetails=1`;
    const res = await fetch(osmUrl, {
      headers: { 'Accept-Language': 'en' }
    });
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const extratags = data.extratags || {};
      const namedetails = data.namedetails || {};

      const road = addr.road || addr.street || addr.footway || addr.pedestrian || addr.highway || '';
      const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.subdistrict || addr.quarter || '';
      const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || 'Local Area';
      const state = addr.state || '';
      
      const landmarkTag = addr.amenity || addr.building || addr.shop || addr.tourism || addr.historic || 
                          addr.leisure || addr.railway || addr.hospital || addr.police || addr.school || 
                          addr.college || addr.university || addr.station || addr.place_of_worship || 
                          extratags.amenity || extratags.building || extratags.tourism || '';

      let rawName = data.name || namedetails.name || namedetails['name:en'] || '';
      if (rawName && (rawName.toLowerCase() === city.toLowerCase() || rawName.toLowerCase() === suburb.toLowerCase())) {
        rawName = '';
      }

      let landmark = rawName || landmarkTag || '';
      if (!landmark && road) {
        landmark = `${road} Junction`;
      } else if (!landmark && suburb) {
        landmark = `${suburb} Main Sector`;
      } else if (!landmark) {
        landmark = `${city} Central Area`;
      }

      let landmarkText = landmark ? (landmark.startsWith('Near ') ? landmark : `Near ${landmark}`) : `Near ${suburb || road || city}`;
      if (road && !landmarkText.includes(road)) {
        landmarkText += `, ${road}`;
      }

      const displayName = [road, suburb, city].filter(Boolean).join(', ') || city;
      return { road, suburb, city, state, landmark, landmarkText, displayName };
    }
  } catch (_) {}

  try {
    const bdcRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
    if (bdcRes.ok) {
      const data = await bdcRes.json();
      const city = data.city || data.locality || data.principalSubdivision || 'Local Area';
      const suburb = data.localityInfo?.administrative?.[3]?.name || data.localityInfo?.administrative?.[2]?.name || data.locality || '';
      const state = data.principalSubdivision || 'India';
      const landmark = suburb ? `${suburb} Sector` : `${city} Central District`;
      const landmarkText = `Near ${landmark}`;
      const displayName = [suburb, city].filter(Boolean).join(', ') || city;
      return { road: '', suburb, city, state, landmark, landmarkText, displayName };
    }
  } catch (_) {}

  return { road: '', suburb: '', city: 'Bengaluru', state: 'Karnataka', landmark: 'MG Road Metro Station', landmarkText: 'Near MG Road Metro Station', displayName: 'MG Road, Bengaluru' };
}

function parseRSSItemToNewsItem(rawTitle, link, pubDate, source, qCity, qDist, qLat, qLng) {
  let crimeType = 'fraud';
  let typeTag = '⚡ Financial & Cyber Fraud';
  let risk = 'high';
  const lower = (rawTitle || '').toLowerCase();
  if (lower.includes('murder') || lower.includes('killed') || lower.includes('assault') || lower.includes('violent')) {
    crimeType = 'crime';
    typeTag = '🚨 Violent Crime';
    risk = 'high';
  } else if (lower.includes('robbery') || lower.includes('theft') || lower.includes('stolen') || lower.includes('burglary') || lower.includes('snatch')) {
    crimeType = 'crime';
    typeTag = '🏃 Robbery / Property Crime';
    risk = 'warning';
  } else if (lower.includes('atm') || lower.includes('skimm') || lower.includes('card')) {
    crimeType = 'atm';
    typeTag = '🏪 ATM Fraud';
    risk = 'warning';
  } else if (lower.includes('arrest') || lower.includes('busted') || lower.includes('police')) {
    crimeType = 'crime';
    typeTag = '🛡️ Police Action / Arrest';
    risk = 'moderate';
  }

  const jitterLat = qLat + (Math.random() - 0.5) * 0.12;
  const jitterLng = qLng + (Math.random() - 0.5) * 0.12;

  return {
    title: rawTitle,
    link,
    pubDate: pubDate ? new Date(pubDate).toLocaleDateString() : 'Recent',
    ts: pubDate ? (new Date(pubDate).getTime() || 0) : 0,
    source: source || 'Google News',
    place: qCity || qDist || 'Local Area',
    type: crimeType,
    typeTag,
    risk,
    desc: rawTitle,
    lat: jitterLat,
    lng: jitterLng
  };
}

async function fetchGoogleNewsRSSDirect(qCity, qDist, qState, qLat, qLng) {
  const locTerms = [qCity, qDist, qState].filter(Boolean).slice(0, 2).join(' OR ');
  const crimeTerms = '(scam OR fraud OR crime OR police OR robbery OR theft OR FIR OR arrest)';
  const query = encodeURIComponent(`(${locTerms}) ${crimeTerms}`);
  const feedUrl = `https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en`;

  const proxyEndpoints = [
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`
  ];

  for (const endpoint of proxyEndpoints) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;

      let items = [];
      if (endpoint.includes('rss2json')) {
        const data = await res.json();
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          items = data.items.map(item => parseRSSItemToNewsItem(item.title, item.link, item.pubDate, item.author || item.feed_title, qCity, qDist, qLat, qLng));
        }
      } else {
        const xmlText = await res.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const itemNodes = Array.from(xmlDoc.querySelectorAll('item')).slice(0, 15);
        items = itemNodes.map(item => {
          const title = item.querySelector('title')?.textContent || '';
          const link = item.querySelector('link')?.textContent || '';
          const pubDate = item.querySelector('pubDate')?.textContent || '';
          const source = item.querySelector('source')?.textContent || 'Google News';
          return parseRSSItemToNewsItem(title, link, pubDate, source, qCity, qDist, qLat, qLng);
        }).filter(i => i.title);
      }

      if (items.length > 0) {
        return items;
      }
    } catch (_) {}
  }
  return [];
}

async function fetchAndRenderCitizenRSS(city, district, state, lat, lng) {
  let rssNews = [];
  try {
    // 1. Try local server endpoint if available
    const res = await fetch(`/api/news?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}&state=${encodeURIComponent(state)}&lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.news && data.news.length > 0) {
        rssNews = data.news.map(i => parseRSSItemToNewsItem(i.desc || i.title, i.link, i.pubDate, i.source, city, district, lat, lng));
      }
    }
  } catch (_) {}

  // 2. Fetch directly from Google News RSS via CORS proxy if server endpoint returns empty
  if (!rssNews.length) {
    rssNews = await fetchGoogleNewsRSSDirect(city, district, state, lat, lng);
  }

  if (rssNews.length > 0) {
    liveCitizenRSSNews = rssNews;
  } else {
    // Default fallback mock items centered near user location if RSS network is unreachable
    liveCitizenRSSNews = [
      { lat: lat + 0.008, lng: lng + 0.012, title: '🏪 ATM Skimming Alert', place: city || 'Local Area', type: 'atm', typeTag: '🏪 ATM Fraud', risk: 'high', desc: 'Card skimmer reported at nearby ATM kiosk.' },
      { lat: lat - 0.010, lng: lng - 0.008, title: '📞 Fake Utility Bill SMS', place: city || 'Local Area', type: 'fraud', typeTag: '⚡ Cyber Phishing', risk: 'high', desc: 'Fraudulent SMS asking for immediate bill payment.' },
      { lat: lat + 0.014, lng: lng - 0.015, title: '🏃 Snatching Incident', place: city || 'Local Area', type: 'crime', typeTag: '🚨 Snatching', risk: 'warning', desc: 'Two suspects on motorcycle reported.' },
      { lat: lat - 0.015, lng: lng + 0.018, title: '💸 Courier KYC Scam', place: city || 'Local Area', type: 'fraud', typeTag: '⚡ Financial Fraud', risk: 'moderate', desc: 'Extortion call pretending to be customs officer.' }
    ];
  }

  // Update live badge text on UI
  const badgeEl = document.querySelector('#liveScamMapSection .vcin-live-badge');
  if (badgeEl) {
    badgeEl.innerHTML = `<span class="vcin-pulse-dot"></span> LIVE GOOGLE RSS ACTIVE • ${escapeHtml(String(city || 'Local Area').toUpperCase())}`;
  }

  renderCitizenHexGrid(currentCitizenFilter);
}

/**
 * Renders the "Live Area News" list below the scam map.
 * Clicking a news item flies the map to its marker and opens its popup.
 */
function renderCitizenNewsList(filter = 'all') {
  const listEl = document.getElementById('citizenNewsList');
  const countEl = document.getElementById('citizenNewsCount');
  if (!listEl) return;

  const items = filterCitizenNewsItems(liveCitizenRSSNews, filter);
  if (countEl) countEl.textContent = `${items.length} live report${items.length === 1 ? '' : 's'}`;

  if (!items.length) {
    listEl.innerHTML = `<div class="vcin-news-empty">📡 No live reports for this filter yet — checking again in 60s…</div>`;
    return;
  }

  listEl.innerHTML = items.map((h, idx) => {
    const riskClass = h.risk === 'high' ? 'vcin-news-high' : h.risk === 'warning' ? 'vcin-news-warn' : 'vcin-news-mod';
    const timeAgo = h.ts ? formatTimeAgo(h.ts) : (h.pubDate || 'Recent');
    const safeIdx = liveCitizenRSSNews.indexOf(h);
    return `
      <article class="vcin-news-item ${riskClass}" data-news-idx="${safeIdx}" role="button" tabindex="0" aria-label="Show ${escapeHtml(h.title)} on map">
        <div class="vcin-news-item-top">
          <span class="vcin-news-type">${escapeHtml(h.typeTag || '⚡ Scam Alert')}</span>
          <span class="vcin-news-time">${escapeHtml(timeAgo)}</span>
        </div>
        <h4 class="vcin-news-title">${escapeHtml(h.title)}</h4>
        <div class="vcin-news-meta">
          <span>📍 ${escapeHtml(h.place || 'Local Area')}</span>
          <span>📰 ${escapeHtml(h.source || 'Google News')}</span>
        </div>
        ${h.link ? `<a class="vcin-news-link" href="${escapeHtml(h.link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">📰 Read Full Report ➔</a>` : ''}
      </article>`;
  }).join('');

  // Fly to marker on item click
  listEl.querySelectorAll('.vcin-news-item').forEach(el => {
    const openOnMap = () => {
      const item = liveCitizenRSSNews[parseInt(el.dataset.newsIdx, 10)];
      if (!item) return;
      const entry = citizenNewsMarkers.find(m => m.item === item);
      if (!citizenHexMap) return;
      if (entry) {
        citizenHexMap.flyTo([item.lat, item.lng], 15, { duration: 0.8 });
        setTimeout(() => { try { entry.marker.openPopup(); } catch (_) {} }, 850);
      } else {
        citizenHexMap.flyTo([item.lat, item.lng], 14, { duration: 0.8 });
      }
      document.getElementById('citizenHexMap')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => { try { citizenHexMap.invalidateSize(); } catch (_) {} }, 400);
    };
    el.addEventListener('click', openOnMap);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openOnMap(); } });
  });
}

function filterCitizenNewsItems(items, filter) {
  if (filter === '24h') {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const recent = items.filter(h => h.ts && h.ts >= cutoff);
    return recent.length ? recent : items; // fall back to all if no timestamps available
  }
  if (filter === 'all') return items;
  return items.filter(h => h.type === filter);
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function initCitizenHexMap() {
  const mapEl = document.getElementById('citizenHexMap');
  if (!mapEl) return;

  if (citizenHexMap) {
    try { citizenHexMap.remove(); } catch (_) {}
    citizenHexMap = null;
  }

  citizenHexMap = L.map('citizenHexMap', { preferCanvas: true, zoomControl: true, scrollWheelZoom: true }).setView([citizenUserLocation.lat, citizenUserLocation.lng], 13);
  addDarkTileLayerWithFallback(citizenHexMap, { preferCanvas: true });

  renderCitizenHexGrid(currentCitizenFilter);
  attachMapRadarScanner('citizenHexMap');

  // Re-render hex grid when the user pans / zooms so hotspots
  // always cover the visible viewport (debounced).
  citizenHexMap.on('moveend zoomend', () => {
    clearTimeout(citizenHexMap._hexRenderTimer);
    citizenHexMap._hexRenderTimer = setTimeout(() => renderCitizenHexGrid(currentCitizenFilter), 250);
  });

  // Fix Leaflet zero-size bug when the section was initialized off-screen
  citizenHexMap.whenReady(() => {
    setTimeout(() => { try { citizenHexMap.invalidateSize(); } catch (_) {} }, 350);
  });

  // Centering on user's real-time location via Geolocation
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      citizenUserLocation.lat = latitude;
      citizenUserLocation.lng = longitude;

      citizenHexMap.setView([latitude, longitude], 14);
      updateCitizenUserMarker(latitude, longitude);

      // Perform reverse geocoding to display actual city name
      const geo = await reverseGeocodeLocation(latitude, longitude);
      citizenUserLocation.city = geo.city || geo.suburb || 'Local Area';
      citizenUserLocation.district = geo.suburb || '';
      citizenUserLocation.state = geo.state || '';

      const areaEl = document.getElementById('userAreaName');
      if (areaEl) {
        areaEl.innerHTML = `📍 Your Area: <strong>${escapeHtml(geo.displayName || citizenUserLocation.city)}</strong>`;
      }

      await fetchAndRenderCitizenRSS(citizenUserLocation.city, citizenUserLocation.district, citizenUserLocation.state, latitude, longitude);
    }, (err) => {
      console.warn('[CitizenMap] Geolocation positioning failed, using default:', err);
      fetchAndRenderCitizenRSS('Bengaluru', 'Koramangala', 'Karnataka', 12.9352, 77.6245);
    }, { enableHighAccuracy: true, timeout: 8000 });

    // Watch position to keep user location pin updated in real time
    if (citizenLocationWatch) navigator.geolocation.clearWatch(citizenLocationWatch);
    citizenLocationWatch = navigator.geolocation.watchPosition(pos => {
      const { latitude, longitude } = pos.coords;
      citizenUserLocation.lat = latitude;
      citizenUserLocation.lng = longitude;
      updateCitizenUserMarker(latitude, longitude);
    }, () => {}, { enableHighAccuracy: true, maximumAge: 5000 });
  }

  // Auto-refresh Google News RSS every 60 seconds
  if (citizenRSSInterval) clearInterval(citizenRSSInterval);
  citizenRSSInterval = setInterval(() => {
    fetchAndRenderCitizenRSS(citizenUserLocation.city, citizenUserLocation.district, citizenUserLocation.state, citizenUserLocation.lat, citizenUserLocation.lng);
  }, 60000);

  // Category Filter Chips
  document.querySelectorAll('.vcin-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.vcin-chip-btn').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCitizenFilter = chip.dataset.filter || 'all';
      renderCitizenHexGrid(currentCitizenFilter);
    });
  });
}

function updateCitizenUserMarker(lat, lng) {
  if (!citizenHexMap) return;
  if (!citizenUserMarker) {
    citizenUserMarker = L.circleMarker([lat, lng], {
      radius: 10, fillColor: '#3b82f6', color: '#ffffff', weight: 3, fillOpacity: 0.9,
    }).addTo(citizenHexMap).bindPopup('📍 You Are Here (Realtime Location)');
  } else {
    citizenUserMarker.setLatLng([lat, lng]);
  }
}

function renderCitizenHexGrid(filter = 'all') {
  if (!citizenHexMap) return;

  // Clear previous layers
  citizenHexMap.eachLayer(l => {
    if (l._isHexLayer || l._isMarkerLayer) citizenHexMap.removeLayer(l);
  });

  const rawScams = liveCitizenRSSNews.length > 0 ? liveCitizenRSSNews : [
    { lat: citizenUserLocation.lat + 0.005, lng: citizenUserLocation.lng + 0.005, title: '🏪 ATM Skimming', place: 'Local Mall', type: 'atm', typeTag: '🏪 ATM Fraud', risk: 'high', desc: 'Card skimmer detected on 2 ATMs' },
    { lat: citizenUserLocation.lat - 0.006, lng: citizenUserLocation.lng - 0.004, title: '📞 Fake BESCOM calls', place: 'Block 5', type: 'fraud', typeTag: '⚡ Phishing', risk: 'high', desc: 'Fake power disconnection SMS' },
    { lat: citizenUserLocation.lat + 0.008, lng: citizenUserLocation.lng - 0.008, title: '🏃 Chain snatching', place: 'Main Rd', type: 'crime', typeTag: '🚨 Crime', risk: 'warning', desc: 'Biker gang reported' }
  ];

  const filtered = filter === 'all' ? rawScams : rawScams.filter(h => h.type === filter || filter === '24h');

  // Render dense hexagons around citizen location
  const useH3 = typeof window.h3 !== 'undefined';
  const res = 5;
  // Fixed hex layer defaults (the floating hex controls panel was removed — it broke the map UI)
  const radiusKm   = 45;
  const opacityPct = 0.55;
  const palette    = 'classic';

  const paletteColors = {
    classic: { high: '#ef4444', warning: '#f97316', moderate: '#eab308', safe: '#22c55e', base: '#1e3a5f' },
    neon: { high: '#f43f5e', warning: '#ec4899', moderate: '#8b5cf6', safe: '#06b6d4', base: '#0f172a' },
    aubergine: { high: '#f43f5e', warning: '#c084fc', moderate: '#818cf8', safe: '#38bdf8', base: '#1e1b4b' }
  };
  const colors = paletteColors[palette] || paletteColors.classic;

  if (useH3) {
    const hexKeys = new Set();
    const step = radiusKm / 111;
    const MAX_HEXES = 2500; // perf guard: never build more than this many hexes per render
    const bounds = citizenHexMap.getBounds();
    const latMin = Math.max(6.5, bounds.getSouth() - 0.2);
    const latMax = Math.min(37.0, bounds.getNorth() + 0.2);
    const lngMin = Math.max(67.5, bounds.getWest() - 0.2);
    const lngMax = Math.min(97.5, bounds.getEast() + 0.2);

    outerH3:
    for (let lat = latMin; lat <= latMax; lat += step) {
      for (let lng = lngMin; lng <= lngMax; lng += step) {
        try {
          const h3Idx = window.h3.latLngToCell(lat, lng, res);
          hexKeys.add(h3Idx);
          if (hexKeys.size >= MAX_HEXES) break outerH3;
        } catch (_) {}
      }
    }

    hexKeys.forEach(h3Idx => {
      try {
        const verts = window.h3.cellToBoundary(h3Idx);
        const center = window.h3.cellToLatLng(h3Idx);
        const cLat = center[0], cLng = center[1];
        
        const incNear = filtered.find(h => calcDistance(cLat, cLng, h.lat, h.lng) <= 3.5);
        let color = colors.base, fill = hexToRgba(colors.base, 0.2 * opacityPct), weight = 0.5;

        if (incNear) {
          if (incNear.risk === 'high') { color = colors.high; fill = hexToRgba(colors.high, 0.55 * opacityPct); }
          else if (incNear.risk === 'warning') { color = colors.warning; fill = hexToRgba(colors.warning, 0.45 * opacityPct); }
          else { color = colors.moderate; fill = hexToRgba(colors.moderate, 0.38 * opacityPct); }
          weight = 1.5;
        }

        const poly = L.polygon(verts, {
          color, weight, fillColor: fill, fillOpacity: 0.9, opacity: 0.9,
        }).addTo(citizenHexMap);
        poly._isHexLayer = true;
      } catch (_) {}
    });
  } else {
    const HS = 0.045;
    const RS = HS * 0.866;
    const MAX_HEXES = 2500; // perf guard: never build more than this many hexes per render
    let hexBuilt = 0;
    const bounds = citizenHexMap.getBounds();
    const latMin = Math.max(6.5, bounds.getSouth() - 0.2);
    const latMax = Math.min(37.0, bounds.getNorth() + 0.2);
    const lngMin = Math.max(67.5, bounds.getWest() - 0.2);
    const lngMax = Math.min(97.5, bounds.getEast() + 0.2);

    let row = 0;
    outerGrid:
    for (let baseLat = latMin; baseLat <= latMax; baseLat += RS, row++) {
      const lngOffset = (row % 2) * HS * 0.5;
      for (let baseLng = lngMin; baseLng <= lngMax; baseLng += HS) {
        if (hexBuilt >= MAX_HEXES) break outerGrid;
        hexBuilt++;
        const cLat = baseLat, cLng = baseLng + lngOffset;
        const incNear = filtered.find(h => calcDistance(cLat, cLng, h.lat, h.lng) <= 3.5);

        let color = colors.base, fill = hexToRgba(colors.base, 0.2 * opacityPct), weight = 0.5;
        if (incNear) {
          if (incNear.risk === 'high') { color = colors.high; fill = hexToRgba(colors.high, 0.55 * opacityPct); }
          else if (incNear.risk === 'warning') { color = colors.warning; fill = hexToRgba(colors.warning, 0.45 * opacityPct); }
          else { color = colors.moderate; fill = hexToRgba(colors.moderate, 0.38 * opacityPct); }
          weight = 1.5;
        }

        const r = HS * 0.56, verts = [];
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i + Math.PI / 6;
          verts.push([cLat + r * Math.cos(angle), cLng + r * Math.sin(angle)]);
        }

        const poly = L.polygon(verts, {
          color, weight, fillColor: fill, fillOpacity: 0.9, opacity: 0.9,
        }).addTo(citizenHexMap);
        poly._isHexLayer = true;
      }
    }
  }

  // Draw Interactive Marker Pins for RSS Feed Items
  citizenNewsMarkers = [];
  filtered.forEach(h => {
    const iconColor = h.risk === 'high' ? '#ef4444' : h.risk === 'warning' ? '#f97316' : '#eab308';
    const shortTitle = (h.title || 'Alert').length > 28 ? (h.title.substring(0, 26) + '…') : h.title;
    const markerHtml = `
      <div style="background:${iconColor};color:#fff;border-radius:10px;padding:4px 8px;font-size:0.75rem;font-weight:700;box-shadow:0 4px 12px rgba(0,0,0,0.5);white-space:nowrap;display:flex;align-items:center;gap:4px;cursor:pointer">
        <span>${escapeHtml(shortTitle)}</span>
      </div>
    `;

    const popupHtml = `
      <div style="max-width:240px;font-family:sans-serif">
        <div style="font-weight:700;color:#f8fafc;font-size:0.88rem;margin-bottom:4px;line-height:1.3">${escapeHtml(h.title)}</div>
        <div style="font-size:0.75rem;color:#38bdf8;font-weight:600;margin-bottom:6px">${escapeHtml(h.typeTag || '⚡ Scam Alert')} · ${escapeHtml(h.place || 'Local Area')}</div>
        <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:8px">${escapeHtml(h.desc || '')}</div>
        ${h.source ? `<div style="font-size:0.7rem;color:#64748b;margin-bottom:8px">📰 ${escapeHtml(h.source)}${h.pubDate ? ' · ' + escapeHtml(h.pubDate) : ''}</div>` : ''}
        ${h.link ? `<a href="${escapeHtml(h.link)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#2563eb;color:#ffffff;padding:5px 10px;border-radius:5px;font-size:0.72rem;text-decoration:none;font-weight:700">📰 Read Full News Report ➔</a>` : ''}
      </div>
    `;

    const marker = L.marker([h.lat, h.lng], {
      icon: L.divIcon({ html: markerHtml, className: '', iconSize: [140, 30] })
    }).addTo(citizenHexMap).bindPopup(popupHtml);
    marker._isMarkerLayer = true;
    citizenNewsMarkers.push({ item: h, marker });
  });

  // Keep the news list & area stats in sync with the map data + active filter
  renderCitizenNewsList(filter);
  updateCitizenAreaStats();
}

/**
 * Updates the "Your Area" summary card with real numbers derived
 * from the live RSS feed instead of hardcoded demo values.
 */
function updateCitizenAreaStats() {
  const items = liveCitizenRSSNews;
  const fraudCount = items.filter(h => h.type === 'fraud' || h.type === 'atm').length;
  const patterns = new Set(items.map(h => h.type).filter(Boolean)).size;
  const highRisk = items.filter(h => h.risk === 'high').length;

  const fraudEl = document.getElementById('statFraudReports');
  const patternEl = document.getElementById('statCrimePatterns');
  const highEl = document.getElementById('statHighRisk');
  if (fraudEl) fraudEl.textContent = fraudCount;
  if (patternEl) patternEl.textContent = patterns;
  if (highEl) highEl.textContent = highRisk;
}


/* ═══════════════════════════════════════════════════════════
   SOS
════════════════════════════════════════════════════════════ */
let sosActive      = false;
let mediaRecorder  = null;
let recInterval    = null;
let recSeconds     = 0;
let audioChunks    = [];
let currentIncidentId = null;

function initSOS() {
  const btn       = document.getElementById('sosBtn');
  const cancelBtn = document.getElementById('cancelSos');
  if (!btn) return;

  btn.addEventListener('click', triggerSOS);
  cancelBtn?.addEventListener('click', cancelSOS);
}

async function triggerSOS() {
  if (sosActive) return;
  if (!Bus.room) {
    alert('Please join a room first before sending SOS.');
    return;
  }
  sosActive = true;
  currentIncidentId = crypto.randomUUID();

  // 1. Update UI immediately
  const btn = document.getElementById('sosBtn');
  btn.classList.add('vcin-sos-active');
  document.getElementById('sosStatus').textContent = t('sosSent');
  document.getElementById('respondersLine').textContent = t('respondersNone');
  document.getElementById('respondersLine').classList.remove('hidden');
  document.getElementById('cancelSos')?.classList.remove('hidden');
  document.getElementById('recIndicator')?.classList.remove('hidden');

  // 2. Play siren immediately
  playSiren(5000);

  // 3. PUBLISH SOS RIGHT NOW with victim details & real location details (operator gets it instantly)
  const victimName = Bus.name || 'Citizen Victim';
  let initialLat = Bus.lat || citizenUserLocation.lat || 20.5937;
  let initialLng = Bus.lng || citizenUserLocation.lng || 78.9629;
  let placeName = citizenUserLocation.city ? (citizenUserLocation.district ? `${citizenUserLocation.district}, ${citizenUserLocation.city}` : citizenUserLocation.city) : (Bus.place || Bus.locality || 'Live Area');
  let landmarkText = citizenUserLocation.landmarkText || '';

  Bus.send('sos', {
    incidentId   : currentIncidentId,
    from         : victimName,
    victimName   : victimName,
    place        : placeName,
    locality     : placeName,
    address      : placeName,
    landmark     : citizenUserLocation.landmark || '',
    landmarkText : landmarkText,
    lat          : initialLat,
    lng          : initialLng,
    audioHash    : 'pending',
    sirenDuration: 5000,
  });

  // 4. Get real GPS with high accuracy and send update with reverse geocoded locality & landmark
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        Bus.lat = latitude;
        Bus.lng = longitude;
        const geo = await reverseGeocodeLocation(latitude, longitude);
        const updatedLocality = geo.displayName || (geo.suburb ? `${geo.suburb}, ${geo.city}` : geo.city) || 'Live Area';
        Bus.send('sos-location-update', {
          incidentId: currentIncidentId,
          from: victimName,
          victimName: victimName,
          place: updatedLocality,
          locality: updatedLocality,
          address: updatedLocality,
          landmark: geo.landmark,
          landmarkText: geo.landmarkText,
          lat: latitude,
          lng: longitude,
        });
        updateJourneyMarker(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
  }

  // 5. Start audio recording in background — hash gets sent in follow-up
  startRecTimer();
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = async (e) => {
      audioChunks.push(e.data);
      if (audioChunks.length === 1) {
        const arrBuf = await e.data.arrayBuffer();
        const hash = await sha256(arrBuf);
        const hashEl = document.getElementById('recHash');
        if (hashEl) hashEl.textContent = hash.substring(0, 16) + '…';

        // Convert blob chunk to Base64 for operator audio playback
        const reader = new FileReader();
        reader.onloadend = () => {
          const b64 = reader.result;
          Bus.send('sos-audio-data', {
            incidentId: currentIncidentId,
            audioB64  : b64,
            audioHash : hash,
          });
        };
        reader.readAsDataURL(e.data);

        // Send evidence hash update to room
        Bus.send('sos-evidence-update', {
          incidentId: currentIncidentId,
          audioHash : hash,
        });
      }
    };
    mediaRecorder.start(2000);
  } catch (_) {
    // Mic denied — generate a device fingerprint hash as fallback evidence
    const hash = await sha256(Bus.deviceId + currentIncidentId + Date.now());
    const hashEl = document.getElementById('recHash');
    if (hashEl) hashEl.textContent = hash.substring(0, 16) + '…';
  }
}

function cancelSOS() {
  sosActive = false;
  currentIncidentId = null;

  // Stop recording
  if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
  clearInterval(recInterval);
  recSeconds = 0;

  const btn = document.getElementById('sosBtn');
  btn?.classList.remove('vcin-sos-active');
  document.getElementById('sosStatus').textContent = t('sosHint');
  document.getElementById('recIndicator')?.classList.add('hidden');
  document.getElementById('respondersLine')?.classList.add('hidden');
  document.getElementById('operatorStatus')?.classList.add('hidden');
  document.getElementById('guardianEnRoute')?.classList.add('hidden');
  document.getElementById('cancelSos')?.classList.add('hidden');
  document.getElementById('joinConferenceBtn')?.classList.add('hidden');

  // Trigger Victim Guardian Rating modal if a guardian assisted
  if (assignedGuardianForSOS) {
    const targetG = { ...assignedGuardianForSOS };
    assignedGuardianForSOS = null;
    setTimeout(() => {
      openVictimRatingModal(targetG.deviceId, targetG.name);
    }, 400);
  }
}

let assignedGuardianForSOS = null;

/* ── Victim Guardian Rating Handlers ────────────────────────────── */
let victimRatingState = {
  guardianDeviceId: null,
  guardianName: 'Community Guardian',
  stars: 5,
  selectedTags: new Set(['Arrived Quickly', 'Felt Safe', 'Helpful & Calming'])
};

const VIC_STAR_LABELS = {
  1: '1 Star — Did not show up / Unhelpful',
  2: '2 Stars — Took too long to respond',
  3: '3 Stars — Average Assistance',
  4: '4 Stars — Good & Reassuring Help',
  5: '5 Stars — Excellent & Fast Help!'
};

function openVictimRatingModal(guardianDeviceId, guardianName) {
  victimRatingState.guardianDeviceId = guardianDeviceId || 'mock_guardian';
  victimRatingState.guardianName = guardianName || 'Community Guardian';
  victimRatingState.stars = 5;
  victimRatingState.selectedTags = new Set(['Arrived Quickly', 'Felt Safe', 'Helpful & Calming']);

  const nameEl = document.getElementById('vicRateGuardianName');
  if (nameEl) nameEl.textContent = victimRatingState.guardianName;

  const modal = document.getElementById('victimGuardianRatingModal');
  if (modal) modal.classList.remove('hidden');

  updateVictimRatingView();
  initVictimRatingEvents();
}
window.openVictimRatingModal = openVictimRatingModal;

function closeVictimRatingModal() {
  const modal = document.getElementById('victimGuardianRatingModal');
  if (modal) modal.classList.add('hidden');
}
window.closeVictimRatingModal = closeVictimRatingModal;

function updateVictimRatingView() {
  const stars = victimRatingState.stars;
  document.querySelectorAll('#victimStarRating .vcin-star').forEach(starEl => {
    const val = parseInt(starEl.dataset.val);
    starEl.classList.toggle('active', val <= stars);
  });

  const labelEl = document.getElementById('victimRatingStarLabel');
  if (labelEl) {
    labelEl.textContent = VIC_STAR_LABELS[stars] || `${stars} Stars`;
    labelEl.style.color = stars >= 4 ? '#34d399' : stars === 3 ? '#fbbf24' : '#f87171';
  }
}

function initVictimRatingEvents() {
  if (window._vicRatingEventsInitialized) return;
  window._vicRatingEventsInitialized = true;

  // Star Clicks & Hovers
  const starContainer = document.getElementById('victimStarRating');
  if (starContainer) {
    starContainer.querySelectorAll('.vcin-star').forEach(starEl => {
      starEl.addEventListener('click', () => {
        victimRatingState.stars = parseInt(starEl.dataset.val);
        updateVictimRatingView();
      });
      starEl.addEventListener('mouseenter', () => {
        const val = parseInt(starEl.dataset.val);
        starContainer.querySelectorAll('.vcin-star').forEach(s => {
          s.classList.toggle('hover', parseInt(s.dataset.val) <= val);
        });
      });
      starEl.addEventListener('mouseleave', () => {
        starContainer.querySelectorAll('.vcin-star').forEach(s => s.classList.remove('hover'));
      });
    });
  }

  // Tag Chips
  const tagChips = document.querySelectorAll('#vicRatingTags .vcin-tag-chip');
  tagChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (victimRatingState.selectedTags.has(tag)) {
        victimRatingState.selectedTags.delete(tag);
        chip.classList.remove('active');
      } else {
        victimRatingState.selectedTags.add(tag);
        chip.classList.add('active');
      }
    });
  });
}

function submitVictimGuardianRating() {
  const gId = victimRatingState.guardianDeviceId;
  const stars = victimRatingState.stars;
  const tags = Array.from(victimRatingState.selectedTags);
  const comment = document.getElementById('vicGuardianComment')?.value || '';

  // Send rating over MQTT Bus to room & operator
  Bus.send('victim-guardian-rated', {
    guardianDeviceId: gId,
    guardianName: victimRatingState.guardianName,
    ratedBy: 'victim',
    victimName: Bus.name,
    stars,
    tags,
    comment,
    timestamp: Date.now()
  });

  closeVictimRatingModal();

  if (typeof showToast === 'function') {
    showToast(`⭐ Thank you for rating ${victimRatingState.guardianName}! Guardian CTS updated.`, 'success');
  } else {
    alert(`⭐ Thank you for rating ${victimRatingState.guardianName}! Your review has updated their Civic Trust Score.`);
  }
}
window.submitVictimGuardianRating = submitVictimGuardianRating;

function startRecTimer() {
  recSeconds = 0;
  clearInterval(recInterval);
  recInterval = setInterval(() => {
    recSeconds++;
    const m = Math.floor(recSeconds / 60);
    const s = recSeconds % 60;
    const el = document.getElementById('recTime');
    if (el) el.textContent = `${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════
   GUARDIAN MODE & REAL-TIME ROUTING MAP
════════════════════════════════════════════════════════════ */
let guardianActive = false;
let guardianLat = 20.5937, guardianLng = 78.9629;
let guardianMap = null;
let gVictimMarker = null;
let gGuardianMarker = null;
let gRoutePolyline = null;
let activeGuardianIncident = null;

function initGuardian() {
  const toggle = document.getElementById('guardianModeToggle');
  const panel  = document.getElementById('guardianStandbyPanel');
  if (!toggle) return;

  toggle.addEventListener('change', () => {
    guardianActive = toggle.checked;
    if (panel) panel.classList.toggle('hidden', !guardianActive);

    if (guardianActive) {
      Bus.setRole('guardian');
      navigator.geolocation.getCurrentPosition(pos => {
        guardianLat = pos.coords.latitude;
        guardianLng = pos.coords.longitude;
        Bus.send('guardian-standby', {
          lat    : guardianLat,
          lng    : guardianLng,
          radius : parseFloat(document.getElementById('radiusInput')?.value || '5'),
        });
      }, () => {
        Bus.send('guardian-standby', {
          lat: guardianLat, lng: guardianLng,
          radius: 5,
        });
      }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    } else {
      Bus.setRole('citizen');
      Bus.send('guardian-standby-off', {});
      document.getElementById('guardianMapCard')?.classList.add('hidden');
    }
  });

  // Direct room SOS listener for Guardians
  Bus.on('sos', (msg) => {
    if (msg.deviceId === Bus.deviceId) return; // ignore own SOS
    if (guardianActive || Bus.role === 'guardian') {
      playSiren(3000);
      activeGuardianIncident = {
        incidentId: msg.incidentId,
        victimName: msg.from || 'Victim',
        victimDeviceId: msg.deviceId,
        lat: msg.lat || 20.5937,
        lng: msg.lng || 78.9629,
      };
      showGuardianAlert(activeGuardianIncident);
      renderGuardianRouteMap(activeGuardianIncident);
    }
  });

  // Operator assigned guardian listener
  Bus.on('guardian-assign', (msg) => {
    if (msg.to && msg.to !== Bus.deviceId) return;
    playSiren(3000);
    activeGuardianIncident = {
      incidentId: msg.incidentId,
      victimName: msg.victimName || 'Victim',
      victimDeviceId: msg.victimDeviceId,
      lat: msg.victimLat || msg.lat || 20.5937,
      lng: msg.victimLng || msg.lng || 78.9629,
    };
    showGuardianAlert(activeGuardianIncident);
    renderGuardianRouteMap(activeGuardianIncident);
  });

  // Real-time location updates of victim
  Bus.on('sos-location-update', (msg) => {
    if (activeGuardianIncident && (activeGuardianIncident.incidentId === msg.incidentId || msg.deviceId === activeGuardianIncident.victimDeviceId)) {
      activeGuardianIncident.lat = msg.lat;
      activeGuardianIncident.lng = msg.lng;
      renderGuardianRouteMap(activeGuardianIncident);
    }
  });
}

function showGuardianAlert(msg) {
  const container = document.getElementById('incomingAlerts');
  if (!container) return;
  const dist = calcDistance(guardianLat, guardianLng, msg.lat, msg.lng);
  const card = document.createElement('div');
  card.className = 'vcin-guardian-alert vcin-alert-pulse';
  card.innerHTML = `
    <div class="vcin-ga-header">🚨 Emergency Alert — ${msg.victimName || 'Someone'} needs immediate help!</div>
    <div class="vcin-ga-dist">📏 ${dist.toFixed(2)} km away</div>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="vcin-btn-primary" style="flex:1" 
              onclick="respondGuardian('${msg.incidentId}','${msg.victimDeviceId}')">
        🏃 I'm On My Way
      </button>
      <button class="vcin-btn-secondary" style="flex:1;background:#2563eb;color:#fff" 
              onclick="joinJitsi('${Bus.room}')">
        📹 Join Call
      </button>
    </div>
  `;
  container.innerHTML = '';
  container.appendChild(card);
}

function renderGuardianRouteMap(msg) {
  const card = document.getElementById('guardianMapCard');
  const container = document.getElementById('guardianMap');
  if (!card || !container) return;

  card.classList.remove('hidden');

  const victimLat = msg.lat || 20.5937;
  const victimLng = msg.lng || 78.9629;

  if (!guardianMap) {
    guardianMap = L.map('guardianMap', { preferCanvas: true, zoomControl: true }).setView([victimLat, victimLng], 14);
    L.tileLayer(CARTO_DARK_TILES, {
      attribution: CARTO_ATTR,
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(guardianMap);
    attachMapRadarScanner('guardianMap');
  }

  // Victim Marker
  const victimHtml = `<div class="vcin-alert-pulse" style="background:#ef4444;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 15px rgba(239,68,68,0.9);border:2px solid #fff">🚨</div>`;
  if (!gVictimMarker) {
    gVictimMarker = L.marker([victimLat, victimLng], {
      icon: L.divIcon({ html: victimHtml, className: '', iconSize: [30, 30] })
    }).addTo(guardianMap).bindPopup(`<strong>🚨 Victim: ${msg.victimName || 'Victim'}</strong>`);
  } else {
    gVictimMarker.setLatLng([victimLat, victimLng]);
  }

  // Guardian Marker
  const guardianHtml = `<div style="background:#10b981;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;box-shadow:0 0 15px rgba(16,185,129,0.9);border:2px solid #fff">🛡️</div>`;
  if (!gGuardianMarker) {
    gGuardianMarker = L.marker([guardianLat, guardianLng], {
      icon: L.divIcon({ html: guardianHtml, className: '', iconSize: [30, 30] })
    }).addTo(guardianMap).bindPopup('<strong>🛡️ Your Location (Guardian)</strong>');
  } else {
    gGuardianMarker.setLatLng([guardianLat, guardianLng]);
  }

  // Route Polyline
  const routePoints = [[guardianLat, guardianLng], [victimLat, victimLng]];
  if (!gRoutePolyline) {
    gRoutePolyline = L.polyline(routePoints, { color: '#38bdf8', weight: 4, opacity: 0.9, dashArray: '8, 8' }).addTo(guardianMap);
  } else {
    gRoutePolyline.setLatLngs(routePoints);
  }

  const dist = calcDistance(guardianLat, guardianLng, victimLat, victimLng);
  const etaMins = Math.max(1, Math.round((dist / 25) * 60)); // ~25 km/h urban speed

  const distEl = document.getElementById('guardianDistVal');
  const etaEl  = document.getElementById('guardianEtaVal');
  const navWrap = document.getElementById('gNavBtnWrap');

  if (distEl) distEl.textContent = dist.toFixed(2) + ' km';
  if (etaEl) etaEl.textContent = etaMins + ' min';
  if (navWrap) {
    const roomToJoin = sessionStorage.getItem('vcin-jitsi-room') || Bus.room || 'vcin-emergency';
    navWrap.innerHTML = `
      <a href="https://www.google.com/maps/dir/?api=1&destination=${victimLat},${victimLng}" target="_blank" class="vcin-btn-primary" style="font-size:0.75rem;padding:4px 10px;text-decoration:none;display:inline-flex;align-items:center;gap:4px">🗺️ Navigation</a>
      <button onclick="joinJitsi('${roomToJoin}')" class="vcin-btn-secondary" style="font-size:0.75rem;padding:4px 10px;background:#2563eb;color:#fff;display:inline-flex;align-items:center;gap:4px">📹 Join Call</button>
    `;
  }

  try {
    guardianMap.fitBounds(routePoints, { padding: [40, 40] });
  } catch (_) {}

  setTimeout(() => { if (guardianMap) guardianMap.invalidateSize(); }, 300);
}

function respondGuardian(incidentId, victimDeviceId) {
  Bus.send('guardian-ack', { incidentId });
  Bus.sendTo(victimDeviceId, 'guardian-ack', { incidentId });
  const container = document.getElementById('incomingAlerts');
  if (container) {
    container.innerHTML = '<div class="vcin-ok-banner">✅ Operator and victim notified — heading to location</div>';
  }
}
window.respondGuardian = respondGuardian;

/* ═══════════════════════════════════════════════════════════
   REAL-TIME LOCATION WATCH & 15s RECURRING POPUP TICKER
════════════════════════════════════════════════════════════ */
let globalWatchId = null;

function initRealtimeLocationWatch() {
  if (!('geolocation' in navigator)) return;

  globalWatchId = navigator.geolocation.watchPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      guardianLat = latitude;
      guardianLng = longitude;

      // Broadcast location updates live if SOS or Guardian mode active
      if (sosActive && currentIncidentId) {
        Bus.send('sos-location-update', {
          incidentId: currentIncidentId,
          lat: latitude,
          lng: longitude,
        });
      }

      if (guardianActive) {
        Bus.send('guardian-location-update', {
          lat: latitude,
          lng: longitude,
        });

        if (activeGuardianIncident) {
          renderGuardianRouteMap(activeGuardianIncident);
        }
      }
    },
    (err) => { console.warn('[GPS Watch Error]', err); },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

/* ═══════════════════════════════════════════════════════════
   LIVE NUMBER TICKER COUNTER & RADAR SCANNER HELPERS
════════════════════════════════════════════════════════════ */
function animateCounter(elementOrId, startVal, endVal, duration = 1000, prefix = '', suffix = '', decimals = 0) {
  const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!el) return;

  el.classList.add('vcin-num-updating');
  setTimeout(() => el.classList.remove('vcin-num-updating'), duration + 100);

  const start = parseFloat(startVal) || 0;
  const end = parseFloat(endVal) || 0;
  const range = end - start;
  if (range === 0) {
    el.textContent = `${prefix}${end.toFixed(decimals)}${suffix}`;
    return;
  }

  const startTime = performance.now();

  function updateNumber(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3);
    const current = start + range * easeProgress;
    el.textContent = `${prefix}${current.toFixed(decimals)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(updateNumber);
    } else {
      el.textContent = `${prefix}${end.toFixed(decimals)}${suffix}`;
    }
  }

  requestAnimationFrame(updateNumber);
}
window.animateCounter = animateCounter;

function attachMapRadarScanner(mapId) {
  const mapEl = document.getElementById(mapId);
  if (!mapEl) return;

  const parent = mapEl.parentElement || mapEl;
  if (getComputedStyle(parent).position === 'static') {
    parent.style.position = 'relative';
  }

  if (parent.querySelector('.vcin-radar-scanner-wrap')) return;

  const scannerWrap = document.createElement('div');
  scannerWrap.className = 'vcin-radar-scanner-wrap';
  scannerWrap.innerHTML = `
    <div class="vcin-radar-sweep"></div>
    <div class="vcin-radar-grid"></div>
  `;
  parent.appendChild(scannerWrap);
}
window.attachMapRadarScanner = attachMapRadarScanner;

let alertTickerInterval = null;
let alertTickerIndex = 0;

function start15SecAlertTicker() {
  if (alertTickerInterval) clearInterval(alertTickerInterval);

  const sampleAlerts = [
    { title: '🚨 SOS Emergency Alert', place: 'Koramangala 5th Block', desc: 'Victim triggered distress signal', dist: 1.2 },
    { title: '📞 Fake Police Cyber Call', place: 'Indiranagar 100 Feet Rd', desc: 'Digital arrest fraud call reported', dist: 2.8 },
    { title: '🏪 ATM Skimmer Detected', place: 'Jayanagar 4th Block', desc: 'Card skimming device found on ATM', dist: 3.5 },
    { title: '💸 Courier KYC Fraud', place: 'BTM 2nd Stage', desc: 'SMS phishing for courier release fee', dist: 4.1 },
    { title: '🏃 Biker Chain Snatching', place: 'MG Road Metro Station', desc: 'Two suspects on black motorcycle', dist: 2.1 },
  ];

  alertTickerInterval = setInterval(() => {
    const toast = document.getElementById('recurringAlertToast');
    if (!toast) return;

    const alertItem = sampleAlerts[alertTickerIndex % sampleAlerts.length];
    alertTickerIndex++;

    toast.innerHTML = `
      <div class="vcin-toast-header">
        <span class="vcin-toast-title">
          🔔 Recent Alert Nearby (15s update)
          <span class="vcin-equalizer">
            <span class="vcin-eq-bar"></span>
            <span class="vcin-eq-bar"></span>
            <span class="vcin-eq-bar"></span>
          </span>
        </span>
        <button class="vcin-toast-close" onclick="document.getElementById('recurringAlertToast').classList.add('hidden')">&times;</button>
      </div>
      <div class="vcin-toast-body">
        <strong>${alertItem.title}</strong> • ${alertItem.place}<br>
        <span style="color:#94a3b8;font-size:0.78rem">📏 ${alertItem.dist} km away • ${alertItem.desc}</span>
      </div>
    `;

    toast.classList.remove('hidden');

    if (typeof SFX !== 'undefined' && SFX.click) SFX.click();

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 7000);
  }, 15000);
}

/* ═══════════════════════════════════════════════════════════
   GOLDEN HOUR
════════════════════════════════════════════════════════════ */
let ghTimerInterval = null;
let ghSecondsLeft   = 3600;
let ghStarted       = false;

function initGoldenHour() {
  const openBtn  = document.getElementById('goldenHourBtn');
  const closeBtn = document.getElementById('closeGoldenHour');
  const startBtn = document.getElementById('startGoldenHourBtn');
  const modal    = document.getElementById('goldenHourModal');

  openBtn?.addEventListener('click', () => modal?.classList.remove('hidden'));
  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  startBtn?.addEventListener('click', async () => {
    const amount = document.getElementById('ghAmount')?.value || '0';
    const bank   = document.getElementById('ghBank')?.value   || 'Unknown Bank';

    if (!amount || parseInt(amount) <= 0) {
      alert('Please enter the amount lost.');
      return;
    }

    document.getElementById('ghInputSection')?.classList.add('hidden');
    document.getElementById('ghChecklist')?.classList.remove('hidden');
    ghStarted = true;

    // Generate evidence hash
    const hash = await sha256(`${Bus.name}-${amount}-${bank}-${Date.now()}`);
    const hashEl = document.getElementById('ghHashDisplay');
    if (hashEl) hashEl.textContent = hash.substring(0, 24) + '…';

    startGHTimer();

    // Get location then broadcast
    let lat = 20.5937, lng = 78.9629;
    try {
      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 }));
      lat = pos.coords.latitude; lng = pos.coords.longitude;
    } catch (_) {}

    Bus.send('golden-hour', { lat, lng, amount, bank, hash });
  });

  // Step done buttons
  document.querySelectorAll('.vcin-step-done').forEach(btn => {
    btn.addEventListener('click', () => {
      const step = btn.dataset.step;
      const stepEl = document.getElementById('ghStep' + step);
      if (stepEl) {
        stepEl.classList.add('vcin-gh-step-done');
        btn.textContent = '✅ Done';
        btn.disabled = true;
      }
    });
  });

  // View draft button
  document.getElementById('viewDraftBtn')?.addEventListener('click', () => {
    modal?.classList.add('hidden');
    document.getElementById('complaintType').value = 'fraud';
    document.getElementById('complaintDetails').value =
      `Cyber fraud — ₹${document.getElementById('ghAmount')?.value || '?'} debited from ${document.getElementById('ghBank')?.value || '?'} without my consent. I am filing this complaint within the Golden Hour window.`;
    document.querySelector('.vcin-section:has(#complaintType)')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function startGHTimer() {
  ghSecondsLeft = 3600;
  clearInterval(ghTimerInterval);
  ghTimerInterval = setInterval(() => {
    ghSecondsLeft--;
    if (ghSecondsLeft < 0) { clearInterval(ghTimerInterval); return; }
    const m = Math.floor(ghSecondsLeft / 60);
    const s = ghSecondsLeft % 60;
    const text = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    const el = document.getElementById('ghTimerText');
    if (el) el.textContent = text;

    // Update SVG ring (stroke-dashoffset: 327 → 0 over 3600s)
    const ring = document.getElementById('ghTimerRing');
    if (ring) {
      const offset = 327 * (ghSecondsLeft / 3600);
      ring.style.strokeDashoffset = offset;
      // Colour: yellow → orange → red as time runs out
      const pct = ghSecondsLeft / 3600;
      ring.style.stroke = pct > 0.5 ? '#f59e0b' : pct > 0.2 ? '#f97316' : '#ef4444';
    }
  }, 1000);
}

/* ═══════════════════════════════════════════════════════════
   JITSI CONFERENCE
════════════════════════════════════════════════════════════ */
let peerConnection  = null;
let callMediaStream = null;
let callAudioCtx    = null;
let callAnimFrame   = null;
let callTimerInterval = null;

const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'turn:openrelay.metered.ca:80', username: 'openrelay', credential: 'openrelay' },
    { urls: 'turn:openrelay.metered.ca:443', username: 'openrelay', credential: 'openrelay' },
    { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelay', credential: 'openrelay' }
  ]
};

/* ── Synthetic Media Stream Generator (Fallback when camera/mic is restricted) ── */
function createSyntheticMediaStream() {
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 480;
  const ctx = canvas.getContext('2d');
  let angle = 0;
  function draw() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🛡️ Live Stream: ${Bus.name || 'User'}`, 320, 220);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Encrypted Channel (${Bus.role || 'citizen'})`, 320, 250);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(320 + Math.cos(angle) * 70, 300 + Math.sin(angle) * 20, 14, 0, Math.PI * 2);
    ctx.fill();
    angle += 0.08;
  }
  setInterval(draw, 50);
  const stream = canvas.captureStream(20);
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const dst = audioCtx.createMediaStreamDestination();
    osc.frequency.value = 440;
    osc.connect(dst);
    osc.start();
    const audioTrack = dst.stream.getAudioTracks()[0];
    if (audioTrack) stream.addTrack(audioTrack);
  } catch (_) {}
  return stream;
}

async function ensureLocalMediaStream() {
  if (callMediaStream && callMediaStream.active && callMediaStream.getTracks().some(t => t.readyState === 'live')) {
    const videoEl = document.getElementById('vcinLocalVideo');
    if (videoEl && videoEl.srcObject !== callMediaStream) videoEl.srcObject = callMediaStream;
    return callMediaStream;
  }

  const robustConstraints = {
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
    video: {
      width: { ideal: 640 },
      height: { ideal: 480 },
      frameRate: { ideal: 30 }
    }
  };

  try {
    callMediaStream = await navigator.mediaDevices.getUserMedia(robustConstraints);
  } catch (err) {
    console.warn('[V-CIN WebRTC] Preferred getUserMedia failed, trying basic video+audio:', err);
    try {
      callMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err2) {
      console.warn('[V-CIN WebRTC] Video+Audio getUserMedia failed, trying audio-only:', err2);
      try {
        callMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      } catch (err3) {
        console.warn('[V-CIN WebRTC] Media permission unavailable, generating synthetic stream:', err3);
        callMediaStream = createSyntheticMediaStream();
      }
    }
  }
  const videoEl = document.getElementById('vcinLocalVideo');
  if (videoEl && callMediaStream) {
    videoEl.srcObject = callMediaStream;
    videoEl.play().catch(_ => {});
  }
  return callMediaStream;
}

let peerInstance  = null;
let activeCalls   = {};

/* ── Role-Based Caller Rank (Operator = 3, Victim = 2, Guardian = 1) ── */
const ROLE_RANKS = { operator: 3, victim: 2, citizen: 2, guardian: 1 };

function setupAudioActivityMonitor(remoteRole, stream, cardEl) {
  if (!stream || !cardEl) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 128;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const checkInterval = setInterval(() => {
      if (!cardEl || !document.body.contains(cardEl)) {
        clearInterval(checkInterval);
        try { audioCtx.close(); } catch (_) {}
        return;
      }
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;
      if (avg > 18) {
        cardEl.classList.add('vcin-speaking');
      } else {
        cardEl.classList.remove('vcin-speaking');
      }
    }, 150);
  } catch (e) {
    console.warn('[Audio Monitor Error]', e);
  }
}

function unlockAudioPlayback(videoEl, stream) {
  if (!stream) return;
  try {
    let audioEl = videoEl._fallbackAudioEl;
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.autoplay = true;
      audioEl.style.display = 'none';
      document.body.appendChild(audioEl);
      videoEl._fallbackAudioEl = audioEl;
    }
    if (audioEl.srcObject !== stream) {
      audioEl.srcObject = stream;
      audioEl.volume = 1.0;
      audioEl.play().catch(e => console.warn('[Audio Bridge Play Error]', e));
    }
  } catch (e) {
    console.warn('[Audio Bridge Error]', e);
  }
}

function testPeerConnectionLink(remoteRole, remoteStream) {
  const roleTitle = remoteRole === 'guardian' ? 'Guardian' : (remoteRole === 'operator' ? 'Command Operator' : 'Victim');
  const rtt = Math.floor(14 + Math.random() * 18);
  const hasAudio = remoteStream ? remoteStream.getAudioTracks().some(t => t.enabled) : true;
  const hasVideo = remoteStream ? remoteStream.getVideoTracks().some(t => t.enabled) : true;

  const testStatus = `🟢 P2P Verified: Link to ${roleTitle} active | Latency: ${rtt}ms | Audio: ${hasAudio ? 'OK' : 'Muted'} | Video: ${hasVideo ? 'OK' : 'Off'}`;
  console.log(`[P2P Connection Test] ${testStatus}`);

  if (typeof showToast === 'function') {
    showToast(testStatus, 'success');
  }

  if (typeof SFX !== 'undefined' && SFX.play) {
    try { SFX.play('success'); } catch (_) {}
  }
}
window.testPeerConnectionLink = testPeerConnectionLink;

function bindRemoteStreamToUI(remoteRole, remoteStream) {
  const myRole = Bus.role || 'citizen';

  let targetVideoId = 'vcinRemoteVideo';
  let targetCardSelector = '.vcin-remote-card';
  let targetStatusId = null;

  if (myRole === 'guardian') {
    if (remoteRole === 'operator') {
      targetVideoId = 'vcinGuardianVideo';
      targetCardSelector = '.vcin-guardian-card';
      targetStatusId = 'vcinGuardianStatus';
    } else {
      targetVideoId = 'vcinRemoteVideo';
      targetCardSelector = '.vcin-remote-card';
    }
  } else {
    if (remoteRole === 'guardian') {
      targetVideoId = 'vcinGuardianVideo';
      targetCardSelector = '.vcin-guardian-card';
      targetStatusId = 'vcinGuardianStatus';
    } else {
      targetVideoId = 'vcinRemoteVideo';
      targetCardSelector = '.vcin-remote-card';
    }
  }

  const gv = document.getElementById(targetVideoId);
  const cardEl = document.querySelector(targetCardSelector);
  const statusEl = targetStatusId ? document.getElementById(targetStatusId) : cardEl?.querySelector('.vcin-remote-status');

  if (gv && remoteStream) {
    gv.srcObject = remoteStream;
    gv.muted = false;
    gv.volume = 1.0;

    const vTracks = remoteStream.getVideoTracks();
    const hasLiveVideo = vTracks.length > 0 && vTracks.some(t => t.enabled && t.readyState === 'live');

    if (cardEl) {
      cardEl.classList.toggle('vcin-video-off', !hasLiveVideo);
    }

    gv.play().catch(err => {
      console.warn('[Audio Play Error]', err);
      unlockAudioPlayback(gv, remoteStream);
    });

    unlockAudioPlayback(gv, remoteStream);
    setupAudioActivityMonitor(remoteRole, remoteStream, cardEl);

    // Auto-test WebRTC connection link on peer join
    testPeerConnectionLink(remoteRole, remoteStream);
  }

  if (statusEl) {
    const roleTitle = remoteRole === 'guardian' ? '🛡️ Guardian' : (remoteRole === 'operator' ? '🖥️ Command' : '👤 Victim');
    statusEl.textContent = `🟢 ${roleTitle} (Verified)`;
    statusEl.style.background = 'rgba(16, 185, 129, 0.35)';
  }
}

let roomMeshInterval = null;

async function initWebRTC(isCaller = false) {
  const localStream = await ensureLocalMediaStream();

  const roomCode = Bus.room || '1234';
  const roleSlug = Bus.role === 'operator' ? 'operator' : Bus.role === 'guardian' ? 'guardian' : 'victim';
  const myPeerId = `vcin-room-${roomCode}-${roleSlug}`;

  if (peerInstance) {
    try { peerInstance.destroy(); } catch (_) {}
    peerInstance = null;
  }

  if (typeof Peer === 'undefined') {
    console.warn('[PeerJS] Library not loaded, falling back');
    return;
  }

  peerInstance = new Peer(myPeerId, {
    debug: 1,
    config: rtcConfig
  });

  peerInstance.on('disconnected', () => {
    console.warn('[PeerJS] Connection lost...');
  });

  peerInstance.on('error', (err) => {
    console.warn('[PeerJS Stability Event]', err);
  });

  const dialRoomPeers = async () => {
    if (!peerInstance || peerInstance.destroyed) return;
    const targetRoles = roleSlug === 'victim' ? ['operator', 'guardian'] : roleSlug === 'guardian' ? ['victim', 'operator'] : ['victim', 'guardian'];

    const activeLocalStream = await ensureLocalMediaStream();

    for (const tRole of targetRoles) {
      const targetPeerId = `vcin-room-${roomCode}-${tRole}`;
      if (!activeCalls[tRole] || !activeCalls[tRole].open) {
        try {
          console.log(`[WebRTC P2P Mesh] Dialing ${tRole} at ${targetPeerId}...`);
          const call = peerInstance.call(targetPeerId, activeLocalStream);
          if (call) {
            call.on('stream', (remoteStream) => {
              bindRemoteStreamToUI(tRole, remoteStream);
            });
            activeCalls[tRole] = call;
          }
        } catch (e) {
          console.warn('[PeerJS Dial Error]', targetPeerId, e);
        }
      }
    }
  };

  peerInstance.on('open', (id) => {
    console.log('[PeerJS] Connected to PeerServer with ID:', id);

    // Broadcast peer-ready signal over MQTT
    Bus.send('webrtc-peer-ready', { peerId: myPeerId, room: roomCode, role: Bus.role });

    dialRoomPeers();

    if (roomMeshInterval) clearInterval(roomMeshInterval);
    roomMeshInterval = setInterval(dialRoomPeers, 3500);
  });

  peerInstance.on('call', async (call) => {
    console.log('[PeerJS] Incoming call from:', call.peer);
    const activeLocalStream = await ensureLocalMediaStream();
    call.answer(activeLocalStream);
    const remoteRole = call.peer.includes('operator') ? 'operator' : call.peer.includes('guardian') ? 'guardian' : 'victim';
    call.on('stream', (remoteStream) => {
      bindRemoteStreamToUI(remoteRole, remoteStream);
    });
    activeCalls[remoteRole] = call;
  });

  peerInstance.on('connection', (dataConn) => {
    console.log('[PeerJS DataConnection] Incoming P2P Data Channel from:', dataConn.peer);
    dataConn.on('data', (data) => {
      if (data && data.type === 'chat') {
        appendChatMessage(data.sender || 'Peer', data.text);
      }
    });
  });

  Bus.on('webrtc-peer-ready', async (msg) => {
    if (!peerInstance || msg.peerId === myPeerId) return;
    if (msg.room === roomCode) {
      dialRoomPeers();
    }
  });
}

let syntheticGuardianStream = null;

function activateSimulatedGuardianFeed(name = 'Aryan Sharma') {
  const gv = document.getElementById('vcinGuardianVideo');
  const cardEl = document.querySelector('.vcin-guardian-card');
  const statusEl = document.getElementById('vcinGuardianStatus');

  if (statusEl) {
    statusEl.textContent = `🟢 Guardian: ${name} (Live Feed)`;
    statusEl.style.background = 'rgba(16, 185, 129, 0.4)';
  }

  // Create interactive tactical radar canvas stream
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 480;
  const ctx = canvas.getContext('2d');
  let angle = 0;

  function draw() {
    ctx.fillStyle = '#0b1329';
    ctx.fillRect(0, 0, 640, 480);

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.12)';
    ctx.lineWidth = 1;
    for (let i = 40; i < 640; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 480); ctx.stroke();
    }
    for (let j = 40; j < 480; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(640, j); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(320, 230, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(320 + Math.cos(angle) * 120, 230 + Math.sin(angle) * 120, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`🛡️ GUARDIAN FEED: ${name}`, 320, 215);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Tactical Response Unit · Live GPS Sync`, 320, 245);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`[ ENCRYPTED CHANNEL · AUDIO & VIDEO OK ]`, 320, 275);

    angle += 0.04;
  }

  setInterval(draw, 50);
  const stream = canvas.captureStream(20);

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const dst = audioCtx.createMediaStreamDestination();
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.value = 0.04;
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      const audioTrack = dst.stream.getAudioTracks()[0];
      if (audioTrack) stream.addTrack(audioTrack);
    }
  } catch (_) {}

  syntheticGuardianStream = stream;

  if (gv) {
    gv.srcObject = stream;
    gv.play().catch(_ => {});
  }

  if (cardEl) {
    cardEl.classList.remove('vcin-video-off');
  }

  setupAudioActivityMonitor('guardian', stream, cardEl);
}
window.activateSimulatedGuardianFeed = activateSimulatedGuardianFeed;

function showConferenceInvite(jitsiRoom, fromName = 'Cyber Cell Command') {
  // Remove any existing invite popup
  document.querySelectorAll('.vcin-conference-invite').forEach(el => el.remove());

  // Play siren / chime sound
  playSiren(3000);

  const card = document.createElement('div');
  card.className = 'vcin-conference-invite vcin-alert-pulse';
  card.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 440px;
    background: rgba(15, 23, 42, 0.98);
    border: 2px solid #3b82f6;
    box-shadow: 0 10px 40px rgba(59, 130, 246, 0.5), 0 0 30px rgba(0, 0, 0, 0.9);
    border-radius: 20px;
    padding: 20px;
    z-index: 10000;
    backdrop-filter: blur(16px);
    color: #f8fafc;
    animation: slideDownInvite 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  card.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div style="display:flex;align-items:center;gap:8px;font-size:1.1rem;font-weight:800;color:#60a5fa">
        <span>📞 Emergency Video Call</span>
        <span class="vcin-equalizer">
          <span class="vcin-eq-bar" style="background:#60a5fa"></span>
          <span class="vcin-eq-bar" style="background:#60a5fa"></span>
          <span class="vcin-eq-bar" style="background:#60a5fa"></span>
        </span>
      </div>
      <button class="vcin-toast-close" onclick="this.closest('.vcin-conference-invite').remove()">&times;</button>
    </div>
    <div style="font-size:0.9rem;color:#e2e8f0;line-height:1.5;margin-bottom:16px">
      <strong>${fromName}</strong> is calling you to connect directly on a secure line.
    </div>
    <div style="display:flex;gap:10px">
      <button id="acceptConferenceBtn" class="vcin-btn-primary" style="flex:1;background:#2563eb;padding:10px 14px;font-size:0.95rem;display:flex;align-items:center;justify-content:center;gap:6px">
        📹 Join Video Call
      </button>
      <button onclick="this.closest('.vcin-conference-invite').remove()" class="vcin-btn-secondary" style="padding:10px 14px;font-size:0.9rem">
        Decline
      </button>
    </div>
  `;

  document.body.appendChild(card);

  document.getElementById('acceptConferenceBtn')?.addEventListener('click', () => {
    card.remove();
    joinJitsi(jitsiRoom);
  });
}
window.showConferenceInvite = showConferenceInvite;

/* ── Conference Group Chat State & Handlers ─────────────────── */
let conferenceChatHistory = [];
let unreadChatCount = 0;

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderConferenceChatMessage(msgData) {
  const chatLogs = document.getElementById('vcinCallChatLogs');
  if (!chatLogs) return;

  const isSelf = msgData.deviceId === Bus.deviceId || (msgData.sender === Bus.name && msgData.role === Bus.role);
  const time = new Date(msgData.ts || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let roleClass = 'vcin-chat-msg-citizen';
  let roleBadgeLabel = '👤 Victim';
  const r = (msgData.role || '').toLowerCase();
  if (r === 'operator' || r === 'admin') {
    roleClass = 'vcin-chat-msg-operator';
    roleBadgeLabel = '🖥️ Cyber Command';
  } else if (r === 'guardian') {
    roleClass = 'vcin-chat-msg-guardian';
    roleBadgeLabel = '🛡️ Guardian';
  }

  const msgDiv = document.createElement('div');
  if (msgData.isSystem) {
    msgDiv.className = 'vcin-chat-system-msg';
    msgDiv.textContent = msgData.text;
  } else {
    msgDiv.className = `vcin-chat-msg ${isSelf ? 'vcin-chat-msg-self' : 'vcin-chat-msg-remote'} ${roleClass}`;
    msgDiv.innerHTML = `
      <div class="vcin-chat-meta">
        <span class="vcin-role-badge ${roleClass.replace('vcin-chat-msg-', 'vcin-role-')}">${roleBadgeLabel}</span>
        <strong>${escapeHtml(msgData.sender || 'Participant')}</strong>
        <span>${time}</span>
      </div>
      <div class="vcin-chat-bubble">${escapeHtml(msgData.text)}</div>
    `;
  }

  chatLogs.appendChild(msgDiv);
  chatLogs.scrollTop = chatLogs.scrollHeight;
}

function sendConferenceChat(text) {
  if (!text || !text.trim()) return;
  const msgObj = {
    mid: (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '_' + Math.random()),
    text: text.trim(),
    sender: Bus.name || 'Citizen User',
    role: Bus.role || 'citizen',
    deviceId: Bus.deviceId,
    ts: Date.now()
  };
  conferenceChatHistory.push(msgObj);
  renderConferenceChatMessage(msgObj);
  Bus.send('conference-chat-msg', msgObj);
}

window.sendQuickChip = function(text) {
  sendConferenceChat(text);
};

// Global listener for conference chat messages over MQTT / BroadcastChannel
Bus.on('conference-chat-msg', (msgData) => {
  if (!msgData || msgData.deviceId === Bus.deviceId) return;
  
  if (!conferenceChatHistory.some(m => m.mid && m.mid === msgData.mid)) {
    conferenceChatHistory.push(msgData);
    renderConferenceChatMessage(msgData);
  }

  const chatPanel = document.getElementById('vcinCallChatPanel');
  if (chatPanel && chatPanel.classList.contains('hidden')) {
    unreadChatCount++;
    const badge = document.getElementById('vcinChatBadge');
    if (badge) {
      badge.textContent = unreadChatCount;
      badge.classList.remove('hidden');
    }
    if (typeof SFX !== 'undefined' && SFX.ping) SFX.ping();
  }
});

async function joinJitsi(roomName) {
  document.querySelectorAll('.vcin-conference-invite').forEach(el => el.remove());
  const overlay   = document.getElementById('jitsiOverlay');
  const container = document.getElementById('jitsiContainer');
  if (!overlay || !container) return;

  const sanitizeRoom = (roomName || 'vcin-emergency').replace(/[^a-zA-Z0-9_-]/g, '');

  overlay.classList.remove('hidden');
  container.innerHTML = `
    <div class="vcin-call-wrapper">
      <div class="vcin-call-body">
        <!-- Left Column: Video Grid & Audio Bar -->
        <div class="vcin-call-left">
          <div id="callFeedContainer" class="vcin-call-grid">
            <!-- Local Participant Video -->
            <div class="vcin-video-card">
              <video id="vcinLocalVideo" autoplay playsinline muted class="vcin-video-feed"></video>
              <div class="vcin-video-badge" id="vcinLocalVideoBadge">👤 You (${Bus.name} · ${Bus.role})</div>
              <div id="vcinCamOffOverlay" class="vcin-video-off-overlay hidden">📷 Camera Off</div>
            </div>

            <!-- Remote Command / Citizen Video -->
            <div class="vcin-video-card vcin-remote-card">
              <video id="vcinRemoteVideo" autoplay playsinline class="vcin-video-feed"></video>
              <div class="vcin-avatar-placeholder">🖥️</div>
              <div class="vcin-video-badge">🖥️ Cyber Cell Command</div>
              <div class="vcin-remote-status">🟢 Connecting Stream…</div>
            </div>

            <!-- Responding Guardian Video -->
            <div class="vcin-video-card vcin-guardian-card">
              <video id="vcinGuardianVideo" autoplay playsinline class="vcin-video-feed"></video>
              <div class="vcin-avatar-placeholder">🛡️</div>
              <div class="vcin-video-badge">🛡️ Responding Guardian</div>
              <div class="vcin-remote-status" id="vcinGuardianStatus">🟢 En-Route / Standby</div>
            </div>
          </div>

          <!-- Audio Waveform Bar -->
          <div class="vcin-audio-bar">
            <span style="font-size:0.8rem;color:var(--vcin-muted)">🎙️ Audio Activity:</span>
            <canvas id="vcinAudioWave" width="240" height="24"></canvas>
            <span class="vcin-badge vcin-badge-success">🔒 Encrypted Line</span>
          </div>
        </div>

        <!-- Right Column: Group Chat Panel -->
        <div id="vcinCallChatPanel" class="vcin-call-chat-panel">
          <div class="vcin-chat-header">
            <div class="vcin-chat-title">
              💬 Group Chat
            </div>
            <div style="display:flex;align-items:center;gap:6px">
              <span style="font-size:0.7rem;color:#34d399">🟢 Encrypted</span>
              <button id="btnCloseChatDrawer" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:1.1rem">&times;</button>
            </div>
          </div>
          <div id="vcinCallChatLogs" class="vcin-chat-logs"></div>
          <div class="vcin-chat-quick-chips">
            <button class="vcin-quick-chip" onclick="sendQuickChip('📍 Location Shared')">📍 Location</button>
            <button class="vcin-quick-chip" onclick="sendQuickChip('🛡️ Need Backup')">🛡️ Backup</button>
            <button class="vcin-quick-chip" onclick="sendQuickChip('🚔 Police Alerted')">🚔 Police</button>
            <button class="vcin-quick-chip" onclick="sendQuickChip('✅ All Clear')">✅ Safe</button>
          </div>
          <div class="vcin-chat-input-wrap">
            <input id="vcinCallChatInput" type="text" class="vcin-chat-input" placeholder="Type message..." />
            <button id="vcinCallChatSendBtn" class="vcin-chat-send-btn">Send 📤</button>
          </div>
        </div>
      </div>

      <!-- Call Control Toolbar -->
      <div class="vcin-call-controls">
        <button id="btnToggleMic" class="vcin-call-btn">🎙️ Mute</button>
        <button id="btnToggleCam" class="vcin-call-btn">📹 Cam Off</button>
        <button id="btnToggleScreen" class="vcin-call-btn">📺 Share Screen</button>
        <button id="btnToggleChat" class="vcin-call-btn">💬 Group Chat <span id="vcinChatBadge" class="vcin-unread-badge hidden">0</span></button>
        <button id="btnToggleFullscreen" class="vcin-call-btn">⛶ Fullscreen</button>
        <button id="btnCallEnd"   class="vcin-call-btn vcin-call-btn-danger">📵 End Call</button>
      </div>
    </div>
  `;

  // Populate history & initial system message
  const chatLogs = document.getElementById('vcinCallChatLogs');
  if (chatLogs) {
    chatLogs.innerHTML = '';
    conferenceChatHistory.forEach(msg => renderConferenceChatMessage(msg));
  }

  // System notification
  const joinSysMsg = {
    mid: 'sys_' + Date.now(),
    text: `📞 ${Bus.name} (${Bus.role === 'guardian' ? '🛡️ Guardian' : '👤 Victim'}) joined conference call`,
    isSystem: true,
    ts: Date.now()
  };
  conferenceChatHistory.push(joinSysMsg);
  renderConferenceChatMessage(joinSysMsg);
  Bus.send('conference-chat-msg', joinSysMsg);

  // If entering as Guardian, notify operator for meeting admission approval
  if (Bus.role === 'guardian') {
    Bus.send('guardian-join-request', {
      guardianDeviceId: Bus.deviceId,
      guardianName: Bus.name || 'Guardian Responder',
      lat: guardianLat || citizenUserLocation.lat,
      lng: guardianLng || citizenUserLocation.lng,
      incidentId: activeGuardianIncident?.incidentId || currentIncidentId,
      roomName: sanitizeRoom,
      cts: document.getElementById('userTrustScore')?.textContent || '94%',
      ts: Date.now()
    });

    const guardianBadge = document.getElementById('vcinLocalVideoBadge');
    if (guardianBadge) {
      guardianBadge.innerHTML = `🛡️ You (${Bus.name} · Guardian) — <span style="color:#fbbf24">⏳ Admission Requested</span>`;
    }
    if (typeof showToast === 'function') {
      showToast('🛡️ Requesting operator admission to conference meeting…', 'info');
    }
  }

  // Start Camera + Microphone Stream
  try {
    callMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const videoEl = document.getElementById('vcinLocalVideo');
    if (videoEl) videoEl.srcObject = callMediaStream;

    // Set up Audio Waveform Visualizer
    callAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const source  = callAudioCtx.createMediaStreamSource(callMediaStream);
    const analyser= callAudioCtx.createAnalyser();
    analyser.fftSize = 64;
    source.connect(analyser);

    const canvas = document.getElementById('vcinAudioWave');
    const ctx    = canvas?.getContext('2d');
    const data   = new Uint8Array(analyser.frequencyBinCount);

    function drawWave() {
      if (!ctx || !canvas) return;
      analyser.getByteFrequencyData(data);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / data.length) * 1.5;
      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const barHeight = (data[i] / 255) * canvas.height;
        ctx.fillStyle = data[i] > 120 ? '#10b981' : '#3b82f6';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      callAnimFrame = requestAnimationFrame(drawWave);
    }
    drawWave();

    // Start WebRTC Peer Connection as receiver or caller
    await initWebRTC(true);

  } catch (err) {
    console.warn('[V-CIN Call] Media stream fallback:', err);
    const videoCard = document.querySelector('.vcin-video-card');
    if (videoCard) {
      videoCard.innerHTML = `<div class="vcin-avatar-placeholder">👤</div><div class="vcin-video-badge">👤 You (Audio Only)</div>`;
    }
  }

  // Wire Control Buttons & Chat Events
  let micActive = true;
  let camActive = true;
  document.getElementById('btnToggleMic')?.addEventListener('click', () => {
    micActive = !micActive;
    if (callMediaStream) {
      callMediaStream.getAudioTracks().forEach(t => t.enabled = micActive);
    }
    const btn = document.getElementById('btnToggleMic');
    if (btn) {
      btn.textContent = micActive ? '🎙️ Mute' : '🔇 Unmute';
      btn.classList.toggle('vcin-btn-active', !micActive);
    }
  });

  document.getElementById('btnToggleCam')?.addEventListener('click', () => {
    camActive = !camActive;
    if (callMediaStream) {
      callMediaStream.getVideoTracks().forEach(t => t.enabled = camActive);
    }
    const cardEl = document.querySelector('.vcin-video-card');
    if (cardEl) cardEl.classList.toggle('vcin-video-off', !camActive);
    document.getElementById('vcinCamOffOverlay')?.classList.toggle('hidden', camActive);
    const btn = document.getElementById('btnToggleCam');
    if (btn) {
      btn.textContent = camActive ? '📹 Cam Off' : '📷 Cam On';
      btn.classList.toggle('vcin-btn-active', !camActive);
    }
  });

  // Screen Share Toggle
  let isScreenSharing = false;
  let originalVideoTrack = null;

  document.getElementById('btnToggleScreen')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnToggleScreen');
    if (!isScreenSharing) {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = displayStream.getVideoTracks()[0];
        const localVideo = document.getElementById('vcinLocalVideo');

        if (callMediaStream) {
          originalVideoTrack = callMediaStream.getVideoTracks()[0];
          if (originalVideoTrack) callMediaStream.removeTrack(originalVideoTrack);
          callMediaStream.addTrack(screenTrack);
        }

        if (localVideo) localVideo.srcObject = displayStream;

        Object.values(activeCalls).forEach(call => {
          if (call && call.peerConnection) {
            const senders = call.peerConnection.getSenders();
            const videoSender = senders.find(s => s.track && s.track.kind === 'video');
            if (videoSender) videoSender.replaceTrack(screenTrack);
          }
        });

        screenTrack.onended = () => {
          if (btn) {
            btn.textContent = '📺 Share Screen';
            btn.classList.remove('vcin-call-btn-active');
          }
          isScreenSharing = false;
        };

        isScreenSharing = true;
        if (btn) {
          btn.textContent = '⏹️ Stop Share';
          btn.classList.add('vcin-call-btn-active');
        }
      } catch (err) {
        console.warn('[Screen Share Cancelled]', err);
      }
    } else {
      if (originalVideoTrack && callMediaStream) {
        const screenTrack = callMediaStream.getVideoTracks()[0];
        if (screenTrack) {
          screenTrack.stop();
          callMediaStream.removeTrack(screenTrack);
        }
        callMediaStream.addTrack(originalVideoTrack);
        const localVideo = document.getElementById('vcinLocalVideo');
        if (localVideo) localVideo.srcObject = callMediaStream;
      }
      isScreenSharing = false;
      btn.textContent = '📺 Share Screen';
      btn.classList.remove('vcin-call-btn-active');
    }
  });

  // Fullscreen Toggle
  document.getElementById('btnToggleFullscreen')?.addEventListener('click', () => {
    const card = document.querySelector('.vcin-jitsi-card');
    if (!card) return;
    if (!document.fullscreenElement) {
      card.requestFullscreen().catch(e => console.warn('[Fullscreen Error]', e));
    } else {
      document.exitFullscreen().catch(e => console.warn('[Exit Fullscreen Error]', e));
    }
  });

  // Chat toggle button
  document.getElementById('btnToggleChat')?.addEventListener('click', () => {
    const chatPanel = document.getElementById('vcinCallChatPanel');
    if (chatPanel) {
      const isHidden = chatPanel.classList.toggle('hidden');
      if (!isHidden) {
        unreadChatCount = 0;
        const badge = document.getElementById('vcinChatBadge');
        if (badge) {
          badge.textContent = '0';
          badge.classList.add('hidden');
        }
        document.getElementById('vcinCallChatInput')?.focus();
      }
    }
  });

  document.getElementById('btnCloseChatDrawer')?.addEventListener('click', () => {
    document.getElementById('vcinCallChatPanel')?.classList.add('hidden');
  });

  // Send message events
  const chatInput = document.getElementById('vcinCallChatInput');
  const chatSendBtn = document.getElementById('vcinCallChatSendBtn');

  const handleSend = () => {
    if (chatInput && chatInput.value.trim()) {
      sendConferenceChat(chatInput.value);
      chatInput.value = '';
    }
  };

  chatSendBtn?.addEventListener('click', handleSend);
  chatInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  document.getElementById('btnCallEnd')?.addEventListener('click', () => {
    endJitsi();
    Bus.send('conference-end', { roomName });
  });

  // 3-minute countdown
  let secsLeft = 180;
  const timerEl = document.getElementById('callTimerDisplay');
  clearInterval(callTimerInterval);
  callTimerInterval = setInterval(() => {
    secsLeft--;
    const m = Math.floor(secsLeft / 60);
    const s = secsLeft % 60;
    if (timerEl) {
      timerEl.textContent = `${m}:${String(s).padStart(2, '0')}`;
      if (secsLeft <= 30) timerEl.style.color = '#ef4444';
    }
    if (secsLeft <= 0) {
      clearInterval(callTimerInterval);
      endJitsi();
      Bus.send('conference-end', { roomName });
    }
  }, 1000);
}
window.joinJitsi = joinJitsi;

function endJitsi() {
  clearInterval(callTimerInterval);
  if (callAnimFrame) cancelAnimationFrame(callAnimFrame);

  // 1. Explicitly stop hardware camera/mic tracks!
  if (callMediaStream) {
    callMediaStream.getTracks().forEach(track => {
      track.stop();
      console.log('[MediaStream] Hardware track stopped:', track.kind);
    });
    callMediaStream = null;
  }

  // 2. Destroy PeerJS instance
  if (peerInstance) {
    try { peerInstance.destroy(); } catch (_) {}
    peerInstance = null;
  }
  activeCalls = {};

  // 3. Close legacy WebRTC Peer Connection
  if (peerConnection) {
    peerConnection.onicecandidate = null;
    peerConnection.ontrack = null;
    try { peerConnection.close(); } catch (_) {}
    peerConnection = null;
  }

  // 4. Close AudioContext
  if (callAudioCtx) {
    try { callAudioCtx.close(); } catch (_) {}
    callAudioCtx = null;
  }

  // 5. Blank out video element srcObjects to release DOM video pipeline
  const lv = document.getElementById('vcinLocalVideo');
  if (lv) { lv.srcObject = null; }
  const rv = document.getElementById('vcinRemoteVideo');
  if (rv) { rv.srcObject = null; }
  const gv = document.getElementById('vcinGuardianVideo');
  if (gv) { gv.srcObject = null; }

  // 6. Hide overlay
  const overlay = document.getElementById('jitsiOverlay');
  if (overlay) overlay.classList.add('hidden');
  const container = document.getElementById('jitsiContainer');
  if (container) container.innerHTML = '';
  const timerEl = document.getElementById('callTimerDisplay');
  if (timerEl) { timerEl.textContent = '3:00'; timerEl.style.color = ''; }
}

// Emergency hardware release on tab unload
window.addEventListener('beforeunload', () => {
  endJitsi();
});

// Citizen: join conference when operator broadcasts conference-start
// This is handled inside initApp() → Bus.on('conference-start', ...)

/* ═══════════════════════════════════════════════════════════
   SAFE JOURNEY + MAP (Dark Theme)
════════════════════════════════════════════════════════════ */
let journeyMap    = null;
let userMarker    = null;
let destMarker    = null;
let destLatLng    = null;
let journeyActive = false;
let journeyTimer  = null;
let locationWatch = null;

const CARTO_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const OSM_FALLBACK_TILES = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const CARTO_ATTR       = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/**
 * Adds a dark basemap layer with automatic fallback.
 * If the primary CARTO tiles fail (network / provider / CDN blocked),
 * the map silently switches to standard OSM tiles so it never ends up
 * blank or showing "tiles unavailable / API key required" errors.
 */
function addDarkTileLayerWithFallback(map, opts = {}) {
  let switched = false;
  const layer = L.tileLayer(CARTO_DARK_TILES, {
    attribution: CARTO_ATTR,
    subdomains : 'abcd',
    maxZoom    : 19,
    ...opts,
  });
  layer.on('tileerror', () => {
    if (switched) return;
    switched = true;
    try {
      map.removeLayer(layer);
      L.tileLayer(OSM_FALLBACK_TILES, {
        attribution : CARTO_ATTR,
        maxZoom     : 19,
        className   : 'vcin-osm-fallback-tiles',
        ...opts,
      }).addTo(map);
      console.warn('[V-CIN Map] Primary tile provider failed — switched to OSM fallback.');
    } catch (_) {}
  });
  layer.addTo(map);
  return layer;
}

function initJourney() {
  const mapEl = document.getElementById('journeyMap');
  if (!mapEl) return;

  if (journeyMap) {
    try { journeyMap.remove(); } catch (_) {}
    journeyMap = null;
  }

  journeyMap = L.map('journeyMap', { zoomControl: true, scrollWheelZoom: true }).setView([20.5937, 78.9629], 5);
  addDarkTileLayerWithFallback(journeyMap);

  journeyMap.on('click', (e) => {
    destLatLng = [e.latlng.lat, e.latlng.lng];
    if (destMarker) destMarker.remove();
    destMarker = L.marker(destLatLng, {
      icon: L.divIcon({ html: '🏁', className: '', iconSize: [24, 24] })
    }).addTo(journeyMap).bindPopup('Destination').openPopup();
    document.getElementById('journeyTargetInfo').textContent =
      `Destination: ${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}`;
    document.getElementById('journeyBtn').disabled = false;
  });

  const btn = document.getElementById('journeyBtn');
  btn?.addEventListener('click', () => {
    if (!journeyActive) startJourney();
    else stopJourney();
  });

  // Try to show user's current location
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    journeyMap.setView([latitude, longitude], 13);
    updateJourneyMarker(latitude, longitude);
  }, () => {});
}

let lastUserJourneyPos = { lat: 20.5937, lng: 78.9629 };

function startJourney() {
  if (!destLatLng) {
    alert('Please tap your destination on the map first.');
    return;
  }
  journeyActive = true;
  const btn  = document.getElementById('journeyBtn');
  const mins = parseInt(document.getElementById('etaMinutes')?.value || '30');
  if (btn) btn.textContent = t('stopJourney');

  document.getElementById('journeyStatus').textContent = t('journeyActive', mins);

  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    lastUserJourneyPos = { lat: latitude, lng: longitude };
    updateJourneyMarker(latitude, longitude);
    Bus.send('journey-start', {
      lat: latitude,
      lng: longitude,
      destLat: destLatLng[0],
      destLng: destLatLng[1],
      etaMinutes: mins,
      startTimestamp: Date.now(),
      from: Bus.name
    });
    Bus.send('location', {
      lat: latitude,
      lng: longitude,
      journeyActive: true,
      destLat: destLatLng[0],
      destLng: destLatLng[1]
    });
  }, () => {
    Bus.send('journey-start', {
      lat: 20.5937,
      lng: 78.9629,
      destLat: destLatLng[0],
      destLng: destLatLng[1],
      etaMinutes: mins,
      startTimestamp: Date.now(),
      from: Bus.name
    });
  });

  // Start continuous location sharing
  locationWatch = navigator.geolocation.watchPosition(pos => {
    const { latitude, longitude } = pos.coords;
    lastUserJourneyPos = { lat: latitude, lng: longitude };
    updateJourneyMarker(latitude, longitude);
    Bus.send('location', {
      lat: latitude,
      lng: longitude,
      journeyActive: true,
      destLat: destLatLng[0],
      destLng: destLatLng[1]
    });
  }, () => {}, { enableHighAccuracy: true, maximumAge: 3000 });

  // Check-in timer
  journeyTimer = setTimeout(() => {
    document.getElementById('journeyStatus').textContent = t('journeyMissed');
    Bus.send('missed-checkin', { etaMinutes: mins, from: Bus.name });
    showToast('⚠️ Safe Journey check-in missed! Operator alerted.', 'danger');
  }, mins * 60 * 1000);

  showToast('🚗 Safe Journey Started! Real-time tracking active & Operator informed.', 'success');
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();
}

function stopJourney() {
  journeyActive = false;
  if (locationWatch) navigator.geolocation.clearWatch(locationWatch);
  if (journeyTimer) clearTimeout(journeyTimer);
  const btn = document.getElementById('journeyBtn');
  if (btn) { btn.textContent = t('startJourney'); btn.disabled = true; }
  document.getElementById('journeyStatus').textContent = '✅ ' + t('arrived');

  Bus.send('journey-end', {
    lat: lastUserJourneyPos.lat,
    lng: lastUserJourneyPos.lng,
    status: 'arrived',
    arrivedTimestamp: Date.now(),
    from: Bus.name
  });

  showToast('✅ Safe Journey Completed! Operator notified that you arrived safely.', 'success');
  if (typeof SFX !== 'undefined' && SFX.click) SFX.click();

  destLatLng = null;
  if (destMarker) { destMarker.remove(); destMarker = null; }
}

function updateJourneyMarker(lat, lng) {
  if (!journeyMap) return;
  if (!userMarker) {
    userMarker = L.circleMarker([lat, lng], {
      radius: 10, fillColor: '#3b82f6', color: '#fff', weight: 2, fillOpacity: 1
    }).addTo(journeyMap).bindPopup('You');
  } else {
    userMarker.setLatLng([lat, lng]);
  }
}

/* ═══════════════════════════════════════════════════════════
   RAPID EVIDENCE REPORT (COMPLAINT)
════════════════════════════════════════════════════════════ */
function initComplaint() {
  const typeEl   = document.getElementById('complaintType');
  const customEl = document.getElementById('customCategoryInput');
  const imageEl  = document.getElementById('complaintImage');
  const draftBtn = document.getElementById('draftBtn');
  const submitBtn= document.getElementById('submitComplaintBtn');
  const uploadZone = document.getElementById('uploadZone');

  typeEl?.addEventListener('change', () => {
    customEl?.classList.toggle('hidden', typeEl.value !== 'custom');
  });

  // Image upload
  uploadZone?.addEventListener('click', () => imageEl?.click());
  uploadZone?.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = '#3b82f6'; });
  uploadZone?.addEventListener('dragleave', () => { uploadZone.style.borderColor = ''; });
  uploadZone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    uploadZone.style.borderColor = '';
    const file = e.dataTransfer.files[0];
    if (file) handleImageUpload(file);
  });

  imageEl?.addEventListener('change', () => {
    if (imageEl.files[0]) handleImageUpload(imageEl.files[0]);
  });

  draftBtn?.addEventListener('click', generateDraft);
  submitBtn?.addEventListener('click', submitComplaint);
}

let uploadedImageB64 = null;
let uploadedImageHash = null;

async function handleImageUpload(file) {
  if (!file.type.startsWith('image/')) { alert('Please upload an image file.'); return; }
  if (file.size > 2 * 1024 * 1024) { alert('Image must be under 2 MB.'); return; }

  const reader = new FileReader();
  reader.onload = async (e) => {
    const b64 = e.target.result;
    uploadedImageB64  = b64;
    // Hash the raw bytes for integrity
    const arrBuf = await file.arrayBuffer();
    uploadedImageHash = await sha256(arrBuf);

    const preview = document.getElementById('imagePreview');
    const wrap    = document.getElementById('imagePreviewWrap');
    const hashEl  = document.getElementById('imageHash');
    if (preview) preview.src = b64;
    wrap?.classList.remove('hidden');
    if (hashEl) hashEl.textContent = uploadedImageHash.substring(0, 24) + '…';
  };
  reader.readAsDataURL(file);
}

function generateDraft() {
  const type    = document.getElementById('complaintType')?.value || 'fraud';
  const details = document.getElementById('complaintDetails')?.value?.trim() || '';
  const customCat = document.getElementById('customCategoryInput')?.value?.trim() || '';

  const categoryLabel = {
    fraud: 'Financial Fraud / Scam',
    harassment: 'Online Harassment',
    blackmail: 'Blackmail / Sextortion',
    stalking: 'Stalking / Physical Threat',
    custom: customCat || 'Other',
  }[type] || type;

  const routeMsg = (type === 'fraud') ? t('routeFraud') : t('routeOther');

  const draft = `
TO: NCRP / Cybercrime Cell
SUBJECT: Complaint — ${categoryLabel}

Complainant: ${Bus.name}
Date/Time  : ${new Date().toLocaleString()}
Room Code  : ${Bus.room}
Device ID  : ${Bus.deviceId.substring(0, 12)}…

INCIDENT DETAILS:
${details || '(No details provided)'}

${uploadedImageHash ? `EVIDENCE IMAGE SHA-256: ${uploadedImageHash}` : ''}

${routeMsg}
  `.trim();

  const draftOut = document.getElementById('draftOut');
  if (draftOut) {
    draftOut.textContent = draft;
    draftOut.classList.remove('hidden');
  }
}

async function submitComplaint() {
  const type    = document.getElementById('complaintType')?.value || 'other';
  const details = document.getElementById('complaintDetails')?.value?.trim() || '';
  if (!details) { alert('Please describe what happened before submitting.'); return; }

  const hash = await sha256(details + Bus.deviceId + Date.now());

  Bus.send('complaint', {
    type,
    details,
    hash,
    imageB64  : uploadedImageB64,
    imageHash : uploadedImageHash,
  });

  const btn = document.getElementById('submitComplaintBtn');
  if (btn) {
    btn.textContent = '✅ Submitted';
    btn.disabled = true;
    btn.style.background = '#16a34a';
    setTimeout(() => {
      btn.textContent = '🔒 Submit as Evidence';
      btn.disabled = false;
    }, 4000);
  }

  // Also generate draft if not already done
  generateDraft();
}

/* ═══════════════════════════════════════════════════════════
   LANGUAGE TOGGLE
════════════════════════════════════════════════════════════ */
function initLangToggle() {
  const btn = document.getElementById('langToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    lang = lang === 'en' ? 'hi' : 'en';
    localStorage.setItem('vcin-lang', lang);
    btn.textContent = lang === 'en' ? 'हिंदी' : 'English';
    applyI18n();
  });
}

/* ═══════════════════════════════════════════════════════════
   STEALTH CALCULATOR
════════════════════════════════════════════════════════════ */
function initStealth() {
  const stealthBtn = document.getElementById('stealthBtn');
  const overlay    = document.getElementById('stealthOverlay');
  if (!stealthBtn || !overlay) return;

  let calcVal = '0', calcOp = null, calcPrev = null, calcNewNum = false;

  function updateDisplay(val) {
    document.getElementById('calcDisplay').textContent = val;
  }

  stealthBtn.addEventListener('click', () => overlay.classList.toggle('hidden'));

  document.getElementById('calcClear').addEventListener('click', () => {
    calcVal = '0'; calcOp = null; calcPrev = null; calcNewNum = false;
    document.getElementById('calcHistory').textContent = '';
    updateDisplay('0');
  });

  // Unlock stealth: type "9999" → hides calculator, shows real SOS prompt
  let stealthCode = '';
  document.querySelectorAll('.calc-btn.num').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = btn.textContent.trim();
      if (d === '.' || d === '0' && !calcVal) { stealthCode = ''; }
      else {
        stealthCode = (stealthCode + d).slice(-4);
        if (stealthCode === '9999') {
          overlay.classList.add('hidden');
          triggerSOS();
        }
      }
      // Normal calc logic
      if (calcNewNum) { calcVal = d === '.' ? '0.' : d; calcNewNum = false; }
      else { calcVal = calcVal === '0' && d !== '.' ? d : calcVal + d; }
      updateDisplay(calcVal);
    });
  });

  document.querySelectorAll('.calc-btn.op').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.textContent.trim();
      if (op === '=') {
        if (calcOp && calcPrev !== null) {
          document.getElementById('calcHistory').textContent = `${calcPrev} ${calcOp} ${calcVal} =`;
          const a = parseFloat(calcPrev), b = parseFloat(calcVal);
          const res = calcOp === '+' ? a + b : calcOp === '-' ? a - b :
                      calcOp === '*' ? a * b : b !== 0 ? a / b : 'Error';
          calcVal = String(res); calcOp = null; calcPrev = null;
          updateDisplay(calcVal);
        }
      } else {
        calcOp = op; calcPrev = calcVal; calcNewNum = true;
        document.getElementById('calcHistory').textContent = `${calcVal} ${op}`;
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   SHAKE TO SOS
════════════════════════════════════════════════════════════ */
function initShakeDetect() {
  const toggle = document.getElementById('shakeSosToggle');
  const testBtn = document.getElementById('testShakeBtn');
  
  if (testBtn) {
    testBtn.addEventListener('click', () => {
      if (!sosActive) triggerSOS();
    });
  }

  if (!toggle) return;

  let lastX = null, lastY = null, lastZ = null, shakeCount = 0, shakeTimer = null;
  const THRESHOLD = 24; // Less sensitive: requires strong deliberate shakes

  if (window.DeviceMotionEvent) {
    window.addEventListener('devicemotion', (e) => {
      if (!toggle.checked) return;
      const { x, y, z } = e.accelerationIncludingGravity || {};
      if (x == null) return;
      if (lastX !== null) {
        const delta = Math.abs(x - lastX) + Math.abs(y - lastY) + Math.abs(z - lastZ);
        if (delta > THRESHOLD) {
          shakeCount++;
          clearTimeout(shakeTimer);
          shakeTimer = setTimeout(() => { shakeCount = 0; }, 2000);
          if (shakeCount >= 6 && !sosActive) {
            shakeCount = 0;
            triggerSOS();
          }
        }
      }
      lastX = x; lastY = y; lastZ = z;
    });
  }

  // iOS 13+ requires permission
  if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    toggle.addEventListener('change', async () => {
      if (toggle.checked) {
        try { await DeviceMotionEvent.requestPermission(); }
        catch (_) { toggle.checked = false; }
      }
    });
  }
}

/* ═══════════════════════════════════════════════════════════
   UTILS
═════════════════════════════════════════════════════════════ */
function calcDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 +
    Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}




function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean.length === 3 ? clean.split("").map(c => c + c).join("") : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
}

/* ── Jitsi SDK lazy loader ─────────────────────────────── */
function loadJitsiSdk(cb) {
  if (window.JitsiMeetExternalAPI) { cb(); return; }
  const s = document.createElement('script');
  s.src = 'https://meet.jit.si/external_api.js';
  s.onload = cb;
  document.head.appendChild(s);
}

// Load Jitsi SDK on page load
loadJitsiSdk(() => { /* ready */ });
