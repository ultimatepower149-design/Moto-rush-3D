import React, { useEffect } from 'react';
import { RaceSessionStats } from '../types/game';
import { sound } from '../services/audio';
import { RotateCcw, Wrench, Home, Gauge, MapPin, AlertTriangle, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  stats: RaceSessionStats;
  isNewBest: boolean;
  bestScore: number;
  totalCoins: number;
  onRestart: () => void;
  onGoToGarage: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  isNewBest,
  bestScore,
  totalCoins,
  onRestart,
  onGoToGarage,
  onMainMenu,
}) => {
  useEffect(() => {
    if (isNewBest) {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#eab308', '#ef4444', '#06b6d4'],
      });
    }
  }, [isNewBest]);

  const distanceKm = (stats.distance / 1000).toFixed(2);
  const nearMissScore = stats.nearMisses * 500;
  const overtakeScore = stats.overtakes * 150;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="carbon-panel border-2 border-red-600 p-5 sm:p-7 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="text-center">
          <div className="inline-block px-3 py-1 bg-red-600 text-white font-racing font-bold text-xs tracking-widest uppercase mb-1.5 animate-pulse">
            HIGH-SPEED COLLISION
          </div>
          <h2 className="text-3xl sm:text-5xl font-black font-racing text-white uppercase tracking-tight text-glow-red">
            GAME OVER
          </h2>
        </div>

        {/* Score Summary Box */}
        <div className="my-4 p-4 bg-black/70 border border-white/10 text-center relative overflow-hidden shadow-inner">
          {isNewBest && (
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-black px-3 py-0.5 font-racing font-black text-[10px] tracking-wider uppercase shadow-md flex items-center gap-1">
              <Award className="w-3 h-3" /> NEW HIGH SCORE!
            </div>
          )}

          <div className="text-[11px] font-racing text-zinc-400 uppercase tracking-wider">
            FINAL SCORE
          </div>
          <div className="text-4xl sm:text-5xl font-black font-racing text-white tracking-wide mt-0.5">
            {stats.score.toLocaleString()}
          </div>
          <div className="text-xs text-zinc-400 mt-1 font-racing">
            PERSONAL BEST: <span className="text-amber-300 font-bold">{bestScore.toLocaleString()}</span>
          </div>

          {/* Sub-breakdown */}
          <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-3 text-[10px] font-racing text-zinc-400">
            <div>
              <span>DIST: </span>
              <strong className="text-white">{distanceKm} KM</strong>
            </div>
            <div>
              <span>MISSES: </span>
              <strong className="text-amber-300">+{nearMissScore}</strong>
            </div>
            <div>
              <span>PASSES: </span>
              <strong className="text-cyan-300">+{overtakeScore}</strong>
            </div>
          </div>
        </div>

        {/* Stats Matrix */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-zinc-900/85 border border-white/5 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-zinc-400 font-racing">DISTANCE</div>
              <div className="font-racing font-bold text-white">{distanceKm} KM</div>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-900/85 border border-white/5 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-red-400" />
            <div>
              <div className="text-[10px] text-zinc-400 font-racing">TOP SPEED</div>
              <div className="font-racing font-bold text-white">{stats.maxSpeed} KM/H</div>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-900/85 border border-white/5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[10px] text-zinc-400 font-racing">NEAR MISSES</div>
              <div className="font-racing font-bold text-white">{stats.nearMisses}</div>
            </div>
          </div>

          <div className="p-2.5 bg-zinc-900/85 border border-white/5 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-[10px]">
              C
            </div>
            <div>
              <div className="text-[10px] text-zinc-400 font-racing">COINS EARNED</div>
              <div className="font-racing font-bold text-amber-300">+{stats.coinsCollected}</div>
            </div>
          </div>
        </div>

        {/* Total Coins in Wallet */}
        <div className="mt-3.5 p-2 bg-zinc-900/60 border border-amber-500/20 flex items-center justify-between text-xs font-racing px-3">
          <span className="text-zinc-400">TOTAL COIN BALANCE:</span>
          <span className="text-amber-300 font-bold text-sm">{totalCoins.toLocaleString()} C</span>
        </div>

        {/* Action Navigation Buttons */}
        <div className="mt-4 space-y-2">
          {/* Replay Option */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3.5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-racing font-black text-base uppercase tracking-wider border border-red-400 box-glow-red active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl"
          >
            <RotateCcw className="w-5 h-5" />
            <span>PLAY AGAIN (REPLAY)</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onGoToGarage();
              }}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-racing font-bold text-xs uppercase tracking-wider border border-zinc-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Wrench className="w-4 h-4 text-red-400" />
              <span>GARAGE</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onMainMenu();
              }}
              className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-racing font-bold text-xs uppercase tracking-wider border border-zinc-600 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Home className="w-4 h-4 text-cyan-400" />
              <span>MAIN MENU</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
