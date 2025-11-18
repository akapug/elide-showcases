/**
 * gl-matrix - WebGL Math Library
 *
 * High-performance matrix and vector operations for WebGL.
 * **POLYGLOT SHOWCASE**: 3D math in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/gl-matrix (~300K+ downloads/week)
 *
 * Features:
 * - vec2, vec3, vec4
 * - mat2, mat3, mat4
 * - Quaternions
 * - High performance
 * - WebGL optimized
 *
 * Package has ~300K+ downloads/week on npm!
 */

export const vec3 = {
  create(): number[] {
    return [0, 0, 0];
  },

  fromValues(x: number, y: number, z: number): number[] {
    return [x, y, z];
  },

  add(out: number[], a: number[], b: number[]): number[] {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  },

  subtract(out: number[], a: number[], b: number[]): number[] {
    out[0] = a[0] - b[0];
    out[1] = a[1] - b[1];
    out[2] = a[2] - b[2];
    return out;
  },

  scale(out: number[], a: number[], s: number): number[] {
    out[0] = a[0] * s;
    out[1] = a[1] * s;
    out[2] = a[2] * s;
    return out;
  },

  dot(a: number[], b: number[]): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  },

  cross(out: number[], a: number[], b: number[]): number[] {
    const ax = a[0], ay = a[1], az = a[2];
    const bx = b[0], by = b[1], bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  },

  length(a: number[]): number {
    return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
  },

  normalize(out: number[], a: number[]): number[] {
    const len = vec3.length(a);
    if (len > 0) {
      out[0] = a[0] / len;
      out[1] = a[1] / len;
      out[2] = a[2] / len;
    }
    return out;
  },
};

export const mat4 = {
  create(): number[] {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ];
  },

  identity(out: number[]): number[] {
    out[0] = 1; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = 1; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = 1; out[11] = 0;
    out[12] = 0; out[13] = 0; out[14] = 0; out[15] = 1;
    return out;
  },

  translate(out: number[], a: number[], v: number[]): number[] {
    const x = v[0], y = v[1], z = v[2];
    
    for (let i = 0; i < 16; i++) out[i] = a[i];
    
    out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
    out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
    out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
    out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    
    return out;
  },

  scale(out: number[], a: number[], v: number[]): number[] {
    const x = v[0], y = v[1], z = v[2];
    
    out[0] = a[0] * x; out[1] = a[1] * x; out[2] = a[2] * x; out[3] = a[3] * x;
    out[4] = a[4] * y; out[5] = a[5] * y; out[6] = a[6] * y; out[7] = a[7] * y;
    out[8] = a[8] * z; out[9] = a[9] * z; out[10] = a[10] * z; out[11] = a[11] * z;
    out[12] = a[12]; out[13] = a[13]; out[14] = a[14]; out[15] = a[15];
    
    return out;
  },

  perspective(out: number[], fovy: number, aspect: number, near: number, far: number): number[] {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) * nf; out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = 2 * far * near * nf; out[15] = 0;
    
    return out;
  },
};

export default { vec3, mat4 };

if (import.meta.url.includes("elide-gl-matrix.ts")) {
  console.log("🔢 gl-matrix - WebGL Math for Elide (POLYGLOT!)\n");

  const v1 = vec3.fromValues(1, 0, 0);
  const v2 = vec3.fromValues(0, 1, 0);
  const cross = vec3.create();
  vec3.cross(cross, v1, v2);
  console.log("v1 × v2 =", cross);

  const matrix = mat4.create();
  console.log("Identity matrix created");
  
  console.log("\n✅ Use Cases:");
  console.log("- 3D graphics transformations");
  console.log("- WebGL shader math");
  console.log("- Game engines");
  console.log("- ~300K+ downloads/week on npm");
}
