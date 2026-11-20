// Suraksha Universal Navigation & Prototype Role Switcher Bar

(() => {
  // Read PIN from URL query param `pin=1234` or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const paramPin = urlParams.get('pin');
  if (paramPin && paramPin.trim()) {
    const cleanPin = paramPin.trim().slice(0, 8);
    localStorage.setItem('suraksha-room', cleanPin);
  }

  function getActivePin() {
    return (localStorage.getItem('suraksha-room') || '1234').trim();
  }

  function setActivePin(newPin) {
    const clean = newPin.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') || '1234';
    localStorage.setItem('suraksha-room', clean);
    if (typeof Bus !== 'undefined' && Bus.setRoom) {
      Bus.setRoom(clean);
    } else {
      window.location.reload();
    }
  }

  function createNavBar() {
    if (document.getElementById('surakshaTopNav')) return;

    const currentPath = window.location.pathname.toLowerCase();
    const isOperator = currentPath.includes('operator');
    const isOverview = currentPath.includes('overview') || currentPath.includes('landing');
    const isQR = currentPath.includes('qr');
    const isCitizen = !isOperator && !isOverview && !isQR;

    const activePin = getActivePin();

    const nav = document.createElement('div');
    nav.id = 'surakshaTopNav';
    nav.className = 'suraksha-top-nav';

    nav.innerHTML = `
      <div class="nav-brand" onclick="window.location.href='overview.html'">
        <span class="nav-logo">🛡️</span>
        <span class="nav-title">Suraksha <small>PROTOTYPE</small></span>
      </div>

      <div class="nav-room-badge" id="navRoomBtn" title="Click to share 4-digit room code or scan QR code">
        <span class="pin-icon">🔑</span>
        <span>PIN: <strong id="navPinDisplay">${activePin}</strong></span>
        <span class="share-tag">SHARE / QR</span>
      </div>

      <div class="nav-switcher-links">
        <a href="index.html?pin=${encodeURIComponent(activePin)}" class="nav-btn ${isCitizen ? 'active' : ''}">
          🛡️ Citizen App
        </a>
        <a href="operator.html?pin=${encodeURIComponent(activePin)}" class="nav-btn ${isOperator ? 'active' : ''}">
          🖥️ Operator Dashboard
        </a>
        <a href="overview.html?pin=${encodeURIComponent(activePin)}" class="nav-btn ${isOverview ? 'active' : ''}">
          🚀 Overview
        </a>
        <a href="qr.html?pin=${encodeURIComponent(activePin)}" class="nav-btn ${isQR ? 'active' : ''}">
          📱 QR Hub
        </a>
      </div>

      <div class="nav-controls">
        <button id="navSfxBtn" class="nav-icon-btn" title="Toggle SFX Sound Effects">
          ${(typeof SFX !== 'undefined' && SFX.isEnabled()) ? '🔊' : '🔇'}
        </button>
      </div>
    `;

    document.body.prepend(nav);

    // Wire events
    document.getElementById('navRoomBtn').onclick = () => showRoomModal();
    document.getElementById('navSfxBtn').onclick = () => {
      if (typeof SFX !== 'undefined') {
        const on = SFX.toggle();
        document.getElementById('navSfxBtn').textContent = on ? '🔊' : '🔇';
        if (on) SFX.click();
      }
    };

    // Attach click sound effect to switcher links
    nav.querySelectorAll('.nav-btn').forEach(btn => {
      btn.onclick = () => {
        if (typeof SFX !== 'undefined') SFX.switch();
      };
    });
  }

  function showRoomModal() {
    let modal = document.getElementById('surakshaRoomModal');
    const activePin = getActivePin();
    
    let origin = window.location.origin;
    if (!origin || origin === 'null' || origin.startsWith('file')) {
      origin = 'http://localhost:8080';
    }
    let path = window.location.pathname || '/';
    if (path.endsWith('/') || path === '') {
      path = path + 'index.html';
    } else if (/landing\.html|operator\.html|index\.html|qr\.html|overview\.html$/i.test(path)) {
      path = path.replace(/landing\.html|operator\.html|index\.html|qr\.html|overview\.html$/i, 'index.html');
    } else {
      path = path.replace(/\/+$/, '') + '/index.html';
    }
    const shareUrl = `${origin}${path}?pin=${encodeURIComponent(activePin)}`;

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'surakshaRoomModal';
      modal.className = 'suraksha-modal-overlay';
      document.body.appendChild(modal);
    }

    // QR Code service URL generator
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`;

    modal.innerHTML = `
      <div class="suraksha-modal-card">
        <button class="modal-close" id="closeRoomModal">&times;</button>
        <h3>📱 Shared 4-Digit Room Code</h3>
        <p class="modal-sub">Connect multiple devices (Victim, Guardians, Operator) to the same live simulation room instantly.</p>
        
        <div class="pin-input-group">
          <input type="text" id="modalPinInput" value="${activePin}" maxlength="8" placeholder="e.g. 1234" />
          <button id="modalSavePinBtn" class="btn primary">Set PIN</button>
        </div>

        <div class="qr-box">
          <img src="${qrUrl}" alt="Scan QR Code to Join Prototype Room" class="qr-img" id="modalQrImg" />
          <p class="qr-hint">Scan with smartphone camera to open Citizen App with PIN <b>${activePin}</b></p>
        </div>

        <div class="modal-actions" style="display:flex; gap:10px; flex-wrap:wrap; justify-content:center;">
          <button id="modalCopyUrlBtn" class="btn outline sm">📋 Copy Direct Link</button>
          <a href="qr.html?pin=${encodeURIComponent(activePin)}" class="btn primary sm" style="text-decoration:none;">📱 Open Full QR Hub</a>
        </div>
      </div>
    `;

    const mImg = document.getElementById('modalQrImg');
    if (mImg) {
      mImg.onerror = () => {
        mImg.src = `https://quickchart.io/qr?size=200&text=${encodeURIComponent(shareUrl)}`;
      };
    }

    modal.classList.add('open');

    document.getElementById('closeRoomModal').onclick = () => modal.classList.remove('open');
    document.getElementById('modalSavePinBtn').onclick = () => {
      const val = document.getElementById('modalPinInput').value.trim();
      if (val) {
        if (typeof SFX !== 'undefined') SFX.click();
        setActivePin(val);
      }
    };

    document.getElementById('modalCopyUrlBtn').onclick = () => {
      navigator.clipboard.writeText(shareUrl).then(() => {
        const btn = document.getElementById('modalCopyUrlBtn');
        btn.textContent = '✅ Copied to Clipboard!';
        if (typeof SFX !== 'undefined') SFX.click();
        setTimeout(() => { btn.textContent = '📋 Copy Direct Link'; }, 2000);
      });
    };
  }

  document.addEventListener('DOMContentLoaded', createNavBar);
})();
