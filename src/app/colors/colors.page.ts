import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Pokemon } from 'interfaces';

type OptionState = 'normal' | 'correct' | 'incorrect' | 'disabled';
type OptionVM = { Name: string; Correct: boolean; state: OptionState };

@Component({
  selector: 'app-colors',
  templateUrl: './colors.page.html',
  styleUrls: ['./colors.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorsPage implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon!: Pokemon;

  // UI
  palette: string[] = [];        // colores dominantes (#RRGGBB)
  isLoadingPalette = true;
  pokemonTypes = false;
  options: OptionVM[] = [];
  optionsLocked = false;

  // Tipos → icono
  private readonly typeImages: Record<string, string> = {
    Normal:   'assets/pokemontypes/normal.webp',
    Fire:     'assets/pokemontypes/fire.webp',
    Water:    'assets/pokemontypes/water.webp',
    Electric: 'assets/pokemontypes/electric.webp',
    Grass:    'assets/pokemontypes/grass.webp',
    Ice:      'assets/pokemontypes/ice.webp',
    Fighting: 'assets/pokemontypes/fighting.webp',
    Poison:   'assets/pokemontypes/poison.webp',
    Ground:   'assets/pokemontypes/ground.webp',
    Flying:   'assets/pokemontypes/flying.webp',
    Psychic:  'assets/pokemontypes/psychic.webp',
    Bug:      'assets/pokemontypes/bug.webp',
    Rock:     'assets/pokemontypes/rock.webp',
    Ghost:    'assets/pokemontypes/ghost.webp',
    Dragon:   'assets/pokemontypes/dragon.webp',
    Dark:     'assets/pokemontypes/dark.webp',
    Steel:    'assets/pokemontypes/steel.webp',
    Fairy:    'assets/pokemontypes/fairy.webp',
  };

  // Preload
  private preloadImg?: HTMLImageElement;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<Pokemon[]>('assets/pokemon.json').subscribe(list => {
      this.pokemons = [...list];
      this.selectRandomPokemon();
    });
  }

  // ---------- Juego ----------
  private pickRandomPokemon(): Pokemon | undefined {
    if (this.pokemons.length === 0) return undefined;
    const idx = Math.floor(Math.random() * this.pokemons.length);
    const picked = this.pokemons[idx];
    this.pokemons.splice(idx, 1);
    return picked;
  }

  selectRandomPokemon() {
    const p = this.pickRandomPokemon();
    if (!p) return;

    this.pokemon = p;
    this.optionsLocked = false;
    this.isLoadingPalette = true;

    // opciones (3 malas únicas + 1 correcta)
    this.generateOptions();

    // extrae paleta
    this.extractPaletteFromImage(this.pokemon.Image, 5).then(colors => {
      this.palette = colors;
      this.isLoadingPalette = false;
    });

    // preload siguiente
    const next = this.pokemons.length > 0 ? this.pokemons[Math.floor(Math.random() * this.pokemons.length)] : null;
    if (next?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = next.Image;
    }
  }

  generateOptions() {
    const correct: OptionVM = { Name: this.pokemon.Name, Correct: true, state: 'normal' };

    const pool = this.pokemons.filter(x => x.Name !== this.pokemon.Name);
    const wrongsSet = new Set<string>();
    while (wrongsSet.size < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      wrongsSet.add(pool[idx].Name);
    }

    const wrongs: OptionVM[] = Array.from(wrongsSet).map(n => ({ Name: n, Correct: false, state: 'normal' }));
    const all = [correct, ...wrongs];

    // shuffle
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    this.options = all;
  }

  resolveOption(option: OptionVM) {
    if (this.optionsLocked) return;
    this.optionsLocked = true;

    this.options = this.options.map(o => {
      if (o === option) {
        return { ...o, state: o.Correct ? 'correct' : 'incorrect' };
      }
      if (o.Correct) return { ...o, state: 'correct' };
      return o;
    });

    setTimeout(() => this.selectRandomPokemon(), 800);
  }

  toggleTypes() {
    this.pokemonTypes = !this.pokemonTypes;
  }

  getTypeImage(type: string) {
    return this.typeImages[type] ?? '';
  }

  trackByIndex = (i: number) => i;
  trackByOption = (_: number, o: OptionVM) => o.Name;

  // ---------- Extracción de paleta (rápida y sin libs) ----------
  /**
   * Extrae una paleta de N colores dominantes:
   *  - reescala a máx 120px (rápido)
   *  - muestrea con stride 4
   *  - cuantiza 5 bits por canal (32 niveles)
   *  - descarta casi-blancos/casi-negros y transparentes
   *  - elimina colores muy parecidos (umbral de distancia)
   */
  private extractPaletteFromImage(url: string, colorCount = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.loading = 'eager';
      img.crossOrigin = 'anonymous'; // seguro si es assets/ misma app
      img.src = url;

      img.onload = () => {
        const maxSize = 120;
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.max(1, Math.floor(img.width * ratio));
        const h = Math.max(1, Math.floor(img.height * ratio));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No 2D context');

        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);

        // Histograma en espacio cuantizado 5 bits por canal
        const counts = new Map<number, number>();
        const stride = 4 * 4; // muestreo 1/4 de pixeles (~4x más rápido)
        for (let i = 0; i < data.length; i += stride) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 128) continue; // transparente

          // descartar casi-blanco o casi-negro (fondos)
          if ((r > 245 && g > 245 && b > 245) || (r < 15 && g < 15 && b < 15)) continue;

          const rq = r >> 3, gq = g >> 3, bq = b >> 3; // 0..31
          const idx = (rq << 10) | (gq << 5) | bq;     // 15 bits
          counts.set(idx, (counts.get(idx) || 0) + 1);
        }

        // Top bins
        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);

        // Convierte bin → color promedio del bin (centro) y dedup por distancia
        const picked: string[] = [];
        const THRESH = 28; // umbral de diferencia euclídea para evitar casi-duplicados
        for (const [idx] of sorted) {
          const rq = (idx >> 10) & 31;
          const gq = (idx >> 5) & 31;
          const bq = idx & 31;
          const r = rq * 8 + 4, g = gq * 8 + 4, b = bq * 8 + 4; // centro del bin
          const hex = this.rgbToHex(r, g, b);

          if (!picked.some(p => this.colorDistanceHex(p, hex) < THRESH)) {
            picked.push(hex);
            if (picked.length >= colorCount) break;
          }
        }

        // fallback si no encontramos suficientes
        if (picked.length === 0) picked.push('#888888');
        resolve(picked);
      };

      img.onerror = () => reject('Error loading image');
    });
  }

  private rgbToHex(r: number, g: number, b: number) {
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  private colorDistanceHex(h1: string, h2: string) {
    const c1 = [parseInt(h1.slice(1,3),16), parseInt(h1.slice(3,5),16), parseInt(h1.slice(5,7),16)];
    const c2 = [parseInt(h2.slice(1,3),16), parseInt(h2.slice(3,5),16), parseInt(h2.slice(5,7),16)];
    const dr = c1[0]-c2[0], dg = c1[1]-c2[1], db = c1[2]-c2[2];
    return Math.sqrt(dr*dr + dg*dg + db*db);
  }
}
