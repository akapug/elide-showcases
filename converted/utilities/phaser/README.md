# Phaser - HTML5 Game Framework

Fast, free, and fun 2D game framework for making HTML5 games.

**POLYGLOT SHOWCASE**: Build amazing 2D games in ANY language on Elide!

## Quick Start

```typescript
import { Game, Scene } from './elide-phaser.ts';

class MyGame extends Scene {
  create() {
    const player = this.add.sprite(400, 300, 'player');
    const text = this.add.text(10, 10, 'Score: 0', { fontSize: '32px' });
  }

  update() {
    // Game loop logic
  }
}

const game = new Game({
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 300 } }
  }
});

game.addScene(new MyGame('main'));
```

## Features

- **Sprite Management** - Easy sprite handling
- **Physics Engines** - Arcade and Matter physics
- **Input Handling** - Keyboard, mouse, touch
- **Animation System** - Sprite animations
- **Tilemap Support** - Level creation
- **Audio Management** - Sound effects and music
- **Scene Management** - Multiple game states

## Use Cases

- 2D platformers
- Puzzle games
- Arcade games
- Educational games
- Mobile HTML5 games

## Stats

- **150K+ downloads/week** on npm
- Popular game framework
- Production-ready
