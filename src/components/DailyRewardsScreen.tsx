import React from 'react';
import { PlayerSaveData } from '../types/game';
import { DAILY_REWARDS } from '../services/storage';
import { sound } from '../services/audio';
import { ArrowLeft, Gift, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyRewardsScreenProps {
  saveData: PlayerSaveData;
  onClaimDaily: (day: number, coins: number) => void;
  onBack: () => void;
}

export const DailyRewardsScreen: React.FC<DailyRewardsScreenProps> = ({
  saveData,
  onClaimDaily,
  onBack,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const isClaimedToday = saveData.lastDailyClaimDate === todayStr;

  // Next day in streak (1 to 7)
  const currentStreakDay = ((saveData.dailyStreak || 0) % 7) + 1;

  const handleClaim = (day: number, coins: number) => {
    sound.playRewardFanfare();
    confetti({
      particleCount: 80,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#ef4444', '#06b6d4', '#10b981'],
    });
    onClaimDaily(day, coins);
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
          <div>
            <h2 className="text-xl sm:text-2xl font-black font-racing uppercase tracking-wider text-white">
              DAILY LOGIN REWARDS
            </h2>
            <div className="text-xs text-zinc-400 font-racing">
              LOGIN STREAK: {saveData.dailyStreak || 0} DAYS
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

      {/* 7-Day Calendar Streak Cards */}
      <div className="my-auto py-3 pointer-events-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3.5">
          {DAILY_REWARDS.map(tier => {
            const isToday = tier.day === currentStreakDay;
            const isAlreadyPassed = tier.day < currentStreakDay;

            return (
              <div
                key={tier.day}
                className={`carbon-panel border p-3.5 sm:p-4 flex flex-col items-center justify-between text-center min-h-[170px] relative transition-all ${
                  isToday && !isClaimedToday
                    ? 'border-amber-400 box-glow-amber bg-amber-950/40 scale-105 z-10'
                    : isAlreadyPassed || (isToday && isClaimedToday)
                    ? 'border-zinc-800 opacity-60'
                    : 'border-white/10'
                }`}
              >
                {/* Day Header */}
                <div className="text-xs font-racing font-bold text-zinc-400 uppercase">
                  DAY {tier.day}
                </div>

                {/* Gift Icon / Coin Icon */}
                <div className="my-2 p-3 rounded-full bg-zinc-800/80 border border-white/10 flex items-center justify-center">
                  {tier.day === 7 ? (
                    <Sparkles className="w-6 h-6 text-yellow-300 animate-spin" />
                  ) : (
                    <Gift className={`w-6 h-6 ${isToday ? 'text-amber-400' : 'text-zinc-400'}`} />
                  )}
                </div>

                {/* Coin Reward Amount */}
                <div>
                  <div className="text-base sm:text-lg font-black font-racing text-amber-300">
                    +{tier.coins.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-racing uppercase">COINS</div>
                </div>

                {/* Status or Claim Tag */}
                <div className="mt-3 w-full">
                  {isAlreadyPassed || (isToday && isClaimedToday) ? (
                    <div className="text-[11px] font-racing text-emerald-400 flex items-center justify-center gap-1">
                      <Check className="w-3 h-3" /> CLAIMED
                    </div>
                  ) : isToday ? (
                    <button
                      onClick={() => handleClaim(tier.day, tier.coins)}
                      className="w-full py-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-black font-racing font-black text-xs uppercase tracking-wider box-glow-amber active:scale-95 transition-all animate-bounce"
                    >
                      CLAIM NOW
                    </button>
                  ) : (
                    <div className="text-[11px] font-racing text-zinc-500">LOCKED</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info notice */}
      <div className="carbon-panel border border-white/10 p-3 text-center text-xs text-zinc-400 font-racing pointer-events-auto">
        {isClaimedToday ? (
          <span className="text-emerald-400 font-semibold">
            ✓ You have claimed today's reward! Return tomorrow for the next reward streak bonus.
          </span>
        ) : (
          <span className="text-amber-300">
            ★ Day {currentStreakDay} reward is ready! Tap "CLAIM NOW" above to boost your coin balance.
          </span>
        )}
      </div>
    </div>
  );
};
