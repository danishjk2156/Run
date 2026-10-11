# Touch Grass Relay — Mobile Web App (PWA)

The mobile-first web frontend for Touch Grass Relay. Built with React, Vite, Tailwind CSS, MapLibre GL JS, and the Web Speech API.

## Features
- **Phone in Pocket (OLED Screen Saver)**: Pure black `#000000` view with Screen Wake Lock API and anti-accidental-touch hold-to-unlock gesture.
- **Audio Announcements**: Web Speech API announces milestone updates and anime tier changes through your headphones without needing you to glance at your screen.
- **Live Vector Maps**: OpenStreetMap raster/vector rendering via MapLibre GL with real-time runner position updates.
- **Zero App Store Gatekeepers**: Share a link or QR code, join in 3 seconds, and start running outside immediately.

## Running Locally

```bash
# In client/
npm install
npm run dev
```

Open `http://localhost:5173` on your browser, or open `http://<YOUR_LOCAL_IP>:5173` on your mobile phone connected to the same Wi-Fi.
