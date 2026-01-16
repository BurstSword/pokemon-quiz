import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import type { Pokemon } from 'interfaces';
import { PokemonService } from '../services/pokemon.service';
import { PokemonTypeService } from '../services/pokemon-type.service';
import { pickRandomItem, sampleUnique, shuffleArray } from '../shared/pokemon-utils';

type OptionState = 'normal' | 'correct' | 'incorrect' | 'disabled';
type OptionVM = { Name: string; Correct: boolean; state: OptionState };

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab3Page implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon!: Pokemon;
  options: OptionVM[] = [];
  blurState = 0;
  pokemonTypes = false;
  optionsLocked = false;
  isRevealed = false;

  constructor(
    private pokemonService: PokemonService,
    private pokemonTypeService: PokemonTypeService,
  ) {}

  ngOnInit(): void {
    this.retrievePokemons();
  }

  retrievePokemons() {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.selectRandomPokemon();
    });
  }

  selectRandomPokemon() {
    const picked = pickRandomItem(this.pokemons);
    if (!picked) return;

    this.pokemon = picked;
    this.blurState = 0;
    this.pokemonTypes = false;
    this.optionsLocked = false;
    this.isRevealed = false;
    this.generateOptions();
  }

  generateOptions() {
    const correct: OptionVM = { Name: this.pokemon.Name, Correct: true, state: 'normal' };
    const wrongs = sampleUnique(
      this.pokemons,
      3,
      (candidate) => candidate.Name === this.pokemon.Name,
    );
    const wrongOptions: OptionVM[] = wrongs.map((pk) => ({
      Name: pk.Name,
      Correct: false,
      state: 'normal',
    }));
    this.options = shuffleArray([correct, ...wrongOptions]);
  }

  resolveOptions(option: OptionVM) {
    if (this.optionsLocked || option.state === 'disabled') return;

    this.optionsLocked = true;
    this.isRevealed = true;
    if (!this.pokemonTypes) {
      this.pokemonTypes = true;
    }

    this.options = this.options.map((item) => {
      if (item === option) {
        return { ...item, state: item.Correct ? 'correct' : 'incorrect' };
      }
      if (item.Correct) {
        return { ...item, state: 'correct' };
      }
      return item;
    });

    setTimeout(() => {
      this.selectRandomPokemon();
    }, 2000);
  }

  clarifyImage() {
    if (this.isRevealed) return;
    const blurStates = 5;
    this.blurState = (this.blurState + 1) % blurStates;
  }

  disableTwoIncorrectOptions() {
    if (this.optionsLocked) return;
    let remaining = 2;
    this.options = this.options.map((item) => {
      if (!item.Correct && item.state === 'normal' && remaining > 0) {
        remaining -= 1;
        return { ...item, state: 'disabled' };
      }
      return item;
    });
  }

  getImageUrl(type: string) {
    return this.pokemonTypeService.getTypeImage(type);
  }

  getOptionClass(option: OptionVM) {
    return {
      normalOption: option.state === 'normal',
      correctOption: option.state === 'correct',
      incorrectOption: option.state === 'incorrect',
      disabledOptions: option.state === 'disabled',
    };
  }

  trackByOption = (_: number, option: OptionVM) => option.Name;
}
