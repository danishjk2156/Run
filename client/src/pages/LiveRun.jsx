import React, { useState, useEffect, useRef } from "react";
import { Lock, Map as MapIcon, Flag, Volume2, VolumeX, Shield, Award } from "lucide-react";
import Map from "../components/Map";
import PocketMode from "../components/PocketMode";
import { voiceCoach } from "../utils/voice";

const TIER_COLORS = {
  "Base Form": "#ffffff",
  "Awakened": "#00bfff",
  "Kaioken": "#ff4500",
  "Super Syana": "#ffd700",
  "Syana 2": "#7b68ee",
  "God Mode": "#ff1493",
};

export default function LiveRun({ roomState, userId, onSendPoints, onStopRun, isHost }) {
  const [pocketActive, setPocketActive] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);

  const totalKm = roomState?.totalKm || 0;
  const currentTier = roomState?.currentTier || "Base Form";
  const tierColor = TIER_COLORS[currentTier] || "#ffffff";
  const members = roomState?.members || [];

  // Active GPS tracking pipeline
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setGpsError("Geolocation is not supported by your browser");
      return;
    }

    const pointBuffer = [];
    let lastFlush = Date.now();

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const point = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          ts: Math.floor(pos.timestamp / 1000),
          acc: pos.coords.accuracy || 10,
        };

        setUserLocation(point);
        pointBuffer.push(point);

        // Send point batch every 5 seconds or whenever buffer hits 5 points
        const now = Date.now();
        if (pointBuffer.length >= 5 || now - lastFlush >= 5000) {
          if (pointBuffer.length > 0) {
            onSendPoints([...pointBuffer]);
            pointBuffer.length = 0; // Clear buffer
            lastFlush = now;
          }
        }
      },
      (err) => {
        console.warn("GPS watchPosition error:", err.message);
        setGpsError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [onSendPoints]);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto relative overflow-hidden">
      {/* Pocket Mode Fullscreen Overlay */}
      <PocketMode
        active={pocketActive}
        onToggle={setPocketActive}
        totalKm={totalKm}
        currentTier={currentTier}
        tierColor={tierColor}
      />

      {/* Dynamic Background Aura Glow */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[120px] pointer-events-none opacity-30 transition-all duration-1000"
        style={{ backgroundColor: tierColor }}
      />

      {/* Top Header */}
      <div className="pt-2 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
            LIVE RELAY
          </span>
        </div>

        <button
          onClick={() => setShowMap(!showMap)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
            showMap ? "bg-amber-400 text-black border-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
          }`}
        >
          <MapIcon className="w-3.5 h-3.5" />
          {showMap ? "Hide Map" : "View Map"}
        </button>
      </div>

      {/* Main Stats / Tier Glow Card */}
      <div className="my-auto text-center space-y-4 z-10">
        <div className="space-y-1">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
            CURRENT POWER LEVEL
          </div>
          <div
            className="text-4xl md:text-5xl font-black font-teko uppercase tracking-wider drop-shadow-xl transition-all duration-700"
            style={{ color: tierColor }}
          >
            {currentTier}
          </div>
        </div>

        {/* Big Counter */}
        <div className="relative inline-block py-2">
          <div className="text-8xl font-black font-teko text-white tracking-tight leading-none">
            {totalKm.toFixed(1)}
            <span className="text-3xl text-zinc-500 font-sans ml-2 font-semibold">KM</span>
          </div>
        </div>

        {/* Pocket Mode CTA */}
        <div>
          <button
            onClick={() => setPocketActive(true)}
            className="w-full py-4 rounded-2xl font-black text-sm tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-2xl shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5 fill-black" />
            POCKET PHONE & RUN
          </button>
          <p className="text-[11px] text-zinc-500 mt-2">
            Screen goes black to save battery. Voice coach talks through your headphones.
          </p>
        </div>

        {/* Interactive Map View */}
        {showMap && (
          <div className="w-full h-64 sm:h-72 rounded-2xl overflow-hidden mt-3 border border-zinc-800 shadow-2xl relative">
            <Map members={members} userLocation={userLocation} />
          </div>
        )}

        {/* Live Runner Squad Telemetry */}
        <div className="glass-panel rounded-2xl p-3 border border-zinc-800 space-y-2 mt-4 text-left">
          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1">
            Squad Mileage
          </div>
          <div className="grid grid-cols-2 gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 border border-zinc-800/80"
              >
                <span className="text-xs font-semibold text-zinc-200 truncate pr-1">
                  {m.name}
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {m.km.toFixed(1)} km
                </span>
              </div>
            ))}
          </div>
        </div>

        {gpsError && (
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl">
            GPS Notice: {gpsError}
          </div>
        )}
      </div>

      {/* Footer / Host Stop */}
      <div className="pt-4 z-10">
        {isHost && (
          <button
            onClick={onStopRun}
            className="w-full py-3 rounded-xl border border-red-500/40 text-red-400 hover:bg-red-500/10 font-bold text-xs uppercase tracking-wider transition-all"
          >
            End Run & Generate Story
          </button>
        )}
      </div>
    </div>
  );
}
