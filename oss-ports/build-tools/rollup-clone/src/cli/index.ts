#!/usr/bin/env node

/**
 * Rollup Clone - CLI
 */

import { rollup, watch } from '../core/bundler';
import { resolve } from 'path';
import { existsSync } from 'fs';

const args = process.argv.slice(2);

interface CLIOptions {
  input?: string;
  file?: string;
  dir?: string;
  format?: string;
  name?: string;
  config?: string;
  watch?: boolean;
  sourcemap?: boolean;
  help?: boolean;
  version?: boolean;
}

async function main() {
  const options = parseArgs(args);

  if (options.help) {
    printHelp();
    return;
  }

  if (options.version) {
    console.log('rollup-clone v1.0.0');
    return;
  }

  if (options.config) {
    await buildFromConfig(options.config, options.watch);
  } else if (options.input) {
    await buildFromCLI(options);
  } else {
    await buildFromConfig('rollup.config.js', options.watch);
  }
}

function parseArgs(args: string[]): CLIOptions {
  const options: CLIOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '-i':
      case '--input':
        options.input = args[++i];
        break;
      case '-o':
      case '--file':
        options.file = args[++i];
        break;
      case '-d':
      case '--dir':
        options.dir = args[++i];
        break;
      case '-f':
      case '--format':
        options.format = args[++i];
        break;
      case '-n':
      case '--name':
        options.name = args[++i];
        break;
      case '-c':
      case '--config':
        options.config = args[i + 1] && !args[i + 1].startsWith('-') ? args[++i] : 'rollup.config.js';
        break;
      case '-w':
      case '--watch':
        options.watch = true;
        break;
      case '-m':
      case '--sourcemap':
        options.sourcemap = true;
        break;
      case '-h':
      case '--help':
        options.help = true;
        break;
      case '-v':
      case '--version':
        options.version = true;
        break;
    }
  }

  return options;
}

async function buildFromCLI(options: CLIOptions) {
  if (!options.input) {
    console.error('Error: --input is required');
    process.exit(1);
  }

  const inputOptions = {
    input: options.input!,
  };

  const outputOptions = {
    file: options.file,
    dir: options.dir,
    format: (options.format || 'esm') as any,
    name: options.name,
    sourcemap: options.sourcemap,
  };

  if (options.watch) {
    const watcher = watch({ ...inputOptions, output: outputOptions });
    watcher.on('event', (event: any) => {
      if (event.code === 'START') {
        console.log('Build started...');
      }
      if (event.code === 'BUNDLE_END') {
        console.log('Build completed!');
      }
      if (event.code === 'ERROR') {
        console.error('Build error:', event.error);
      }
    });
  } else {
    const bundle = await rollup(inputOptions);
    await bundle.write(outputOptions);
    await bundle.close();
    console.log('Build completed!');
  }
}

async function buildFromConfig(configFile: string, isWatch?: boolean) {
  const configPath = resolve(process.cwd(), configFile);

  if (!existsSync(configPath)) {
    console.error(`Error: Config file not found: ${configFile}`);
    process.exit(1);
  }

  try {
    const config = await import(configPath);
    const options = config.default || config;

    if (isWatch) {
      const watcher = watch(options);
      watcher.on('event', (event: any) => {
        if (event.code === 'START') {
          console.log('Build started...');
        }
        if (event.code === 'BUNDLE_END') {
          console.log('Build completed!');
        }
        if (event.code === 'ERROR') {
          console.error('Build error:', event.error);
        }
      });
    } else {
      const bundle = await rollup(options);

      if (Array.isArray(options.output)) {
        for (const output of options.output) {
          await bundle.write(output);
        }
      } else if (options.output) {
        await bundle.write(options.output);
      }

      await bundle.close();
      console.log('Build completed!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

function printHelp() {
  console.log(`
rollup-clone - JavaScript module bundler

Usage:
  rollup-clone [options]

Options:
  -i, --input <filename>      Input file
  -o, --file <output>        Output file
  -d, --dir <dirname>        Output directory
  -f, --format <format>      Output format (esm, cjs, umd, iife)
  -n, --name <name>          UMD/IIFE global name
  -c, --config <filename>    Use config file (default: rollup.config.js)
  -w, --watch                Watch files and rebuild on changes
  -m, --sourcemap            Generate source maps
  -h, --help                 Show help
  -v, --version              Show version

Examples:
  rollup-clone -i src/main.js -o dist/bundle.js -f esm
  rollup-clone -c
  rollup-clone -c -w
`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
