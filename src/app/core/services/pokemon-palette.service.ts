import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PokemonPaletteService {
  private readonly paletteCache = new Map<string, Promise<string[]>>();

  getPalette(url: string, colorCount = 5): Promise<string[]> {
    const cacheKey = `${url}::${colorCount}`;
    const cached = this.paletteCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const request = this.extractPaletteFromImage(url, colorCount)
      .catch((error) => {
        this.paletteCache.delete(cacheKey);
        throw error;
      });

    this.paletteCache.set(cacheKey, request);
    return request;
  }

  private extractPaletteFromImage(url: string, colorCount: number): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.crossOrigin = 'anonymous';
      image.src = url;

      image.onload = () => {
        const maxSize = 120;
        const ratio = Math.min(1, maxSize / Math.max(image.width, image.height));
        const width = Math.max(1, Math.floor(image.width * ratio));
        const height = Math.max(1, Math.floor(image.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('No 2D context'));
          return;
        }

        context.drawImage(image, 0, 0, width, height);
        const { data } = context.getImageData(0, 0, width, height);
        const counts = new Map<number, number>();
        const stride = 16;

        for (let index = 0; index < data.length; index += stride) {
          const r = data[index] ?? 0;
          const g = data[index + 1] ?? 0;
          const b = data[index + 2] ?? 0;
          const a = data[index + 3] ?? 0;

          if (a < 128) continue;
          if ((r > 245 && g > 245 && b > 245) || (r < 15 && g < 15 && b < 15)) continue;

          const rq = r >> 3;
          const gq = g >> 3;
          const bq = b >> 3;
          const paletteIndex = (rq << 10) | (gq << 5) | bq;
          counts.set(paletteIndex, (counts.get(paletteIndex) || 0) + 1);
        }

        const sorted = Array.from(counts.entries()).sort((left, right) => right[1] - left[1]);
        const picked: string[] = [];
        const threshold = 28;

        for (const [paletteIndex] of sorted) {
          const rq = (paletteIndex >> 10) & 31;
          const gq = (paletteIndex >> 5) & 31;
          const bq = paletteIndex & 31;
          const hex = this.rgbToHex(rq * 8 + 4, gq * 8 + 4, bq * 8 + 4);

          if (!picked.some((color) => this.colorDistanceHex(color, hex) < threshold)) {
            picked.push(hex);
            if (picked.length >= colorCount) {
              break;
            }
          }
        }

        resolve(picked.length > 0 ? picked : ['#888888']);
      };

      image.onerror = () => reject(new Error('Error loading image for palette extraction'));
    });
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  private colorDistanceHex(colorA: string, colorB: string): number {
    const left = [
      parseInt(colorA.slice(1, 3), 16),
      parseInt(colorA.slice(3, 5), 16),
      parseInt(colorA.slice(5, 7), 16),
    ];
    const right = [
      parseInt(colorB.slice(1, 3), 16),
      parseInt(colorB.slice(3, 5), 16),
      parseInt(colorB.slice(5, 7), 16),
    ];

    const deltaR = left[0] - right[0];
    const deltaG = left[1] - right[1];
    const deltaB = left[2] - right[2];
    return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
  }
}
