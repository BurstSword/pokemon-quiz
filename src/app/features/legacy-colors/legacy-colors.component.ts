import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import type { Pokemon } from '../../core/models/pokemon.model';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonBlockComponent } from '../../shared/components/skeleton-block/skeleton-block.component';
import { getOfficialArtworkUrl, pickRandomItem, sampleUnique, shuffleArray } from '../../shared/utils/pokemon.utils';

type OptionState = 'normal' | 'correct' | 'incorrect' | 'disabled';
type OptionViewModel = { Name: string; Correct: boolean; state: OptionState };

@Component({
  selector: 'app-legacy-colors',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, SkeletonBlockComponent],
  templateUrl: './legacy-colors.component.html',
  styleUrl: './legacy-colors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyColorsComponent implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;
  palette: string[] = [];
  isLoadingPalette = true;
  pokemonTypes = false;
  options: OptionViewModel[] = [];
  optionsLocked = false;

  private preloadImg?: HTMLImageElement;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly pokemonTypeService: PokemonTypeService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.selectRandomPokemon();
      this.cdr.markForCheck();
    });
  }

  selectRandomPokemon(): void {
    const pokemon = pickRandomItem(this.pokemons);
    if (!pokemon) {
      return;
    }

    this.pokemon = { ...pokemon };
    this.optionsLocked = false;
    this.isLoadingPalette = true;
    this.generateOptions();

    this.extractPaletteFromImage(this.pokemon.Image, 5)
      .catch(() => this.extractPaletteFromImage(getOfficialArtworkUrl(this.pokemon!.Number), 5))
      .then((colors) => {
        this.zone.run(() => {
          this.palette = colors;
          this.isLoadingPalette = false;
          this.cdr.markForCheck();
        });
      })
      .catch(() => {
        this.zone.run(() => {
          this.palette = ['#888888'];
          this.isLoadingPalette = false;
          this.cdr.markForCheck();
        });
      });

    const next = this.pokemons.length > 0
      ? this.pokemons[Math.floor(Math.random() * this.pokemons.length)]
      : undefined;
    if (next?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = next.Image;
    }
  }

  generateOptions(): void {
    const pokemon = this.pokemon;
    if (!pokemon) {
      this.options = [];
      return;
    }

    const correct: OptionViewModel = { Name: pokemon.Name, Correct: true, state: 'normal' };
    const wrongs = sampleUnique(
      this.pokemons,
      3,
      (candidate) => candidate.Name === pokemon.Name,
    );
    const wrongOptions: OptionViewModel[] = wrongs.map((item) => ({
      Name: item.Name,
      Correct: false,
      state: 'normal',
    }));
    this.options = shuffleArray([correct, ...wrongOptions]);
  }

  resolveOption(option: OptionViewModel): void {
    if (this.optionsLocked) {
      return;
    }

    this.optionsLocked = true;
    this.options = this.options.map((item) => {
      if (item === option) {
        return { ...item, state: item.Correct ? 'correct' : 'incorrect' };
      }

      if (item.Correct) {
        return { ...item, state: 'correct' };
      }

      return item;
    });

    this.cdr.markForCheck();

    setTimeout(() => {
      this.zone.run(() => {
        this.selectRandomPokemon();
        this.cdr.markForCheck();
      });
    }, 800);
  }

  toggleTypes(): void {
    this.pokemonTypes = !this.pokemonTypes;
    this.cdr.markForCheck();
  }

  getTypeImage(type: string): string {
    return this.pokemonTypeService.getTypeImage(type);
  }

  trackByIndex = (index: number): number => index;
  trackByOption = (_: number, option: OptionViewModel): string => option.Name;

  private extractPaletteFromImage(url: string, colorCount = 5): Promise<string[]> {
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

          if (!picked.some((item) => this.colorDistanceHex(item, hex) < threshold)) {
            picked.push(hex);
            if (picked.length >= colorCount) {
              break;
            }
          }
        }

        if (picked.length === 0) {
          picked.push('#888888');
        }

        resolve(picked);
      };

      image.onerror = () => reject(new Error('Error loading image for palette extraction'));
    });
  }

  private rgbToHex(r: number, g: number, b: number): string {
    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  private colorDistanceHex(left: string, right: string): number {
    const first = [
      parseInt(left.slice(1, 3), 16),
      parseInt(left.slice(3, 5), 16),
      parseInt(left.slice(5, 7), 16),
    ];
    const second = [
      parseInt(right.slice(1, 3), 16),
      parseInt(right.slice(3, 5), 16),
      parseInt(right.slice(5, 7), 16),
    ];
    const deltaR = first[0] - second[0];
    const deltaG = first[1] - second[1];
    const deltaB = first[2] - second[2];
    return Math.sqrt(deltaR * deltaR + deltaG * deltaG + deltaB * deltaB);
  }
}
