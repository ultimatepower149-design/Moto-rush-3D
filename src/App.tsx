import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, RaceSessionStats, BikeUpgrades, MapId, MotorcycleStats } from './types/game';
import { loadSaveData, savePlayerData, MOTORCYCLES, MAPS, getDefaultSaveData } from './services/storage';
import { sound } from './services/audio';
import { GameEngine } from './engine/GameEngine';

import { MainMenu } from './components/MainMenu';
import { HUD } from './components/HUD';
import { GarageScreen } from './components/GarageScreen';
import { BikeSelectionScreen } from './components/BikeSelectionScreen';
import { MapSelectionScreen } from './components/MapSelectionScreen';
import { MissionsScreen } from './components/MissionsScreen';
import { DailyRewardsScreen } from './components/DailyRewardsScreen';
import { SettingsScreen } from './components/SettingsScreen';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { CountdownOverlay } from './components/CountdownOverlay';

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Global Player Save Data
  const [saveData, setSaveData] = useState(() => loadSaveData());

  // Game Navigation State
  const [gameState, setGameState] = useState<GameState>('MAIN_MENU');

  // Real-time HUD Session Stats
  const [hudStats, setHudStats] = useState<RaceSessionStats>({
    score: 0,
    distance: 0,
    currentSpeed: 0,
    maxSpeed: 0,
    coinsCollected: 0,
    nearMisses: 0,
    overtakes: 0,
    nitroRemaining: 1.0,
    nitroMax: 5.0,
    isNitroActive: false,
    isBraking: false,
    isAccelerating: false,
    steerDirection: 0,
  });

  const [nearMissCombo, setNearMissCombo] = useState(0);
  const [isNewBestScore, setIsNewBestScore] = useState(false);
  const [finalSessionStats, setFinalSessionStats] = useState<RaceSessionStats | null>(null);
  const [raceSessionId, setRaceSessionId] = useState(0);

  // Active Motorcycle & Map derived objects
  const activeBike = MOTORCYCLES.find(b => b.id === saveData.selectedBikeId) || MOTORCYCLES[0];
  const activeMap = MAPS.find(m => m.id === saveData.selectedMapId) || MAPS[0];
  const activeUpgrades = saveData.bikeUpgrades[activeBike.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };

  // Sync settings with sound service
  useEffect(() => {
    sound.updateVolumes(
      saveData.settings.masterVolume,
      saveData.settings.sfxVolume,
      saveData.settings.musicVolume,
      saveData.settings.soundEnabled,
      saveData.settings.musicEnabled
    );
  }, [saveData.settings]);

  // Persist Save Data whenever it changes
  useEffect(() => {
    savePlayerData(saveData);
  }, [saveData]);

  // Handle Game Over Crash Callback
  const handleCrash = useCallback((finalStats: RaceSessionStats) => {
    setFinalSessionStats(finalStats);

    setSaveData(prev => {
      const isNewBest = finalStats.score > prev.bestScore;
      setIsNewBestScore(isNewBest);

      const updatedCoins = prev.coins + finalStats.coinsCollected;
      const updatedBest = Math.max(prev.bestScore, finalStats.score);
      const updatedDistance = prev.lifetimeDistance + finalStats.distance;
      const updatedRaces = prev.totalRaces + 1;
      const updatedNearMisses = prev.totalNearMisses + finalStats.nearMisses;

      // Update Missions Progress
      const updatedMissions = prev.missions.map(m => {
        let current = m.current;
        if (m.type === 'distance') current += finalStats.distance;
        else if (m.type === 'overtakes') current += finalStats.overtakes;
        else if (m.type === 'near_misses') current += finalStats.nearMisses;
        else if (m.type === 'coins') current += finalStats.coinsCollected;
        else if (m.type === 'speed') current = Math.max(current, finalStats.maxSpeed);

        const completed = current >= m.target;
        return { ...m, current, completed };
      });

      return {
        ...prev,
        coins: updatedCoins,
        bestScore: updatedBest,
        lifetimeDistance: updatedDistance,
        totalRaces: updatedRaces,
        totalNearMisses: updatedNearMisses,
        missions: updatedMissions,
      };
    });

    setGameState('GAME_OVER');
  }, []);

  // Initialize Three.js Game Engine once on mount
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      activeBike,
      activeUpgrades,
      activeMap,
      saveData.settings,
      {
        onScoreUpdate: (stats) => setHudStats(stats),
        onNearMiss: (combo) => {
          setNearMissCombo(combo);
          setTimeout(() => setNearMissCombo(0), 1800);
        },
        onCoinCollected: (total) => {
          // HUD updates via score update
        },
        onCrash: handleCrash,
      }
    );

    engineRef.current = engine;
    engine.enterShowroomMode();

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard desktop controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!engineRef.current) return;
      const key = e.key.toLowerCase();

      if (key === 'escape' || key === 'p') {
        if (gameState === 'PLAYING') {
          handlePause();
        } else if (gameState === 'PAUSED') {
          handleResume();
        }
        return;
      }

      if (gameState !== 'PLAYING') return;

      if (key === 'a' || key === 'arrowleft') {
        engineRef.current.setSteering(-1);
      } else if (key === 'd' || key === 'arrowright') {
        engineRef.current.setSteering(1);
      } else if (key === 'w' || key === 'arrowup') {
        engineRef.current.setAccelerating(true);
      } else if (key === 's' || key === 'arrowdown') {
        engineRef.current.setBraking(true);
      } else if (key === ' ' || key === 'shift') {
        engineRef.current.setNitro(true);
      } else if (key === 'c') {
        handleCameraSwitch();
      } else if (key === 'h') {
        sound.playHorn();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!engineRef.current || gameState !== 'PLAYING') return;
      const key = e.key.toLowerCase();

      if (key === 'a' || key === 'arrowleft' || key === 'd' || key === 'arrowright') {
        engineRef.current.setSteering(0);
      } else if (key === 'w' || key === 'arrowup') {
        engineRef.current.setAccelerating(false);
      } else if (key === 's' || key === 'arrowdown') {
        engineRef.current.setBraking(false);
      } else if (key === ' ' || key === 'shift') {
        engineRef.current.setNitro(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Auto-pause when window loses focus
    const handleBlur = () => {
      if (gameState === 'PLAYING') {
        handlePause();
      }
    };
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameState]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- ACTIONS ---
  const handleStartCountdown = () => {
    setRaceSessionId(p => p + 1);
    setGameState('COUNTDOWN');
    if (engineRef.current) {
      engineRef.current.isShowroomMode = false;
      engineRef.current.camera.position.set(0, 2.3, -4.8);
      engineRef.current.camera.lookAt(0, 1.2, 12);
    }
  };

  const handleCountdownComplete = () => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.startRace();
    }
  };

  const handlePause = () => {
    setGameState('PAUSED');
    if (engineRef.current) {
      engineRef.current.pauseGame();
    }
  };

  const handleResume = () => {
    setGameState('PLAYING');
    if (engineRef.current) {
      engineRef.current.resumeGame();
    }
  };

  const handleRestartRace = () => {
    if (engineRef.current) {
      engineRef.current.stopLoop();
      const currentBike = MOTORCYCLES.find(b => b.id === saveData.selectedBikeId) || MOTORCYCLES[0];
      const currentUpgrades = saveData.bikeUpgrades[currentBike.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      const currentMap = MAPS.find(m => m.id === saveData.selectedMapId) || MAPS[0];
      engineRef.current.setMotorcycleAndUpgrades(currentBike, currentUpgrades);
      engineRef.current.rebuildEnvironment(currentMap);
    }
    handleStartCountdown();
  };

  const handleReturnToMainMenu = () => {
    setGameState('MAIN_MENU');
    if (engineRef.current) {
      const currentBike = MOTORCYCLES.find(b => b.id === saveData.selectedBikeId) || MOTORCYCLES[0];
      const currentUpgrades = saveData.bikeUpgrades[currentBike.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      const currentMap = MAPS.find(m => m.id === saveData.selectedMapId) || MAPS[0];
      engineRef.current.setMotorcycleAndUpgrades(currentBike, currentUpgrades);
      engineRef.current.rebuildEnvironment(currentMap);
      engineRef.current.enterShowroomMode();
    }
  };

  const handleSelectBike = (bikeId: string) => {
    setSaveData(prev => ({ ...prev, selectedBikeId: bikeId }));
    const newBike = MOTORCYCLES.find(b => b.id === bikeId);
    if (newBike && engineRef.current) {
      const upgrades = saveData.bikeUpgrades[bikeId] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      engineRef.current.setMotorcycleAndUpgrades(newBike, upgrades);
    }
  };

  const handleUpgradeBike = (bikeId: string, part: keyof BikeUpgrades) => {
    setSaveData(prev => {
      const currentBikeUpgrades = prev.bikeUpgrades[bikeId] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      const currentLevel = currentBikeUpgrades[part] || 0;
      const cost = [1000, 2500, 5000, 9000, 15000][currentLevel] || 25000;

      if (prev.coins < cost || currentLevel >= 5) return prev;

      const updatedUpgrades = {
        ...currentBikeUpgrades,
        [part]: currentLevel + 1,
      };

      const nextSave = {
        ...prev,
        coins: prev.coins - cost,
        bikeUpgrades: {
          ...prev.bikeUpgrades,
          [bikeId]: updatedUpgrades,
        },
      };

      if (engineRef.current && bikeId === prev.selectedBikeId) {
        const bike = MOTORCYCLES.find(b => b.id === bikeId);
        if (bike) {
          engineRef.current.setMotorcycleAndUpgrades(bike, updatedUpgrades);
        }
      }

      return nextSave;
    });
  };

  const handleUnlockBike = (bikeId: string) => {
    const bike = MOTORCYCLES.find(b => b.id === bikeId);
    if (!bike) return;

    setSaveData(prev => {
      if (prev.coins < bike.price || prev.unlockedBikes.includes(bikeId)) return prev;

      return {
        ...prev,
        coins: prev.coins - bike.price,
        unlockedBikes: [...prev.unlockedBikes, bikeId],
        selectedBikeId: bikeId,
      };
    });

    if (engineRef.current) {
      const upgrades = saveData.bikeUpgrades[bikeId] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      engineRef.current.setMotorcycleAndUpgrades(bike, upgrades);
    }
  };

  const handleSelectMap = (mapId: MapId) => {
    setSaveData(prev => ({ ...prev, selectedMapId: mapId }));
    const newMap = MAPS.find(m => m.id === mapId);
    if (newMap && engineRef.current) {
      engineRef.current.rebuildEnvironment(newMap);
    }
  };

  const handlePlayMap = (mapId: MapId) => {
    handleSelectMap(mapId);
    handleStartCountdown();
  };

  const handlePreviewBikeChange = (bike: MotorcycleStats) => {
    if (engineRef.current) {
      const upgrades = saveData.bikeUpgrades[bike.id] || { engine: 0, brakes: 0, handling: 0, nitro: 0 };
      engineRef.current.setMotorcycleAndUpgrades(bike, upgrades);
    }
  };

  const handleClaimMission = (missionId: string) => {
    setSaveData(prev => {
      const mission = prev.missions.find(m => m.id === missionId);
      if (!mission || mission.claimed) return prev;

      const updatedMissions = prev.missions.map(m =>
        m.id === missionId ? { ...m, claimed: true } : m
      );

      return {
        ...prev,
        coins: prev.coins + mission.reward,
        missions: updatedMissions,
      };
    });
  };

  const handleClaimDaily = (day: number, coins: number) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSaveData(prev => ({
      ...prev,
      coins: prev.coins + coins,
      lastDailyClaimDate: todayStr,
      dailyStreak: (prev.dailyStreak || 0) + 1,
    }));
  };

  const handleResetProgress = () => {
    const fresh = getDefaultSaveData();
    setSaveData(fresh);
    savePlayerData(fresh);
    if (engineRef.current) {
      const initialBike = MOTORCYCLES[0];
      const initialMap = MAPS[0];
      engineRef.current.setMotorcycleAndUpgrades(initialBike, fresh.bikeUpgrades[initialBike.id]);
      engineRef.current.rebuildEnvironment(initialMap);
      engineRef.current.enterShowroomMode();
    }
    setGameState('MAIN_MENU');
  };

  const handleCameraSwitch = () => {
    if (engineRef.current) {
      const newMode = engineRef.current.switchCameraMode();
      setSaveData(prev => ({
        ...prev,
        settings: { ...prev.settings, cameraMode: newMode },
      }));
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none touch-none">
      {/* Three.js WebGL Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block z-0" />

      {/* Screen Render Switcher */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu
          saveData={saveData}
          currentBike={activeBike}
          currentMap={activeMap}
          onPlay={handleStartCountdown}
          onOpenGarage={() => setGameState('GARAGE')}
          onOpenBikes={() => setGameState('BIKE_SELECTION')}
          onOpenMaps={() => setGameState('MAP_SELECTION')}
          onOpenMissions={() => setGameState('MISSIONS')}
          onOpenDaily={() => setGameState('DAILY_REWARDS')}
          onOpenSettings={() => setGameState('SETTINGS')}
          onToggleSound={() =>
            setSaveData(p => ({
              ...p,
              settings: { ...p.settings, soundEnabled: !p.settings.soundEnabled },
            }))
          }
          onToggleMusic={() =>
            setSaveData(p => ({
              ...p,
              settings: { ...p.settings, musicEnabled: !p.settings.musicEnabled },
            }))
          }
        />
      )}

      {gameState === 'GARAGE' && (
        <GarageScreen
          saveData={saveData}
          onSelectBike={handleSelectBike}
          onUpgradeBike={handleUpgradeBike}
          onUnlockBike={handleUnlockBike}
          onPreviewBikeChange={handlePreviewBikeChange}
          onBack={handleReturnToMainMenu}
        />
      )}

      {gameState === 'BIKE_SELECTION' && (
        <BikeSelectionScreen
          saveData={saveData}
          onSelectBike={handleSelectBike}
          onGoToGarage={(id) => {
            handleSelectBike(id);
            setGameState('GARAGE');
          }}
          onBack={handleReturnToMainMenu}
        />
      )}

      {gameState === 'MAP_SELECTION' && (
        <MapSelectionScreen
          saveData={saveData}
          selectedMapId={saveData.selectedMapId}
          onSelectMap={handleSelectMap}
          onPlayMap={handlePlayMap}
          onBack={handleReturnToMainMenu}
        />
      )}

      {gameState === 'MISSIONS' && (
        <MissionsScreen
          saveData={saveData}
          onClaimReward={handleClaimMission}
          onBack={handleReturnToMainMenu}
        />
      )}

      {gameState === 'DAILY_REWARDS' && (
        <DailyRewardsScreen
          saveData={saveData}
          onClaimDaily={handleClaimDaily}
          onBack={handleReturnToMainMenu}
        />
      )}

      {gameState === 'SETTINGS' && (
        <SettingsScreen
          settings={saveData.settings}
          onUpdateSettings={(newSettings) => {
            setSaveData(p => ({ ...p, settings: newSettings }));
            if (engineRef.current) {
              engineRef.current.settings = newSettings;
              engineRef.current.applyGraphicsSettings();
            }
          }}
          onResetProgress={handleResetProgress}
          onBack={handleReturnToMainMenu}
        />
      )}

      {gameState === 'COUNTDOWN' && (
        <CountdownOverlay onComplete={handleCountdownComplete} />
      )}

      {(gameState === 'PLAYING' || gameState === 'PAUSED' || gameState === 'CRASHING') && (
        <HUD
          key={raceSessionId}
          stats={hudStats}
          cameraMode={saveData.settings.cameraMode}
          nearMissCombo={nearMissCombo}
          onPause={handlePause}
          onCameraSwitch={handleCameraSwitch}
          onHorn={() => sound.playHorn()}
          onSteerChange={(dir) => engineRef.current?.setSteering(dir)}
          onAccelChange={(active) => engineRef.current?.setAccelerating(active)}
          onBrakeChange={(active) => engineRef.current?.setBraking(active)}
          onNitroChange={(active) => engineRef.current?.setNitro(active)}
        />
      )}

      {gameState === 'PAUSED' && (
        <PauseModal
          soundEnabled={saveData.settings.soundEnabled}
          musicEnabled={saveData.settings.musicEnabled}
          onResume={handleResume}
          onRestart={handleRestartRace}
          onMainMenu={handleReturnToMainMenu}
          onToggleSound={() =>
            setSaveData(p => ({
              ...p,
              settings: { ...p.settings, soundEnabled: !p.settings.soundEnabled },
            }))
          }
          onToggleMusic={() =>
            setSaveData(p => ({
              ...p,
              settings: { ...p.settings, musicEnabled: !p.settings.musicEnabled },
            }))
          }
          onOpenSettings={() => setGameState('SETTINGS')}
        />
      )}

      {gameState === 'GAME_OVER' && finalSessionStats && (
        <GameOverModal
          stats={finalSessionStats}
          isNewBest={isNewBestScore}
          bestScore={saveData.bestScore}
          totalCoins={saveData.coins}
          onRestart={handleRestartRace}
          onGoToGarage={() => {
            handleReturnToMainMenu();
            setGameState('GARAGE');
          }}
          onMainMenu={handleReturnToMainMenu}
        />
      )}
    </div>
  );
};

export default App;
