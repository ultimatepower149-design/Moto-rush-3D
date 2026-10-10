import * as THREE from 'three';
import { MotorcycleStats, MapConfig, BikeUpgrades, GameSettings, RaceSessionStats } from '../types/game';
import { MotorcycleBuilder, MotorcycleMeshPackage } from './models/MotorcycleBuilder';
import { TrafficBuilder, TrafficVehicle, TrafficType } from './models/TrafficBuilder';
import { Environment } from './Environment';
import { sound } from '../services/audio';
import { calculateUpgradedBikeStats } from '../services/storage';

export interface EngineCallbacks {
  onScoreUpdate: (stats: RaceSessionStats) => void;
  onNearMiss: (combo: number) => void;
  onCoinCollected: (totalCoins: number) => void;
  onCrash: (finalStats: RaceSessionStats) => void;
  onSpeedMilestone?: (speed: number) => void;
}

export class GameEngine {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public dirLight: THREE.DirectionalLight;
  public ambientLight: THREE.AmbientLight;
  public hemiLight: THREE.HemisphereLight;
  public headlightSpot: THREE.SpotLight;
  public headlightTarget: THREE.Object3D;
  public brakePointLight: THREE.PointLight;

  public environment: Environment | null = null;
  public playerPackage: MotorcycleMeshPackage | null = null;
  public currentBike: MotorcycleStats;
  public currentUpgrades: BikeUpgrades;
  public currentMap: MapConfig;
  public settings: GameSettings;

  // Realistic Physics & Gameplay state
  public playerX = 0;
  public playerZ = 0;
  public playerSpeed = 0; // km/h
  public playerSteerInput = 0; // target: -1 to 1
  public playerSteerSmooth = 0; // current smoothed steering
  public playerLean = 0; // radians
  public suspensionPitch = 0; // radians
  public suspensionSquat = 0; // vertical offset
  public isAccelerating = false;
  public isBraking = false;
  public isNitroActive = false;
  public nitroRemaining = 1.0; // 0 to 1
  public nitroMax = 5.0; // seconds

  // Session Stats
  public sessionStats: RaceSessionStats = {
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
  };

  // Traffic: 5 clearly defined highway lanes spanning the roadway (including outer edges)
  // Lane 0: Right Edge (-4.5), Lane 1: Mid-Right (-2.25), Lane 2: Center (0.0), Lane 3: Mid-Left (2.25), Lane 4: Left Edge (4.5)
  public trafficVehicles: TrafficVehicle[] = [];
  private nextVehicleId = 1;
  public laneXPositions = [-4.5, -2.25, 0.0, 2.25, 4.5];
  public raceTimer = 0;
  private trafficSpawnTimer = 0;
  private spawnAttemptCounter = 0;

  public getPlayerLane(x: number): number {
    if (x <= -3.375) return 0;
    if (x <= -1.125) return 1;
    if (x <= 1.125) return 2;
    if (x <= 3.375) return 3;
    return 4;
  }

  // Particle systems
  private sparkParticles: THREE.Points | null = null;
  private sparkPositions: Float32Array | null = null;
  private dustParticles: THREE.Points | null = null;
  private dustPositions: Float32Array | null = null;
  private dustVelocities: Float32Array | null = null;
  private contactShadowMesh: THREE.Mesh | null = null;

  // State flags
  public isRunning = false;
  public isPaused = false;
  public isCrashing = false;
  public isShowroomMode = false;
  public showroomRotation = 0;

  private callbacks: EngineCallbacks;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private nearMissCooldown = 0;
  private consecutiveNearMisses = 0;
  private shakeIntensity = 0;

  constructor(
    canvas: HTMLCanvasElement,
    bike: MotorcycleStats,
    upgrades: BikeUpgrades,
    map: MapConfig,
    settings: GameSettings,
    callbacks: EngineCallbacks
  ) {
    this.canvas = canvas;
    this.currentBike = bike;
    this.currentUpgrades = upgrades;
    this.currentMap = map;
    this.settings = settings;
    this.callbacks = callbacks;

    // Renderer with ACES Filmic Tone Mapping for HD racing realism
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: settings.graphicsQuality !== 'low',
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.applyGraphicsSettings();

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.2, 900);
    this.camera.position.set(0, 2.5, -5.2);
    this.camera.lookAt(0, 1.2, 5.0);

    // Balanced Realistic Lighting: Sky/Ground Hemisphere + Directional Sun + Headlight Spotlight
    this.ambientLight = new THREE.AmbientLight(map.ambientLightColor, map.ambientIntensity);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(map.ambientLightColor, map.groundColor, 0.65);
    this.scene.add(this.hemiLight);

    this.dirLight = new THREE.DirectionalLight(map.dirLightColor, map.dirLightIntensity);
    this.dirLight.position.set(20, 50, -35);
    const hasShadows = settings.graphicsQuality === 'high' || settings.graphicsQuality === 'ultra';
    if (hasShadows) {
      this.dirLight.castShadow = true;
      const mapRes = settings.graphicsQuality === 'ultra' ? 2048 : 1024;
      this.dirLight.shadow.mapSize.width = mapRes;
      this.dirLight.shadow.mapSize.height = mapRes;
      this.dirLight.shadow.camera.near = 10;
      this.dirLight.shadow.camera.far = 150;
      this.dirLight.shadow.camera.left = -28;
      this.dirLight.shadow.camera.right = 28;
      this.dirLight.shadow.camera.top = 28;
      this.dirLight.shadow.camera.bottom = -28;
      this.dirLight.shadow.bias = -0.0003;
      this.dirLight.shadow.normalBias = 0.02;
    }
    this.scene.add(this.dirLight);

    // Dynamic Motorcycle High-Beam Headlight
    this.headlightSpot = new THREE.SpotLight(0xffffff, 2.5, 80, Math.PI / 4.8, 0.45, 1.2);
    this.headlightSpot.castShadow = settings.graphicsQuality === 'ultra';
    if (this.headlightSpot.castShadow) {
      this.headlightSpot.shadow.mapSize.width = 512;
      this.headlightSpot.shadow.mapSize.height = 512;
      this.headlightSpot.shadow.bias = -0.0005;
    }
    this.headlightTarget = new THREE.Object3D();
    this.scene.add(this.headlightTarget);
    this.headlightSpot.target = this.headlightTarget;
    this.scene.add(this.headlightSpot);

    // Dynamic Brake Light Glow
    this.brakePointLight = new THREE.PointLight(0xff0000, 0, 9, 2.0);
    this.scene.add(this.brakePointLight);

    // Particles & Shadows
    this.initSparkParticles();
    this.initDustParticles();
    this.initContactShadow();

    // Window Resize listener
    window.addEventListener('resize', this.onResize);
    this.onResize();

    // Build Environment & Motorcycle
    this.rebuildEnvironment(map);
    this.buildMotorcycle(bike);
  }

  public applyGraphicsSettings() {
    const isLow = this.settings.graphicsQuality === 'low';
    const isUltra = this.settings.graphicsQuality === 'ultra';
    const isHigh = this.settings.graphicsQuality === 'high' || isUltra;

    const dpr = isLow ? 1.0 : isUltra ? Math.min(window.devicePixelRatio, 2.0) : isHigh ? Math.min(window.devicePixelRatio, 1.6) : 1.2;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = isHigh;
    if (isHigh) {
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      if (this.dirLight) {
        this.dirLight.castShadow = true;
        const res = isUltra ? 2048 : 1024;
        this.dirLight.shadow.mapSize.width = res;
        this.dirLight.shadow.mapSize.height = res;
      }
    } else if (this.dirLight) {
      this.dirLight.castShadow = false;
    }
  }

  private onResize = () => {
    if (!this.canvas) return;
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private initSparkParticles() {
    const count = 120;
    const geo = new THREE.BufferGeometry();
    this.sparkPositions = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(this.sparkPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xff8811,
      size: 0.22,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.sparkParticles = new THREE.Points(geo, mat);
    this.scene.add(this.sparkParticles);
  }

  private initDustParticles() {
    const count = 80;
    const geo = new THREE.BufferGeometry();
    this.dustPositions = new Float32Array(count * 3);
    this.dustVelocities = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.dustPositions[i * 3 + 1] = -10; // off screen initially
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.dustPositions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xd4a373,
      size: 0.35,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });
    this.dustParticles = new THREE.Points(geo, mat);
    this.scene.add(this.dustParticles);
  }

  private initContactShadow() {
    // Realistic soft contact shadow under motorcycle tires
    const shadowGeo = new THREE.PlaneGeometry(0.8, 2.2);
    shadowGeo.rotateX(-Math.PI / 2);

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createRadialGradient(64, 128, 10, 64, 128, 64);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
      grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 256);
    }
    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
    });
    this.contactShadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadowMesh.position.y = 0.015;
    this.scene.add(this.contactShadowMesh);
  }

  public rebuildEnvironment(map: MapConfig) {
    this.currentMap = map;
    this.ambientLight.color.setHex(map.ambientLightColor);
    this.ambientLight.intensity = map.ambientIntensity;
    this.hemiLight.color.setHex(map.ambientLightColor);
    this.hemiLight.groundColor.setHex(map.groundColor);
    this.hemiLight.intensity = 0.65;
    this.dirLight.color.setHex(map.dirLightColor);
    this.dirLight.intensity = map.dirLightIntensity;

    if (!this.environment) {
      this.environment = new Environment(this.scene, map);
    } else {
      this.environment.updateMap(map);
    }
  }

  public buildMotorcycle(bike: MotorcycleStats) {
    if (this.playerPackage) {
      this.scene.remove(this.playerPackage.root);
      for (const mat of this.playerPackage.materials) {
        mat.dispose();
      }
    }
    this.currentBike = bike;
    this.playerPackage = MotorcycleBuilder.createMotorcycle(bike);
    this.scene.add(this.playerPackage.root);

    const stats = calculateUpgradedBikeStats(bike, this.currentUpgrades);
    this.nitroMax = stats.nitroDuration;
    this.nitroRemaining = 1.0;
  }

  public setMotorcycleAndUpgrades(bike: MotorcycleStats, upgrades: BikeUpgrades) {
    this.currentUpgrades = upgrades;
    this.buildMotorcycle(bike);
  }

  // --- SHOWROOM MODE (Garage / Main Menu turntable) ---
  public enterShowroomMode() {
    this.isShowroomMode = true;
    this.isRunning = false;
    this.isPaused = false;
    this.isCrashing = false;
    sound.stopEngine();
    sound.playNitro(false);

    this.headlightSpot.intensity = 0;
    this.brakePointLight.intensity = 0;

    if (this.playerPackage) {
      this.playerPackage.root.position.set(0, 0, 0);
      this.playerPackage.root.rotation.set(0, 0, 0);
      this.playerPackage.brakeLight.material = new THREE.MeshStandardMaterial({
        color: 0xff1111,
        emissive: 0x550000,
        emissiveIntensity: 0.3,
      });
      (this.playerPackage.nitroFlameL.material as THREE.MeshBasicMaterial).opacity = 0;
      (this.playerPackage.nitroFlameR.material as THREE.MeshBasicMaterial).opacity = 0;
    }

    this.camera.position.set(2.8, 1.4, -2.6);
    this.camera.lookAt(0, 0.65, 0);

    this.startLoop();
  }

  // --- START RACE SESSION ---
  public startRace() {
    this.isShowroomMode = false;
    this.isRunning = true;
    this.isPaused = false;
    this.isCrashing = false;

    // Reset physics & stats
    this.playerX = 0;
    this.playerZ = 0;
    this.playerSpeed = 0;
    this.playerSteerInput = 0;
    this.playerSteerSmooth = 0;
    this.playerLean = 0;
    this.suspensionPitch = 0;
    this.suspensionSquat = 0;
    this.isAccelerating = true;
    this.isBraking = false;
    this.isNitroActive = false;
    this.nitroRemaining = 1.0;
    this.shakeIntensity = 0;
    this.consecutiveNearMisses = 0;
    this.raceTimer = 0;
    this.trafficSpawnTimer = 0;
    this.spawnAttemptCounter = 0;

    const stats = calculateUpgradedBikeStats(this.currentBike, this.currentUpgrades);
    this.nitroMax = stats.nitroDuration;

    this.sessionStats = {
      score: 0,
      distance: 0,
      currentSpeed: 0,
      maxSpeed: 0,
      coinsCollected: 0,
      nearMisses: 0,
      overtakes: 0,
      nitroRemaining: 1.0,
      nitroMax: this.nitroMax,
      isNitroActive: false,
      isBraking: false,
      isAccelerating: true,
      steerDirection: 0,
    };

    if (this.playerPackage) {
      this.playerPackage.root.position.set(0, 0, 0);
      this.playerPackage.root.rotation.set(0, 0, 0);
      this.playerPackage.root.visible = true;
    }

    this.clearTraffic();
    this.seedInitialTraffic();

    sound.startEngine(this.currentBike.engineSoundFreq);

    this.lastTime = performance.now();
    this.startLoop();
  }

  public pauseGame() {
    this.isPaused = true;
    sound.stopEngine();
    sound.playNitro(false);
  }

  public resumeGame() {
    this.isPaused = false;
    this.lastTime = performance.now();
    sound.startEngine(this.currentBike.engineSoundFreq);
  }

  private startLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.lastTime = performance.now();
    const tick = (now: number) => {
      this.animationFrameId = requestAnimationFrame(tick);
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      if (this.isShowroomMode) {
        this.updateShowroom(dt);
      } else if (this.isRunning && !this.isPaused) {
        this.updateGameplay(dt);
      }
      this.render();
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  public stopLoop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    sound.stopEngine();
    sound.playNitro(false);
  }

  // --- SHOWROOM TURNTABLE UPDATE ---
  private updateShowroom(dt: number) {
    this.showroomRotation += dt * 0.45;
    if (this.playerPackage) {
      this.playerPackage.root.position.set(0, 0, 0);
      this.playerPackage.root.rotation.y = this.showroomRotation;
      this.playerPackage.root.rotation.z = 0;
      this.playerPackage.root.rotation.x = 0;
    }
    const dist = 3.6;
    const height = 1.4;
    this.camera.position.set(
      Math.sin(this.showroomRotation * 0.5) * dist,
      height + Math.sin(this.showroomRotation * 0.8) * 0.3,
      Math.cos(this.showroomRotation * 0.5) * dist
    );
    this.camera.lookAt(0, 0.7, 0);
  }

  // --- GAMEPLAY UPDATE LOOP ---
  private updateGameplay(dt: number) {
    if (this.isCrashing) {
      this.updateCrashAnimation(dt);
      return;
    }

    this.raceTimer += dt;
    this.trafficSpawnTimer += dt;

    const bikeStats = calculateUpgradedBikeStats(this.currentBike, this.currentUpgrades);

    // 1. Acceleration, Braking, Engine Powerband Torque Simulation
    let targetAcceleration = 0;

    // Torque powerband multiplier: Peak pull at mid-high revs
    const speedRatio = Math.min(1.0, this.playerSpeed / bikeStats.maxSpeed);
    const powerbandFactor = 1.0 + Math.sin(speedRatio * Math.PI) * 0.25;

    if (this.isNitroActive && this.nitroRemaining > 0) {
      targetAcceleration = bikeStats.acceleration * 2.3 * powerbandFactor;
      this.nitroRemaining = Math.max(0, this.nitroRemaining - dt / this.nitroMax);
      if (this.nitroRemaining <= 0) {
        this.isNitroActive = false;
        sound.playNitro(false);
      }
    } else if (this.isAccelerating) {
      targetAcceleration = bikeStats.acceleration * powerbandFactor;
      this.nitroRemaining = Math.min(1.0, this.nitroRemaining + dt * 0.05);
    } else if (this.isBraking) {
      targetAcceleration = -bikeStats.braking * 2.2;
      this.nitroRemaining = Math.min(1.0, this.nitroRemaining + dt * 0.05);
    } else {
      // Highway idle cruise & aero coasting: maintains steady 65 km/h if untouched, or coasts smoothly down from high speed
      const cruiseSpeed = 65;
      if (this.playerSpeed > cruiseSpeed) {
        targetAcceleration = -3.8 - (speedRatio * speedRatio) * 6.0;
      } else {
        targetAcceleration = 4.2; // Gentle idle cruise pull
      }
      this.nitroRemaining = Math.min(1.0, this.nitroRemaining + dt * 0.05);
    }

    let maxSpeedAllowed = bikeStats.maxSpeed;
    if (this.isNitroActive && this.nitroRemaining > 0) {
      maxSpeedAllowed *= 1.25;
    }

    const currentMps = (this.playerSpeed * 1000) / 3600;
    const newMps = Math.max(0, Math.min((maxSpeedAllowed * 1000) / 3600, currentMps + targetAcceleration * dt));
    this.playerSpeed = (newMps * 3600) / 1000;

    if (this.isAccelerating && this.playerSpeed < 25) {
      this.playerSpeed = Math.min(maxSpeedAllowed, this.playerSpeed + 45 * dt);
    }

    if (this.playerSpeed > this.sessionStats.maxSpeed) {
      this.sessionStats.maxSpeed = Math.round(this.playerSpeed);
    }

    // 2. Advance Z position (meters)
    const distanceDelta = (this.playerSpeed / 3.6) * dt;
    this.playerZ += distanceDelta;
    this.sessionStats.distance += distanceDelta;

    const speedScoreMultiplier = Math.max(1, this.playerSpeed / 65);
    this.sessionStats.score += Math.round(distanceDelta * speedScoreMultiplier * 1.6);

    // 3. Smooth Steering & Gyroscopic Lean Physics
    // Smooth input with delta-time lerp for buttery-smooth lane switching
    this.playerSteerSmooth = THREE.MathUtils.lerp(
      this.playerSteerSmooth,
      this.playerSteerInput,
      Math.min(1.0, dt * 12.0)
    );

    const steerSensitivity = this.settings.steeringSensitivity * (bikeStats.handling / 6.0);
    // At high speed, gyroscopic stability gives smooth progressive lane transitions
    const speedSteerFactor = Math.min(1.0, Math.max(0.42, 1.25 - (this.playerSpeed / maxSpeedAllowed) * 0.45));
    const steerSpeed = 7.8 * steerSensitivity * speedSteerFactor;

    this.playerX -= this.playerSteerSmooth * steerSpeed * dt;

    // Road boundary collision clamp (between guardrails: -5.7m to 5.7m)
    const maxRoadX = 5.7;
    if (this.playerX > maxRoadX) {
      this.playerX = maxRoadX;
    } else if (this.playerX < -maxRoadX) {
      this.playerX = -maxRoadX;
    }

    // Gyroscopic lean: roll in the direction of the turn (up to 32 degrees)
    const speedLeanMultiplier = Math.min(1.2, 0.4 + (this.playerSpeed / 160) * 0.8);
    const targetLean = this.playerSteerSmooth * 0.56 * speedLeanMultiplier;
    this.playerLean = THREE.MathUtils.lerp(this.playerLean, targetLean, Math.min(1.0, dt * 11.0));

    // Suspension dynamics: Braking nose-dive & Acceleration rear-squat
    const targetPitch = this.isBraking ? 0.08 : (this.isAccelerating ? -0.045 : 0);
    this.suspensionPitch = THREE.MathUtils.lerp(this.suspensionPitch, targetPitch, Math.min(1.0, dt * 8.0));

    // Road surface micro-vibration
    const roadVibration = Math.sin(this.sessionStats.distance * 12.0) * 0.008 * (this.playerSpeed > 20 ? 1 : 0);

    // 4. Update 3D Motorcycle Mesh Transforms
    if (this.playerPackage) {
      this.playerPackage.root.position.set(
        this.playerX,
        roadVibration,
        this.playerZ
      );
      this.playerPackage.root.rotation.z = this.playerLean;
      this.playerPackage.root.rotation.y = -this.playerLean * 0.28;
      this.playerPackage.root.rotation.x = this.suspensionPitch;

      // Wheel rotation
      const wheelCircumference = 2 * Math.PI * 0.33;
      const wheelRot = (distanceDelta / wheelCircumference) * (2 * Math.PI);
      this.playerPackage.frontWheel.rotation.x += wheelRot;
      this.playerPackage.rearWheel.rotation.x += wheelRot;

      // Handlebar steering rotation
      this.playerPackage.handlebars.rotation.y = -this.playerSteerSmooth * 0.22;

      // Reactive brake light
      const brakeLightMat = this.playerPackage.brakeLight.material as THREE.MeshStandardMaterial;
      if (this.isBraking) {
        brakeLightMat.emissiveIntensity = 2.8;
        this.brakePointLight.intensity = 1.8;
      } else {
        brakeLightMat.emissiveIntensity = 0.6;
        this.brakePointLight.intensity = 0.3;
      }
      this.brakePointLight.position.set(this.playerX, 0.8, this.playerZ - 1.2);

      // Contact Shadow under bike
      if (this.contactShadowMesh) {
        this.contactShadowMesh.position.set(this.playerX, 0.02, this.playerZ);
        this.contactShadowMesh.rotation.y = -this.playerLean * 0.15;
      }

      // Off-road Dust Effects: trigger when riding near road shoulder/gravel (|playerX| > 4.5)
      const isOffRoad = Math.abs(this.playerX) > 4.5 && this.playerSpeed > 25;
      if (this.dustParticles && this.dustPositions && this.dustVelocities) {
        const dustMat = this.dustParticles.material as THREE.PointsMaterial;
        if (isOffRoad) {
          dustMat.opacity = Math.min(0.65, dustMat.opacity + dt * 3.5);
          // Spawn new dust puff at rear tire
          const pIdx = Math.floor(Math.random() * (this.dustPositions.length / 3));
          this.dustPositions[pIdx * 3] = this.playerX + (Math.random() - 0.5) * 0.3;
          this.dustPositions[pIdx * 3 + 1] = 0.08 + Math.random() * 0.15;
          this.dustPositions[pIdx * 3 + 2] = this.playerZ - 0.85;

          this.dustVelocities[pIdx * 3] = (Math.random() - 0.5) * 1.5;
          this.dustVelocities[pIdx * 3 + 1] = 0.8 + Math.random() * 1.2;
          this.dustVelocities[pIdx * 3 + 2] = -2.0 - Math.random() * 2.0;
        } else {
          dustMat.opacity = Math.max(0, dustMat.opacity - dt * 2.0);
        }

        // Animate dust particles
        const count = this.dustPositions.length / 3;
        for (let i = 0; i < count; i++) {
          if (this.dustPositions[i * 3 + 1] > 0) {
            this.dustPositions[i * 3] += this.dustVelocities[i * 3] * dt;
            this.dustPositions[i * 3 + 1] += this.dustVelocities[i * 3 + 1] * dt;
            this.dustPositions[i * 3 + 2] += this.dustVelocities[i * 3 + 2] * dt;
            this.dustVelocities[i * 3 + 1] -= dt * 0.9; // gravity
          }
        }
        this.dustParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Nitro exhaust flame glow
      const flameOpacity = this.isNitroActive && this.nitroRemaining > 0 ? 0.85 + Math.random() * 0.15 : 0;
      (this.playerPackage.nitroFlameL.material as THREE.MeshBasicMaterial).opacity = flameOpacity;
      (this.playerPackage.nitroFlameR.material as THREE.MeshBasicMaterial).opacity = flameOpacity;
      if (flameOpacity > 0) {
        const scale = 0.85 + Math.random() * 0.5;
        this.playerPackage.nitroFlameL.scale.set(scale, scale, 1.3 * scale);
        this.playerPackage.nitroFlameR.scale.set(scale, scale, 1.3 * scale);
      }
    }

    // 5. Update Dynamic Headlight Beam
    this.headlightSpot.intensity = this.currentMap.sceneryType === 'night' ? 3.8 : 1.8;
    this.headlightSpot.position.set(this.playerX, 0.85, this.playerZ + 0.8);
    this.headlightTarget.position.set(this.playerX - this.playerSteerSmooth * 1.5, 0.2, this.playerZ + 45);

    // 6. Update Audio RPM pitch
    sound.updateEnginePitch(
      this.playerSpeed / bikeStats.maxSpeed,
      this.isAccelerating,
      this.currentBike.engineSoundFreq
    );

    // 7. Endless Road & Coin Collection
    if (this.environment) {
      this.environment.updateRoad(this.playerZ);
      this.checkCoinCollections();
    }

    // 8. Traffic AI with dynamic lane merging
    this.updateTraffic(dt);

    // 9. Collision & Near-Miss Detection
    this.checkCollisionsAndNearMisses(dt);

    // 10. Dynamic Camera Follow
    this.updateCamera(dt);

    // 11. Update Session Stats
    this.sessionStats.currentSpeed = Math.round(this.playerSpeed);
    this.sessionStats.nitroRemaining = this.nitroRemaining;
    this.sessionStats.isNitroActive = this.isNitroActive;
    this.sessionStats.isBraking = this.isBraking;
    this.sessionStats.isAccelerating = this.isAccelerating;
    this.sessionStats.steerDirection = this.playerSteerSmooth;

    this.callbacks.onScoreUpdate({ ...this.sessionStats });
  }

  // --- CAMERA FOLLOW CONTROLLER ---
  private updateCamera(dt: number) {
    const speedRatio = this.playerSpeed / this.currentBike.baseMaxSpeed;
    const baseFov = 65;
    const nitroBoostFov = this.isNitroActive ? 14 : 0;
    const targetFov = baseFov + speedRatio * 16 + nitroBoostFov;
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1.0, dt * 7);
    this.camera.updateProjectionMatrix();

    let shakeX = 0;
    let shakeY = 0;
    if (this.settings.cameraShake) {
      const shakeMag = (this.isNitroActive ? 0.08 : (speedRatio > 0.8 ? 0.03 : 0.005)) + this.shakeIntensity;
      shakeX = (Math.random() - 0.5) * shakeMag;
      shakeY = (Math.random() - 0.5) * shakeMag;
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 2.2);
    }

    const mode = this.settings.cameraMode;
    if (mode === 'cockpit') {
      this.camera.position.set(
        this.playerX + shakeX,
        1.15 + shakeY,
        this.playerZ + 0.2
      );
      this.camera.lookAt(
        this.playerX - this.playerSteerSmooth * 0.5,
        1.05,
        this.playerZ + 28.0
      );
    } else if (mode === 'far') {
      const targetCamX = this.playerX * 0.65 + shakeX;
      const targetCamY = 4.2 + shakeY;
      const targetCamZ = this.playerZ - 7.5;

      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1.0, dt * 10);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1.0, dt * 10);
      this.camera.position.z = targetCamZ;
      this.camera.lookAt(this.playerX * 0.8, 1.2, this.playerZ + 16.0);
    } else {
      // Standard Chase Cam
      const dist = 4.8 * this.settings.cameraDistance;
      const height = 2.3 * this.settings.cameraDistance;
      const targetCamX = this.playerX * 0.75 + shakeX;
      const targetCamY = height + shakeY;
      const targetCamZ = this.playerZ - dist;

      this.camera.position.x += (targetCamX - this.camera.position.x) * Math.min(1.0, dt * 12);
      this.camera.position.y += (targetCamY - this.camera.position.y) * Math.min(1.0, dt * 12);
      this.camera.position.z = targetCamZ;
      this.camera.lookAt(this.playerX * 0.85, 1.3, this.playerZ + 18.0);
    }
  }

  // --- ACTIVE HIGHWAY TRAFFIC SYSTEM ---
  private clearTraffic() {
    for (const v of this.trafficVehicles) {
      this.scene.remove(v.mesh);
    }
    this.trafficVehicles = [];
  }

  private seedInitialTraffic() {
    // 5 Highway Lanes spanning the entire roadway:
    // Lane 0: Right Edge (-4.5), Lane 1: Mid-Right (-2.25), Lane 2: Center (0.0), Lane 3: Mid-Left (2.25), Lane 4: Left Edge (4.5)
    // Fair start: 2+ seconds of safe acceleration before the first obstacle in Lane 2 (Center) approaches naturally.
    // - Lane 2 has a cargo truck at +38m moving at 42 km/h.
    // - For the first 2 seconds, the truck is at safe distance (> 38m), giving clear reaction time.
    // - If player never steers and stays in the center, collision is guaranteed in ~4.0s (accelerating) or ~6.5s (idling)!
    // - If player steers to any other lane (left edge, right edge, mid lanes), obstacles exist across all 5 lanes!
    const initialLayout: { lane: number; zOffset: number; type: TrafficType; speed?: number }[] = [
      // Center Lane (Player's starting lane) - first obstacle in player's path
      { lane: 2, zOffset: 38, type: 'truck', speed: 42 },
      { lane: 0, zOffset: 46, type: 'suv', speed: 52 },    // Right edge lane
      { lane: 4, zOffset: 48, type: 'car', speed: 62 },    // Left edge lane
      { lane: 3, zOffset: 56, type: 'car', speed: 66 },    // Mid left lane
      { lane: 1, zOffset: 65, type: 'car', speed: 64 },    // Mid right lane

      { lane: 2, zOffset: 105, type: 'car', speed: 62 },   // Subsequent center obstacle
      { lane: 0, zOffset: 125, type: 'truck', speed: 50 }, // Right edge obstacle
      { lane: 4, zOffset: 120, type: 'bus', speed: 54 },   // Left edge obstacle
      { lane: 1, zOffset: 145, type: 'bus', speed: 56 },
      { lane: 3, zOffset: 135, type: 'truck', speed: 52 },

      { lane: 2, zOffset: 180, type: 'suv', speed: 65 },   // Further center obstacle
      { lane: 0, zOffset: 205, type: 'car', speed: 68 },   // Further right edge obstacle
      { lane: 4, zOffset: 195, type: 'suv', speed: 66 },   // Further left edge obstacle
      { lane: 1, zOffset: 225, type: 'car', speed: 70 },
      { lane: 3, zOffset: 215, type: 'car', speed: 72 },

      { lane: 2, zOffset: 255, type: 'car', speed: 68 },
      { lane: 0, zOffset: 280, type: 'suv', speed: 64 },
      { lane: 4, zOffset: 270, type: 'car', speed: 74 },
    ];

    for (const item of initialLayout) {
      this.spawnTrafficVehicle(item.lane, this.playerZ + item.zOffset, item.type, item.speed);
    }
  }

  private spawnTrafficVehicle(lane: number, zPos: number, forcedType?: TrafficType, forcedSpeed?: number) {
    const types: TrafficType[] = ['car', 'car', 'suv', 'truck', 'bus', 'moto'];
    const type = forcedType || types[Math.floor(Math.random() * types.length)];
    const { mesh, wheels, length, width, height, indicatorL, indicatorR } = TrafficBuilder.createVehicle(type);

    const safeLane = Math.max(0, Math.min(this.laneXPositions.length - 1, lane));
    const laneX = this.laneXPositions[safeLane];
    mesh.position.set(laneX, 0, zPos);
    this.scene.add(mesh);

    // Realistic highway cruising speeds (km/h) - relative to player's 100-200+ km/h
    let speed = 68;
    if (forcedSpeed !== undefined) {
      speed = forcedSpeed;
    } else {
      if (type === 'truck') speed = 46 + Math.random() * 10;
      else if (type === 'bus') speed = 50 + Math.random() * 10;
      else if (type === 'suv') speed = 58 + Math.random() * 12;
      else if (type === 'car') speed = 64 + Math.random() * 14;
      else if (type === 'moto') speed = 62 + Math.random() * 14;
    }

    const box = new THREE.Box3();
    box.setFromCenterAndSize(
      new THREE.Vector3(laneX, height / 2, zPos),
      new THREE.Vector3(width * 0.90, height, length * 0.90)
    );

    const vehicle: TrafficVehicle = {
      id: this.nextVehicleId++,
      mesh,
      wheels,
      type,
      lane: safeLane,
      speed,
      length,
      width,
      height,
      boundingBox: box,
      overtaken: false,
      nearMissed: false,
      active: true,
      isChangingLane: false,
      targetLane: safeLane,
      targetLaneX: laneX,
      startLaneX: laneX,
      laneChangeProgress: 0,
      indicatorL,
      indicatorR,
      indicatorTimer: 0,
    };

    this.trafficVehicles.push(vehicle);
    return vehicle;
  }

  private updateTraffic(dt: number) {
    // Current player lane (0: Right Edge, 1: Mid Right, 2: Center, 3: Mid Left, 4: Left Edge)
    const playerLane = this.getPlayerLane(this.playerX);

    // 1. Move and manage all active traffic vehicles
    for (let i = this.trafficVehicles.length - 1; i >= 0; i--) {
      const v = this.trafficVehicles[i];

      // Vehicle Following Distance AI: Slow down if approaching a vehicle ahead in the same lane
      let minGapAhead = Infinity;
      let vehicleAhead: TrafficVehicle | null = null;
      for (const other of this.trafficVehicles) {
        if (other.id !== v.id && other.lane === v.lane && other.mesh.position.z > v.mesh.position.z) {
          const gap = other.mesh.position.z - v.mesh.position.z;
          if (gap < minGapAhead) {
            minGapAhead = gap;
            vehicleAhead = other;
          }
        }
      }

      if (vehicleAhead && minGapAhead < 22.0) {
        // Yield to vehicle ahead
        v.speed = Math.min(v.speed, vehicleAhead.speed - 1);

        // Stuck behind a slower truck or bus: chance to initiate a lane change!
        if (minGapAhead < 18.0 && !v.isChangingLane && Math.random() < dt * 0.6) {
          const candidateLanes = [v.lane - 1, v.lane + 1].filter(l => l >= 0 && l < 5);
          for (const nextLane of candidateLanes) {
            const nextLaneX = this.laneXPositions[nextLane];
            const laneBlocked = this.trafficVehicles.some(
              other => other.id !== v.id && other.lane === nextLane && Math.abs(other.mesh.position.z - v.mesh.position.z) < 26.0
            );
            const closeToPlayer = Math.abs(this.playerZ - v.mesh.position.z) < 24.0;
            if (!laneBlocked && !closeToPlayer) {
              v.isChangingLane = true;
              v.targetLane = nextLane;
              v.startLaneX = v.mesh.position.x;
              v.targetLaneX = nextLaneX;
              v.laneChangeProgress = 0;
              v.indicatorTimer = 0;
              break;
            }
          }
        }
      }

      // Move vehicle forward along Z
      const deltaZ = (v.speed / 3.6) * dt;
      v.mesh.position.z += deltaZ;

      // Wheel rotation animation
      const wheelCircumference = 2 * Math.PI * 0.35;
      const wRot = (deltaZ / wheelCircumference) * (2 * Math.PI);
      for (const w of v.wheels) {
        w.rotation.x += wRot;
      }

      // Smooth Dynamic Lane Change
      if (v.isChangingLane) {
        v.laneChangeProgress += dt * 0.85; // ~1.2s to smoothly merge
        v.mesh.position.x = THREE.MathUtils.lerp(v.startLaneX, v.targetLaneX, v.laneChangeProgress);

        // Flash turn signal indicator
        v.indicatorTimer += dt * 8;
        const flash = Math.sin(v.indicatorTimer) > 0 ? 1.0 : 0;
        if (v.targetLaneX > v.startLaneX) {
          // Moving in +X (Leftward)
          (v.indicatorL.material as THREE.MeshBasicMaterial).opacity = flash;
          (v.indicatorR.material as THREE.MeshBasicMaterial).opacity = 0;
        } else {
          // Moving in -X (Rightward)
          (v.indicatorR.material as THREE.MeshBasicMaterial).opacity = flash;
          (v.indicatorL.material as THREE.MeshBasicMaterial).opacity = 0;
        }

        if (v.laneChangeProgress >= 1.0) {
          v.mesh.position.x = v.targetLaneX;
          v.lane = v.targetLane;
          v.isChangingLane = false;
          (v.indicatorL.material as THREE.MeshBasicMaterial).opacity = 0;
          (v.indicatorR.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      } else {
        // Natural highway lane changes for cars, SUVs, and commuter bikes (3.5% chance per second)
        // CRITICAL: A vehicle directly ahead of the player in the player's lane NEVER dodges out of the way!
        // This ensures the player cannot simply idle or cruise straight forever without steering!
        const isDirectObstacleForPlayer = (v.lane === playerLane) && (v.mesh.position.z > this.playerZ) && (v.mesh.position.z < this.playerZ + 70.0);

        if (!isDirectObstacleForPlayer && Math.random() < dt * 0.035 && (v.type === 'car' || v.type === 'suv' || v.type === 'moto')) {
          const possibleLanes = [v.lane - 1, v.lane + 1].filter(l => l >= 0 && l < 5);
          if (possibleLanes.length > 0) {
            const nextLane = possibleLanes[Math.floor(Math.random() * possibleLanes.length)];
            const targetX = this.laneXPositions[nextLane];
            const laneBlocked = this.trafficVehicles.some(
              other => other.id !== v.id && other.lane === nextLane && Math.abs(other.mesh.position.z - v.mesh.position.z) < 28.0
            );
            // Don't cut right in front of player (< 30m)
            const dangerouslyCloseToPlayer = Math.abs(v.mesh.position.z - this.playerZ) < 30.0;

            if (!laneBlocked && !dangerouslyCloseToPlayer) {
              v.isChangingLane = true;
              v.targetLane = nextLane;
              v.startLaneX = v.mesh.position.x;
              v.targetLaneX = targetX;
              v.laneChangeProgress = 0;
              v.indicatorTimer = 0;
            }
          }
        }
      }

      // Update 3D collision bounding box in world space
      v.boundingBox.setFromCenterAndSize(
        new THREE.Vector3(v.mesh.position.x, v.height / 2, v.mesh.position.z),
        new THREE.Vector3(v.width * 0.90, v.height, v.length * 0.90)
      );

      // Despawn when vehicle falls behind (-35m) or moves far ahead (+450m)
      if (v.mesh.position.z < this.playerZ - 35 || v.mesh.position.z > this.playerZ + 450) {
        this.scene.remove(v.mesh);
        this.trafficVehicles.splice(i, 1);
      }
    }

    // 2. Continuous Highway Traffic Spawning
    // Gradually increase traffic density as score & distance increase
    const distanceKm = this.sessionStats.distance / 1000;
    const densityFactor = this.currentMap.trafficDensity || 1.0;
    const dynamicMaxTraffic = Math.min(22, Math.floor(13 * densityFactor + distanceKm * 3.0));
    const spawnInterval = Math.max(0.40, (0.85 - distanceKm * 0.12) / densityFactor);

    if (this.trafficSpawnTimer >= spawnInterval) {
      this.spawnAttemptCounter++;

      // Check if there is an obstacle in player's lane ahead within 110m
      const hasVehicleInPlayerPath = this.trafficVehicles.some(
        v => v.lane === playerLane && v.mesh.position.z > this.playerZ + 12.0 && v.mesh.position.z < this.playerZ + 110.0
      );

      // Priority 1: If player's current lane (center, edge, or mid) lacks an obstacle ahead, ALWAYS target player's lane!
      let targetLane: number;
      if (!hasVehicleInPlayerPath) {
        targetLane = playerLane;
      } else if (this.trafficVehicles.length < dynamicMaxTraffic) {
        // Otherwise balance traffic across all 5 lanes by picking the lane with fewest vehicles ahead
        const laneCounts = [0, 0, 0, 0, 0];
        for (const v of this.trafficVehicles) {
          if (v.lane >= 0 && v.lane < 5 && v.mesh.position.z > this.playerZ) {
            laneCounts[v.lane]++;
          }
        }
        targetLane = laneCounts.indexOf(Math.min(...laneCounts));
      } else {
        return; // Capacity reached and player path has traffic
      }

      // Calculate spawn distance ahead based on player speed (guarantees safe visibility & reaction time)
      const minSpawnDist = Math.max(65, (this.playerSpeed / 3.6) * 1.8);
      const spawnZ = this.playerZ + minSpawnDist + 10 + Math.random() * 35;

      // Clearance check: verify no vehicle is within 22m of spawnZ in targetLane
      let laneBlocked = this.trafficVehicles.some(
        v => v.lane === targetLane && Math.abs(v.mesh.position.z - spawnZ) < 22.0
      );

      // If chosen lane is blocked and it wasn't strictly required for player's empty lane, try alternative lane
      if (laneBlocked && hasVehicleInPlayerPath) {
        for (let altLane = 0; altLane < 5; altLane++) {
          if (altLane !== targetLane) {
            const altBlocked = this.trafficVehicles.some(
              v => v.lane === altLane && Math.abs(v.mesh.position.z - spawnZ) < 22.0
            );
            if (!altBlocked) {
              targetLane = altLane;
              laneBlocked = false;
              break;
            }
          }
        }
      } else if (laneBlocked && !hasVehicleInPlayerPath) {
        // For player's path, adjust spawnZ further ahead so it can still spawn
        const adjustedZ = spawnZ + 25.0;
        const stillBlocked = this.trafficVehicles.some(
          v => v.lane === targetLane && Math.abs(v.mesh.position.z - adjustedZ) < 22.0
        );
        if (!stillBlocked) {
          this.spawnTrafficVehicle(targetLane, adjustedZ);
          this.trafficSpawnTimer = 0;
          return;
        }
      }

      // Fair Play Check: Never block all 5 lanes at the same Z coordinate (leave at least 2 lanes open)
      let lanesBlockedAtZ = 0;
      for (let l = 0; l < 5; l++) {
        if (l !== targetLane) {
          const hasVeh = this.trafficVehicles.some(
            v => v.lane === l && Math.abs(v.mesh.position.z - spawnZ) < 16.0
          );
          if (hasVeh) lanesBlockedAtZ++;
        }
      }

      // If clearance is satisfied and path allows weaving/overtaking, spawn
      if (!laneBlocked && lanesBlockedAtZ < 4) {
        this.spawnTrafficVehicle(targetLane, spawnZ);
        this.trafficSpawnTimer = 0;
      }
    }
  }

  // --- COLLISION & NEAR-MISS DETECTION ---
  private checkCollisionsAndNearMisses(dt: number) {
    if (!this.playerPackage || this.isCrashing) return;

    // Accurate 3D motorcycle physical collision volume matching visible sports bike
    const playerHalfWidth = 0.44;
    const playerHalfLength = 1.08;
    const playerBox = new THREE.Box3(
      new THREE.Vector3(this.playerX - playerHalfWidth, 0.1, this.playerZ - playerHalfLength),
      new THREE.Vector3(this.playerX + playerHalfWidth, 1.4, this.playerZ + playerHalfLength)
    );

    if (this.nearMissCooldown > 0) {
      this.nearMissCooldown -= dt;
    }

    for (const v of this.trafficVehicles) {
      // 1. Crash Collision Check: works in any lane, road edge, or off-road
      if (playerBox.intersectsBox(v.boundingBox)) {
        this.triggerCrash();
        return;
      }

      // 2. Near-Miss Check (within lateral limit and close Z, traveling at speed >= 70 km/h)
      const dx = Math.abs(this.playerX - v.mesh.position.x);
      const dz = Math.abs(this.playerZ - v.mesh.position.z);
      const nearMissLateralLimit = (v.width / 2) + playerHalfWidth + 0.95;
      const nearMissZLimit = v.length / 2 + 0.9;

      if (!v.nearMissed && this.playerSpeed >= 70 && dx < nearMissLateralLimit && dz < nearMissZLimit) {
        v.nearMissed = true;
        this.sessionStats.nearMisses++;
        this.consecutiveNearMisses++;
        this.shakeIntensity = 0.09;

        const bonusScore = 500 * Math.min(this.consecutiveNearMisses, 5);
        this.sessionStats.score += bonusScore;
        sound.playNearMiss();
        this.callbacks.onNearMiss(this.consecutiveNearMisses);
      }

      // 3. Overtake Check
      if (!v.overtaken && this.playerZ > v.mesh.position.z + v.length / 2 + 1.0) {
        v.overtaken = true;
        this.sessionStats.overtakes++;
        this.sessionStats.score += 150;
      }
    }
  }

  // --- COIN COLLECTION ---
  private checkCoinCollections() {
    if (!this.environment) return;
    const playerPos = new THREE.Vector3(this.playerX, 0.6, this.playerZ);

    for (const seg of this.environment.roadSegments) {
      for (const coin of seg.coins) {
        if (!coin.visible) continue;

        const coinWorldPos = new THREE.Vector3();
        coin.getWorldPosition(coinWorldPos);

        const dist = playerPos.distanceTo(coinWorldPos);
        if (dist < 1.85) {
          coin.visible = false;
          this.sessionStats.coinsCollected++;
          this.sessionStats.score += 200;
          sound.playCoin();
          this.callbacks.onCoinCollected(this.sessionStats.coinsCollected);
        }
      }
    }
  }

  // --- CRASH HANDLING ---
  private triggerCrash() {
    this.isCrashing = true;
    sound.stopEngine();
    sound.playNitro(false);
    sound.playCrash();

    if (this.sparkParticles && this.sparkPositions) {
      (this.sparkParticles.material as THREE.PointsMaterial).opacity = 1.0;
      for (let i = 0; i < this.sparkPositions.length; i += 3) {
        this.sparkPositions[i] = this.playerX + (Math.random() - 0.5) * 1.6;
        this.sparkPositions[i + 1] = 0.5 + Math.random() * 1.6;
        this.sparkPositions[i + 2] = this.playerZ + (Math.random() - 0.5) * 2.2;
      }
      this.sparkParticles.geometry.attributes.position.needsUpdate = true;
    }

    this.shakeIntensity = 0.45;

    setTimeout(() => {
      this.isRunning = false;
      this.callbacks.onCrash({ ...this.sessionStats });
    }, 1200);
  }

  private updateCrashAnimation(dt: number) {
    this.playerSpeed = Math.max(0, this.playerSpeed - 190 * dt);
    this.playerZ += (this.playerSpeed / 3.6) * dt;

    if (this.playerPackage) {
      this.playerPackage.root.position.set(this.playerX, Math.max(0.2, this.playerPackage.root.position.y), this.playerZ);
      this.playerPackage.root.rotation.x += dt * 8.5;
      this.playerPackage.root.rotation.z += dt * 6.5;
      this.playerPackage.root.rotation.y += dt * 4.5;
    }

    if (this.sparkParticles && (this.sparkParticles.material as THREE.PointsMaterial).opacity > 0) {
      (this.sparkParticles.material as THREE.PointsMaterial).opacity -= dt * 0.85;
    }

    this.updateCamera(dt);
  }

  // --- INPUT HANDLERS ---
  public setSteering(val: number) {
    this.playerSteerInput = Math.max(-1, Math.min(1, val));
  }

  public setAccelerating(active: boolean) {
    this.isAccelerating = active;
  }

  public setBraking(active: boolean) {
    this.isBraking = active;
    if (active && this.playerSpeed > 35) {
      sound.playBrake();
    }
  }

  public setNitro(active: boolean) {
    if (active && this.nitroRemaining > 0.05 && this.isRunning && !this.isPaused && !this.isCrashing) {
      this.isNitroActive = true;
      sound.playNitro(true);
    } else {
      this.isNitroActive = false;
      sound.playNitro(false);
    }
  }

  public switchCameraMode() {
    const modes: ('chase' | 'cockpit' | 'far')[] = ['chase', 'cockpit', 'far'];
    const currentIdx = modes.indexOf(this.settings.cameraMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    this.settings.cameraMode = nextMode;
    sound.playClick();
    return nextMode;
  }

  private render() {
    this.renderer.render(this.scene, this.camera);
  }

  public dispose() {
    this.stopLoop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
