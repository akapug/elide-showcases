/**
 * Elide CLI Builder - Fast Native CLI Tools
 *
 * Build high-performance command-line tools with native compilation.
 */

import { NativeBridge } from '../runtime/bridge';

export interface CLIConfig {
  name: string;
  version: string;
  description: string;
  commands?: CommandConfig[];
  options?: OptionConfig[];
}

export interface CommandConfig {
  name: string;
  description: string;
  aliases?: string[];
  options?: OptionConfig[];
  arguments?: ArgumentConfig[];
  action: (args: any, options: any) => void | Promise<void>;
  examples?: string[];
}

export interface OptionConfig {
  flags: string;
  description: string;
  defaultValue?: any;
  required?: boolean;
  choices?: any[];
}

export interface ArgumentConfig {
  name: string;
  description: string;
  required?: boolean;
  variadic?: boolean;
  defaultValue?: any;
}

export class CLI {
  private config: CLIConfig;
  private commands: Map<string, CommandConfig> = new Map();
  private globalOptions: Map<string, OptionConfig> = new Map();

  constructor(config: CLIConfig) {
    this.config = config;

    // Register global options
    if (config.options) {
      for (const option of config.options) {
        this.registerOption(option);
      }
    }

    // Register commands
    if (config.commands) {
      for (const command of config.commands) {
        this.registerCommand(command);
      }
    }

    // Add default help and version commands
    this.addDefaultCommands();
  }

  private registerOption(option: OptionConfig): void {
    const [shortFlag, longFlag] = this.parseFlags(option.flags);
    if (longFlag) {
      this.globalOptions.set(longFlag, option);
    }
  }

  private registerCommand(command: CommandConfig): void {
    this.commands.set(command.name, command);

    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  private parseFlags(flags: string): [string | null, string | null] {
    const parts = flags.split(',').map(f => f.trim());
    let shortFlag: string | null = null;
    let longFlag: string | null = null;

    for (const part of parts) {
      if (part.startsWith('--')) {
        longFlag = part.substring(2).split(' ')[0].split('=')[0];
      } else if (part.startsWith('-')) {
        shortFlag = part.substring(1).split(' ')[0];
      }
    }

    return [shortFlag, longFlag];
  }

  private addDefaultCommands(): void {
    // Help command
    this.commands.set('help', {
      name: 'help',
      description: 'Display help information',
      action: (args: any) => {
        const commandName = args.command;
        if (commandName && this.commands.has(commandName)) {
          this.showCommandHelp(this.commands.get(commandName)!);
        } else {
          this.showGeneralHelp();
        }
      },
      arguments: [
        {
          name: 'command',
          description: 'Command to show help for',
          required: false,
        },
      ],
    });

    // Version command
    this.commands.set('version', {
      name: 'version',
      description: 'Display version information',
      aliases: ['-v', '--version'],
      action: () => {
        console.log(`${this.config.name} v${this.config.version}`);
      },
    });
  }

  private showGeneralHelp(): void {
    console.log(`\n${this.config.name} v${this.config.version}`);
    console.log(`${this.config.description}\n`);

    console.log('Usage: ' + this.config.name + ' [command] [options]\n');

    if (this.commands.size > 0) {
      console.log('Commands:');
      const commandsArray = Array.from(this.commands.values())
        .filter((cmd, index, self) => self.indexOf(cmd) === index); // Remove duplicates

      for (const command of commandsArray) {
        const aliases = command.aliases ? ` (${command.aliases.join(', ')})` : '';
        console.log(`  ${command.name.padEnd(20)} ${command.description}${aliases}`);
      }
      console.log();
    }

    if (this.globalOptions.size > 0) {
      console.log('Options:');
      for (const option of this.globalOptions.values()) {
        console.log(`  ${option.flags.padEnd(30)} ${option.description}`);
      }
      console.log();
    }

    console.log('Run "' + this.config.name + ' help [command]" for more information on a command.');
  }

  private showCommandHelp(command: CommandConfig): void {
    console.log(`\n${command.description}\n`);

    let usage = `Usage: ${this.config.name} ${command.name}`;

    if (command.arguments) {
      for (const arg of command.arguments) {
        const argName = arg.variadic ? `[${arg.name}...]` : arg.required ? `<${arg.name}>` : `[${arg.name}]`;
        usage += ` ${argName}`;
      }
    }

    if (command.options) {
      usage += ' [options]';
    }

    console.log(usage + '\n');

    if (command.arguments && command.arguments.length > 0) {
      console.log('Arguments:');
      for (const arg of command.arguments) {
        const required = arg.required ? ' (required)' : '';
        console.log(`  ${arg.name.padEnd(20)} ${arg.description}${required}`);
      }
      console.log();
    }

    if (command.options && command.options.length > 0) {
      console.log('Options:');
      for (const option of command.options) {
        console.log(`  ${option.flags.padEnd(30)} ${option.description}`);
      }
      console.log();
    }

    if (command.examples && command.examples.length > 0) {
      console.log('Examples:');
      for (const example of command.examples) {
        console.log(`  $ ${example}`);
      }
      console.log();
    }
  }

  async parse(args: string[] = process.argv.slice(2)): Promise<void> {
    if (args.length === 0) {
      this.showGeneralHelp();
      return;
    }

    // Check for version flag
    if (args[0] === '-v' || args[0] === '--version') {
      console.log(`${this.config.name} v${this.config.version}`);
      return;
    }

    // Check for help flag
    if (args[0] === '-h' || args[0] === '--help' || args[0] === 'help') {
      if (args[1]) {
        const command = this.commands.get(args[1]);
        if (command) {
          this.showCommandHelp(command);
        } else {
          this.showGeneralHelp();
        }
      } else {
        this.showGeneralHelp();
      }
      return;
    }

    // Parse command
    const commandName = args[0];
    const command = this.commands.get(commandName);

    if (!command) {
      console.error(`Error: Unknown command "${commandName}"`);
      console.log(`Run "${this.config.name} help" for usage.`);
      process.exit(1);
    }

    // Parse arguments and options
    const parsedArgs: any = {};
    const parsedOptions: any = {};
    let argIndex = 0;
    let i = 1;

    while (i < args.length) {
      const arg = args[i];

      if (arg.startsWith('-')) {
        // Parse option
        const [key, value] = this.parseOption(arg, args[i + 1], command);
        parsedOptions[key] = value;

        if (value !== true && value !== false) {
          i += 2;
        } else {
          i += 1;
        }
      } else {
        // Parse argument
        if (command.arguments && argIndex < command.arguments.length) {
          const argConfig = command.arguments[argIndex];

          if (argConfig.variadic) {
            parsedArgs[argConfig.name] = args.slice(i);
            break;
          } else {
            parsedArgs[argConfig.name] = arg;
            argIndex++;
          }
        }
        i++;
      }
    }

    // Validate required arguments
    if (command.arguments) {
      for (const argConfig of command.arguments) {
        if (argConfig.required && !parsedArgs[argConfig.name]) {
          console.error(`Error: Missing required argument "${argConfig.name}"`);
          process.exit(1);
        }

        if (!parsedArgs[argConfig.name] && argConfig.defaultValue !== undefined) {
          parsedArgs[argConfig.name] = argConfig.defaultValue;
        }
      }
    }

    // Validate required options
    if (command.options) {
      for (const optionConfig of command.options) {
        const [, longFlag] = this.parseFlags(optionConfig.flags);
        if (optionConfig.required && longFlag && !parsedOptions[longFlag]) {
          console.error(`Error: Missing required option "${optionConfig.flags}"`);
          process.exit(1);
        }

        if (longFlag && !parsedOptions[longFlag] && optionConfig.defaultValue !== undefined) {
          parsedOptions[longFlag] = optionConfig.defaultValue;
        }
      }
    }

    // Execute command
    try {
      await command.action(parsedArgs, parsedOptions);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }

  private parseOption(arg: string, nextArg: string | undefined, command: CommandConfig): [string, any] {
    const isLongFlag = arg.startsWith('--');
    const flagName = isLongFlag ? arg.substring(2) : arg.substring(1);

    // Check if flag has inline value (--flag=value)
    const eqIndex = flagName.indexOf('=');
    if (eqIndex !== -1) {
      return [flagName.substring(0, eqIndex), flagName.substring(eqIndex + 1)];
    }

    // Find option config
    const options = [...(command.options || []), ...Array.from(this.globalOptions.values())];
    const option = options.find(opt => {
      const [short, long] = this.parseFlags(opt.flags);
      return (isLongFlag && long === flagName) || (!isLongFlag && short === flagName);
    });

    if (!option) {
      console.error(`Error: Unknown option "${arg}"`);
      process.exit(1);
    }

    // Check if this is a boolean flag
    const [, longFlag] = this.parseFlags(option.flags);
    const isBooleanFlag = !option.flags.includes('<') && !option.flags.includes('[');

    if (isBooleanFlag) {
      return [longFlag!, true];
    }

    // Get value from next argument
    if (!nextArg || nextArg.startsWith('-')) {
      console.error(`Error: Option "${arg}" requires a value`);
      process.exit(1);
    }

    return [longFlag!, nextArg];
  }

  command(config: CommandConfig): this {
    this.registerCommand(config);
    return this;
  }

  option(flags: string, description: string, defaultValue?: any): this {
    this.registerOption({ flags, description, defaultValue });
    return this;
  }
}

export function createCLI(config: CLIConfig): CLI {
  return new CLI(config);
}
