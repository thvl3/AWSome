import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/stores/gameStore';
import { GameState } from '@awsome-tank-shooter/shared';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { setGameState } = useGameStore();

  useEffect(() => {
    if (socketRef.current?.connected) return;

    const backendUrl = window.location.origin;
    console.log('Setting up socket connection to:', backendUrl);

    // Clean up any existing socket
    if (socketRef.current) {
      console.log('Cleaning up existing socket');
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // Create new socket with more stable configuration
    const socket = io(backendUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000,
      path: '/socket.io/'
    });

    socket.on('connect', () => {
      console.log('Socket connected successfully', socket.id);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('gameState', (state: GameState) => {
      console.log('Game state updated');
      setGameState(state);
    });

    socketRef.current = socket;

    return () => {
      console.log('Cleaning up socket connection');
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []); // Only run once on mount

  return socketRef.current;
} 