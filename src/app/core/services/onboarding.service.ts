import { Injectable } from '@angular/core';
import type { GameHelpContent, GameModeId } from '../models/game-stats.model';

const STORAGE_KEY = 'pokequiz.onboarding.v1';

type OnboardingState = Record<GameModeId, boolean>;

const HELP_CONTENT: Record<GameModeId, GameHelpContent> = {
  shadow: {
    intro: 'Adivina la silueta. Puedes pedir una pista si te atascas.',
    howTo: 'Reconoce la silueta y elige una sola respuesta por ronda.',
    hintSummary: 'Puedes mostrar tipos o quitar dos opciones incorrectas.',
    hintPenalty: 'Usar pistas puede ayudarte a mantener la ronda, pero no mejora tu registro.',
  },
  blur: {
    intro: 'La imagen se ira aclarando. Responde antes de que sea evidente.',
    howTo: 'Observa la imagen borrosa y elige el Pokemon correcto antes de revelar demasiado.',
    hintSummary: 'Puedes reducir el blur o quitar dos opciones.',
    hintPenalty: 'Usar pistas reduce la dificultad de la ronda.',
  },
  colors: {
    intro: 'Elige el Pokemon que encaja con la paleta mostrada.',
    howTo: 'Lee los colores dominantes y decide que Pokemon se esconde detras.',
    hintSummary: 'Puedes activar los tipos como pista de ronda.',
    hintPenalty: 'Usar pistas facilita la ronda, pero no cambia el objetivo.',
  },
  clues: {
    intro: 'Empieza con una pista. Pide mas solo si lo necesitas.',
    howTo: 'Lee las pistas y responde en cuanto creas saberlo.',
    hintSummary: 'Cada pista extra te da mas contexto para resolver la misma ronda.',
    hintPenalty: 'Cuantas mas pistas uses, mas informacion consumiras en esa ronda.',
  },
  connections: {
    intro: 'Selecciona 4 Pokemon con algo en comun.',
    howTo: 'Encuentra 4 grupos de 4 Pokemon relacionados por categoria.',
    hintSummary: 'La ayuda solo recuerda ejemplos de categorias posibles.',
    hintPenalty: 'Usar la ayuda de ronda cuenta como pista usada.',
  },
};

@Injectable({ providedIn: 'root' })
export class OnboardingService {
  shouldShow(mode: GameModeId): boolean {
    return !this.readState()[mode];
  }

  markSeen(mode: GameModeId): void {
    const next = {
      ...this.readState(),
      [mode]: true,
    };
    this.persist(next);
  }

  reset(): void {
    this.persist(this.createDefaultState());
  }

  getHelpText(mode: GameModeId): GameHelpContent {
    return HELP_CONTENT[mode];
  }

  private readState(): OnboardingState {
    if (typeof localStorage === 'undefined') {
      return this.createDefaultState();
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return this.createDefaultState();
      }

      const parsed = JSON.parse(raw) as Partial<OnboardingState>;
      return {
        shadow: Boolean(parsed.shadow),
        blur: Boolean(parsed.blur),
        colors: Boolean(parsed.colors),
        clues: Boolean(parsed.clues),
        connections: Boolean(parsed.connections),
      };
    } catch {
      return this.createDefaultState();
    }
  }

  private persist(state: OnboardingState): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage errors and keep runtime state.
    }
  }

  private createDefaultState(): OnboardingState {
    return {
      shadow: false,
      blur: false,
      colors: false,
      clues: false,
      connections: false,
    };
  }
}
