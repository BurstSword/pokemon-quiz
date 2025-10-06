import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Pokemon } from 'interfaces';

@Component({
  selector: 'app-clues',
  templateUrl: './clues.page.html',
  styleUrls: ['./clues.page.scss'],
})
export class CluesPage implements OnInit {
  clues: string[] = []
  pokemons: Pokemon[] = [];
  pokemon: Pokemon = {} as Pokemon;
  showingClues: string[] = [];
  searchTerm: string = '';
  searchResults: Pokemon[] = [];


  constructor(private renderer: Renderer2, private el: ElementRef, private http: HttpClient) { }

  ngOnInit() {
    this.retrievePokemons();
  }

  retrievePokemons() {
    this.http.get<Pokemon[]>('./assets/pokemon.json').subscribe(pokemons => {
      this.pokemons = pokemons;
      this.selectRandomPokemon();
    });
  }

  selectRandomPokemon() {
    const randomIndex = Math.floor(Math.random() * this.pokemons.length);
    this.pokemons.splice(randomIndex, 1);
    this.pokemon = this.pokemons[randomIndex];
    this.generateClues();
    this.cleanSearch();
    this.changeImage(this.pokemon.Image);
  }

  changeImage(newImageSrc: string) {
    const imageElement = this.el.nativeElement.querySelector('#pokemon-image-tab-1');
    this.renderer.setProperty(imageElement, 'src', newImageSrc);
  }

  generateClues() {
    this.showingClues = [];
    this.clues = [];
    this.clues.push("Belongs to the " + this.pokemon.Generation + "th generation");
    if (this.pokemon.Type2) {
      this.clues.push("Its types are " + this.pokemon.Type1 + " and " + this.pokemon.Type2);
    } else {
      this.clues.push("Its type is " + this.pokemon.Type1);
    }
    this.clues.push(this.pokemon.Legendary ? "It's not legendary" : "It's legendary");
    this.clues.push("Its Pokédex number is " + this.pokemon.Number);
    const description = this.pokemon.Description.replace(this.pokemon.Name, "______");
    this.clues.push("Its description is: " + description);
    this.showingClues.push(this.clues[0]);
}

  addClue() {
    if(this.clues.length > this.showingClues.length){
      this.showingClues.push(this.clues[this.showingClues.length]);
    }
  }

  search(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.searchResults = this.pokemons.filter(item => item.Name.toLowerCase().includes(searchTerm));
  }

  checkIfCorrect(pokemon: Pokemon) {
    if (pokemon.Name === this.pokemon.Name) {
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
}


