/**
 * ndarray - Multidimensional Arrays
 *
 * N-dimensional array implementation for scientific computing.
 * **POLYGLOT SHOWCASE**: One array library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/ndarray (~100K+ downloads/week)
 *
 * Features:
 * - N-dimensional array abstraction
 * - Efficient memory layout (row/column major)
 * - Array slicing and indexing
 * - Shape manipulation (reshape, transpose)
 * - Stride-based views (no data copying)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - NumPy (Python), Julia, R all use ndarrays
 * - ONE implementation works everywhere on Elide
 * - Share tensor data across languages
 * - Consistent indexing and slicing
 *
 * Use cases:
 * - Scientific computing
 * - Image processing (pixels as arrays)
 * - Machine learning (tensor operations)
 * - Signal processing
 *
 * Package has ~100K+ downloads/week on npm - essential for data science!
 */

/**
 * N-dimensional array class
 */
export class NDArray {
  data: Float64Array;
  shape: number[];
  stride: number[];
  offset: number;

  constructor(
    data: Float64Array | number[],
    shape: number[],
    stride?: number[],
    offset?: number
  ) {
    this.data = data instanceof Float64Array ? data : new Float64Array(data);
    this.shape = shape;
    this.offset = offset || 0;

    // Calculate strides if not provided (row-major order)
    if (!stride) {
      this.stride = new Array(shape.length);
      let s = 1;
      for (let i = shape.length - 1; i >= 0; i--) {
        this.stride[i] = s;
        s *= shape[i];
      }
    } else {
      this.stride = stride;
    }
  }

  /**
   * Get number of dimensions
   */
  get ndim(): number {
    return this.shape.length;
  }

  /**
   * Get total number of elements
   */
  get size(): number {
    return this.shape.reduce((a, b) => a * b, 1);
  }

  /**
   * Get element at indices
   */
  get(...indices: number[]): number {
    let index = this.offset;
    for (let i = 0; i < indices.length; i++) {
      index += indices[i] * this.stride[i];
    }
    return this.data[index];
  }

  /**
   * Set element at indices
   */
  set(...args: any[]): void {
    const value = args[args.length - 1];
    const indices = args.slice(0, -1);

    let index = this.offset;
    for (let i = 0; i < indices.length; i++) {
      index += indices[i] * this.stride[i];
    }
    this.data[index] = value;
  }

  /**
   * Create a slice/view of the array (no data copying)
   */
  slice(...ranges: Array<number | [number, number]>): NDArray {
    const newShape: number[] = [];
    const newStride: number[] = [];
    let newOffset = this.offset;

    for (let i = 0; i < ranges.length; i++) {
      if (typeof ranges[i] === 'number') {
        newOffset += (ranges[i] as number) * this.stride[i];
      } else {
        const [start, end] = ranges[i] as [number, number];
        newShape.push(end - start);
        newStride.push(this.stride[i]);
        newOffset += start * this.stride[i];
      }
    }

    return new NDArray(this.data, newShape, newStride, newOffset);
  }

  /**
   * Transpose array
   */
  transpose(): NDArray {
    const newShape = [...this.shape].reverse();
    const newStride = [...this.stride].reverse();
    return new NDArray(this.data, newShape, newStride, this.offset);
  }

  /**
   * Reshape array (must have same total size)
   */
  reshape(...newShape: number[]): NDArray {
    const newSize = newShape.reduce((a, b) => a * b, 1);
    if (newSize !== this.size) {
      throw new Error(`Cannot reshape array of size ${this.size} into shape ${newShape}`);
    }

    // For simplicity, create a copy with new shape
    const newData = new Float64Array(this.size);
    let idx = 0;
    this.forEach((val) => {
      newData[idx++] = val;
    });

    return new NDArray(newData, newShape);
  }

  /**
   * Iterate over all elements
   */
  forEach(fn: (value: number, ...indices: number[]) => void): void {
    const indices = new Array(this.ndim).fill(0);

    const recurse = (dim: number) => {
      if (dim === this.ndim) {
        fn(this.get(...indices), ...indices);
        return;
      }

      for (let i = 0; i < this.shape[dim]; i++) {
        indices[dim] = i;
        recurse(dim + 1);
      }
    };

    recurse(0);
  }

  /**
   * Map over all elements
   */
  map(fn: (value: number, ...indices: number[]) => number): NDArray {
    const result = zeros(...this.shape);
    this.forEach((val, ...indices) => {
      result.set(...indices, fn(val, ...indices));
    });
    return result;
  }

  /**
   * Convert to nested array
   */
  toArray(): any {
    const recurse = (indices: number[]): any => {
      if (indices.length === this.ndim) {
        return this.get(...indices);
      }

      const result = [];
      for (let i = 0; i < this.shape[indices.length]; i++) {
        result.push(recurse([...indices, i]));
      }
      return result;
    };

    return recurse([]);
  }
}

/**
 * Create ndarray filled with zeros
 */
export function zeros(...shape: number[]): NDArray {
  const size = shape.reduce((a, b) => a * b, 1);
  return new NDArray(new Float64Array(size), shape);
}

/**
 * Create ndarray filled with ones
 */
export function ones(...shape: number[]): NDArray {
  const size = shape.reduce((a, b) => a * b, 1);
  const data = new Float64Array(size);
  data.fill(1);
  return new NDArray(data, shape);
}

/**
 * Create ndarray from nested array
 */
export function array(data: any): NDArray {
  // Determine shape
  const getShape = (arr: any): number[] => {
    if (!Array.isArray(arr)) return [];
    return [arr.length, ...getShape(arr[0])];
  };

  const shape = getShape(data);

  // Flatten data
  const flatten = (arr: any): number[] => {
    if (!Array.isArray(arr)) return [arr];
    return arr.flatMap(flatten);
  };

  const flatData = flatten(data);
  return new NDArray(flatData, shape);
}

/**
 * Create ndarray with range of values
 */
export function arange(start: number, stop?: number, step: number = 1): NDArray {
  if (stop === undefined) {
    stop = start;
    start = 0;
  }

  const size = Math.ceil((stop - start) / step);
  const data = new Float64Array(size);
  for (let i = 0; i < size; i++) {
    data[i] = start + i * step;
  }

  return new NDArray(data, [size]);
}

/**
 * Create linearly spaced ndarray
 */
export function linspace(start: number, stop: number, num: number = 50): NDArray {
  const data = new Float64Array(num);
  const step = (stop - start) / (num - 1);

  for (let i = 0; i < num; i++) {
    data[i] = start + i * step;
  }

  return new NDArray(data, [num]);
}

// Default export
export default {
  NDArray,
  zeros,
  ones,
  array,
  arange,
  linspace
};

// CLI Demo
if (import.meta.url.includes("elide-ndarray.ts")) {
  console.log("📊 ndarray - Multidimensional Arrays for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Creating Arrays ===");
  const a = zeros(3, 4);
  console.log("zeros(3, 4) shape:", a.shape);
  console.log("size:", a.size);
  console.log();

  console.log("=== Example 2: Setting and Getting Values ===");
  const b = zeros(2, 3);
  b.set(0, 0, 1);
  b.set(0, 1, 2);
  b.set(1, 0, 3);
  b.set(1, 1, 4);
  console.log("b[0,0] =", b.get(0, 0));
  console.log("b[0,1] =", b.get(0, 1));
  console.log("Array:", b.toArray());
  console.log();

  console.log("=== Example 3: From Nested Array ===");
  const c = array([[1, 2, 3], [4, 5, 6]]);
  console.log("shape:", c.shape);
  console.log("data:", c.toArray());
  console.log();

  console.log("=== Example 4: Slicing ===");
  const d = array([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
  console.log("Original:", d.toArray());
  const row = d.slice(1, [0, 3]);
  console.log("Row 1:", row.toArray());
  console.log();

  console.log("=== Example 5: Transpose ===");
  const e = array([[1, 2, 3], [4, 5, 6]]);
  console.log("Original (2x3):", e.toArray());
  const et = e.transpose();
  console.log("Transposed (3x2):", et.toArray());
  console.log();

  console.log("=== Example 6: Reshape ===");
  const f = arange(12);
  console.log("arange(12):", f.toArray());
  const reshaped = f.reshape(3, 4);
  console.log("Reshaped to (3,4):", reshaped.toArray());
  console.log();

  console.log("=== Example 7: Range and Linspace ===");
  console.log("arange(5):", arange(5).toArray());
  console.log("arange(2, 8, 2):", arange(2, 8, 2).toArray());
  console.log("linspace(0, 1, 5):", linspace(0, 1, 5).toArray());
  console.log();

  console.log("=== Example 8: 3D Array ===");
  const cube = zeros(2, 3, 4);
  console.log("3D array shape:", cube.shape);
  console.log("ndim:", cube.ndim);
  console.log("size:", cube.size);
  cube.set(0, 0, 0, 42);
  console.log("cube[0,0,0] =", cube.get(0, 0, 0));
  console.log();

  console.log("=== Example 9: Map Function ===");
  const g = array([1, 2, 3, 4]);
  const squared = g.map(x => x * x);
  console.log("Original:", g.toArray());
  console.log("Squared:", squared.toArray());
  console.log();

  console.log("=== Example 10: Image as Array ===");
  console.log("Representing a 3x3 grayscale image:");
  const image = array([
    [0, 128, 255],
    [64, 192, 128],
    [255, 255, 0]
  ]);
  console.log("Image data:", image.toArray());
  console.log("Pixel at (1,1):", image.get(1, 1));
  console.log();

  console.log("=== POLYGLOT Use Case ===");
  console.log("🌐 Same ndarray library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (like NumPy)");
  console.log("  • Julia (via Elide)");
  console.log("  • R (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One array abstraction, all languages");
  console.log("  ✓ Share tensor data across your stack");
  console.log("  ✓ Consistent indexing everywhere");
  console.log("  ✓ No need for NumPy, TensorFlow.js separately");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Scientific computing");
  console.log("- Image processing");
  console.log("- Machine learning");
  console.log("- Signal processing");
  console.log("- Matrix operations");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Typed arrays for efficiency");
  console.log("- Stride-based views (no copying)");
  console.log("- ~100K+ downloads/week on npm!");
  console.log();
}
