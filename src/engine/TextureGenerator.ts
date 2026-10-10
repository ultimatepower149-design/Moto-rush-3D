import * as THREE from 'three';
import { SceneryType } from '../types/game';

export class TextureGenerator {
  private static asphaltTexture: THREE.CanvasTexture | null = null;
  private static asphaltBumpTexture: THREE.CanvasTexture | null = null;
  private static asphaltRoughnessTexture: THREE.CanvasTexture | null = null;
  private static gantrySignTexture: THREE.CanvasTexture | null = null;
  private static cloudTexture: THREE.CanvasTexture | null = null;

  public static getAsphaltTexture(): THREE.CanvasTexture {
    if (this.asphaltTexture) return this.asphaltTexture;

    const size = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Base realistic medium-dark grey asphalt tone (#45494D) as requested
      ctx.fillStyle = '#45494D';
      ctx.fillRect(0, 0, size, size);

      // Fine aggregate speckle & asphalt gravel grain (medium stones, quartz flecks, aggregate variation)
      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 22;
        const rand = Math.random();
        // Subtle granite & aggregate specks
        const speck = rand < 0.08 ? (Math.random() * 28 - 10) : (rand > 0.94 ? 20 : 0);
        data[i] = Math.min(255, Math.max(0, data[i] + noise + speck));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise + speck * 0.98));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise + speck * 1.02));
      }
      ctx.putImageData(imgData, 0, 0);

      // Subtle highway tire-wear grooves (soft wear gradient without turning dark)
      const grad = ctx.createLinearGradient(0, 0, size, 0);
      grad.addColorStop(0, 'rgba(60,64,68,0.12)');
      grad.addColorStop(0.2, 'rgba(52,56,60,0.18)'); // Left lane tire track
      grad.addColorStop(0.35, 'rgba(74,78,82,0.08)');
      grad.addColorStop(0.5, 'rgba(52,56,60,0.16)'); // Center lane tire track
      grad.addColorStop(0.65, 'rgba(74,78,82,0.08)');
      grad.addColorStop(0.8, 'rgba(52,56,60,0.18)'); // Right lane tire track
      grad.addColorStop(1, 'rgba(60,64,68,0.12)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);

      // Subtle asphalt surface seams
      ctx.strokeStyle = 'rgba(55,58,62,0.10)';
      ctx.lineWidth = 1.0;
      for (let s = 0; s < 12; s++) {
        const x = Math.random() * size;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + (Math.random() - 0.5) * 6, size);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 16);
    this.asphaltTexture = texture;
    return texture;
  }

  public static getAsphaltBumpTexture(): THREE.CanvasTexture {
    if (this.asphaltBumpTexture) return this.asphaltBumpTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, size, size);

      const imgData = ctx.getImageData(0, 0, size, size);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        const n = Math.floor(Math.random() * 60) - 30;
        data[i] = Math.min(255, Math.max(0, 128 + n));
        data[i + 1] = data[i];
        data[i + 2] = data[i];
      }
      ctx.putImageData(imgData, 0, 0);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 16);
    this.asphaltBumpTexture = texture;
    return texture;
  }

  public static getAsphaltRoughnessTexture(): THREE.CanvasTexture {
    if (this.asphaltRoughnessTexture) return this.asphaltRoughnessTexture;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Neutral asphalt roughness base (~0.7)
      ctx.fillStyle = '#b0b0b0';
      ctx.fillRect(0, 0, size, size);

      // Subtle sunlight reflection difference in worn tracks without looking wet
      const grad = ctx.createLinearGradient(0, 0, size, 0);
      grad.addColorStop(0, 'rgba(25,25,25,0.05)');
      grad.addColorStop(0.2, 'rgba(0,0,0,0.15)');
      grad.addColorStop(0.5, 'rgba(0,0,0,0.12)');
      grad.addColorStop(0.8, 'rgba(0,0,0,0.15)');
      grad.addColorStop(1, 'rgba(25,25,25,0.05)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 16);
    this.asphaltRoughnessTexture = texture;
    return texture;
  }

  public static getGantrySignTexture(text1: string, text2: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Highway reflective green background
      ctx.fillStyle = '#0f5132';
      ctx.fillRect(0, 0, 512, 128);

      // Micro-texture grid for retroreflective road signs
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      for (let y = 0; y < 128; y += 4) {
        ctx.fillRect(0, y, 512, 1);
      }

      // White reflective border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 500, 116);

      // Inner divider line
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(256, 12);
      ctx.lineTo(256, 116);
      ctx.stroke();

      // Sign texts
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text1, 128, 64);
      ctx.fillText(text2, 384, 64);
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  public static createSkyBackdrop(
    skyColor: number,
    fogColor: number,
    isNight: boolean,
    sceneryType?: SceneryType
  ): THREE.Mesh {
    const skyGeo = new THREE.SphereGeometry(650, 32, 24);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, 512);
      const topCol = new THREE.Color(skyColor).getStyle();
      const botCol = new THREE.Color(fogColor).getStyle();

      grad.addColorStop(0, topCol);
      grad.addColorStop(0.55, botCol);
      grad.addColorStop(0.9, '#1a1d20');
      grad.addColorStop(1, '#0c0e10');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 512);

      if (isNight) {
        // High density twinkling starfield with subtle color variation
        for (let i = 0; i < 220; i++) {
          const x = Math.random() * 512;
          const y = Math.random() * 260;
          const s = Math.random() < 0.2 ? 2.2 : 1.2;
          const starAlpha = 0.4 + Math.random() * 0.6;
          ctx.fillStyle = Math.random() < 0.25 ? `rgba(180,220,255,${starAlpha})` : `rgba(255,255,255,${starAlpha})`;
          ctx.fillRect(x, y, s, s);
        }

        // Night moon glow
        const moonGrad = ctx.createRadialGradient(380, 90, 4, 380, 90, 38);
        moonGrad.addColorStop(0, 'rgba(255, 255, 240, 0.95)');
        moonGrad.addColorStop(0.3, 'rgba(255, 255, 230, 0.4)');
        moonGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(380, 90, 38, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Realistic daytime / sunset volumetric cumulus clouds
        const drawCloud = (cx: number, cy: number, r: number, alpha: number) => {
          const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
          cGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
          cGrad.addColorStop(0.6, `rgba(240, 245, 255, ${alpha * 0.6})`);
          cGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = cGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        };

        // Cloud band in horizon
        for (let b = 0; b < 14; b++) {
          const bx = (b * 42 + Math.random() * 20) % 512;
          const by = 180 + Math.sin(b * 1.2) * 25 + Math.random() * 15;
          const size = 32 + Math.random() * 38;
          drawCloud(bx, by, size, 0.28);
          drawCloud(bx + 18, by - 6, size * 0.8, 0.35);
          drawCloud(bx - 16, by + 4, size * 0.7, 0.22);
        }

        // Distant atmospheric mountain ridge silhouettes along horizon
        ctx.fillStyle = 'rgba(20, 26, 36, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 310);
        for (let mx = 0; mx <= 512; mx += 32) {
          const my = 280 + Math.sin(mx * 0.02) * 22 + Math.cos(mx * 0.05) * 12;
          ctx.lineTo(mx, my);
        }
        ctx.lineTo(512, 340);
        ctx.lineTo(0, 340);
        ctx.closePath();
        ctx.fill();
      }
    }

    const skyTex = new THREE.CanvasTexture(canvas);
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });
    return new THREE.Mesh(skyGeo, skyMat);
  }
}
