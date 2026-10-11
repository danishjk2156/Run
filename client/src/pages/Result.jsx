import React from "react";
import { Trophy, Share2, Flame, Award, MapPin, Clock, ArrowRight } from "lucide-react";

export default function Result({ result, onRestart }) {
  if (!result) return null;

  const handleShare = () => {
    const text = `🔥 My squad covered ${result.totalKm} km and reached ${result.finalTier} in Touch Grass Relay!\n\n"${result.story}"\n\n#TouchGrass #Hacktoberfest`;
    if (navigator.share) {
      navigator.share({
        title: "Touch Grass Relay — Run Complete",
        text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert("Run summary copied to clipboard!");
    }
  };

  const minutes = Math.round((result.durationS || 0) / 60);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto space-y-6">
      {/* Header Badge */}
      <div className="text-center pt-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Trophy className="w-3.5 h-3.5" />
          RELAY COMPLETE
        </div>
        <h2 className="text-5xl font-black font-teko uppercase text-white tracking-wider">
          {result.finalTier} UNLOCKED
        </h2>
      </div>

      {/* Main Stats Summary Card */}
      <div className="glass-panel rounded-3xl p-6 border border-zinc-800 space-y-6 shadow-2xl">
        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-zinc-800">
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Distance
            </div>
            <div className="text-2xl font-black font-teko text-amber-400">
              {result.totalKm} KM
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Duration
            </div>
            <div className="text-2xl font-black font-teko text-zinc-200">
              {minutes} MIN
            </div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Area
            </div>
            <div className="text-2xl font-black font-teko text-zinc-200">
              {result.areaKm2 || 0} KM²
            </div>
          </div>
        </div>

        {/* AI Anime Battle Story */}
        <div className="bg-amber-500/5 rounded-2xl p-4 border border-amber-500/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-amber-400" />
            BATTLE LOG STORY
          </div>
          <p className="text-sm italic text-zinc-300 leading-relaxed">
            "{result.story}"
          </p>
        </div>

        {/* Squad Badges Roster */}
        <div className="space-y-2">
          <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Squad Contributions & Badges
          </div>
          <div className="space-y-2">
            {result.members?.map((m) => (
              <div
                key={m.id}
                className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{m.name}</div>
                  <div className="flex gap-1.5 mt-1 flex-wrap">
                    {m.badges?.map((badge, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30"
                      >
                        <Award className="w-3 h-3" />
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="text-right font-mono font-bold text-sm text-amber-400">
                  {m.km.toFixed(1)} km
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3 pb-6">
        <button
          onClick={handleShare}
          className="w-full py-4 rounded-2xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          SHARE RUN WITH FRIENDS
        </button>

        <button
          onClick={onRestart}
          className="w-full py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 text-zinc-400 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
        >
          Return to Home
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
