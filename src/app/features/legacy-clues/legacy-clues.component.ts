import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { Pokemon } from '../../core/models/pokemon.model';
import { PokemonService } from '../../core/services/pokemon.service';
import { ToastService } from '../../core/services/toast.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { pickRandomItem } from '../../shared/utils/pokemon.utils';

@Component({
  selector: 'app-legacy-clues',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  templateUrl: './legacy-clues.component.html',
  styleUrl: './legacy-clues.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyCluesComponent implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;
  clues: string[] = [];
  showingClues: string[] = [];
  searchTerm = '';
  searchResults: Pokemon[] = [];
  private preloadImg?: HTMLImageElement;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly toastService: ToastService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.selectRandomPokemon();
    });
  }

  get visibleResults(): Pokemon[] {
    return this.searchResults.slice(0, 4);
  }

  selectRandomPokemon(): void {
    const pokemon = pickRandomItem(this.pokemons);
    if (!pokemon) {
      return;
    }

    this.pokemon = pokemon;
    this.generateClues();
    this.cleanSearch();

    const next = this.pokemons.length > 0
      ? this.pokemons[Math.floor(Math.random() * this.pokemons.length)]
      : undefined;
    if (next?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = next.Image;
    }

    this.cdr.markForCheck();
  }

  generateClues(): void {
    const pokemon = this.pokemon;
    if (!pokemon) {
      return;
    }

    const clues: string[] = [];
    clues.push(`Belongs to the ${pokemon.Generation}th generation`);
    clues.push(
      pokemon.Type2
        ? `Its types are ${pokemon.Type1} and ${pokemon.Type2}`
        : `Its type is ${pokemon.Type1}`,
    );
    clues.push(pokemon.Legendary ? `It's legendary` : `It's not legendary`);
    clues.push(`Its Pokedex number is ${pokemon.Number}`);

    const nameExpression = new RegExp(this.escapeRegExp(pokemon.Name), 'gi');
    const description = (pokemon.Description || '').replace(nameExpression, '______');
    clues.push(`Its description is: ${description}`);

    this.clues = clues;
    this.showingClues = clues.length > 0 ? [clues[0]] : [];
  }

  addClue(): void {
    const nextIndex = this.showingClues.length;
    if (nextIndex < this.clues.length) {
      const next = this.clues[nextIndex];
      if (next) {
        this.showingClues = [...this.showingClues, next];
        this.cdr.markForCheck();
      }
    }
  }

  onSearch(value: string): void {
    const normalized = value.trim().toLowerCase();
    this.searchTerm = value;

    if (!normalized) {
      this.searchResults = [];
      this.cdr.markForCheck();
      return;
    }

    this.searchResults = this.pokemons.filter((pokemon) =>
      pokemon.Name.toLowerCase().includes(normalized),
    );
    this.cdr.markForCheck();
  }

  checkIfCorrect(choice: Pokemon): void {
    const currentPokemon = this.pokemon;
    if (!currentPokemon) {
      return;
    }

    const isCorrect = choice.Name === currentPokemon.Name;
    this.toastService.show(
      isCorrect ? 'Correct!' : 'Incorrect! Try again!',
      isCorrect ? 'success' : 'danger',
    );

    if (isCorrect) {
      this.selectRandomPokemon();
    }
  }

  trackByPokemon = (_: number, pokemon: Pokemon): string | number => pokemon.Number ?? pokemon.Name;

  private cleanSearch(): void {
    this.searchTerm = '';
    this.searchResults = [];
    this.cdr.markForCheck();
  }

  private escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
