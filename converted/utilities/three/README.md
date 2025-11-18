# Three.js - 3D Graphics Library

JavaScript 3D library for WebGL rendering. Industry standard for web 3D graphics.

**POLYGLOT SHOWCASE**: Create stunning 3D graphics in ANY language on Elide!

## Quick Start

```typescript
import { Scene, PerspectiveCamera, Mesh, BoxGeometry, WebGLRenderer } from './elide-three.ts';

// Create scene
const scene = new Scene();

// Create camera
const camera = new PerspectiveCamera(75, 16/9, 0.1, 1000);
camera.position.set(0, 0, 5);

// Create geometry
const geometry = new BoxGeometry(1, 1, 1);
const mesh = new Mesh(geometry);
scene.add(mesh);

// Render
const renderer = new WebGLRenderer({ width: 1920, height: 1080 });
renderer.render(scene, camera);
```

## Features

- **3D Scene Management** - Hierarchical scene graphs
- **Cameras** - Perspective and orthographic projections
- **Geometries** - Boxes, spheres, planes, and more
- **Materials** - Various shading models
- **Transformations** - Position, rotation, scale
- **Vector Math** - Vector3, Matrix4, Quaternions
- **Raycasting** - Object picking and intersection

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const scene = new Scene();
const camera = new PerspectiveCamera(75, 16/9);
```

### Python (via Elide)
```python
from three import Scene, PerspectiveCamera

scene = Scene()
camera = PerspectiveCamera(75, 16/9)
```

### Ruby (via Elide)
```ruby
require 'three'

scene = Three::Scene.new
camera = Three::PerspectiveCamera.new(75, 16.0/9)
```

## Use Cases

- 3D data visualization
- Game development
- CAD applications
- Scientific simulations
- AR/VR experiences

## Stats

- **800K+ downloads/week** on npm
- Industry standard since 2010
- Zero dependencies
- Pure TypeScript implementation
