import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Pokemon } from 'interfaces';

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.retrievePokemons();
  }

  // -------- Data --------
  retrievePokemons() {
    this.http.get<Pokemon[]>('assets/pokemon.json').subscribe((list) => {
      this.pokemons = [...list];
      this.selectRandomPokemon();
    });
  }

  private pickRandomPokemon(): Pokemon | undefined {
    if (this.pokemons.length === 0) return undefined;
    const idx = Math.floor(Math.random() * this.pokemons.length);
    const picked = this.pokemons[idx];
    this.pokemons.splice(idx, 1); // quitar del pool tras elegirlo
    return picked;
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
  onSearch(ev: any) {
    const value = (ev?.detail?.value ?? this.searchTerm ?? '')
      .toString()
      .trim()
      .toLowerCase();

    this.searchTerm = value;

    if (!value) {
      this.searchResults = [];
      return;
    }

    this.searchResults = this.pokemons.filter((pk) =>
      pk.Name.toLowerCase().includes(value),
    );
  }

  checkIfCorrect(choice: Pokemon) {
    if (choice.Name === this.pokemon.Name) {
      alert('Correct!');
      this.selectRandomPokemon();
    } else {
      alert('Incorrect! Try again!');
    }
  }

  cleanSearch() {
    this.searchTerm = '';
    this.searchResults = [];
  }

  trackByPokemon = (_: number, p: Pokemon) => p.Number ?? p.Name;
}
