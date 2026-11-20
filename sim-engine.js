/**
 * V-CIN Suraksha - Live Drill Simulation Engine (sim-engine.js)
 * Provides a fully automated, semi-simulated tactical drill.
 */
'use strict';

const VCINSimEngine = (() => {
  const CFG = {
    tickIntervalMs : 8000,
    guardianMoveMs : 2500,
    autoResolveMs  : 35000,
    maxConcurrent  : 6,
    guardianPool   : 5,
  };

  const CITIES = [
    { name: 'Connaught Place, Delhi',   lat: 28.6315, lng: 77.2167 },
    { name: 'Bandra, Mumbai',           lat: 19.0543, lng: 72.8418 },
    { name: 'Koramangala, Bengaluru',   lat: 12.9352, lng: 77.6244 },
    { name: 'Sector 17, Chandigarh',    lat: 30.7393, lng: 76.7851 },
    { name: 'Salt Lake, Kolkata',       lat: 22.5825, lng: 88.4129 },
    { name: 'Banjara Hills, Hyderabad', lat: 17.4156, lng: 78.4347 },
    { name: 'C-Scheme, Jaipur',         lat: 26.9075, lng: 75.8208 },
    { name: 'Aundh, Pune',              lat: 18.5679, lng: 73.8143 },
    { name: 'Navrangpura, Ahmedabad',   lat: 23.0395, lng: 72.5637 },
    { name: 'Anna Nagar, Chennai',      lat: 13.0839, lng: 80.2102 },
    { name: 'Indira Nagar, Lucknow',    lat: 26.8721, lng: 80.9954 },
    { name: 'Arera Colony, Bhopal',     lat: 23.2017, lng: 77.4440 },
  ];

  const INCIDENT_TYPES = [
    { label: 'Cyber Stalking',       icon: '🚨', irsBase: 82 },
    { label: 'UPI / Bank Fraud',     icon: '💸', irsBase: 91 },
    { label: 'Online Harassment',    icon: '⚠️', irsBase: 76 },
    { label: 'Investment Scam',      icon: '📉', irsBase: 85 },
    { label: 'Digital Arrest Scam',  icon: '🚔', irsBase: 94 },
    { label: 'Physical Threat SOS',  icon: '🆘', irsBase: 97 },
    { label: 'Sextortion / CSAM',    icon: '🔒', irsBase: 88 },
    { label: 'Phishing Attack',      icon: '🎣', irsBase: 72 },
  ];

  const VICTIM_NAMES = [
    'Priya Sharma','Ananya Gupta','Sunita Devi','Meera Nair',
    'Ravi Kumar','Vikram Mehta','Arun Patel','Rohit Singh',
    'Leela Iyer','Vandana Bose','Nikhil Joshi','Pooja Reddy',
  ];

  const GUARDIAN_NAMES = [
    'Capt. Vikram Rao','Officer Ananya Sen',
    'Guardian Sunita Devi','Volunteer Rajesh Kumar',
    'Ex-DSP Arvind Nair',
  ];

  let simRunning    = false;
  let tickTimer     = null;
  let guardianTimer = null;
  let simGuardians  = [];
  let simIncidents  = [];
  let totalInjected = 0;
  let totalResolved = 0;
  const pendingTimeouts = new Set(); // tracked so STOP also cancels pending dispatch/resolve timers

  function simTimeout(fn, ms) {
    const t = setTimeout(() => {
      pendingTimeouts.delete(t);
      fn();
    }, ms);
    pendingTimeouts.add(t);
    return t;
  }

  function clearPendingTimeouts() {
    pendingTimeouts.forEach(t => clearTimeout(t));
    pendingTimeouts.clear();
  }


  function randCity()  { return CITIES[Math.floor(Math.random() * CITIES.length)]; }
  function randType()  { return INCIDENT_TYPES[Math.floor(Math.random() * INCIDENT_TYPES.length)]; }
  function randName()  { return VICTIM_NAMES[Math.floor(Math.random() * VICTIM_NAMES.length)]; }
  function jitter(v,d=0.08){ return v + (Math.random()-0.5)*d; }
  function uid()       { return 'sim_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,6); }
  function fakeHash()  { return Array.from({length:20},()=>Math.floor(Math.random()*16).toString(16)).join('')+'...'; }

  function computeIRS(type) {
    const geoRisk    = Math.min(100, type.irsBase + Math.floor((Math.random()-0.5)*20));
    const audioStress= Math.min(100, 55 + Math.floor(Math.random()*40));
    const scamScore  = Math.min(100, 40 + Math.floor(Math.random()*50));
    const isGolden   = Math.random() > 0.5;
    let irs, threat;
    if (typeof VCINEngines !== 'undefined' && VCINEngines.calculateIRS) {
      const r = VCINEngines.calculateIRS({ geoRisk, audioStress, scamScore, isGoldenHour: isGolden });
      irs = r.totalScore; threat = r.threatLevel;
    } else {
      irs = parseFloat((0.30*geoRisk + 0.25*audioStress + 0.25*scamScore + 0.20*(isGolden?100:0)).toFixed(1));
      threat = irs >= 75 ? 'CRITICAL' : irs >= 45 ? 'ELEVATED' : 'NORMAL';
    }
    return { irs, threat, geoRisk, audioStress, scamScore, isGolden };
  }

  function computeCTS(profile) {
    if (typeof VCINEngines !== 'undefined' && VCINEngines.calculateCTS) return VCINEngines.calculateCTS(profile).score;
    const belief = (profile.accurateCount+1)/(profile.accurateCount+profile.falseCount+2);
    return Math.min(100, Math.max(0, Math.round(30+(profile.digilocker?20:0)+(profile.rwa?15:0)+belief*30+Math.min(10,profile.upvotes))));
  }

  function seedGuardians() {
    simGuardians = [];
    for (let i = 0; i < CFG.guardianPool; i++) {
      const city = CITIES[i % CITIES.length];
      const dId  = 'sim_guard_' + i;
      const profile = {
        deviceId:dId, name:GUARDIAN_NAMES[i%GUARDIAN_NAMES.length],
        lat:jitter(city.lat,0.1), lng:jitter(city.lng,0.1),
        targetLat:jitter(city.lat,0.1), targetLng:jitter(city.lng,0.1),
        digilocker:true, rwa:i%2===0,
        accurateCount:5+Math.floor(Math.random()*8),
        falseCount:Math.floor(Math.random()*2),
        upvotes:3+Math.floor(Math.random()*6),
        ratingsCount:2+Math.floor(Math.random()*6), ratingSum:0,
        ratingHistory:[], status:'AVAILABLE',
      };
      profile.cts = computeCTS(profile);
      profile.ratingSum = profile.ratingsCount * 4;
      simGuardians.push(profile);
      if (typeof guardiansFleet !== 'undefined') guardiansFleet[dId] = {...profile};
      if (typeof guardians !== 'undefined') guardians[dId] = {name:profile.name,lat:profile.lat,lng:profile.lng};
      if (typeof updateMarker === 'function') updateMarker('guardian',dId,profile.lat,profile.lng,'🛡️ '+profile.name,'#10b981');
      if (typeof roomMembers !== 'undefined') roomMembers[dId] = {name:profile.name,role:'guardian'};
      logSim('FLEET', profile.name+' online · CTS '+profile.cts+' · '+city.name, '#10b981');
    }
    if (typeof renderGuardianFleet === 'function') renderGuardianFleet();
    if (typeof updateMembersList   === 'function') updateMembersList();
    updateSimHUD();
  }

  function stepGuardians() {
    simGuardians.forEach(g => {
      const speed = 0.0008+Math.random()*0.0005;
      const dLat  = g.targetLat-g.lat;
      const dLng  = g.targetLng-g.lng;
      const dist  = Math.sqrt(dLat*dLat+dLng*dLng);
      if (dist > 0.002) {
        g.lat += (dLat/dist)*speed;
        g.lng += (dLng/dist)*speed;
      } else {
        g.targetLat = jitter(g.lat,0.06);
        g.targetLng = jitter(g.lng,0.06);
      }
      if (typeof updateMarker === 'function') updateMarker('guardian',g.deviceId,g.lat,g.lng,'🛡️ '+g.name,'#10b981');
      if (typeof guardiansFleet !== 'undefined' && guardiansFleet[g.deviceId]) {
        guardiansFleet[g.deviceId].lat = g.lat;
        guardiansFleet[g.deviceId].lng = g.lng;
      }
      if (typeof guardians !== 'undefined' && guardians[g.deviceId]) {
        guardians[g.deviceId].lat = g.lat;
        guardians[g.deviceId].lng = g.lng;
      }
    });
  }

  function injectIncident() {
    if (simIncidents.length >= CFG.maxConcurrent) return;
    const city   = randCity();
    const type   = randType();
    const victim = randName();
    const irsData= computeIRS(type);
    const incId  = uid();
    const hash   = fakeHash();
    const lat    = jitter(city.lat, 0.05);
    const lng    = jitter(city.lng, 0.05);
    totalInjected++;
    simIncidents.push(incId);
    if (typeof incidents !== 'undefined') incidents[incId] = {from:victim,lat,lng,ts:Date.now(),irs:irsData.irs,type:type.label};
    if (typeof activeSosTs !== 'undefined') activeSosTs[incId] = Date.now();
    if (typeof stats !== 'undefined') {
      stats.activeSOS = Math.min(stats.activeSOS+1, CFG.maxConcurrent);
      if (irsData.isGolden) stats.goldenHours++;
      if (typeof updateStats === 'function') updateStats();
    }
    if (typeof addDynamicIncidentToHexMap === 'function') {
      addDynamicIncidentToHexMap(lat,lng,type.icon+' '+type.label,'IRS '+irsData.irs+' from '+victim,irsData.irs/100);
    }
    if (typeof opMap !== 'undefined' && opMap) {
      try {
        const pulse = L.circleMarker([lat,lng],{radius:16,fillColor:'#ef4444',color:'#fff',weight:2,fillOpacity:0.9})
          .addTo(opMap).bindPopup('🚨 '+victim+' · IRS '+irsData.irs);
        simTimeout(()=>{try{opMap.removeLayer(pulse);}catch(_){}}, CFG.autoResolveMs);
      } catch(_){}
    }
    buildSimSosCard({incidentId:incId,from:victim,lat,lng,locality:city.name,audioHash:hash,irs:irsData.irs,type:type.label,icon:type.icon,threat:irsData.threat});
    simTimeout(()=>autoDispatchGuardian(incId,victim,lat,lng,type), 2500);
    simTimeout(()=>resolveIncident(incId,victim), CFG.autoResolveMs);
    logSim('SOS',type.icon+' '+victim+' · '+city.name+' · IRS '+irsData.irs+' · '+irsData.threat,'#ef4444');
  }

  function buildSimSosCard({incidentId,from,lat,lng,locality,audioHash,irs,type,icon,threat}) {
    const alertsEl = document.getElementById('alerts');
    if (!alertsEl) return;
    const empty = alertsEl.querySelector('.vcin-empty-state');
    if (empty) empty.remove();
    const card = document.createElement('div');
    card.id = 'sos-card-'+incidentId;
    card.className = 'vcin-op-card vcin-op-card-danger vcin-alert-pulse';
    const irsColor = irs >= 75 ? '#ef4444' : irs >= 45 ? '#f97316' : '#22c55e';
    const time = new Date().toLocaleTimeString();
    card.innerHTML = `
      <div class="vcin-op-card-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <span class="vcin-badge vcin-badge-danger">🚨 LIVE SOS</span>
        <span style="display:flex;align-items:center;gap:8px">
          <span style="font-family:monospace;font-size:0.72rem;background:rgba(239,68,68,0.15);color:${irsColor};border:1px solid ${irsColor};padding:2px 7px;border-radius:4px;font-weight:700">IRS ${irs}</span>
          <span class="vcin-muted" style="font-size:0.78rem">${time}</span>
        </span>
      </div>
      <div class="vcin-op-card-name" style="font-size:1rem;font-weight:700;margin-bottom:4px">👤 ${from}</div>
      <div class="vcin-op-card-meta" style="margin-bottom:4px">📍 ${locality}</div>
      <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:6px">${icon} ${type} · Threat: <strong style="color:${irsColor}">${threat}</strong></div>
      <div class="vcin-op-card-hash" style="font-size:0.72rem;margin-bottom:10px">🔒 SHA-256: <code style="color:#94a3b8">${audioHash}</code></div>
      <div class="vcin-op-card-actions" style="display:flex;gap:6px;flex-wrap:wrap">
        <button class="vcin-btn-primary" onclick="simAck('${incidentId}')">✅ Acknowledge</button>
        <button class="vcin-btn-secondary" id="sim-assign-${incidentId}" disabled>⏳ Dispatching Guardian...</button>
        <button class="vcin-btn-info" onclick="if(typeof startConference==='function')startConference('${incidentId}','')">📞 Conference</button>
      </div>
      <div id="sim-ack-${incidentId}" style="display:none;margin-top:8px;color:#22c55e;font-size:0.82rem;font-weight:600"></div>`;
    alertsEl.insertBefore(card, alertsEl.firstChild);
    if (typeof incCount === 'function') incCount('sosCount','sosFeed');
  }

  window.simAck = function(incidentId) {
    const banner = document.getElementById('sim-ack-'+incidentId);
    if (banner) { banner.textContent = 'Acknowledged by Operator at '+new Date().toLocaleTimeString(); banner.style.display = 'block'; }
    const card = document.getElementById('sos-card-'+incidentId);
    if (card) { card.style.animation='none'; card.classList.remove('vcin-op-card-danger'); card.classList.add('vcin-op-card-ack'); }
    if (typeof stats !== 'undefined') { stats.activeSOS = Math.max(0,stats.activeSOS-1); if(typeof updateStats==='function') updateStats(); }
    logSim('ACK','Incident '+incidentId.slice(-6).toUpperCase()+' acknowledged','#22c55e');
    updateSimHUD();
  };

  function autoDispatchGuardian(incId, victimName, victimLat, victimLng, type) {
    if (simGuardians.length === 0) return;
    let sel;
    if (typeof VCINEngines !== 'undefined' && VCINEngines.rankGuardians) {
      const cands = simGuardians.map(g=>({...g,distanceKm:Math.sqrt((g.lat-victimLat)**2+(g.lng-victimLng)**2)*111,status:'AVAILABLE'}));
      const res = VCINEngines.rankGuardians(cands,{lat:victimLat,lng:victimLng});
      sel = simGuardians.find(g=>g.deviceId===res.selectedGuardian?.deviceId) || simGuardians[0];
    } else {
      sel = [...simGuardians].sort((a,b)=>b.cts-a.cts)[0];
    }
    sel.targetLat = victimLat;
    sel.targetLng = victimLng;
    const distKm = (Math.sqrt((sel.lat-victimLat)**2+(sel.lng-victimLng)**2)*111).toFixed(1);
    const etaMin = (distKm/40*60).toFixed(0);
    const btn = document.getElementById('sim-assign-'+incId);
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🛡️ '+sel.name+' · ETA '+etaMin+'m';
      btn.style.color = '#10b981';
      btn.style.borderColor = 'rgba(16,185,129,0.5)';
    }
    if (typeof drawTriangle === 'function') { try { drawTriangle([victimLat,victimLng],[sel.lat,sel.lng]); } catch(_){} }
    if (typeof updateMarker === 'function') updateMarker('guardian',sel.deviceId,sel.lat,sel.lng,'🛡️ '+sel.name+' (En Route)','#f59e0b');
    logSim('DISPATCH',sel.name+' → '+victimName+' · CTS '+sel.cts+' · ETA '+etaMin+'m · '+distKm+'km','#f59e0b');
    if (typeof showOperatorToast === 'function') showOperatorToast('🛡️ '+sel.name+' dispatched → '+victimName+' (ETA '+etaMin+' min)','info');
  }

  function resolveIncident(incId, victimName) {
    simIncidents = simIncidents.filter(id=>id!==incId);
    totalResolved++;
    const card = document.getElementById('sos-card-'+incId);
    if (card) {
      card.style.animation='none';
      card.classList.remove('vcin-op-card-danger','vcin-alert-pulse');
      card.classList.add('vcin-op-card-ack');
      card.style.opacity='0.65';
      card.style.borderColor='rgba(34,197,94,0.4)';
      const b = document.getElementById('sim-ack-'+incId);
      if (b) { b.textContent='RESOLVED · Case closed at '+new Date().toLocaleTimeString(); b.style.display='block'; }
    }
    if (typeof stats !== 'undefined') { stats.activeSOS = Math.max(0,stats.activeSOS-1); if(typeof updateStats==='function') updateStats(); }
    const g = simGuardians[Math.floor(Math.random()*simGuardians.length)];
    if (g && typeof VCINEngines !== 'undefined' && VCINEngines.applyGuardianRating) {
      const stars = 4+Math.round(Math.random());
      const result = VCINEngines.applyGuardianRating(g,stars,'operator',['Arrived Quickly'],'Auto-drill: '+victimName);
      g.cts = result.profile.cts;
      g.accurateCount = result.profile.accurateCount;
      g.upvotes = result.profile.upvotes;
      g.ratingHistory = result.profile.ratingHistory;
      if (typeof guardiansFleet !== 'undefined' && guardiansFleet[g.deviceId]) Object.assign(guardiansFleet[g.deviceId],g);
      logSim('CTS_UPD',g.name+' · '+(result.scoreDelta>=0?'+':'')+result.scoreDelta+' CTS → '+g.cts+' ('+result.ctsResult.tier+')','#a855f7');
      if (typeof renderGuardianFleet === 'function') renderGuardianFleet();
    }
    logSim('RESOLVE','Case '+incId.slice(-6).toUpperCase()+' closed · '+victimName+' safe','#22c55e');
    if (typeof showOperatorToast === 'function') showOperatorToast('Case Resolved: '+victimName+' is safe.','success');
    updateSimHUD();
  }

  function logSim(tag, msg, color='#34d399') {
    if (typeof pushCyberLog === 'function') pushCyberLog('[SIM·'+tag+']',msg,color);
    else console.log('[SIM·'+tag+']',msg);
  }

  function updateSimHUD() {
    const el = document.getElementById('vcin-sim-stats');
    if (!el) return;
    el.innerHTML =
      '<span style="color:#ef4444">🚨 '+simIncidents.length+' Live</span>' +
      '<span style="color:#22c55e">✅ '+totalResolved+' Resolved</span>' +
      '<span style="color:#f59e0b">🛡️ '+simGuardians.length+' Guardians</span>' +
      '<span style="color:#94a3b8">📡 '+totalInjected+' Total</span>';
  }

  function mountDrillButton() {
    if (document.getElementById('vcin-sim-hud')) return;
    const hud = document.createElement('div');
    hud.id = 'vcin-sim-hud';
    hud.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:linear-gradient(135deg,#0f172a,#1e293b);border:2px solid rgba(99,102,241,0.6);border-radius:14px;padding:14px 18px;box-shadow:0 8px 32px rgba(0,0,0,0.6);font-family:"JetBrains Mono",monospace;min-width:240px;max-width:calc(100vw - 32px);';
    hud.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px">
        <div style="font-size:0.68rem;color:#6366f1;font-weight:700;letter-spacing:2px;text-transform:uppercase">
          ⚡ V-CIN Live Drill Engine
        </div>
        <button id="vcin-sim-minimize" title="Minimize / Restore drill HUD" aria-label="Minimize or restore the Live Drill Engine panel"
          style="background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.4);border-radius:6px;width:22px;height:22px;line-height:1;font-size:0.75rem;cursor:pointer;flex-shrink:0;">➖</button>
      </div>
      <div id="vcin-sim-body">
        <div id="vcin-sim-stats" style="display:flex;flex-direction:column;gap:4px;font-size:0.72rem;margin-bottom:12px;color:#94a3b8">
          <span>Idle — Press START to begin simulation</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button onclick="VCINSimEngine.start()" style="flex:1;background:#6366f1;color:#fff;border:none;padding:7px 10px;border-radius:7px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:monospace;letter-spacing:1px;">▶ START DRILL</button>
          <button onclick="VCINSimEngine.stop()" style="flex:1;background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid rgba(239,68,68,0.4);padding:7px 10px;border-radius:7px;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:monospace;">⏹ STOP</button>
        </div>
        <button onclick="VCINSimEngine.injectNow()" style="width:100%;background:rgba(245,158,11,0.15);color:#f59e0b;border:1px solid rgba(245,158,11,0.3);padding:6px;border-radius:7px;font-size:0.7rem;font-weight:700;cursor:pointer;font-family:monospace;">⚡ INJECT INCIDENT NOW</button>
        <div style="margin-top:8px;font-size:0.6rem;color:#475569;text-align:center">Bayesian CTS · Uber H3 IRS · Guardian GPS</div>
      </div>`;
    document.body.appendChild(hud);

    // Minimize / restore (state persisted for the session)
    const KEY = 'vcin-sim-hud-minimized';
    const body = hud.querySelector('#vcin-sim-body');
    const btn  = hud.querySelector('#vcin-sim-minimize');
    const apply = (min) => {
      if (min) {
        body.style.display = 'none';
        hud.style.minWidth = '0';
        btn.textContent = '▪';
        btn.title = 'Restore Live Drill Engine panel';
        hud.style.opacity = '0.85';
      } else {
        body.style.display = 'block';
        hud.style.minWidth = '240px';
        btn.textContent = '➖';
        btn.title = 'Minimize Live Drill Engine panel';
        hud.style.opacity = '1';
      }
      try { sessionStorage.setItem(KEY, min ? '1' : '0'); } catch (_) {}
    };
    btn.addEventListener('click', () => apply(body.style.display !== 'none'));
    let wasMin = false;
    try { wasMin = sessionStorage.getItem(KEY) === '1'; } catch (_) {}
    if (wasMin) apply(true);
  }

  function start() {
    if (simRunning) return;
    simRunning = true;
    logSim('BOOT','V-CIN Live Drill Simulation started - seeding guardian fleet...','#6366f1');
    seedGuardians();
    simTimeout(injectIncident, 1500);
    tickTimer     = setInterval(()=>{ if(simRunning) injectIncident(); }, CFG.tickIntervalMs);
    guardianTimer = setInterval(()=>{ if(simRunning) stepGuardians(); },  CFG.guardianMoveMs);
    if (typeof showOperatorToast === 'function') showOperatorToast('Live Drill Simulation STARTED - Bayesian CTS + H3 IRS + Guardian movement active','info');
    updateSimHUD();
  }

  function stop() {
    simRunning = false;
    if (tickTimer)     { clearInterval(tickTimer);     tickTimer     = null; }
    if (guardianTimer) { clearInterval(guardianTimer); guardianTimer = null; }
    // Cancel pending auto-dispatch / auto-resolve / map pulse timers so the
    // drill freezes exactly where it is instead of continuing in the background.
    clearPendingTimeouts();
    logSim('STOP','Drill simulation paused.','#94a3b8');
    if (typeof showOperatorToast === 'function') showOperatorToast('Live Drill Simulation STOPPED. Dashboard data retained.','info');
    updateSimHUD();
  }

  function init() {
    let attempts = 0;
    const t = setInterval(()=>{
      attempts++;
      const app = document.getElementById('mainApp');
      if (app && !app.classList.contains('hidden')) {
        clearInterval(t);
        mountDrillButton();
        logSim('READY','Sim Engine ready - click LIVE DRILL to begin','#6366f1');
      } else if (attempts >= 150) {
        // Dashboard never opened — stop polling to avoid an endless loop.
        clearInterval(t);
      }
    }, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { start, stop, injectNow: injectIncident, getState:()=>({simRunning,totalInjected,totalResolved,guardians:simGuardians.length}) };
})();

window.VCINSimEngine = VCINSimEngine;
