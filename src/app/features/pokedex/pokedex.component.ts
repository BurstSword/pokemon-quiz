import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Pokemon, PokemonStats } from '../../core/models/pokemon.model';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type StatEntry = {
  key: keyof PokemonStats;
  label: string;
  value: number;
};

@Component({
  selector: 'app-pokedex',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './pokedex.component.html',
  styleUrl: './pokedex.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexComponent implements OnInit {
  readonly suggestionLimit = 8;
  readonly explorePageSize = 12;

  pokemons: Pokemon[] = [];
  searchTerm = '';
  suggestions: Pokemon[] = [];
  suggestionsOpen = false;
  selectedPokemon: Pokemon | null = null;
  exploreOpen = false;
  currentPage = 0;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly pokemonTypeService: PokemonTypeService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.pokemonService.getEnrichedPokemonList().subscribe((pokemons) => {
      this.pokemons = [...pokemons].sort((left, right) => left.Number - right.Number);
      this.selectedPokemon = this.pokemons[0] ?? null;
      if (this.selectedPokemon) {
        this.searchTerm = this.getPokemonLabel(this.selectedPokemon);
      }
      this.cdr.markForCheck();
    });
  }

  get maxPage(): number {
    return Math.max(0, Math.ceil(this.pokemons.length / this.explorePageSize) - 1);
  }

  get paginatedPokemons(): Pokemon[] {
    const start = this.currentPage * this.explorePageSize;
    return this.pokemons.slice(start, start + this.explorePageSize);
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.updateSuggestions();
  }

  onSearchFocus(): void {
    this.updateSuggestions();
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.suggestionsOpen = false;
      this.cdr.markForCheck();
    }, 120);
  }

  onSearchKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.suggestionsOpen = false;
      this.cdr.markForCheck();
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();
    const exact = this.findExactPokemon(this.searchTerm);
    if (exact) {
      this.selectPokemon(exact);
      return;
    }

    const firstSuggestion = this.suggestions[0];
    if (firstSuggestion) {
      this.selectPokemon(firstSuggestion);
    }
  }

  selectPokemon(pokemon: Pokemon): void {
    this.selectedPokemon = pokemon;
    this.searchTerm = this.getPokemonLabel(pokemon);
    const selectedIndex = this.pokemons.findIndex((entry) => entry.Number === pokemon.Number);
    if (selectedIndex >= 0) {
      this.currentPage = Math.floor(selectedIndex / this.explorePageSize);
    }
    this.suggestions = [];
    this.suggestionsOpen = false;
    this.cdr.markForCheck();
  }

  selectSuggestion(pokemon: Pokemon, event?: Event): void {
    event?.preventDefault();
    this.selectPokemon(pokemon);
  }

  toggleExplore(): void {
    this.exploreOpen = !this.exploreOpen;
  }

  previousPage(): void {
    this.currentPage = Math.max(0, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.maxPage, this.currentPage + 1);
  }

  getPokemonLabel(pokemon: Pokemon): string {
    return pokemon.SpanishName || pokemon.DisplayName || pokemon.Name;
  }

  getPokemonDescription(pokemon: Pokemon): string {
    return pokemon.DescriptionEs || pokemon.Description || pokemon.DescriptionEn || 'No hay descripci\u00f3n disponible.';
  }

  getPokemonImage(pokemon: Pokemon): string {
    return pokemon.OfficialArtwork
      || pokemon.Image
      || pokemon.SerebiiImage
      || pokemon.FrontDefault
      || pokemon.Sprite
      || '';
  }

  getSuggestionSprite(pokemon: Pokemon): string {
    return pokemon.FrontDefault
      || pokemon.Sprite
      || pokemon.OfficialArtwork
      || pokemon.Image
      || pokemon.SerebiiImage
      || '';
  }

  getEvolutionPokemons(pokemon: Pokemon): Pokemon[] {
    const familyNumbers = pokemon.EvolutionFamily ?? [];
    if (familyNumbers.length > 0) {
      return familyNumbers
        .map((number) => this.pokemons.find((entry) => entry.Number === number))
        .filter((entry): entry is Pokemon => Boolean(entry));
    }

    const lineNames = pokemon.EvolutionLineNames ?? [];
    return lineNames
      .map((name) =>
        this.pokemons.find((entry) => this.normalizeText(this.getPokemonLabel(entry)) === this.normalizeText(name)),
      )
      .filter((entry): entry is Pokemon => Boolean(entry));
  }

  getEvolutionSprite(pokemon: Pokemon): string {
    return pokemon.FrontDefault
      || pokemon.Sprite
      || pokemon.OfficialArtwork
      || pokemon.Image
      || pokemon.SerebiiImage
      || '';
  }

  getImageUrl(type: string): string {
    return this.pokemonTypeService.getTypeImage(type);
  }

  getColor(type: string): string {
    return this.pokemonTypeService.getTypeColor(type, 0.82);
  }

  getTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      Grass: 'Planta',
      Poison: 'Veneno',
      Fire: 'Fuego',
      Water: 'Agua',
      Flying: 'Volador',
      Normal: 'Normal',
      Electric: 'El\u00e9ctrico',
      Ground: 'Tierra',
      Fairy: 'Hada',
      Fighting: 'Lucha',
      Psychic: 'Ps\u00edquico',
      Rock: 'Roca',
      Steel: 'Acero',
      Ice: 'Hielo',
      Ghost: 'Fantasma',
      Dragon: 'Drag\u00f3n',
      Dark: 'Siniestro',
      Bug: 'Bicho',
    };

    return labels[type] ?? type;
  }

  getPokemonFacts(pokemon: Pokemon): Array<{ label: string; value: string }> {
    const facts = [
      { label: 'Generaci\u00f3n', value: `Gen ${pokemon.Generation}` },
      ...(pokemon.Genus ? [{ label: 'Categor\u00eda', value: pokemon.Genus }] : []),
      ...(typeof pokemon.HeightMeters === 'number' ? [{ label: 'Altura', value: `${pokemon.HeightMeters} m` }] : []),
      ...(typeof pokemon.WeightKg === 'number' ? [{ label: 'Peso', value: `${pokemon.WeightKg} kg` }] : []),
    ];

    if (pokemon.IsMythical) {
      facts.push({ label: 'Rareza', value: 'M\u00edtico' });
    } else if (pokemon.IsLegendary || pokemon.Legendary === true || pokemon.Legendary === 'TRUE') {
      facts.push({ label: 'Rareza', value: 'Legendario' });
    }

    return facts;
  }

  getStatEntries(pokemon: Pokemon): StatEntry[] {
    const stats = pokemon.Stats;
    if (!stats) {
      return [];
    }

    return [
      { key: 'HP', label: 'PS', value: stats.HP ?? 0 },
      { key: 'Attack', label: 'Ataque', value: stats.Attack ?? 0 },
      { key: 'Defense', label: 'Defensa', value: stats.Defense ?? 0 },
      { key: 'SpecialAttack', label: 'At. Esp.', value: stats.SpecialAttack ?? 0 },
      { key: 'SpecialDefense', label: 'Def. Esp.', value: stats.SpecialDefense ?? 0 },
      { key: 'Speed', label: 'Velocidad', value: stats.Speed ?? 0 },
    ];
  }

  getStatWidth(value: number): string {
    return `${Math.max(8, Math.min(100, Math.round((value / 180) * 100)))}%`;
  }

  getPokedexNumber(pokemon: Pokemon): string {
    return String(pokemon.Number).padStart(3, '0');
  }

  isSelectedEvolution(pokemon: Pokemon): boolean {
    return pokemon.Number === this.selectedPokemon?.Number;
  }

  trackByPokemon = (_: number, pokemon: Pokemon): number => pokemon.Number;
  trackByStat = (_: number, stat: StatEntry): string => stat.key;

  private updateSuggestions(): void {
    const normalized = this.normalizeText(this.searchTerm);
    if (!normalized) {
      this.suggestions = [];
      this.suggestionsOpen = false;
      this.cdr.markForCheck();
      return;
    }

    this.suggestions = this.pokemons
      .filter((pokemon) => this.buildSearchValues(pokemon).some((value) => value.includes(normalized)))
      .slice(0, this.suggestionLimit);
    this.suggestionsOpen = this.suggestions.length > 0;
    this.cdr.markForCheck();
  }

  private findExactPokemon(query: string): Pokemon | null {
    const normalized = this.normalizeText(query);
    if (!normalized) {
      return null;
    }

    const numeric = Number(normalized);
    if (!Number.isNaN(numeric) && /^\d+$/.test(normalized)) {
      return this.pokemons.find((pokemon) => pokemon.Number === numeric) ?? null;
    }

    return this.pokemons.find((pokemon) =>
      this.buildSearchValues(pokemon).some((value) => value === normalized),
    ) ?? null;
  }

  private buildSearchValues(pokemon: Pokemon): string[] {
    return [
      this.normalizeText(String(pokemon.Number)),
      this.normalizeText(this.getPokedexNumber(pokemon)),
      this.normalizeText(pokemon.Name),
      this.normalizeText(pokemon.DisplayName ?? ''),
      this.normalizeText(pokemon.SpanishName ?? ''),
      this.normalizeText(pokemon.EnglishName ?? ''),
    ].filter(Boolean);
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/['\u2019.]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
}
