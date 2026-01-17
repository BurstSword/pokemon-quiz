import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Pokemon } from 'interfaces';
import { PageEvent } from '@angular/material/paginator';
import { ModalController } from '@ionic/angular';
import { PokemonModalComponent } from '../pokemon-modal/pokemon-modal.component';
import { PokemonService } from '../services/pokemon.service';
import { PokemonTypeService } from '../services/pokemon-type.service';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.page.html',
  styleUrls: ['./pokedex.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PokedexPage {
  pageEvent: PageEvent = new PageEvent();
  pageSize = 10;
  currentPage = 0;
  pokemons: Pokemon[] = [];
  filteredPokemons: Pokemon[] = [];
  searchTerm = '';

  filterPokemons() {
    if (this.searchTerm) {
      this.filteredPokemons = this.pokemons.filter(pokemon =>
        pokemon.Name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    } else {
      this.filteredPokemons = [...this.pokemons];
    }
    this.currentPage = 0; // Reset pagination
  }

  get maxPage() {
    return Math.ceil(this.filteredPokemons.length / this.pageSize) - 1;
  }

  get paginatedPokemons() {
    const startIndex = this.currentPage * this.pageSize;
    return this.filteredPokemons.slice(startIndex, startIndex + this.pageSize);
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
  }
  constructor(
    private pokemonService: PokemonService,
    private pokemonTypeService: PokemonTypeService,
    private modalController: ModalController,
  ) {
    this.retrievePokemons();
  }

  retrievePokemons() {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.filteredPokemons = [...pokemons];
    });
  }

  getImageUrl(type: string) {
    return this.pokemonTypeService.getTypeImage(type);
  }

  getColor(type: string): string {
    return this.pokemonTypeService.getTypeColor(type, 0.5);
  }

  trackByPokemon = (_: number, pokemon: Pokemon) => pokemon.Number ?? pokemon.Name;

  async showPokemonDetails(pokemon: Pokemon) {
    const modal = await this.modalController.create({
      component: PokemonModalComponent,
      cssClass: 'custom-modal', // Add this line
      animated: true, // This line adds animation
      componentProps: {
        pokemon: pokemon
      }
    });
    return await modal.present();
  }
}
