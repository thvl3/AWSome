import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { GAME_CONFIG } from '@awsome-tank-shooter/shared';
import { Game } from './game/Game.js';
import { setupSocketHandlers } from './socket/socketHandlers.js';

const app = express();
const httpServer = createServer(app);

// Simple CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Initialize Socket.IO with minimal configuration
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['polling', 'websocket'],
  path: '/socket.io/'
});

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-west-1'
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// Initialize game state
const game = new Game();

// Setup Socket.IO handlers
setupSocketHandlers(io, game, docClient);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Game is running with ${GAME_CONFIG.MAX_PLAYERS} max players`);
  console.log(`Arena size: ${GAME_CONFIG.ARENA_WIDTH}x${GAME_CONFIG.ARENA_HEIGHT}`);
}); 