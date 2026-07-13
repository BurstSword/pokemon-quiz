import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import type { GameHelpContent } from '../../core/models/game-stats.model';
import type { OptionViewModel } from '../../core/models/pokemon.model';
import { GameStatsService } from '../../core/services/game-stats.service';
import { GenerationFilterService } from '../../core/services/generation-filter.service';
import { OnboardingService } from '../../core/services/onboarding.service';
import { PokemonService } from '../../core/services/pokemon.service';
import { PokemonTypeService } from '../../core/services/pokemon-type.service';
import { GameScoreBarComponent } from '../../shared/components/game-score-bar/game-score-bar.component';
import { HelpPanelComponent } from '../../shared/components/help-panel/help-panel.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { ResultBannerComponent } from '../../shared/components/result-banner/result-banner.component';
import { SkeletonBlockComponent } from '../../shared/components/skeleton-block/skeleton-block.component';
import { QuizBaseComponent } from '../../shared/quiz/quiz-base';

@Component({
  selector: 'app-shadow-quiz',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    PageHeaderComponent,
    HelpPanelComponent,
    ResultBannerComponent,
    SkeletonBlockComponent,
    GameScoreBarComponent,
  ],
  templateUrl: './shadow-quiz.component.html',
  styleUrl: './shadow-quiz.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowQuizComponent extends QuizBaseComponent {
  protected override readonly modeId = 'shadow' as const;

  readonly loadingOptionSlots = [0, 1, 2, 3];
  readonly helpContent: GameHelpContent;
  visible = false;
  helpOpen = false;
  imageLoading = true;
  imageError = false;
  roundReady = false;
  displayImageSrc = '';
  onboardingPending = false;

  private imageLoadToken = 0;

  constructor(
    pokemonService: PokemonService,
    pokemonTypeService: PokemonTypeService,
    generationFilterService: GenerationFilterService,
    gameStatsService: GameStatsService,
    private readonly onboardingService: OnboardingService,
    cdr: ChangeDetectorRef,
    zone: NgZone,
  ) {
    super(pokemonService, pokemonTypeService, generationFilterService, gameStatsService, cdr, zone);
    this.helpContent = this.onboardingService.getHelpText(this.modeId);
  }

  protected override onPokemonSelected(): void {
    this.visible = false;
    this.helpOpen = false;
    this.displayImageSrc = '';
    this.imageLoading = true;
    this.imageError = false;
    this.roundReady = false;
    this.prepareRoundImage();

    if (this.onboardingService.shouldShow(this.modeId)) {
      this.helpOpen = true;
      this.onboardingPending = true;
    }
  }

  protected override onAnswered(_option: OptionViewModel): void {
    this.visible = true;
    this.pokemonTypes = true;
    this.helpOpen = false;
  }

  protected override onPoolUnavailable(): void {
    this.visible = false;
    this.helpOpen = false;
    this.displayImageSrc = '';
    this.imageLoading = false;
    this.imageError = false;
    this.roundReady = false;
  }

  getCurrentPokemonLabel(): string {
    if (!this.pokemon) {
      return 'Pokemon oculto';
    }

    return this.getPokemonLabel(this.pokemon);
  }

  trackByIndex = (index: number): number => index;

  openHelp(): void {
    this.helpOpen = true;
  }

  closeHelp(): void {
    this.helpOpen = false;
    if (this.onboardingPending) {
      this.onboardingService.markSeen(this.modeId);
      this.onboardingPending = false;
    }
  }

  acknowledgeHelp(): void {
    this.closeHelp();
  }

  useHelpDisableOptions(): void {
    if (!this.roundReady) {
      return;
    }

    this.disableTwoIncorrectOptions();
    this.helpOpen = false;
  }

  useHelpToggleTypes(): void {
    if (!this.roundReady) {
      return;
    }

    this.togglePokemonTypes();
    this.helpOpen = false;
  }

  private prepareRoundImage(): void {
    const pokemon = this.pokemon;
    const token = ++this.imageLoadToken;

    if (!pokemon) {
      this.displayImageSrc = '';
      this.imageLoading = false;
      this.imageError = true;
      this.roundReady = true;
      return;
    }

    const candidates = this.getImageCandidates(pokemon).filter(Boolean);
    if (candidates.length === 0) {
      this.imageLoading = false;
      this.imageError = true;
      this.roundReady = true;
      this.cdr.markForCheck();
      return;
    }

    this.tryLoadCandidate(candidates, 0, token);
  }

  private tryLoadCandidate(candidates: string[], index: number, token: number): void {
    if (token !== this.imageLoadToken) {
      return;
    }

    const candidate = candidates[index];
    if (!candidate) {
      this.zone.run(() => {
        if (token !== this.imageLoadToken) {
          return;
        }

        this.displayImageSrc = '';
        this.imageLoading = false;
        this.imageError = true;
        this.roundReady = true;
        this.cdr.markForCheck();
      });
      return;
    }

    const image = new Image();
    image.decoding = 'async';
    image.loading = 'eager';
    image.onload = () => {
      this.zone.run(() => {
        if (token !== this.imageLoadToken) {
          return;
        }

        this.displayImageSrc = candidate;
        this.imageLoading = false;
        this.imageError = false;
        this.roundReady = true;
        this.cdr.markForCheck();
      });
    };
    image.onerror = () => {
      this.tryLoadCandidate(candidates, index + 1, token);
    };
    image.src = candidate;
  }

  private getImageCandidates(pokemon: NonNullable<ShadowQuizComponent['pokemon']>): string[] {
    return [
      pokemon.OfficialArtwork,
      pokemon.Image,
      pokemon.SerebiiImage,
      pokemon.FrontDefault,
      pokemon.Sprite,
    ].filter((value): value is string => Boolean(value));
  }
}
