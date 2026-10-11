import React, { useState, useEffect, useRef } from "react";
import { io as SocketClient } from "socket.io-client";
import Home from "./pages/Home";
import Lobby from "./pages/Lobby";
import LiveRun from "./pages/LiveRun";
import Result from "./pages/Result";
import TierBanner from "./components/TierBanner";
import { voiceCoach } from "./utils/voice";

// Determine API / WS base URL
const SERVER_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3001`
    : "http://localhost:3001");

export default function App() {
  const [page, setPage] = useState("home"); // 'home' | 'lobby' | 'live' | 'result'
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [roomState, setRoomState] = useState(null);
  const [unlockedTierData, setUnlockedTierData] = useState(null);
  const [resultData, setResultData] = useState(null);

  // Persistent user device ID
  const [userId] = useState(() => {
    let id = localStorage.getItem("tgr_user_id");
    if (!id) {
      id = "usr_" + Math.random().toString(36).substring(2, 10);
      localStorage.setItem("tgr_user_id", id);
    }
    return id;
  });

  const socketRef = useRef(null);

  // Initialize or teardown socket on room/page change
  useEffect(() => {
    if (!room || (page !== "lobby" && page !== "live")) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const socket = SocketClient(SERVER_URL, {
      query: {
        roomId: room.id,
        userId: userId,
        displayName: localStorage.getItem("tgr_name") || "Runner",
      },
    });

    socketRef.current = socket;

    socket.on("state", (state) => {
      setRoomState(state);
    });

    socket.on("member_joined", ({ name }) => {
      voiceCoach.speak(`${name} joined the squad.`);
      // Refresh room data
      fetchRoom(room.id);
    });

    socket.on("member_left", ({ name }) => {
      fetchRoom(room.id);
    });

    socket.on("run_started", () => {
      voiceCoach.speak("The run has started! Pocket your phone and get outside!", true);
      setPage("live");
    });

    socket.on("tier_unlocked", (tierData) => {
      // Voice Coach priority speech
      voiceCoach.speak(tierData.voiceLine, true);
      // Trigger dramatic anime popup banner
      setUnlockedTierData(tierData);
    });

    socket.on("run_ended", (result) => {
      voiceCoach.speak(`Run complete! Your squad covered ${result.totalKm} km and hit ${result.finalTier}!`, true);
      setResultData(result);
      setPage("result");
    });

    return () => {
      socket.disconnect();
    };
  }, [room?.id, page, userId]);

  const fetchRoom = async (roomId) => {
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${roomId}`);
      const data = await res.json();
      if (res.ok && data.room) {
        setRoom(data.room);
      }
    } catch (e) {
      console.error("Failed to fetch room:", e);
    }
  };

  const handleCreateRoom = async (displayName, targetKm) => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, targetKm, deviceId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create room");

      setRoom(data.room);
      setRoomState({
        totalKm: 0,
        currentTier: "Base Form",
        members: data.room.members || [],
      });
      setPage("lobby");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (code, displayName) => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, displayName, deviceId: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to join room");

      setRoom(data.room);
      setRoomState({
        totalKm: data.room.totalKm || 0,
        currentTier: data.room.currentTier || "Base Form",
        members: data.room.members || [],
      });
      setPage(data.room.status === "live" ? "live" : "lobby");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRun = async () => {
    if (!room) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${room.id}/start-and-broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start run");
      setPage("live");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStopRun = async () => {
    if (!room) return;
    if (!window.confirm("End the run for the entire squad?")) return;
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/${room.id}/stop-and-broadcast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to stop run");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendPoints = (batch) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit("points", { batch });
    }
  };

  const handleRestart = () => {
    setRoom(null);
    setRoomState(null);
    setResultData(null);
    setUnlockedTierData(null);
    setPage("home");
  };

  return (
    <div className="min-h-screen bg-[#090d16] text-white">
      {/* Tier Unlock Celebration Modal */}
      <TierBanner
        tierData={unlockedTierData}
        onClose={() => setUnlockedTierData(null)}
      />

      {page === "home" && (
        <Home
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          loading={loading}
        />
      )}

      {page === "lobby" && room && (
        <Lobby
          room={room}
          userId={userId}
          onStartRun={handleStartRun}
        />
      )}

      {page === "live" && (
        <LiveRun
          roomState={roomState}
          userId={userId}
          onSendPoints={handleSendPoints}
          onStopRun={handleStopRun}
          isHost={room?.hostId === userId}
        />
      )}

      {page === "result" && (
        <Result
          result={resultData}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
