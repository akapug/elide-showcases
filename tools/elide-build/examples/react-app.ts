/**
 * Example: React Application
 *
 * Complete example of building a React app with Elide Build
 */

import { defineConfig } from '../config/index';
import { htmlPlugin, cssPlugin, compressionPlugin } from '../plugins/index';

export default defineConfig({
  bundle: {
    entry: {
      main: 'src/index.tsx',
      vendor: ['react', 'react-dom'],
    },
    outDir: 'dist',
    format: 'esm',
    target: 'es2020',
    jsx: 'react-jsx',
    jsxImportSource: 'react',
    minify: false,
    sourcemap: true,
    splitting: true,
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
    },
    alias: {
      '@': './src',
      '@components': './src/components',
      '@hooks': './src/hooks',
      '@utils': './src/utils',
    },
    define: {
      'process.env.NODE_ENV': '"development"',
      __DEV__: 'true',
    },
    plugins: [
      htmlPlugin({
        template: 'public/index.html',
        title: 'React App - Elide Build',
        meta: {
          description: 'React app built with Elide Build',
          viewport: 'width=device-width, initial-scale=1',
        },
      }),
      cssPlugin({
        modules: true,
        minify: false,
        extract: true,
      }),
    ],
  },

  dev: {
    port: 3000,
    host: 'localhost',
    https: false,
    hmr: true,
    open: true,
    overlay: true,
    cors: true,
    static: 'public',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        pathRewrite: { '^/api': '' },
      },
    },
  },

  production: {
    clean: true,
    analyze: true,
    report: true,
    minify: true,
    sourcemap: true,
    contentHash: true,
    chunkHash: true,
    manifest: true,
    targets: [
      {
        name: 'modern',
        outDir: 'dist/modern',
        format: 'esm',
        minify: true,
      },
      {
        name: 'legacy',
        outDir: 'dist/legacy',
        format: 'iife',
        minify: true,
      },
    ],
    env: {
      NODE_ENV: 'production',
      API_URL: 'https://api.example.com',
    },
  },
});

/**
 * Sample React Component
 */
export const ExampleComponent = `
import React, { useState, useEffect } from 'react';
import styles from './Example.module.css';

interface Props {
  title: string;
  items: string[];
}

export const Example: React.FC<Props> = ({ title, items }) => {
  const [count, setCount] = useState(0);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
      <ul>
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
};
`;

/**
 * Sample App Entry Point
 */
export const ExampleApp = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Example } from './components/Example';
import './styles/global.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Example
      title="Hello Elide Build!"
      items={['Fast', 'Simple', 'Powerful']}
    />
  </React.StrictMode>
);

// HMR
if (module.hot) {
  module.hot.accept('./components/Example', () => {
    console.log('Example component updated!');
  });
}
`;

/**
 * Sample CSS Module
 */
export const ExampleCSS = `
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.container h1 {
  color: #2563eb;
  margin-bottom: 1rem;
}

.container button {
  padding: 10px 20px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.container button:hover {
  background: #2563eb;
}

.container ul {
  list-style: none;
  padding: 0;
}

.container li {
  padding: 10px;
  margin: 5px 0;
  background: #f3f4f6;
  border-radius: 4px;
}
`;

/**
 * Package.json for React App
 */
export const PackageJSON = `
{
  "name": "react-app-elide",
  "version": "1.0.0",
  "scripts": {
    "dev": "elide dev",
    "build": "elide build",
    "preview": "elide preview",
    "analyze": "elide analyze"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@elide/build": "^1.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0"
  }
}
`;
