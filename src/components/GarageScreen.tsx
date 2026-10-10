import React, { useState } from 'react';
import { MotorcycleStats, BikeUpgrades, PlayerSaveData } from '../types/game';
import { MOTORCYCLES, calculateUpgradedBikeStats, getUpgradeCost } from '../services/storage';
import { sound } from '../services/audio';
import { ChevronLeft, ChevronRight, ArrowLeft, Check, Lock, Zap, Gauge, Disc, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GarageScreenProps {
  saveData: PlayerSaveData;
  onSelectBike: (bikeId: string) => void;
  onUpgradeBike: (bikeId: string, part: keyof BikeUpgrades) => void;
  onUnlockBike: (bikeId: string) => void;
  onBack: () => void;
  onPreviewBikeChange: (bike: MotorcycleStats) => void;
}

export const GarageScreen: React.FC<GarageScreenProps> = ({
  saveData,
  onSelectBike,
  onUpgradeBike,
  onUnlockBike,
  onBack,
  onPreviewBikeChange,
}) => {
  const initialIndex = MOTORCYCLES.findIndex(b => b.id === saveData.selectedBikeId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const bike = MOTORCYCLES[currentIndex];
  const isUnlocked = saveData.unlockedBikes.includes(bike.id);
  const isSelected = saveData.selectedBikeId === bike.id;
  const upgrades = saveData.bikeUpgrades[bike.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
  const stats = calculateUpgradedBikeStats(bike, upgrades);

  const handlePrev = () => {
    sound.playClick();
    const nextIdx = (currentIndex - 1 + MOTORCYCLES.length) % MOTORCYCLES.length;
    setCurrentIndex(nextIdx);
    onPreviewBikeChange(MOTORCYCLES[nextIdx]);
  };

  const handleNext = () => {
    sound.playClick();
    const nextIdx = (currentIndex + 1) % MOTORCYCLES.length;
    setCurrentIndex(nextIdx);
    onPreviewBikeChange(MOTORCYCLES[nextIdx]);
  };

  const handleUpgrade = (part: keyof BikeUpgrades) => {
    const level = upgrades[part] || 0;
    if (level >= 5) return;
    const cost = getUpgradeCost(level);
    if (saveData.coins < cost) {
      sound.playBrake();
      return;
    }
    sound.playRewardFanfare();
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.8 } });
    onUpgradeBike(bike.id, part);
  };

  const handleUnlock = () => {
    if (saveData.coins < bike.price) {
      sound.playBrake();
      return;
    }
    sound.playRewardFanfare();
    confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    onUnlockBike(bike.id);
  };

  const renderUpgradeBar = (part: keyof BikeUpgrades, label: string, icon: React.ReactNode) => {
    const level = upgrades[part] || 0;
    const isMax = level >= 5;
    const cost = getUpgradeCost(level);
    const canAfford = saveData.coins >= cost;

    return (
      <div className="carbon-panel border border-white/10 p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-zinc-800 text-zinc-300">
            {icon}
          </div>
          <div>
            <div className="text-xs font-racing font-bold text-zinc-200 uppercase">{label}</div>
            {/* Pip Level Indicators */}
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(step => (
                <div
                  key={step}
                  className={`w-3 h-1.5 ${
                    step <= level ? 'bg-red-500 box-glow-red' : 'bg-zinc-700'
                  }`}
                />
              ))}
              <span className="text-[10px] text-zinc-400 ml-1.5 font-racing">LVL {level}/5</span>
            </div>
          </div>
        </div>

        {/* Upgrade Button */}
        {isUnlocked && (
          <button
            onClick={() => handleUpgrade(part)}
            disabled={isMax || !canAfford}
            className={`px-3 py-1.5 text-xs font-racing font-bold uppercase transition-all active:scale-95 flex items-center gap-1.5 ${
              isMax
                ? 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                : canAfford
                ? 'bg-red-600 hover:bg-red-500 text-white border border-red-400 box-glow-red'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 opacity-60 cursor-not-allowed'
            }`}
          >
            {isMax ? (
              <span>MAXED</span>
            ) : (
              <>
                <span>UPGRADE</span>
                <span className="text-amber-300 font-normal">({cost} C)</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-6 overflow-hidden pointer-events-none">
      {/* Top Header Bar */}
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
            <span className="hidden sm:inline">BACK TO MENU</span>
          </button>
          <h2 className="text-xl sm:text-2xl font-black font-racing uppercase tracking-wider text-white">
            GARAGE & WORKSHOP
          </h2>
        </div>

        {/* Coins Display */}
        <div className="carbon-panel border border-amber-500/40 px-4 py-2 flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-xs">
            C
          </div>
          <span className="text-lg font-bold font-racing text-amber-300">
            {saveData.coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Center Bike Cycler Carousel Controls */}
      <div className="flex items-center justify-between w-full px-2 pointer-events-auto my-auto">
        <button
          onClick={handlePrev}
          className="carbon-panel border border-white/20 p-3 sm:p-4 text-white hover:border-red-500 active:scale-90 transition-all shadow-xl"
          title="Previous Motorcycle"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        <button
          onClick={handleNext}
          className="carbon-panel border border-white/20 p-3 sm:p-4 text-white hover:border-red-500 active:scale-90 transition-all shadow-xl"
          title="Next Motorcycle"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Bottom Panel: Bike Specs & Upgrades */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full pointer-events-auto max-h-[48vh] overflow-y-auto pr-1">
        {/* Left: Bike Info & Stats Radar */}
        <div className="carbon-panel border border-white/10 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-racing text-red-400 uppercase tracking-widest">
                {bike.category}
              </span>
              <span className="text-xs text-zinc-400 font-racing">
                BIKE {currentIndex + 1} OF {MOTORCYCLES.length}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black font-racing text-white uppercase mt-0.5">
              {bike.name}
            </h3>
            <p className="text-xs text-zinc-300 mt-1">{bike.tagline}</p>

            {/* Performance Bars */}
            <div className="space-y-2.5 mt-4">
              <div>
                <div className="flex justify-between text-xs font-racing mb-1">
                  <span className="text-zinc-400">TOP SPEED</span>
                  <span className="text-white font-bold">{stats.maxSpeed} KM/H</span>
                </div>
                <div className="h-2 bg-zinc-800 border border-zinc-700/50 overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${(stats.maxSpeed / 380) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-racing mb-1">
                  <span className="text-zinc-400">ACCELERATION</span>
                  <span className="text-white font-bold">{stats.acceleration} M/S²</span>
                </div>
                <div className="h-2 bg-zinc-800 border border-zinc-700/50 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${(stats.acceleration / 12) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-racing mb-1">
                  <span className="text-zinc-400">HANDLING</span>
                  <span className="text-white font-bold">{stats.handling} / 10</span>
                </div>
                <div className="h-2 bg-zinc-800 border border-zinc-700/50 overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 transition-all duration-300"
                    style={{ width: `${(stats.handling / 12) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-racing mb-1">
                  <span className="text-zinc-400">BRAKING</span>
                  <span className="text-white font-bold">{stats.braking} / 10</span>
                </div>
                <div className="h-2 bg-zinc-800 border border-zinc-700/50 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(stats.braking / 12) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Button: Select or Unlock */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            {isUnlocked ? (
              <button
                onClick={() => {
                  sound.playClick();
                  onSelectBike(bike.id);
                }}
                disabled={isSelected}
                className={`w-full py-3 font-racing font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-600/90 border border-emerald-400 text-white cursor-default'
                    : 'bg-red-600 hover:bg-red-500 border border-red-400 text-white box-glow-red'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>CURRENTLY SELECTED</span>
                  </>
                ) : (
                  <span>SELECT THIS BIKE</span>
                )}
              </button>
            ) : (
              <button
                onClick={handleUnlock}
                disabled={saveData.coins < bike.price}
                className={`w-full py-3 font-racing font-bold text-sm tracking-wider uppercase transition-all flex items-center justify-center gap-2 active:scale-95 ${
                  saveData.coins >= bike.price
                    ? 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-300 box-glow-amber'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>UNLOCK FOR {bike.price.toLocaleString()} COINS</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: 4 Upgrade Modules */}
        <div className="space-y-2">
          {renderUpgradeBar('engine', 'Engine Tuning', <Gauge className="w-4 h-4 text-red-400" />)}
          {renderUpgradeBar('brakes', 'Braking Calipers', <Disc className="w-4 h-4 text-emerald-400" />)}
          {renderUpgradeBar('handling', 'Steering & Suspension', <Activity className="w-4 h-4 text-cyan-400" />)}
          {renderUpgradeBar('nitro', 'NOS Nitro Tanks', <Zap className="w-4 h-4 text-amber-400" />)}
        </div>
      </div>
    </div>
  );
};
