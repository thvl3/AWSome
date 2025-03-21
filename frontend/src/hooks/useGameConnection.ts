import { useCallback, useEffect } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { useSocket } from './useSocket';
import { GameState } from '@awsome-tank-shooter/shared';

export function useGameConnection() {
  const socket = useSocket();
  const setLocalPlayerId = useGameStore((state) => state.setLocalPlayerId);
  const setIsPlaying = useGameStore((state) => state.setIsPlaying);
  const setGameState = useGameStore((state) => state.setGameState);

  // Reset game state when socket disconnects
  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      setIsPlaying(false);
      setLocalPlayerId('');
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
    };
  }, [socket, setIsPlaying, setLocalPlayerId]);

  const connect = useCallback((playerName: string) => {
    if (!socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    console.log('Attempting to join game with name:', playerName);
    socket.emit('join', { name: playerName });

    // Listen for join confirmation
    const handleJoinConfirmation = (data: { id: string, gameState: GameState }) => {
      console.log('Join confirmed with ID:', data.id);
      setLocalPlayerId(data.id);
      setGameState(data.gameState);
      setIsPlaying(true);
    };

    // Listen for player joined event
    const handlePlayerJoined = (player: any) => {
      console.log('Player joined event received:', player);
    };

    socket.on('joinConfirmed', handleJoinConfirmation);
    socket.on('playerJoined', handlePlayerJoined);

    // Clean up listeners after a short delay to ensure they're processed
    setTimeout(() => {
      socket.off('joinConfirmed', handleJoinConfirmation);
      socket.off('playerJoined', handlePlayerJoined);
    }, 5000);

  }, [socket, setLocalPlayerId, setIsPlaying, setGameState]);

  const disconnect = useCallback(() => {
    if (!socket?.connected) return;
    
    console.log('Disconnecting from game');
    socket.emit('leave');
    setLocalPlayerId('');
    setIsPlaying(false);
  }, [socket, setLocalPlayerId, setIsPlaying]);

  return { connect, disconnect };
} 