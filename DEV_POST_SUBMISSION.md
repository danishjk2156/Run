---
title: "Touch Grass Relay: Pocket Your Phone, Run with Friends, Reach God Mode"
published: true
tags: devchallenge, hf26challenge, opensource, webdev
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

## What I Built

Most fitness apps demand your eyes: flashing rings, complex pace graphs, and turn-by-turn prompts that force you to look down at your screen while running through nature.

**Touch Grass Relay** turns that inside out. It is a collaborative, real-time running web application designed specifically so **your phone stays in your pocket the entire time**:

1. **Squad Rooms (Frictionless Joining)**: One runner creates a squad room and shares a 6-character code or QR code. Teammates join in 3 seconds from their mobile browsers—no app store downloads, no registrations, and no paywalls.
2. **Shared Anime Power Levels**: Distance is pooled collectively across all runners in real time to unlock squad transformations:
   - **0 km**: *Base Form*
   - **Awakened**: Cyan pulse (Initial limit break)
   - **Kaioken**: Crimson surge (Limits broken)
   - **Super Syana**: Golden aura unlocked
   - **Syana 2**: Violet lightning crackles
   - **God Mode**: Neon pink final form unlocked
   *(Thresholds scale dynamically whether you run solo, in pairs, or in full squads).*
3. **Hands-Free Audio Coaching**: The Web Speech API announces milestone updates and tier transitions straight to your earbuds: *"Aura rising! 10 km combined. Kaioken unlocked!"*
4. **Pocket Mode (OLED Power Saver)**: Once the run starts, the app enters Pocket Mode. The screen goes pure `#000000` (drawing near-zero power on modern OLED screens) and engages the Screen Wake Lock API to prevent mobile operating systems from freezing background GPS and WebSockets in your pocket. A 1-second hold-to-unlock gesture prevents accidental fabric friction touches.
5. **Post-Run Battle Story & Badges**: At the end of the session, the squad receives a generated battle story, geographical territory coverage computed via Turf.js convex hull algorithms, and individual achievement badges (*Top Contributor*, *First Blood*, *Iron Will*).

---

## Demo

- **Repository**: [https://github.com/danishjk2156/Run](https://github.com/danishjk2156/Run)
- **Built-in Multi-Runner Simulator**: You can test the full live experience right from your desk without stepping outside:
  ```bash
  # Inside server/
  npm run fake-gps
  ```
  This spins up a 4-runner squad (*Goku, Vegeta, Piccolo, Gohan*) streaming realistic running GPS telemetry through WebSockets, triggering live tier ascensions and audio cues.

---

## Code

{% github https://github.com/danishjk2156/Run %}

---

## How I Built It

The entire project is built with open web standards and open-source tooling:

```
📱 Client (Mobile Web / PWA)
├── React 18 + Vite + Tailwind CSS
├── Screen Wake Lock API (keeps GPS & WebSockets active without screen wake)
├── Web Speech API (hands-free audio cues in earbuds)
├── MapLibre GL JS + OpenStreetMap (100% free vector map tiles)
└── Socket.io Client (low-latency coordinate streaming)

🖥️ Server (Node.js + TypeScript)
├── Express + Socket.io Server
├── Zod (strict validation for every incoming GPS batch)
├── Turf.js (Haversine geodesic distance & convex hull area calculations)
├── Tier & Badge Engine (idempotent threshold triggers with squad scaling)
└── In-memory room store (PostgreSQL & Redis migration ready)
```

### The 5-Stage GPS Anti-Cheat Pipeline
To eliminate stationary GPS drift and cheating (cars/bicycles), every coordinate batch passes through a strict validation gate:
- **Accuracy Gate**: Points with error radius `> 25m` are rejected.
- **Speed Gate**: Speeds `> 25 km/h` are rejected.
- **Drift Gate**: Discards stationary jitter `< 3m`.
- **Teleport Gate**: Rejects sudden GPS jumps `> 500m`.
- **Rate Limit**: Enforces clean point spacing (minimum 3 seconds).

---

## Why Does Open Innovation Matter?

1. **Zero Data Extraction & Surveillance**: Commercial fitness platforms hoard and monetize location telemetry, selling personal heatmaps to data brokers. Touch Grass Relay operates on private ephemeral room channels; coordinates belong to you and your squad, not ad networks.
2. **Zero App Store Taxes & Gatekeepers**: By using open web standards (WebSockets, Geolocation API, Screen Wake Lock API, Web Speech), there are no 30% developer fees, no approval queues, and no Apple Developer Account restrictions. Anyone with a smartphone browser can run together instantly.
3. **Zero Proprietary API Lock-In**: Maps are rendered with **MapLibre GL** and **OpenStreetMap** instead of expensive closed map APIs. Audio runs client-side via **Web Speech**, requiring $0 in cloud TTS subscription fees.
4. **Community Moddability**: Because the tier ladder, badges, and story generators are open-source and modular, run clubs can fork the codebase to build custom themes (e.g., sci-fi ranks, trail challenges, or marathon training milestones).

---

## Prize Categories

- **Hacktoberfest Week 1: Touch Grass Challenge**
