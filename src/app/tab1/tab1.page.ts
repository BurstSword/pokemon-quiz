import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Pokemon } from 'interfaces';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon: Pokemon = {} as Pokemon;
  pokemonNameSplitted: string[] = [];
  currentPositionName: number = 0;
  pokemonLettersOptions: string[] = [];
  lettersOptionsArrays: string[][] = [];
  result: string = '';
  highlightedIndex: number = 0;
  usedLetters: string[] = [];
  rowCount: number = 0;

  constructor(private renderer: Renderer2, private el: ElementRef, private http: HttpClient) { }

  ngOnInit() {
    this.retrievePokemons();
  }

  changePosition(index: number) {
    this.currentPositionName = index;
    this.highlightButton(index);
  }

  highlightButton(index: number) {
    this.highlightedIndex = index;
    const buttons = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    Array.from(buttons).forEach((button, i) => {
      this.renderer.removeClass(button, 'highlighted');
      if (i === index) {
        this.renderer.addClass(button, 'highlighted');
      }
    });
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
    this.pokemonNameSplitted = this.splitPokemonName(this.pokemon.Name);
    this.changeImage(this.pokemon.Image);
    this.highlightButton(0);
    this.generatePokemonLettersOptions();
  }

  splitPokemonName(pokemonName: string) {
    return pokemonName.split('');
  }

  cleanPokemonName() {
    this.result = '';
    this.currentPositionName = 0;
    const letters = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    Array.from(letters).forEach(letter => {
      this.renderer.setProperty(letter, 'textContent', '');
    });
  }

  generatePokemonLettersOptions() {
    const letters = this.pokemonNameSplitted;
    const lettersOptionsArrays: string[][] = [];
    let lettersOptions = [];
    for (let i = 0; i < letters.length; i++) {
      lettersOptions.push(letters[i].toUpperCase());
      const randomNumber = Math.floor(Math.random() * 100) + 1;
      if (randomNumber > 10) {
        lettersOptions.push(String.fromCharCode(Math.floor(Math.random() * 26) + 65).toUpperCase());
      }
    }
    this.pokemonLettersOptions = lettersOptions;
    this.lettersOptionsArrays = lettersOptionsArrays;
    this.lettersOptionsArrays = this.chunkArray(this.pokemonLettersOptions);
  }

  fillLetter(letter: string) {
    const letters = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    if (this.currentPositionName < this.pokemonNameSplitted.length) {
      this.renderer.setProperty(letters[this.currentPositionName], 'textContent', letter);
      this.result += letter;
      this.renderer.removeClass(letters[this.currentPositionName], 'highlighted');
      if (this.currentPositionName !== this.pokemonNameSplitted.length - 1) {
        this.currentPositionName += 1;
      }
      if (this.currentPositionName < this.pokemonNameSplitted.length) {
        this.renderer.addClass(letters[this.currentPositionName], 'highlighted');
      }
    }
  }

  chunkArray(myArray: string[]) {
    let index = 0;
    let arrayLength = myArray.length;
    let tempArray: string[][] = [];
    let chunk_size: number;

    while (index < arrayLength) {
      // Alternate between chunk sizes of 5 and 4
      chunk_size = tempArray.length % 2 === 0 ? 5 : 4;

      let myChunk = myArray.slice(index, index + chunk_size);
      tempArray.push(myChunk);

      index += chunk_size;
    }

    return tempArray;
  }

  checkIfCorrect() {
    this.getPokemonNameButtons();
    setTimeout(() => {
      if (this.result.toLowerCase() === this.pokemon.Name.toLowerCase()) {
        this.selectRandomPokemon();
        this.cleanPokemonName();
      } else {
        this.checkWichLetterIsCorrect();
      }
    }, 1000);

  }

  checkWichLetterIsCorrect() {
    const letters = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    Array.from(letters).forEach((letter, i) => {
      if (this.result[i].toLowerCase() === this.pokemonNameSplitted[i].toLowerCase()) {
        this.renderer.setStyle(letter, 'backgroundColor', 'green');
      } else {
        this.renderer.setStyle(letter, 'backgroundColor', 'red');
      }
    });
  }

  changeImage(newImageSrc: string) {
    const imageElement = this.el.nativeElement.querySelector('#pokemon-image-tab-1');
    this.renderer.setProperty(imageElement, 'src', newImageSrc);
  }

  getPokemonNameButtons(): void {
    const elements = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    this.result = '';
    Array.from(elements).forEach((element: unknown) => {
      const htmlElement = element as HTMLElement;
      this.result += htmlElement.textContent;
    });
  }

  fillOrCorrectOneLetter() {
    const letters = this.el.nativeElement.getElementsByClassName('pokemonNameButton');
    let corrected = Array.from(letters).some((letterElement, i) => {
      const letter = letterElement as HTMLElement;
      const letterText = letter.textContent?.trim().toLowerCase(); // Add null check here
      if (letterText !== this.pokemonNameSplitted[i].toLowerCase()) {
        // Remove highlight from the previous position
        if (this.currentPositionName > 0) {
          const previousLetter = letters[this.currentPositionName] as HTMLElement;
          this.renderer.removeClass(previousLetter, 'highlighted');
        }

        this.renderer.setProperty(letter, 'textContent', this.pokemonNameSplitted[i].toUpperCase());
        this.currentPositionName = i + 1;
        this.renderer.removeClass(letter, 'highlighted');
        if (this.currentPositionName < this.pokemonNameSplitted.length) {
          const nextLetter = letters[this.currentPositionName] as HTMLElement;
          this.renderer.addClass(nextLetter, 'highlighted');
        }// Update the current position to the next letter
        return true;
      }
      return false;
    });

    if (!corrected && this.currentPositionName < this.pokemonNameSplitted.length) {
      const letter = letters[this.currentPositionName] as HTMLElement;
      this.renderer.setProperty(letter, 'textContent', this.pokemonNameSplitted[this.currentPositionName].toUpperCase());
      this.result += this.pokemonNameSplitted[this.currentPositionName];
      this.renderer.removeClass(letter, 'highlighted');
      if (this.currentPositionName !== this.pokemonNameSplitted.length - 1) {
        this.currentPositionName += 1;
      }
      if (this.currentPositionName < this.pokemonNameSplitted.length) {
        const nextLetter = letters[this.currentPositionName] as HTMLElement;
        this.renderer.addClass(nextLetter, 'highlighted');
      }
    }
  }
}