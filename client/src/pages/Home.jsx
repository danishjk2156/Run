import React, { useState } from "react";
import { Flame, Compass, Users, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

export default function Home({ onCreateRoom, onJoinRoom, loading }) {
  const [tab, setTab] = useState("create"); // 'create' | 'join'
  const [displayName, setDisplayName] = useState(localStorage.getItem("tgr_name") || "");
  const [code, setCode] = useState("");
  const [targetKm, setTargetKm] = useState(50);

  const handleNameChange = (val) => {
    setDisplayName(val);
    localStorage.setItem("tgr_name", val);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    onCreateRoom(displayName.trim(), targetKm);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!displayName.trim() || !code.trim()) return;
    onJoinRoom(code.trim().toUpperCase(), displayName.trim());
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto relative">
      {/* Header / Brand */}
      <div className="pt-6 text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          HACKTOBERFEST : TOUCH GRASS
        </div>

        <h1 className="text-5xl font-black font-teko tracking-wider uppercase text-white drop-shadow-md">
          TOUCH GRASS <span className="text-amber-400">RELAY</span>
        </h1>
        <p className="text-sm text-zinc-400 leading-relaxed px-2">
          Run anywhere with friends. Put your phone in your pocket. Your distances combine in real time to unlock anime power levels.
        </p>
      </div>

      {/* Main Action Card */}
      <div className="glass-panel rounded-3xl p-6 shadow-2xl my-6 border border-zinc-800">
        {/* Tab switch */}
        <div className="grid grid-cols-2 p-1 bg-zinc-900/90 rounded-2xl mb-6 border border-zinc-800">
          <button
            onClick={() => setTab("create")}
            className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              tab === "create" ? "bg-amber-400 text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            Create Squad
          </button>
          <button
            onClick={() => setTab("join")}
            className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
              tab === "join" ? "bg-amber-400 text-black shadow-md" : "text-zinc-400 hover:text-white"
            }`}
          >
            Join with Code
          </button>
        </div>

        {tab === "create" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Your Runner Call-sign
              </label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="e.g. Goku, Runner 1"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Squad Goal (Combined KM)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 50].map((km) => (
                  <button
                    key={km}
                    type="button"
                    onClick={() => setTargetKm(km)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      targetKm === km
                        ? "border-amber-400 bg-amber-400/20 text-amber-300 shadow-sm"
                        : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700"
                    }`}
                  >
                    {km} KM
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !displayName.trim()}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Flame className="w-5 h-5 fill-black" />
              CREATE ROOM & GET CODE
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Your Runner Call-sign
              </label>
              <input
                type="text"
                required
                maxLength={20}
                placeholder="e.g. Vegeta"
                value={displayName}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                6-Character Room Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. X9K2W8"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-center text-2xl font-mono tracking-widest font-black uppercase text-amber-400 placeholder-zinc-600 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !displayName.trim() || code.length < 4}
              className="w-full py-4 rounded-xl font-bold text-sm tracking-wide bg-gradient-to-r from-amber-400 to-amber-500 text-black shadow-lg shadow-amber-500/20 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <Users className="w-5 h-5" />
              JOIN SQUAD RUN
            </button>
          </form>
        )}
      </div>

      {/* Footer / Open Innovation Credentials */}
      <div className="py-4 text-center space-y-2">
        <div className="inline-flex items-center gap-2 text-xs text-zinc-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Open-Source • Zero Tracking Ads • Private Room</span>
        </div>
        <div className="text-[11px] text-zinc-600">
          Audio powered by Web Speech API • Maps powered by MapLibre & OSM
        </div>
      </div>
    </div>
  );
}
