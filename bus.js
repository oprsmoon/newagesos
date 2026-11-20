/**
 * V-CIN Suraksha — Real-time Bus (bus.js)
 * Transport : MQTT over WebSockets → broker.emqx.io (free, no account)
 * Topic schema: vcin/room/{4-digit-code}/{event}
 * Fallback   : BroadcastChannel (same-browser, offline demo)
 *
 * KEY FIX: Messages queued before MQTT connects are flushed on connect.
 * This ensures SOS and other critical events are never silently dropped.
 */

const Bus = (() => {
  const BROKER       = 'wss://broker.emqx.io:8084/mqtt';
  const TOPIC_PREFIX = 'vcin/room';
  const DEBUG        = false; // keep false in production

  const log = (...a) => { if (DEBUG) console.log('[Bus]', ...a); };

  // ── Device identity ────────────────────────────────────────────────
  // Scoped per page role. index.html and operator.html share one
  // localStorage origin, so a single shared key gave both pages the same
  // deviceId. That broke two things at once:
  //   1. Both connected with the same MQTT clientId. Brokers kick the
  //      older session on a duplicate id, it reconnects, kicks the other
  //      one off — an endless "Reconnecting…" loop with lost publishes.
  //   2. Handlers filter their own echo with `msg.deviceId === deviceId`,
  //      so the operator discarded every citizen SOS as its own message.
  // The id stays stable across refresh so Bus.sendTo() targeting works.
  const pageTag = /operator/i.test(location.pathname) ? 'operator' : 'citizen';

  const newId = () => (crypto.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(16).slice(2));

  const deviceId = (() => {
    const key = `vcin-device-id:${pageTag}`;
    let id = localStorage.getItem(key);
    if (!id) { id = newId(); localStorage.setItem(key, id); }
    return id;
  })();

  // Fresh per page load, so two tabs of the same page never collide
  // either. Kept at 23 chars — the MQTT 3.1 limit some brokers enforce.
  const clientId = 'vcin_' + pageTag.slice(0, 3) + '_'
    + deviceId.replace(/-/g, '').slice(0, 8) + '_'
    + Math.random().toString(16).slice(2, 7);

  // ── Session state (survives page refresh) ──────────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const paramPin = urlParams.get('pin');
  // 'XXXX' is a placeholder, never a room — reject it everywhere.
  if (paramPin && paramPin.trim() && paramPin.trim().toLowerCase() !== 'xxxx') {
    localStorage.setItem('suraksha-room', paramPin.trim());
  }

  const roomDefault = (() => {
    const saved = (localStorage.getItem('suraksha-room') || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (saved && saved !== 'xxxx') return saved; // 'XXXX' must never become a room
    // Nothing valid saved (or placeholder found) — mint a fresh room and
    // persist it so other tabs/pages on this device join the same room.
    const fresh = String(Math.floor(1000 + Math.random() * 9000));
    try { localStorage.setItem('suraksha-room', fresh); } catch (_) {}
    return fresh;
  })();
  let room = sessionStorage.getItem('vcin-room') || roomDefault;
  let role = sessionStorage.getItem('vcin-role') || 'citizen';
  let name = sessionStorage.getItem('vcin-name') || 'Anonymous';

  // ── Internal state ─────────────────────────────────────────────────
  const handlers  = {};   // eventType → [fn, ...]
  const statusCbs = [];   // (online: bool) → void
  const seen      = new Set();
  let   mq        = null;
  let   online    = false;
  let   bc        = null;
  let   lastError = null; // last MQTT error, surfaced via Bus.lastError
  const sendQueue = [];   // messages queued before MQTT connects

  // ── Helpers ────────────────────────────────────────────────────────
  const topicFor  = (event) => `${TOPIC_PREFIX}/${room}/${event}`;
  const roomTopic = ()      => `${TOPIC_PREFIX}/${room}/#`;

  function deliver(event, msg) {
    if (!msg || !msg.mid) return;
    if (seen.has(msg.mid)) return;
    seen.add(msg.mid);
    if (seen.size > 1000) seen.clear();

    // Drop targeted messages meant for other devices
    if (msg.to && msg.to !== deviceId) return;

    log('📨 received', event, 'from', msg.from || '?', msg);

    const hs = (handlers[event] || []).concat(handlers['*'] || []);
    hs.forEach(h => { try { h(msg, event); } catch (e) { console.error('[Bus handler error]', e); } });
  }

  function flushQueue() {
    while (sendQueue.length > 0) {
      const { topic, payload } = sendQueue.shift();
      try {
        mq.publish(topic, payload, { qos: 1, retain: false });
        log('📤 flushed queued message to', topic);
      } catch (e) { log('flush error', e); }
    }
  }

  function mqPublish(event, payload) {
    const topic = topicFor(event);
    if (mq && online) {
      try {
        mq.publish(topic, payload, { qos: 1, retain: false });
        log('📤 MQTT published', event, 'to', topic);
      } catch (e) {
        log('publish error, queuing:', e);
        sendQueue.push({ topic, payload });
      }
    } else {
      log('⏳ MQTT not ready, queuing', event, '(queue size:', sendQueue.length + 1, ')');
      sendQueue.push({ topic, payload });
    }
  }

  function connect() {
    if (!room) return;
    // A second client with the same id would get kicked by the broker in a
    // loop, so never build one.
    if (mq) { log('connect() already ran — ignoring duplicate call'); return; }

    // BroadcastChannel — same-browser tab communication
    try {
      bc = new BroadcastChannel('vcin-' + room);
      bc.onmessage = (e) => {
        try { deliver(e.data.event, e.data.msg); } catch (_) {}
      };
      log('📡 BroadcastChannel opened for room', room);
    } catch (_) {}

    // MQTT over WebSockets
    try {
      if (typeof mqtt !== 'undefined' && typeof mqtt.connect === 'function') {
        log('🔌 Connecting MQTT as', clientId, 'to', BROKER, '· page:', pageTag);

        mq = mqtt.connect(BROKER, {
          clientId,
          keepalive      : 20,
          reconnectPeriod: 2000,
          connectTimeout : 10000,
          clean          : true,
          protocolVersion: 4,
        });

        mq.on('connect', () => {
          online = true;
          lastError = null;
          log('✅ MQTT connected — subscribing to', roomTopic());
          mq.subscribe(roomTopic(), { qos: 1 }, (err) => {
            if (err) log('subscribe error:', err);
            else log('✅ Subscribed to', roomTopic());
          });
          statusCbs.forEach(cb => cb(true));
          // Flush any queued messages (e.g. SOS sent before MQTT was ready)
          flushQueue();
          // Announce presence
          _publish('member-join', { name, role });
        });

        mq.on('reconnect', () => {
          log('🔄 MQTT reconnecting…');
          online = false;
          statusCbs.forEach(cb => cb(false));
        });

        mq.on('close',     () => { online = false; statusCbs.forEach(cb => cb(false)); });
        mq.on('offline',   () => { online = false; statusCbs.forEach(cb => cb(false)); });
        mq.on('error', (e) => {
          lastError = (e && e.message) ? e.message : String(e);
          console.warn('[Bus] MQTT error:', lastError);
          if (/identifier|client\s?id/i.test(lastError)) {
            console.warn('[Bus] Broker rejected the client identifier. Clear the '
              + `localStorage key "vcin-device-id:${pageTag}" and reload.`);
          }
        });

        mq.on('disconnect', (packet) => log('broker sent DISCONNECT', packet));

        mq.on('message', (topic, payload) => {
          try {
            // topic: vcin/room/7342/sos  → event = 'sos'
            const parts = topic.split('/');
            const event = parts[parts.length - 1];
            const msg   = JSON.parse(payload.toString());
            log('📩 MQTT received', event, 'from topic', topic);
            deliver(event, msg);
          } catch (e) { log('parse error:', e); }
        });
      } else {
        console.warn('[Bus] MQTT library not available. Same-browser BroadcastChannel active.');
      }

    } catch (e) {
      console.warn('[Bus] MQTT init failed, same-browser mode only:', e);
    }
  }

  function _publish(event, data) {
    const msg = {
      ...data,
      mid     : crypto.randomUUID(),
      from    : name,
      role,
      deviceId,
      ts      : Date.now(),
      event,
    };

    const payload = JSON.stringify(msg);

    // BroadcastChannel — delivers to all other tabs in same browser instantly
    if (bc) {
      try { bc.postMessage({ event, msg }); } catch (_) {}
    }

    // MQTT — cross-device (queued if not yet connected)
    mqPublish(event, payload);

    return msg;
  }

  // ── Public API ─────────────────────────────────────────────────────
  return {
    get room()     { return room;     },
    get role()     { return role;     },
    get name()     { return name;     },
    get deviceId() { return deviceId; },
    get online()   { return online;   },
    get clientId() { return clientId; },
    get lastError(){ return lastError; },

    /**
     * Join a room. Connects to MQTT + BroadcastChannel.
     * Must be called ONCE after the user enters name + code + role.
     */
    init(roomCode, userName, userRole) {
      room = String(roomCode).trim();
      name = (userName || 'User').trim() || 'User';
      role = userRole || 'citizen';
      sessionStorage.setItem('vcin-room', room);
      sessionStorage.setItem('vcin-name', name);
      sessionStorage.setItem('vcin-role', role);
      localStorage.setItem('suraksha-room', room);
      localStorage.setItem('suraksha-name', name);
      const navPin = document.getElementById('navPinDisplay');
      if (navPin) navPin.textContent = room;
      log('🚀 Bus.init — room:', room, 'name:', name, 'role:', role);
      connect();
    },

    /** Send a broadcast event to everyone in the room (including self via BC). */
    send(event, data = {}) {
      if (!room) {
        console.warn('[Bus] send() called before init() — room is null');
        return null;
      }
      return _publish(event, data);
    },

    /**
     * Send a targeted event to one specific device.
     * The message is also published via MQTT so different-browser
     * devices receive it. All devices receive it, but Bus drops it
     * unless msg.to === their deviceId.
     */
    sendTo(targetDeviceId, event, data = {}) {
      return this.send(event, { ...data, to: targetDeviceId });
    },

    /** Register a handler for a specific event type. */
    on(event, handler) {
      if (!handlers[event]) handlers[event] = [];
      if (!handlers[event].includes(handler)) {
        handlers[event].push(handler);
      }
    },

    /** Register a handler for ALL events. */
    onAny(handler) { this.on('*', handler); },

    /** Register a callback fired when MQTT connection status changes. */
    onStatus(cb) { statusCbs.push(cb); cb(online); },

    /** Change role mid-session (e.g. Guardian mode toggle). */
    setRole(newRole) {
      role = newRole;
      sessionStorage.setItem('vcin-role', newRole);
      this.send('member-role-change', { newRole });
    },

    /** Generate a random 4-digit room code string. */
    generateCode() {
      return String(Math.floor(1000 + Math.random() * 9000));
    },

    /** True if Bus.init() has been called. */
    get ready() { return !!room; },
  };
})();

// Global room code generator (works across index.html & operator.html inline onclicks)
window.generateNewRoomCode = function (e) {
  if (e && e.preventDefault) e.preventDefault();

  const code = String(Math.floor(1000 + Math.random() * 9000));

  sessionStorage.setItem('vcin-room', code);
  localStorage.setItem('suraksha-room', code);

  // Fill 4-digit OTP input boxes if present
  const otpBoxes = [0, 1, 2, 3].map(i => document.getElementById('otp' + i));
  if (otpBoxes[0]) {
    code.split('').forEach((digit, idx) => {
      if (otpBoxes[idx]) otpBoxes[idx].value = digit;
    });
  }

  // Update display badges
  const genDisplay = document.getElementById('genCodeDisplay');
  if (genDisplay) genDisplay.textContent = code;

  const navPin = document.getElementById('navPinDisplay');
  if (navPin) navPin.textContent = code;

  // Auto-fill default name if empty
  const nameInp = document.getElementById('joinName');
  if (nameInp && !nameInp.value.trim()) {
    const isOp = /operator/i.test(location.pathname);
    nameInp.value = isOp ? 'Cyber Cell Officer' : 'Citizen User';
  }

  // Enable Join button
  const joinBtn = document.getElementById('joinBtn');
  if (joinBtn) {
    joinBtn.disabled = false;
    joinBtn.style.opacity = '1';
    joinBtn.style.cursor = 'pointer';
  }

  if (typeof SFX !== 'undefined') SFX.click();

  return code;
};
