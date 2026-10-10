import React from 'react';
import { PlayerSaveData, MotorcycleStats, MapConfig } from '../types/game';
import { sound } from '../services/audio';
import { Play, Wrench, Bike, Map, Trophy, Gift, Settings, Volume2, VolumeX, Music } from 'lucide-react';

interface MainMenuProps {
  saveData: PlayerSaveData;
  currentBike: MotorcycleStats;
  currentMap: MapConfig;
  onPlay: () => void;
  onOpenGarage: () => void;
  onOpenBikes: () => void;
  onOpenMaps: () => void;
  onOpenMissions: () => void;
  onOpenDaily: () => void;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  currentBike,
  currentMap,
  onPlay,
  onOpenGarage,
  onOpenBikes,
  onOpenMaps,
  onOpenMissions,
  onOpenDaily,
  onOpenSettings,
  onToggleSound,
  onToggleMusic,
}) => {
  // Check if daily reward is available today
  const todayStr = new Date().toISOString().split('T')[0];
  const canClaimDaily = saveData.lastDailyClaimDate !== todayStr;

  // Check if any missions have unclaimed rewards
  const unclaimedMissions = saveData.missions.filter(m => m.completed && !m.claimed).length;

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 overflow-hidden pointer-events-none">
      {/* --- TOP BAR: PLAYER STATS & QUICK AUDIO TOGGLES --- */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        {/* Left: Player Profile & Coins */}
        <div className="flex items-center gap-3">
          <div className="carbon-panel border border-white/10 px-4 py-2 flex items-center gap-3 shadow-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center font-racing font-black text-black shadow-md">
              C
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-racing">COINS</div>
              <div className="text-xl font-bold font-racing text-amber-300">
                {saveData.coins.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="carbon-panel border border-white/10 px-4 py-2 hidden sm:flex flex-col shadow-xl">
            <div className="text-[10px] uppercase tracking-wider text-zinc-400 font-racing">BEST SCORE</div>
            <div className="text-xl font-bold font-racing text-white">
              {saveData.bestScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Right: Audio Toggles & Settings Icon */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className={`p-2.5 carbon-panel border active:scale-95 transition-all ${
              saveData.settings.soundEnabled
                ? 'border-red-500/50 text-red-400'
                : 'border-white/10 text-zinc-500'
            }`}
            title="Toggle Sound FX"
          >
            {saveData.settings.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onToggleMusic();
            }}
            className={`p-2.5 carbon-panel border active:scale-95 transition-all ${
              saveData.settings.musicEnabled
                ? 'border-cyan-500/50 text-cyan-400'
                : 'border-white/10 text-zinc-500'
            }`}
            title="Toggle Music"
          >
            <Music className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2.5 carbon-panel border border-white/10 text-white hover:border-white/30 active:scale-95 transition-all"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* --- MIDDLE: GAME TITLE LOGO & ACTIVE LOADOUT BADGES --- */}
      <div className="flex flex-col items-start max-w-lg mt-4 sm:mt-8 pointer-events-auto">
        <div className="inline-block px-3 py-1 bg-red-600/90 text-white text-[11px] font-racing font-bold tracking-widest uppercase mb-2 shadow-md">
          ULTRA HD MOTORCYCLE RACING
        </div>

        <h1 className="text-5xl sm:text-7xl font-black font-racing tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-red-500 drop-shadow-2xl">
          MOTO RUSH <span className="text-red-500">3D</span>
        </h1>

        <p className="text-zinc-300 text-sm mt-1 sm:mt-2 max-w-sm drop-shadow">
          Weave through highway traffic at breakneck speeds. Dodge cars, collect coins, and push your machine to the limit.
        </p>

        {/* Selected Bike & Map Info Chip */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenBikes();
            }}
            className="carbon-panel border border-red-500/40 hover:border-red-400 px-3 py-1.5 flex items-center gap-2 text-xs font-racing active:scale-95 transition-all"
          >
            <Bike className="w-4 h-4 text-red-400" />
            <span className="text-zinc-400">BIKE:</span>
            <span className="text-white font-bold">{currentBike.name}</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMaps();
            }}
            className="carbon-panel border border-cyan-500/40 hover:border-cyan-400 px-3 py-1.5 flex items-center gap-2 text-xs font-racing active:scale-95 transition-all"
          >
            <Map className="w-4 h-4 text-cyan-400" />
            <span className="text-zinc-400">MAP:</span>
            <span className="text-white font-bold">{currentMap.name}</span>
          </button>
        </div>
      </div>

      {/* --- BOTTOM ROW: NAVIGATION & PROMINENT RACE BUTTON --- */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-3 w-full pointer-events-auto">
        {/* Navigation Grid */}
        <div className="grid grid-cols-3 sm:flex sm:flex-wrap gap-2">
          <button
            onClick={() => {
              sound.playClick();
              onOpenGarage();
            }}
            className="carbon-panel border border-white/10 hover:border-red-500/60 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 active:scale-95 transition-all group"
          >
            <Wrench className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-racing font-bold text-zinc-200">GARAGE</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenBikes();
            }}
            className="carbon-panel border border-white/10 hover:border-red-500/60 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 active:scale-95 transition-all group"
          >
            <Bike className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-racing font-bold text-zinc-200">BIKES</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMaps();
            }}
            className="carbon-panel border border-white/10 hover:border-red-500/60 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 active:scale-95 transition-all group"
          >
            <Map className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-racing font-bold text-zinc-200">MAPS</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenMissions();
            }}
            className="carbon-panel border border-white/10 hover:border-red-500/60 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 active:scale-95 transition-all relative group"
          >
            <Trophy className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-racing font-bold text-zinc-200">MISSIONS</span>
            {unclaimedMissions > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unclaimedMissions}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onOpenDaily();
            }}
            className="carbon-panel border border-white/10 hover:border-red-500/60 p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 active:scale-95 transition-all relative group"
          >
            <Gift className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-xs sm:text-sm font-racing font-bold text-zinc-200">REWARDS</span>
            {canClaimDaily && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-black rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                !
              </span>
            )}
          </button>
        </div>

        {/* Primary Play Button */}
        <button
          onClick={() => {
            sound.playClick();
            onPlay();
          }}
          className="w-full sm:w-auto px-8 py-4 sm:py-5 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-racing font-black text-xl sm:text-2xl tracking-wider uppercase border-2 border-red-400 box-glow-red active:scale-95 transition-all flex items-center justify-center gap-3 shadow-2xl"
        >
          <Play className="w-7 h-7 fill-white" />
          <span>START RACE</span>
        </button>
      </div>
    </div>
  );
};
