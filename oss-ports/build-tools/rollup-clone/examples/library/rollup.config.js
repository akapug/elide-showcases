/**
 * Rollup configuration for library example
 *
 * This demonstrates building a library that can be consumed in multiple environments:
 * - ESM (import/export)
 * - CommonJS (require/module.exports)
 * - UMD (browser global)
 * - Browser (ES module in script tag)
 */

export default {
  input: 'src/index.ts',

  output: [
    // ESM build
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },

    // CommonJS build
    {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'named',
    },

    // UMD build for browsers
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'MyLibrary',
      sourcemap: true,
      globals: {},
    },

    // IIFE build for browsers
    {
      file: 'dist/index.iife.js',
      format: 'iife',
      name: 'MyLibrary',
      sourcemap: true,
    },
  ],

  // External dependencies (not bundled)
  external: [],

  // Tree shaking options
  treeshake: {
    moduleSideEffects: false,
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  },

  // Plugins would go here in a real project
  // plugins: [
  //   typescript(),
  //   resolve(),
  //   commonjs(),
  // ]
};
