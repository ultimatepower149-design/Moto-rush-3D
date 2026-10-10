import React, { useEffect, useState } from 'react';
import { sound } from '../services/audio';

interface CountdownOverlayProps {
  onComplete: () => void;
}

export const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ onComplete }) => {
  const [count, setCount] = useState<number | string>(3);

  useEffect(() => {
    sound.playCountdown(false);

    const timer1 = setTimeout(() => {
      setCount(2);
      sound.playCountdown(false);
    }, 900);

    const timer2 = setTimeout(() => {
      setCount(1);
      sound.playCountdown(false);
    }, 1800);

    const timer3 = setTimeout(() => {
      setCount('GO!');
      sound.playCountdown(true);
    }, 2700);

    const timer4 = setTimeout(() => {
      onComplete();
    }, 3400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-25 flex items-center justify-center pointer-events-none select-none bg-black/30 backdrop-blur-[2px]">
      <div
        key={String(count)}
        className="text-center animate-in zoom-in-50 fade-in duration-300"
      >
        <div
          className={`font-black font-racing tracking-tighter uppercase drop-shadow-2xl ${
            count === 'GO!'
              ? 'text-7xl sm:text-9xl text-emerald-400 text-glow-cyan'
              : 'text-8xl sm:text-[140px] text-red-500 text-glow-red'
          }`}
        >
          {count}
        </div>
        <div className="text-sm sm:text-base font-racing tracking-widest text-white/90 uppercase mt-2">
          {count === 'GO!' ? 'FULL THROTTLE!' : 'REV YOUR ENGINES'}
        </div>
      </div>
    </div>
  );
};
