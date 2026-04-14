import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone } from '@angular/core';
import { PokemonService } from '../services/pokemon.service';
import { PokemonTypeService } from '../services/pokemon-type.service';
import { OptionVM, QuizBaseComponent } from '../shared/quiz-base.component';

@Component({
  selector: 'app-shadow-quiz',
  templateUrl: 'shadow-quiz.page.html',
  styleUrls: ['shadow-quiz.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShadowQuizPage extends QuizBaseComponent {
  visible = false;

  constructor(
    pokemonService: PokemonService,
    pokemonTypeService: PokemonTypeService,
    cdr: ChangeDetectorRef,
    zone: NgZone,
  ) {
    super(pokemonService, pokemonTypeService, cdr, zone);
  }

  protected override onPokemonSelected() {
    this.visible = false;
  }

  protected override getNextDelay() {
    return 800;
  }

  protected override onAnswered(_option: OptionVM) {
    this.visible = true;
    this.pokemonTypes = true;
  }
}
