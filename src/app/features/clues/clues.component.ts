import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { combineLatest } from 'rxjs';
import type { Pokemon } from '../../core/models/pokemon.model';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { pickRandomItemExcluding } from '../../shared/utils/pokemon.utils';

@Component({
  selector: 'app-clues',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, HelpPanelComponent, ResultBannerComponent],
  templateUrl: './clues.component.html',
  styleUrl: './clues.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CluesComponent implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;

  clues: string[] = [];
  showingClues: string[] = [];
  searchTerm = '';
  searchResults: Pokemon[] = [];
  helpOpen = false;
  optionsLocked = false;
  resultStatus: 'correct' | 'incorrect' | null = null;
  resultTitle = '';
  resultMessage = '';
  revealedAnswer = '';
  selectedPokemonNumber: number | null = null;
  poolErrorMessage = '';
  private preloadImg?: HTMLImageElement;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly generationFilterService: GenerationFilterService,
    private readonly cdr: ChangeDetectorRef,
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
        this.clues = [];
        this.showingClues = [];
        this.searchResults = [];
        this.searchTerm = '';
        this.optionsLocked = true;
        this.resultStatus = null;
        this.resultTitle = '';
        this.resultMessage = '';
        this.revealedAnswer = '';
        this.selectedPokemonNumber = null;
        this.poolErrorMessage = 'Activa más generaciones para jugar a Quiz pistas.';
        this.cdr.markForCheck();
        return;
      }

      this.poolErrorMessage = '';
      this.selectRandomPokemon();
    });
  }

  get hasMoreClues(): boolean {
    return this.showingClues.length < this.clues.length;
  }

  get revealedCluesCount(): number {
    return this.showingClues.length;
  }

  get visibleResults(): Pokemon[] {
    return this.searchResults.slice(0, 5);
  }

  get hasSearchTerm(): boolean {
    return this.searchTerm.trim().length > 0;
  }

  selectRandomPokemon(): void {
    const pokemon = pickRandomItemExcluding(
      this.pokemons,
      (candidate) => candidate.Number === this.pokemon?.Number,
    );
    if (!pokemon) {
      return;
    }

    this.pokemon = pokemon;
    this.generateClues();
    this.cleanSearch();
    this.helpOpen = false;
    this.optionsLocked = false;
    this.resultStatus = null;
    this.resultTitle = '';
    this.resultMessage = '';
    this.revealedAnswer = '';
    this.selectedPokemonNumber = null;

    const preloadCandidate = pickRandomItemExcluding(
      this.pokemons,
      (candidate) => candidate.Number === pokemon.Number,
    );
    if (preloadCandidate?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = preloadCandidate.Image;
    }

    this.cdr.markForCheck();
  }

  addClue(): void {
    const nextIndex = this.showingClues.length;
    if (!this.hasMoreClues) {
      return;
    }

    const nextClue = this.clues[nextIndex];
    if (nextClue) {
      this.showingClues = [...this.showingClues, nextClue];
      this.cdr.markForCheck();
    }
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      this.searchResults = [];
      this.cdr.markForCheck();
      return;
    }

    this.searchResults = this.pokemons.filter((pokemon) =>
      this.getSearchableNames(pokemon).some((name) => name.includes(normalized)),
    );
    this.cdr.markForCheck();
  }

  checkIfCorrect(choice: Pokemon): void {
    const currentPokemon = this.pokemon;
    if (!currentPokemon || this.optionsLocked) {
      return;
    }

    const isCorrect = choice.Number === currentPokemon.Number;
    this.optionsLocked = true;
    this.selectedPokemonNumber = choice.Number;
    this.resultStatus = isCorrect ? 'correct' : 'incorrect';
    this.resultTitle = isCorrect ? '¡Correcto!' : 'No era ese';
    this.resultMessage = isCorrect
      ? `Has identificado a ${this.getPokemonLabel(currentPokemon)} con ${this.revealedCluesCount} pista${this.revealedCluesCount === 1 ? '' : 's'}.`
      : `Las pistas pertenecían a ${this.getPokemonLabel(currentPokemon)}.`;
    this.revealedAnswer = isCorrect ? '' : this.getPokemonLabel(currentPokemon);
    this.cdr.markForCheck();
  }

  trackByPokemon = (_: number, pokemon: Pokemon): number => pokemon.Number ?? 0;
  trackByClue = (index: number): number => index;

  nextRound(): void {
    this.selectRandomPokemon();
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  getPokemonLabel(pokemon: Pokemon): string {
    return pokemon.SpanishName || pokemon.DisplayName || pokemon.Name;
  }

  getResultCardClass(pokemon: Pokemon): Record<string, boolean> {
    const isSelected = pokemon.Number === this.selectedPokemonNumber;
    return {
      selected: isSelected,
      correct: isSelected && this.resultStatus === 'correct',
      incorrect: isSelected && this.resultStatus === 'incorrect',
      muted: this.optionsLocked && !isSelected,
    };
  }

  private generateClues(): void {
    const pokemon = this.pokemon;
    if (!pokemon) {
      return;
    }

    const generatedClues: string[] = [];
    generatedClues.push(`Número en la Pokédex: ${pokemon.Number}.`);
    generatedClues.push(`Pertenece a la generación ${pokemon.Generation}.`);
    generatedClues.push(`Su tipo principal es ${this.translateType(pokemon.Type1)}.`);
    if (pokemon.Type2) {
      generatedClues.push(`Su tipo secundario es ${this.translateType(pokemon.Type2)}.`);
    }

    if (pokemon.Color) {
      generatedClues.push(`Su color base es ${this.translateColor(pokemon.Color)}.`);
    }
    if (pokemon.Habitat) {
      generatedClues.push(`Suele asociarse al hábitat ${this.translateHabitat(pokemon.Habitat)}.`);
    }
    if (pokemon.Shape) {
      generatedClues.push(`Su forma se clasifica como ${this.translateShape(pokemon.Shape)}.`);
    }
    if (typeof pokemon.HeightMeters === 'number') {
      generatedClues.push(`Mide aproximadamente ${pokemon.HeightMeters} metros.`);
    }
    if (typeof pokemon.WeightKg === 'number') {
      generatedClues.push(`Pesa alrededor de ${pokemon.WeightKg} kg.`);
    }
    if (pokemon.EggGroups?.length) {
      generatedClues.push(`Pertenece al grupo huevo ${this.translateEggGroup(pokemon.EggGroups[0])}.`);
    }
    if (pokemon.EvolutionStage) {
      generatedClues.push(`Está en la ${this.getEvolutionStageLabel(pokemon.EvolutionStage).toLowerCase()}.`);
    }
    if (pokemon.IsFinalEvolution) {
      generatedClues.push('Es una evolución final.');
    }
    if (pokemon.IsBaby) {
      generatedClues.push('Es un Pokémon bebé.');
    } else if (pokemon.IsMythical) {
      generatedClues.push('Es un Pokémon mítico.');
    } else if (this.isLegendary(pokemon)) {
      generatedClues.push('Es un Pokémon legendario.');
    } else {
      generatedClues.push('No es un Pokémon legendario.');
    }

    const statHint = this.getStatHint(pokemon);
    if (statHint) {
      generatedClues.push(statHint);
    }

    const descriptionSource = pokemon.DescriptionEs || pokemon.Description || pokemon.DescriptionEn || 'No hay descripción disponible.';
    const sanitizedDescription = this.sanitizeDescription(descriptionSource, pokemon);
    generatedClues.push(`La Pokédex dice: ${sanitizedDescription}`);
    generatedClues.push(`Su nombre visible tiene ${this.getPokemonLabel(pokemon).length} caracteres.`);

    this.clues = generatedClues.slice(0, 10);
    this.showingClues = [generatedClues[0] ?? ''];
  }

  private cleanSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.cdr.markForCheck();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private getSearchableNames(pokemon: Pokemon): string[] {
    return [pokemon.Name, pokemon.DisplayName, pokemon.SpanishName, pokemon.EnglishName]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
  }

  private sanitizeDescription(description: string, pokemon: Pokemon): string {
    return [pokemon.Name, pokemon.DisplayName, pokemon.SpanishName, pokemon.EnglishName]
      .filter((value): value is string => Boolean(value))
      .reduce(
        (current, name) => current.replace(new RegExp(this.escapeRegExp(name), 'gi'), '______'),
        description,
      );
  }

  private isLegendary(pokemon: Pokemon): boolean {
    return pokemon.IsLegendary || pokemon.IsMythical || pokemon.Legendary === true || pokemon.Legendary === 'TRUE';
  }

  private translateType(value: string): string {
    const map: Record<string, string> = {
      Grass: 'Planta',
      Poison: 'Veneno',
      Fire: 'Fuego',
      Water: 'Agua',
      Flying: 'Volador',
      Normal: 'Normal',
      Electric: 'Eléctrico',
      Ground: 'Tierra',
      Fairy: 'Hada',
      Fighting: 'Lucha',
      Psychic: 'Psíquico',
      Rock: 'Roca',
      Steel: 'Acero',
      Ice: 'Hielo',
      Ghost: 'Fantasma',
      Dragon: 'Dragón',
      Dark: 'Siniestro',
      Bug: 'Bicho',
    };

    return map[value] ?? value;
  }

  private translateColor(value: string): string {
    const map: Record<string, string> = {
      green: 'verde',
      red: 'rojo',
      blue: 'azul',
      yellow: 'amarillo',
      black: 'negro',
      brown: 'marrón',
      purple: 'morado',
      gray: 'gris',
      white: 'blanco',
      pink: 'rosa',
    };

    return map[value] ?? value;
  }

  private translateShape(value: string): string {
    const map: Record<string, string> = {
      quadruped: 'cuadrúpeda',
      upright: 'erguida',
      humanoid: 'humanoide',
      wings: 'con alas',
      fish: 'pez',
      ball: 'bola',
      blob: 'masa',
      armor: 'armadura',
      tentacles: 'tentáculos',
      heads: 'varias cabezas',
      squiggle: 'serpenteante',
      arms: 'con brazos',
      legs: 'con patas',
      'bug-wings': 'alas de bicho',
      bipedal: 'bípeda',
    };

    return map[value] ?? value;
  }

  private translateHabitat(value: string): string {
    const map: Record<string, string> = {
      grassland: 'pradera',
      forest: 'bosque',
      'waters-edge': 'orilla',
      sea: 'mar',
      cave: 'cueva',
      mountain: 'montaña',
      'rough-terrain': 'terreno abrupto',
      urban: 'zona urbana',
      rare: 'raro',
    };

    return map[value] ?? value;
  }

  private translateEggGroup(value: string): string {
    const map: Record<string, string> = {
      monster: 'monstruo',
      plant: 'planta',
      grass: 'planta',
      bug: 'bicho',
      flying: 'volador',
      ground: 'campo',
      field: 'campo',
      fairy: 'hada',
      humanshape: 'humanoide',
      'human-like': 'humanoide',
      water1: 'agua 1',
      water2: 'agua 2',
      water3: 'agua 3',
      mineral: 'mineral',
      indeterminate: 'amorfo',
      amorphous: 'amorfo',
      dragon: 'dragón',
      ditto: 'Ditto',
      'no-eggs': 'sin huevos',
      undiscovered: 'desconocido',
    };

    return map[value] ?? value;
  }

  private getEvolutionStageLabel(stage: number): string {
    if (stage === 1) return 'Primera fase evolutiva';
    if (stage === 2) return 'Segunda fase evolutiva';
    if (stage === 3) return 'Tercera fase evolutiva';
    return `Fase evolutiva ${stage}`;
  }

  private getStatHint(pokemon: Pokemon): string | null {
    const stats = pokemon.Stats;
    if (!stats) {
      return null;
    }

    const rawEntries: Array<[string, number | null]> = [
      ['velocidad', stats.Speed],
      ['ataque', stats.Attack],
      ['defensa', stats.Defense],
      ['ataque especial', stats.SpecialAttack],
      ['defensa especial', stats.SpecialDefense],
      ['PS', stats.HP],
    ];
    const entries = rawEntries.filter((entry): entry is [string, number] => typeof entry[1] === 'number');

    if (entries.length === 0) {
      return null;
    }

    entries.sort((left, right) => right[1] - left[1]);
    return `Su stat más alto es ${entries[0][0]}.`;
  }
}
