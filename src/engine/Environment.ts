import * as THREE from 'three';
import { MapConfig } from '../types/game';
import { TextureGenerator } from './TextureGenerator';

export interface RoadSegment {
  root: THREE.Group;
  zPos: number;
  length: number;
  coins: THREE.Group[];
}

export class Environment {
  public scene: THREE.Scene;
  public mapConfig: MapConfig;
  public roadSegments: RoadSegment[] = [];
  public segmentLength = 60;
  public totalSegments = 10;
  public roadWidth = 14; // 4 lanes (each ~3.5m)
  private skyBackdrop: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, mapConfig: MapConfig) {
    this.scene = scene;
    this.mapConfig = mapConfig;
    this.applyAtmosphere();
    this.initRoadSegments();
  }

  public applyAtmosphere() {
    this.scene.background = new THREE.Color(this.mapConfig.skyColor);
    this.scene.fog = new THREE.Fog(
      this.mapConfig.fogColor,
      this.mapConfig.fogNear,
      this.mapConfig.fogFar
    );

    if (this.skyBackdrop) {
      this.scene.remove(this.skyBackdrop);
    }
    const isNight = this.mapConfig.sceneryType === 'night';
    this.skyBackdrop = TextureGenerator.createSkyBackdrop(
      this.mapConfig.skyColor,
      this.mapConfig.fogColor,
      isNight,
      this.mapConfig.sceneryType
    );
    this.scene.add(this.skyBackdrop);
  }

  public updateMap(newConfig: MapConfig) {
    this.mapConfig = newConfig;
    this.applyAtmosphere();
    this.clearSegments();
    this.initRoadSegments();
  }

  private clearSegments() {
    for (const seg of this.roadSegments) {
      this.scene.remove(seg.root);
    }
    this.roadSegments = [];
  }

  private initRoadSegments() {
    for (let i = 0; i < this.totalSegments; i++) {
      const zPos = (i - 2) * this.segmentLength;
      const seg = this.createSegment(zPos);
      this.roadSegments.push(seg);
      this.scene.add(seg.root);
    }
  }

  public createSegment(zPos: number): RoadSegment {
    const root = new THREE.Group();
    root.position.z = zPos;

    // HD Asphalt surface with procedural bump, roughness, and aggregate grain
    const roadGeo = new THREE.PlaneGeometry(this.roadWidth, this.segmentLength, 2, 2);
    roadGeo.rotateX(-Math.PI / 2);

    const asphaltTex = TextureGenerator.getAsphaltTexture();
    const bumpTex = TextureGenerator.getAsphaltBumpTexture();
    const roughnessTex = TextureGenerator.getAsphaltRoughnessTexture();

    const isNight = this.mapConfig.sceneryType === 'night';
    // Realistic medium-dark grey asphalt (#45494D) with subtle sun reflections
    const roadMat = new THREE.MeshStandardMaterial({
      color: isNight ? 0x606670 : 0xffffff,
      map: asphaltTex,
      bumpMap: bumpTex,
      bumpScale: 0.02,
      roughnessMap: roughnessTex,
      roughness: isNight ? 0.42 : 0.68, // subtle sunlight specular sheen without looking wet
      metalness: isNight ? 0.25 : 0.06,
    });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    root.add(roadMesh);

    // Shoulder gravel / borders
    const shoulderWidth = 4;
    const shoulderGeo = new THREE.PlaneGeometry(shoulderWidth, this.segmentLength);
    shoulderGeo.rotateX(-Math.PI / 2);
    const shoulderMat = new THREE.MeshStandardMaterial({
      color: this.mapConfig.groundColor,
      roughness: 0.92,
      bumpMap: bumpTex,
      bumpScale: 0.06,
    });

    const shoulderL = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderL.position.x = -this.roadWidth / 2 - shoulderWidth / 2;
    shoulderL.receiveShadow = true;
    root.add(shoulderL);

    const shoulderR = new THREE.Mesh(shoulderGeo, shoulderMat);
    shoulderR.position.x = this.roadWidth / 2 + shoulderWidth / 2;
    shoulderR.receiveShadow = true;
    root.add(shoulderR);

    // Distant terrain ground planes
    const terrainWidth = 180;
    const terrainGeo = new THREE.PlaneGeometry(terrainWidth, this.segmentLength);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainL = new THREE.Mesh(terrainGeo, shoulderMat);
    terrainL.position.x = -this.roadWidth / 2 - shoulderWidth - terrainWidth / 2;
    terrainL.position.y = -0.05;
    terrainL.receiveShadow = true;
    root.add(terrainL);

    const terrainR = new THREE.Mesh(terrainGeo, shoulderMat);
    terrainR.position.x = this.roadWidth / 2 + shoulderWidth + terrainWidth / 2;
    terrainR.position.y = -0.05;
    terrainR.receiveShadow = true;
    root.add(terrainR);

    // Lane Markings: Bright white dashed lines with high distant visibility
    const dashLength = 4.5;
    const dashGap = 4.5;
    const dashMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.05,
      emissive: 0xffffff,
      emissiveIntensity: isNight ? 0.75 : 0.35, // bright clarity at all distances & angles
    });
    const yellowMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.25,
      metalness: 0.05,
      emissive: 0xf59e0b,
      emissiveIntensity: isNight ? 0.8 : 0.4, // distinct yellow boundaries
    });

    // 5 clearly marked highway lanes with 4 bright dashed dividing lines
    const laneSeparators = [-3.375, -1.125, 1.125, 3.375];
    laneSeparators.forEach(x => {
      const numDashes = Math.floor(this.segmentLength / (dashLength + dashGap));
      for (let d = 0; d < numDashes; d++) {
        const dashGeo = new THREE.PlaneGeometry(0.28, dashLength);
        dashGeo.rotateX(-Math.PI / 2);
        const dash = new THREE.Mesh(dashGeo, dashMat);
        dash.position.set(x, 0.025, -this.segmentLength / 2 + d * (dashLength + dashGap) + dashLength / 2);
        dash.receiveShadow = true;
        root.add(dash);
      }
    });

    // Solid outer edge boundary lines (distinct vibrant Yellow borders at ±5.75m)
    const edgeLGeo = new THREE.PlaneGeometry(0.32, this.segmentLength);
    edgeLGeo.rotateX(-Math.PI / 2);
    const edgeL = new THREE.Mesh(edgeLGeo, yellowMat);
    edgeL.position.set(-5.75, 0.025, 0);
    edgeL.receiveShadow = true;
    root.add(edgeL);

    const edgeR = new THREE.Mesh(edgeLGeo, yellowMat);
    edgeR.position.set(5.75, 0.025, 0);
    edgeR.receiveShadow = true;
    root.add(edgeR);

    // Crash barriers (Corrugated W-Beam Guardrails)
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      metalness: 0.85,
      roughness: 0.25,
    });
    const railPostMat = new THREE.MeshStandardMaterial({
      color: 0x52525b,
      metalness: 0.7,
      roughness: 0.5,
    });

    [-this.roadWidth / 2 - 0.4, this.roadWidth / 2 + 0.4].forEach(x => {
      const beamGeo = new THREE.BoxGeometry(0.14, 0.38, this.segmentLength);
      const beam = new THREE.Mesh(beamGeo, railMat);
      beam.position.set(x, 0.48, 0);
      root.add(beam);

      // Support Posts every 6m
      for (let p = -this.segmentLength / 2 + 3; p < this.segmentLength / 2; p += 6) {
        const postGeo = new THREE.BoxGeometry(0.12, 0.55, 0.12);
        const post = new THREE.Mesh(postGeo, railPostMat);
        post.position.set(x, 0.28, p);
        root.add(post);

        // Road reflector (faceted cat-eye)
        const reflectorMat = new THREE.MeshStandardMaterial({
          color: x < 0 ? 0xffffff : 0xef4444,
          emissive: x < 0 ? 0xffffff : 0xef4444,
          emissiveIntensity: isNight ? 0.9 : 0.3,
          roughness: 0.1,
          metalness: 0.9,
        });
        const reflector = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), reflectorMat);
        reflector.position.set(x + (x < 0 ? 0.08 : -0.08), 0.52, p);
        root.add(reflector);
      }
    });

    // Theme-specific 3D Scenery
    this.addThemeScenery(root, this.mapConfig.sceneryType);

    // Collectible Coins on highway lanes
    const coins = this.spawnCoinsOnSegment(root);

    return { root, zPos, length: this.segmentLength, coins };
  }

  private addThemeScenery(root: THREE.Group, type: string) {
    if (type === 'indian') {
      // Lush green Indian highway with roadside trees, flowering bushes, overpasses, and signs
      const leafColors = [0x22c55e, 0x16a34a, 0x15803d, 0x4ade80, 0x65a30d];
      for (let i = 0; i < 7; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const xDist = side * (this.roadWidth / 2 + 3.5 + Math.random() * 25);
        const zDist = -this.segmentLength / 2 + Math.random() * this.segmentLength;

        const leafColor = leafColors[Math.floor(Math.random() * leafColors.length)];
        const tree = this.createTree(leafColor, 0x14532d);
        tree.position.set(xDist, 0, zDist);
        root.add(tree);
      }

      // Roadside bushes for rich organic greenery contrast
      for (let b = 0; b < 5; b++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const xDist = side * (this.roadWidth / 2 + 1.2 + Math.random() * 3.5);
        const zDist = -this.segmentLength / 2 + Math.random() * this.segmentLength;
        const bushGeo = new THREE.DodecahedronGeometry(0.65 + Math.random() * 0.45, 1);
        const bushMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.4 ? 0x22c55e : 0x16a34a,
          roughness: 0.85,
        });
        const bush = new THREE.Mesh(bushGeo, bushMat);
        bush.position.set(xDist, 0.42, zDist);
        bush.castShadow = true;
        root.add(bush);
      }

      if (Math.random() < 0.35) {
        const gantry = this.createHighwayGantry('NH-48 EXPRESSWAY', 'SPEED LIMIT 120');
        gantry.position.set(0, 0, 0);
        root.add(gantry);
      }
    } else if (type === 'city') {
      // Modern city skyscrapers, glass towers, and streetlights
      for (let i = 0; i < 4; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const xDist = side * (this.roadWidth / 2 + 6 + i * 7);
        const zDist = -this.segmentLength / 2 + 15 * i;

        const bHeight = 35 + Math.random() * 50;
        const bWidth = 14 + Math.random() * 8;
        const bGeo = new THREE.BoxGeometry(bWidth, bHeight, 18);
        const bMat = new THREE.MeshStandardMaterial({
          color: Math.random() > 0.5 ? 0x1e293b : 0x0f172a,
          metalness: 0.85,
          roughness: 0.25,
        });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(xDist, bHeight / 2, zDist);
        root.add(building);
      }

      // Modern streetlights
      [-this.roadWidth / 2 - 1.2, this.roadWidth / 2 + 1.2].forEach(x => {
        const lamp = this.createStreetlight(x > 0, false);
        lamp.position.set(x, 0, 0);
        root.add(lamp);
      });
    } else if (type === 'mountain') {
      // Alpine mountain peaks, boulders, pine trees
      for (let i = 0; i < 8; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const xDist = side * (this.roadWidth / 2 + 4 + Math.random() * 32);
        const zDist = -this.segmentLength / 2 + Math.random() * this.segmentLength;

        if (Math.random() > 0.35) {
          const pine = this.createPineTree();
          pine.position.set(xDist, 0, zDist);
          root.add(pine);
        } else {
          const rockGeo = new THREE.DodecahedronGeometry(2.8 + Math.random() * 3.8, 0);
          const rockMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95 });
          const rock = new THREE.Mesh(rockGeo, rockMat);
          rock.position.set(xDist, 1.6, zDist);
          rock.rotation.set(Math.random(), Math.random(), Math.random());
          root.add(rock);
        }
      }
    } else if (type === 'desert') {
      // Red rock sandstone buttes and utility poles
      for (let i = 0; i < 5; i++) {
        const side = Math.random() > 0.5 ? 1 : -1;
        const xDist = side * (this.roadWidth / 2 + 8 + Math.random() * 28);
        const zDist = -this.segmentLength / 2 + Math.random() * this.segmentLength;

        const butteHeight = 16 + Math.random() * 24;
        const butteGeo = new THREE.CylinderGeometry(8, 15, butteHeight, 7);
        const butteMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.95 });
        const butte = new THREE.Mesh(butteGeo, butteMat);
        butte.position.set(xDist, butteHeight / 2, zDist);
        root.add(butte);
      }

      [-this.roadWidth / 2 - 2.5].forEach(x => {
        const pole = this.createUtilityPole();
        pole.position.set(x, 0, 0);
        root.add(pole);
      });
    } else if (type === 'night') {
      // Illuminated night city skyscrapers with glowing window clusters
      for (let i = 0; i < 5; i++) {
        const side = i % 2 === 0 ? 1 : -1;
        const xDist = side * (this.roadWidth / 2 + 7 + i * 6);
        const zDist = -this.segmentLength / 2 + 12 * i;

        const bHeight = 42 + Math.random() * 55;
        const bGeo = new THREE.BoxGeometry(16, bHeight, 16);
        const bMat = new THREE.MeshStandardMaterial({
          color: 0x050811,
          metalness: 0.9,
          roughness: 0.2,
        });
        const building = new THREE.Mesh(bGeo, bMat);
        building.position.set(xDist, bHeight / 2, zDist);
        root.add(building);

        const windowGeo = new THREE.PlaneGeometry(10, bHeight * 0.7);
        const windowMat = new THREE.MeshBasicMaterial({
          color: Math.random() > 0.5 ? 0x38bdf8 : 0xfde047,
          wireframe: true,
        });
        const windowMesh = new THREE.Mesh(windowGeo, windowMat);
        windowMesh.position.set(xDist - side * 8.01, bHeight / 2, zDist);
        windowMesh.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
        root.add(windowMesh);
      }

      // Streetlights with illuminated amber bulbs
      [-this.roadWidth / 2 - 1.2, this.roadWidth / 2 + 1.2].forEach(x => {
        const lamp = this.createStreetlight(x > 0, true);
        lamp.position.set(x, 0, 0);
        root.add(lamp);
      });
    }
  }

  private createTree(leafColor: number, innerColor: number): THREE.Group {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543d2b, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 2.6, 6), trunkMat);
    trunk.position.y = 1.3;
    trunk.castShadow = true;
    group.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 });
    const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.2, 1), foliageMat);
    foliage.position.y = 3.4;
    foliage.castShadow = true;
    group.add(foliage);

    const topFoliage = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), new THREE.MeshStandardMaterial({ color: innerColor, roughness: 0.8 }));
    topFoliage.position.y = 4.6;
    group.add(topFoliage);

    return group;
  }

  private createPineTree(): THREE.Group {
    const group = new THREE.Group();
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.38, 2.4, 6), trunkMat);
    trunk.position.y = 1.2;
    group.add(trunk);

    const pineMat = new THREE.MeshStandardMaterial({ color: 0x1b4332, roughness: 0.8 });
    for (let c = 0; c < 3; c++) {
      const cone = new THREE.Mesh(new THREE.ConeGeometry(2.3 - c * 0.5, 2.5, 7), pineMat);
      cone.position.y = 2.5 + c * 1.6;
      cone.castShadow = true;
      group.add(cone);
    }
    return group;
  }

  private createStreetlight(isRightSide: boolean, glowing: boolean = false): THREE.Group {
    const group = new THREE.Group();
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 6.8, 8), poleMat);
    pole.position.y = 3.4;
    group.add(pole);

    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.3, 8), poleMat);
    arm.rotation.z = isRightSide ? -Math.PI / 3 : Math.PI / 3;
    arm.position.set(isRightSide ? -0.85 : 0.85, 6.7, 0);
    group.add(arm);

    const bulbMat = new THREE.MeshBasicMaterial({ color: glowing ? 0xffea79 : 0xe2e8f0 });
    const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.65), bulbMat);
    bulb.position.set(isRightSide ? -1.7 : 1.7, 7.0, 0);
    group.add(bulb);

    return group;
  }

  private createUtilityPole(): THREE.Group {
    const group = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.18, 7.2, 6), woodMat);
    pole.position.y = 3.6;
    group.add(pole);

    const crossArm = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.14, 0.14), woodMat);
    crossArm.position.y = 6.6;
    group.add(crossArm);
    return group;
  }

  private createHighwayGantry(text1: string, text2: string): THREE.Group {
    const group = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.3 });

    const pillarL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.5, 0.45), metalMat);
    pillarL.position.set(-this.roadWidth / 2 - 0.8, 3.75, 0);
    const pillarR = new THREE.Mesh(new THREE.BoxGeometry(0.45, 7.5, 0.45), metalMat);
    pillarR.position.set(this.roadWidth / 2 + 0.8, 3.75, 0);
    group.add(pillarL, pillarR);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(this.roadWidth + 2.2, 0.65, 0.45), metalMat);
    beam.position.set(0, 7.0, 0);
    group.add(beam);

    // Reflective green signboard with text
    const signTex = TextureGenerator.getGantrySignTexture(text1, text2);
    const signMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.4,
      metalness: 0.2,
    });
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(9.0, 2.25, 0.12), signMat);
    signBoard.position.set(0, 6.1, 0);
    group.add(signBoard);

    return group;
  }

  private spawnCoinsOnSegment(root: THREE.Group): THREE.Group[] {
    const coins: THREE.Group[] = [];
    if (Math.random() < 0.65) {
      const laneXs = [-4.5, -2.25, 0.0, 2.25, 4.5];
      const selectedLaneX = laneXs[Math.floor(Math.random() * laneXs.length)];
      const numCoins = 3 + Math.floor(Math.random() * 4);
      const spacing = 4.5;
      const startZ = -this.segmentLength / 2 + 10;

      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.12,
        emissive: 0xd97706,
        emissiveIntensity: 0.45,
      });

      for (let i = 0; i < numCoins; i++) {
        const coinGroup = new THREE.Group();
        const coinMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 14), coinMat);
        coinMesh.rotateX(Math.PI / 2);
        coinGroup.add(coinMesh);

        coinGroup.position.set(selectedLaneX, 0.65, startZ + i * spacing);
        root.add(coinGroup);
        coins.push(coinGroup);
      }
    }
    return coins;
  }

  public updateRoad(playerZ: number) {
    for (const seg of this.roadSegments) {
      if (seg.root.position.z < playerZ - this.segmentLength * 2.5) {
        const maxZ = Math.max(...this.roadSegments.map(s => s.root.position.z));
        seg.root.position.z = maxZ + this.segmentLength;

        for (const c of seg.coins) {
          c.visible = true;
        }
      }
    }

    if (this.skyBackdrop) {
      this.skyBackdrop.position.z = playerZ;
    }

    const time = performance.now() * 0.003;
    for (const seg of this.roadSegments) {
      for (const coin of seg.coins) {
        if (coin.visible) {
          coin.rotation.y = time;
        }
      }
    }
  }
}
