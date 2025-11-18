import { spawn } from 'child_process';

/**
 * Complete Pipeline Demo
 *
 * Demonstrates a real-world content analysis pipeline:
 * 1. Extract entities (identify key topics)
 * 2. Analyze sentiment (understand tone)
 * 3. Generate summary (create brief)
 */

const ARTICLE = `
Breaking: OpenAI Announces GPT-5 with Revolutionary Capabilities

San Francisco, CA - In a surprise announcement today, OpenAI CEO Sam Altman unveiled
GPT-5, the next generation of their groundbreaking language model. The new model
demonstrates unprecedented abilities in reasoning, coding, and multimodal understanding.

"GPT-5 represents a quantum leap in artificial intelligence," Altman stated at the
company's headquarters. "We've achieved performance levels that surpass human experts
in several domains, including advanced mathematics, software engineering, and scientific
research."

The model was trained on a massive dataset using revolutionary techniques developed
by OpenAI's research team in collaboration with scientists from Stanford University
and MIT. Unlike its predecessor, GPT-5 can process not just text, but also images,
video, and audio in real-time.

Early testing shows the model scoring 98% on the bar exam, 99th percentile on the
SAT, and demonstrating PhD-level expertise in physics and biology. Major corporations
including Microsoft, Google, and Amazon have already signed licensing agreements.

However, the announcement has raised concerns among AI safety researchers. Dr. Emily
Chen from the AI Safety Institute warned, "While these capabilities are impressive,
we must carefully consider the ethical implications and potential risks of such
powerful systems."

OpenAI plans to release GPT-5 through a limited API in Q3 2024, with strict safety
measures and usage guidelines. The company's stock price surged 25% following the
announcement, reaching an all-time high of $420 per share.
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
 * Format entity display
 */
function formatEntities(entities: any[]): Record<string, Set<string>> {
  const grouped: Record<string, Set<string>> = {};

  for (const entity of entities) {
    if (!grouped[entity.label]) {
      grouped[entity.label] = new Set();
    }
    grouped[entity.label].add(entity.text);
  }

  return grouped;
}

/**
 * Main example
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
  console.log('║              Complete Content Analysis Pipeline Demo                     ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

  console.log('Use Case: News Article Analysis');
  console.log('Pipeline: Entity Extraction → Sentiment Analysis → Summarization\n');

  console.log('Original Article:');
  console.log('─'.repeat(75));
  console.log(ARTICLE.trim());
  console.log('─'.repeat(75) + '\n');

  console.log('Running complete multi-task analysis...\n');

  const startTime = Date.now();

  try {
    const result = await executePython('nlp/multi_task_processor.py', {
      text: ARTICLE.trim(),
      tasks: ['ner', 'sentiment', 'summarize'],
    });

    const totalTime = Date.now() - startTime;

    console.log('═'.repeat(75));
    console.log('                         ANALYSIS RESULTS                                  ');
    console.log('═'.repeat(75) + '\n');

    // Step 1: Named Entity Recognition
    console.log('STEP 1: Entity Extraction');
    console.log('─'.repeat(75));

    if (result.results.ner) {
      const entityGroups = formatEntities(result.results.ner.entities);

      console.log(`Total Entities Found: ${result.results.ner.entityCount}\n`);

      const categoryLabels: Record<string, string> = {
        ORG: 'Organizations',
        PERSON: 'People',
        GPE: 'Locations',
        DATE: 'Dates',
        MONEY: 'Money',
        PERCENT: 'Percentages',
        PRODUCT: 'Products',
      };

      for (const [label, entities] of Object.entries(entityGroups)) {
        const categoryName = categoryLabels[label] || label;
        console.log(`${categoryName}:`);
        console.log(`  ${Array.from(entities).join(', ')}`);
      }

      console.log('\nKey Topics Identified:');
      const orgs = entityGroups['ORG'] || new Set();
      const products = entityGroups['PRODUCT'] || new Set();
      console.log(`  • AI Companies: ${Array.from(orgs).slice(0, 3).join(', ')}`);
      console.log(`  • Technology: ${Array.from(products).slice(0, 2).join(', ')}`);
    }

    console.log('\n');

    // Step 2: Sentiment Analysis
    console.log('STEP 2: Sentiment Analysis');
    console.log('─'.repeat(75));

    if (result.results.sentiment) {
      const sentiment = result.results.sentiment.sentiment.toUpperCase();
      const score = (result.results.sentiment.score * 100).toFixed(1);
      const confidence = result.results.sentiment.confidence || 'N/A';

      console.log(`Overall Tone: ${sentiment}`);
      console.log(`Confidence: ${score}% (${confidence})`);

      console.log('\nInterpretation:');
      if (sentiment === 'POSITIVE') {
        console.log('  The article has a positive, optimistic tone about the announcement.');
        console.log('  Language emphasizes breakthroughs and achievements.');
      } else if (sentiment === 'NEGATIVE') {
        console.log('  The article has a negative or cautious tone.');
        console.log('  Language emphasizes concerns and risks.');
      } else {
        console.log('  The article maintains a neutral, balanced tone.');
        console.log('  Presents both positive developments and concerns.');
      }
    }

    console.log('\n');

    // Step 3: Summarization
    console.log('STEP 3: Executive Summary');
    console.log('─'.repeat(75));

    if (result.results.summarize && !result.results.summarize.skipped) {
      console.log(result.results.summarize.summary);

      const originalWords = ARTICLE.trim().split(/\s+/).length;
      const summaryWords = result.results.summarize.summary.split(/\s+/).length;
      const compression = ((1 - summaryWords / originalWords) * 100).toFixed(0);

      console.log(`\nCompression: ${originalWords} words → ${summaryWords} words (${compression}% reduction)`);
    }

    console.log('\n' + '═'.repeat(75));

    // Performance Metrics
    console.log('\n⚡ PIPELINE PERFORMANCE');
    console.log('─'.repeat(75));
    console.log(`Total Processing Time: ${totalTime.toFixed(2)}ms`);

    if (result.performance) {
      console.log(`Tokenization: ${result.performance.tokenizationTime.toFixed(2)}ms`);

      if (result.performance.taskTimes) {
        console.log('\nTask Breakdown:');
        for (const [task, time] of Object.entries(result.performance.taskTimes)) {
          const taskName =
            task === 'ner'
              ? 'Entity Extraction'
              : task === 'sentiment'
              ? 'Sentiment Analysis'
              : 'Summarization';
          console.log(`  ${taskName}: ${(time as number).toFixed(2)}ms`);
        }
      }

      if (result.performance.speedup) {
        console.log(`\nSpeedup: ${result.performance.speedup}x vs separate processing`);
      }
    }

    console.log('\n' + '═'.repeat(75));

    // Use Case Summary
    console.log('\n📊 BUSINESS VALUE');
    console.log('─'.repeat(75));
    console.log('This pipeline enables:');
    console.log('  ✓ Automated news monitoring and categorization');
    console.log('  ✓ Real-time sentiment tracking for brand/topic');
    console.log('  ✓ Executive briefing generation');
    console.log('  ✓ Content tagging and search optimization');
    console.log('\nTypical Applications:');
    console.log('  • Media monitoring platforms');
    console.log('  • Financial news analysis');
    console.log('  • Social media sentiment tracking');
    console.log('  • Research paper summarization');
    console.log('  • Customer feedback analysis');

    if (totalTime < 100) {
      console.log('\n✓ Performance: Ready for real-time production use (<100ms)');
    } else {
      console.log(`\n⚠ Performance: ${totalTime.toFixed(0)}ms (acceptable for batch processing)`);
    }
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

main();
