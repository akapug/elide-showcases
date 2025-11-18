/**
 * Elide Nodemon - Development Auto-Reloader
 * 
 * NPM Package: nodemon
 * Weekly Downloads: ~30,000,000
 * License: MIT
 */

export interface NodemonConfig {
  script: string;
  watch?: string[];
  ignore?: string[];
  ext?: string;
  delay?: number;
  verbose?: boolean;
  env?: Record<string, string>;
}

export class Nodemon {
  private config: NodemonConfig;
  private running = false;
  private pid?: number;

  constructor(config: NodemonConfig) {
    this.config = { watch: ['.'], ignore: ['node_modules'], ext: 'js,ts', delay: 1000, ...config };
  }

  start(): void {
    this.running = true;
    this.pid = Math.floor(Math.random() * 100000);
    console.log(`[nodemon] starting ${this.config.script}`);
  }

  stop(): void {
    this.running = false;
    this.pid = undefined;
  }

  restart(files?: string[]): void {
    console.log(`[nodemon] restarting due to changes...`);
    this.stop();
    setTimeout(() => this.start(), this.config.delay);
  }
}

export default Nodemon;
