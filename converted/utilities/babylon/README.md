# Babylon.js - Powerful 3D Game Engine

Complete 3D engine for games and real-time rendering with advanced features.

**POLYGLOT SHOWCASE**: Build stunning 3D games in ANY language on Elide!

## Quick Start

```typescript
import { Engine, Scene, ArcRotateCamera, HemisphericLight, Mesh, Vector3 } from './elide-babylon.ts';

// Create engine and scene
const engine = new Engine();
const scene = new Scene(engine);

// Add camera
const camera = new ArcRotateCamera("camera", 0, Math.PI / 3, 10, Vector3.Zero());
scene.activeCamera = camera;

// Add light
const light = new HemisphericLight("light", new Vector3(0, 1, 0));

// Create meshes
const sphere = scene.createSphere("sphere", { diameter: 2 });
const ground = Mesh.CreateGround("ground", { width: 10, height: 10 });

// Start render loop
engine.runRenderLoop(() => {
  scene.render();
});
```

## Features

- **Complete 3D Engine** - Everything for game development
- **Physics Integration** - Realistic physics simulation
- **Advanced Materials** - PBR, custom shaders
- **Animation System** - Skeletal and morph animations
- **Particle Systems** - Effects and particles
- **Collision Detection** - Precise collision handling
- **Post-Processing** - Visual effects pipeline

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const scene = new Scene(engine);
const box = scene.createBox("box1", { size: 2 });
```

### Python (via Elide)
```python
from babylon import Scene, Mesh

scene = Scene(engine)
box = scene.create_box("box1", {"size": 2})
```

## Use Cases

- 3D games and simulations
- Product configurators
- Training applications
- Virtual tours
- Interactive experiences

## Stats

- **100K+ downloads/week** on npm
- Full-featured game engine
- Production-ready
