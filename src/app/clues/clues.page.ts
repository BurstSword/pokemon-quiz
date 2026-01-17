import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import type { Pokemon } from 'interfaces';
import { PokemonService } from '../services/pokemon.service';
import { pickRandomItem } from '../shared/pokemon-utils';

@Component({
  selector: 'app-clues',
  templateUrl: './clues.page.html',
  styleUrls: ['./clues.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CluesPage implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon!: Pokemon;

  clues: string[] = [];
  showingClues: string[] = [];

  searchTerm = '';
  searchResults: Pokemon[] = [];

  // Pre-carga de la siguiente imagen para mejorar percepción al avanzar
  private preloadImg?: HTMLImageElement;

  constructor(
    private pokemonService: PokemonService,
    private toastController: ToastController,
  ) {}

  ngOnInit() {
    this.retrievePokemons();
  }

  // -------- Data --------
  retrievePokemons() {
    this.pokemonService.getPokemons().subscribe((list) => {
      this.pokemons = [...list];
      this.selectRandomPokemon();
    });
  }

  private pickRandomPokemon(): Pokemon | undefined {
    return pickRandomItem(this.pokemons);
  }

  selectRandomPokemon() {
    const p = this.pickRandomPokemon();
    if (!p) return;

    this.pokemon = p;
    this.generateClues();
    this.cleanSearch();

    // Preload de la siguiente imagen (queda en caché)
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
  }

  // -------- Lógica de pistas --------
  generateClues() {
    const p = this.pokemon;
    const list: string[] = [];

    list.push(`Belongs to the ${p.Generation}th generation`);
    if (p.Type2) list.push(`Its types are ${p.Type1} and ${p.Type2}`);
    else list.push(`Its type is ${p.Type1}`);

    // estaba invertido en tu versión
    list.push(p.Legendary ? `It's legendary` : `It's not legendary`);
    list.push(`Its Pokédex number is ${p.Number}`);

    const nameRx = new RegExp(p.Name, 'gi');
    const description = (p.Description || '').replace(nameRx, '______');
    list.push(`Its description is: ${description}`);

    this.clues = list;
    this.showingClues = [list[0]]; // empezamos mostrando 1
  }

  addClue() {
    const nextIndex = this.showingClues.length;
    if (nextIndex < this.clues.length) {
      this.showingClues = [...this.showingClues, this.clues[nextIndex]];
    }
  }

  // -------- Búsqueda --------
  onSearch(ev: CustomEvent) {
    const value = (ev.detail as { value?: string })?.value ?? this.searchTerm ?? '';
    const normalized = value.toString().trim().toLowerCase();

    this.searchTerm = normalized;

    if (!normalized) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.pokemons.filter((pk) =>
      pk.Name.toLowerCase().includes(normalized),
    );
  }

  async checkIfCorrect(choice: Pokemon) {
    const isCorrect = choice.Name === this.pokemon.Name;
    const toast = await this.toastController.create({
      message: isCorrect ? 'Correct!' : 'Incorrect! Try again!',
      duration: 1200,
      color: isCorrect ? 'success' : 'danger',
      position: 'top',
    });
    await toast.present();

    if (isCorrect) {
      this.selectRandomPokemon();
    }
  }

  cleanSearch() {
    this.searchTerm = '';
    this.searchResults = [];
  }

  trackByPokemon = (_: number, p: Pokemon) => p.Number ?? p.Name;
}
