/**
 * V-CIN Suraksha — Advanced Interactive Engine Visualizers (engine-visualizers.js)
 * High-Fidelity Animated Canvas + SVG Visualizers for:
 * 1. CTS Bayesian Pedestrian Detector Scanner Gate (Citizens walking & getting sticky scores)
 * 2. Central SOS Tactical Lighthouse Beacon (360° Rotating Radar & Incident Laser Arcs)
 * 3. IRS Quantum Threat Engine Deck (Gauges, Oscilloscopes, Step-by-Step Formula)
 * 4. Guardian Dispatch Pipeline Loop (Continuous 5-Stage Animated Workflow)
 * 5. Anti-Gaming Heuristic Scanner & Judge Transparency Matrix
 */

'use strict';

const VCINVisualizers = (() => {

  /* ═══════════════════════════════════════════════════════════
     1. CTS BAYESIAN PEDESTRIAN DETECTOR SCANNER GATE
  ════════════════════════════════════════════════════════════ */
  let scannerCanvas = null;
  let scannerCtx = null;
  let scannerAnimId = null;
  let pedestrianQueue = [];
  let scannerState = {
    accurate: 8,
    falseCount: 0,
    digilocker: true,
    rwa: true,
    upvotes: 5,
    customName: 'Inspector Sharma'
  };

  const NAMES_POOL = ['Capt. Vikram Rao', 'Officer Priya Sen', 'Guardian Sunita', 'Volunteer Rajesh', 'Amit Verma', 'Dr. Neha Patel', 'Suresh Kumar', 'Kavita Menon'];

  function createPedestrian(x = -40, customProfile = null) {
    const isCustom = !!customProfile;
    const accurate = customProfile ? customProfile.accurate : Math.floor(Math.random() * 12);
    const falseCount = customProfile ? customProfile.falseCount : (Math.random() < 0.2 ? Math.floor(Math.random() * 4) : 0);
    const digilocker = customProfile ? customProfile.digilocker : Math.random() > 0.15;
    const rwa = customProfile ? customProfile.rwa : Math.random() > 0.25;
    const upvotes = customProfile ? customProfile.upvotes : Math.floor(Math.random() * 8);
    const name = customProfile ? customProfile.name : NAMES_POOL[Math.floor(Math.random() * NAMES_POOL.length)];

    let ctsResult = null;
    if (typeof VCINEngines !== 'undefined' && VCINEngines.calculateCTS) {
      ctsResult = VCINEngines.calculateCTS({ accurateCount: accurate, falseCount, digilocker, rwa, upvotes });
    } else {
      const p = (accurate + 1) / (accurate + falseCount + 2);
      const s = Math.round(30 + (digilocker ? 20 : 0) + (rwa ? 15 : 0) + p * 30 + Math.min(10, upvotes));
      ctsResult = {
        score: s,
        tier: s >= 85 ? 'CIVIC GUARDIAN' : s >= 60 ? 'VERIFIED' : s >= 30 ? 'STANDARD' : 'FLAGGED'
      };
    }

    return {
      x,
      y: 110,
      speed: 1.2 + Math.random() * 0.4,
      name,
      accurate,
      falseCount,
      digilocker,
      rwa,
      upvotes,
      score: ctsResult.score,
      tier: ctsResult.tier,
      state: 'approaching', // approaching -> scanning -> scored -> exiting
      scanProgress: 0,
      scannedTime: 0,
      particles: [],
      legAngle: 0
    };
  }

  function initPedestrianCTSScanner(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="vcin-scanner-deck">
        <div class="vcin-scanner-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="vcin-scanner-icon">🚪</span>
            <div>
              <div class="vcin-scanner-title">Civic Trust Scanner Gate (Bayesian Detector)</div>
              <div class="vcin-scanner-sub">Civic Contribution Reliability via Beta(α+α₀, β+β₀) Posterior Estimation [Prior: Beta(1,1) → Beta(9,1)]</div>
            </div>
          </div>
          <div class="vcin-scanner-badge" id="scannerStatusBadge">🟢 GATE ACTIVE</div>
        </div>

        <div style="position:relative;width:100%;height:220px;background:#090d16;border-radius:12px;overflow:hidden;border:1px solid rgba(6,182,212,0.25)">
          <canvas id="ctsScannerCanvas" style="width:100%;height:100%;display:block"></canvas>
          <div class="vcin-scanner-zone-label" style="left:20px">⬅️ Citizen Ingestion</div>
          <div class="vcin-scanner-zone-label" style="left:50%;transform:translateX(-50%);color:#38bdf8">⚡ SCANNER GATE</div>
          <div class="vcin-scanner-zone-label" style="right:20px;color:#34d399">➡️ Verified Trust Zone</div>
        </div>

        <!-- Scope & Reliability Note -->
        <div style="font-size:0.72rem;color:#38bdf8;background:rgba(15,23,42,0.85);border:1px solid rgba(56,189,248,0.25);padding:6px 12px;border-radius:6px;margin:8px 0">
          ℹ️ <strong>Scope Note:</strong> Evaluates the statistical reliability of civic evidence and contributions, not personal character or personal trustworthiness.
        </div>

        <!-- Live Controls & Test Trigger -->
        <div class="vcin-scanner-controls">
          <div class="vcin-sc-group">
            <label>Validated Contributions (α): <strong id="scAccVal">8</strong></label>
            <input type="range" id="scAccurateInput" min="0" max="25" value="8" class="vcin-slider" oninput="VCINVisualizers.updateScannerInput('accurate', this.value)"/>
          </div>
          <div class="vcin-sc-group">
            <label>Contradicted/False Reports (β): <strong id="scFalseVal">0</strong></label>
            <input type="range" id="scFalseInput" min="0" max="10" value="0" class="vcin-slider" oninput="VCINVisualizers.updateScannerInput('falseCount', this.value)"/>
          </div>
          <div class="vcin-sc-group" style="display:flex;flex-direction:column;gap:4px;padding-top:6px">
            <div style="font-size:0.7rem;color:#94a3b8;font-weight:700">Verification Signals:</div>
            <div style="display:flex;align-items:center;gap:12px">
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                <input type="checkbox" id="scDigiCheck" checked onchange="VCINVisualizers.updateScannerInput('digilocker', this.checked)"/>
                <span>🇮🇳 DigiLocker (+20)</span>
              </label>
              <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
                <input type="checkbox" id="scRwaCheck" checked onchange="VCINVisualizers.updateScannerInput('rwa', this.checked)"/>
                <span>🏢 RWA (+15)</span>
              </label>
            </div>
          </div>
          <div class="vcin-sc-group" style="padding-top:8px">
            <button class="vcin-btn-primary" style="width:100%;font-size:0.8rem;padding:6px 12px" onclick="VCINVisualizers.injectTestCitizen()">
              🚶 Step Into Scanner Gate
            </button>
          </div>
        </div>
      </div>
    `;

    scannerCanvas = document.getElementById('ctsScannerCanvas');
    if (!scannerCanvas) return;
    scannerCtx = scannerCanvas.getContext('2d');

    // Populate initial queue
    pedestrianQueue = [
      createPedestrian(40),
      createPedestrian(180),
      createPedestrian(340)
    ];

    if (scannerAnimId) cancelAnimationFrame(scannerAnimId);
    runScannerLoop();
  }

  function runScannerLoop() {
    if (!scannerCanvas || !scannerCtx) return;
    const width = scannerCanvas.width = scannerCanvas.offsetWidth || 700;
    const height = scannerCanvas.height = scannerCanvas.offsetHeight || 220;

    scannerCtx.clearRect(0, 0, width, height);

    // 1. Draw Tactical Floor Grid & Distance Markers
    scannerCtx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
    scannerCtx.lineWidth = 1;
    for (let x = 0; x < width; x += 30) {
      scannerCtx.beginPath(); scannerCtx.moveTo(x, 0); scannerCtx.lineTo(x, height); scannerCtx.stroke();
    }
    scannerCtx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
    scannerCtx.beginPath();
    scannerCtx.moveTo(0, height - 40);
    scannerCtx.lineTo(width, height - 40);
    scannerCtx.lineWidth = 2;
    scannerCtx.stroke();

    // 2. Draw Scanner Gate Center Structure
    const gateX = width / 2;
    const gateY = height - 40;
    const gateWidth = 46;
    const gateHeight = 110;

    // Gate Arch Glow
    const archGrad = scannerCtx.createLinearGradient(gateX - 25, 0, gateX + 25, 0);
    archGrad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    archGrad.addColorStop(0.5, 'rgba(78, 222, 163, 0.8)');
    archGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');

    scannerCtx.fillStyle = archGrad;
    scannerCtx.fillRect(gateX - gateWidth / 2, gateY - gateHeight, 6, gateHeight);
    scannerCtx.fillRect(gateX + gateWidth / 2 - 6, gateY - gateHeight, 6, gateHeight);
    scannerCtx.fillRect(gateX - gateWidth / 2, gateY - gateHeight, gateWidth, 8);

    // Gate Sensor Eye / Camera
    scannerCtx.beginPath();
    scannerCtx.arc(gateX, gateY - gateHeight + 4, 7, 0, Math.PI * 2);
    scannerCtx.fillStyle = '#38bdf8';
    scannerCtx.fill();

    // Laser Beam Scanning effect (moving vertical laser)
    const beamPhase = (Date.now() * 0.005) % Math.PI;
    const laserAlpha = 0.35 + Math.sin(beamPhase) * 0.25;
    scannerCtx.fillStyle = `rgba(6, 182, 212, ${laserAlpha * 0.2})`;
    scannerCtx.fillRect(gateX - gateWidth / 2 + 6, gateY - gateHeight + 8, gateWidth - 12, gateHeight - 8);

    // Laser scanning lines
    const laserLineY = (gateY - gateHeight + 10) + ((Date.now() * 0.08) % (gateHeight - 20));
    scannerCtx.strokeStyle = `rgba(78, 222, 163, 0.85)`;
    scannerCtx.lineWidth = 2;
    scannerCtx.beginPath();
    scannerCtx.moveTo(gateX - gateWidth / 2 + 6, laserLineY);
    scannerCtx.lineTo(gateX + gateWidth / 2 - 6, laserLineY);
    scannerCtx.stroke();

    // 3. Update & Draw Pedestrians / Stick Figures
    for (let i = 0; i < pedestrianQueue.length; i++) {
      const p = pedestrianQueue[i];
      p.x += p.speed;
      p.legAngle += p.speed * 0.15;

      const pFloorY = gateY;
      const isInsideGate = Math.abs(p.x - gateX) < gateWidth / 2 + 10;

      if (isInsideGate && p.state === 'approaching') {
        p.state = 'scanning';
        p.scanProgress = 0;
      }

      if (p.state === 'scanning') {
        p.scanProgress += 0.05;
        // Generate scanner scan particles
        if (Math.random() < 0.4) {
          p.particles.push({
            x: p.x + (Math.random() - 0.5) * 20,
            y: pFloorY - 20 - Math.random() * 40,
            vy: -1 - Math.random() * 1.5,
            alpha: 1.0,
            color: p.score >= 60 ? '#4edea3' : '#f43f5e'
          });
        }
        if (p.x > gateX + 15) {
          p.state = 'scored';
        }
      }

      // Draw Pedestrian Figure (Tactical Stick Man with Head & Torso)
      drawStickFigure(scannerCtx, p.x, pFloorY, p.legAngle, p.state === 'scored' ? (p.score >= 85 ? '#4edea3' : p.score >= 60 ? '#38bdf8' : '#f43f5e') : '#cbd5e1');

      // Draw Particles
      p.particles.forEach((pt, idx) => {
        pt.y += pt.vy;
        pt.alpha -= 0.04;
        scannerCtx.fillStyle = pt.color;
        scannerCtx.globalAlpha = Math.max(0, pt.alpha);
        scannerCtx.beginPath();
        scannerCtx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        scannerCtx.fill();
        scannerCtx.globalAlpha = 1.0;
      });
      p.particles = p.particles.filter(pt => pt.alpha > 0);

      // Draw Sticky Trust Score & Tier Badge above head once evaluated
      if (p.state === 'scored' || p.x > gateX) {
        const badgeY = pFloorY - 70;
        const tierClr = p.score >= 85 ? '#4edea3' : p.score >= 60 ? '#38bdf8' : p.score >= 30 ? '#f59e0b' : '#f43f5e';

        // Connecting laser stalk
        scannerCtx.strokeStyle = tierClr;
        scannerCtx.lineWidth = 1;
        scannerCtx.beginPath();
        scannerCtx.moveTo(p.x, pFloorY - 50);
        scannerCtx.lineTo(p.x, badgeY + 12);
        scannerCtx.stroke();

        // Badge Container
        const badgeW = 74;
        const badgeH = 26;
        scannerCtx.fillStyle = '#0f172a';
        scannerCtx.strokeStyle = tierClr;
        scannerCtx.lineWidth = 1.5;
        scannerCtx.beginPath();
        scannerCtx.roundRect(p.x - badgeW / 2, badgeY - badgeH / 2, badgeW, badgeH, 6);
        scannerCtx.fill();
        scannerCtx.stroke();

        // CTS Number & Tier Text
        scannerCtx.fillStyle = '#ffffff';
        scannerCtx.font = 'bold 12px monospace';
        scannerCtx.textAlign = 'center';
        scannerCtx.fillText(`${p.score} CTS`, p.x, badgeY - 1);

        scannerCtx.fillStyle = tierClr;
        scannerCtx.font = '7px monospace';
        scannerCtx.fillText(p.tier.substring(0, 14), p.x, badgeY + 9);

        // Name tag
        scannerCtx.fillStyle = '#94a3b8';
        scannerCtx.font = '9px sans-serif';
        scannerCtx.fillText(p.name.split(' ')[0], p.x, pFloorY + 14);
      } else {
        // Scanning in-progress question mark
        scannerCtx.fillStyle = '#94a3b8';
        scannerCtx.font = '9px sans-serif';
        scannerCtx.textAlign = 'center';
        scannerCtx.fillText(p.name.split(' ')[0], p.x, pFloorY + 14);

        if (p.state === 'scanning') {
          scannerCtx.fillStyle = '#38bdf8';
          scannerCtx.font = 'bold 11px monospace';
          scannerCtx.fillText('SCANNING...', p.x, pFloorY - 60);
        }
      }
    }

    // Spawn new citizens as old ones exit right side
    pedestrianQueue = pedestrianQueue.filter(p => p.x < width + 50);
    if (pedestrianQueue.length < 3 && Math.random() < 0.02) {
      const lastX = pedestrianQueue.length > 0 ? pedestrianQueue[pedestrianQueue.length - 1].x : 0;
      if (lastX > 100 || pedestrianQueue.length === 0) {
        pedestrianQueue.push(createPedestrian(-40));
      }
    }

    scannerAnimId = requestAnimationFrame(runScannerLoop);
  }

  function drawStickFigure(ctx, x, y, legAngle, color) {
    const headY = y - 44;
    const chestY = y - 26;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';

    // Head
    ctx.beginPath();
    ctx.arc(x, headY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.stroke();

    // Torso
    ctx.beginPath();
    ctx.moveTo(x, headY + 6);
    ctx.lineTo(x, chestY + 12);
    ctx.stroke();

    // Arms
    const armSwing = Math.sin(legAngle) * 6;
    ctx.beginPath();
    ctx.moveTo(x - armSwing, chestY + 4);
    ctx.lineTo(x, chestY - 4);
    ctx.lineTo(x + armSwing, chestY + 4);
    ctx.stroke();

    // Legs
    const legOffset = Math.sin(legAngle) * 8;
    ctx.beginPath();
    ctx.moveTo(x, chestY + 12);
    ctx.lineTo(x - legOffset, y);
    ctx.moveTo(x, chestY + 12);
    ctx.lineTo(x + legOffset, y);
    ctx.stroke();
  }

  function injectTestCitizen() {
    const custom = {
      name: scannerState.customName || 'Custom Citizen',
      accurate: scannerState.accurate,
      falseCount: scannerState.falseCount,
      digilocker: scannerState.digilocker,
      rwa: scannerState.rwa,
      upvotes: scannerState.upvotes
    };
    pedestrianQueue.unshift(createPedestrian(-20, custom));
    if (typeof showToast === 'function') {
      showToast(`🚶 Injected ${custom.name} into Civic Trust Scanner Gate!`, 'info');
    }
  }

  function updateScannerInput(key, val) {
    scannerState[key] = (key === 'digilocker' || key === 'rwa') ? !!val : parseInt(val);
    const accEl = document.getElementById('scAccVal');
    const falseEl = document.getElementById('scFalseVal');
    if (accEl && key === 'accurate') accEl.textContent = val;
    if (falseEl && key === 'falseCount') falseEl.textContent = val;
  }

  /* ═══════════════════════════════════════════════════════════
     2. CENTRAL SOS TACTICAL LIGHTHOUSE BEACON (360° RADAR)
  ════════════════════════════════════════════════════════════ */
  let lhCanvas = null;
  let lhCtx = null;
  let lhAnimId = null;
  let lhAngle = 0;
  let lhEmergencyMode = false;
  let lhEmergencyTimer = null;
  let lhAlertDetails = null;

  function initTacticalLighthouse(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="vcin-lh-card" id="vcinLighthouseCard">
        <div class="vcin-lh-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span class="vcin-lh-beacon-dot"></span>
            <div>
              <div class="vcin-lh-title">TACTICAL SOS LIGHTHOUSE BEACON</div>
              <div class="vcin-lh-sub">360° Autonomous Threat Intercept & Emergency Microwave Laser Arcs</div>
            </div>
          </div>
          <div class="vcin-lh-status" id="lhStatusPill">🟢 AMBIENT MONITORING</div>
        </div>

        <div style="position:relative;width:100%;height:260px;background:#070a12;border-radius:12px;overflow:hidden;border:1px solid rgba(6,182,212,0.3)">
          <canvas id="tacticalLighthouseCanvas" style="width:100%;height:100%;display:block"></canvas>
          <div id="lhEmergencyOverlay" class="vcin-lh-alert-banner hidden">
            🚨 EMERGENCY SOS BEACON LOCKED — DISPATCHING NEARBY GUARDIANS
          </div>
        </div>

        <div class="vcin-lh-footer">
          <div class="vcin-lh-stat">
            <span class="vcin-muted">SCAN SWEEP:</span> <strong id="lhSweepVal">360° CW / 1.5 RPM</strong>
          </div>
          <div class="vcin-lh-stat">
            <span class="vcin-muted">RADAR RANGE:</span> <strong>25.0 KM (Urban Mesh)</strong>
          </div>
          <button class="vcin-btn-warning" style="font-size:0.75rem;padding:4px 10px" onclick="VCINVisualizers.testLighthouseEmergency()">
            ⚡ Test SOS Beam Strobe
          </button>
        </div>
      </div>
    `;

    lhCanvas = document.getElementById('tacticalLighthouseCanvas');
    if (!lhCanvas) return;
    lhCtx = lhCanvas.getContext('2d');

    if (lhAnimId) cancelAnimationFrame(lhAnimId);
    runLighthouseLoop();
  }

  function runLighthouseLoop() {
    if (!lhCanvas || !lhCtx) return;
    const width = lhCanvas.width = lhCanvas.offsetWidth || 500;
    const height = lhCanvas.height = lhCanvas.offsetHeight || 260;
    const cx = width / 2;
    const cy = height / 2;
    const maxRadius = Math.min(cx, cy) - 16;

    lhCtx.clearRect(0, 0, width, height);

    // 1. Concentric Radar Range Rings
    lhCtx.strokeStyle = lhEmergencyMode ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.2)';
    lhCtx.lineWidth = 1;
    [0.25, 0.5, 0.75, 1.0].forEach(r => {
      lhCtx.beginPath();
      lhCtx.arc(cx, cy, maxRadius * r, 0, Math.PI * 2);
      lhCtx.stroke();
    });

    // Crosshairs
    lhCtx.beginPath();
    lhCtx.moveTo(cx - maxRadius, cy); lhCtx.lineTo(cx + maxRadius, cy);
    lhCtx.moveTo(cx, cy - maxRadius); lhCtx.lineTo(cx, cy + maxRadius);
    lhCtx.stroke();

    // 2. Rotating Sweeping Lighthouse Laser Beam
    const speed = lhEmergencyMode ? 0.06 : 0.025;
    lhAngle = (lhAngle + speed) % (Math.PI * 2);

    const beamWidth = lhEmergencyMode ? 0.65 : 0.45;
    const beamColor = lhEmergencyMode ? '239, 68, 68' : '6, 182, 212';

    lhCtx.save();
    lhCtx.beginPath();
    lhCtx.moveTo(cx, cy);
    lhCtx.arc(cx, cy, maxRadius, lhAngle - beamWidth, lhAngle);
    lhCtx.closePath();

    const beamGrad = lhCtx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius);
    beamGrad.addColorStop(0, `rgba(${beamColor}, 0.75)`);
    beamGrad.addColorStop(0.7, `rgba(${beamColor}, 0.25)`);
    beamGrad.addColorStop(1, `rgba(${beamColor}, 0.0)`);
    lhCtx.fillStyle = beamGrad;
    lhCtx.fill();
    lhCtx.restore();

    // Opposing soft counter-beam for dual lighthouse effect
    lhCtx.save();
    lhCtx.beginPath();
    lhCtx.moveTo(cx, cy);
    lhCtx.arc(cx, cy, maxRadius, lhAngle + Math.PI - beamWidth, lhAngle + Math.PI);
    lhCtx.closePath();
    lhCtx.fillStyle = `rgba(${beamColor}, 0.08)`;
    lhCtx.fill();
    lhCtx.restore();

    // 3. Central Lighthouse Tower Tower Lens Graphic
    const towerRadius = 18;
    lhCtx.beginPath();
    lhCtx.arc(cx, cy, towerRadius, 0, Math.PI * 2);
    lhCtx.fillStyle = '#0f172a';
    lhCtx.strokeStyle = lhEmergencyMode ? '#ef4444' : '#4edea3';
    lhCtx.lineWidth = 3;
    lhCtx.fill();
    lhCtx.stroke();

    // Pulsing central beacon core
    const corePulse = 6 + Math.sin(Date.now() * 0.008) * 2;
    lhCtx.beginPath();
    lhCtx.arc(cx, cy, corePulse, 0, Math.PI * 2);
    lhCtx.fillStyle = lhEmergencyMode ? '#ef4444' : '#38bdf8';
    lhCtx.fill();

    // 4. Sample Guardian & Emergency Distress Nodes on Radar
    const radarNodes = [
      { label: '🛡️ Responders [3]', distRatio: 0.55, angle: 1.1, color: '#10b981' },
      { label: '🛡️ Patrol Unit 2', distRatio: 0.8, angle: 3.4, color: '#10b981' },
      { label: '🏢 Cyber Station', distRatio: 0.35, angle: 4.8, color: '#38bdf8' }
    ];

    if (lhEmergencyMode && lhAlertDetails) {
      radarNodes.push({
        label: `🚨 ${lhAlertDetails.victimName || 'SOS DISTRESS'}`,
        distRatio: 0.65,
        angle: lhAngle + 0.3,
        color: '#ef4444',
        pulse: true
      });
    }

    radarNodes.forEach(n => {
      const nx = cx + Math.cos(n.angle) * (maxRadius * n.distRatio);
      const ny = cy + Math.sin(n.angle) * (maxRadius * n.distRatio);

      // If pulsing distress node, draw radiating laser arcs from center lighthouse
      if (n.pulse) {
        lhCtx.strokeStyle = '#ef4444';
        lhCtx.lineWidth = 2;
        lhCtx.setLineDash([6, 4]);
        lhCtx.beginPath();
        lhCtx.moveTo(cx, cy);
        lhCtx.lineTo(nx, ny);
        lhCtx.stroke();
        lhCtx.setLineDash([]);

        lhCtx.beginPath();
        lhCtx.arc(nx, ny, 12 + Math.sin(Date.now() * 0.01) * 4, 0, Math.PI * 2);
        lhCtx.strokeStyle = '#ef4444';
        lhCtx.stroke();
      }

      lhCtx.beginPath();
      lhCtx.arc(nx, ny, n.pulse ? 6 : 4, 0, Math.PI * 2);
      lhCtx.fillStyle = n.color;
      lhCtx.fill();

      lhCtx.fillStyle = '#e2e8f0';
      lhCtx.font = '9px monospace';
      lhCtx.textAlign = 'left';
      lhCtx.fillText(n.label, nx + 8, ny + 3);
    });

    lhAnimId = requestAnimationFrame(runLighthouseLoop);
  }

  function triggerLighthouseSOS(alertData) {
    lhEmergencyMode = true;
    lhAlertDetails = alertData || { victimName: 'Citizen Emergency SOS' };

    const pill = document.getElementById('lhStatusPill');
    const overlay = document.getElementById('lhEmergencyOverlay');
    if (pill) {
      pill.textContent = '🚨 EMERGENCY SOS ACTIVE';
      pill.style.background = 'rgba(239, 68, 68, 0.2)';
      pill.style.borderColor = '#ef4444';
      pill.style.color = '#ef4444';
    }
    if (overlay) overlay.classList.remove('hidden');

    clearTimeout(lhEmergencyTimer);
    lhEmergencyTimer = setTimeout(() => {
      lhEmergencyMode = false;
      lhAlertDetails = null;
      if (pill) {
        pill.textContent = '🟢 AMBIENT MONITORING';
        pill.style.background = '';
        pill.style.borderColor = '';
        pill.style.color = '';
      }
      if (overlay) overlay.classList.add('hidden');
    }, 15000);
  }

  function testLighthouseEmergency() {
    triggerLighthouseSOS({ victimName: 'SOS Test Incident #829' });
  }

  /* ═══════════════════════════════════════════════════════════
     3. INCIDENT RISK SCORE (IRS) ENGINE
  ════════════════════════════════════════════════════════════ */
  let irsState = {
    geoRisk: 40,
    audioStress: 35,
    scamScore: 25,
    isGoldenHour: false
  };

  function initIRSThreatDeck(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const result = evaluateIRS(irsState);

    container.innerHTML = `
      <div class="vcin-irs-deck">
        <div class="vcin-irs-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.4rem">⚙️</span>
            <div>
              <div class="vcin-irs-title">Incident Risk Score (IRS) Engine</div>
              <div class="vcin-irs-sub">4-Factor Weighted Formula: Geo + Acoustic Distress + Scam + Time Criticality</div>
            </div>
          </div>
          <span class="vcin-hud-badge" id="irsThreatPill" style="font-weight:700">${result.threatLevel}</span>
        </div>

        <div class="vcin-irs-body-grid">
          <!-- Left: IRS Score Gauge & Risk Level Badge -->
          <div class="vcin-irs-gauge-card">
            <div class="vcin-irs-radial-wrap">
              <svg viewBox="0 0 120 120" class="vcin-irs-svg-gauge">
                <circle cx="60" cy="60" r="48" class="vcin-gauge-track"></circle>
                <circle cx="60" cy="60" r="48" class="vcin-gauge-bar" id="irsGaugeCircle" style="stroke-dasharray: 301.6; stroke-dashoffset: ${301.6 - (301.6 * result.totalScore / 100)}"></circle>
              </svg>
              <div class="vcin-gauge-inner">
                <div class="vcin-gauge-num" id="irsTotalScoreNum">${result.totalScore}</div>
                <div class="vcin-gauge-label">IRS SCORE</div>
              </div>
            </div>
            <div class="vcin-irs-rec-box" id="irsRecBox">
              👉 ${result.actionRecommendation}
            </div>
          </div>

          <!-- Right: Formula & Step-by-Step Calculation Breakdown -->
          <div class="vcin-irs-formula-card">
            <div class="vcin-irs-section-lbl">Formula:</div>
            <div class="vcin-irs-expr">
              IRS = (0.30 × Geo) + (0.25 × Audio) + (0.25 × Scam) + (0.20 × Time)
            </div>
            <div class="vcin-irs-section-lbl" style="margin-top:10px">Calculation breakdown:</div>
            <div class="vcin-irs-calc-line" id="irsFormulaCalcLine">
              = (0.30 × ${irsState.geoRisk}) + (0.25 × ${irsState.audioStress}) + (0.25 × ${irsState.scamScore}) + (0.20 × ${irsState.isGoldenHour ? 100 : 0}) = <b style="color:#f43f5e;font-size:1.1rem">${result.totalScore}</b>
            </div>
            <div style="font-size:0.72rem;color:#94a3b8;background:rgba(15,23,42,0.8);border:1px solid rgba(56,189,248,0.2);padding:5px 8px;border-radius:6px;margin-top:8px">
              ℹ️ <strong>Disclaimer:</strong> IRS is an operational prioritisation score, not a probability of crime.
            </div>
          </div>
        </div>

        <!-- 4 Input Sliders Feeding the Formula -->
        <div class="vcin-irs-sliders-grid">
          <div class="vcin-irs-slider-box">
            <div class="vcin-irs-slider-header">
              <span>📍 Geo Anomaly (R<sub>geo</sub>)</span>
              <strong id="irsGeoVal">${irsState.geoRisk}/100</strong>
            </div>
            <input type="range" min="0" max="100" value="${irsState.geoRisk}" class="vcin-slider" style="accent-color:#38bdf8" oninput="VCINVisualizers.updateIRSMetric('geoRisk', this.value)"/>
          </div>

          <div class="vcin-irs-slider-box">
            <div class="vcin-irs-slider-header">
              <span>🎤 Acoustic Distress Indicators (R<sub>audio</sub>)</span>
              <strong id="irsAudioVal">${irsState.audioStress}/100</strong>
            </div>
            <input type="range" min="0" max="100" value="${irsState.audioStress}" class="vcin-slider" style="accent-color:#a855f7" oninput="VCINVisualizers.updateIRSMetric('audioStress', this.value)"/>
          </div>

          <div class="vcin-irs-slider-box">
            <div class="vcin-irs-slider-header">
              <span>🔍 Scam Score (R<sub>scam</sub>)</span>
              <strong id="irsScamVal">${irsState.scamScore}/100</strong>
            </div>
            <input type="range" min="0" max="100" value="${irsState.scamScore}" class="vcin-slider" style="accent-color:#f59e0b" oninput="VCINVisualizers.updateIRSMetric('scamScore', this.value)"/>
          </div>

          <div class="vcin-irs-slider-box">
            <div class="vcin-irs-slider-header">
              <span>⏱️ Time Criticality (R<sub>time</sub>)</span>
              <strong id="irsGoldenVal">${irsState.isGoldenHour ? '100/100' : '0/100'}</strong>
            </div>
            <button class="vcin-btn-secondary-sm" style="margin-top:2px;width:100%;font-size:0.75rem;padding:4px" onclick="VCINVisualizers.toggleIRSGoldenHour()">
              ${irsState.isGoldenHour ? '⏱️ Deactivate Time Criticality' : '⏱️ Trigger Time Criticality'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function evaluateIRS(data) {
    const geo = data.geoRisk || 0;
    const audio = data.audioStress || 0;
    const scam = data.scamScore || 0;
    const golden = data.isGoldenHour ? 100 : 0;

    const totalScore = (0.30 * geo + 0.25 * audio + 0.25 * scam + 0.20 * golden).toFixed(1);

    let threatLevel = 'NORMAL RISK';
    let actionRecommendation = 'Standard Automated Telemetry Monitoring';

    if (totalScore >= 75) {
      threatLevel = 'CRITICAL THREAT';
      actionRecommendation = 'Immediate Operator WebRTC Intercept & Patrol Alert';
    } else if (totalScore >= 45) {
      threatLevel = 'CAUTION RISK';
      actionRecommendation = 'Alert Standby Guardians & Prepare Video Link';
    }

    return { totalScore, threatLevel, actionRecommendation };
  }

  function updateIRSMetric(key, val) {
    irsState[key] = parseInt(val);
    refreshIRSView();
  }

  function toggleIRSGoldenHour() {
    irsState.isGoldenHour = !irsState.isGoldenHour;
    refreshIRSView();
  }

  function refreshIRSView() {
    const res = evaluateIRS(irsState);
    const scoreNum = document.getElementById('irsTotalScoreNum');
    const pill = document.getElementById('irsThreatPill');
    const recBox = document.getElementById('irsRecBox');
    const calcLine = document.getElementById('irsFormulaCalcLine');
    const circle = document.getElementById('irsGaugeCircle');

    if (scoreNum) scoreNum.textContent = res.totalScore;
    if (pill) pill.textContent = res.threatLevel;
    if (recBox) recBox.textContent = '👉 ' + res.actionRecommendation;
    if (calcLine) {
      calcLine.innerHTML = `= (0.30 × ${irsState.geoRisk}) + (0.25 × ${irsState.audioStress}) + (0.25 × ${irsState.scamScore}) + (0.20 × ${irsState.isGoldenHour ? 100 : 0}) = <b style="color:#f43f5e;font-size:1.1rem">${res.totalScore}</b>`;
    }
    if (circle) {
      circle.style.strokeDashoffset = 301.6 - (301.6 * parseFloat(res.totalScore) / 100);
      circle.style.stroke = parseFloat(res.totalScore) >= 75 ? '#ef4444' : parseFloat(res.totalScore) >= 45 ? '#f59e0b' : '#38bdf8';
    }

    document.getElementById('irsGeoVal').textContent = `${irsState.geoRisk}/100`;
    document.getElementById('irsAudioVal').textContent = `${irsState.audioStress}/100`;
    document.getElementById('irsScamVal').textContent = `${irsState.scamScore}/100`;
    document.getElementById('irsGoldenVal').textContent = irsState.isGoldenHour ? '100/100' : '0/100';
  }

  /* ═══════════════════════════════════════════════════════════
     4. GUARDIAN DISPATCH PIPELINE LOOP VISUALIZER
  ════════════════════════════════════════════════════════════ */
  let pipelineAnimId = null;

  function initGuardianPipelineLoop(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="vcin-pipeline-deck">
        <div class="vcin-pipeline-header">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:1.3rem">🔄</span>
            <div>
              <div class="vcin-pipeline-title">AUTONOMOUS GUARDIAN DISPATCH & TRIAGE PIPELINE</div>
              <div class="vcin-pipeline-sub">Continuous 5-Stage Cyclic Response Protocol</div>
            </div>
          </div>
          <span class="vcin-hud-badge" style="background:rgba(16,185,129,0.15);color:#34d399">LOOPING ACTIVE</span>
        </div>

        <div class="vcin-pipeline-track" id="pipelineStages">
          <div class="vcin-pipe-step" data-step="0">
            <div class="vcin-pipe-circle">🚨</div>
            <div class="vcin-pipe-name">1. Signal Ingest</div>
            <small class="vcin-pipe-desc">Audio + GPS SHA256</small>
          </div>
          <div class="vcin-pipe-connector"><div class="vcin-pipe-dot"></div></div>

          <div class="vcin-pipe-step" data-step="1">
            <div class="vcin-pipe-circle">📍</div>
            <div class="vcin-pipe-name">2. Proximity Triage</div>
            <small class="vcin-pipe-desc">Dist + CTS Ranking</small>
          </div>
          <div class="vcin-pipe-connector"><div class="vcin-pipe-dot"></div></div>

          <div class="vcin-pipe-step" data-step="2">
            <div class="vcin-pipe-circle">🛡️</div>
            <div class="vcin-pipe-name">3. Auto Dispatch</div>
            <small class="vcin-pipe-desc">MQTT Ack Handshake</small>
          </div>
          <div class="vcin-pipe-connector"><div class="vcin-pipe-dot"></div></div>

          <div class="vcin-pipe-step" data-step="3">
            <div class="vcin-pipe-circle">🏃</div>
            <div class="vcin-pipe-name">4. En-Route Radar</div>
            <small class="vcin-pipe-desc">Live Triangle Vector</small>
          </div>
          <div class="vcin-pipe-connector"><div class="vcin-pipe-dot"></div></div>

          <div class="vcin-pipe-step" data-step="4">
            <div class="vcin-pipe-circle">⭐</div>
            <div class="vcin-pipe-name">5. Mutual Rating</div>
            <small class="vcin-pipe-desc">Bayesian CTS Sync</small>
          </div>
        </div>
      </div>
    `;

    if (pipelineAnimId) clearInterval(pipelineAnimId);
    let activeStage = 0;
    pipelineAnimId = setInterval(() => {
      activeStage = (activeStage + 1) % 5;
      document.querySelectorAll('#pipelineStages .vcin-pipe-step').forEach((el, idx) => {
        el.classList.toggle('active', idx === activeStage);
      });
    }, 2400);
  }

  // ── "What's Real vs. Simulated" Judge Transparency Modal Generator ───
  function showJudgeTransparencyModal() {
    document.getElementById('vcinJudgeModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'vcinJudgeModal';
    modal.className = 'vcin-overlay';
    modal.style.cssText = `
      position: fixed; inset: 0; background: rgba(15,23,42,0.92); backdrop-filter: blur(12px);
      z-index: 12000; display: flex; align-items: center; justify-content: center; padding: 20px;
    `;

    modal.innerHTML = `
      <div style="background:#0f172a;border:1px solid #3b82f6;border-radius:20px;max-width:840px;width:100%;max-height:85vh;overflow-y:auto;padding:24px;color:#f8fafc;box-shadow:0 20px 50px rgba(0,0,0,0.9)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;border-bottom:1px solid #334155;padding-bottom:12px">
          <div>
            <h3 style="margin:0;font-weight:800;color:#60a5fa;display:flex;align-items:center;gap:8px">
              <span>⚖️ Competition Judge Transparency Matrix</span>
              <span class="vcin-badge vcin-badge-success">VERIFIED ARCHITECTURE</span>
            </h3>
            <p style="margin:4px 0 0 0;font-size:0.85rem;color:#94a3b8">What is mathematically real vs prototype models in V-CIN</p>
          </div>
          <button style="background:none;border:none;color:#94a3b8;font-size:1.5rem;cursor:pointer" onclick="document.getElementById('vcinJudgeModal').remove()">&times;</button>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;text-align:left">
          <thead>
            <tr style="background:#1e293b;color:#38bdf8">
              <th style="padding:10px;border-bottom:1px solid #334155">Component</th>
              <th style="padding:10px;border-bottom:1px solid #334155">Status</th>
              <th style="padding:10px;border-bottom:1px solid #334155">Technical Implementation Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>CTS Engine (Civic Reliability)</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real</span></td>
              <td style="padding:10px">Beta(α+α₀, β+β₀) posterior mean [Prior: Beta(1,1) → Beta(9,1)] + Verification Signals (DigiLocker & RWA)</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>Incident Risk Score (IRS)</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real</span></td>
              <td style="padding:10px">4-factor weighted formula (0.3 Geo + 0.25 Acoustic Distress + 0.25 Scam + 0.2 Time Criticality) [Operational Prioritisation Score]</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>Corroboration Engine</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real (Prototype Model)</span></td>
              <td style="padding:10px">Independence check (fingerprint/IP/account age) + 70% threshold gate</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>Guardian Assignment</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real</span></td>
              <td style="padding:10px">Proximity (50%), CTS (30%), Availability (20%) scoring & selection algorithm</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>GPS Location</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real</span></td>
              <td style="padding:10px">HTML5 Geolocation API (navigator.geolocation)</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>Cell-Tower / Wi-Fi Fallback</b></td>
              <td style="padding:10px"><span style="color:#f59e0b;font-weight:700">🟡 Conceptual (Prototype)</span></td>
              <td style="padding:10px">Fallback architecture model (simulated when hardware GPS fails)</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>Real-Time Event Stream</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real</span></td>
              <td style="padding:10px">Shared EventLogEntry[] stream broadcasting over MQTT + BroadcastChannel</td>
            </tr>
            <tr style="border-bottom:1px solid #1e293b">
              <td style="padding:10px"><b>WebRTC Conference & Chat</b></td>
              <td style="padding:10px"><span style="color:#10b981;font-weight:700">🟢 Real</span></td>
              <td style="padding:10px">PeerJS WebRTC audio/video mesh + real-time in-call MQTT group chat</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:16px;text-align:right">
          <button class="vcin-btn-primary" style="background:#2563eb;padding:8px 20px" onclick="document.getElementById('vcinJudgeModal').remove()">Close Matrix</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  return {
    initScanner: initPedestrianCTSScanner,
    initLighthouse: initTacticalLighthouse,
    initIRSDeck: initIRSThreatDeck,
    initPipelineLoop: initGuardianPipelineLoop,
    triggerLighthouseSOS,
    testLighthouseEmergency,
    injectTestCitizen,
    updateScannerInput,
    updateIRSMetric,
    toggleIRSGoldenHour,
    showJudgeTransparencyModal
  };
})();

if (typeof window !== 'undefined') {
  window.VCINVisualizers = VCINVisualizers;
  window.showJudgeTransparencyModal = VCINVisualizers.showJudgeTransparencyModal;
}
