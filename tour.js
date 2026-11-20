/**
 * V-CIN Suraksha — In-App Interactive Tour (tour.js)
 * Comic-noir guided walkthrough with spotlight overlay + guide character.
 *
 * Usage:
 *   VcinTour.start('citizen')            // launch manually
 *   VcinTour.resetDone('citizen')        // force replay next load
 * Auto-runs once per browser for first-time users (localStorage flag).
 */

const VcinTour = (() => {
  "use strict";

  /* ── Guide character ──────────────────────────────────────────────
     Drop your own artwork at assets/tour-guide.png (recommended) and
     it is picked up automatically. Fallback = built-in mascot.
     Probing is deferred until the tour first opens to keep the
     console clean on normal browsing. */
  const GUIDE_CANDIDATES = [
    'assets/tour-guide.png',
    'assets/tour-guide.jpg',
    'assets/tour-guide.jpeg',
    'assets/tour-guide.webp'
  ];
  const MASCOT_FALLBACK = 'data:image/svg+xml;base64,' + btoa(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <circle cx="60" cy="60" r="56" fill="#e9e3d4" stroke="#0a0a0d" stroke-width="5"/>
  <path d="M38 30 Q60 12 82 30 L78 24 Q60 8 42 24Z" fill="#0a0a0d"/>
  <circle cx="48" cy="52" r="4" fill="#0a0a0d"/><circle cx="72" cy="52" r="4" fill="#0a0a0d"/>
  <path d="M50 66 Q60 74 70 66" stroke="#0a0a0d" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M30 40 C20 34, 14 36, 10 30 C18 42, 26 44, 34 46Z" fill="#22c55e" stroke="#0a0a0d" stroke-width="2.6"/>
  <rect x="52" y="84" width="16" height="12" rx="2" fill="#d81e2c" stroke="#0a0a0d" stroke-width="2.4"/>
  <text x="60" y="94" font-family="Arial Black,Arial" font-size="8" font-weight="900" fill="#fff" text-anchor="middle">SOS</text>
</svg>`);

  let guideImgSrc = MASCOT_FALLBACK;
  let guideProbed = false;
  function probeGuideImage() {
    if (guideProbed) return;
    guideProbed = true;
    let i = 0;
    (function tryNext() {
      if (i >= GUIDE_CANDIDATES.length) return;
      const im = new Image();
      im.onload = () => {
        guideImgSrc = GUIDE_CANDIDATES[i];
        const avatar = document.querySelector('#vcinTourCard .vt-avatar');
        if (avatar) avatar.src = guideImgSrc;
      };
      im.onerror = () => { i++; tryNext(); };
      im.src = GUIDE_CANDIDATES[i];
    })();
  }

  /* ── Tour scripts ────────────────────────────────────────────────── */
  const TOURS = {
    citizen: [
      {
        target: null,
        title: "Namaste! I'm VIR 🛡️",
        text: "Your personal safety guide. This city never sleeps — neither does your protection. Give me two minutes and you'll know every shield this app carries.",
        cta: "Show me around"
      },
      {
        target: ".vcin-dashboard-grid",
        title: "1 · Your Four Power Cards",
        text: "Quick access to everything: report incidents, fraud rescue, live scam map and safe journeys. Everything big lives here."
      },
      {
        target: ".vcin-trust-card",
        title: "2 · Your Civic Trust Score",
        text: "Verified reports and helpful activity raise your score out of 100. High trust = your alerts get priority in the network.",
        tip: "Guardians with top scores get dispatched first."
      },
      {
        target: ".vcin-recent-alerts-list",
        title: "3 · Verified Alerts Near You",
        text: "Live incident feed around your area. Notice the VERIFIED badge? Every alert is cross-checked by multiple reporters before it reaches you — no rumors."
      },
      {
        target: "#sosBtn",
        title: "4 · Press SOS — Here's What Happens",
        text: "The moment you tap: your GPS locks, a siren blares, and an alert blasts to family, nearby Guardians AND the police-cyber operator — all within ~5 seconds. It keeps repeating until help arrives.",
        tip: "Next 2 screens show exactly what appears on your screen."
      },
      {
        target: "#recIndicator",
        onShow: () => document.getElementById('recIndicator')?.classList.remove('hidden'),
        onHide: () => document.getElementById('recIndicator')?.classList.add('hidden'),
        title: "5 · Evidence Starts Recording",
        text: "This red badge appears instantly — your phone records audio as legal evidence, and every chunk gets stamped with a SHA-256 hash on-device. Tamper-proof from second one.",
        tip: "That hash code is your proof nobody edited the recording."
      },
      {
        target: "#guardianEnRoute",
        onShow: () => {
          document.getElementById('operatorStatus')?.classList.remove('hidden');
          document.getElementById('guardianEnRoute')?.classList.remove('hidden');
          document.getElementById('joinConferenceBtn')?.classList.remove('hidden');
        },
        onHide: () => {
          document.getElementById('operatorStatus')?.classList.add('hidden');
          document.getElementById('guardianEnRoute')?.classList.add('hidden');
          document.getElementById('joinConferenceBtn')?.classList.add('hidden');
        },
        title: "6 · Help Locks Onto You",
        text: "Within seconds the operator acknowledges and the nearest verified Guardian is dispatched — these green banners confirm each stage live. You can join a voice conference with the operator, or tap 'I am safe – cancel SOS' anytime.",
        tip: "'I am safe – cancel SOS' stops everything instantly."
      },
      {
        target: "#jitsiOverlay",
        onShow: () => {
          document.getElementById('jitsiOverlay')?.classList.remove('hidden');
        },
        onHide: () => {
          document.getElementById('jitsiOverlay')?.classList.add('hidden');
        },
        title: "7 · Live Emergency Video Conference 📹",
        text: "Tap 'Join Conference' to enter the live Jitsi video call with the operator and Guardian. The overlay shows a real-time call timer, mute/camera controls (handled by Jitsi), and a prominent 'Leave' button. In a real emergency, this lets the operator guide you, verify the situation visually, and coordinate help — all while evidence records in the background.",
        tip: "The conference runs on a sovereign Jitsi instance — no third-party data leaks."
      },
      {
        target: "#shakeSosToggle",
        title: "7 · Can't Reach Your Phone Screen?",
        text: "Shake-to-SOS fires the same emergency pipeline with 6 hard shakes — hands-free. Test it safely with 'Simulate Shake'.",
        tip: "The 🕵️ button in the header hides the app behind a decoy screen (Stealth Mode)."
      },
      {
        target: "#cardGoldenHour",
        title: "8 · Fraud Rescue — Golden Hour ⏱️",
        text: "Scammed online? Money moves within 60 minutes. This guided wizard calls 1930 with a ready-made Hindi/English script, walks you through freezing accounts, and auto-generates your NCRP complaint with a case ID."
      },
      {
        target: "[data-i18n=\"helplines\"]",
        title: "9 · One-Tap Helplines",
        text: "1930 cyber fraud · 112 emergency · 181 women helpline · 14416 mental health. All pre-wired — one tap dials. No searching during panic."
      },
      {
        target: "#journeyBtn",
        title: "10 · Safe Journey 📍",
        text: "Going home late? Tap your destination on the map, set your ETA, and start the ride. Family sees your live location — and if you miss check-in, we escalate automatically."
      },
      {
        target: "#uploadZone",
        title: "11 · Rapid Evidence Report 🔐",
        text: "Pick a category (fraud, harassment, blackmail, stalking), describe it, attach a photo — every image is SHA-256 hashed on-device. Then 'Generate Draft' builds your complaint, or submit it straight as sealed evidence.",
        tip: "Hashed evidence = tamper-evident chain of custody."
      },
      {
        target: "#liveScamMapSection",
        title: "12 · Live Scam Map 🗺️",
        text: "A hexagonal heatmap of real-time scam & crime hotspots aggregated from live reports and news feeds near you. Plan routes that avoid the red zones."
      },
      {
        target: "[data-i18n=\"guardian\"]",
        onShow: () => document.getElementById('guardianStandbyPanel')?.classList.remove('hidden'),
        onHide: () => document.getElementById('guardianStandbyPanel')?.classList.add('hidden'),
        title: "13 · Become a Guardian 🤝",
        text: "Flip the switch to go on standby. Set your alert radius — if anyone nearby needs help, you get their live location, distance and ETA on a route map. After each mission, victims rate you and your Trust Score climbs.",
        tip: "Higher CTS Guardians are dispatched first — trust is earned here."
      },
      {
        target: ".vcin-header-right",
        title: "14 · Full Control, Top Right",
        text: "Network status at a glance, हिंदी / English switch for the whole app, and Stealth Mode. Your room code sits in the header — share it so friends join the same live drill.",
        cta: "Finish ★"
      },
      {
        target: null,
        title: "15 · Room QR Hub 📱",
        text: "Want to onboard family or teammates instantly? Open the QR Hub to generate scannable QR codes for your room — one scan and they're in the same simulation room as you.",
        tip: "Share this QR during drills so everyone joins the same live session.",
        cta: "Open QR Hub",
        onCtaClick: () => {
          const pin = (typeof ROOM_CODE !== 'undefined' && ROOM_CODE) ||
                      (typeof roomCode !== 'undefined' && roomCode) ||
                      new URLSearchParams(window.location.search).get('pin') || 'DEMO';
          window.open('qr.html?pin=' + encodeURIComponent(pin), '_blank');
        }
      },
      {
        target: null,
        title: "You're network-ready! 🎉",
        text: "That's the whole shield — SOS to Guardian to operator, all in one tap. Try pressing SOS now to watch the full rescue pipeline light up live. Stay safe out there!",
        cta: "Let's go"
      }
    ],
    guardian: [
      {
        target: null,
        title: "Welcome, Guardian! 🛡️",
        text: "You're the backbone of the network. This tour shows how to go on standby, accept missions, and keep your Trust Score climbing.",
        cta: "Start Training"
      },
      {
        target: "[data-i18n=\"guardian\"]",
        title: "1 · Activate Standby",
        text: "Flip the Guardian Mode switch in the header. You'll see the Standby Panel appear — this is your mission control.",
        cta: "Flip the switch"
      },
      {
        target: "#guardianStandbyPanel",
        onShow: () => document.getElementById('guardianStandbyPanel')?.classList.remove('hidden'),
        onHide: () => document.getElementById('guardianStandbyPanel')?.classList.add('hidden'),
        title: "2 · Set Your Alert Radius",
        text: "Use the radius input to set how far you're willing to respond (0.5–50 km). The wider the radius, the more missions you'll see — but only respond where you can actually arrive quickly.",
        tip: "5 km is a good starting point for urban areas."
      },
      {
        target: "#radiusInput",
        title: "3 · Radius & Your CTS Score",
        text: "Your Civic Trust Score (CTS) determines dispatch priority. Higher CTS = you're offered missions first. Your score is shown at the top — keep it high by completing missions and getting good ratings.",
        tip: "CTS ≥ 85 = Civic Guardian tier (top priority)."
      },
      {
        target: "#incomingAlerts",
        title: "4 · Incoming SOS Alert",
        text: "When someone nearby hits SOS, you'll see an alert card here with: distance, ETA, and incident type. Tap 'I'm Responding' to accept — the system locks you in and shares your location with the victim.",
        tip: "You have ~10 seconds to respond before it goes to the next Guardian."
      },
      {
        target: "#guardianMapCard",
        onShow: () => document.getElementById('guardianMapCard')?.classList.remove('hidden'),
        onHide: () => document.getElementById('guardianMapCard')?.classList.add('hidden'),
        title: "5 · Live Victim Map & Route",
        text: "Once you accept, the map shows the victim's live location and a calculated route. The ETA and distance update in real time. Tap 'Navigate' to open Google Maps with turn-by-turn directions.",
        tip: "The badge shows '📡 Real-Time GPS' when live."
      },
      {
        target: "#guardianMap",
        title: "6 · On the Way",
        text: "As you move, the map tracks your position. The ETA updates live. If the victim cancels or operator closes the case, you'll see a notification — just tap 'End Mission'."
      },
      {
        target: "#jitsiOverlay",
        onShow: () => {
          document.getElementById('jitsiOverlay')?.classList.remove('hidden');
        },
        onHide: () => {
          document.getElementById('jitsiOverlay')?.classList.add('hidden');
        },
        title: "7 · Join Emergency Video Conference 📹",
        text: "Once en route, you can join the live Jitsi video conference with the operator and victim. The overlay shows a real-time call timer, mute/camera controls, and a 'Leave' button. This lets the operator brief you on the situation, the victim can visually confirm your arrival, and you can coordinate handoff — all while maintaining the evidence chain.",
        tip: "The conference is end-to-end encrypted on our sovereign Jitsi instance."
      },
      {
        target: "#victimGuardianRatingModal",
        onShow: () => document.getElementById('victimGuardianRatingModal')?.classList.remove('hidden'),
        onHide: () => document.getElementById('victimGuardianRatingModal')?.classList.add('hidden'),
        title: "8 · Mission Complete & Rating",
        text: "After the case closes, the victim rates you (1–5 stars) and can add tags like 'Arrived Quickly' or 'Felt Safe'. Each positive rating boosts your CTS score — and higher CTS means you're offered missions first.",
        tip: "5-star ratings add +5 to your Trust Score."
      },
      {
        target: ".vcin-trust-card",
        title: "9 · Your Civic Trust Score",
        text: "Your CTS score is the network's trust in you. It's calculated from: verified reports (+), false reports (−), DigiLocker verification (+20), RWA confirmation (+15), and mission ratings. Keep it above 85 for Guardian priority.",
        tip: "Score < 30 = FLAGGED (no dispatch)."
      },
      {
        target: "#liveScamMapSection",
        title: "10 · Live Scam Map for Patrol",
        text: "The hexagonal heatmap shows real-time crime & scam hotspots. As a Guardian, you can see where alerts are most likely. Plan your standby location near red zones — but stay safe.",
        tip: "Red hexes = active SOS clusters right now."
      },
      {
        target: ".vcin-header-right",
        title: "11 · Ready for Duty",
        text: "Your room code, language toggle, and Stealth Mode are always in the header. Share your room code so family can join the same drill. Stay alert — the city needs you.",
        cta: "Finish ★"
      },
      {
        target: null,
        title: "Guardian Ready! 🎉",
        text: "You know the full loop: Standby → Alert → Accept → Navigate → Complete → Rate → Repeat. Every mission you complete makes the network stronger. Stay safe out there!",
        cta: "Go on Standby"
      }
    ],
    operator: [
      {
        target: null,
        title: "Welcome, Operator! 🖥️",
        text: "You're at the command center. This tour shows how to monitor live incidents, verify alerts, dispatch Guardians, and manage video conferences.",
        cta: "Start Briefing"
      },
      {
        target: ".vcin-op-header",
        title: "1 · Operator Header & Room Code",
        text: "Top bar shows your operator name, room code (PIN), and connection status. Share the PIN with Citizen and Guardian devices to sync them into this simulation room.",
        tip: "Change the PIN to create isolated test rooms."
      },
      {
        target: "#incidentList",
        title: "2 · Live Incident Feed",
        text: "Every SOS trigger appears here in real-time with: incident type, location, reporter CTS, and Incident Risk Score (IRS). Color-coded: 🔴 Critical (IRS ≥ 8) · 🟠 High (6-8) · 🟡 Moderate (4-6) · 🟢 Low (<4).",
        tip: "IRS ≥ 6.0 auto-qualifies for Guardian dispatch."
      },
      {
        target: "#incidentList",
        onShow: () => {
          const items = document.querySelectorAll('#incidentList .vcin-incident-row');
          if (items.length) items[0].classList.add('vcin-tour-highlight');
        },
        onHide: () => {
          document.querySelectorAll('.vcin-tour-highlight').forEach(el => el.classList.remove('vcin-tour-highlight'));
        },
        title: "3 · Inspect an Incident",
        text: "Click any incident row to expand details: exact GPS, reporter reliability, corroborating signals, H3 hex CTS, and Golden Hour countdown. The 'Admit Guardian' button appears when a Guardian requests entry.",
        tip: "Bayesian CTS and reporter reliability are computed live per hex."
      },
      {
        target: "#admitGuardianModal",
        onShow: () => document.getElementById('admitGuardianModal')?.classList.remove('hidden'),
        onHide: () => document.getElementById('admitGuardianModal')?.classList.add('hidden'),
        title: "4 · Guardian Admission Review",
        text: "When a Guardian taps 'I'm Responding', their admission request appears here. Review their: CTS Trust Score, distance/ETA, current load, and reliability. Accept to add them to the live video conference, or deny if suspicious.",
        tip: "Only high-CTS Guardians should be admitted — prevents gaming."
      },
      {
        target: "#jitsiOverlay",
        onShow: () => document.getElementById('jitsiOverlay')?.classList.remove('hidden'),
        onHide: () => document.getElementById('jitsiOverlay')?.classList.add('hidden'),
        title: "5 · Live Video Conference 📹",
        text: "Once a Guardian is admitted, they join the Jitsi video conference with you and the victim. The overlay shows: call timer, participant tiles, mute/camera controls, and Leave button. You can visually verify the situation, guide the Guardian, and coordinate handoff — all while evidence records.",
        tip: "Conference runs on sovereign Jitsi — end-to-end encrypted, no third-party data."
      },
      {
        target: "#operatorMap",
        title: "6 · Live Operations Map",
        text: "The map shows: victim location (red pulse), Guardian positions (green badges with ETA), incident hex clusters, and CTS heatmap overlay. Toggle layers to see risk zones, Guardian coverage, and real-time news feed pins.",
        tip: "Click any Guardian badge to see their live route and ETA."
      },
      {
        target: ".vcin-stats-strip",
        title: "7 · Real-Time Analytics",
        text: "Top stats bar: Active Incidents, Guardians Online, Avg Response Time, CTS Network Health. These update live from the Bayesian engines. Use them to assess system load and allocate resources.",
        tip: "CTS Network Health < 0.4 = network degraded, escalate to 112."
      },
      {
        target: "#liveScamMapSection",
        title: "8 · Live Scam & Crime Heatmap",
        text: "H3 hexagonal grid (5km cells) aggregated from live news RSS proxy and verified reports. Red hexes = active SOS clusters. Use this to pre-position Guardians in high-risk zones before incidents spike.",
        tip: "Heatmap seeds IRS priors — smarter dispatch from the start."
      },
      {
        target: ".vcin-op-controls",
        title: "9 · Broadcast & Controls",
        text: "Broadcast alerts to all Guardians in range, trigger zone-wide sirens, or escalate to 112/1930 with one click. The 'Simulate SOS' button lets you inject test incidents for drills.",
        tip: "Use Simulate SOS for training — creates full pipeline without real panic."
      },
      {
        target: null,
        title: "10 · Room QR Hub 📱",
        text: "Need to quickly onboard citizen or guardian devices into your room? Open the QR Hub to generate scannable room QR codes — scan it on any device to join instantly without typing the room PIN.",
        tip: "Perfect for field drills — print QR codes, tape them up, and teams self-join.",
        cta: "Open QR Hub",
        onCtaClick: () => {
          const pin = (typeof ROOM_CODE !== 'undefined' && ROOM_CODE) ||
                      document.getElementById('headerRoomCode')?.textContent?.trim() ||
                      new URLSearchParams(window.location.search).get('pin') || 'DEMO';
          window.open('qr.html?pin=' + encodeURIComponent(pin), '_blank');
        }
      },
      {
        target: null,
        title: "Operator Ready! 🎉",
        text: "You command the loop: Incident → Verify → Admit Guardian → Conference → Dispatch → Monitor → Close. Every decision you make trains the Bayesian engines for smarter future responses. Stay sharp!",
        cta: "Go Live"
      }
    ]
  };

  /* ── State ──────────────────────────────────────────────────────── */
  const FLAG_PREFIX = 'vcin-tour-done:';
  let steps = [];
  let idx = -1;
  let overlayEl = null, spotEl = null, cardEl = null;
  let activeTourName = null;

  function isDone(name) { return localStorage.getItem(FLAG_PREFIX + name) === '1'; }
  function markDone(name) { localStorage.setItem(FLAG_PREFIX + name, '1'); }

  /* ── DOM builders ───────────────────────────────────────────────── */
  function injectStyles() {
    if (document.getElementById('vcinTourStyles')) return;
    const st = document.createElement('style');
    st.id = 'vcinTourStyles';
    st.textContent = `
      #vcinTourOverlay, #vcinTourOverlay * { box-sizing: border-box; }
      #vcinTourOverlay{position:fixed;inset:0;z-index:100000;font-family:'Archivo','Outfit',sans-serif;}
      #vcinTourSpot{
        position:absolute;border-radius:14px;pointer-events:none;
        box-shadow:0 0 0 99999px rgba(10,10,13,0.82);
        border:3px dashed var(--vt-amber,#ffbf5c);
        transition:all .35s cubic-bezier(.16,1,.3,1);
      }
      #vcinTourCard{
        position:absolute;z-index:100002;width:min(390px,calc(100vw - 24px));
        background:#e9e3d4;color:#0a0a0d;border:3px solid #0a0a0d;border-radius:12px;
        box-shadow:7px 7px 0 #0a0a0d;padding:0 0 12px;overflow:visible;
        transition:left .35s cubic-bezier(.16,1,.3,1), top .35s cubic-bezier(.16,1,.3,1);
        animation:vt-pop .35s cubic-bezier(.16,1.3,.3,1);
      }
      @keyframes vt-pop{from{opacity:0;transform:scale(.85) rotate(-2deg);}to{opacity:1;transform:none;}}
      .vt-head{display:flex;align-items:center;gap:10px;background:#0a0a0d;padding:10px 14px;border-bottom:3px solid #ffbf5c;border-top-left-radius:9px;border-top-right-radius:9px;}
      .vt-avatar{width:52px;height:52px;border-radius:50%;border:3px solid #22c55e;object-fit:cover;background:#e9e3d4;flex:none;animation:vt-bob 3s ease-in-out infinite;}
      @keyframes vt-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);}}
      .vt-kicker{font-family:'JetBrains Mono',monospace;font-size:.58rem;font-weight:700;letter-spacing:2px;color:#22c55e;text-transform:uppercase;margin-bottom:2px;}
      .vt-title{font-family:'Anton','Archivo Black',sans-serif;font-size:1.02rem;letter-spacing:.5px;color:#e9e3d4;text-transform:uppercase;line-height:1.05;}
      .vt-body{padding:12px 16px 0;}
      .vt-text{font-size:.86rem;line-height:1.55;font-weight:500;color:#26262b;margin:0;}
      .vt-tip{margin-top:9px;font-size:.74rem;font-weight:700;font-style:italic;background:rgba(245,217,10,.35);border:2px dashed #0a0a0d;padding:6px 9px;border-radius:6px;}
      .vt-foot{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 16px 0;flex-wrap:wrap;}
      .vt-dots{display:flex;flex-wrap:wrap;gap:4px;align-items:center;max-width:150px;}
      .vt-dot{width:7px;height:7px;border-radius:50%;background:#b9b09a;border:1px solid #0a0a0d;transition:all .25s ease;flex-shrink:0;}
      .vt-dot.on{background:#d81e2c;transform:scale(1.25);}
      .vt-btns{display:flex;gap:8px;align-items:center;margin-left:auto;flex-shrink:0;}
      .vt-btn{font-family:'Anton',sans-serif;letter-spacing:.5px;font-size:.74rem;padding:8px 14px;border:2.5px solid #0a0a0d;cursor:pointer;box-shadow:3px 3px 0 #0a0a0d;background:#e9e3d4;color:#0a0a0d;transition:all .12s ease;text-transform:uppercase;white-space:nowrap;flex-shrink:0;}
      .vt-btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 #0a0a0d;}
      .vt-btn:active{transform:translate(1px,1px);box-shadow:1px 1px 0 #0a0a0d;}
      .vt-btn.primary{background:#d81e2c;color:#fff;}
      .vt-btn.ghost{box-shadow:none;border-color:transparent;background:transparent;color:#666;text-decoration:underline;font-family:'Archivo';font-weight:700;}
      .vt-skipx{position:absolute;top:8px;right:10px;background:none;border:none;font-size:1rem;color:#888;cursor:pointer;z-index:2;}
      .vt-skipx:hover{color:#d81e2c;}
      #vcinTourHelp{
        position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:100001;
        width:48px;height:48px;border-radius:50%;background:#0a0a0d;color:#f5d90a;
        border:3px solid #ffbf5c;box-shadow:3px 3px 0 rgba(10,10,13,.7);
        font-size:1.25rem;cursor:pointer;display:flex;align-items:center;justify-content:center;
        transition:transform .15s ease;
      }
      #vcinTourHelp:hover{transform:scale(1.12) rotate(-8deg);}
      @media (max-width:520px){ #vcinTourCard{width:calc(100vw - 24px);} }
    `;
    document.head.appendChild(st);
  }

  function buildDom() {
    overlayEl = document.createElement('div');
    overlayEl.id = 'vcinTourOverlay';
    overlayEl.innerHTML = `
      <div id="vcinTourSpot"></div>
      <div id="vcinTourCard" role="dialog" aria-live="polite">
        <button class="vt-skipx" data-vt="skip" aria-label="Skip tour">✕</button>
        <div class="vt-head">
          <img class="vt-avatar" alt="VIR — your guide" src="${guideImgSrc}">
          <div>
            <div class="vt-kicker">V-CIN GUIDED TOUR · <span id="vtStepNum"></span></div>
            <div class="vt-title" id="vtTitle"></div>
          </div>
        </div>
        <div class="vt-body">
          <p class="vt-text" id="vtText"></p>
          <div class="vt-tip" id="vtTip" style="display:none"></div>
        </div>
        <div class="vt-foot">
          <div class="vt-dots" id="vtDots"></div>
          <div class="vt-btns">
            <button class="vt-btn ghost" data-vt="back" id="vtBackBtn">Back</button>
            <button class="vt-btn primary" data-vt="next" id="vtNextBtn">Next ▶</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);

    spotEl = overlayEl.querySelector('#vcinTourSpot');
    cardEl = overlayEl.querySelector('#vcinTourCard');

    overlayEl.addEventListener('click', (e) => {
      const act = e.target.closest('[data-vt]');
      if (!act) return;
      if (typeof SFX !== 'undefined') SFX.click();
      const a = act.dataset.vt;
      if (a === 'next') next();
      else if (a === 'back') back();
      else if (a === 'skip') end();
    });

    document.addEventListener('keydown', vtKeys);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
  }

  function vtKeys(e) {
    if (!overlayEl) return;
    if (e.key === 'Escape') end();
    else if (e.key === 'ArrowRight') next();
    else if (e.key === 'ArrowLeft') back();
  }

  /* ── Positioning ────────────────────────────────────────────────── */
  function place() {
    if (!overlayEl || idx < 0 || idx >= steps.length) return;
    const step = steps[idx];
    const pad = 8;

    let tr = null;
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el && el.offsetParent !== null) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        tr = el.getBoundingClientRect();
      }
    }

    const cw = cardEl.offsetWidth || 380;
    const ch = cardEl.offsetHeight || 240;

    if (tr) {
      spotEl.style.display = 'block';
      spotEl.style.left = (tr.left - pad) + 'px';
      spotEl.style.top = (tr.top - pad) + 'px';
      spotEl.style.width = (tr.width + pad * 2) + 'px';
      spotEl.style.height = (tr.height + pad * 2) + 'px';

      // prefer below, flip above if cramped
      let top = tr.bottom + 14;
      if (top + ch > innerHeight - 10) top = Math.max(10, tr.top - ch - 14);
      let left = tr.left + tr.width / 2 - cw / 2;
      left = Math.max(10, Math.min(left, innerWidth - cw - 10));
      cardEl.style.left = left + 'px';
      cardEl.style.top = top + 'px';
      cardEl.style.transform = 'none';
    } else {
      // centered welcome / finish
      spotEl.style.display = 'none';
      cardEl.style.left = '50%';
      cardEl.style.top = Math.max(40, (innerHeight - ch) / 2 - 40) + 'px';
      cardEl.style.transform = 'translateX(-50%)';
    }
  }

  /* ── Navigation ─────────────────────────────────────────────────── */
  function show(i) {
    const prev = steps[idx];
    if (prev && typeof prev.onHide === 'function') { try { prev.onHide(); } catch (e) {} }
    idx = i;
    const step = steps[idx];
    if (typeof step.onShow === 'function') { try { step.onShow(); } catch (e) {} }
    overlayEl.querySelector('#vtTitle').textContent = step.title;
    overlayEl.querySelector('#vtText').textContent = step.text;
    overlayEl.querySelector('#vtStepNum').textContent = `STEP ${idx + 1}/${steps.length}`;

    const tipEl = overlayEl.querySelector('#vtTip');
    if (step.tip) { tipEl.textContent = '💡 ' + step.tip; tipEl.style.display = 'block'; }
    else tipEl.style.display = 'none';

    const nextBtn = overlayEl.querySelector('#vtNextBtn');
    const backBtn = overlayEl.querySelector('#vtBackBtn');
    backBtn.style.display = idx === 0 ? 'none' : 'inline-block';
    nextBtn.textContent = (idx === steps.length - 1) ? (step.cta || 'Finish ★') : (step.cta && idx !== steps.length - 1 ? step.cta : 'Next ▶');
    if (idx === 0 && step.cta) nextBtn.textContent = step.cta;

    const dots = overlayEl.querySelector('#vtDots');
    dots.innerHTML = steps.map((_, d) => `<span class="vt-dot ${d === idx ? 'on' : ''}"></span>`).join('');

    requestAnimationFrame(() => requestAnimationFrame(place));
  }

  function next() {
    const cur = steps[idx];
    if (cur && typeof cur.onCtaClick === 'function') {
      try { cur.onCtaClick(); } catch (e) {}
    }
    if (idx >= steps.length - 1) { end(); return; }
    show(idx + 1);
  }
  function back() { if (idx > 0) show(idx - 1); }

  function end(completed) {
    const cur = steps[idx];
    if (cur && typeof cur.onHide === 'function') { try { cur.onHide(); } catch (e) {} }
    document.removeEventListener('keydown', vtKeys);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    if (overlayEl) overlayEl.remove();
    overlayEl = spotEl = cardEl = null;
    idx = -1;
    markDone(activeTourName || 'citizen');
  }

  /* ── Public API ─────────────────────────────────────────────────── */
  function start(tourName) {
    name_ = tourName || 'citizen';
    activeTourName = name_;
    steps = TOURS[name_] || [];
    if (!steps.length) return;
    probeGuideImage();
    injectStyles();
    buildDom();
    show(0);
  }
  let name_;

  function resetDone(name) { localStorage.removeItem(FLAG_PREFIX + (name || 'citizen')); }

  function maybeAutoStart(name) {
    // Wait until the main app shell is visible (post-join), then auto-run once.
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      const app = document.getElementById('mainApp');
      const joined = app && !app.classList.contains('hidden');
      if (joined && !isDone(name)) { clearInterval(t); setTimeout(() => start(name), 700); }
      if (tries > 90) clearInterval(t);
    }, 1000);
  }

  function mountHelpButton() {
    const isOperator = window.location.pathname.includes('operator.html');
    const isCitizen = !isOperator && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/'));
    
    const ensure = () => {
      let container = document.getElementById('vcinTourHelpContainer');
      if (!container || !container.isConnected) {
        if (container) container.remove();
        injectStyles();
        container = document.createElement('div');
        container.id = 'vcinTourHelpContainer';
        container.style.cssText = 'position:fixed;left:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:100001;display:flex;gap:8px;flex-wrap:wrap;';
        
        /* Shared SVG icon markup (stroke = currentColor, so each button tints its own icon) */
        const ICONS = {
          citizen:  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
          guardian: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l7.5 3v5.2c0 4.6-3.2 7.6-7.5 9.3-4.3-1.7-7.5-4.7-7.5-9.3V6L12 3z"/><path d="M9.2 12.2l2 2 3.6-4.2"/></svg>',
          operator: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4"/><path d="M8 20h8"/><path d="M7 8.5h4M7 11.5h6"/></svg>'
        };

        /* Pill button factory: [icon] LABEL — color-coded per role */
        const makeTourBtn = ({ id, label, tour, icon, color, border, title }) => {
          const btn = document.createElement('button');
          btn.id = id;
          btn.title = title;
          btn.setAttribute('aria-label', title);
          btn.innerHTML = icon + '<span>' + label + '</span>';
          btn.style.cssText = 'height:46px;border-radius:999px;background:#0a0a0d;color:' + color
            + ';border:3px solid ' + border
            + ';box-shadow:3px 3px 0 rgba(10,10,13,.7);font-size:0.72rem;font-weight:700;letter-spacing:0.5px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;padding:0 14px 0 12px;transition:transform .15s ease;white-space:nowrap;font-family:inherit;';
          btn.onclick = () => { if (typeof SFX !== 'undefined') SFX.click(); start(tour); };
          btn.onmouseenter = () => btn.style.transform = 'scale(1.08) translateY(-2px)';
          btn.onmouseleave = () => btn.style.transform = 'scale(1) translateY(0)';
          return btn;
        };

        const citizenBtn = makeTourBtn({
          id: 'vcinTourHelpCitizen', label: 'CITIZEN', tour: 'citizen', icon: ICONS.citizen,
          color: '#f5d90a', border: '#ffbf5c', title: 'Start Citizen Tour'
        });
        const guardianBtn = makeTourBtn({
          id: 'vcinTourHelpGuardian', label: 'GUARDIAN', tour: 'guardian', icon: ICONS.guardian,
          color: '#22c55e', border: '#22c55e', title: 'Start Guardian Tour'
        });
        const operatorBtn = makeTourBtn({
          id: 'vcinTourHelpOperator', label: 'OPERATOR', tour: 'operator', icon: ICONS.operator,
          color: '#3b82f6', border: '#3b82f6', title: 'Start Operator Tour'
        });
        
        // Show appropriate buttons based on page
        if (isOperator) {
          container.appendChild(operatorBtn);
        } else if (isCitizen) {
          container.appendChild(citizenBtn);
          container.appendChild(guardianBtn);
        } else {
          // Default: show all
          container.appendChild(citizenBtn);
          container.appendChild(guardianBtn);
          container.appendChild(operatorBtn);
        }
        
        (document.body || document.documentElement).appendChild(container);
      }
      return container;
    };
    ensure();
    // self-heal: re-create the button if any script wipes/re-renders <body>
    setInterval(() => { if (!document.getElementById('vcinTourHelpContainer')) ensure(); }, 2500);
  }

/* ── Bootstrap: button appears immediately, tour auto-runs post-join ── */
function bootstrap() {
    mountHelpButton();
    const isOperator = window.location.pathname.includes('operator.html');
    if (isOperator) {
      maybeAutoStart('operator');
    } else {
      maybeAutoStart('citizen');
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  return { start, resetDone, maybeAutoStart, mountHelpButton };
})();
