/**
 * Example: Using the Elide REPL
 */

import ElideREPL from '../repl/src/repl';

async function main() {
  // Create REPL instance for TypeScript
  const repl = new ElideREPL({
    language: 'typescript',
    prompt: 'elide> ',
    historySize: 1000,
    historyFile: '.elide_history',
    multiline: true,
    useColors: true
  });

  // Start REPL
  await repl.start();

  console.log('Welcome to Elide REPL!');
  console.log('Try these commands:');
  console.log('  2 + 2');
  console.log('  const x = 42');
  console.log('  console.log("Hello, Elide!")');
  console.log('  .help');
  console.log('');

  // Listen for events
  repl.on('evaluated', ({ input, result }) => {
    console.log(`[Evaluated] ${input}`);
    console.log(`[Result] ${result}`);
  });

  repl.on('error', (error) => {
    console.error(`[Error] ${error.message}`);
  });

  // Example evaluations
  const examples = [
    '2 + 2',
    'const greeting = "Hello, Elide!"',
    'greeting.toUpperCase()',
    '[1, 2, 3].map(x => x * 2)',
    'async () => { return await Promise.resolve(42); }',
    'Math.sqrt(144)'
  ];

  for (const example of examples) {
    console.log(`\n${repl.getPrompt()}${example}`);
    try {
      const result = await repl.evaluate(example);
      if (!result.__multiline) {
        console.log(`=> ${JSON.stringify(result, null, 2)}`);
      }
    } catch (error) {
      console.error(`Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  // Code completion example
  console.log('\n[Code Completion]');
  const completions = repl.complete('console.');
  console.log('Completions for "console.":', completions.completions.slice(0, 5));

  // History navigation example
  console.log('\n[History Navigation]');
  const previousCommand = repl.navigateHistory('up');
  console.log('Previous command:', previousCommand);

  // Multiline example
  console.log('\n[Multiline Input]');
  console.log(`${repl.getPrompt()}function add(a, b) {`);
  await repl.evaluate('function add(a, b) {');
  console.log(`${repl.getPrompt()}  return a + b;`);
  await repl.evaluate('  return a + b;');
  console.log(`${repl.getPrompt()}}`);
  const multilineResult = await repl.evaluate('}');
  console.log(`=> Function defined`);

  // Get history
  const history = repl.getHistory();
  console.log(`\n[History] ${history.length} entries`);

  // Stop REPL
  await repl.stop();
  console.log('\nREPL stopped. History saved.');
}

main().catch(console.error);
