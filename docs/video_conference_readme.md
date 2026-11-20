# V-CIN WebRTC 3-Way Video Conferencing Architecture & Integration Guide

## 1. Overview
The V-CIN WebRTC Video Conferencing Module provides multi-participant, real-time encrypted video, audio, and P2P data channels connecting:
- **Citizen (Victim)**
- **Command Operator**
- **Tactical Guardian**

---

## 2. PeerJS ID Architecture & Room Routing
Each participant generates a deterministic PeerJS ID based on the room code:
- **Citizen (Victim)**: `vcin-room-${roomCode}-victim`
- **Command Operator**: `vcin-room-${roomCode}-operator`
- **Tactical Guardian**: `vcin-room-${roomCode}-guardian`

```javascript
const roomCode = Bus.room || '1234';
const roleSlug = Bus.role === 'operator' ? 'operator' : Bus.role === 'guardian' ? 'guardian' : 'victim';
const myPeerId = `vcin-room-${roomCode}-${roleSlug}`;
```

---

## 3. Bidirectional P2P Mesh Connection & Auto-Dial Loop
- **No Hierarchy Restrictions**: Any room participant can dial or answer any other participant without rank barriers.
- **Continuous Auto-Dialing Mesh**: When a room opens or a `webrtc-peer-ready` MQTT signal is received, `dialRoomPeers()` automatically connects missing room peers. A 3.5-second polling interval ensures late-joining participants connect seamlessly.
- **Immediate Auto-Answer**: All incoming calls (`peerInstance.on('call')`) auto-answer with the local stream and bind remote video/audio to UI elements.

```javascript
const dialRoomPeers = async () => {
  if (!peerInstance || peerInstance.destroyed) return;
  const targetRoles = roleSlug === 'victim' ? ['operator', 'guardian'] : roleSlug === 'guardian' ? ['victim', 'operator'] : ['victim', 'guardian'];
  const activeLocalStream = await ensureLocalMediaStream();

  for (const tRole of targetRoles) {
    const targetPeerId = `vcin-room-${roomCode}-${tRole}`;
    if (!activeCalls[tRole] || !activeCalls[tRole].open) {
      try {
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
```

---

## 4. Media Constraints & Robust Fallback Hierarchy
To prevent webcam `OverconstrainedError` rejections across desktop/mobile browsers, stream capture uses `ideal` constraints with progressive fallbacks:

```javascript
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
```

### Progressive Fallback Pipeline:
1. Preferred `robustConstraints` (Ideal 640x480 @ 30fps)
2. Basic unconstrained `{ video: true, audio: true }`
3. Audio-only `{ audio: true, video: false }`
4. `createSyntheticMediaStream()` (Canvas capture stream fallback for strict browser sandboxes)

---

## 5. Audio Bridge & Playback Unlocking
Browser autoplay policies can mute remote video elements. `unlockAudioPlayback(videoEl, remoteStream)` creates a hidden, high-priority `<audio autoplay>` element bound to `remoteStream` to ensure 2-way and 3-way audio output is always clear.

```javascript
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
      audioEl.play().catch(e => console.warn('[Audio Play Error]', e));
    }
  } catch (e) {}
}
```

---

## 6. Pre-Call Device & WebRTC Latency Tester
Integrated into the operator dashboard to allow operators to verify media devices and STUN/TURN connections before joining:
- **Camera Preview**: `<video id="opPrecallVideo">`
- **Microphone Decibel Meter**: Web Audio API `AnalyserNode` monitoring mic input levels (`#opMicLevelBar`).
- **STUN/TURN Latency Tester**: Measures RTCPeerConnection RTT against Google STUN and Metered TURN servers.

---

## 7. Embedded Dashboard Panel & Docking Mode
- **Embedded Panel**: Video call grid is placed directly inside the main dashboard below the Regional Intelligence Deck.
- **Docking Mode Toggle**: Operators can toggle between embedded dashboard layout and floating bottom-right overlay mode (`#jitsiOverlay.docked-widget-mode`).
