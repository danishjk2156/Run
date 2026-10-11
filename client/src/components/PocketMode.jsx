import React, { useState, useEffect, useRef } from "react";
import { Lock, Unlock, Volume2, VolumeX, ShieldAlert } from "lucide-react";
import { voiceCoach } from "../utils/voice";

export default function PocketMode({ active, onToggle, totalKm, currentTier, tierColor }) {
  const [wakeLock, setWakeLock] = useState(null);
  const [unlockProgress, setUnlockProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [muted, setMuted] = useState(voiceCoach.isMuted());
  const timerRef = useRef(null);

  // Request Screen Wake Lock when entering Pocket Mode
  useEffect(() => {
    let lockInstance = null;
    const requestLock = async () => {
      if (active && "wakeLock" in navigator) {
        try {
          lockInstance = await navigator.wakeLock.request("screen");
          setWakeLock(lockInstance);
          lockInstance.addEventListener("release", () => {
            setWakeLock(null);
          });
        } catch (err) {
          console.warn("Wake Lock request failed:", err.message);
        }
      }
    };

    if (active) {
      requestLock();
      voiceCoach.speak("Pocket Mode activated. Put your phone away and run!", true);
    } else if (wakeLock) {
      wakeLock.release().catch(() => {});
      setWakeLock(null);
    }

    return () => {
      if (lockInstance) lockInstance.release().catch(() => {});
    };
  }, [active]);

  // Handle Hold-to-Unlock
  const startPress = () => {
    setIsPressing(true);
    let progress = 0;
    timerRef.current = setInterval(() => {
      progress += 5;
      setUnlockProgress(progress);
      if (progress >= 100) {
        clearInterval(timerRef.current);
        onToggle(false);
        setUnlockProgress(0);
        setIsPressing(false);
      }
    }, 50); // 1 second total hold
  };

  const endPress = () => {
    setIsPressing(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setUnlockProgress(0);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    voiceCoach.setMuted(next);
  };

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-6 select-none touch-none text-white"
      onTouchStart={startPress}
      onTouchEnd={endPress}
      onMouseDown={startPress}
      onMouseUp={endPress}
      onMouseLeave={endPress}
    >
      {/* Top Bar */}
      <div className="flex justify-between items-center pt-2">
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          POCKET LOCKED (OLED SAVER)
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          className="p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 active:text-white"
        >
          {muted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
        </button>
      </div>

      {/* Main Stats Display (High contrast for quick glances) */}
      <div className="text-center space-y-4 my-auto">
        <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
          COMBINED POWER LEVEL
        </div>
        <div
          className="text-4xl md:text-5xl font-black font-teko tracking-wider uppercase drop-shadow-md"
          style={{ color: tierColor || "#ffffff" }}
        >
          {currentTier}
        </div>
        <div className="text-8xl md:text-9xl font-black font-teko tracking-tight text-white leading-none">
          {totalKm.toFixed(1)}
          <span className="text-3xl text-zinc-500 font-normal font-sans ml-2">KM</span>
        </div>
        <p className="text-xs text-zinc-600 max-w-xs mx-auto">
          Audio coach is active. Your phone screen can stay in your pocket.
        </p>
      </div>

      {/* Hold to Unlock footer */}
      <div className="flex flex-col items-center gap-3 pb-8">
        <div className="relative w-20 h-20 flex items-center justify-center rounded-full border-2 border-zinc-800 bg-zinc-950">
          {/* Circular progress SVG */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="36"
              stroke="#ffd700"
              strokeWidth="4"
              fill="transparent"
              strokeDasharray="226"
              strokeDashoffset={226 - (226 * unlockProgress) / 100}
              className="transition-all duration-75"
            />
          </svg>
          <Lock className={`w-7 h-7 ${isPressing ? "text-amber-400 animate-bounce" : "text-zinc-500"}`} />
        </div>
        <div className="text-xs tracking-wider font-semibold text-zinc-400 uppercase">
          {isPressing ? "Keep Holding to Unlock..." : "Press & Hold 1s to Unlock"}
        </div>
      </div>
    </div>
  );
}
