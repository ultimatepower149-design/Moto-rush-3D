import React from 'react';
import { MotorcycleStats, PlayerSaveData } from '../types/game';
import { MOTORCYCLES, calculateUpgradedBikeStats } from '../services/storage';
import { sound } from '../services/audio';
import { ArrowLeft, Check, Lock, Zap } from 'lucide-react';

interface BikeSelectionScreenProps {
  saveData: PlayerSaveData;
  onSelectBike: (bikeId: string) => void;
  onGoToGarage: (bikeId: string) => void;
  onBack: () => void;
}

export const BikeSelectionScreen: React.FC<BikeSelectionScreenProps> = ({
  saveData,
  onSelectBike,
  onGoToGarage,
  onBack,
}) => {
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
            SELECT MOTORCYCLE
          </h2>
        </div>

        <div className="carbon-panel border border-amber-500/40 px-4 py-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-xs">
            C
          </div>
          <span className="text-lg font-bold font-racing text-amber-300">
            {saveData.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Grid of 8 Bikes */}
      <div className="my-auto py-3 grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 pointer-events-auto overflow-y-auto max-h-[78vh] pr-1">
        {MOTORCYCLES.map(bike => {
          const isUnlocked = saveData.unlockedBikes.includes(bike.id);
          const isSelected = saveData.selectedBikeId === bike.id;
          const upgrades = saveData.bikeUpgrades[bike.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
          const stats = calculateUpgradedBikeStats(bike, upgrades);

          return (
            <div
              key={bike.id}
              className={`carbon-panel border p-3 sm:p-4 flex flex-col justify-between transition-all relative overflow-hidden group ${
                isSelected
                  ? 'border-red-500 box-glow-red bg-red-950/20'
                  : isUnlocked
                  ? 'border-white/20 hover:border-white/50'
                  : 'border-zinc-800 opacity-80'
              }`}
            >
              {/* Bike Color Accent Bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: bike.color }}
              />

              <div>
                <div className="flex items-center justify-between text-[10px] font-racing text-zinc-400 uppercase">
                  <span>{bike.category}</span>
                  {isSelected && (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> ACTIVE
                    </span>
                  )}
                </div>

                <h4 className="text-base sm:text-lg font-black font-racing text-white uppercase mt-1">
                  {bike.name}
                </h4>

                {/* Bike Color Swatch Pill */}
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className="w-4 h-4 rounded-full border border-white/40 shadow-sm"
                    style={{ backgroundColor: bike.color }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border border-white/20"
                    style={{ backgroundColor: bike.accentColor }}
                  />
                  <span className="text-xs text-zinc-400 font-racing ml-1">
                    {stats.maxSpeed} KM/H
                  </span>
                </div>

                {/* Quick Stats list */}
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between text-zinc-400">
                    <span>ACCEL</span>
                    <span className="text-white font-racing">{stats.acceleration}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>HANDLING</span>
                    <span className="text-white font-racing">{stats.handling}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>NITRO</span>
                    <span className="text-cyan-400 font-racing flex items-center gap-1">
                      <Zap className="w-3 h-3" /> {stats.nitroDuration}s
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                {isUnlocked ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onSelectBike(bike.id);
                    }}
                    disabled={isSelected}
                    className={`w-full py-2 text-xs font-racing font-bold uppercase transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-emerald-600/80 text-white cursor-default'
                        : 'bg-red-600 hover:bg-red-500 text-white border border-red-400'
                    }`}
                  >
                    {isSelected ? 'SELECTED' : 'SELECT BIKE'}
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onGoToGarage(bike.id);
                    }}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-xs font-racing font-bold uppercase border border-amber-500/40 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{bike.price.toLocaleString()} C</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playClick();
                    onGoToGarage(bike.id);
                  }}
                  className="w-full py-1 text-[11px] font-racing text-zinc-400 hover:text-white hover:underline uppercase text-center"
                >
                  UPGRADE IN GARAGE
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
