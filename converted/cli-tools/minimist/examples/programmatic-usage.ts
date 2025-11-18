/**
 * Minimist Programmatic API Usage Examples
 */

import minimist, { parseArgString } from '../index';

// Example 1: Basic usage
function example1() {
  console.log('=== Example 1: Basic Usage ===');

  const argv = minimist(['--name', 'Bob', '--age', '25']);
  console.log(argv);
  // { _: [], name: 'Bob', age: 25 }
  console.log('');
}

// Example 2: Type coercion
function example2() {
  console.log('=== Example 2: Type Coercion ===');

  const argv = minimist(['--port', '3000', '--debug', '--ratio', '0.75'], {
    string: ['port'],  // Force port to be string
    boolean: ['debug'] // Force debug to be boolean
  });

  console.log(argv);
  console.log('port is string:', typeof argv.port === 'string');
  console.log('debug is boolean:', typeof argv.debug === 'boolean');
  console.log('');
}

// Example 3: Aliases
function example3() {
  console.log('=== Example 3: Aliases ===');

  const argv = minimist(['-p', '3000', '-h', 'localhost'], {
    alias: {
      p: 'port',
      h: 'host'
    }
  });

  console.log(argv);
  console.log('Can access via -p:', argv.p);
  console.log('Can access via --port:', argv.port);
  console.log('');
}

// Example 4: Default values
function example4() {
  console.log('=== Example 4: Default Values ===');

  const argv = minimist([], {
    default: {
      port: 8080,
      host: 'localhost',
      debug: false
    }
  });

  console.log(argv);
  console.log('');
}

// Example 5: Array handling
function example5() {
  console.log('=== Example 5: Array Handling ===');

  const argv = minimist(['--tag', 'javascript', '--tag', 'typescript', '--tag', 'elide']);
  console.log(argv);
  console.log('Tags array:', argv.tag);
  console.log('');
}

// Example 6: Positional arguments
function example6() {
  console.log('=== Example 6: Positional Arguments ===');

  const argv = minimist(['build', 'src/index.ts', 'src/cli.ts', '--watch']);
  console.log(argv);
  console.log('Command:', argv._[0]);
  console.log('Files:', argv._.slice(1));
  console.log('');
}

// Example 7: Double dash
function example7() {
  console.log('=== Example 7: Double Dash Separator ===');

  const argv = minimist(['--name', 'Bob', '--', 'arg1', 'arg2', 'arg3'], {
    '--': true
  });

  console.log(argv);
  console.log('Before --:', argv._);
  console.log('After --:', argv['--']);
  console.log('');
}

// Example 8: Build tool CLI
function example8() {
  console.log('=== Example 8: Build Tool CLI ===');

  const argv = minimist(
    ['--config', 'build.config.js', '--minify', '--output', 'dist', 'src/index.ts'],
    {
      string: ['config', 'output'],
      boolean: ['minify', 'watch', 'sourcemaps'],
      alias: {
        c: 'config',
        o: 'output',
        m: 'minify',
        w: 'watch'
      },
      default: {
        minify: false,
        sourcemaps: true
      }
    }
  );

  console.log('Build configuration:');
  console.log('  Config file:', argv.config);
  console.log('  Output dir:', argv.output);
  console.log('  Minify:', argv.minify);
  console.log('  Source maps:', argv.sourcemaps);
  console.log('  Input files:', argv._);
  console.log('');
}

// Example 9: Server CLI
function example9() {
  console.log('=== Example 9: Server CLI ===');

  const argv = minimist(
    ['-p', '3000', '--ssl', '--cert', './cert.pem'],
    {
      number: ['port'],
      string: ['host', 'cert', 'key'],
      boolean: ['ssl', 'cluster'],
      alias: {
        p: 'port',
        h: 'host'
      },
      default: {
        host: 'localhost',
        port: 8080,
        ssl: false
      }
    }
  );

  console.log('Server configuration:');
  console.log('  Host:', argv.host);
  console.log('  Port:', argv.port);
  console.log('  SSL:', argv.ssl);
  if (argv.ssl) {
    console.log('  Certificate:', argv.cert);
  }
  console.log('');
}

// Example 10: Unknown option handling
function example10() {
  console.log('=== Example 10: Unknown Option Handling ===');

  const knownOptions = new Set(['name', 'age', 'email', 'verbose', 'v']);

  const argv = minimist(
    ['--name', 'Bob', '--age', '25', '--unknown', 'value'],
    {
      unknown: (arg) => {
        if (arg.startsWith('-')) {
          const key = arg.replace(/^-+/, '');
          if (!knownOptions.has(key)) {
            console.log(`Warning: Unknown option '${arg}'`);
            return false; // Don't add to argv
          }
        }
        return true;
      }
    }
  );

  console.log(argv);
  console.log('Notice: --unknown was not included');
  console.log('');
}

// Example 11: Parsing argument strings
function example11() {
  console.log('=== Example 11: Parsing Argument Strings ===');

  const argString = '--name Bob --age 25 --tags="js,ts" --verbose';
  const argv = parseArgString(argString);

  console.log('Argument string:', argString);
  console.log('Parsed:', argv);
  console.log('');
}

// Example 12: Testing framework CLI
function example12() {
  console.log('=== Example 12: Testing Framework CLI ===');

  const argv = minimist(
    ['--watch', '--coverage', '--reporter', 'json', '**/*.test.ts'],
    {
      string: ['reporter', 'config'],
      boolean: ['watch', 'coverage', 'verbose', 'bail'],
      alias: {
        w: 'watch',
        c: 'coverage',
        v: 'verbose'
      },
      default: {
        reporter: 'default',
        bail: false
      }
    }
  );

  console.log('Test configuration:');
  console.log('  Watch mode:', argv.watch);
  console.log('  Coverage:', argv.coverage);
  console.log('  Reporter:', argv.reporter);
  console.log('  Test pattern:', argv._[0]);
  console.log('');
}

// Run all examples
async function runAllExamples() {
  example1();
  example2();
  example3();
  example4();
  example5();
  example6();
  example7();
  example8();
  example9();
  example10();
  example11();
  example12();

  console.log('=== All examples completed ===');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1, example2, example3, example4, example5, example6,
  example7, example8, example9, example10, example11, example12
};
