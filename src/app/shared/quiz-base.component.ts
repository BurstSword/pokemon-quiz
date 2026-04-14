import { ChangeDetectorRef, Directive, NgZone, OnInit } from '@angular/core';
import type { Pokemon } from 'interfaces';
import { PokemonService } from '../services/pokemon.service';
import { PokemonTypeService } from '../services/pokemon-type.service';
import { pickRandomItem, sampleUnique, shuffleArray } from './pokemon-utils';

export type OptionState = 'normal' | 'correct' | 'incorrect' | 'disabled';
export type OptionVM = { Name: string; Correct: boolean; state: OptionState };

@Directive()
export abstract class QuizBaseComponent implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon!: Pokemon;
  options: OptionVM[] = [];
  pokemonTypes = false;
  optionsLocked = false;

  constructor(
    protected pokemonService: PokemonService,
    protected pokemonTypeService: PokemonTypeService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
  ) {}

  ngOnInit(): void {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.selectRandomPokemon();
      this.cdr.markForCheck();
    });
  }

  protected selectRandomPokemon() {
    const currentName = this.pokemon?.Name;
    const available = currentName
      ? this.pokemons.filter((p) => p.Name !== currentName)
      : this.pokemons;

    const picked = pickRandomItem(available);
    if (!picked) return;

    this.pokemon = { ...picked };
    this.pokemonTypes = false;
    this.optionsLocked = false;

    this.onPokemonSelected();
    this.generateOptions();
    this.cdr.markForCheck();
  }

  protected onPokemonSelected(): void {}

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
    this.onAnswered(option);

    this.options = this.options.map((item) => {
      if (item === option) return { ...item, state: item.Correct ? 'correct' : 'incorrect' };
      if (item.Correct) return { ...item, state: 'correct' };
      return item;
    });

    this.cdr.markForCheck();

    setTimeout(() => {
      this.zone.run(() => {
        this.selectRandomPokemon();
        this.cdr.markForCheck();
      });
    }, this.getNextDelay());
  }

  protected abstract getNextDelay(): number;
  protected abstract onAnswered(option: OptionVM): void;

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

    this.cdr.markForCheck();
  }

  togglePokemonTypes() {
    this.pokemonTypes = !this.pokemonTypes;
    this.cdr.markForCheck();
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
