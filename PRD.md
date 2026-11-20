# Product Requirements Document: Suraksha (Operation Moon)

**Version:** 0.1 (Hackathon MVP) · **Date:** 2026-07-06 · **Status:** Draft

---

## 1. Overview

Suraksha is an installable Progressive Web App (PWA) that closes the "golden hour" gap in India's cybercrime and personal-safety response. It gives citizens a one-tap SOS that simultaneously notifies nearby community guardians and a cyber cell operator, captures tamper-evident evidence, and guides victims to the correct official reporting channel in their own language.

## 2. Problem Statement

India's current cybercrime response fails victims at the citizen-facing layer:

1. **Fragmented reporting** – NCRP portal and helpline 1930 are form-heavy, limited-language, and cause jurisdiction ping-pong between local police and cyber cells.
2. **Golden hour loss** – fraud money is mule-hopped within minutes; physical danger requires response in seconds, not the hours current channels take.
3. **Weak evidence** – victims submit easily-challenged screenshots; no citizen tool captures timestamped, geotagged, hash-verified evidence.
4. **No preventive layer** – the system is entirely reactive; no scam triage or area-risk awareness for citizens.
5. **Language exclusion** – official portals support very few of India's 22+ scheduled languages.

**We fix the citizen side of the pipeline. We do not claim to fix police capacity or backend backlogs.**

## 3. Goals & Non-Goals

### Goals (MVP)
- One-tap SOS with live location broadcast to guardians and an operator dashboard
- Automatic audio recording on SOS with timestamp + SHA-256 hash for integrity
- Live location sharing with trusted family contacts (consent-based, time-limited)
- Rapid complaint portal: guided, pre-filled drafts routed to the correct channel (1930 / NCRP / local FIR)
- Multilingual UI and AI assistant (start with English + Hindi, extensible)
- One-tap helplines: 1930 (cyber), 112 (emergency), 181 (women)
- Check-in timer ("home by 10 PM" auto-alert)
- Installable PWA – no app store required

### Non-Goals (be honest with judges)
- **No live integration with CCTNS / NCRP / 1930** – no public APIs exist. Operator dashboard is a mock, designed for future government partnership.
- **Not court-certified evidence** – hashing improves integrity, but admissibility under BSA §63 requires proper certification.
- **Not a replacement for police response** – guardians supplement, never replace, official responders.

## 4. Target Users / Personas

| Persona | Need |
|---|---|
| **Priya, 22, student commuting late** | Silent SOS, live location to family, guardian standby |
| **Ravi, 45, fraud victim** | Fast 1930 routing within the golden hour, in Telugu |
| **Meera, 28, harassment victim** | Anonymous rapid complaint, evidence vault, mental-health resources |
| **Cyber cell operator (future)** | Live map, incoming SOS queue, victim call channel |
| **Community guardian** | Verified nearby-alert notifications with distance/ETA |

## 5. Core User Flows

### 5.1 SOS Flow (demo centerpiece)
1. User taps **SOS** (or triple-press power / shake – future)
2. App captures GPS, starts audio recording, hashes chunks with timestamps
3. Alert broadcast to: (a) registered family contacts, (b) nearby guardians, (c) operator dashboard
4. Operator acknowledges → victim sees "Operator connected", parallel WebRTC call opens (future)
5. Alert repeats until help marked as arrived

### 5.2 Rapid Complaint Flow
1. User selects category (financial fraud / harassment / blackmail / stalking / other)
2. AI assistant asks 3–5 questions in user's language, drafts the complaint
3. App routes: financial → call 1930 immediately + NCRP draft; harassment → NCRP + FIR guidance
4. Case reference stored locally with evidence bundle

### 5.3 Family Location Sharing
1. User starts a "journey" with expected arrival time
2. Live location shared with chosen contacts, auto-expires on arrival
3. Missed check-in → automatic escalation to SOS-lite

## 6. Feature List

### MVP (this demo)
- SOS button with geolocation + audio recording (MediaRecorder API)
- Real-time alert propagation to mock operator dashboard (BroadcastChannel; WebSockets in production)
- EN/HI language toggle
- One-tap helplines (tel: links)
- Check-in timer
- Complaint draft generator (template-based; LLM in production)
- PWA: manifest + service worker, installable, offline shell

### Phase 2
- WebRTC parallel call with operator
- Guardian network with verification, distance/ETA, rate-limiting against fake alerts
- Evidence vault with SHA-256 chunk hashing and export bundle
- Offline SMS fallback for SOS
- LLM-powered multilingual assistant + scam/phishing triage
- Safe-route heatmap from anonymized incident reports
- Silent/stealth mode (disguised UI)

### Phase 3
- Government partnership for real NCRP/1930 integration
- Mental-health support programs and NGO directory
- Deepfake/sextortion detection assistance

## 7. Technical Architecture

**MVP (demo):** static PWA, vanilla JS. Real-time simulated via `BroadcastChannel` between tabs (victim app ↔ operator dashboard) – zero backend, works offline at the venue.

**Production target:**
- Frontend: PWA (Web Push, Geolocation, MediaRecorder, Wake Lock)
- Backend: Node.js + Socket.io (alerts), PostgreSQL + PostGIS (geo queries)
- Calls: WebRTC (TURN server)
- AI: LLM API behind a multilingual prompt layer
- Evidence: client-side SHA-256, server timestamping

**Known PWA constraints (flag honestly):** background geolocation and recording are restricted in browsers; continuous tracking requires the app foregrounded or a future native wrapper.

## 8. Success Metrics
- Time from danger → alert delivered: **< 5 seconds**
- Time from fraud → 1930 call initiated: **< 60 seconds**
- Complaint draft completion rate vs raw NCRP form
- Languages supported; guardian response time

## 9. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Fake SOS / alert spam | Verified accounts, rate limits, escalating penalties |
| Stalker misuse of location sharing | Consent-based, time-limited, revocable sharing only |
| Evidence admissibility challenged | Hash + timestamp; document chain of custody; no over-claiming |
| No official API access | Mock operator dashboard; design for integration |
| Browser background limits | Wake Lock API; document constraints; native wrapper later |

## 10. Demo Script (2 phones + 1 laptop)
1. Install PWA on phone ("Add to Home Screen") – show no app store needed
2. Open operator dashboard on laptop
3. Story: "Priya is walking home at 11 PM…" – trigger SOS on phone 1
4. Show alert + live coordinates appear on operator dashboard; operator acknowledges; phone shows "Operator connected"
5. Show recording indicator and evidence hash
6. Show rapid complaint flow in Hindi
7. Close with honest limitations + partnership roadmap
