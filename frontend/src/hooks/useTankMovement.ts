import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '@/stores/gameStore';
import { GAME_CONFIG } from '@awsome-tank-shooter/shared';
import { useSocket } from './useSocket';

export function useTankMovement() {
  const { gameState, localPlayerId, isPlaying } = useGameStore();
  const socket = useSocket();
  
  const keysRef = useRef({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  });
  const mouseRef = useRef({ x: 0, y: 0 });
  const isSetupRef = useRef(false);

  // Memoize functions to prevent unnecessary re-renders
  const calculateAngle = useCallback((tankX: number, tankY: number, mouseX: number, mouseY: number) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return 0;

    const rect = canvas.getBoundingClientRect();
    const scale = canvas.width / rect.width;
    
    const dx = (mouseX * scale) - (tankX + GAME_CONFIG.TANK_SIZE / 2);
    const dy = (mouseY * scale) - (tankY + GAME_CONFIG.TANK_SIZE / 2);
    return Math.atan2(dy, dx);
  }, []);

  const sendInput = useCallback(() => {
    if (!socket?.connected || !isPlaying || !gameState || !localPlayerId) return;

    const localTank = gameState.players.find(tank => tank.id === localPlayerId);
    if (!localTank) return;

    const input = {
      up: keysRef.current.w,
      down: keysRef.current.s,
      left: keysRef.current.a,
      right: keysRef.current.d,
      shooting: keysRef.current.space,
      angle: calculateAngle(
        localTank.x,
        localTank.y,
        mouseRef.current.x,
        mouseRef.current.y
      )
    };

    socket.volatile.emit('input', input);
  }, [socket, isPlaying, gameState, localPlayerId, calculateAngle]);

  // Set up event handlers
  const handleKeyEvent = useCallback((e: KeyboardEvent, isDown: boolean) => {
    const key = e.key.toLowerCase();
    if (key in keysRef.current) {
      e.preventDefault();
      keysRef.current[key as keyof typeof keysRef.current] = isDown;
      sendInput();
    }
  }, [sendInput]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    sendInput();
  }, [sendInput]);

  // Main effect for setting up event listeners
  useEffect(() => {
    if (!socket?.connected || !isPlaying || isSetupRef.current) return;
    isSetupRef.current = true;

    console.log('Setting up tank movement for player:', localPlayerId);

    const handleKeyDown = (e: KeyboardEvent) => handleKeyEvent(e, true);
    const handleKeyUp = (e: KeyboardEvent) => handleKeyEvent(e, false);
    const intervalId = setInterval(sendInput, 50);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      isSetupRef.current = false;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(intervalId);
    };
  }, [socket, isPlaying, localPlayerId, handleKeyEvent, handleMouseMove, sendInput]);

  return {};
} 