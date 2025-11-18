# PixiJS - 2D WebGL Renderer

Fast 2D rendering engine with WebGL and Canvas support.

**POLYGLOT SHOWCASE**: High-performance 2D graphics in ANY language on Elide!

## Quick Start

```typescript
import { Application, Sprite, Graphics, Text } from './elide-pixi.js.ts';

// Create app
const app = new Application({
  width: 800,
  height: 600,
  backgroundColor: 0x1099bb
});

// Add sprite
const bunny = Sprite.from('bunny.png');
bunny.position.set(400, 300);
app.stage.addChild(bunny);

// Animate
app.ticker.add(() => {
  bunny.rotation += 0.01;
});

app.start();
```

## Features

- **WebGL Rendering** - Hardware accelerated
- **Sprite Batching** - Optimized performance
- **Graphics Primitives** - Shapes and paths
- **Text Rendering** - Rich text support
- **Filters** - Visual effects
- **Container Hierarchy** - Scene graph

## Use Cases

- 2D games
- Interactive visualizations
- Data dashboards
- Creative coding projects
- UI frameworks

## Stats

- **300K+ downloads/week** on npm
- Industry standard renderer
- Production-ready
