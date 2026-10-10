import React, { useState } from 'react';
import { GameSettings, GraphicsQuality, CameraMode } from '../types/game';
import { sound } from '../services/audio';
import { ArrowLeft, Volume2, Music, Monitor, Smartphone, RotateCcw, AlertTriangle } from 'lucide-react';

interface SettingsScreenProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onResetProgress: () => void;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
  onBack,
}) => {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const update = (partial: Partial<GameSettings>) => {
    const next = { ...settings, ...partial };
    onUpdateSettings(next);
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-6 overflow-hidden pointer-events-none">
      {/* Header */}
      <div className="flex items-center justify-between w-full pointer-events-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="carbon-panel border border-white/20 p-2.5 sm:px-4 sm:py-2.5 text-white active:scale-95 flex items-center gap-2 font-racing text-xs sm:text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">BACK</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black font-racing uppercase tracking-wider text-white">
            GAME SETTINGS
          </h2>
        </div>
      </div>

      {/* Settings Options Grid */}
      <div className="my-auto py-3 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pointer-events-auto overflow-y-auto max-h-[76vh] pr-1">
        {/* Audio Card */}
        <div className="carbon-panel border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-red-400 font-racing font-bold text-sm uppercase">
            <Volume2 className="w-4 h-4" /> AUDIO SETTINGS
          </div>

          {/* Master Volume */}
          <div>
            <div className="flex justify-between text-xs font-racing mb-1">
              <span className="text-zinc-400">MASTER VOLUME</span>
              <span className="text-white font-bold">{Math.round(settings.masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.masterVolume}
              onChange={e => update({ masterVolume: parseFloat(e.target.value) })}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          {/* SFX Volume */}
          <div>
            <div className="flex justify-between text-xs font-racing mb-1">
              <span className="text-zinc-400">SOUND EFFECTS (SFX)</span>
              <span className="text-white font-bold">{Math.round(settings.sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={e => update({ sfxVolume: parseFloat(e.target.value) })}
              className="w-full accent-red-500 cursor-pointer"
            />
          </div>

          {/* Music Volume */}
          <div>
            <div className="flex justify-between text-xs font-racing mb-1">
              <span className="text-zinc-400">RACING SYNTH MUSIC</span>
              <span className="text-white font-bold">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={e => update({ musicVolume: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
          </div>

          {/* Quick Mute Toggles */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => update({ soundEnabled: !settings.soundEnabled })}
              className={`py-2 text-xs font-racing font-bold border transition-all ${
                settings.soundEnabled
                  ? 'border-red-500 bg-red-950/40 text-red-200'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-500'
              }`}
            >
              SOUND: {settings.soundEnabled ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => update({ musicEnabled: !settings.musicEnabled })}
              className={`py-2 text-xs font-racing font-bold border transition-all ${
                settings.musicEnabled
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-200'
                  : 'border-zinc-700 bg-zinc-900 text-zinc-500'
              }`}
            >
              MUSIC: {settings.musicEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Graphics & Performance Card */}
        <div className="carbon-panel border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-cyan-400 font-racing font-bold text-sm uppercase">
            <Monitor className="w-4 h-4" /> GRAPHICS & VISUALS
          </div>

          <div>
            <div className="text-xs font-racing text-zinc-400 mb-2">GRAPHICS PRESET</div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {(['low', 'medium', 'high', 'ultra'] as GraphicsQuality[]).map(q => (
                <button
                  key={q}
                  onClick={() => {
                    sound.playClick();
                    update({ graphicsQuality: q });
                  }}
                  className={`py-2 text-[11px] sm:text-xs font-racing font-bold uppercase border transition-all ${
                    settings.graphicsQuality === q
                      ? 'border-cyan-400 bg-cyan-600/30 text-cyan-200 box-glow-cyan'
                      : 'border-white/10 bg-zinc-900/60 text-zinc-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1.5">
              {settings.graphicsQuality === 'ultra' && 'Ultra 2K shadow maps, high-fidelity antialiasing, bloom-grade lights, and max particle effects.'}
              {settings.graphicsQuality === 'high' && 'Full dynamic shadows, high-res materials, and soft lighting.'}
              {settings.graphicsQuality === 'medium' && 'Balanced performance and clean textures for smooth mobile 60 FPS.'}
              {settings.graphicsQuality === 'low' && 'Optimized shaders and minimal shadows for maximum battery life.'}
            </div>
          </div>

          {/* Camera Shake */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <div>
              <div className="text-xs font-racing font-bold text-zinc-200">HIGH-SPEED CAMERA SHAKE</div>
              <div className="text-[11px] text-zinc-400">Dynamic rumble effect at high velocity</div>
            </div>
            <button
              onClick={() => update({ cameraShake: !settings.cameraShake })}
              className={`px-3 py-1.5 text-xs font-racing font-bold border ${
                settings.cameraShake ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300' : 'border-zinc-700 text-zinc-500'
              }`}
            >
              {settings.cameraShake ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>

        {/* Controls & Handling Card */}
        <div className="carbon-panel border border-white/10 p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2 text-amber-400 font-racing font-bold text-sm uppercase">
            <Smartphone className="w-4 h-4" /> CONTROLS & CAMERA
          </div>

          {/* Steering Sensitivity */}
          <div>
            <div className="flex justify-between text-xs font-racing mb-1">
              <span className="text-zinc-400">STEERING SENSITIVITY</span>
              <span className="text-white font-bold">{settings.steeringSensitivity.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.steeringSensitivity}
              onChange={e => update({ steeringSensitivity: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Default Camera Mode */}
          <div>
            <div className="text-xs font-racing text-zinc-400 mb-2">DEFAULT CAMERA VIEW</div>
            <div className="grid grid-cols-3 gap-2">
              {(['chase', 'cockpit', 'far'] as CameraMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => {
                    sound.playClick();
                    update({ cameraMode: mode });
                  }}
                  className={`py-2 text-xs font-racing font-bold uppercase border transition-all ${
                    settings.cameraMode === mode
                      ? 'border-amber-400 bg-amber-600/30 text-amber-200'
                      : 'border-white/10 bg-zinc-900/60 text-zinc-400'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danger Zone: Reset Data */}
        <div className="carbon-panel border border-red-500/20 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-400 font-racing font-bold text-sm uppercase mb-1">
              <AlertTriangle className="w-4 h-4" /> DANGER ZONE
            </div>
            <p className="text-xs text-zinc-400">
              Clear all local high scores, earned coins, unlocked motorcycles, and upgrade levels.
            </p>
          </div>

          <div className="mt-4">
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-700/60 text-xs font-racing font-bold uppercase transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>RESET SAVED PROGRESS</span>
              </button>
            ) : (
              <div className="p-3 bg-red-950/90 border border-red-500 space-y-2">
                <div className="text-xs text-red-200 font-racing font-bold text-center">
                  ARE YOU ABSOLUTELY SURE? THIS CANNOT BE UNDONE.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      sound.playClick();
                      setShowResetConfirm(false);
                      onResetProgress();
                    }}
                    className="py-1.5 bg-red-600 text-white font-racing font-bold text-xs uppercase"
                  >
                    YES, RESET
                  </button>
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="py-1.5 bg-zinc-800 text-zinc-300 font-racing font-bold text-xs uppercase"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
