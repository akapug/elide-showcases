import { spawn } from 'child_process';

/**
 * Batch Processing Example
 *
 * Demonstrates efficient batch processing of multiple texts
 */

const BATCH_TEXTS = [
  'Apple Inc. announced record quarterly earnings, with iPhone sales exceeding expectations in China and Europe.',
  'Scientists at MIT developed a breakthrough battery technology that could triple electric vehicle range.',
  'The Federal Reserve decided to maintain current interest rates amid ongoing economic uncertainty.',
  'Google unveiled its latest AI model, Gemini Ultra, claiming it surpasses GPT-4 on multiple benchmarks.',
  'Tesla delivered 500,000 electric vehicles in Q4, a new company record that surprised Wall Street analysts.',
  'Climate researchers warn that Arctic ice is melting faster than predicted, with serious implications.',
  'Microsoft completed its acquisition of Activision Blizzard for $69 billion, the largest gaming deal ever.',
  'SpaceX successfully launched 60 Starlink satellites, expanding global internet coverage to remote areas.',
];

/**
 * Execute Python processor
 */
function executePython(script: string, input: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [script]);

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
        return;
      }

      try {
        resolve(JSON.parse(stdout));
      } catch (err) {
        reject(new Error(`Failed to parse output: ${err}`));
      }
    });

    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

/**
 * Main example
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    Batch Processing Example                               ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  console.log('Batch Size:', BATCH_TEXTS.length, 'texts');
  console.log('Tasks: NER, Sentiment Analysis\n');

  console.log('Input Texts:');
  console.log('─'.repeat(75));
  BATCH_TEXTS.forEach((text, i) => {
    console.log(`${i + 1}. ${text.substring(0, 65)}...`);
  });
  console.log('─'.repeat(75) + '\n');

  console.log('Processing batch...\n');

  const startTime = Date.now();

  try {
    const result = await executePython('nlp/batch_processor.py', {
      texts: BATCH_TEXTS,
      tasks: ['ner', 'sentiment'],
    });

    const totalTime = Date.now() - startTime;

    console.log('Results:');
    console.log('═'.repeat(75) + '\n');

    // Display results for each text
    result.results.forEach((textResult: any, i: number) => {
      console.log(`Text ${i + 1}:`);
      console.log(`  Preview: ${BATCH_TEXTS[i].substring(0, 50)}...`);

      if (textResult.ner) {
        console.log(`  Entities: ${textResult.ner.entityCount} found`);

        if (textResult.ner.entityCount > 0) {
          const entities = textResult.ner.entities.slice(0, 3).map((e: any) => e.text);
          console.log(`    Top: ${entities.join(', ')}`);
        }
      }

      if (textResult.sentiment) {
        const sentiment = textResult.sentiment.sentiment.toUpperCase();
        const score = (textResult.sentiment.score * 100).toFixed(0);
        console.log(`  Sentiment: ${sentiment} (${score}%)`);
      }

      console.log();
    });

    console.log('─'.repeat(75));

    // Aggregate statistics
    console.log('\nAggregate Statistics:');

    const totalEntities = result.results.reduce(
      (sum: number, r: any) => sum + (r.ner?.entityCount || 0),
      0
    );

    const sentiments = result.results.map((r: any) => r.sentiment?.sentiment);
    const positiveSentiments = sentiments.filter((s: string) => s === 'positive').length;
    const negativeSentiments = sentiments.filter((s: string) => s === 'negative').length;

    console.log(`  Total Entities: ${totalEntities}`);
    console.log(`  Avg Entities/Text: ${(totalEntities / BATCH_TEXTS.length).toFixed(1)}`);
    console.log(`  Positive Sentiment: ${positiveSentiments}/${BATCH_TEXTS.length}`);
    console.log(`  Negative Sentiment: ${negativeSentiments}/${BATCH_TEXTS.length}`);

    console.log('\n⚡ Performance:');
    console.log('   Total Time:', totalTime.toFixed(2) + 'ms');
    console.log('   Avg Time/Text:', (totalTime / BATCH_TEXTS.length).toFixed(2) + 'ms');
    console.log('   Throughput:', (BATCH_TEXTS.length / (totalTime / 1000)).toFixed(1) + ' texts/sec');

    if (result.performance) {
      console.log('   Overall Time:', result.performance.overallTime.toFixed(2) + 'ms');

      if (result.performance.efficiency) {
        console.log(
          '   Efficiency Gain:',
          result.performance.efficiency.efficiencyGain.toFixed(1) + '%'
        );
      }
    }

    console.log('\n' + '═'.repeat(75));

    const avgTimePerText = totalTime / BATCH_TEXTS.length;
    if (avgTimePerText < 50) {
      console.log('\n✓ Excellent batch performance: <50ms per text');
    } else if (avgTimePerText < 100) {
      console.log('\n✓ Good batch performance: <100ms per text');
    } else {
      console.log('\n⚠ Batch performance:', avgTimePerText.toFixed(0) + 'ms per text');
    }

    console.log('\nKey Benefits of Batch Processing:');
    console.log('  • Single model loading (vs ' + BATCH_TEXTS.length + 'x for individual)');
    console.log('  • Efficient GPU utilization with tensor batching');
    console.log('  • Reduced process spawn overhead');
    console.log('  • Better memory management');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
