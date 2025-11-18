import { spawn } from 'child_process';

/**
 * Single Text Analysis Example
 *
 * Demonstrates multi-task analysis on a single piece of text
 */

const SAMPLE_TEXT = `
Amazon Web Services announced a major expansion of its AI and machine learning capabilities
at the annual re:Invent conference in Las Vegas. CEO Andy Jassy revealed new services for
natural language processing, computer vision, and predictive analytics. The company also
introduced AWS Bedrock, a fully managed service that makes foundation models from leading
AI companies available through an API. Analysts predict this could significantly impact
the cloud computing market, with AWS already holding a 32% market share. The stock price
rose 3.5% following the announcement, reaching a new 52-week high.
`;

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
  console.log('║              Single Text Multi-Task Analysis Example                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  console.log('Input Text:');
  console.log('─'.repeat(75));
  console.log(SAMPLE_TEXT.trim());
  console.log('─'.repeat(75) + '\n');

  console.log('Running multi-task analysis (NER + Sentiment + Summarization)...\n');

  const startTime = Date.now();

  try {
    const result = await executePython('nlp/multi_task_processor.py', {
      text: SAMPLE_TEXT.trim(),
      tasks: ['ner', 'sentiment', 'summarize'],
    });

    const totalTime = Date.now() - startTime;

    console.log('Results:');
    console.log('═'.repeat(75) + '\n');

    // Named Entity Recognition
    if (result.results.ner) {
      console.log('📍 Named Entity Recognition:');
      console.log('   Entities Found:', result.results.ner.entityCount);

      const entityGroups: Record<string, string[]> = {};

      for (const entity of result.results.ner.entities) {
        if (!entityGroups[entity.label]) {
          entityGroups[entity.label] = [];
        }
        if (!entityGroups[entity.label].includes(entity.text)) {
          entityGroups[entity.label].push(entity.text);
        }
      }

      for (const [label, entities] of Object.entries(entityGroups)) {
        console.log(`   ${label}: ${entities.join(', ')}`);
      }

      console.log();
    }

    // Sentiment Analysis
    if (result.results.sentiment) {
      console.log('😊 Sentiment Analysis:');
      console.log('   Sentiment:', result.results.sentiment.sentiment.toUpperCase());
      console.log('   Score:', (result.results.sentiment.score * 100).toFixed(1) + '%');
      console.log('   Confidence:', result.results.sentiment.confidence || 'N/A');
      console.log();
    }

    // Summarization
    if (result.results.summarize && !result.results.summarize.skipped) {
      console.log('📝 Text Summarization:');
      console.log('   Summary:', result.results.summarize.summary);
      console.log('   Compression:', (result.results.summarize.compressionRatio * 100).toFixed(1) + '%');
      console.log();
    }

    // Performance Metrics
    console.log('⚡ Performance:');
    console.log('   Total Time:', totalTime.toFixed(2) + 'ms');

    if (result.performance) {
      console.log('   Tokenization:', result.performance.tokenizationTime.toFixed(2) + 'ms');

      if (result.performance.taskTimes) {
        console.log('   Task Times:');
        for (const [task, time] of Object.entries(result.performance.taskTimes)) {
          console.log(`     - ${task}: ${(time as number).toFixed(2)}ms`);
        }
      }

      if (result.performance.speedup) {
        console.log('   Speedup:', result.performance.speedup + 'x (vs separate processing)');
      }
    }

    console.log('\n' + '═'.repeat(75));

    if (totalTime < 100) {
      console.log('\n✓ Performance target met: <100ms for multi-task analysis');
    } else {
      console.log('\n⚠ Performance: ' + totalTime.toFixed(0) + 'ms (target: <100ms)');
      console.log('  Note: First run is slower due to model loading');
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
