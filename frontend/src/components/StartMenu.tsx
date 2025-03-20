import { useState } from 'react';

interface StartMenuProps {
  onStart: (name: string) => void;
}

export function StartMenu({ onStart }: StartMenuProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onStart(name.trim());
    }
  };

  return (
    <div className="bg-black/50 p-8 rounded-lg backdrop-blur-sm">
      <h1 className="text-4xl font-bold text-game-primary mb-8 text-center">
        AWSome Tank Shooter
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="px-4 py-2 rounded bg-white/10 border border-white/20 focus:border-game-primary outline-none"
          maxLength={20}
          required
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!name.trim()}
        >
          Start Game
        </button>
      </form>
    </div>
  );
} 