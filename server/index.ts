import { Server } from "colyseus";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { TankRoom } from "./rooms/TankRoom.js";

// Get port from environment variable for Docker compatibility
const port = Number(process.env.PORT || 3000);
// Get host from environment variable, default to 0.0.0.0 to bind to all interfaces
const host = process.env.HOST || "0.0.0.0";
const app = express();

// Log server info
console.log("Starting server with:");
console.log(`- Node.js version: ${process.version}`);
console.log(`- ESM: ${typeof import.meta !== "undefined" ? "enabled" : "disabled"}`);
console.log(`- Host: ${host}`);
console.log(`- Port: ${port}`);

app.use(cors({
  origin: "*" // Allow all origins for development
}));
app.use(express.json());

const server = createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({
    server,
    pingInterval: 5000, // Send ping every 5 seconds
    pingMaxRetries: 3   // Allow 3 failed pings before disconnect
  })
});

// Register TankRoom as "tank_room"
gameServer.define("tank_room", TankRoom);

// Start listening for connections
gameServer.listen(port, host).then(() => {
  console.log(`🚀 Colyseus server is running on http://${host}:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Simple health check route
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Serve static files from the frontend/dist directory
app.use(express.static("frontend/dist")); 