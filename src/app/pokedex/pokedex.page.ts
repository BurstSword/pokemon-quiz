import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pokemon } from 'interfaces';
import { PageEvent } from '@angular/material/paginator';
import { ModalController } from '@ionic/angular';
import { PokemonModalComponent } from '../pokemon-modal/pokemon-modal.component';

@Component({
  selector: 'app-pokedex',
  templateUrl: './pokedex.page.html',
  styleUrls: ['./pokedex.page.scss']
})
export class PokedexPage implements OnInit {
  pageEvent: PageEvent = new PageEvent;
  pageSize = 10;
  currentPage = 0;
  pokemons: Pokemon[] = [];
  filteredPokemons: any[] = [];
  pokemonTypesArray = [
    { type: 'Normal', image: '../../assets/pokemontypes/normal.webp', color: '#A8A77A' },
    { type: 'Fire', image: '../../assets/pokemontypes/fire.webp', color: '#EE8130' },
    { type: 'Water', image: '../../assets/pokemontypes/water.webp', color: '#6390F0' },
    { type: 'Electric', image: '../../assets/pokemontypes/electric.webp', color: '#F7D02C' },
    { type: 'Grass', image: '../../assets/pokemontypes/grass.webp', color: '#7AC74C' },
    { type: 'Ice', image: '../../assets/pokemontypes/ice.webp', color: '#96D9D6' },
    { type: 'Fighting', image: '../../assets/pokemontypes/fighting.webp', color: '#C22E28' },
    { type: 'Poison', image: '../../assets/pokemontypes/poison.webp', color: '#A33EA1' },
    { type: 'Ground', image: '../../assets/pokemontypes/ground.webp', color: '#E2BF65' },
    { type: 'Flying', image: '../../assets/pokemontypes/flying.webp', color: '#A98FF3' },
    { type: 'Psychic', image: '../../assets/pokemontypes/psychic.webp', color: '#F95587' },
    { type: 'Bug', image: '../../assets/pokemontypes/bug.webp', color: '#A6B91A' },
    { type: 'Rock', image: '../../assets/pokemontypes/rock.webp', color: '#B6A136' },
    { type: 'Ghost', image: '../../assets/pokemontypes/ghost.webp', color: '#735797' },
    { type: 'Dragon', image: '../../assets/pokemontypes/dragon.webp', color: '#6F35FC' },
    { type: 'Dark', image: '../../assets/pokemontypes/dark.webp', color: '#705746' },
    { type: 'Steel', image: '../../assets/pokemontypes/steel.webp', color: '#B7B7CE' },
    { type: 'Fairy', image: '../../assets/pokemontypes/fairy.webp', color: '#D685AD' },
  ];
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
  ngOnInit() {
  }

  constructor(private http: HttpClient, private modalController: ModalController) {
    this.retrievePokemons();

  }

  retrievePokemons() {
    this.http.get<Pokemon[]>('./assets/pokemon.json').subscribe(pokemons => {
      this.pokemons = pokemons;
      this.filteredPokemons = [...this.pokemons];
    });
  }

  getImageUrl(type: string) {
    const pokemonType = this.pokemonTypesArray.find(pokemonType => pokemonType.type === type);
    return pokemonType ? pokemonType.image : '';
  }

  getColor(type: string): string {
    const pokemonType = this.pokemonTypesArray.find(pokemonType => pokemonType.type === type);
    if (pokemonType) {
      const color = pokemonType.color;
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      const opacity = 0.5; // Set your desired opacity here
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return 'rgba(255, 255, 255, 1)'; // default color if type not found
  }

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


