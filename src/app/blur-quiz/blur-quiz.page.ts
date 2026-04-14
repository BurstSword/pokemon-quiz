import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { PokemonService } from '../services/pokemon.service';
import { PokemonTypeService } from '../services/pokemon-type.service';
import { OptionVM, QuizBaseComponent } from '../shared/quiz-base.component';

@Component({
  selector: 'app-blur-quiz',
  templateUrl: 'blur-quiz.page.html',
  styleUrls: ['blur-quiz.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlurQuizPage extends QuizBaseComponent {
  blurState = 0;
  isRevealed = false;

  constructor(
    pokemonService: PokemonService,
    pokemonTypeService: PokemonTypeService,
    cdr: ChangeDetectorRef,
    zone: NgZone,
  ) {
    super(pokemonService, pokemonTypeService, cdr, zone);
  }

  protected override onPokemonSelected() {
    this.blurState = 0;
    this.isRevealed = false;
  }

  protected override getNextDelay() {
    return 2000;
  }

  protected override onAnswered(_option: OptionVM) {
    this.isRevealed = true;
    this.pokemonTypes = true;
  }

  clarifyImage() {
    if (this.isRevealed) return;
    this.blurState = (this.blurState + 1) % 5;
    this.cdr.markForCheck();
  }
}
