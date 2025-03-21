import { useGameStore } from '@/stores/gameStore';

interface ScoreboardProps {
  className?: string;
}

export function Scoreboard({ className = '' }: ScoreboardProps) {
  const gameState = useGameStore((state) => state.gameState);

  if (!gameState) return null;

  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  return (
    <div className={`bg-black/50 p-4 rounded-lg ${className}`}>
      <h2 className="text-white font-bold mb-2">Scoreboard</h2>
      <div className="space-y-1">
        {sortedPlayers.map((player) => (
          <div key={player.id} className="flex justify-between text-white">
            <span>{player.name}</span>
            <span>{player.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
} 