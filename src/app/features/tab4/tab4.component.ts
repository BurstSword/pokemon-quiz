import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import type { CellState, Pokemon } from '../../core/models/pokemon.model';
import { PokemonService } from '../../core/services/pokemon.service';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { SkeletonBlockComponent } from '../../shared/components/skeleton-block/skeleton-block.component';
import { pickRandomItemExcluding } from '../../shared/utils/pokemon.utils';

@Component({
  selector: 'app-tab4',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, SkeletonBlockComponent, HelpPanelComponent, ResultBannerComponent],
  templateUrl: './tab4.component.html',
  styleUrl: './tab4.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Tab4Component implements OnInit {
  readonly firstRowKeyboard = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
  readonly secondRowKeyboard = ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'];
  readonly thirdRowKeyboard = ['DEL', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'ENTER'];
  readonly numbersRowKeyboard = ["'", '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-'];

  pokemons: Pokemon[] = [];
  pokemon?: Pokemon;
  pokemonNameSplitted: string[] = [];
  answer: string[] = [];
  feedback: CellState[] = [];
  currentPositionName = 0;
  highlightedIndex = 0;
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

  selectLetter(letter: string): void {
    if (this.roundResolved) {
      return;
    }

    const index = this.findClosestEditableIndex(this.currentPositionName);
    const nameLength = this.pokemonNameSplitted.length;

    if (letter === 'DEL') {
      const targetIndex = this.answer[index]
        ? index
        : this.findPreviousEditableIndex(index - 1);

      if (targetIndex < 0 || !this.isEditableIndex(targetIndex)) {
        return;
      }

      this.answer[targetIndex] = '';
      this.feedback[targetIndex] = 'empty';
      this.currentPositionName = targetIndex;
      this.highlightedIndex = targetIndex;
      return;
    }

    if (letter === 'ENTER') {
      this.checkAndAdvance();
      return;
    }

    if (index >= nameLength) {
      return;
    }

    const typed = letter.toUpperCase();
    const target = this.pokemonNameSplitted[index]?.toUpperCase() ?? '';

    this.answer[index] = typed;
    this.feedback[index] = typed === target ? 'ok' : 'bad';

    if (this.feedback[index] === 'ok' && index < nameLength - 1) {
      const nextIndex = this.findNextEditableIndex(index + 1);
      this.currentPositionName = nextIndex;
      this.highlightedIndex = nextIndex;
    }
  }

  checkAndAdvance(): void {
    const nameLength = this.pokemonNameSplitted.length;
    let allCorrect = true;

    for (let index = 0; index < nameLength; index += 1) {
      if (!this.isEditableIndex(index)) {
        this.feedback[index] = 'ok';
        continue;
      }

      const current = (this.answer[index] || '').toUpperCase();
      const target = (this.pokemonNameSplitted[index] || '').toUpperCase();
      const isCorrect = current !== '' && current === target;

      this.feedback[index] = current === '' ? 'empty' : (isCorrect ? 'ok' : 'bad');
      if (!isCorrect) {
        allCorrect = false;
      }
    }

    if (allCorrect) {
      this.roundResolved = true;
      this.resultStatus = 'correct';
      this.resultTitle = 'Correcto!';
      this.resultMessage = `Has completado el nombre de ${this.pokemon?.Name}.`;
      this.revealedAnswer = '';
      this.cdr.markForCheck();
      return;
    }

    const firstBad = this.answer.findIndex(
      (char, index) => this.isEditableIndex(index)
        && (char || '').toUpperCase() !== (this.pokemonNameSplitted[index] || '').toUpperCase(),
    );
    const firstEmpty = this.answer.findIndex((char, index) => this.isEditableIndex(index) && !char);
    const nextIndex = firstBad >= 0
      ? firstBad
      : (firstEmpty >= 0 ? firstEmpty : this.findFirstEditableIndex());
    this.currentPositionName = nextIndex;
    this.highlightedIndex = nextIndex;
    this.roundResolved = true;
    this.resultStatus = 'incorrect';
    this.resultTitle = 'No era ese';
    this.resultMessage = `Tu respuesta no coincidia con ${this.pokemon?.Name}.`;
    this.revealedAnswer = this.pokemon?.Name ?? '';
    this.cdr.markForCheck();
  }

  get completedEditableCount(): number {
    return this.answer.filter((char, index) => this.isEditableIndex(index) && char !== '').length;
  }

  get editableCharacterCount(): number {
    return this.pokemonNameSplitted.filter((character) => this.isEditableCharacter(character)).length;
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

  private findNextEditableIndex(from: number): number {
    for (let index = from; index < this.pokemonNameSplitted.length; index += 1) {
      if (this.isEditableIndex(index)) {
        return index;
      }
    }

    return this.findFirstEditableIndex();
  }

  private findPreviousEditableIndex(from: number): number {
    for (let index = from; index >= 0; index -= 1) {
      if (this.isEditableIndex(index)) {
        return index;
      }
    }

    return this.findFirstEditableIndex();
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
