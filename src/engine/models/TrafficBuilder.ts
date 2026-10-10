import * as THREE from 'three';

export type TrafficType = 'car' | 'suv' | 'truck' | 'bus' | 'moto';

export interface TrafficVehicle {
  id: number;
  mesh: THREE.Group;
  wheels: THREE.Group[];
  type: TrafficType;
  lane: number;
  speed: number; // km/h
  length: number;
  width: number;
  height: number;
  boundingBox: THREE.Box3;
  overtaken: boolean;
  nearMissed: boolean;
  active: boolean;

  // Dynamic AI behaviors
  isChangingLane: boolean;
  targetLane: number;
  targetLaneX: number;
  startLaneX: number;
  laneChangeProgress: number; // 0 to 1
  indicatorL: THREE.Mesh;
  indicatorR: THREE.Mesh;
  indicatorTimer: number;
}

export class TrafficBuilder {
  private static carColors = [
    0x2563eb, // Sapphire Royal Blue
    0xdc2626, // Crimson Racing Red
    0xf8fafc, // Pearl White
    0xe2e8f0, // Brilliant Silver
    0xeab308, // Solar Yellow
    0xf97316, // Vivid Amber Orange
    0x06b6d4, // Electric Cyan
    0x16a34a, // Emerald Green
    0x8b5cf6, // Vibrant Purple
  ];

  public static createVehicle(type: TrafficType): {
    mesh: THREE.Group;
    wheels: THREE.Group[];
    length: number;
    width: number;
    height: number;
    indicatorL: THREE.Mesh;
    indicatorR: THREE.Mesh;
  } {
    const group = new THREE.Group();
    const wheels: THREE.Group[] = [];
    const color = this.carColors[Math.floor(Math.random() * this.carColors.length)];

    // Vibrant automotive clearcoat with strong diffuse visibility from all angles
    const bodyMat = new THREE.MeshStandardMaterial({
      color,
      metalness: 0.28,
      roughness: 0.32,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.15,
      metalness: 0.45,
    });
    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.85,
    });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.9,
      roughness: 0.18,
    });
    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffee,
      emissiveIntensity: 2.6,
      roughness: 0.1,
    });
    const taillightMat = new THREE.MeshStandardMaterial({
      color: 0xff2222,
      emissive: 0xff0505,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const indicatorMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0,
    });

    const createWheel = (r: number, w: number) => {
      const g = new THREE.Group();
      const tire = new THREE.Mesh(new THREE.CylinderGeometry(r, r, w, 14), tireMat);
      tire.rotateZ(Math.PI / 2);
      tire.castShadow = true;
      g.add(tire);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.58, r * 0.58, w * 1.05, 10), rimMat);
      hub.rotateZ(Math.PI / 2);
      g.add(hub);
      return g;
    };

    let length = 4.4;
    let width = 2.0;
    let height = 1.4;

    // Indicators (Orange flashing markers)
    const indGeo = new THREE.BoxGeometry(0.12, 0.1, 0.08);
    const indicatorL = new THREE.Mesh(indGeo, indicatorMat.clone());
    const indicatorR = new THREE.Mesh(indGeo, indicatorMat.clone());

    if (type === 'car') {
      length = 4.5;
      width = 2.0;
      height = 1.35;

      // Lower streamlined chassis
      const lower = new THREE.Mesh(new THREE.BoxGeometry(width, 0.55, length), bodyMat);
      lower.position.y = 0.45;
      lower.castShadow = true;
      group.add(lower);

      // Front bumper & grille with dark mesh and chrome surround
      const grilleMat = new THREE.MeshStandardMaterial({ color: 0x111113, roughness: 0.8, metalness: 0.5 });
      const grille = new THREE.Mesh(new THREE.BoxGeometry(width * 0.72, 0.22, 0.04), grilleMat);
      grille.position.set(0, 0.42, length / 2 + 0.01);
      group.add(grille);

      // Cabin / Sloped aerodynamic greenhouse windshield & windows
      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.86, 0.48, length * 0.54), glassMat);
      cabin.position.set(0, 0.93, -0.15);
      cabin.castShadow = true;
      group.add(cabin);

      // Side view mirrors
      const mirrorMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.7 });
      const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.08), mirrorMat);
      mirrorL.position.set(-width / 2 - 0.09, 0.85, 0.4);
      const mirrorR = mirrorL.clone();
      mirrorR.position.x = width / 2 + 0.09;
      group.add(mirrorL, mirrorR);

      // Rear Diffuser with twin chrome exhaust tips
      const exhaustMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const pipeL = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10), exhaustMat);
      pipeL.rotateX(Math.PI / 2);
      pipeL.position.set(-0.55, 0.28, -length / 2 - 0.02);
      const pipeR = pipeL.clone();
      pipeR.position.x = 0.55;
      group.add(pipeL, pipeR);

      // Sports rear spoiler wing
      const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(width * 0.88, 0.05, 0.28), bodyMat);
      spoilerWing.position.set(0, 0.92, -length / 2 + 0.2);
      const spoilerStalkL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.06), bodyMat);
      spoilerStalkL.position.set(-width * 0.35, 0.82, -length / 2 + 0.2);
      const spoilerStalkR = spoilerStalkL.clone();
      spoilerStalkR.position.x = width * 0.35;
      group.add(spoilerWing, spoilerStalkL, spoilerStalkR);

      // Headlights with bright daytime running lights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.14, 0.06), headlightMat);
      hl1.position.set(-0.7, 0.48, length / 2);
      const hl2 = hl1.clone();
      hl2.position.x = 0.7;
      group.add(hl1, hl2);

      // Taillights
      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.12, 0.06), taillightMat);
      tl1.position.set(-0.7, 0.52, -length / 2);
      const tl2 = tl1.clone();
      tl2.position.x = 0.7;
      group.add(tl1, tl2);

      // Position Indicators: in camera view space, +X is screen Left and -X is screen Right
      indicatorL.position.set(width / 2 - 0.05, 0.5, -length / 2 + 0.2);
      indicatorR.position.set(-width / 2 + 0.05, 0.5, -length / 2 + 0.2);
      group.add(indicatorL, indicatorR);

      // Wheels
      const wRadius = 0.33;
      const wWidth = 0.22;
      const wZ = length * 0.32;
      const wX = width * 0.48;

      [[-wX, wZ], [wX, wZ], [-wX, -wZ], [wX, -wZ]].forEach(([x, z]) => {
        const w = createWheel(wRadius, wWidth);
        w.position.set(x, wRadius, z);
        wheels.push(w);
        group.add(w);
      });
    } else if (type === 'suv') {
      length = 4.9;
      width = 2.15;
      height = 1.75;

      const lower = new THREE.Mesh(new THREE.BoxGeometry(width, 0.72, length), bodyMat);
      lower.position.y = 0.56;
      lower.castShadow = true;
      group.add(lower);

      // SUV Rugged Front Grille
      const suvGrilleMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7, metalness: 0.6 });
      const suvGrille = new THREE.Mesh(new THREE.BoxGeometry(width * 0.78, 0.35, 0.05), suvGrilleMat);
      suvGrille.position.set(0, 0.58, length / 2 + 0.01);
      group.add(suvGrille);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(width * 0.9, 0.65, length * 0.66), glassMat);
      cabin.position.set(0, 1.2, -0.2);
      cabin.castShadow = true;
      group.add(cabin);

      // SUV Side Mirrors
      const suvMirrorMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.6 });
      const suvMirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.09), suvMirrorMat);
      suvMirrorL.position.set(-width / 2 - 0.1, 1.15, 0.6);
      const suvMirrorR = suvMirrorL.clone();
      suvMirrorR.position.x = width / 2 + 0.1;
      group.add(suvMirrorL, suvMirrorR);

      // Roof rails
      const railMat = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
      const railL = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, length * 0.62), railMat);
      railL.position.set(-width * 0.4, 1.55, -0.2);
      const railR = railL.clone();
      railR.position.x = width * 0.4;
      group.add(railL, railR);

      // Headlights & Taillights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.06), headlightMat);
      hl1.position.set(-0.78, 0.62, length / 2);
      const hl2 = hl1.clone();
      hl2.position.x = 0.78;
      group.add(hl1, hl2);

      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.22, 0.06), taillightMat);
      tl1.position.set(-0.78, 0.68, -length / 2);
      const tl2 = tl1.clone();
      tl2.position.x = 0.78;
      group.add(tl1, tl2);

      indicatorL.position.set(width / 2 - 0.05, 0.6, -length / 2 + 0.2);
      indicatorR.position.set(-width / 2 + 0.05, 0.6, -length / 2 + 0.2);
      group.add(indicatorL, indicatorR);

      const wRadius = 0.39;
      const wWidth = 0.27;
      const wZ = length * 0.32;
      const wX = width * 0.48;

      [[-wX, wZ], [wX, wZ], [-wX, -wZ], [wX, -wZ]].forEach(([x, z]) => {
        const w = createWheel(wRadius, wWidth);
        w.position.set(x, wRadius, z);
        wheels.push(w);
        group.add(w);
      });
    } else if (type === 'truck') {
      length = 10.2;
      width = 2.6;
      height = 3.6;

      // Heavy Tractor Cabin
      const cab = new THREE.Mesh(new THREE.BoxGeometry(width, 2.3, 2.6), bodyMat);
      cab.position.set(0, 1.7, length * 0.34);
      cab.castShadow = true;
      group.add(cab);

      // Windshield
      const ws = new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.85, 0.1), glassMat);
      ws.position.set(0, 2.2, length * 0.34 + 1.31);
      group.add(ws);

      // Chrome Smokestacks (Exhaust vertical pipes behind cab)
      const stackGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
      const stackMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 });
      const stackL = new THREE.Mesh(stackGeo, stackMat);
      stackL.position.set(-width * 0.46, 2.6, length * 0.34 - 1.2);
      const stackR = stackL.clone();
      stackR.position.x = width * 0.46;
      group.add(stackL, stackR);

      // Cargo Container with vibrant freight liveries (blue, red, yellow, green, silver, orange)
      const containerColors = [0x2563eb, 0xdc2626, 0xeab308, 0x16a34a, 0xe2e8f0, 0xf97316];
      const containerColor = containerColors[Math.floor(Math.random() * containerColors.length)];
      const containerMat = new THREE.MeshStandardMaterial({
        color: containerColor,
        metalness: 0.25,
        roughness: 0.42,
      });
      const container = new THREE.Mesh(new THREE.BoxGeometry(width * 0.98, 2.6, 7.0), containerMat);
      container.position.set(0, 2.0, -1.3);
      container.castShadow = true;
      group.add(container);

      // Headlights & Taillights
      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.06), headlightMat);
      hl1.position.set(-0.95, 0.85, length * 0.34 + 1.31);
      const hl2 = hl1.clone();
      hl2.position.x = 0.95;
      group.add(hl1, hl2);

      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.18, 0.06), taillightMat);
      tl1.position.set(-0.95, 0.75, -4.8);
      const tl2 = tl1.clone();
      tl2.position.x = 0.95;
      group.add(tl1, tl2);

      indicatorL.position.set(width / 2 - 0.05, 0.75, -4.6);
      indicatorR.position.set(-width / 2 + 0.05, 0.75, -4.6);
      group.add(indicatorL, indicatorR);

      const wRadius = 0.5;
      const wWidth = 0.34;
      const wX = width * 0.46;
      const wheelZs = [length * 0.36, -0.6, -2.6, -4.4];

      wheelZs.forEach(z => {
        [-wX, wX].forEach(x => {
          const w = createWheel(wRadius, wWidth);
          w.position.set(x, wRadius, z);
          wheels.push(w);
          group.add(w);
        });
      });
    } else if (type === 'bus') {
      length = 11.0;
      width = 2.65;
      height = 3.3;

      const busMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.28, roughness: 0.35 });
      const busBody = new THREE.Mesh(new THREE.BoxGeometry(width, 2.5, length), busMat);
      busBody.position.set(0, 1.75, 0);
      busBody.castShadow = true;
      group.add(busBody);

      const windowBand = new THREE.Mesh(new THREE.BoxGeometry(width * 1.01, 0.95, length * 0.94), glassMat);
      windowBand.position.set(0, 2.1, 0);
      group.add(windowBand);

      const hl1 = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.06), headlightMat);
      hl1.position.set(-0.98, 0.85, length / 2);
      const hl2 = hl1.clone();
      hl2.position.x = 0.98;
      group.add(hl1, hl2);

      const tl1 = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.32, 0.06), taillightMat);
      tl1.position.set(-0.98, 1.05, -length / 2);
      const tl2 = tl1.clone();
      tl2.position.x = 0.98;
      group.add(tl1, tl2);

      indicatorL.position.set(width / 2 - 0.05, 0.8, -length / 2 + 0.2);
      indicatorR.position.set(-width / 2 + 0.05, 0.8, -length / 2 + 0.2);
      group.add(indicatorL, indicatorR);

      const wRadius = 0.48;
      const wWidth = 0.32;
      const wX = width * 0.46;
      const wheelZs = [length * 0.35, -length * 0.35];

      wheelZs.forEach(z => {
        [-wX, wX].forEach(x => {
          const w = createWheel(wRadius, wWidth);
          w.position.set(x, wRadius, z);
          wheels.push(w);
          group.add(w);
        });
      });
    } else {
      // Commuter Motorbike
      length = 2.3;
      width = 0.85;
      height = 1.4;

      const bikeBody = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.45, 1.3), bodyMat);
      bikeBody.position.set(0, 0.62, 0);
      group.add(bikeBody);

      const riderMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.65, metalness: 0.1 });
      const rider = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.68, 0.32), riderMat);
      rider.position.set(0, 0.98, -0.15);
      group.add(rider);

      const hl = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.05), headlightMat);
      hl.position.set(0, 0.75, 0.7);
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.05), taillightMat);
      tl.position.set(0, 0.75, -0.7);
      group.add(hl, tl);

      indicatorL.position.set(0.25, 0.7, -0.6);
      indicatorR.position.set(-0.25, 0.7, -0.6);
      group.add(indicatorL, indicatorR);

      const wRadius = 0.29;
      const wWidth = 0.12;
      const w1 = createWheel(wRadius, wWidth);
      w1.position.set(0, wRadius, 0.75);
      const w2 = createWheel(wRadius, wWidth);
      w2.position.set(0, wRadius, -0.75);
      wheels.push(w1, w2);
      group.add(w1, w2);
    }

    return { mesh: group, wheels, length, width, height, indicatorL, indicatorR };
  }
}
