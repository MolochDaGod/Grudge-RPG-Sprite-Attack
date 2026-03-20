import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { log } from "./index";

interface RoomPlayer {
  socketId: string;
  characterId: string | null;
  ready: boolean;
  slot: "p1" | "p2";
}

interface Room {
  id: string;
  players: RoomPlayer[];
  started: boolean;
  createdAt: number;
}

const rooms = new Map<string, Room>();

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  // Ensure unique
  return rooms.has(code) ? generateRoomCode() : code;
}

// Clean up stale rooms older than 10 minutes
function cleanupRooms() {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (now - room.createdAt > 10 * 60 * 1000 && !room.started) {
      rooms.delete(id);
    }
  }
}

export function setupPvP(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/pvp",
  });

  setInterval(cleanupRooms, 60_000);

  io.on("connection", (socket: Socket) => {
    log(`PvP client connected: ${socket.id}`, "pvp");

    // Create a new room
    socket.on("room:create", (callback: (data: { roomId: string; slot: string }) => void) => {
      const roomId = generateRoomCode();
      const room: Room = {
        id: roomId,
        players: [{ socketId: socket.id, characterId: null, ready: false, slot: "p1" }],
        started: false,
        createdAt: Date.now(),
      };
      rooms.set(roomId, room);
      socket.join(roomId);
      log(`Room ${roomId} created by ${socket.id}`, "pvp");
      callback({ roomId, slot: "p1" });
    });

    // Join an existing room
    socket.on("room:join", (roomId: string, callback: (data: { success: boolean; error?: string; slot?: string; opponentCharacter?: string | null }) => void) => {
      const room = rooms.get(roomId.toUpperCase());
      if (!room) {
        callback({ success: false, error: "Room not found" });
        return;
      }
      if (room.players.length >= 2) {
        callback({ success: false, error: "Room is full" });
        return;
      }
      if (room.started) {
        callback({ success: false, error: "Match already started" });
        return;
      }

      room.players.push({ socketId: socket.id, characterId: null, ready: false, slot: "p2" });
      socket.join(roomId);
      log(`${socket.id} joined room ${roomId}`, "pvp");

      // Notify P1 that P2 joined
      const p1 = room.players.find(p => p.slot === "p1");
      if (p1) {
        io.to(p1.socketId).emit("room:opponent-joined");
      }

      callback({ success: true, slot: "p2", opponentCharacter: p1?.characterId ?? null });
    });

    // Player picks a character
    socket.on("room:pick", (data: { roomId: string; characterId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player) return;

      player.characterId = data.characterId;

      // Notify opponent of the pick
      const opponent = room.players.find(p => p.socketId !== socket.id);
      if (opponent) {
        io.to(opponent.socketId).emit("room:opponent-picked", { characterId: data.characterId });
      }
    });

    // Player signals ready
    socket.on("room:ready", (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      const player = room.players.find(p => p.socketId === socket.id);
      if (!player || !player.characterId) return;

      player.ready = true;

      // Check if both players are ready
      if (room.players.length === 2 && room.players.every(p => p.ready)) {
        room.started = true;
        const p1 = room.players.find(p => p.slot === "p1")!;
        const p2 = room.players.find(p => p.slot === "p2")!;

        log(`Room ${data.roomId} starting: ${p1.characterId} vs ${p2.characterId}`, "pvp");

        io.to(data.roomId).emit("fight:start", {
          p1Character: p1.characterId,
          p2Character: p2.characterId,
        });
      }
    });

    // Relay game inputs
    socket.on("input", (data: { roomId: string; frame: number; keys: string[] }) => {
      // Broadcast to the other player in the room
      socket.to(data.roomId).emit("input:remote", {
        frame: data.frame,
        keys: data.keys,
      });
    });

    // Relay game actions (attacks, specials, supers)
    socket.on("action", (data: { roomId: string; action: string; params?: Record<string, unknown> }) => {
      socket.to(data.roomId).emit("action:remote", {
        action: data.action,
        params: data.params,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      log(`PvP client disconnected: ${socket.id}`, "pvp");

      // Find and clean up rooms this player was in
      for (const [roomId, room] of rooms) {
        const idx = room.players.findIndex(p => p.socketId === socket.id);
        if (idx !== -1) {
          room.players.splice(idx, 1);
          // Notify remaining player
          io.to(roomId).emit("room:opponent-left");

          if (room.players.length === 0) {
            rooms.delete(roomId);
            log(`Room ${roomId} deleted (empty)`, "pvp");
          }
        }
      }
    });
  });

  log("PvP WebSocket server ready on /pvp", "pvp");
  return io;
}
