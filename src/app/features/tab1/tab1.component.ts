import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { CellState, Pokemon } from '../../core/models/pokemon.model';
import { PokemonService } from '../../core/services/pokemon.service';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { SkeletonBlockComponent } from '../../shared/components/skeleton-block/skeleton-block.component';
import { pickRandomItemExcluding } from '../../shared/utils/pokemon.utils';

type Letter = string;

@Component({
  selector: 'app-tab1',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, SkeletonBlockComponent, HelpPanelComponent, ResultBannerComponent],
  templateUrl: './tab1.component.html',
  styleUrl: './tab1.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab1Component implements OnInit {
  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;

  pokemonNameSplitted: string[] = [];
  answer: string[] = [];
  feedback: CellState[] = [];
  currentPositionName = 0;
  highlightedIndex = 0;
  lettersOptionsArrays: string[][] = [];
  isLoadingImage = true;
  helpOpen = false;
  roundResolved = false;
  resultStatus: 'correct' | 'incorrect' | null = null;
  resultTitle = '';
  resultMessage = '';
  revealedAnswer = '';

  private preloadImg?: HTMLImageElement;

  constructor(
    private readonly pokemonService: PokemonService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.pokemonService.getPokemons().subscribe((pokemons) => {
      this.pokemons = [...pokemons];
      this.selectRandomPokemon();
      this.cdr.markForCheck();
    });
  }

  fillOrCorrectOneLetter(): void {
    const currentPokemon = this.pokemon;
    if (!currentPokemon || this.pokemonNameSplitted.length === 0 || this.roundResolved) {
      return;
    }

    const nameLength = this.pokemonNameSplitted.length;

    for (let index = 0; index < nameLength; index += 1) {
      if (!this.isEditableIndex(index)) {
        continue;
      }

      const target = this.pokemonNameSplitted[index]?.toUpperCase() ?? '';
      const current = (this.answer[index] || '').toUpperCase();

      if (current !== target) {
        this.answer[index] = target;
        this.feedback[index] = 'ok';

        const nextEmpty = this.findNextEmpty(index + 1);
        const nextIndex = nextEmpty ?? this.findFirstEditableIndex();
        this.currentPositionName = nextIndex;
        this.highlightedIndex = nextIndex;
        return;
      }
    }

    this.selectRandomPokemon();
  }

  selectRandomPokemon(): void {
    const pokemon = pickRandomItemExcluding(
      this.pokemons,
      (candidate) => candidate.Name === this.pokemon?.Name,
    );
    if (!pokemon) {
      return;
    }

    this.pokemon = pokemon;
    this.pokemonNameSplitted = pokemon.Name.split('');
    this.answer = this.pokemonNameSplitted.map((character) => this.getInitialCharacterValue(character));
    this.feedback = this.pokemonNameSplitted.map((character) => this.getInitialCellState(character));
    this.currentPositionName = this.findFirstEditableIndex();
    this.highlightedIndex = this.currentPositionName;
    this.isLoadingImage = true;
    this.helpOpen = false;
    this.roundResolved = false;
    this.resultStatus = null;
    this.resultTitle = '';
    this.resultMessage = '';
    this.revealedAnswer = '';

    this.generatePokemonLettersOptions();

    const nextPokemon = pickRandomItemExcluding(this.pokemons, (candidate) => candidate.Name === pokemon.Name);
    if (nextPokemon?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = nextPokemon.Image;
    }

    this.cdr.markForCheck();
  }

  changePosition(index: number): void {
    if (this.roundResolved) {
      return;
    }

    const editableIndex = this.findClosestEditableIndex(index);
    this.currentPositionName = editableIndex;
    this.highlightedIndex = editableIndex;
  }

  generatePokemonLettersOptions(): void {
    const options: Letter[] = [];

    for (const letter of this.pokemonNameSplitted) {
      if (!this.isEditableCharacter(letter)) {
        continue;
      }

      options.push(letter.toUpperCase());
      if (Math.random() > 0.1) {
        options.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
      }
    }

    for (let index = options.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [options[index], options[randomIndex]] = [options[randomIndex], options[index]];
    }

    this.lettersOptionsArrays = this.chunkArray(options);
  }

  fillLetter(letter: string): void {
    if (this.roundResolved) {
      return;
    }

    const index = this.findClosestEditableIndex(this.currentPositionName);
    if (index >= this.pokemonNameSplitted.length) {
      return;
    }

    const target = this.pokemonNameSplitted[index]?.toUpperCase() ?? '';
    const typed = letter.toUpperCase();

    this.answer[index] = typed;
    this.feedback[index] = typed === target ? 'ok' : 'bad';

    if (this.feedback[index] === 'ok') {
      const nextIndex = this.findNextEmpty(index + 1);
      if (nextIndex !== null) {
        this.currentPositionName = nextIndex;
        this.highlightedIndex = nextIndex;
      }
    }
  }

  clearSelected(): void {
    if (this.roundResolved) {
      return;
    }

    const index = this.findClosestEditableIndex(this.currentPositionName);
    if (index < 0 || index >= this.answer.length || !this.isEditableIndex(index)) {
      return;
    }

    this.answer[index] = '';
    this.feedback[index] = 'empty';
  }

  checkIfCorrect(): void {
    const currentPokemon = this.pokemon;
    if (!currentPokemon) {
      return;
    }

    const target = currentPokemon.Name.toUpperCase();
    const guess = this.answer.join('').toUpperCase();

    for (let index = 0; index < this.answer.length; index += 1) {
      if (!this.isEditableIndex(index)) {
        this.feedback[index] = 'ok';
        continue;
      }

      const current = (this.answer[index] || '').toUpperCase();
      const expected = (this.pokemonNameSplitted[index] || '').toUpperCase();
      this.feedback[index] = current === expected ? 'ok' : 'bad';
    }

    const isCorrect = guess === target;
    this.roundResolved = true;
    this.resultStatus = isCorrect ? 'correct' : 'incorrect';
    this.resultTitle = isCorrect ? 'Correcto!' : 'No era ese';
    this.resultMessage = isCorrect
      ? `Has completado el nombre de ${currentPokemon.Name}.`
      : `Tu intento no coincidia con ${currentPokemon.Name}.`;
    this.revealedAnswer = isCorrect ? '' : currentPokemon.Name;
    this.cdr.markForCheck();
  }

  trackByIndex = (index: number): number => index;

  onImgLoaded(): void {
    this.isLoadingImage = false;
    this.cdr.markForCheck();
  }

  nextRound(): void {
    this.selectRandomPokemon();
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  private chunkArray(items: string[]): string[][] {
    const result: string[][] = [];
    let index = 0;

    while (index < items.length) {
      const size = result.length % 2 === 0 ? 5 : 4;
      result.push(items.slice(index, index + size));
      index += size;
    }

    return result;
  }

  private findNextEmpty(from: number): number | null {
    for (let index = from; index < this.answer.length; index += 1) {
      if (this.isEditableIndex(index) && this.answer[index] === '') {
        return index;
      }
    }

    for (let index = 0; index < from; index += 1) {
      if (this.isEditableIndex(index) && this.answer[index] === '') {
        return index;
      }
    }

    return null;
  }

  private isEditableCharacter(character: string): boolean {
    return /^[A-Z0-9]$/i.test(character);
  }

  private isEditableIndex(index: number): boolean {
    return this.isEditableCharacter(this.pokemonNameSplitted[index] ?? '');
  }

  private getInitialCharacterValue(character: string): string {
    return this.isEditableCharacter(character) ? '' : character;
  }

  private getInitialCellState(character: string): CellState {
    return this.isEditableCharacter(character) ? 'empty' : 'ok';
  }

  private findFirstEditableIndex(): number {
    for (let index = 0; index < this.pokemonNameSplitted.length; index += 1) {
      if (this.isEditableIndex(index)) {
        return index;
      }
    }

    return 0;
  }

  private findClosestEditableIndex(index: number): number {
    if (this.isEditableIndex(index)) {
      return index;
    }

    for (let offset = 1; offset < this.pokemonNameSplitted.length; offset += 1) {
      const nextIndex = index + offset;
      if (nextIndex < this.pokemonNameSplitted.length && this.isEditableIndex(nextIndex)) {
        return nextIndex;
      }

      const previousIndex = index - offset;
      if (previousIndex >= 0 && this.isEditableIndex(previousIndex)) {
        return previousIndex;
      }
    }

    return 0;
  }
}
