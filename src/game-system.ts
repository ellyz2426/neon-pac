// === Neon Pac VR -- Game System (ECS, expanded) ===

import { createSystem } from '@iwsdk/core';
import { GameManager } from './game';
import { Direction, GameState } from './types';

interface RuntimeInput {
  keyboard?: {
    getKeyDown(key: string): boolean;
    getKeyPressed(key: string): boolean;
  };
  gamepads: Record<
    'left' | 'right',
    | {
        getButtonDown(id: string): boolean;
        getAxesValues(id: string): { x: number; y: number } | undefined;
      }
    | undefined
  >;
}

export class GameSystem extends createSystem({}) {
  private game!: GameManager;

  setRefs(refs: { game: GameManager }): void {
    this.game = refs.game;
  }

  update(delta: number, _time: number): void {
    if (!this.game) return;
    this.processInput();
    this.game.update(delta);
  }

  private processInput(): void {
    const inputMgr = this.input as unknown as RuntimeInput;
    const kb = inputMgr.keyboard;

    if (kb) {
      if (this.game.state === GameState.PLAYING) {
        if (kb.getKeyDown('ArrowUp') || kb.getKeyDown('KeyW')) {
          this.game.setInput(Direction.UP);
        } else if (kb.getKeyDown('ArrowDown') || kb.getKeyDown('KeyS')) {
          this.game.setInput(Direction.DOWN);
        } else if (kb.getKeyDown('ArrowLeft') || kb.getKeyDown('KeyA')) {
          this.game.setInput(Direction.LEFT);
        } else if (kb.getKeyDown('ArrowRight') || kb.getKeyDown('KeyD')) {
          this.game.setInput(Direction.RIGHT);
        }

        if (kb.getKeyPressed('ArrowUp') || kb.getKeyPressed('KeyW')) {
          this.game.setInput(Direction.UP);
        } else if (kb.getKeyPressed('ArrowDown') || kb.getKeyPressed('KeyS')) {
          this.game.setInput(Direction.DOWN);
        } else if (kb.getKeyPressed('ArrowLeft') || kb.getKeyPressed('KeyA')) {
          this.game.setInput(Direction.LEFT);
        } else if (kb.getKeyPressed('ArrowRight') || kb.getKeyPressed('KeyD')) {
          this.game.setInput(Direction.RIGHT);
        }

        if (kb.getKeyDown('Escape') || kb.getKeyDown('KeyP')) {
          this.game.togglePause();
        }
      } else if (this.game.state === GameState.PAUSED) {
        if (kb.getKeyDown('Escape') || kb.getKeyDown('KeyP')) {
          this.game.togglePause();
        }
      } else if (this.game.state === GameState.MENU) {
        if (kb.getKeyDown('Space') || kb.getKeyDown('Enter')) {
          this.game.startGame();
        }
        if (kb.getKeyDown('KeyM')) {
          this.game.goToModeSelect();
        }
      } else if (this.game.state === GameState.MODE_SELECT) {
        if (kb.getKeyDown('Escape')) {
          this.game.returnToMenu();
        }
      } else if (this.game.state === GameState.GAME_OVER) {
        if (kb.getKeyDown('Space') || kb.getKeyDown('Enter')) {
          this.game.returnToMenu();
        }
      }
    }

    // XR controller input
    const right = inputMgr.gamepads.right;
    const left = inputMgr.gamepads.left;

    if (right) {
      const stick = right.getAxesValues('xr-standard-thumbstick');
      if (stick && this.game.state === GameState.PLAYING) {
        const deadzone = 0.4;
        if (Math.abs(stick.x) > Math.abs(stick.y)) {
          if (stick.x > deadzone) this.game.setInput(Direction.RIGHT);
          else if (stick.x < -deadzone) this.game.setInput(Direction.LEFT);
        } else {
          if (stick.y > deadzone) this.game.setInput(Direction.DOWN);
          else if (stick.y < -deadzone) this.game.setInput(Direction.UP);
        }
      }

      if (right.getButtonDown('a-button')) {
        if (this.game.state === GameState.MENU) this.game.startGame();
        else if (this.game.state === GameState.GAME_OVER) this.game.returnToMenu();
      }

      if (right.getButtonDown('b-button')) {
        if (this.game.state === GameState.PLAYING || this.game.state === GameState.PAUSED) {
          this.game.togglePause();
        }
        if (this.game.state === GameState.MODE_SELECT) {
          this.game.returnToMenu();
        }
      }
    }

    if (left) {
      const stick = left.getAxesValues('xr-standard-thumbstick');
      if (stick && this.game.state === GameState.PLAYING) {
        const deadzone = 0.4;
        if (Math.abs(stick.x) > Math.abs(stick.y)) {
          if (stick.x > deadzone) this.game.setInput(Direction.RIGHT);
          else if (stick.x < -deadzone) this.game.setInput(Direction.LEFT);
        } else {
          if (stick.y > deadzone) this.game.setInput(Direction.DOWN);
          else if (stick.y < -deadzone) this.game.setInput(Direction.UP);
        }
      }
    }
  }
}
