import * as THREE from 'three';
import { MotorcycleStats } from '../../types/game';

export interface MotorcycleMeshPackage {
  root: THREE.Group;
  frontWheel: THREE.Group;
  rearWheel: THREE.Group;
  handlebars: THREE.Group;
  brakeLight: THREE.Mesh;
  headlight: THREE.Mesh;
  nitroFlameL: THREE.Mesh;
  nitroFlameR: THREE.Mesh;
  exhaustL: THREE.Mesh;
  exhaustR: THREE.Mesh;
  rider: THREE.Group;
  materials: THREE.Material[];
}

export class MotorcycleBuilder {
  public static createMotorcycle(bike: MotorcycleStats): MotorcycleMeshPackage {
    const root = new THREE.Group();
    const materials: THREE.Material[] = [];

    const bodyColor = new THREE.Color(bike.color);
    const accentColor = new THREE.Color(bike.accentColor);
    const darkMetalColor = new THREE.Color(0x1a1a1e);
    const chromeColor = new THREE.Color(0xd8d8e0);
    const tireColor = new THREE.Color(0x18181a);
    const rimColor = new THREE.Color(bike.accentColor);

    // Standard materials
    // Clearcoat automotive sportbike materials with realistic Fresnel reflectance
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: bodyColor,
      metalness: 0.45,
      roughness: 0.25,
      clearcoat: 0.85,
      clearcoatRoughness: 0.15,
    });
    materials.push(bodyMat);

    const accentMat = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      metalness: 0.55,
      roughness: 0.25,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
    });
    materials.push(accentMat);

    const frameMat = new THREE.MeshStandardMaterial({
      color: darkMetalColor,
      metalness: 0.85,
      roughness: 0.35,
    });
    materials.push(frameMat);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: chromeColor,
      metalness: 0.98,
      roughness: 0.08,
    });
    materials.push(chromeMat);

    const tireMat = new THREE.MeshStandardMaterial({
      color: tireColor,
      roughness: 0.82,
      metalness: 0.08,
    });
    materials.push(tireMat);

    const rimMat = new THREE.MeshStandardMaterial({
      color: rimColor,
      metalness: 0.9,
      roughness: 0.18,
    });
    materials.push(rimMat);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x112233,
      transparent: true,
      opacity: 0.65,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.5,
      ior: 1.5,
    });
    materials.push(glassMat);

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xeeffff,
      emissiveIntensity: 2.2,
      roughness: 0.15,
    });
    materials.push(headlightMat);

    const brakeLightMat = new THREE.MeshStandardMaterial({
      color: 0xff1111,
      emissive: 0xff0000,
      emissiveIntensity: 1.2,
      roughness: 0.15,
    });
    materials.push(brakeLightMat);

    const nitroFlameMat = new THREE.MeshBasicMaterial({
      color: 0x00d4ff,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    materials.push(nitroFlameMat);

    // --- MAIN FRAME / TRELLIS ENGINE CRADLE ---
    const frameGeo = new THREE.BoxGeometry(0.38, 0.45, 1.2);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.58, 0);
    frame.castShadow = true;
    root.add(frame);

    // Exposed tubular trellis sub-frame diagonal struts
    const tubeGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.68, 8);
    tubeGeo.rotateX(Math.PI / 4);
    const trellisL = new THREE.Mesh(tubeGeo, accentMat);
    trellisL.position.set(-0.21, 0.64, 0.08);
    trellisL.castShadow = true;
    root.add(trellisL);

    const trellisR = new THREE.Mesh(tubeGeo, accentMat);
    trellisR.position.set(0.21, 0.64, 0.08);
    trellisR.castShadow = true;
    root.add(trellisR);

    // Multi-cylinder engine block with cooling fins
    const engineGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.46, 14);
    engineGeo.rotateZ(Math.PI / 2);
    const engine = new THREE.Mesh(engineGeo, chromeMat);
    engine.position.set(0, 0.48, 0.05);
    engine.castShadow = true;
    root.add(engine);

    // High-capacity Radiator with mesh grid
    const radiatorMat = new THREE.MeshStandardMaterial({ color: 0x222226, roughness: 0.8, metalness: 0.6 });
    materials.push(radiatorMat);
    const radiator = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.08), radiatorMat);
    radiator.position.set(0, 0.56, 0.5);
    root.add(radiator);

    // Sculpted Ergonomic Fuel Tank with knee recesses
    const tankGeo = new THREE.CylinderGeometry(0.24, 0.29, 0.68, 14);
    tankGeo.rotateX(Math.PI / 2);
    tankGeo.scale(0.98, 0.84, 1.0);
    const tank = new THREE.Mesh(tankGeo, bodyMat);
    tank.position.set(0, 0.88, 0.22);
    tank.rotation.x = -0.18;
    tank.castShadow = true;
    root.add(tank);

    // Chrome Aero Fuel Cap
    const capGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12);
    const cap = new THREE.Mesh(capGeo, chromeMat);
    cap.position.set(0, 1.03, 0.26);
    root.add(cap);

    // Aerodynamic Front Fairing / Aggressive Twin-Intake Nose Cowl
    const frontFairingGeo = new THREE.ConeGeometry(0.3, 0.68, 10);
    frontFairingGeo.rotateX(Math.PI / 2);
    frontFairingGeo.scale(0.92, 0.82, 1.25);
    const frontFairing = new THREE.Mesh(frontFairingGeo, bodyMat);
    frontFairing.position.set(0, 0.86, 0.84);
    frontFairing.castShadow = true;
    root.add(frontFairing);

    // Tinted Racing Windscreen (Bubble Screen)
    const windscreenGeo = new THREE.CylinderGeometry(0.17, 0.23, 0.38, 10, 1, false, 0, Math.PI);
    windscreenGeo.rotateX(-Math.PI / 3);
    const windscreen = new THREE.Mesh(windscreenGeo, glassMat);
    windscreen.position.set(0, 1.05, 0.73);
    root.add(windscreen);

    // Twin LED Projector Headlights
    const hlGeo = new THREE.BoxGeometry(0.12, 0.08, 0.06);
    const headlightL = new THREE.Mesh(hlGeo, headlightMat);
    headlightL.position.set(-0.09, 0.82, 1.12);
    const headlightR = new THREE.Mesh(hlGeo, headlightMat);
    headlightR.position.set(0.09, 0.82, 1.12);
    root.add(headlightL, headlightR);
    const headlight = headlightL; // Reference for meshes

    // Digital TFT Racing Dashboard / Cockpit instrument screen
    const dashScreenMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 });
    materials.push(dashScreenMat);
    const dashScreen = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.08, 0.02), dashScreenMat);
    dashScreen.position.set(0, 0.98, 0.68);
    dashScreen.rotation.x = -0.55;
    root.add(dashScreen);

    // Rider Seat with textured non-slip upholstery
    const seatGeo = new THREE.BoxGeometry(0.28, 0.1, 0.52);
    const seatMat = new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.92 });
    materials.push(seatMat);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.82, -0.28);
    seat.rotation.x = -0.08;
    seat.castShadow = true;
    root.add(seat);

    // Tail Cowl / Rear Fairing
    const tailGeo = new THREE.ConeGeometry(0.22, 0.65, 8);
    tailGeo.rotateX(-Math.PI / 2);
    tailGeo.scale(0.85, 0.7, 1.0);
    const tail = new THREE.Mesh(tailGeo, bodyMat);
    tail.position.set(0, 0.85, -0.68);
    tail.rotation.x = 0.2;
    tail.castShadow = true;
    root.add(tail);

    // Rear Brake Light
    const brakeLightGeo = new THREE.BoxGeometry(0.22, 0.06, 0.04);
    const brakeLight = new THREE.Mesh(brakeLightGeo, brakeLightMat);
    brakeLight.position.set(0, 0.88, -0.96);
    root.add(brakeLight);

    // --- STEERING FORK & HANDLEBARS ---
    const handlebars = new THREE.Group();
    handlebars.position.set(0, 0.95, 0.65);

    // Crossbar
    const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.72, 8);
    barGeo.rotateZ(Math.PI / 2);
    const bar = new THREE.Mesh(barGeo, frameMat);
    handlebars.add(bar);

    // Grips
    const gripL = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), seatMat);
    gripL.rotation.z = Math.PI / 2;
    gripL.position.set(-0.32, 0, 0);
    handlebars.add(gripL);

    const gripR = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), seatMat);
    gripR.rotation.z = Math.PI / 2;
    gripR.position.set(0.32, 0, 0);
    handlebars.add(gripR);

    // Mirrors
    const mirrorL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), accentMat);
    mirrorL.position.set(-0.4, 0.12, 0.05);
    handlebars.add(mirrorL);

    const mirrorR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.02), accentMat);
    mirrorR.position.set(0.4, 0.12, 0.05);
    handlebars.add(mirrorR);

    // Front Inverted Suspension Forks
    const forkGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.75, 8);
    const forkL = new THREE.Mesh(forkGeo, chromeMat);
    forkL.position.set(-0.12, -0.32, 0.1);
    forkL.rotation.x = -0.32;
    forkL.castShadow = true;
    handlebars.add(forkL);

    const forkR = new THREE.Mesh(forkGeo, chromeMat);
    forkR.position.set(0.12, -0.32, 0.1);
    forkR.rotation.x = -0.32;
    forkR.castShadow = true;
    handlebars.add(forkR);

    root.add(handlebars);

    // --- WHEEL BUILDER HELPER ---
    const buildWheel = (radius: number, width: number) => {
      const wheelGroup = new THREE.Group();

      // Tire (torus with sportbike radial profile)
      const tireGeo = new THREE.TorusGeometry(radius, width / 2, 16, 32);
      tireGeo.rotateY(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.castShadow = true;
      wheelGroup.add(tire);

      // Central Rim hub
      const hubGeo = new THREE.CylinderGeometry(0.065, 0.065, width * 0.95, 14);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, rimMat);
      wheelGroup.add(hub);

      // Lightweight Y-Spoke Sportbike Alloy Rims (6 pairs of Y-spokes)
      const spokeGeo = new THREE.CylinderGeometry(0.012, 0.012, radius * 1.82, 8);
      for (let i = 0; i < 6; i++) {
        const spoke = new THREE.Mesh(spokeGeo, rimMat);
        spoke.rotation.x = (i * Math.PI) / 3;
        wheelGroup.add(spoke);
      }

      // High-performance Floating Brake Disc (Stainless Steel)
      const discGeo = new THREE.CylinderGeometry(radius * 0.72, radius * 0.72, 0.012, 20);
      discGeo.rotateZ(Math.PI / 2);
      const discMat = new THREE.MeshStandardMaterial({
        color: 0xd4d4d8,
        metalness: 0.95,
        roughness: 0.18,
      });
      materials.push(discMat);
      const disc = new THREE.Mesh(discGeo, discMat);
      disc.position.x = width * 0.52;
      wheelGroup.add(disc);

      // Brembo Gold Monobloc Racing Brake Caliper
      const caliperGeo = new THREE.BoxGeometry(0.04, 0.12, 0.16);
      const caliperMat = new THREE.MeshStandardMaterial({
        color: 0xd97706, // Racing Brembo Gold
        metalness: 0.85,
        roughness: 0.25,
      });
      materials.push(caliperMat);
      const caliper = new THREE.Mesh(caliperGeo, caliperMat);
      caliper.position.set(width * 0.54, radius * 0.55, 0.06);
      caliper.rotation.x = -0.35;
      wheelGroup.add(caliper);

      return wheelGroup;
    };

    // Front Wheel
    const frontWheel = buildWheel(0.32, 0.14);
    frontWheel.position.set(0, 0.32, 0.88);
    root.add(frontWheel);

    // Rear Wheel
    const rearWheel = buildWheel(0.34, 0.18);
    rearWheel.position.set(0, 0.34, -0.82);
    root.add(rearWheel);

    // Rear Swingarm
    const swingarmGeo = new THREE.BoxGeometry(0.24, 0.06, 0.6);
    const swingarm = new THREE.Mesh(swingarmGeo, frameMat);
    swingarm.position.set(0, 0.38, -0.45);
    swingarm.rotation.x = 0.1;
    root.add(swingarm);

    // --- EXHAUST SYSTEM ---
    const exhaustGeo = new THREE.CylinderGeometry(0.045, 0.065, 0.7, 10);
    exhaustGeo.rotateX(Math.PI / 2);
    const exhaustL = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaustL.position.set(-0.22, 0.42, -0.6);
    exhaustL.rotation.x = -0.15;
    exhaustL.rotation.y = -0.08;
    root.add(exhaustL);

    const exhaustR = new THREE.Mesh(exhaustGeo, chromeMat);
    exhaustR.position.set(0.22, 0.42, -0.6);
    exhaustR.rotation.x = -0.15;
    exhaustR.rotation.y = 0.08;
    root.add(exhaustR);

    // Nitro Thruster Glow Nozzles
    const flameGeo = new THREE.ConeGeometry(0.08, 0.45, 8);
    flameGeo.rotateX(-Math.PI / 2);
    const nitroFlameL = new THREE.Mesh(flameGeo, nitroFlameMat);
    nitroFlameL.position.set(-0.22, 0.4, -0.98);
    root.add(nitroFlameL);

    const nitroFlameR = new THREE.Mesh(flameGeo, nitroFlameMat);
    nitroFlameR.position.set(0.22, 0.4, -0.98);
    root.add(nitroFlameR);

    // --- BIKE-SPECIFIC AERO ACCESSORIES ---
    if (bike.id === 'track_beast' || bike.id === 'ultimate_racing_bike') {
      // Carbon Winglets on front fairing
      const wingletGeo = new THREE.BoxGeometry(0.32, 0.03, 0.16);
      const wingletL = new THREE.Mesh(wingletGeo, accentMat);
      wingletL.position.set(-0.35, 0.82, 0.7);
      wingletL.rotation.z = -0.2;
      root.add(wingletL);

      const wingletR = new THREE.Mesh(wingletGeo, accentMat);
      wingletR.position.set(0.35, 0.82, 0.7);
      wingletR.rotation.z = 0.2;
      root.add(wingletR);
    }

    if (bike.id === 'nitro_beast') {
      // Twin Nitro Canisters mounted on sides
      const nosGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8);
      nosGeo.rotateX(Math.PI / 2);
      const nosMat = new THREE.MeshStandardMaterial({ color: 0x0ea5e9, metalness: 0.8, roughness: 0.2 });
      materials.push(nosMat);

      const nosL = new THREE.Mesh(nosGeo, nosMat);
      nosL.position.set(-0.28, 0.65, -0.1);
      root.add(nosL);

      const nosR = new THREE.Mesh(nosGeo, nosMat);
      nosR.position.set(0.28, 0.65, -0.1);
      root.add(nosR);
    }

    // --- RIDER FIGURE (RACING SUIT & HELMET) ---
    const rider = new THREE.Group();
    rider.position.set(0, 0.75, -0.2);

    const riderSuitMat = new THREE.MeshStandardMaterial({
      color: 0x1e1e24,
      roughness: 0.7,
      metalness: 0.1,
    });
    materials.push(riderSuitMat);

    const helmetMat = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.5,
      roughness: 0.2,
    });
    materials.push(helmetMat);

    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x050505,
      metalness: 0.9,
      roughness: 0.1,
    });
    materials.push(visorMat);

    // Torso (leaning forward in racing tuck)
    const torsoGeo = new THREE.BoxGeometry(0.34, 0.45, 0.28);
    const torso = new THREE.Mesh(torsoGeo, riderSuitMat);
    torso.position.set(0, 0.35, 0.12);
    torso.rotation.x = 0.65;
    torso.castShadow = true;
    rider.add(torso);

    // Aerodynamic Racing Leathers Back Hump (MotoGP speed hump)
    const humpGeo = new THREE.ConeGeometry(0.12, 0.32, 8);
    humpGeo.rotateX(-Math.PI / 2);
    const hump = new THREE.Mesh(humpGeo, riderSuitMat);
    hump.position.set(0, 0.48, -0.04);
    hump.rotation.x = 0.55;
    hump.castShadow = true;
    rider.add(hump);

    // High-visibility Racing Leathers Accent Stripes
    const stripeMat = new THREE.MeshStandardMaterial({ color: accentColor, roughness: 0.5, metalness: 0.2 });
    materials.push(stripeMat);
    const stripeL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.38, 0.29), stripeMat);
    stripeL.position.set(-0.16, 0.35, 0.12);
    stripeL.rotation.x = 0.65;
    const stripeR = stripeL.clone();
    stripeR.position.x = 0.16;
    rider.add(stripeL, stripeR);

    // Helmet
    const helmetGeo = new THREE.SphereGeometry(0.16, 12, 10);
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 0.62, 0.36);
    helmet.castShadow = true;
    rider.add(helmet);

    // Visor
    const visorGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.08, 10, 1, false, 0, Math.PI);
    visorGeo.rotateY(Math.PI / 2);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.62, 0.44);
    rider.add(visor);

    // Arms reaching to handlebars
    const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.48, 8);
    armGeo.rotateX(Math.PI / 4);

    const armL = new THREE.Mesh(armGeo, riderSuitMat);
    armL.position.set(-0.24, 0.38, 0.32);
    armL.rotation.y = -0.2;
    rider.add(armL);

    const armR = new THREE.Mesh(armGeo, riderSuitMat);
    armR.position.set(0.24, 0.38, 0.32);
    armR.rotation.y = 0.2;
    rider.add(armR);

    // Legs hugging tank with racing knee sliders (pucks)
    const legGeo = new THREE.BoxGeometry(0.13, 0.4, 0.25);
    const legL = new THREE.Mesh(legGeo, riderSuitMat);
    legL.position.set(-0.22, 0.1, 0.1);
    legL.castShadow = true;
    rider.add(legL);

    const legR = new THREE.Mesh(legGeo, riderSuitMat);
    legR.position.set(0.22, 0.1, 0.1);
    legR.castShadow = true;
    rider.add(legR);

    // Knee Sliders (hard compound polymer pucks for dragging knees in corners)
    const puckMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3, metalness: 0.2 });
    materials.push(puckMat);
    const puckL = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), puckMat);
    puckL.position.set(-0.29, 0.12, 0.15);
    rider.add(puckL);

    const puckR = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.08), puckMat);
    puckR.position.set(0.29, 0.12, 0.15);
    rider.add(puckR);

    root.add(rider);

    return {
      root,
      frontWheel,
      rearWheel,
      handlebars,
      brakeLight,
      headlight,
      nitroFlameL,
      nitroFlameR,
      exhaustL,
      exhaustR,
      rider,
      materials,
    };
  }
}
