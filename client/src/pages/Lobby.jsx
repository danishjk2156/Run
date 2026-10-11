import React, { useState } from "react";
import { Users, Copy, Check, Play, Volume2, Shield } from "lucide-react";
import { voiceCoach } from "../utils/voice";

export default function Lobby({ room, userId, onStartRun }) {
  const [copied, setCopied] = useState(false);
  const isHost = room.hostId === userId;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testVoice = () => {
    voiceCoach.speak("Touch grass test audio check! Ready to push past your limits.", true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 max-w-md mx-auto">
      {/* Top Header */}
      <div className="pt-4 space-y-2 text-center">
        <div className="text-xs uppercase tracking-widest text-zinc-500 font-bold">
          SQUAD LOBBY
        </div>
        <h2 className="text-3xl font-black font-teko tracking-wider uppercase text-white">
          ROOM CODE
        </h2>

        {/* Big Code Card */}
        <div
          onClick={copyCode}
          className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900/90 border-2 border-amber-400/80 rounded-2xl cursor-pointer active:scale-95 transition-all shadow-xl shadow-amber-500/10"
        >
          <span className="text-4xl font-mono font-black tracking-widest text-amber-400">
            {room.code}
          </span>
          {copied ? (
            <Check className="w-5 h-5 text-emerald-400" />
          ) : (
            <Copy className="w-5 h-5 text-zinc-400" />
          )}
        </div>
        <p className="text-xs text-zinc-400">Tap code to copy and share with friends</p>
      </div>

      {/* Runner Roster */}
      <div className="my-6 glass-panel rounded-3xl p-5 border border-zinc-800 space-y-4">
        <div className="flex justify-between items-center text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" />
            Squad Roster ({room.members?.length || 1})
          </span>
          <span className="text-amber-400">{room.targetKm} KM GOAL</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {room.members?.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/80 border border-zinc-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-semibold text-sm text-zinc-100">
                  {member.name}
                </span>
                {member.id === room.hostId && (
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Host
                  </span>
                )}
              </div>
              <span className="text-xs text-zinc-500 font-mono">Ready</span>
            </div>
          ))}
        </div>

        {/* Audio Coach Test Button */}
        <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
          <span className="text-xs text-zinc-400">Audio Coach Check:</span>
          <button
            onClick={testVoice}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-amber-300 border border-zinc-700 active:scale-95"
          >
            <Volume2 className="w-3.5 h-3.5" />
            Test Voice
          </button>
        </div>
      </div>

      {/* Footer / Start Action */}
      <div className="pb-6 space-y-3">
        {isHost ? (
          <button
            onClick={onStartRun}
            className="w-full py-4 rounded-2xl font-bold text-base tracking-wide bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 text-black shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-black" />
            START RUN FOR EVERYONE
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1">
            <div className="text-sm font-semibold text-zinc-300 animate-pulse">
              Waiting for Host to start the run...
            </div>
            <div className="text-xs text-zinc-500">
              Put your earbuds in and get ready to touch grass!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
