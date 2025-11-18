# Matter.js - 2D Physics Engine

2D rigid body physics engine for the web with realistic physics simulation.

**POLYGLOT SHOWCASE**: Realistic physics in ANY language on Elide!

## Quick Start

```typescript
import { Engine, World, Body, Vector } from './elide-matter-js.ts';

// Create engine
const engine = Engine.create({
  gravity: Vector.create(0, 9.8)
});

// Create bodies
const ground = Body.rectangle(400, 600, 810, 60, { isStatic: true });
const box = Body.rectangle(400, 200, 80, 80);
const ball = Body.circle(300, 100, 40);

// Add to world
World.add(engine.world, [ground, box, ball]);

// Update physics
Engine.update(engine, 16.666);
```

## Features

- **Rigid Body Dynamics** - Accurate physics simulation
- **Collision Detection** - Efficient collision handling
- **Constraints** - Springs, ropes, and more
- **Composite Bodies** - Complex shapes
- **Events** - Collision callbacks
- **Sleeping** - Performance optimization

## Use Cases

- Physics-based games
- Interactive simulations
- Educational demos
- Data visualization
- Engineering tools

## Stats

- **200K+ downloads/week** on npm
- Production-ready
- Well-optimized
