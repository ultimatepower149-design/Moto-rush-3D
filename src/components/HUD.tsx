import React, { useState } from 'react';
import { RaceSessionStats, CameraMode } from '../types/game';
import { Pause, Zap, Volume2, Video, AlertTriangle } from 'lucide-react';

interface HUDProps {
  stats: RaceSessionStats;
  cameraMode: CameraMode;
  nearMissCombo: number;
  onPause: () => void;
  onCameraSwitch: () => void;
  onHorn: () => void;
  onSteerChange: (dir: number) => void;
  onAccelChange: (active: boolean) => void;
  onBrakeChange: (active: boolean) => void;
  onNitroChange: (active: boolean) => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  cameraMode,
  nearMissCombo,
  onPause,
  onCameraSwitch,
  onHorn,
  onSteerChange,
  onAccelChange,
  onBrakeChange,
  onNitroChange,
}) => {
  const [activeLeft, setActiveLeft] = useState(false);
  const [activeRight, setActiveRight] = useState(false);
  const [activeGas, setActiveGas] = useState(false);
  const [activeBrake, setActiveBrake] = useState(false);
  const [activeNos, setActiveNos] = useState(false);

  // Keyboard/control instructions overlay: displays on race start and automatically hides after 1000ms
  const [showInstructions, setShowInstructions] = useState(true);

  React.useEffect(() => {
    setShowInstructions(true);
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const speedPct = Math.min(100, (stats.currentSpeed / 350) * 100);
  const nitroPct = Math.max(0, Math.min(100, stats.nitroRemaining * 100));

  const gear = stats.currentSpeed < 30 ? 1 :
               stats.currentSpeed < 75 ? 2 :
               stats.currentSpeed < 130 ? 3 :
               stats.currentSpeed < 190 ? 4 :
               stats.currentSpeed < 260 ? 5 : 6;

  // Steering touch handlers with pointer capture protection
  const handleLeftDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setActiveLeft(true);
    onSteerChange(-1);
  };
  const handleLeftUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveLeft(false);
    onSteerChange(0);
  };

  const handleRightDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setActiveRight(true);
    onSteerChange(1);
  };
  const handleRightUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveRight(false);
    onSteerChange(0);
  };

  // Gas, Brake, Nitro handlers
  const handleGasDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setActiveGas(true);
    onAccelChange(true);
  };
  const handleGasUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveGas(false);
    onAccelChange(false);
  };

  const handleBrakeDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setActiveBrake(true);
    onBrakeChange(true);
  };
  const handleBrakeUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveBrake(false);
    onBrakeChange(false);
  };

  const handleNosDown = (e: React.PointerEvent) => {
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    setActiveNos(true);
    onNitroChange(true);
  };
  const handleNosUp = (e: React.PointerEvent) => {
    e.preventDefault();
    setActiveNos(false);
    onNitroChange(false);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 sm:p-5 select-none z-20">
      {/* --- TOP ROW --- */}
      <div className="flex items-start justify-between w-full">
        {/* Top Left: Pause, Score & Distance */}
        <div className="flex items-start gap-2.5 sm:gap-3">
          <button
            onClick={onPause}
            className="pointer-events-auto p-2.5 sm:p-3 bg-black/70 hover:bg-black/90 border border-white/20 active:scale-95 text-white transition-all backdrop-blur-md shadow-lg"
            title="Pause Game (Esc)"
          >
            <Pause className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <div className="bg-black/70 border border-white/15 px-3.5 py-2 backdrop-blur-md shadow-xl">
            <div className="text-[10px] tracking-wider text-zinc-400 uppercase font-racing">SCORE</div>
            <div className="text-xl sm:text-2xl font-bold font-racing text-white tracking-wide">
              {stats.score.toLocaleString()}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              <span>{(stats.distance / 1000).toFixed(2)} km</span>
              <span className="mx-1.5 opacity-40">·</span>
              <span className="text-amber-400">{stats.nearMisses} misses</span>
            </div>
          </div>
        </div>

        {/* Top Center: Digital Speedometer & Gear */}
        <div className="flex flex-col items-center">
          <div className="bg-black/80 border border-red-500/40 px-5 sm:px-7 py-2.5 backdrop-blur-md text-center shadow-2xl relative overflow-hidden">
            {/* Speed bar at top */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-cyan-400 transition-all duration-75"
                style={{ width: `${speedPct}%` }}
              />
            </div>

            <div className="flex items-baseline justify-center gap-1.5">
              <span className="text-4xl sm:text-5xl font-black font-racing tracking-tight text-white text-glow-red">
                {stats.currentSpeed}
              </span>
              <span className="text-xs sm:text-sm font-racing text-zinc-400 tracking-wider">
                KM/H
              </span>
            </div>

            <div className="flex items-center justify-center gap-2.5 text-[11px] font-racing text-zinc-400 mt-0.5">
              <span className="text-zinc-200 font-bold">GEAR {gear}</span>
              <span className="opacity-40">·</span>
              <span className="text-red-400 font-semibold">MAX {stats.maxSpeed}</span>
            </div>
          </div>

          {/* Near-Miss Combo Toast */}
          {nearMissCombo > 0 && (
            <div className="mt-2 px-3 py-1 bg-red-600/95 text-white font-racing text-xs tracking-wider border border-red-400 animate-bounce shadow-xl flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
              <span>NEAR MISS x{nearMissCombo}! +{500 * Math.min(nearMissCombo, 5)}</span>
            </div>
          )}
        </div>

        {/* Top Right: Coins, Nitro Meter & Camera Switch */}
        <div className="flex items-start gap-2 sm:gap-2.5">
          <div className="flex flex-col gap-1.5">
            {/* Session Coins */}
            <div className="bg-black/70 border border-amber-500/40 px-3 py-1.5 backdrop-blur-md flex items-center gap-2 self-end shadow-lg">
              <div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-[10px] text-black font-black">
                C
              </div>
              <span className="text-base sm:text-lg font-bold font-racing text-amber-300">
                +{stats.coinsCollected}
              </span>
            </div>

            {/* Nitro Gauge */}
            <div className="bg-black/70 border border-cyan-500/40 px-3 py-2 backdrop-blur-md min-w-[125px] sm:min-w-[145px] shadow-lg">
              <div className="flex items-center justify-between text-[10px] font-racing text-cyan-300 mb-1">
                <span className="flex items-center gap-1 font-bold">
                  <Zap className="w-3 h-3 text-cyan-400" /> NITRO
                </span>
                <span className="font-bold">{Math.round(nitroPct)}%</span>
              </div>
              <div className="w-full h-2.5 bg-zinc-800 border border-cyan-900/60 overflow-hidden">
                <div
                  className={`h-full transition-all duration-75 ${
                    stats.isNitroActive
                      ? 'bg-gradient-to-r from-cyan-400 to-blue-400 box-glow-cyan animate-pulse'
                      : 'bg-gradient-to-r from-cyan-600 to-cyan-400'
                  }`}
                  style={{ width: `${nitroPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Controls Utility Buttons: Cam & Horn */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onCameraSwitch}
              className="pointer-events-auto p-2.5 bg-black/70 hover:bg-black/90 border border-white/20 active:scale-95 text-white transition-all backdrop-blur-md shadow-lg"
              title={`Camera: ${cameraMode.toUpperCase()} (C)`}
            >
              <Video className="w-5 h-5 text-cyan-400" />
            </button>
            <button
              onClick={onHorn}
              className="pointer-events-auto p-2.5 bg-black/70 hover:bg-black/90 border border-white/20 active:scale-95 text-white transition-all backdrop-blur-md shadow-lg"
              title="Horn / Honk (H)"
            >
              <Volume2 className="w-5 h-5 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MIDDLE DESKTOP SHORTCUTS OVERLAY (Visible on race start, hides after 1000ms) --- */}
      {showInstructions && (
        <div className="hidden md:flex justify-center w-full mb-1 transition-opacity duration-300">
          <div className="px-4 py-1 bg-black/60 border border-white/10 backdrop-blur-sm text-[11px] font-racing text-zinc-400 flex items-center gap-3">
            <span><strong className="text-zinc-200">A / D</strong> or <strong className="text-zinc-200">◀ ▶</strong> Steer</span>
            <span className="opacity-40">·</span>
            <span><strong className="text-zinc-200">W / ▲</strong> Gas</span>
            <span className="opacity-40">·</span>
            <span><strong className="text-zinc-200">S / ▼</strong> Brake</span>
            <span className="opacity-40">·</span>
            <span><strong className="text-cyan-300">Space</strong> Nitro</span>
            <span className="opacity-40">·</span>
            <span><strong className="text-zinc-200">C</strong> Cam</span>
            <span className="opacity-40">·</span>
            <span><strong className="text-zinc-200">H</strong> Horn</span>
          </div>
        </div>
      )}

      {/* --- BOTTOM ROW: TOUCH CONTROLS --- */}
      <div className="flex items-end justify-between w-full pb-1 sm:pb-2">
        {/* Left Side: Steering Controls */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {/* Steer Left */}
          <button
            onPointerDown={handleLeftDown}
            onPointerUp={handleLeftUp}
            onPointerLeave={handleLeftUp}
            onPointerCancel={handleLeftUp}
            className={`w-16 h-16 sm:w-20 sm:h-20 border-2 active:scale-95 text-white flex items-center justify-center font-racing font-bold text-2xl transition-all shadow-2xl backdrop-blur-md touch-none ${
              activeLeft
                ? 'bg-red-600 border-red-400 box-glow-red scale-95'
                : 'bg-zinc-900/85 hover:bg-zinc-800/90 border-white/30'
            }`}
          >
            ◀
          </button>

          {/* Steer Right */}
          <button
            onPointerDown={handleRightDown}
            onPointerUp={handleRightUp}
            onPointerLeave={handleRightUp}
            onPointerCancel={handleRightUp}
            className={`w-16 h-16 sm:w-20 sm:h-20 border-2 active:scale-95 text-white flex items-center justify-center font-racing font-bold text-2xl transition-all shadow-2xl backdrop-blur-md touch-none ${
              activeRight
                ? 'bg-red-600 border-red-400 box-glow-red scale-95'
                : 'bg-zinc-900/85 hover:bg-zinc-800/90 border-white/30'
            }`}
          >
            ▶
          </button>
        </div>

        {/* Right Side: Driving Controls (Brake, Nitro, Gas) */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          {/* Brake Button */}
          <button
            onPointerDown={handleBrakeDown}
            onPointerUp={handleBrakeUp}
            onPointerLeave={handleBrakeUp}
            onPointerCancel={handleBrakeUp}
            className={`w-14 h-16 sm:w-16 sm:h-20 border-2 active:scale-95 text-red-200 flex flex-col items-center justify-center font-racing text-xs transition-all shadow-2xl backdrop-blur-md touch-none ${
              activeBrake
                ? 'bg-red-600 border-red-300 box-glow-red text-white scale-95'
                : 'bg-red-950/85 hover:bg-red-900/90 border-red-500/50'
            }`}
          >
            <span className="font-black text-sm sm:text-base">STOP</span>
            <span className="text-[10px] opacity-75">BRAKE</span>
          </button>

          {/* Nitro Boost Button */}
          <button
            onPointerDown={handleNosDown}
            onPointerUp={handleNosUp}
            onPointerLeave={handleNosUp}
            onPointerCancel={handleNosUp}
            disabled={stats.nitroRemaining <= 0.05}
            className={`w-14 h-16 sm:w-16 sm:h-20 border-2 active:scale-95 text-cyan-100 flex flex-col items-center justify-center font-racing text-xs transition-all shadow-2xl backdrop-blur-md touch-none ${
              activeNos || stats.isNitroActive
                ? 'bg-cyan-500 border-cyan-300 box-glow-cyan text-black font-black scale-95'
                : stats.nitroRemaining > 0.05
                ? 'bg-cyan-950/85 hover:bg-cyan-900/90 border-cyan-500/60'
                : 'bg-zinc-900/50 border-zinc-700/40 opacity-40 cursor-not-allowed'
            }`}
          >
            <Zap className="w-5 h-5 text-cyan-300" />
            <span className="text-[10px] font-bold tracking-wider mt-0.5">NOS</span>
          </button>

          {/* Gas / Accelerator Button */}
          <button
            onPointerDown={handleGasDown}
            onPointerUp={handleGasUp}
            onPointerLeave={handleGasUp}
            onPointerCancel={handleGasUp}
            className={`w-16 h-20 sm:w-20 sm:h-24 border-2 active:scale-95 text-emerald-100 flex flex-col items-center justify-center font-racing transition-all shadow-2xl backdrop-blur-md touch-none ${
              activeGas
                ? 'bg-emerald-500 border-emerald-300 text-black scale-95 shadow-[0_0_25px_rgba(16,185,129,0.7)]'
                : 'bg-emerald-950/85 hover:bg-emerald-900/90 border-emerald-500/60'
            }`}
          >
            <span className="text-xl sm:text-2xl font-black">▲</span>
            <span className="text-xs font-black tracking-wider">GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};
