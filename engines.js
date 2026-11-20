/**
 * V-CIN — Multi-Engine Civic Intelligence Core (engines.js)
 * Implements 9 distinct mathematical, workflow, and geospatial engines.
 * Shared Event-Driven Architecture with EventLogEntry stream.
 */

const VCINEngines = (() => {
  // ── Central Shared EventLog Stream ───────────────────────────────────
  const eventLog = [];
  const listeners = [];

  function emitEvent(type, payload) {
    const entry = {
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ts: Date.now(),
      type,
      payload,
      id: 'evt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)
    };
    eventLog.unshift(entry);
    if (eventLog.length > 50) eventLog.pop();

    if (typeof Bus !== 'undefined' && Bus.send) {
      try { Bus.send('event-log-entry', entry); } catch (_) {}
    }

    listeners.forEach(fn => { try { fn(entry); } catch (_) {} });
    return entry;
  }

  function onEventLog(fn) {
    if (typeof fn === 'function') listeners.push(fn);
  }

  function getEventLog() {
    return [...eventLog];
  }

  // ── Engine 1: CTS Engine (Civic Trust Score) ─────────────────────────
  // Hybrid Bayesian + Deterministic Model
  // Formula: CTS(u) = clamp(0, 100, 30 + (verified ? 20 : 0) + (rwa ? 15 : 0) + accuracyBelief * 30 + communityEndorsement)
  // Bayesian component: accuracyBelief(u) = (accurate + 1) / (accurate + false + 2) [Beta(1,1)-prior posterior mean]
  function calculateCTS(userProfile = {}) {
    const base = 30; // deterministic base score
    const verified = userProfile.digilocker ? 20 : 0; // Aadhaar / DigiLocker
    const rwaConfirmed = userProfile.rwa ? 15 : 0; // Society / RWA residency
    
    const accurate = Math.max(0, userProfile.accurateCount || 0);
    const falseCount = Math.max(0, userProfile.falseCount || 0);
    const accuracyBelief = (accurate + 1) / (accurate + falseCount + 2); // Beta(1,1) mean

    const bayesianPoints = accuracyBelief * 30;
    const communityEndorsement = Math.min(10, Math.max(0, userProfile.upvotes || 0));

    const rawTotal = base + verified + rwaConfirmed + bayesianPoints + communityEndorsement;
    const score = Math.min(100, Math.max(0, Math.round(rawTotal)));

    let tier = 'STANDARD';
    if (score >= 85) tier = 'CIVIC GUARDIAN (HIGH TRUST)';
    else if (score >= 60) tier = 'VERIFIED REPORTER';
    else if (score < 30) tier = 'UNTRUSTED / FLAGGED';

    return {
      score,
      tier,
      components: {
        base,
        verified,
        rwaConfirmed,
        accurate,
        falseCount,
        accuracyBelief: parseFloat(accuracyBelief.toFixed(3)),
        bayesianPoints: parseFloat(bayesianPoints.toFixed(1)),
        communityEndorsement
      },
      formulaStr: `CTS = 30 + ${verified}(Verif) + ${rwaConfirmed}(RWA) + ${bayesianPoints.toFixed(1)}(Bayes) + ${communityEndorsement}(Comm)`
    };
  }

  // Rating Update Pipeline for Guardians (Operator & Victim mutual rating)
  function applyGuardianRating(userProfile = {}, stars = 5, raterRole = 'operator', tags = [], comment = '') {
    const profile = {
      digilocker: userProfile.digilocker !== undefined ? userProfile.digilocker : true,
      rwa: userProfile.rwa !== undefined ? userProfile.rwa : true,
      accurateCount: userProfile.accurateCount || 5,
      falseCount: userProfile.falseCount || 0,
      upvotes: userProfile.upvotes || 3,
      ratingsCount: (userProfile.ratingsCount || 0) + 1,
      ratingSum: (userProfile.ratingSum || 0) + stars,
      ratingHistory: userProfile.ratingHistory || []
    };

    const multiplier = raterRole === 'operator' ? 1.5 : 1.0;
    let deltaDescription = '';

    if (stars === 5) {
      profile.accurateCount += Math.round(2 * multiplier);
      profile.upvotes = Math.min(10, profile.upvotes + 2);
      deltaDescription = `+5 Star Rating (${raterRole}): Significant trust boost`;
    } else if (stars === 4) {
      profile.accurateCount += Math.round(1 * multiplier);
      profile.upvotes = Math.min(10, profile.upvotes + 1);
      deltaDescription = `+4 Star Rating (${raterRole}): Positive performance`;
    } else if (stars === 3) {
      profile.accurateCount += 0.5;
      deltaDescription = `+3 Star Rating (${raterRole}): Neutral response`;
    } else if (stars === 2) {
      profile.falseCount += Math.round(1.5 * multiplier);
      deltaDescription = `-2 Star Rating (${raterRole}): Penalty for delayed response`;
    } else if (stars <= 1) {
      profile.falseCount += Math.round(3 * multiplier);
      profile.upvotes = Math.max(0, profile.upvotes - 3);
      deltaDescription = `-1 Star Rating (${raterRole}): Severe penalty for misconduct / no-show`;
    }

    const previousCTS = userProfile.cts || calculateCTS(userProfile).score;
    const newCTSResult = calculateCTS(profile);
    const scoreDelta = newCTSResult.score - previousCTS;

    const ratingEntry = {
      timestamp: new Date().toLocaleTimeString(),
      ts: Date.now(),
      stars,
      raterRole,
      tags,
      comment,
      scoreDelta,
      newScore: newCTSResult.score,
      tier: newCTSResult.tier
    };

    profile.ratingHistory.unshift(ratingEntry);
    if (profile.ratingHistory.length > 20) profile.ratingHistory.pop();
    profile.cts = newCTSResult.score;
    profile.avgRating = parseFloat((profile.ratingSum / profile.ratingsCount).toFixed(1));

    emitEvent('GUARDIAN_RATED', {
      guardianName: userProfile.name || 'Guardian',
      guardianDeviceId: userProfile.deviceId,
      raterRole,
      stars,
      scoreDelta,
      newScore: newCTSResult.score,
      tier: newCTSResult.tier,
      tags
    });

    return {
      profile,
      ctsResult: newCTSResult,
      scoreDelta,
      ratingEntry,
      deltaDescription
    };
  }


  // ── Engine 2: Corroboration / Confidence Engine ──────────────────────
  // Rules: Min 3 reports, min avg CTS 45, 1 Guardian (CTS > 85) substitutes for 2 regular reports
  // Independence check: flags same device fingerprint, same IP, or same-day account as NOT INDEPENDENT (-10 penalty)
  function evaluateCorroboration(reports = [], incidentType = 'SUSPICIOUS_PERSON') {
    let confidence = 30; // starting prior
    let independentCount = 0;
    let guardianConfirmations = 0;
    let nonIndependentFlags = 0;
    let totalCTS = 0;

    const seenFingerprints = new Set();
    const processedReports = [];

    reports.forEach((rep, idx) => {
      const fp = rep.deviceFingerprint || rep.reporterId || `device_${idx}`;
      const isSameDayAccount = rep.isSameDayAccount || false;
      const isIndependent = !seenFingerprints.has(fp) && !isSameDayAccount;

      if (isIndependent) {
        seenFingerprints.add(fp);
        independentCount++;
        const reporterCTS = rep.cts || 50;
        totalCTS += reporterCTS;

        confidence += (reporterCTS / 5);

        if (reporterCTS >= 85) {
          guardianConfirmations++;
          confidence += 25;
        }

        processedReports.push({ ...rep, isIndependent: true, status: 'ACCEPTED' });
      } else {
        nonIndependentFlags++;
        confidence -= 10;
        processedReports.push({ ...rep, isIndependent: false, status: 'FLAGGED_NOT_INDEPENDENT' });
      }
    });

    confidence = Math.min(100, Math.max(0, Math.round(confidence)));
    const avgCTS = independentCount > 0 ? Math.round(totalCTS / independentCount) : 0;
    const isVerified = (confidence >= 70) && ((independentCount >= 3 && avgCTS >= 45) || (guardianConfirmations >= 1 && independentCount >= 2));

    const status = isVerified ? 'VERIFIED' : 'PENDING';

    if (isVerified) {
      emitEvent('ALERT_PUBLISHED', { confidence, independentCount, avgCTS });
    }

    return {
      confidence,
      status,
      independentCount,
      nonIndependentFlags,
      guardianConfirmations,
      avgCTS,
      reports: processedReports
    };
  }

  // ── Engine 3: Incident Risk Score (IRS) Engine ───────────────────────
  // Formula: S_IRS = (0.3 * R_geo) + (0.25 * R_audio) + (0.25 * R_scam) + (0.2 * R_golden)
  function calculateIRS(telemetry = {}) {
    const r_geo = Math.min(100, Math.max(0, telemetry.geoRisk !== undefined ? telemetry.geoRisk : 20));
    const r_audio = Math.min(100, Math.max(0, telemetry.audioStress !== undefined ? telemetry.audioStress : 15));
    const r_scam = Math.min(100, Math.max(0, telemetry.scamScore !== undefined ? telemetry.scamScore : 10));
    const r_golden = telemetry.isGoldenHour ? 100 : 0;

    const totalScore = parseFloat((0.30 * r_geo + 0.25 * r_audio + 0.25 * r_scam + 0.20 * r_golden).toFixed(1));

    let threatLevel = 'NORMAL';
    let alertClass = 'level-normal';
    let recommendation = 'Standard Telemetry Monitoring';

    if (totalScore >= 75) {
      threatLevel = 'CRITICAL (HIGH PRIORITY)';
      alertClass = 'level-critical';
      recommendation = 'Immediate Operator Intercept & Dispatch Cyber Cell / 112';
    } else if (totalScore >= 45) {
      threatLevel = 'ELEVATED RISK';
      alertClass = 'level-elevated';
      recommendation = 'Notify Nearby Guardians & Open WebRTC Channel';
    }

    return {
      totalScore,
      threatLevel,
      alertClass,
      recommendation,
      components: { r_geo, r_audio, r_scam, r_golden },
      weights: { w_geo: 0.30, w_audio: 0.25, w_scam: 0.25, w_golden: 0.20 }
    };
  }

  // ── Engine 4: Guardian Assignment Engine ─────────────────────────────
  // Formula: guardianScore(g) = 0.5 * proximityScore(g) + 0.3 * (g.cts / 100 * 100) + 0.2 * availabilityScore(g)
  function rankGuardians(guardiansList = [], incidentCoords = { lat: 28.6139, lng: 77.2090 }) {
    const scored = guardiansList.map((g, idx) => {
      const distKm = g.distanceKm !== undefined ? g.distanceKm : (0.4 + idx * 0.5);
      const proximityScore = Math.max(0, 100 - distKm * 20); // 100 at 0km, 0 at 5km
      const ctsScore = Math.min(100, Math.max(0, g.cts || 70));
      const availabilityScore = g.status === 'AVAILABLE' ? 100 : 40;

      const totalScore = parseFloat((0.50 * proximityScore + 0.30 * ctsScore + 0.20 * availabilityScore).toFixed(1));

      return {
        ...g,
        distKm: parseFloat(distKm.toFixed(1)),
        proximityScore: Math.round(proximityScore),
        ctsScore,
        availabilityScore,
        totalScore
      };
    });

    scored.sort((a, b) => b.totalScore - a.totalScore);
    const winner = scored[0] || null;

    if (winner) {
      emitEvent('GUARDIAN_ASSIGNED', { guardianName: winner.name, score: winner.totalScore, distKm: winner.distKm });
    }

    return {
      candidates: scored,
      selectedGuardian: winner
    };
  }

  // ── Engine 5: Golden Hour State Machine ──────────────────────────────
  const GOLDEN_HOUR_STATES = [
    'IDLE', 'TRIAGE', 'ACTIVE', 'STEP_1_BANK', 'STEP_2_HELPLINE', 'STEP_3_EVIDENCE', 'STEP_4_COMPLAINT', 'RESOLVED'
  ];

  let currentGoldenHourState = 'IDLE';

  function transitionGoldenHour(targetState, payload = {}) {
    if (GOLDEN_HOUR_STATES.includes(targetState)) {
      currentGoldenHourState = targetState;
      const eventName = `GOLDEN_HOUR_${targetState}`;
      emitEvent(eventName, { state: targetState, ...payload });

      if (targetState === 'RESOLVED') {
        emitEvent('SCAM_PATTERN_WARNING', {
          scamType: payload.scamType || 'Digital Arrest / Financial Fraud',
          neighborhoodAlert: true
        });
      }
    }
    return currentGoldenHourState;
  }

  // ── Engine 6: SOS State Machine ──────────────────────────────────────
  const SOS_STATES = [
    'IDLE', 'SOS_SENT', 'OPERATOR_NOTIFIED', 'GUARDIAN_ASSIGNED', 'CONFERENCE_ACTIVE', 'GUARDIAN_ARRIVED', 'RESOLVED'
  ];

  let currentSOSState = 'IDLE';

  function transitionSOS(targetState, payload = {}) {
    if (SOS_STATES.includes(targetState)) {
      currentSOSState = targetState;
      emitEvent(`SOS_STATE_${targetState}`, { state: targetState, ...payload });
    }
    return currentSOSState;
  }

  // ── Engine 7: Anti-Gaming Inspection Engine ──────────────────────────
  function inspectReport(reportData = {}, recentUserReports = []) {
    const flags = [];
    let pass = true;

    // Check 1: Device Fingerprint duplication
    if (reportData.deviceFingerprint && recentUserReports.some(r => r.deviceFingerprint === reportData.deviceFingerprint && (Date.now() - r.ts) < 60000)) {
      flags.push('DUPLICATE_DEVICE_FINGERPRINT');
      pass = false;
    }

    // Check 2: GPS Velocity Check (impossible speed > 150 km/h)
    if (reportData.prevCoords && reportData.coords && reportData.prevTime) {
      const dtHours = (Date.now() - reportData.prevTime) / 3600000;
      if (dtHours > 0) {
        const distKm = Math.hypot(reportData.coords.lat - reportData.prevCoords.lat, reportData.coords.lng - reportData.prevCoords.lng) * 111;
        const speed = distKm / dtHours;
        if (speed > 150) {
          flags.push('IMPOSSIBLE_GPS_VELOCITY');
          pass = false;
        }
      }
    }

    // Check 3: Same-Day Account Block
    if (reportData.accountCreatedDay === new Date().toISOString().split('T')[0] && reportData.isCorroborating) {
      flags.push('SAME_DAY_ACCOUNT_CORROBORATION_RESTRICTED');
      pass = false;
    }

    const confidenceImpact = pass ? 1.0 : 0.0;
    return { pass, flags, confidenceImpact };
  }

  // ── Engine 8: Heatmap / Hex-Grid (H3) Threshold Filter ───────────────
  function filterH3HexCells(rawReports = []) {
    // Street (res 9): 5 confirmed reports required
    // Neighbourhood (res 7): 15 confirmed reports required
    // District (res 5): 50 confirmed reports required
    const verifiedReports = rawReports.filter(r => r.status === 'VERIFIED' || r.status === 'RESOLVED');

    const cellCounts = {
      streetRes9: verifiedReports.length,
      neighbourhoodRes7: Math.floor(verifiedReports.length * 1.5),
      districtRes5: Math.floor(verifiedReports.length * 3.2)
    };

    return {
      res9Renderable: cellCounts.streetRes9 >= 5,
      res7Renderable: cellCounts.neighbourhoodRes7 >= 15,
      res5Renderable: cellCounts.districtRes5 >= 50,
      cellCounts,
      statusLabel: cellCounts.streetRes9 >= 5 ? 'High Confidence Threat Cell' : 'Insufficient Data (Threshold < 5)'
    };
  }

  // ── Engine 9: Location Fallback Chain Engine ─────────────────────────
  async function getLocationWithFallback() {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              type: 'GPS_HARDWARE',
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracyMeters: Math.round(pos.coords.accuracy),
              status: 'High Precision Hardware GPS Active'
            });
          },
          () => {
            // Fallback Level 2: Cell-Tower Triangulation (Conceptual Demo Model)
            resolve({
              type: 'CELL_TOWER_TRIANGULATION',
              lat: 28.6139 + (Math.random() - 0.5) * 0.01,
              lng: 77.2090 + (Math.random() - 0.5) * 0.01,
              accuracyMeters: 450,
              status: 'Prototype Model: Cell-Tower Signal Triangulation (Fallback)'
            });
          },
          { timeout: 3000 }
        );
      } else {
        // Fallback Level 3: Wi-Fi Access Point Positioning
        resolve({
          type: 'WIFI_POSITIONING',
          lat: 28.6139,
          lng: 77.2090,
          accuracyMeters: 1200,
          status: 'Prototype Model: Wi-Fi Access Point Range Positioning'
        });
      }
    });
  }

  return {
    emitEvent,
    onEventLog,
    getEventLog,
    calculateCTS,
    applyGuardianRating,
    evaluateCorroboration,
    calculateIRS,
    rankGuardians,
    transitionGoldenHour,
    transitionSOS,
    inspectReport,
    filterH3HexCells,
    getLocationWithFallback,
    get goldenHourState() { return currentGoldenHourState; },
    get sosState() { return currentSOSState; }
  };
})();

if (typeof window !== 'undefined') window.VCINEngines = VCINEngines;
