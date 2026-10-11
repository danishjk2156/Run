---
title: Touch Grass Relay: Pocket Your Phone, Run with Friends, Reach God Mode
published: false
tags: devchallenge, hf26challenge, open source, webdev
---

*This is a submission for the [Hacktoberfest Open-Source AI Challenge Week 1: Touch Grass](https://dev.to/challenges/hacktoberfest-week1-2026-10-05)*

---

## What I Built

Most fitness apps demand your eyes: flashing rings, turn-by-turn alerts, and heart-rate charts that keep your head down while running through parks or trails.

**Touch Grass Relay** turns that inside out. It is a collaborative running web app designed specifically so **your phone stays in your pocket the entire time**:

1. **Squad Rooms**: One friend creates a room and shares a 6-character room code. Everyone joins from their mobile browsers—no app stores, no sign-ups, no friction.
2. **Shared Anime Power Levels**: Distance is pooled collectively across all runners in real time:
   - **0 km**: *Base Form*
   - **10 km**: *Awakened* (Cyan pulse)
   - **20 km**: *Kaioken* (Limits broken)
   - **30 km**: *Super Syana* (Golden aura)
   - **40 km**: *Syana 2* (Lightning crackles)
   - **50 km**: *God Mode* (Final form unlocked)
3. **Audio-Only Coaching**: The Web Speech API announces milestone updates and tier transitions straight to your earbuds: *"Aura rising! 30 km combined. Super Syana unlocked!"*
4. **Pocket Mode (OLED Power Saver)**: Once the run starts, the app enters Pocket Mode—the screen turns pure `#000000` (drawing negligible battery on OLED displays) and activates the Screen Wake Lock API to prevent mobile browsers from freezing GPS in your pocket.
5. **Post-Run Battle Story & Badges**: When the run ends, the group receives a shareable battle log and awards individual badges (*Top Contributor*, *Final Push*, *Iron Will*, *First Blood*).

---

## Demo

- **Live Web App**: `https://your-deployment-url.com` *(deploy client on Vercel/Netlify)*
- **Demo Video**: *(Insert a 60-second clip of friends running outdoors with headphones and the audio cue triggering)*

---

## Code

{% github https://github.com/your-username/touch-grass-relay %}

---

## How I Built It

The entire architecture is built around **open web standards and open-source tools**:

```
📱 Client (Mobile Web / PWA)
├── React + Vite + Tailwind CSS
├── Screen Wake Lock API (keeps GPS active without screen wake)
├── Web Speech API / Piper TTS (hands-free audio cues in earbuds)
├── MapLibre GL JS + OpenStreetMap (100% free, open vector tiles)
└── Socket.io Client (low-latency coordinate streaming)

🖥️ Server (Node.js + TypeScript)
├── Express + Socket.io Server
├── Zod (validation for every GPS coordinate batch)
├── Turf.js (geodesic distance math & convex hull area calculations)
├── Tier & Badge Engine (idempotent threshold triggers with small-squad scaling)
└── In-memory room store (with PostgreSQL / Redis migration ready)
```

### The GPS Filter Pipeline
To prevent stationary GPS drift or runners cheating in cars, every point passes through strict server and client filters:
- **Accuracy Gate**: Points with error radius `> 25m` are dropped.
- **Speed Gate**: Speeds `> 25 km/h` are rejected.
- **Movement Gate**: Discards drift `< 3m`.
- **Teleport Gate**: Rejects jumps `> 500m` in a single interval.

---

## Why Does Open Innovation Matter?

1. **Zero Data Extraction & Surveillance**: Commercial fitness platforms hoard and monetize location telemetry, selling heatmaps and habit data to advertisers. Touch Grass Relay operates on private ephemeral room channels; coordinates belong to you and your friends, not an ad network.
2. **Zero App Store Taxes & Gatekeepers**: By using open web standards (WebSockets, Geolocation API, Screen Wake Lock API, Web Speech), there are no 30% developer fees, no approval queues, and no requirement for an Apple Developer Account. Anyone with a smartphone browser can participate instantly.
3. **Zero Proprietary API Lock-In**: Maps are rendered via **MapLibre GL** and **OpenStreetMap** instead of expensive closed map APIs. Audio runs client-side via **Web Speech / Piper ONNX**, costing $0 in cloud TTS fees.
4. **Community Moddability**: Because the tier ladder and badges are modular open-source code, local run clubs can fork the app to create customized themes (e.g., sci-fi ranks, marathon pacing tiers, or trail exploration badges).

---

## Prize Categories
- **Hacktoberfest Week 1: Touch Grass Challenge**
