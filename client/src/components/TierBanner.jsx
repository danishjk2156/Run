import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { Zap, Flame } from "lucide-react";

export default function TierBanner({ tierData, onClose }) {
  useEffect(() => {
    if (!tierData) return;

    // Trigger explosive celebratory confetti matching tier color
    try {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 },
        colors: [tierData.color || "#ffd700", "#ffffff", "#ff4500"],
      });
    } catch (e) {
      // Ignored if confetti fails
    }

    const timer = setTimeout(() => {
      onClose();
    }, 6000);

    return () => clearTimeout(timer);
  }, [tierData, onClose]);

  if (!tierData) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in zoom-in duration-300">
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center border-2 space-y-4 shadow-2xl relative overflow-hidden"
        style={{
          borderColor: tierData.color || "#ffd700",
          backgroundColor: "#0c1322",
          boxShadow: `0 0 60px ${tierData.color}88`,
        }}
      >
        {/* Dynamic lightning/glow background element */}
        <div
          className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-50 pointer-events-none"
          style={{ backgroundColor: tierData.color }}
        />

        <div className="flex justify-center items-center gap-2 text-amber-400 font-bold uppercase tracking-widest text-xs">
          <Zap className="w-4 h-4 fill-amber-400 animate-bounce" />
          POWER LEVEL UNLOCKED
          <Flame className="w-4 h-4 fill-amber-400 animate-bounce" />
        </div>

        <div
          className="text-5xl font-black font-teko uppercase tracking-wider drop-shadow-lg"
          style={{ color: tierData.color }}
        >
          {tierData.tier}
        </div>

        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-1">
          <p className="text-sm font-semibold text-zinc-300">
            "{tierData.voiceLine}"
          </p>
          <div className="text-xs text-zinc-500 pt-1">
            Triggered by <span className="text-white font-medium">{tierData.triggeredBy || "Runner"}</span>
          </div>
        </div>

        <div className="text-2xl font-black font-teko text-white">
          {tierData.totalKm} KM COMBINED
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all bg-white text-black active:scale-95 shadow-lg"
        >
          RESUME RUN
        </button>
      </div>
    </div>
  );
}
