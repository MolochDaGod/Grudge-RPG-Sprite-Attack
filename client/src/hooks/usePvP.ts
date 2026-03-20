import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

// Grudge PvP server — Railway deployment, configurable via env
const PVP_SERVER_URL = import.meta.env.VITE_PVP_SERVER_URL || "https://grudge-pvp-server-production.up.railway.app";

export type PvPState = "disconnected" | "connected" | "in-room" | "waiting" | "ready" | "fighting" | "opponent-left";

export interface PvPHook {
  state: PvPState;
  roomId: string | null;
  mySlot: "p1" | "p2" | null;
  opponentCharacter: string | null;
  error: string | null;
  fightData: { p1Character: string; p2Character: string } | null;

  connect: () => void;
  disconnect: () => void;
  createRoom: () => void;
  joinRoom: (code: string) => void;
  pickCharacter: (characterId: string) => void;
  setReady: () => void;
  sendInput: (keys: string[]) => void;
  sendAction: (action: string, params?: Record<string, unknown>) => void;
  onRemoteInput: (handler: (data: { frame: number; keys: string[] }) => void) => void;
  onRemoteAction: (handler: (data: { action: string; params?: Record<string, unknown> }) => void) => void;
}

export function usePvP(): PvPHook {
  const socketRef = useRef<Socket | null>(null);
  const remoteInputHandlerRef = useRef<((data: { frame: number; keys: string[] }) => void) | null>(null);
  const remoteActionHandlerRef = useRef<((data: { action: string; params?: Record<string, unknown> }) => void) | null>(null);
  const frameRef = useRef(0);

  const [state, setState] = useState<PvPState>("disconnected");
  const [roomId, setRoomId] = useState<string | null>(null);
  const [mySlot, setMySlot] = useState<"p1" | "p2" | null>(null);
  const [opponentCharacter, setOpponentCharacter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fightData, setFightData] = useState<{ p1Character: string; p2Character: string } | null>(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    setError(null);
    setState("disconnected");

    const socket = io(PVP_SERVER_URL, {
      path: "/pvp",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 3,
      timeout: 5000,
    });

    socket.on("connect", () => {
      setState("connected");
      setError(null);
    });

    socket.on("connect_error", () => {
      setError(
        PVP_SERVER_URL === window.location.origin
          ? "PvP server not running. Start with: npm run dev (runs on localhost:5000)"
          : `Cannot reach PvP server at ${PVP_SERVER_URL}. Server may be offline.`
      );
      setState("disconnected");
      socket.disconnect();
    });

    socket.on("room:opponent-joined", () => {
      setState("waiting");
    });

    socket.on("room:opponent-picked", (data: { characterId: string }) => {
      setOpponentCharacter(data.characterId);
    });

    socket.on("fight:start", (data: { p1Character: string; p2Character: string }) => {
      setFightData(data);
      setState("fighting");
    });

    socket.on("input:remote", (data: { frame: number; keys: string[] }) => {
      remoteInputHandlerRef.current?.(data);
    });

    socket.on("action:remote", (data: { action: string; params?: Record<string, unknown> }) => {
      remoteActionHandlerRef.current?.(data);
    });

    socket.on("room:opponent-left", () => {
      setState("opponent-left");
    });

    socket.on("disconnect", () => {
      setState("disconnected");
    });

    socketRef.current = socket;
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setState("disconnected");
    setRoomId(null);
    setMySlot(null);
    setOpponentCharacter(null);
    setFightData(null);
    setError(null);
  }, []);

  const createRoom = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit("room:create", (data: { roomId: string; slot: string }) => {
      setRoomId(data.roomId);
      setMySlot(data.slot as "p1" | "p2");
      setState("in-room");
    });
  }, []);

  const joinRoom = useCallback((code: string) => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit("room:join", code.toUpperCase(), (data: { success: boolean; error?: string; slot?: string; opponentCharacter?: string | null }) => {
      if (!data.success) {
        setError(data.error ?? "Failed to join");
        return;
      }
      setRoomId(code.toUpperCase());
      setMySlot(data.slot as "p1" | "p2");
      if (data.opponentCharacter) setOpponentCharacter(data.opponentCharacter);
      setState("waiting");
    });
  }, []);

  const pickCharacter = useCallback((characterId: string) => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomId) return;
    socket.emit("room:pick", { roomId, characterId });
  }, [roomId]);

  const setReady = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomId) return;
    socket.emit("room:ready", { roomId });
    setState("ready");
  }, [roomId]);

  const sendInput = useCallback((keys: string[]) => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomId) return;
    frameRef.current++;
    socket.volatile.emit("input", { roomId, frame: frameRef.current, keys });
  }, [roomId]);

  const sendAction = useCallback((action: string, params?: Record<string, unknown>) => {
    const socket = socketRef.current;
    if (!socket?.connected || !roomId) return;
    socket.emit("action", { roomId, action, params });
  }, [roomId]);

  const onRemoteInput = useCallback((handler: (data: { frame: number; keys: string[] }) => void) => {
    remoteInputHandlerRef.current = handler;
  }, []);

  const onRemoteAction = useCallback((handler: (data: { action: string; params?: Record<string, unknown> }) => void) => {
    remoteActionHandlerRef.current = handler;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return {
    state, roomId, mySlot, opponentCharacter, error, fightData,
    connect, disconnect, createRoom, joinRoom, pickCharacter, setReady,
    sendInput, sendAction, onRemoteInput, onRemoteAction,
  };
}
