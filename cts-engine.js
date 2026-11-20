// Suraksha CTS / IRS (Incident Risk Score) Engine Processing Module
// Real-time Mathematical Determination Pipeline & Visualizer for Operator Dashboard

const CTSEngine = (() => {
  // Default weighting coefficients
  const WEIGHTS = {
    w_geo: 0.30,     // Geolocation anomaly weight
    w_audio: 0.25,   // Audio decibel/stress weight
    w_scam: 0.25,    // Text entropy / fraud risk weight
    w_golden: 0.20   // Golden hour emergency weight
  };

  // State metrics log
  const metricHistory = [];
  let userOverride = null;

  function calculateRiskScore(telemetry) {
    const data = userOverride || telemetry || {};
    const geo = Math.min(100, Math.max(0, data.geoRisk !== undefined ? data.geoRisk : 20));
    const audio = Math.min(100, Math.max(0, data.audioStress !== undefined ? data.audioStress : 15));
    const scam = Math.min(100, Math.max(0, data.scamScore !== undefined ? data.scamScore : 10));
    const golden = data.isGoldenHour ? 100 : 0;

    const totalScore = (
      WEIGHTS.w_geo * geo +
      WEIGHTS.w_audio * audio +
      WEIGHTS.w_scam * scam +
      WEIGHTS.w_golden * golden
    );

    let threatLevel = 'NORMAL';
    let alertClass = 'level-normal';
    let actionRecommendation = 'Standard Telemetry Monitoring';

    if (totalScore >= 75) {
      threatLevel = 'CRITICAL (HIGH PRIORITY)';
      alertClass = 'level-critical';
      actionRecommendation = 'Immediate Operator Intercept & Dispatch 1930/112 Unit';
    } else if (totalScore >= 45) {
      threatLevel = 'ELEVATED RISK';
      alertClass = 'level-elevated';
      actionRecommendation = 'Notify Nearby Guardians & Prepare WebRTC Video Channel';
    }

    const timestamp = new Date().toLocaleTimeString();
    const result = {
      timestamp,
      raw: data,
      components: { geo, audio, scam, golden },
      weights: WEIGHTS,
      totalScore: totalScore.toFixed(1),
      threatLevel,
      alertClass,
      actionRecommendation
    };

    metricHistory.unshift(result);
    if (metricHistory.length > 20) metricHistory.pop();

    return result;
  }

  let activeContainerId = null;

  function renderVisualizer(containerId, latestResult) {
    const container = document.getElementById(containerId);
    if (!container) return;
    activeContainerId = containerId;

    if (!latestResult) {
      latestResult = calculateRiskScore({ geoRisk: 35, audioStress: 25, scamScore: 20, isGoldenHour: false });
    }

    const c = latestResult.components;
    const w = latestResult.weights;

    container.innerHTML = `
      <div class="cts-monitor-card">
        <div class="cts-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <span class="cts-badge" style="font-weight:700">⚙️ Incident Risk Score (IRS) Engine</span>
            <div style="font-size:0.72rem;color:#94a3b8;margin-top:2px">4-Factor Weighted Formula: Geo + Acoustic Distress + Scam + Time Criticality</div>
          </div>
          <span class="cts-time" style="font-size:0.75rem;color:#94a3b8">Updated ${latestResult.timestamp}</span>
        </div>

        <div class="cts-score-hero ${latestResult.alertClass}">
          <div class="score-number">${latestResult.totalScore}</div>
          <div class="score-details">
            <div class="score-title" style="font-size:1.1rem;font-weight:800">${latestResult.threatLevel}</div>
            <div class="score-action" style="font-size:0.85rem;margin-top:2px">👉 ${latestResult.actionRecommendation}</div>
          </div>
        </div>

        <div class="cts-formula-box" style="background:rgba(15,23,42,0.6);border:1px solid rgba(255,255,255,0.1);padding:10px 14px;border-radius:10px;margin:12px 0">
          <div class="formula-title" style="font-size:0.8rem;color:#94a3b8;font-weight:600">Mathematical Model Evaluation:</div>
          <div class="formula-expr" style="font-family:monospace;font-size:0.85rem;color:#38bdf8;margin:4px 0">
            S<sub>IRS</sub> = (${w.w_geo} × R<sub>geo</sub>) + (${w.w_audio} × R<sub>audio</sub>) + (${w.w_scam} × R<sub>scam</sub>) + (${w.w_golden} × R<sub>time</sub>)
          </div>
          <div class="formula-calc" style="font-size:0.85rem;color:#e2e8f0">
            S<sub>IRS</sub> = (${w.w_geo} × ${c.geo}) + (${w.w_audio} × ${c.audio}) + (${w.w_scam} × ${c.scam}) + (${w.w_golden} × ${c.golden}) = <b style="color:#f43f5e;font-size:1.05rem">${latestResult.totalScore}</b>
          </div>
          <div style="font-size:0.72rem;color:#94a3b8;background:rgba(15,23,42,0.8);border:1px solid rgba(56,189,248,0.2);padding:5px 8px;border-radius:6px;margin-top:8px">
            ℹ️ <strong>Disclaimer:</strong> IRS is an operational prioritisation score, not a probability of crime.
          </div>
        </div>

        <div class="cts-metrics-grid">
          <div class="metric-box">
            <div class="metric-label" style="display:flex;justify-content:space-between">
              <span>📍 Geo Anomaly (R<sub>geo</sub>)</span>
              <span>${c.geo}/100</span>
            </div>
            <input type="range" min="0" max="100" value="${c.geo}" class="vcin-slider" style="width:100%;accent-color:#38bdf8;cursor:pointer" oninput="CTSEngine.updateMetric('geoRisk', this.value)"/>
          </div>

          <div class="metric-box">
            <div class="metric-label" style="display:flex;justify-content:space-between">
              <span>🎤 Acoustic Distress Indicators (R<sub>audio</sub>)</span>
              <span>${c.audio}/100</span>
            </div>
            <input type="range" min="0" max="100" value="${c.audio}" class="vcin-slider" style="width:100%;accent-color:#a855f7;cursor:pointer" oninput="CTSEngine.updateMetric('audioStress', this.value)"/>
          </div>

          <div class="metric-box">
            <div class="metric-label" style="display:flex;justify-content:space-between">
              <span>🔍 Scam Entropy (R<sub>scam</sub>)</span>
              <span>${c.scam}/100</span>
            </div>
            <input type="range" min="0" max="100" value="${c.scam}" class="vcin-slider" style="width:100%;accent-color:#f59e0b;cursor:pointer" oninput="CTSEngine.updateMetric('scamScore', this.value)"/>
          </div>

          <div class="metric-box">
            <div class="metric-label" style="display:flex;justify-content:space-between">
              <span>⏱️ Time Criticality (R<sub>time</sub>)</span>
              <span>${c.golden ? '100 (ACTIVE)' : '0 (OFF)'}</span>
            </div>
            <button class="vcin-btn-secondary-sm" style="margin-top:4px;width:100%;padding:4px;font-size:0.75rem;background:rgba(99,102,241,0.2);border:1px solid rgba(99,102,241,0.5);color:#fff" onclick="CTSEngine.toggleGoldenHour()">
              ${c.golden ? '⏱️ Deactivate Time Criticality' : '⏱️ Trigger Time Criticality'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function updateMetric(key, val) {
    if (!userOverride) {
      const cur = metricHistory[0] ? metricHistory[0].components : { geo: 35, audio: 25, scam: 20, golden: 0 };
      userOverride = { geoRisk: cur.geo, audioStress: cur.audio, scamScore: cur.scam, isGoldenHour: cur.golden > 0 };
    }
    userOverride[key] = parseInt(val);
    const res = calculateRiskScore(userOverride);
    renderVisualizer(activeContainerId || 'ctsEngineContainer', res);
  }

  function toggleGoldenHour() {
    if (!userOverride) {
      const cur = metricHistory[0] ? metricHistory[0].components : { geo: 35, audio: 25, scam: 20, golden: 0 };
      userOverride = { geoRisk: cur.geo, audioStress: cur.audio, scamScore: cur.scam, isGoldenHour: cur.golden > 0 };
    }
    userOverride.isGoldenHour = !userOverride.isGoldenHour;
    const res = calculateRiskScore(userOverride);
    renderVisualizer(activeContainerId || 'ctsEngineContainer', res);
  }

  /* ── Live telemetry simulation ────────────────────────────────
     Streams randomized incident telemetry through the real IRS
     formula so judges can watch the engine compute continuously.
     Moving any slider pauses the simulation (manual mode). */
  let liveTimer = null;
  function startLive(containerId, intervalMs) {
    stopLive();
    userOverride = null; // live mode owns the inputs
    const tick = () => {
      renderVisualizer(activeContainerId || containerId || 'ctsEngineContainer', calculateRiskScore({
        geoRisk: Math.round(Math.random() * 100),
        audioStress: Math.round(10 + Math.random() * 90),
        scamScore: Math.round(Math.random() * 70),
        isGoldenHour: Math.random() > 0.72
      }));
    };
    tick();
    liveTimer = setInterval(tick, intervalMs || 3000);
  }
  function stopLive() {
    if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  }

  return {
    evaluate: calculateRiskScore,
    render: renderVisualizer,
    updateMetric: updateMetric,
    toggleGoldenHour: toggleGoldenHour,
    startLive: startLive,
    stopLive: stopLive,
    getHistory: () => metricHistory
  };
})();
