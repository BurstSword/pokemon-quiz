import { ChangeDetectorRef, Directive, NgZone, OnInit } from '@angular/core';
import { combineLatest } from 'rxjs';
import type { GameModeId, StatsFeedback } from '../../core/models/game-stats.model';
import type { OptionViewModel, Pokemon } from '../../core/models/pokemon.model';
import { GameStatsService } from '../../core/services/game-stats.service';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { buildUniqueOptions, pickRandomItem, uniqueBy } from '../utils/pokemon.utils';

@Directive()
export abstract class QuizBaseComponent implements OnInit {
  protected abstract readonly modeId: GameModeId;

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
  resultSummaryText = '';
  resultStreakText = '';
  resultRecordText = '';

  private roundStartedAt = 0;
  private roundHintsUsed = 0;
  private roundRecorded = false;

  constructor(
    protected pokemonService: PokemonService,
    protected pokemonTypeService: PokemonTypeService,
    protected generationFilterService: GenerationFilterService,
    protected gameStatsService: GameStatsService,
    protected cdr: ChangeDetectorRef,
    protected zone: NgZone,
  ) {}

  ngOnInit(): void {
    const pokemons$ = this.pokemonService.getEnrichedPokemonList();
    combineLatest([pokemons$, this.generationFilterService.activeGenerations$]).subscribe(([pokemons]) => {
      this.allPokemons = [...pokemons];
      this.generationFilterService.initializeFromPokemonList(this.allPokemons);
      this.pokemons = uniqueBy(
        this.generationFilterService.getActivePokemonPool(this.allPokemons),
        (pokemon) => pokemon.Number,
      );

      if (this.pokemons.length < this.minRequiredPokemon) {
        this.resetRoundState();
        this.pokemon = undefined;
        this.options = [];
        this.optionsLocked = true;
        this.poolErrorMessage = 'Activa mas generaciones para jugar este modo.';
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
    this.optionsLocked = false;
    this.resetRoundState();

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

    const optionPool = buildUniqueOptions(
      currentPokemon,
      this.pokemons,
      (candidate) => candidate.Number,
      4,
    );

    if (optionPool.length !== 4) {
      this.options = [];
      this.optionsLocked = true;
      this.poolErrorMessage = 'Activa mas generaciones para jugar este modo.';
      this.onPoolUnavailable();
      return;
    }

    this.poolErrorMessage = '';
    this.options = optionPool.map((pokemon) => ({
      Name: pokemon.Name,
      Label: this.getPokemonLabelByNumber(pokemon.Number) || this.getPokemonLabel(pokemon),
      Number: pokemon.Number,
      Correct: pokemon.Number === currentPokemon.Number,
      state: 'normal',
    }));
  }

  resolveOption(option: OptionViewModel): void {
    if (this.optionsLocked || option.state === 'disabled' || !this.pokemon) {
      return;
    }

    this.optionsLocked = true;
    this.onAnswered(option);
    this.resultStatus = option.Correct ? 'correct' : 'incorrect';
    this.resultTitle = option.Correct ? 'Correcto!' : 'No era ese';
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

    this.finalizeRound(option);
    this.cdr.markForCheck();
  }

  nextRound(): void {
    this.selectRandomPokemon();
  }

  disableTwoIncorrectOptions(): void {
    if (this.optionsLocked) {
      return;
    }

    this.registerHintUse();
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
    this.registerHintUse();
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

  trackByOption = (index: number, option: OptionViewModel): string =>
    `${option.Number ?? option.Name}-${index}`;

  getOptionLabel(option: OptionViewModel): string {
    return this.getPokemonLabelByNumber(option.Number) || option.Label || option.Name;
  }

  protected getPokemonLabel(pokemon: Pokemon): string {
    return pokemon.SpanishName || pokemon.DisplayName || pokemon.Name;
  }

  protected getPokemonByNumber(number: number | undefined): Pokemon | undefined {
    if (typeof number !== 'number') {
      return undefined;
    }

    return this.allPokemons.find((pokemon) => pokemon.Number === number)
      || this.pokemons.find((pokemon) => pokemon.Number === number);
  }

  protected getPokemonLabelByNumber(number: number | undefined): string {
    const pokemon = this.getPokemonByNumber(number);
    return pokemon ? this.getPokemonLabel(pokemon) : '';
  }

  protected getCorrectMessage(pokemon: Pokemon): string {
    return `Has acertado. Era ${this.getPokemonLabel(pokemon)}.`;
  }

  protected getIncorrectMessage(pokemon: Pokemon): string {
    return `La respuesta correcta era ${this.getPokemonLabel(pokemon)}.`;
  }

  protected registerHintUse(): void {
    this.roundHintsUsed += 1;
  }

  protected applyStatsFeedback(feedback: StatsFeedback): void {
    const modeStats = feedback.modeStats;

    if (feedback.lastResult === 'correct' || feedback.lastResult === 'win') {
      this.resultSummaryText = `Aciertos ${modeStats.correct}`;
      this.resultStreakText = feedback.currentModeStreak > 0 ? `Racha ${feedback.currentModeStreak}` : '';
      this.resultRecordText = feedback.isNewBestStreak ? 'Nuevo record de racha' : '';
      return;
    }

    this.resultSummaryText = `Fallos ${modeStats.wrong}`;
    this.resultStreakText = feedback.lostStreak ? 'Racha perdida' : '';
    this.resultRecordText = '';
  }

  protected abstract onAnswered(option: OptionViewModel): void;

  private finalizeRound(option: OptionViewModel): void {
    if (this.roundRecorded || !this.pokemon) {
      return;
    }

    this.roundRecorded = true;
    const feedback = this.gameStatsService.recordGameResult({
      mode: this.modeId,
      won: option.Correct,
      correct: option.Correct ? 1 : 0,
      wrong: option.Correct ? 0 : 1,
      hintsUsed: this.roundHintsUsed,
      durationMs: this.roundStartedAt > 0 ? Date.now() - this.roundStartedAt : undefined,
      perfectRound: option.Correct && this.roundHintsUsed === 0,
    });

    if (!option.Correct && feedback.lostStreak) {
      this.resultMessage = `${this.resultMessage} Racha reiniciada.`;
    }

    this.applyStatsFeedback(feedback);
  }

  private resetRoundState(): void {
    this.pokemonTypes = false;
    this.resultStatus = null;
    this.resultTitle = '';
    this.resultMessage = '';
    this.revealedAnswer = '';
    this.resultSummaryText = '';
    this.resultStreakText = '';
    this.resultRecordText = '';
    this.roundStartedAt = Date.now();
    this.roundHintsUsed = 0;
    this.roundRecorded = false;
  }
}
