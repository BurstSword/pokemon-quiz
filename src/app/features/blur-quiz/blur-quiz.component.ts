import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import type { OptionViewModel } from '../../core/models/pokemon.model';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { QuizBaseComponent } from '../../shared/quiz/quiz-base';

@Component({
  selector: 'app-blur-quiz',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, HelpPanelComponent, ResultBannerComponent],
  templateUrl: './blur-quiz.component.html',
  styleUrl: './blur-quiz.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlurQuizComponent extends QuizBaseComponent {
  blurState = 0;
  isRevealed = false;
  helpOpen = false;

  constructor(
    pokemonService: PokemonService,
    pokemonTypeService: PokemonTypeService,
    generationFilterService: GenerationFilterService,
    cdr: ChangeDetectorRef,
    zone: NgZone,
  ) {
    super(pokemonService, pokemonTypeService, generationFilterService, cdr, zone);
  }

  protected override onPokemonSelected(): void {
    this.blurState = 0;
    this.isRevealed = false;
    this.helpOpen = false;
  }

  protected override onAnswered(_option: OptionViewModel): void {
    this.isRevealed = true;
    this.pokemonTypes = true;
    this.helpOpen = false;
  }

  clarifyImage(): void {
    if (this.isRevealed || this.optionsLocked) {
      return;
    }

    this.blurState = (this.blurState + 1) % 5;
    this.cdr.markForCheck();
  }

  toggleHelp(): void {
    this.helpOpen = !this.helpOpen;
  }

  closeHelp(): void {
    this.helpOpen = false;
  }

  useHelpDisableOptions(): void {
    this.disableTwoIncorrectOptions();
    this.helpOpen = false;
  }

  useHelpClarify(): void {
    this.clarifyImage();
    this.helpOpen = false;
  }
}
