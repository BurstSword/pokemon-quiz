import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { Pokemon } from 'interfaces';
import { PokemonService } from '../services/pokemon.service';
import { pickRandomItem } from '../shared/pokemon-utils';

type Letter = string;
type CellState = 'empty' | 'ok' | 'bad';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab1Page implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon!: Pokemon;

  pokemonNameSplitted: string[] = [];
  answer: string[] = [];                 // User input per cell
  feedback: CellState[] = [];            // Visual state per cell

  currentPositionName = 0;
  highlightedIndex = 0;

  lettersOptionsArrays: string[][] = [];
  isLoadingImage = true;

  // Preload next image to speed up navigation
  private preloadImg?: HTMLImageElement;

  constructor(
    private pokemonService: PokemonService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.retrievePokemons();
  }

  // ---------- Data ----------
  retrievePokemons() {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.selectRandomPokemon();
      this.cdr.markForCheck(); // <- fuerza render tras la carga inicial
    });
  }

  private pickRandomPokemon(): Pokemon | undefined {
    return pickRandomItem(this.pokemons);
  }

  // Rellena/corrige la primera casilla incorrecta o vacía.
  // Si todo está correcto, pasa al siguiente Pokémon.
  fillOrCorrectOneLetter() {
    if (!this.pokemon || this.pokemonNameSplitted.length === 0) return;

    const n = this.pokemonNameSplitted.length;

    // 1) Busca la primera posición incorrecta (incluye vacías)
    for (let i = 0; i < n; i++) {
      const target = this.pokemonNameSplitted[i].toUpperCase();
      const cur = (this.answer?.[i] || '').toUpperCase();

      if (cur !== target) {
        // Corrige esa casilla
        this.answer[i] = target;
        this.feedback[i] = 'ok';
        // Mueve el foco a la siguiente vacía (o a la siguiente posición)
        const nextEmpty = this.findNextEmpty(i + 1);
        const next = nextEmpty !== null ? nextEmpty : Math.min(i + 1, n - 1);
        this.currentPositionName = next;
        this.highlightedIndex = next;
        return;
      }
    }

    // 2) Si llega aquí, todo coincide -> siguiente Pokémon
    this.selectRandomPokemon();
  }

  selectRandomPokemon() {
    const p = this.pickRandomPokemon();
    if (!p) return;

    this.pokemon = p;
    this.pokemonNameSplitted = this.pokemon.Name.split('');
    this.answer = Array(this.pokemonNameSplitted.length).fill('');
    this.feedback = Array(this.pokemonNameSplitted.length).fill('empty');
    this.currentPositionName = 0;
    this.highlightedIndex = 0;
    this.isLoadingImage = true;

    this.generatePokemonLettersOptions();

    // Preload next image in background (browser cache)
    const next =
      this.pokemons.length > 0
        ? this.pokemons[Math.floor(Math.random() * this.pokemons.length)]
        : null;
    if (next?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = next.Image;
    }

    this.cdr.markForCheck(); // <- marcamos tras preparar todo el estado del nuevo Pokémon
  }

  // ---------- UI State ----------
  changePosition(index: number) {
    this.currentPositionName = index;
    this.highlightedIndex = index;
  }

  // Generate keyboard options (mix of correct letters + distractors), chunked 5/4/5/4...
  generatePokemonLettersOptions() {
    const letters = this.pokemonNameSplitted;
    const options: Letter[] = [];

    for (let i = 0; i < letters.length; i++) {
      options.push(letters[i].toUpperCase());
      if (Math.random() > 0.1) {
        options.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
      }
    }

    // Shuffle (Fisher–Yates)
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    this.lettersOptionsArrays = this.chunkArray(options);
  }

  chunkArray(arr: string[]) {
    const out: string[][] = [];
    let idx = 0;
    while (idx < arr.length) {
      const size = out.length % 2 === 0 ? 5 : 4;
      out.push(arr.slice(idx, idx + size));
      idx += size;
    }
    return out;
  }

  // ---------- Interactions ----------
  fillLetter(letter: string) {
    const i = this.currentPositionName;
    if (i >= this.pokemonNameSplitted.length) return;

    const target = this.pokemonNameSplitted[i].toUpperCase();
    const typed = letter.toUpperCase();

    // Write/overwrite the selected cell
    this.answer[i] = typed;
    this.feedback[i] = typed === target ? 'ok' : 'bad';

    // If correct, auto-move to next empty cell (quality of life)
    if (this.feedback[i] === 'ok') {
      const next = this.findNextEmpty(i + 1);
      if (next !== null) {
        this.currentPositionName = next;
        this.highlightedIndex = next;
      }
    }
  }

  clearSelected() {
    const i = this.currentPositionName;
    if (i < 0 || i >= this.answer.length) return;
    this.answer[i] = '';
    this.feedback[i] = 'empty';
  }

  private findNextEmpty(from: number): number | null {
    for (let i = from; i < this.answer.length; i++) if (this.answer[i] === '') return i;
    for (let i = 0; i < from; i++) if (this.answer[i] === '') return i;
    return null;
  }

  checkIfCorrect() {
    const target = this.pokemon.Name.toUpperCase();
    const guess = this.answer.join('').toUpperCase();

    // Update feedback per cell
    for (let i = 0; i < this.answer.length; i++) {
      const cur = (this.answer[i] || '').toUpperCase();
      const tar = (this.pokemonNameSplitted[i] || '').toUpperCase();
      this.feedback[i] = cur === tar ? 'ok' : 'bad';
    }

    // Single ENTER: if perfect match, move forward
    if (guess === target) {
      this.selectRandomPokemon();
    }
  }

  // ---------- Helpers ----------
  trackByIndex = (i: number) => i;

  onImgLoaded() {
    this.isLoadingImage = false;
    this.cdr.markForCheck(); // <- si usas skeleton/estados de carga
  }
}
