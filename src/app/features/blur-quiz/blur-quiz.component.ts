import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import type { OptionViewModel } from '../../core/models/pokemon.model';
import { GameStatsService } from '../../core/services/game-stats.service';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { GameScoreBarComponent } from '../../shared/components/game-score-bar/game-score-bar.component';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { QuizBaseComponent } from '../../shared/quiz/quiz-base';

@Component({
  selector: 'app-blur-quiz',
  standalone: true,
  imports: [CommonModule, NgClass, PageHeaderComponent, HelpPanelComponent, ResultBannerComponent, GameScoreBarComponent],
  templateUrl: './blur-quiz.component.html',
  styleUrl: './blur-quiz.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlurQuizComponent extends QuizBaseComponent {
  protected override readonly modeId = 'blur' as const;

  blurState = 0;
  isRevealed = false;
  helpOpen = false;

  constructor(
    pokemonService: PokemonService,
    pokemonTypeService: PokemonTypeService,
    generationFilterService: GenerationFilterService,
    gameStatsService: GameStatsService,
    cdr: ChangeDetectorRef,
    zone: NgZone,
  ) {
    super(pokemonService, pokemonTypeService, generationFilterService, gameStatsService, cdr, zone);
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

    this.registerHintUse();
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
