import { Server, Socket } from 'socket.io';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Game } from '../game/Game.js';
import { PlayerInput, GAME_CONFIG } from '@awsome-tank-shooter/shared';

export function setupSocketHandlers(
  io: Server,
  game: Game,
  docClient: DynamoDBDocumentClient
): void {
  console.log('Setting up Socket.IO handlers');

  // Set global io reference for use in game class
  global.io = io;

  // Game loop interval (60 FPS)
  const TICK_RATE = 1000 / GAME_CONFIG.SERVER_TICK_RATE;
  let gameLoop: NodeJS.Timeout;

  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', {
      id: socket.id,
      transport: socket.conn.transport.name,
      remoteAddress: socket.handshake.address
    });

    // Handle player joining
    socket.on('join', async (data: { name: string }) => {
      console.log('Player joining:', {
        id: socket.id,
        name: data.name
      });

      try {
        const player = game.addPlayer(socket.id, data.name);
        console.log('Player added to game:', {
          id: socket.id,
          name: data.name,
          totalPlayers: game.getState().players.length
        });
        
        // Emit joinConfirmed event to the player who joined
        socket.emit('joinConfirmed', { 
          id: socket.id,
          gameState: game.getState()
        });
        
        // Emit playerJoined event to all clients
        io.emit('playerJoined', player);
        io.emit('gameState', game.getState());
      } catch (error) {
        console.error('Error adding player to game:', error);
      }
    });

    // Handle player input
    socket.on('input', (input: PlayerInput) => {
      game.updatePlayerInput(socket.id, input);
    });

    // Handle player leaving explicitly
    socket.on('leave', () => {
      console.log('Player left:', socket.id);
      game.removePlayer(socket.id);
      io.emit('playerLeft', socket.id);
      io.emit('gameState', game.getState());
    });

    // Handle player disconnection
    socket.on('disconnect', () => {
      console.log('Player disconnected:', socket.id);
      game.removePlayer(socket.id);
      io.emit('playerLeft', socket.id);
      io.emit('gameState', game.getState());
    });
  });

  // Start game loop with high-resolution timer
  let lastTickTime = Date.now();
  gameLoop = setInterval(() => {
    const now = Date.now();
    const dt = (now - lastTickTime) / 1000;
    lastTickTime = now;

    game.update();
    io.emit('gameState', game.getState());
  }, TICK_RATE);

  // Clean up on server shutdown
  process.on('SIGTERM', () => {
    clearInterval(gameLoop);
    io.close();
  });
} 