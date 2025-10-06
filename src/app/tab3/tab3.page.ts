import { Component } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { Pokemon, Option } from 'interfaces';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss']
})
export class Tab3Page {
  pokemons: Pokemon[] = [];
  pokemon: Pokemon = {} as Pokemon;
  visible: boolean = false;
  options: Option[] = [];
  blurState: number = 0;
  pokemonTypes: boolean = false;

  pokemonTypesArray = [
    { type: 'Normal', image: '../../assets/pokemontypes/normal.webp' },
    { type: 'Fire', image: '../../assets/pokemontypes/fire.webp' },
    { type: 'Water', image: '../../assets/pokemontypes/water.webp' },
    { type: 'Electric', image: '../../assets/pokemontypes/electric.webp' },
    { type: 'Grass', image: '../../assets/pokemontypes/grass.webp' },
    { type: 'Ice', image: '../../assets/pokemontypes/ice.webp' },
    { type: 'Fighting', image: '../../assets/pokemontypes/fighting.webp' },
    { type: 'Poison', image: '../../assets/pokemontypes/poison.webp' },
    { type: 'Ground', image: '../../assets/pokemontypes/ground.webp' },
    { type: 'Flying', image: '../../assets/pokemontypes/flying.webp' },
    { type: 'Psychic', image: '../../assets/pokemontypes/psychic.webp' },
    { type: 'Bug', image: '../../assets/pokemontypes/bug.webp' },
    { type: 'Rock', image: '../../assets/pokemontypes/rock.webp' },
    { type: 'Ghost', image: '../../assets/pokemontypes/ghost.webp' },
    { type: 'Dragon', image: '../../assets/pokemontypes/dragon.webp' },
    { type: 'Dark', image: '../../assets/pokemontypes/dark.webp' },
    { type: 'Steel', image: '../../assets/pokemontypes/steel.webp' },
    { type: 'Fairy', image: '../../assets/pokemontypes/fairy.webp' },
  ];

  constructor(private menuController: MenuController) {
    this.retrievePokemons();
    this.blurState = 0;
  }

  async retrievePokemons() {
    this.pokemons = await getPokemons();
    this.selectRandomPokemon();
  }

  selectRandomPokemon() {
    const randomIndex = Math.floor(Math.random() * this.pokemons.length);
    setTimeout(() => {
      this.pokemon = this.pokemons[randomIndex];
      this.pokemons.splice(randomIndex, 1);
      this.generateOptions();
      const image = document.getElementById('pokemon-image-blur') as HTMLElement;
      image.classList.add('blurred0');
      this.blurState = 0;
      if (this.pokemonTypes == true) {
        this.showPokemonTypes();
      }
    }, 300);
  }

  generateOptions() {
    this.options = [
      { Name: this.pokemon.Name, Correct: true, Background: 'green' },
      ...Array.from({ length: 3 }, () => {
        const randomIndex = Math.floor(Math.random() * this.pokemons.length);
        return { Name: this.pokemons[randomIndex].Name, Correct: false, Background: 'red' };
      })
    ].sort(() => Math.random() - 0.5);
  }

  resolveOptions(option: Option, event: Event) {
    const image = document.getElementById('pokemon-image-blur') as HTMLElement;
    image.classList.remove(`blurred${this.blurState}`);
    const buttons = document.getElementsByClassName('buttonsBlur') as HTMLCollectionOf<HTMLButtonElement>;
    for (let i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
    const correctOption = document.getElementById('optiontrue') as HTMLElement;

    if (option.Correct) {
      if (event.target) {
        (event.target as HTMLElement).classList.remove('normalOption');
        (event.target as HTMLElement).classList.add('correctOption');
      }
      if (this.pokemonTypes == false) {
        this.showPokemonTypes();
      }
    } else {
      if (event.target) {
        (event.target as HTMLElement).classList.add('incorrectOption');
        correctOption.classList.remove('normalOption');
        correctOption.classList.add('correctOption');
      }
      if (this.pokemonTypes == false) {
        this.showPokemonTypes();
      }
    }
    setTimeout(() => {
      this.selectRandomPokemon();
    }, 2000);
  }

  clarifyImage() {
    const image = document.getElementById('pokemon-image-blur') as HTMLElement;
    const blurStates = ['blurred0', 'blurred1', 'blurred2', 'blurred3', 'blurred4'];
    image.classList.remove(blurStates[this.blurState]);
    this.blurState = (this.blurState + 1) % blurStates.length;
    image.classList.add(blurStates[this.blurState]);
    this.menuController.close('menuClues');
  }

  disableTwoIncorrectOptions() {
    const incorrectOptions = Array.from(document.getElementsByClassName('buttons') as HTMLCollectionOf<HTMLButtonElement>)
      .filter((_, i) => !this.options[i].Correct);
    incorrectOptions.slice(0, 2).forEach(button => button.classList.add('disabledOptions'));
  }

  showPokemonTypes() {
    this.pokemonTypes = !this.pokemonTypes;
  }

  getImageUrl(type: string) {
    const pokemonType = this.pokemonTypesArray.find(pokemonType => pokemonType.type === type);
    return pokemonType ? pokemonType.image : '';
  }
}

export async function getPokemons(): Promise<Pokemon[]> {
  const request = await fetch('./assets/pokemon.json')
  const data = await request.json()
  return data
}