import { useEffect, useState } from 'react';

interface KeyState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
}

export function useKeyboard() {
  const [keys, setKeys] = useState<KeyState>({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.repeat) {
        const key = e.key.toLowerCase();
        if (key in keys) {
          console.log('Key down:', key);
          setKeys(prev => ({ ...prev, [key]: true }));
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keys) {
        console.log('Key up:', key);
        setKeys(prev => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return keys;
} 