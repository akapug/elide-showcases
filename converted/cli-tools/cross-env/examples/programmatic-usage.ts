/**
 * Cross-Env Programmatic API Usage Examples
 * Demonstrates how to use cross-env as a library in your TypeScript/JavaScript code
 */

import {
  crossEnv,
  exec,
  parseArgs,
  setEnv,
  getEnvWithPrefix,
  isValidEnvVarName,
  parseEnvString,
  stripQuotes
} from '../index';

// Example 1: Basic command execution with environment variables
async function example1() {
  console.log('=== Example 1: Basic Usage ===');

  const result = await crossEnv([
    'NODE_ENV=production',
    'PORT=3000',
    'node',
    '-e',
    'console.log("ENV:", process.env.NODE_ENV, "PORT:", process.env.PORT)'
  ]);

  console.log('Exit code:', result.exitCode);
  console.log('');
}

// Example 2: Using the exec function with options
async function example2() {
  console.log('=== Example 2: Using exec() ===');

  const result = await exec({
    env: {
      NODE_ENV: 'development',
      DEBUG: 'true',
      API_KEY: 'test-key-123'
    },
    command: 'node',
    args: ['-e', 'console.log("Debug mode:", process.env.DEBUG)'],
    silent: true
  });

  console.log('Command output:', result.stdout);
  console.log('Exit code:', result.exitCode);
  console.log('');
}

// Example 3: Parsing command-line arguments
function example3() {
  console.log('=== Example 3: Parsing Arguments ===');

  const testArgs = [
    'NODE_ENV=production',
    'PORT=3000',
    'API_KEY="secret-key"',
    'node',
    'server.js',
    '--verbose'
  ];

  const { env, command } = parseArgs(testArgs);

  console.log('Parsed environment variables:');
  Object.entries(env).forEach(([key, value]) => {
    console.log(`  ${key} = ${value}`);
  });

  console.log('Parsed command:');
  console.log(`  ${command.join(' ')}`);
  console.log('');
}

// Example 4: Setting environment variables in current process
function example4() {
  console.log('=== Example 4: Setting Environment Variables ===');

  setEnv({
    APP_NAME: 'MyApp',
    APP_VERSION: '1.0.0',
    APP_ENV: 'staging'
  });

  console.log('Environment variables set:');
  console.log('  APP_NAME:', process.env.APP_NAME);
  console.log('  APP_VERSION:', process.env.APP_VERSION);
  console.log('  APP_ENV:', process.env.APP_ENV);
  console.log('');
}

// Example 5: Getting environment variables with prefix
function example5() {
  console.log('=== Example 5: Getting Variables by Prefix ===');

  // Set some test variables
  setEnv({
    DB_HOST: 'localhost',
    DB_PORT: '5432',
    DB_NAME: 'myapp',
    DB_USER: 'admin',
    API_KEY: 'test',
    API_URL: 'https://api.example.com'
  });

  const dbVars = getEnvWithPrefix('DB_');
  const apiVars = getEnvWithPrefix('API_');

  console.log('Database variables:');
  Object.entries(dbVars).forEach(([key, value]) => {
    console.log(`  ${key} = ${value}`);
  });

  console.log('API variables:');
  Object.entries(apiVars).forEach(([key, value]) => {
    console.log(`  ${key} = ${value}`);
  });
  console.log('');
}

// Example 6: Validating environment variable names
function example6() {
  console.log('=== Example 6: Validating Variable Names ===');

  const testNames = [
    'NODE_ENV',      // valid
    'MY_VAR_123',    // valid
    '_PRIVATE',      // valid
    '123_INVALID',   // invalid (starts with number)
    'MY-VAR',        // invalid (contains hyphen)
    'MY VAR',        // invalid (contains space)
  ];

  testNames.forEach(name => {
    const valid = isValidEnvVarName(name);
    console.log(`  ${name}: ${valid ? '✓ valid' : '✗ invalid'}`);
  });
  console.log('');
}

// Example 7: Parsing environment string
function example7() {
  console.log('=== Example 7: Parsing Environment String ===');

  const envString = 'NODE_ENV=production PORT=3000 DEBUG=true API_KEY="secret-123"';
  const parsed = parseEnvString(envString);

  console.log('Parsed from string:', envString);
  console.log('Result:');
  Object.entries(parsed).forEach(([key, value]) => {
    console.log(`  ${key} = ${value}`);
  });
  console.log('');
}

// Example 8: Stripping quotes from values
function example8() {
  console.log('=== Example 8: Quote Handling ===');

  const testValues = [
    '"double quotes"',
    "'single quotes'",
    'no-quotes',
    '"mixed\'quotes"'
  ];

  testValues.forEach(value => {
    const stripped = stripQuotes(value);
    console.log(`  ${value} → ${stripped}`);
  });
  console.log('');
}

// Example 9: Build script automation
async function example9() {
  console.log('=== Example 9: Build Script Automation ===');

  // Simulate a build process with different stages
  const stages = [
    { name: 'Lint', env: { NODE_ENV: 'development' }, cmd: 'npm', args: ['run', 'lint'] },
    { name: 'Test', env: { NODE_ENV: 'test', COVERAGE: 'true' }, cmd: 'npm', args: ['test'] },
    { name: 'Build', env: { NODE_ENV: 'production', MINIFY: 'true' }, cmd: 'npm', args: ['run', 'build'] }
  ];

  for (const stage of stages) {
    console.log(`Running ${stage.name}...`);
    // In a real scenario, you would await exec() here
    console.log(`  Environment: ${JSON.stringify(stage.env)}`);
    console.log(`  Command: ${stage.cmd} ${stage.args.join(' ')}`);
  }
  console.log('');
}

// Example 10: Error handling
async function example10() {
  console.log('=== Example 10: Error Handling ===');

  try {
    // Try to run a non-existent command
    await exec({
      env: { NODE_ENV: 'production' },
      command: 'nonexistent-command',
      args: [],
      silent: true
    });
  } catch (error) {
    console.log('Caught expected error:');
    console.log(`  ${error instanceof Error ? error.message : error}`);
  }
  console.log('');
}

// Example 11: Working with child process exit codes
async function example11() {
  console.log('=== Example 11: Exit Code Handling ===');

  // Success case
  const success = await exec({
    env: { TEST: 'true' },
    command: 'node',
    args: ['-e', 'process.exit(0)'],
    silent: true
  });
  console.log('Success exit code:', success.exitCode);

  // Failure case
  const failure = await exec({
    env: { TEST: 'true' },
    command: 'node',
    args: ['-e', 'process.exit(1)'],
    silent: true
  });
  console.log('Failure exit code:', failure.exitCode);
  console.log('');
}

// Example 12: Integration with build systems
async function example12() {
  console.log('=== Example 12: Build System Integration ===');

  const buildConfig = {
    development: {
      NODE_ENV: 'development',
      SOURCE_MAPS: 'true',
      MINIFY: 'false',
      HOT_RELOAD: 'true'
    },
    production: {
      NODE_ENV: 'production',
      SOURCE_MAPS: 'false',
      MINIFY: 'true',
      HOT_RELOAD: 'false'
    }
  };

  const environment = 'production';
  console.log(`Building for ${environment}...`);
  console.log('Configuration:');
  Object.entries(buildConfig[environment]).forEach(([key, value]) => {
    console.log(`  ${key} = ${value}`);
  });
  console.log('');
}

// Run all examples
async function runAllExamples() {
  try {
    await example1();
    await example2();
    example3();
    example4();
    example5();
    example6();
    example7();
    example8();
    await example9();
    await example10();
    await example11();
    await example12();

    console.log('=== All examples completed successfully ===');
  } catch (error) {
    console.error('Error running examples:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  example7,
  example8,
  example9,
  example10,
  example11,
  example12
};
