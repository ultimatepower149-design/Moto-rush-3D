export type GameState =
  | 'LOADING'
  | 'MAIN_MENU'
  | 'GARAGE'
  | 'BIKE_SELECTION'
  | 'MAP_SELECTION'
  | 'MISSIONS'
  | 'DAILY_REWARDS'
  | 'SETTINGS'
  | 'COUNTDOWN'
  | 'PLAYING'
  | 'PAUSED'
  | 'CRASHING'
  | 'GAME_OVER';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ControlType = 'buttons' | 'touch_zones' | 'tilt';
export type CameraMode = 'chase' | 'cockpit' | 'far';

export interface MotorcycleStats {
  id: string;
  name: string;
  tagline: string;
  category: string;
  price: number;
  unlocked: boolean;
  baseMaxSpeed: number; // km/h
  baseAcceleration: number; // m/s^2
  baseHandling: number; // 1-10
  baseBraking: number; // 1-10
  baseNitro: number; // seconds
  color: string;
  accentColor: string;
  engineSoundFreq: number; // base pitch
}

export interface BikeUpgrades {
  engine: number; // 0 to 5
  brakes: number; // 0 to 5
  handling: number; // 0 to 5
  nitro: number; // 0 to 5
}

export type MapId = 'indian_highway' | 'modern_city' | 'mountain_pass' | 'desert_expressway' | 'night_city';

export interface MapConfig {
  id: MapId;
  name: string;
  subtitle: string;
  description: string;
  unlocked: boolean;
  unlockCost: number;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  groundColor: number;
  roadColor: number;
  ambientLightColor: number;
  ambientIntensity: number;
  dirLightColor: number;
  dirLightIntensity: number;
  sceneryType: SceneryType;
  trafficDensity: number;
  speedLimit: number;
}

export type SceneryType = 'indian' | 'city' | 'mountain' | 'desert' | 'night';

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  type: 'distance' | 'overtakes' | 'coins' | 'near_misses' | 'speed' | 'nitro';
  reward: number;
  completed: boolean;
  claimed: boolean;
}

export interface DailyRewardTier {
  day: number;
  coins: number;
  label: string;
}

export interface GameSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  graphicsQuality: GraphicsQuality;
  steeringSensitivity: number;
  cameraShake: boolean;
  cameraDistance: number;
  controlType: ControlType;
  vibration: boolean;
  cameraMode: CameraMode;
}

export interface PlayerSaveData {
  coins: number;
  bestScore: number;
  lifetimeDistance: number; // in meters
  totalRaces: number;
  totalNearMisses: number;
  selectedBikeId: string;
  selectedMapId: MapId;
  unlockedBikes: string[];
  bikeUpgrades: Record<string, BikeUpgrades>;
  unlockedMaps: MapId[];
  missions: Mission[];
  lastDailyClaimDate: string | null;
  dailyStreak: number;
  settings: GameSettings;
}

export interface RaceSessionStats {
  score: number;
  distance: number; // in meters
  currentSpeed: number; // in km/h
  maxSpeed: number;
  coinsCollected: number;
  nearMisses: number;
  overtakes: number;
  nitroRemaining: number; // 0 to 1
  nitroMax: number;
  isNitroActive: boolean;
  isBraking: boolean;
  isAccelerating: boolean;
  steerDirection: number; // -1 to 1
}
