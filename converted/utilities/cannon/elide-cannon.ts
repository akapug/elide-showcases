/**
 * Cannon.js - 3D Physics Engine
 *
 * Lightweight 3D physics engine.
 * **POLYGLOT SHOWCASE**: 3D physics in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/cannon (~50K+ downloads/week)
 */

export class Vec3 {
  constructor(public x = 0, public y = 0, public z = 0) {}
  
  add(v: Vec3): Vec3 {
    return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z);
  }
}

export class Body {
  position: Vec3;
  velocity: Vec3;
  mass: number;
  
  constructor(options: { mass?: number; position?: Vec3 } = {}) {
    this.position = options.position || new Vec3();
    this.velocity = new Vec3();
    this.mass = options.mass || 1;
  }
}

export class World {
  bodies: Body[] = [];
  gravity: Vec3;
  
  constructor() {
    this.gravity = new Vec3(0, -9.82, 0);
  }
  
  addBody(body: Body): void {
    this.bodies.push(body);
  }
  
  step(dt: number): void {
    for (const body of this.bodies) {
      const force = new Vec3(
        this.gravity.x * body.mass,
        this.gravity.y * body.mass,
        this.gravity.z * body.mass
      );
      body.velocity = body.velocity.add(new Vec3(force.x * dt, force.y * dt, force.z * dt));
      body.position = body.position.add(new Vec3(
        body.velocity.x * dt,
        body.velocity.y * dt,
        body.velocity.z * dt
      ));
    }
  }
}

export default { Vec3, Body, World };

if (import.meta.url.includes("elide-cannon.ts")) {
  console.log("⚛️ Cannon.js - 3D Physics for Elide (POLYGLOT!)\n");
  
  const world = new World();
  const body = new Body({ mass: 5, position: new Vec3(0, 10, 0) });
  world.addBody(body);
  
  console.log("Initial position:", body.position);
  world.step(0.016);
  console.log("After step:", body.position);
  
  console.log("\n✅ ~50K+ downloads/week on npm");
}
