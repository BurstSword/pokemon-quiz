import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GenerationFilterService } from './core/services/generation-filter.service';
import { PokemonService } from './core/services/pokemon.service';
import { ToastOutletComponent } from './shared/components/toast-outlet/toast-outlet.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastOutletComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  constructor(
    private readonly pokemonService: PokemonService,
    private readonly generationFilterService: GenerationFilterService,
  ) {}

  ngOnInit(): void {
    this.pokemonService.getEnrichedPokemonList().subscribe((pokemons) => {
      this.generationFilterService.initializeFromPokemonList(pokemons);
    });
  }
}
