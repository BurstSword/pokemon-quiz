import { ChangeDetectorRef, Directive, NgZone, OnInit } from '@angular/core';
import type { OptionViewModel, Pokemon } from '../../core/models/pokemon.model';
import { combineLatest } from 'rxjs';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { pickRandomItem, sampleUnique, shuffleArray } from '../utils/pokemon.utils';

@Directive()
export abstract class QuizBaseComponent implements OnInit {
  allPokemons: Pokemon[] = [];
  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;
  options: OptionViewModel[] = [];
  pokemonTypes = false;
  optionsLocked = false;
  resultStatus: 'correct' | 'incorrect' | null = null;
  resultTitle = '';
  resultMessage = '';
  revealedAnswer = '';
  poolErrorMessage = '';
  minRequiredPokemon = 4;

  constructor(
    protected pokemonService: PokemonService,
    protected pokemonTypeService: PokemonTypeService,
    protected generationFilterService: GenerationFilterService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
  ) {}

  ngOnInit(): void {
    const pokemons$ = this.pokemonService.getEnrichedPokemonList();
    combineLatest([pokemons$, this.generationFilterService.activeGenerations$]).subscribe(([pokemons]) => {
      this.allPokemons = [...pokemons];
      this.generationFilterService.initializeFromPokemonList(this.allPokemons);
      this.pokemons = this.generationFilterService.getActivePokemonPool(this.allPokemons);

      if (this.pokemons.length < this.minRequiredPokemon) {
        this.pokemon = undefined;
        this.options = [];
        this.pokemonTypes = false;
        this.optionsLocked = true;
        this.resultStatus = null;
        this.resultTitle = '';
        this.resultMessage = '';
        this.revealedAnswer = '';
        this.poolErrorMessage = 'Activa más generaciones para jugar este modo.';
        this.onPoolUnavailable();
        this.cdr.markForCheck();
        return;
      }

      this.poolErrorMessage = '';
      this.optionsLocked = false;
      this.selectRandomPokemon();
      this.cdr.markForCheck();
    });
  }

  protected selectRandomPokemon(): void {
    const currentNumber = this.pokemon?.Number;
    const available = currentNumber
      ? this.pokemons.filter((pokemon) => pokemon.Number !== currentNumber)
      : this.pokemons;

    const picked = pickRandomItem(available);
    if (!picked) {
      return;
    }

    this.pokemon = { ...picked };
    this.pokemonTypes = false;
    this.optionsLocked = false;
    this.resultStatus = null;
    this.resultTitle = '';
    this.resultMessage = '';
    this.revealedAnswer = '';

    this.onPokemonSelected();
    this.generateOptions();
    this.cdr.markForCheck();
  }

  protected onPokemonSelected(): void {}
  protected onPoolUnavailable(): void {}

  protected generateOptions(): void {
    const currentPokemon = this.pokemon;
    if (!currentPokemon) {
      this.options = [];
      return;
    }

    const correct: OptionViewModel = {
      Name: currentPokemon.Name,
      Label: this.getPokemonLabel(currentPokemon),
      Number: currentPokemon.Number,
      Correct: true,
      state: 'normal',
    };
    const wrongs = sampleUnique(
      this.pokemons,
      3,
      (candidate) => candidate.Number === currentPokemon.Number,
    );
    const wrongOptions: OptionViewModel[] = wrongs.map((pokemon) => ({
      Name: pokemon.Name,
      Label: this.getPokemonLabel(pokemon),
      Number: pokemon.Number,
      Correct: false,
      state: 'normal',
    }));

    this.options = shuffleArray([correct, ...wrongOptions]);
  }

  resolveOption(option: OptionViewModel): void {
    if (this.optionsLocked || option.state === 'disabled' || !this.pokemon) {
      return;
    }

    this.optionsLocked = true;
    this.onAnswered(option);
    this.resultStatus = option.Correct ? 'correct' : 'incorrect';
    this.resultTitle = option.Correct ? '¡Correcto!' : 'No era ese';
    this.resultMessage = option.Correct
      ? this.getCorrectMessage(this.pokemon)
      : this.getIncorrectMessage(this.pokemon);
    this.revealedAnswer = option.Correct ? '' : this.getPokemonLabel(this.pokemon);

    this.options = this.options.map((item) => {
      if (item === option) {
        return { ...item, state: item.Correct ? 'correct' : 'incorrect' };
      }

      if (item.Correct) {
        return { ...item, state: 'correct' };
      }

      return item;
    });

    this.cdr.markForCheck();
  }

  nextRound(): void {
    this.selectRandomPokemon();
  }

  disableTwoIncorrectOptions(): void {
    if (this.optionsLocked) {
      return;
    }

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

  togglePokemonTypes(): void {
    this.pokemonTypes = !this.pokemonTypes;
    this.cdr.markForCheck();
  }

  getImageUrl(type: string): string {
    return this.pokemonTypeService.getTypeImage(type);
  }

  getOptionClass(option: OptionViewModel): Record<string, boolean> {
    return {
      normalOption: option.state === 'normal',
      correctOption: option.state === 'correct',
      incorrectOption: option.state === 'incorrect',
      disabledOptions: option.state === 'disabled',
    };
  }

  trackByOption = (_: number, option: OptionViewModel): number | string => option.Number ?? option.Name;

  protected getPokemonLabel(pokemon: Pokemon): string {
    return pokemon.SpanishName || pokemon.DisplayName || pokemon.Name;
  }

  protected getCorrectMessage(pokemon: Pokemon): string {
    return `Has acertado. Era ${this.getPokemonLabel(pokemon)}.`;
  }

  protected getIncorrectMessage(pokemon: Pokemon): string {
    return `La respuesta correcta era ${this.getPokemonLabel(pokemon)}.`;
  }

  protected abstract onAnswered(option: OptionViewModel): void;
}
