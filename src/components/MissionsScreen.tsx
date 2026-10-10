import React from 'react';
import { PlayerSaveData, Mission } from '../types/game';
import { sound } from '../services/audio';
import { ArrowLeft, Check, Trophy, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface MissionsScreenProps {
  saveData: PlayerSaveData;
  onClaimReward: (missionId: string) => void;
  onBack: () => void;
}

export const MissionsScreen: React.FC<MissionsScreenProps> = ({
  saveData,
  onClaimReward,
  onBack,
}) => {
  const handleClaim = (mission: Mission) => {
    sound.playRewardFanfare();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    onClaimReward(mission.id);
  };

  const completedCount = saveData.missions.filter(m => m.completed).length;

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
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-racing uppercase tracking-wider text-white">
              RACING MISSIONS & FEATS
            </h2>
            <div className="text-xs text-zinc-400 font-racing">
              COMPLETED: {completedCount} / {saveData.missions.length}
            </div>
          </div>
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

      {/* Mission Cards Grid */}
      <div className="my-auto py-3 grid grid-cols-1 md:grid-cols-2 gap-3 pointer-events-auto overflow-y-auto max-h-[76vh] pr-1">
        {saveData.missions.map(mission => {
          const progressPct = Math.min(100, (mission.current / mission.target) * 100);
          const canClaim = mission.completed && !mission.claimed;

          return (
            <div
              key={mission.id}
              className={`carbon-panel border p-4 flex flex-col justify-between transition-all ${
                mission.claimed
                  ? 'border-zinc-800 opacity-60'
                  : canClaim
                  ? 'border-amber-500/80 box-glow-amber bg-amber-950/20'
                  : 'border-white/10'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-zinc-800 text-amber-400">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold font-racing text-white uppercase">
                        {mission.title}
                      </h4>
                      <p className="text-xs text-zinc-300 mt-0.5">{mission.description}</p>
                    </div>
                  </div>

                  {/* Reward Coin Tag */}
                  <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-racing font-bold shrink-0">
                    +{mission.reward.toLocaleString()} C
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-racing mb-1">
                    <span className="text-zinc-400">PROGRESS</span>
                    <span className="text-white">
                      {mission.current.toLocaleString()} / {mission.target.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 border border-zinc-700/50 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        mission.completed ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Status or Claim Button */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-end">
                {mission.claimed ? (
                  <div className="text-xs font-racing text-zinc-500 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-zinc-500" />
                    <span>REWARD CLAIMED</span>
                  </div>
                ) : canClaim ? (
                  <button
                    onClick={() => handleClaim(mission)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black font-racing font-black text-xs uppercase tracking-wider box-glow-amber border border-amber-300 active:scale-95 transition-all flex items-center gap-1.5 animate-pulse"
                  >
                    <Award className="w-4 h-4" />
                    <span>CLAIM {mission.reward.toLocaleString()} COINS</span>
                  </button>
                ) : (
                  <div className="text-xs font-racing text-zinc-400">
                    <span>IN PROGRESS ({Math.round(progressPct)}%)</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
