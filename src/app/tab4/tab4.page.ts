import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Pokemon } from 'interfaces';
import { trigger, transition, style, animate } from '@angular/animations';

type CellState = 'empty' | 'ok' | 'bad';

@Component({
  selector: 'app-tab4',
  templateUrl: './tab4.page.html',
  styleUrls: ['./tab4.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [ style({ opacity: 0 }), animate('250ms ease-out', style({ opacity: 1 })) ]),
      transition(':leave', [ animate('200ms ease-in', style({ opacity: 0 })) ])
    ])
  ]
})
export class Tab4Page implements OnInit {
  // Teclado (const → no cambia entre renders)
  readonly firstRowKeyboard = ['Q','W','E','R','T','Y','U','I','O','P'];
  readonly secondRowKeyboard = ['A','S','D','F','G','H','J','K','L'];
  readonly thirdRowKeyboard  = ['DEL','Z','X','C','V','B','N','M','ENTER'];
  readonly numbersRowKeyboard = ["'",'1','2','3','4','5','6','7','8','9','0','-'];

  pokemons: Pokemon[] = [];
  pokemon!: Pokemon;

  pokemonNameSplitted: string[] = [];
  answer: string[] = [];       // contenido por casilla
  feedback: CellState[] = [];  // estado visual por casilla
  currentPositionName = 0;
  highlightedIndex = 0;

  isLoadingImage = true;
  private preloadImg?: HTMLImageElement;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.retrievePokemons();        // ← sólo esto
  }

  // -------- Data --------
  retrievePokemons() {
    this.http.get<Pokemon[]>('assets/pokemon.json').subscribe((list) => {
      this.pokemons = [...list];
      this.selectRandomPokemon();
    });
  }

  private pickRandomPokemon(): Pokemon | undefined {
    if (this.pokemons.length === 0) return undefined;
    const idx = Math.floor(Math.random() * this.pokemons.length);
    const picked = this.pokemons[idx];
    this.pokemons.splice(idx, 1);   // quítalo del pool después de leerlo
    return picked;
  }

  selectRandomPokemon() {
    const p = this.pickRandomPokemon();
    if (!p) return;

    this.pokemon = p;
    this.pokemonNameSplitted = this.pokemon.Name.split('');
    this.answer = Array(this.pokemonNameSplitted.length).fill('');
    this.feedback = Array(this.pokemonNameSplitted.length).fill('empty');
    this.currentPositionName = 0;
    this.highlightedIndex = 0;
    this.isLoadingImage = true;

    // Pre-carga de la siguiente imagen (queda en caché del navegador)
    const next =
      this.pokemons.length > 0
        ? this.pokemons[Math.floor(Math.random() * this.pokemons.length)]
        : null;
    if (next?.Image) {
      this.preloadImg = new Image();
      this.preloadImg.decoding = 'async';
      this.preloadImg.loading = 'lazy';
      this.preloadImg.src = next.Image;
    }
  }

  // -------- Interacciones --------
  changePosition(index: number) {
    this.currentPositionName = index;
    this.highlightedIndex = index;
  }

  selectLetter(letter: string) {
    const i = this.currentPositionName;
    const n = this.pokemonNameSplitted.length;

    if (letter === 'DEL') {
      // Si la casilla actual está vacía, retrocede una
      const target = this.answer[i] ? i : Math.max(i - 1, 0);
      this.answer[target] = '';
      this.feedback[target] = 'empty';
      this.currentPositionName = target;
      this.highlightedIndex = target;
      return;
    }

    if (letter === 'ENTER') {
      this.checkAndAdvance();
      return;
    }

    if (i >= n) return;

    const typed  = letter.toUpperCase();
    const target = this.pokemonNameSplitted[i].toUpperCase();

    this.answer[i]   = typed;
    this.feedback[i] = typed === target ? 'ok' : 'bad';

    // Avanza si acierta; si no, se queda para sobrescribir
    if (this.feedback[i] === 'ok' && i < n - 1) {
      this.currentPositionName = i + 1;
      this.highlightedIndex = i + 1;
    }
  }

  // ENTER: valida y avanza inmediatamente si todo es correcto
  checkAndAdvance() {
    const n = this.pokemonNameSplitted.length;

    // Actualiza feedback por casilla
    let allCorrect = true;
    for (let i = 0; i < n; i++) {
      const cur = (this.answer[i] || '').toUpperCase();
      const tar = (this.pokemonNameSplitted[i] || '').toUpperCase();
      const ok = cur !== '' && cur === tar;
      this.feedback[i] = cur === '' ? 'empty' : (ok ? 'ok' : 'bad');
      if (!ok) allCorrect = false;
    }

    if (allCorrect) {
      // Avanza YA (sin doble pulsación)
      this.selectRandomPokemon();
    } else {
      // Lleva el foco a la primera incorrecta o vacía
      const firstBad = this.answer.findIndex((c, i) => (c || '').toUpperCase() !== (this.pokemonNameSplitted[i] || '').toUpperCase());
      const firstEmpty = this.answer.findIndex((c) => !c);
      const nextIndex = firstBad >= 0 ? firstBad : (firstEmpty >= 0 ? firstEmpty : 0);
      this.currentPositionName = nextIndex;
      this.highlightedIndex = nextIndex;
    }
  }

  // -------- Template helpers --------
  trackByIndex = (i: number) => i;

  onImgLoaded() {
    this.isLoadingImage = false;
  }
}
