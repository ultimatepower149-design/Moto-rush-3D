import React from 'react';
import { MapConfig, MapId, PlayerSaveData } from '../types/game';
import { MAPS } from '../services/storage';
import { sound } from '../services/audio';
import { ArrowLeft, Check, Play, MapPin, Gauge, ShieldAlert } from 'lucide-react';

interface MapSelectionScreenProps {
  saveData: PlayerSaveData;
  selectedMapId: MapId;
  onSelectMap: (mapId: MapId) => void;
  onPlayMap: (mapId: MapId) => void;
  onBack: () => void;
}

export const MapSelectionScreen: React.FC<MapSelectionScreenProps> = ({
  saveData,
  selectedMapId,
  onSelectMap,
  onPlayMap,
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
            SELECT HIGHWAY TRACK
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

      {/* Grid of 5 Playable Maps */}
      <div className="my-auto py-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pointer-events-auto overflow-y-auto max-h-[76vh] pr-1">
        {MAPS.map(track => {
          const isSelected = selectedMapId === track.id;

          // Theme badge styling
          const getThemeColor = () => {
            switch (track.sceneryType) {
              case 'indian': return 'border-emerald-500 text-emerald-400 bg-emerald-950/40';
              case 'city': return 'border-blue-500 text-blue-400 bg-blue-950/40';
              case 'mountain': return 'border-teal-500 text-teal-400 bg-teal-950/40';
              case 'desert': return 'border-amber-500 text-amber-400 bg-amber-950/40';
              case 'night': return 'border-indigo-500 text-indigo-400 bg-indigo-950/40';
              default: return 'border-white/20 text-white';
            }
          };

          return (
            <div
              key={track.id}
              className={`carbon-panel border p-4 flex flex-col justify-between transition-all relative overflow-hidden group ${
                isSelected
                  ? 'border-red-500 box-glow-red bg-red-950/20'
                  : 'border-white/20 hover:border-white/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-racing">
                  <span className={`px-2 py-0.5 border text-[10px] uppercase font-bold tracking-wider ${getThemeColor()}`}>
                    {track.sceneryType}
                  </span>
                  {isSelected && (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> ACTIVE
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-black font-racing text-white uppercase mt-2">
                  {track.name}
                </h3>
                <div className="flex items-center gap-1 text-xs text-zinc-400 font-racing mt-0.5">
                  <MapPin className="w-3 h-3 text-red-400" />
                  <span>{track.subtitle}</span>
                </div>

                <p className="text-xs text-zinc-300 mt-2 line-clamp-2">
                  {track.description}
                </p>

                {/* Track Properties */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/10 text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>Traffic: <strong className="text-white font-racing">{track.trafficDensity}x</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-400">
                    <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Speed: <strong className="text-white font-racing">{track.speedLimit} KM/H</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                <button
                  onClick={() => {
                    sound.playClick();
                    onSelectMap(track.id);
                  }}
                  className={`flex-1 py-2 text-xs font-racing font-bold uppercase transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-600/80 text-white border border-emerald-400 cursor-default'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600'
                  }`}
                >
                  {isSelected ? 'SELECTED' : 'SELECT MAP'}
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onPlayMap(track.id);
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-500 text-white border border-red-400 box-glow-red text-xs font-racing font-bold uppercase flex items-center gap-1 active:scale-95 transition-all"
                  title="Race on this track immediately"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>RACE</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
