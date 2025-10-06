import { Component, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Pokemon } from 'interfaces';
import { trigger, transition, style, animate } from '@angular/animations';


@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.5s ease-in-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('0.5s ease-in-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class Tab4Page {
  pokemons: Pokemon[] = [];
  pokemon: Pokemon = {} as Pokemon;
  firstRowKeyboard: string[] = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  secondRowKeyboard: string[] = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  thirdRowKeyboard: string[] = ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER'];
  numbersRowKeyboard: string[] = ['\'', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];
  pokemonNameSplitted: string[] = [];
  result: string = '';
  currentPositionName: number = 0;
  highlightedIndex: number = 0;

  constructor(private renderer: Renderer2, private el: ElementRef) {
    this.retrievePokemons();
  }

  ionViewWillEnter() {
    this.cleanPokemonName();
  }

  retrievePokemons() {
    this.cleanPokemonName();
    getPokemons().then(pokemons => {
      this.pokemons = pokemons;
    }).finally(() => {
      this.selectRandomPokemon();
    });
  }

  changePosition(index: number) {
    this.currentPositionName = index;
    this.highlightButton(index);
  }

  highlightButton(index: number) {
    this.highlightedIndex = index;
    console.log(this.highlightedIndex);
    const buttons = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    Array.from(buttons).forEach((button, i) => {
      this.renderer.removeClass(button, 'highlighted');
      if (i === index) {
        this.renderer.addClass(button, 'highlighted');
      }
    });
  }

  selectRandomPokemon() {
    const randomIndex = Math.floor(Math.random() * this.pokemons.length);
    this.pokemons.splice(randomIndex, 1);
    setTimeout(() => {
      this.pokemon = this.pokemons[randomIndex];
      this.changeImageSrc(this.pokemon.Image);
      this.highlightButton(0);
      this.pokemonNameSplitted = this.splitPokemonName(this.pokemon.Name);
    }, 300);
  }

  getPokemonNameButtons(): void {
    const elements = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    this.result = '';
    Array.from(elements).forEach((element: unknown) => {
      const htmlElement = element as HTMLElement;
      this.result += htmlElement.textContent;
    });
  }

  selectLetter(letter: string) {
    const letters = document.getElementsByClassName('pokemonNameButton');
    if (letter === 'DEL' && this.currentPositionName > 0) {
      this.currentPositionName -= 1;
      letters[this.currentPositionName].textContent = '';
      this.result = this.result.slice(0, -1);
      this.highlightButton(this.currentPositionName);
    } else if (letter === 'ENTER') {

      this.getPokemonNameButtons();
      if (this.result.toLowerCase() === this.pokemon.Name.toLowerCase()) {

        setTimeout(() => {
          this.cleanPokemonName();
          this.selectRandomPokemon();
        }, 1000);
      } else {
        // Mark that the result is incorrect
      }
    } else {
      if (letter !== 'DEL' && letter !== 'ENTER' && this.currentPositionName < this.pokemonNameSplitted.length) {
        letters[this.currentPositionName].textContent = letter;
        this.result += letter;
        this.currentPositionName += 1;
        this.highlightButton(this.currentPositionName);
      }
    }
  }

  splitPokemonName(pokemonName: string) {
    return pokemonName.split('');
  }

  cleanPokemonName() {
    this.result = '';
    this.currentPositionName = 0;
    const letters = document.getElementsByClassName('pokemonNameButton');
    for (let i = 0; i < letters.length; i++) {
      letters[i].textContent = ' ';
    }
  }

  fillOrCorrectOneLetter() {
    const letters = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    let corrected = Array.from(letters).some((letterElement, i) => {
      const letter = letterElement as HTMLElement;
      const letterText = letter.textContent?.trim().toLowerCase(); // Add null check here
      if (letterText !== this.pokemonNameSplitted[i].toLowerCase()) {
        // Remove highlight from the previous position
        if (this.currentPositionName > 0 && this.currentPositionName < letters.length) {
          const previousLetter = letters[this.currentPositionName] as HTMLElement;
          if (previousLetter) {
            this.renderer.removeClass(previousLetter, 'highlighted');
          }
        }

        this.renderer.setProperty(letter, 'textContent', this.pokemonNameSplitted[i].toUpperCase());
        this.currentPositionName = i + 1;
        this.renderer.removeClass(letter, 'highlighted');
        if (this.currentPositionName < this.pokemonNameSplitted.length && this.currentPositionName < letters.length) {
          const nextLetter = letters[this.currentPositionName] as HTMLElement;
          if (nextLetter) {
            this.renderer.addClass(nextLetter, 'highlighted');
          }
        }
        return true;
      }
      return false;
    });

    if (!corrected && this.currentPositionName < this.pokemonNameSplitted.length && this.currentPositionName < letters.length) {
      const letter = letters[this.currentPositionName] as HTMLElement;
      if (letter) {
        this.renderer.setProperty(letter, 'textContent', this.pokemonNameSplitted[this.currentPositionName].toUpperCase());
        this.result += this.pokemonNameSplitted[this.currentPositionName];
        this.renderer.removeClass(letter, 'highlighted');
        if (this.currentPositionName !== this.pokemonNameSplitted.length - 1) {
          this.currentPositionName += 1;
        }
      }
      if (this.currentPositionName < this.pokemonNameSplitted.length) {
        const nextLetter = letters[this.currentPositionName] as HTMLElement;
        this.renderer.addClass(nextLetter, 'highlighted');
      }
    }
  }

  changeImageSrc(newSrc: string) {
    this.pokemon.Image = '';
    setTimeout(() => {
      this.pokemon.Image = newSrc;
    }, 100);
  }

}

export async function getPokemons(): Promise<Pokemon[]> {
  const request = await fetch('./assets/pokemon.json')
  const data = await request.json()
  return data
}
