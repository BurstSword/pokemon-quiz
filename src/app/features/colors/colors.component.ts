import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import type { OptionState, Pokemon } from '../../core/models/pokemon.model';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonPaletteService } from '../../core/services/pokemon-palette.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { SkeletonBlockComponent } from '../../shared/components/skeleton-block/skeleton-block.component';
import {
  getOfficialArtworkUrl,
  pickRandomItemExcluding,
  sampleUnique,
  shuffleArray,
} from '../../shared/utils/pokemon.utils';

type OptionViewModel = {
  pokemon: Pokemon;
  label: string;
  Correct: boolean;
  state: OptionState;
};

@Component({
  selector: 'app-colors',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, SkeletonBlockComponent, HelpPanelComponent, ResultBannerComponent],
  templateUrl: './colors.component.html',
  styleUrl: './colors.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorsComponent implements OnInit {
  readonly loadingSlots = [0, 1, 2, 3, 4];
  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;
  palette: string[] = [];
  isLoadingPalette = true;
  paletteError = '';
  pokemonTypes = false;
  options: OptionViewModel[] = [];
  optionsLocked = false;
  helpOpen = false;
  resultStatus: 'correct' | 'incorrect' | null = null;
  resultTitle = '';
  resultMessage = '';
  revealedAnswer = '';
  poolErrorMessage = '';

  private preloadImg?: HTMLImageElement;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly generationFilterService: GenerationFilterService,
    private readonly pokemonTypeService: PokemonTypeService,
    private readonly pokemonPaletteService: PokemonPaletteService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone,
  ) {}

  ngOnInit(): void {
    combineLatest([
      this.pokemonService.getEnrichedPokemonList(),
      this.generationFilterService.activeGenerations$,
    ]).subscribe(([pokemons]) => {
      this.generationFilterService.initializeFromPokemonList(pokemons);
      this.pokemons = this.generationFilterService.getActivePokemonPool(pokemons);

      if (this.pokemons.length < 4) {
        this.pokemon = undefined;
        this.options = [];
        this.optionsLocked = true;
        this.palette = [];
        this.isLoadingPalette = false;
        this.paletteError = '';
        this.poolErrorMessage = 'Activa más generaciones para jugar a Quiz colores.';
        this.resultStatus = null;
        this.resultTitle = '';
        this.resultMessage = '';
        this.revealedAnswer = '';
        this.cdr.markForCheck();
        return;
      }

      this.poolErrorMessage = '';
      this.selectRandomPokemon();
      this.cdr.markForCheck();
    });
  }

  selectRandomPokemon(): void {
    const pokemon = pickRandomItemExcluding(
      this.pokemons,
      (candidate) => candidate.Number === this.pokemon?.Number,
    );
    if (!pokemon) {
      return;
    }

    this.pokemon = { ...pokemon };
    this.optionsLocked = false;
    this.isLoadingPalette = true;
    this.paletteError = '';
    this.pokemonTypes = false;
    this.helpOpen = false;
    this.resultStatus = null;
    this.resultTitle = '';
    this.resultMessage = '';
    this.revealedAnswer = '';
    this.generateOptions();

    this.palette = [];
    this.cdr.markForCheck();

    requestAnimationFrame(() => {
      this.pokemonPaletteService.getPalette(this.getPaletteSource(pokemon), 5)
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
            this.paletteError = 'No pudimos leer la paleta de esta imagen, pero puedes seguir jugando.';
            this.isLoadingPalette = false;
            this.cdr.markForCheck();
          });
        });
    });

    const nextPokemon = pickRandomItemExcluding(this.pokemons, (candidate) => candidate.Number === pokemon.Number);
    if (nextPokemon?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = this.getRevealImage(nextPokemon) || nextPokemon.Image;
    }
  }

  resolveOption(option: OptionViewModel): void {
    if (this.optionsLocked || !this.pokemon) {
      return;
    }

    this.optionsLocked = true;
    this.resultStatus = option.Correct ? 'correct' : 'incorrect';
    this.resultTitle = option.Correct ? '¡Correcto!' : 'No era ese';
    this.resultMessage = option.Correct
      ? 'Has reconocido la paleta.'
      : 'La respuesta correcta aparece justo debajo.';
    this.revealedAnswer = '';

    this.options = this.options.map((item) => {
      if (item === option) {
        return { ...item, state: item.Correct ? 'correct' : 'incorrect' };
      }

      if (item.Correct) {
        return { ...item, state: 'correct' };
      }

      return { ...item, state: 'disabled' };
    });

    this.cdr.markForCheck();
  }

  nextRound(): void {
    this.selectRandomPokemon();
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  toggleTypes(): void {
    this.pokemonTypes = !this.pokemonTypes;
    this.cdr.markForCheck();
  }

  getTypeImage(type: string): string {
    return this.pokemonTypeService.getTypeImage(type);
  }

  getPokemonLabel(pokemon: Pokemon): string {
    return pokemon.SpanishName || pokemon.DisplayName || pokemon.Name;
  }

  getRevealCopy(): string {
    if (!this.pokemon) {
      return '';
    }

    return this.resultStatus === 'correct'
      ? `Era ${this.getPokemonLabel(this.pokemon)}`
      : `La respuesta era ${this.getPokemonLabel(this.pokemon)}`;
  }

  getRevealImage(pokemon: Pokemon): string {
    return pokemon.OfficialArtwork
      || pokemon.Image
      || pokemon.SerebiiImage
      || pokemon.FrontDefault
      || pokemon.Sprite
      || '';
  }

  trackByOption = (_: number, option: OptionViewModel): number => option.pokemon.Number;
  trackByColor = (_: number, color: string): string => color;
  trackByIndex = (index: number): number => index;

  private generateOptions(): void {
    const currentPokemon = this.pokemon;
    if (!currentPokemon) {
      this.options = [];
      return;
    }

    const correct: OptionViewModel = {
      pokemon: currentPokemon,
      label: this.getPokemonLabel(currentPokemon),
      Correct: true,
      state: 'normal',
    };
    const wrongs = sampleUnique(
      this.pokemons,
      3,
      (candidate) => candidate.Number === currentPokemon.Number,
    );
    const wrongOptions = wrongs.map((pokemon) => ({
      pokemon,
      label: this.getPokemonLabel(pokemon),
      Correct: false,
      state: 'normal' as const,
    }));

    this.options = shuffleArray([correct, ...wrongOptions]);
  }

  private getPaletteSource(pokemon: Pokemon): string {
    return getOfficialArtworkUrl(pokemon.Number);
  }
}
