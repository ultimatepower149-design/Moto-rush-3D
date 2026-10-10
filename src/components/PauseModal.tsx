import React from 'react';
import { sound } from '../services/audio';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music, Settings } from 'lucide-react';

interface PauseModalProps {
  soundEnabled: boolean;
  musicEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onOpenSettings: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  soundEnabled,
  musicEnabled,
  onResume,
  onRestart,
  onMainMenu,
  onToggleSound,
  onToggleMusic,
  onOpenSettings,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="carbon-panel border-2 border-red-500/60 p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative">
        {/* Glow Tag */}
        <div className="inline-block px-3 py-1 bg-red-600/90 text-white font-racing font-bold text-xs tracking-widest uppercase mb-2">
          SESSION PAUSED
        </div>

        <h3 className="text-3xl font-black font-racing text-white uppercase tracking-wider mb-6">
          GAME PAUSED
        </h3>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Resume */}
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-racing font-bold text-base uppercase tracking-wider border border-red-400 box-glow-red active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>RESUME RACE</span>
          </button>

          {/* Restart */}
          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-racing font-bold text-sm uppercase tracking-wider border border-zinc-600 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>RESTART RACE</span>
          </button>

          {/* Main Menu */}
          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-racing font-bold text-sm uppercase tracking-wider border border-zinc-750 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>MAIN MENU</span>
          </button>
        </div>

        {/* Bottom Audio & Settings Quick Toolbar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className={`p-2.5 carbon-panel border active:scale-95 transition-all ${
              soundEnabled ? 'border-red-500 text-red-400' : 'border-zinc-700 text-zinc-500'
            }`}
            title="Toggle Sound"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleMusic();
            }}
            className={`p-2.5 carbon-panel border active:scale-95 transition-all ${
              musicEnabled ? 'border-cyan-500 text-cyan-400' : 'border-zinc-700 text-zinc-500'
            }`}
            title="Toggle Music"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2.5 carbon-panel border border-white/20 text-white active:scale-95 transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
