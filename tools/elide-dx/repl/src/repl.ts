/**
 * Elide Interactive REPL
 * Multi-language Read-Eval-Print Loop with advanced features
 */

import { EventEmitter } from 'events';

export interface REPLConfig {
  language: string;
  prompt?: string;
  historySize?: number;
  historyFile?: string;
  multiline?: boolean;
  useColors?: boolean;
  completer?: (line: string) => string[];
}

export interface REPLContext {
  [key: string]: any;
}

export interface CompletionResult {
  completions: string[];
  prefix: string;
}

export interface HistoryEntry {
  input: string;
  output: string;
  timestamp: number;
  language: string;
}

/**
 * Interactive REPL for Elide
 */
export class ElideREPL extends EventEmitter {
  private config: REPLConfig;
  private context: REPLContext = {};
  private history: HistoryEntry[] = [];
  private historyIndex: number = 0;
  private multilineBuffer: string[] = [];
  private isMultiline: boolean = false;
  private running: boolean = false;

  constructor(config: REPLConfig) {
    super();
    this.config = {
      prompt: '> ',
      historySize: 1000,
      multiline: true,
      useColors: true,
      ...config
    };

    this.initializeContext();
  }

  /**
   * Initialize REPL context with built-in utilities
   */
  private initializeContext(): void {
    this.context = {
      // Global utilities
      console: console,
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,

      // REPL utilities
      help: () => this.showHelp(),
      clear: () => this.clearScreen(),
      exit: () => this.stop(),
      history: () => this.getHistory(),
      save: (filename: string) => this.saveHistory(filename),
      load: (filename: string) => this.loadHistory(filename),

      // Language-specific imports
      ...(this.config.language === 'typescript' && {
        import: (module: string) => this.importModule(module),
        require: (module: string) => this.requireModule(module)
      })
    };
  }

  /**
   * Start REPL
   */
  async start(): Promise<void> {
    this.running = true;
    await this.loadHistoryFromFile();
    this.showWelcome();
    this.emit('started');
  }

  /**
   * Stop REPL
   */
  async stop(): Promise<void> {
    this.running = false;
    await this.saveHistoryToFile();
    this.emit('stopped');
  }

  /**
   * Show welcome message
   */
  private showWelcome(): void {
    console.log(`Elide REPL - ${this.config.language}`);
    console.log('Type .help for more information');
    console.log('');
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    const help = `
Elide REPL Commands:
  .help              Show this help message
  .clear             Clear the REPL screen
  .exit              Exit the REPL
  .history           Show command history
  .save <file>       Save session history to file
  .load <file>       Load and execute file
  .context           Show current context
  .break             Break out of multiline input
  .editor            Enter editor mode (multiline)

Shortcuts:
  Ctrl+C             Cancel current input
  Ctrl+D             Exit REPL
  Up/Down arrows     Navigate history
  Tab                Auto-complete
  Ctrl+R             Reverse history search
    `;
    console.log(help);
  }

  /**
   * Clear screen
   */
  private clearScreen(): void {
    console.clear();
    this.showWelcome();
  }

  /**
   * Evaluate input
   */
  async evaluate(input: string): Promise<any> {
    try {
      // Handle special commands
      if (input.startsWith('.')) {
        return await this.handleCommand(input);
      }

      // Check for multiline input
      if (this.shouldContinueMultiline(input)) {
        this.multilineBuffer.push(input);
        this.isMultiline = true;
        return { __multiline: true };
      }

      // Complete multiline input
      if (this.isMultiline) {
        this.multilineBuffer.push(input);
        input = this.multilineBuffer.join('\n');
        this.multilineBuffer = [];
        this.isMultiline = false;
      }

      // Evaluate based on language
      const result = await this.evaluateInLanguage(input);

      // Add to history
      this.addToHistory(input, this.formatOutput(result));

      this.emit('evaluated', { input, result });
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addToHistory(input, `Error: ${errorMsg}`);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Evaluate code in specific language
   */
  private async evaluateInLanguage(code: string): Promise<any> {
    switch (this.config.language) {
      case 'typescript':
      case 'javascript':
        return this.evaluateJavaScript(code);

      case 'python':
        return this.evaluatePython(code);

      case 'ruby':
        return this.evaluateRuby(code);

      case 'java':
        return this.evaluateJava(code);

      default:
        throw new Error(`Unsupported language: ${this.config.language}`);
    }
  }

  /**
   * Evaluate JavaScript/TypeScript code
   */
  private async evaluateJavaScript(code: string): Promise<any> {
    // Handle async/await
    if (code.includes('await')) {
      code = `(async () => { return ${code} })()`;
    }

    // Evaluate in context
    const func = new Function(...Object.keys(this.context), `return ${code}`);
    const result = await func(...Object.values(this.context));

    return result;
  }

  /**
   * Evaluate Python code
   */
  private async evaluatePython(code: string): Promise<any> {
    // In production, this would use Elide's Python runtime
    console.log('[REPL] Evaluating Python:', code);
    return `Python result: ${code}`;
  }

  /**
   * Evaluate Ruby code
   */
  private async evaluateRuby(code: string): Promise<any> {
    // In production, this would use Elide's Ruby runtime
    console.log('[REPL] Evaluating Ruby:', code);
    return `Ruby result: ${code}`;
  }

  /**
   * Evaluate Java code
   */
  private async evaluateJava(code: string): Promise<any> {
    // In production, this would use Elide's Java runtime
    console.log('[REPL] Evaluating Java:', code);
    return `Java result: ${code}`;
  }

  /**
   * Check if input should continue in multiline mode
   */
  private shouldContinueMultiline(input: string): boolean {
    if (!this.config.multiline) return false;

    // Check for unclosed brackets, braces, or parentheses
    const opens = (input.match(/[{[(]/g) || []).length;
    const closes = (input.match(/[}\])]/g) || []).length;

    if (opens > closes) return true;

    // Check for trailing operator or backslash
    if (/[+\-*/%&|^=,]$/.test(input.trim()) || input.endsWith('\\')) {
      return true;
    }

    return false;
  }

  /**
   * Handle REPL commands
   */
  private async handleCommand(command: string): Promise<any> {
    const [cmd, ...args] = command.slice(1).split(' ');

    switch (cmd) {
      case 'help':
        return this.showHelp();

      case 'clear':
        return this.clearScreen();

      case 'exit':
        await this.stop();
        return 'Goodbye!';

      case 'history':
        return this.getHistory();

      case 'save':
        return await this.saveHistory(args[0]);

      case 'load':
        return await this.loadHistory(args[0]);

      case 'context':
        return Object.keys(this.context);

      case 'break':
        this.multilineBuffer = [];
        this.isMultiline = false;
        return 'Multiline input cancelled';

      case 'editor':
        return this.enterEditorMode();

      default:
        throw new Error(`Unknown command: ${cmd}`);
    }
  }

  /**
   * Get command completion suggestions
   */
  complete(line: string): CompletionResult {
    const completions: string[] = [];

    // Custom completer
    if (this.config.completer) {
      return {
        completions: this.config.completer(line),
        prefix: line
      };
    }

    // Complete from context
    const lastToken = line.split(/\s+/).pop() || '';
    const keys = Object.keys(this.context);

    for (const key of keys) {
      if (key.startsWith(lastToken)) {
        completions.push(key);
      }
    }

    // Add language keywords
    completions.push(...this.getLanguageKeywords().filter(k => k.startsWith(lastToken)));

    return {
      completions: completions.sort(),
      prefix: lastToken
    };
  }

  /**
   * Get language-specific keywords
   */
  private getLanguageKeywords(): string[] {
    switch (this.config.language) {
      case 'typescript':
      case 'javascript':
        return ['const', 'let', 'var', 'function', 'async', 'await', 'class', 'import', 'export', 'return', 'if', 'else', 'for', 'while', 'try', 'catch'];

      case 'python':
        return ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'with', 'as', 'lambda', 'async', 'await'];

      case 'ruby':
        return ['def', 'class', 'module', 'require', 'return', 'if', 'elsif', 'else', 'case', 'when', 'for', 'while', 'begin', 'rescue', 'end'];

      case 'java':
        return ['class', 'interface', 'import', 'return', 'if', 'else', 'for', 'while', 'try', 'catch', 'public', 'private', 'protected', 'static', 'final'];

      default:
        return [];
    }
  }

  /**
   * Add entry to history
   */
  private addToHistory(input: string, output: string): void {
    const entry: HistoryEntry = {
      input,
      output,
      timestamp: Date.now(),
      language: this.config.language
    };

    this.history.push(entry);

    // Limit history size
    if (this.history.length > (this.config.historySize || 1000)) {
      this.history.shift();
    }

    this.historyIndex = this.history.length;
  }

  /**
   * Get history
   */
  getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Navigate history
   */
  navigateHistory(direction: 'up' | 'down'): string | undefined {
    if (direction === 'up') {
      if (this.historyIndex > 0) {
        this.historyIndex--;
      }
    } else {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
      } else {
        this.historyIndex = this.history.length;
        return '';
      }
    }

    return this.history[this.historyIndex]?.input;
  }

  /**
   * Save history to file
   */
  async saveHistory(filename: string): Promise<string> {
    console.log(`[REPL] Saving history to ${filename}`);
    // In production, this would write to file system
    return `History saved to ${filename}`;
  }

  /**
   * Load history from file
   */
  async loadHistory(filename: string): Promise<string> {
    console.log(`[REPL] Loading history from ${filename}`);
    // In production, this would read from file system
    return `History loaded from ${filename}`;
  }

  /**
   * Save history to configured file
   */
  private async saveHistoryToFile(): Promise<void> {
    if (this.config.historyFile) {
      await this.saveHistory(this.config.historyFile);
    }
  }

  /**
   * Load history from configured file
   */
  private async loadHistoryFromFile(): Promise<void> {
    if (this.config.historyFile) {
      try {
        await this.loadHistory(this.config.historyFile);
      } catch (error) {
        // Ignore if file doesn't exist
      }
    }
  }

  /**
   * Enter editor mode for multiline input
   */
  private enterEditorMode(): string {
    return 'Editor mode activated. Enter code, then press Ctrl+D to execute.';
  }

  /**
   * Import ES module
   */
  private async importModule(modulePath: string): Promise<any> {
    console.log(`[REPL] Importing module: ${modulePath}`);
    // In production, this would use Elide's module system
    return {};
  }

  /**
   * Require CommonJS module
   */
  private requireModule(modulePath: string): any {
    console.log(`[REPL] Requiring module: ${modulePath}`);
    // In production, this would use Elide's module system
    return {};
  }

  /**
   * Format output for display
   */
  private formatOutput(value: any): string {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';

    if (typeof value === 'object') {
      try {
        return JSON.stringify(value, null, 2);
      } catch (error) {
        return String(value);
      }
    }

    return String(value);
  }

  /**
   * Get current prompt
   */
  getPrompt(): string {
    if (this.isMultiline) {
      return '... ';
    }
    return this.config.prompt || '> ';
  }

  /**
   * Check if REPL is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Get REPL context
   */
  getContext(): REPLContext {
    return { ...this.context };
  }

  /**
   * Set context variable
   */
  setContext(key: string, value: any): void {
    this.context[key] = value;
  }

  /**
   * Clear context
   */
  clearContext(): void {
    this.initializeContext();
  }
}

/**
 * Multi-language REPL manager
 */
export class MultiLanguageREPL {
  private repls: Map<string, ElideREPL> = new Map();
  private currentLanguage?: string;

  /**
   * Create REPL for language
   */
  createREPL(language: string, config?: Partial<REPLConfig>): ElideREPL {
    const repl = new ElideREPL({
      language,
      ...config
    });

    this.repls.set(language, repl);
    return repl;
  }

  /**
   * Switch to language REPL
   */
  switchLanguage(language: string): ElideREPL | undefined {
    const repl = this.repls.get(language);
    if (repl) {
      this.currentLanguage = language;
    }
    return repl;
  }

  /**
   * Get current REPL
   */
  getCurrentREPL(): ElideREPL | undefined {
    if (!this.currentLanguage) return undefined;
    return this.repls.get(this.currentLanguage);
  }

  /**
   * Get all REPLs
   */
  getAllREPLs(): Map<string, ElideREPL> {
    return new Map(this.repls);
  }
}

export default ElideREPL;
