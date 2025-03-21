import React, { useEffect, useRef, useState } from 'react';
import { Game as PhaserGame } from '@/game/Game';
import { useGameStore } from '@/stores/gameStore';
import { Client, Room } from 'colyseus.js';

export function Game() {
  const gameRef = useRef<PhaserGame | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const roomRef = useRef<Room<any> | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const localPlayerId = useGameStore((state) => state.localPlayerId);

  // Connect to Colyseus server
  useEffect(() => {
    if (!localPlayerId || roomRef.current) return;
    
    const connectToServer = async () => {
      try {
        setIsConnecting(true);
        setConnectionError(null);
        
        // Use dynamic endpoint based on current window location
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const endpoint = `${wsProtocol}//${window.location.hostname}:3000`;
        console.log(`Connecting to Colyseus server at ${endpoint}`);
        
        const client = new Client(endpoint);
        
        // Join the tank room
        const room = await client.joinOrCreate<any>('tank_room', { 
          playerName: localPlayerId,
          // Add a timestamp to ensure unique connections
          timestamp: Date.now()
        });
        
        console.log("Joined room:", room.roomId);
        
        // Set up error handlers
        room.onError((code, message) => {
          console.error(`Room error: ${code} - ${message}`);
          setConnectionError(`Connection error: ${message}`);
        });
        
        room.onLeave((code) => {
          console.log(`Left room: ${code}`);
          if (code > 1000) {
            setConnectionError(`Disconnected from server: ${code}`);
          }
        });
        
        roomRef.current = room;
        setIsConnecting(false);
      } catch (error) {
        console.error("Error connecting to Colyseus server:", error);
        setConnectionError(`Failed to connect: ${error instanceof Error ? error.message : String(error)}`);
        setIsConnecting(false);
      }
    };
    
    connectToServer();
    
    // Cleanup on unmount
    return () => {
      if (roomRef.current) {
        try {
          roomRef.current.leave();
        } catch (error) {
          console.error("Error leaving room:", error);
        }
        roomRef.current = null;
      }
    };
  }, [localPlayerId]);

  // Initialize game when component mounts
  useEffect(() => {
    // Clean up function for when component unmounts
    const destroyGame = () => {
      if (gameRef.current) {
        console.log('Destroying Phaser game instance');
        try {
          gameRef.current.destroy(true);
        } catch (error) {
          console.error('Error destroying game:', error);
        }
        gameRef.current = null;
      }
    };

    // Only create the game when container, room, and playerId are all ready
    if (containerRef.current && roomRef.current && localPlayerId) {
      console.log('Creating game with:', { playerId: localPlayerId, roomId: roomRef.current.roomId });
      
      // Destroy any existing game first
      destroyGame();
      
      // Create new game with Colyseus room
      gameRef.current = new PhaserGame('game-container', {
        multiplayer: true,
        room: roomRef.current,
        localPlayerId
      });
    }

    // Clean up when component unmounts
    return destroyGame;
  }, [localPlayerId, roomRef.current]);

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
      {isConnecting && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-white bg-black bg-opacity-50 p-4 rounded">
          Connecting to server...
        </div>
      )}
      
      {connectionError && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-white bg-red-900 bg-opacity-70 p-4 rounded">
          {connectionError}
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 block w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Retry Connection
          </button>
        </div>
      )}
      
      <div 
        id="game-container" 
        ref={containerRef}
        className="bg-gray-800"
        style={{ 
          width: '1900px', 
          height: '1060px',
          border: '2px solid #333'
        }}
      />
    </div>
  );
} 