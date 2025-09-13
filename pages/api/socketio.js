// pages/api/socketio.js
import { Server } from "socket.io";

export default function SocketHandler(req, res) {
  if (!res.socket.server.io) {
    console.log("🔌 Initializing new Socket.io server...");

    const io = new Server(res.socket.server, {
      path: "/api/socketio",
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("✅ User connected:", socket.id);

      socket.on("join-room", ({ roomId, name }) => {
        socket.join(roomId);
        socket.data.roomId = roomId;
        socket.data.name = name;

        socket.to(roomId).emit("user-connected", { id: socket.id, name });
        console.log(`👥 ${name} (${socket.id}) joined room ${roomId}`);
      });

      socket.on("offer", ({ offer, roomId }) => {
        console.log(`📨 Offer from ${socket.data.name} to room ${roomId}`);
        socket
          .to(roomId)
          .emit("offer", { offer, sender: socket.id, name: socket.data.name });
      });

      socket.on("answer", ({ answer, roomId }) => {
        console.log(`📨 Answer from ${socket.data.name} to room ${roomId}`);
        socket
          .to(roomId)
          .emit("answer", {
            answer,
            sender: socket.id,
            name: socket.data.name,
          });
      });

      socket.on("ice-candidate", ({ candidate, roomId }) => {
        console.log(
          `📨 ICE candidate from ${socket.data.name} (${socket.id}) to room ${roomId}`
        );
        socket
          .to(roomId)
          .emit("ice-candidate", { candidate, sender: socket.id });
      });

      socket.on("disconnect", () => {
        const { roomId, name } = socket.data;
        console.log(`❌ ${name || "Unknown"} (${socket.id}) disconnected`);
        if (roomId && name) {
          socket.to(roomId).emit("user-disconnected", { id: socket.id, name });
        }
      });
    });
  } else {
    console.log("⚡ Socket.io server already running");
  }

  res.end();
}
