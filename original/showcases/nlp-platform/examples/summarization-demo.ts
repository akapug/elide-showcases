/**
 * Text Summarization Demo
 * Demonstrates summarization capabilities with Elide polyglot
 */

import { Summarizer, createSummarizer, SummarizationUtils } from '../src/summarization/summarizer';

const LONG_ARTICLE = `
Artificial Intelligence Revolutionizes Healthcare

Artificial intelligence (AI) is transforming the healthcare industry in unprecedented ways. From diagnosing diseases to discovering new drugs, AI technologies are making healthcare more efficient, accurate, and accessible.

Machine learning algorithms can now analyze medical images with accuracy matching or exceeding human radiologists. These systems can detect early signs of cancer, identify fractures, and spot anomalies that might be missed by the human eye. This not only improves diagnostic accuracy but also reduces the workload on medical professionals.

Natural language processing (NLP) is another AI technology making significant impacts. NLP systems can extract valuable information from unstructured medical records, helping doctors make better-informed decisions. These systems can identify patient risk factors, suggest treatment options, and even predict potential complications.

Drug discovery, traditionally a time-consuming and expensive process, is being accelerated by AI. Machine learning models can analyze vast databases of molecular structures to identify promising drug candidates. This approach has already led to several breakthrough discoveries and could significantly reduce the time and cost of bringing new medications to market.

AI-powered chatbots and virtual health assistants are improving patient engagement and access to care. These systems can answer health questions, schedule appointments, provide medication reminders, and even offer mental health support. They're available 24/7, making healthcare more accessible to people who might otherwise struggle to get timely care.

However, the integration of AI in healthcare also raises important questions about data privacy, algorithmic bias, and the role of human judgment in medical decision-making. Ensuring that AI systems are transparent, fair, and accountable remains a critical challenge for the industry.

Despite these challenges, the potential benefits of AI in healthcare are enormous. As these technologies continue to evolve, they promise to make healthcare more personalized, preventive, and effective, ultimately improving health outcomes for millions of people worldwide.
`;

/**
 * Basic summarization
 */
async function basicSummarization() {
  console.log('=== Basic Summarization ===\n');

  const summarizer = new Summarizer();

  console.log('Original article length:', LONG_ARTICLE.trim().split(' ').length, 'words\n');

  const result = await summarizer.summarize(LONG_ARTICLE, {
    maxLength: 150,
    minLength: 50,
    strategy: 'abstractive'
  });

  console.log('Summary:');
  console.log(result.summary);
  console.log(`\nSummary length: ${result.summary.split(' ').length} words`);
  console.log(`Compression ratio: ${(result.compressionRatio * 100).toFixed(1)}%`);
}

/**
 * Extractive vs Abstractive summarization
 */
async function extractiveVsAbstractive() {
  console.log('\n=== Extractive vs Abstractive ===\n');

  const summarizer = new Summarizer();

  const text = `
    The solar system consists of eight planets orbiting the Sun. Mercury is the
    smallest and closest to the Sun. Venus is the hottest planet due to its thick
    atmosphere. Earth is the only planet known to support life. Mars is known as
    the Red Planet. Jupiter is the largest planet. Saturn is famous for its rings.
    Uranus rotates on its side. Neptune is the farthest planet from the Sun.
  `;

  console.log('Extractive Summary:');
  const extractive = await summarizer.summarize(text, {
    strategy: 'extractive',
    numSentences: 3
  });
  console.log(extractive.summary);

  console.log('\nAbstractive Summary:');
  const abstractive = await summarizer.summarize(text, {
    strategy: 'abstractive',
    maxLength: 50
  });
  console.log(abstractive.summary);
}

/**
 * Generate headlines
 */
async function generateHeadlines() {
  console.log('\n=== Generate Headlines ===\n');

  const summarizer = new Summarizer();

  const articles = [
    "Scientists discover a new exoplanet in the habitable zone of a nearby star. The planet, named Kepler-452c, is located 1,400 light-years away and could potentially harbor life.",
    "Tech company announces breakthrough in quantum computing. The new 1000-qubit processor achieves quantum supremacy and could revolutionize cryptography and drug discovery.",
    "Global leaders commit to ambitious climate goals at international summit. Countries pledge to reduce carbon emissions by 50% over the next decade."
  ];

  for (const article of articles) {
    const headline = await summarizer.generateHeadline(article);
    console.log(`Original: ${article.substring(0, 50)}...`);
    console.log(`Headline: ${headline}\n`);
  }
}

/**
 * Generate bullet points
 */
async function generateBulletPoints() {
  console.log('\n=== Generate Bullet Points ===\n');

  const summarizer = new Summarizer();

  console.log('Article: AI in Healthcare\n');

  const bulletPoints = await summarizer.generateBulletPoints(LONG_ARTICLE, 5);

  console.log('Key Points:');
  for (let i = 0; i < bulletPoints.length; i++) {
    console.log(`${i + 1}. ${bulletPoints[i]}`);
  }
}

/**
 * Batch summarization
 */
async function batchSummarization() {
  console.log('\n=== Batch Summarization ===\n');

  const summarizer = new Summarizer();

  const articles = [
    "Climate change is causing rising sea levels worldwide. Coastal cities face increasing flood risks. Scientists urge immediate action to reduce carbon emissions.",
    "The stock market reached record highs today. Technology sector led the gains. Investors remain optimistic about economic recovery.",
    "New study shows benefits of daily exercise. Researchers found 30 minutes of activity reduces disease risk. Health experts recommend consistent physical activity."
  ];

  console.log(`Summarizing ${articles.length} articles...\n`);

  const results = await summarizer.summarizeBatch(articles, {
    maxLength: 30,
    strategy: 'abstractive'
  }, {
    showProgress: true
  });

  for (let i = 0; i < results.length; i++) {
    console.log(`\nArticle ${i + 1}:`);
    console.log(`Original: ${articles[i]}`);
    console.log(`Summary: ${results[i].summary}`);
  }
}

/**
 * Long document summarization
 */
async function longDocumentSummarization() {
  console.log('\n=== Long Document Summarization ===\n');

  const summarizer = new Summarizer();

  // Simulate a very long document
  const longDocument = LONG_ARTICLE.repeat(3);

  console.log(`Document length: ${longDocument.split(' ').length} words\n`);

  const result = await summarizer.summarize(longDocument, {
    maxLength: 200,
    strategy: 'hybrid'
  });

  console.log('Summary:');
  console.log(result.summary);
  console.log(`\nCompression: ${(result.compressionRatio * 100).toFixed(1)}%`);
  console.log(`Strategy used: ${result.strategy}`);
}

/**
 * Multi-level summarization
 */
async function multiLevelSummarization() {
  console.log('\n=== Multi-Level Summarization ===\n');

  const summarizer = new Summarizer();

  console.log('Level 1: Detailed summary (150 words)');
  const detailed = await summarizer.summarize(LONG_ARTICLE, {
    maxLength: 150,
    strategy: 'abstractive'
  });
  console.log(detailed.summary);

  console.log('\n\nLevel 2: Brief summary (75 words)');
  const brief = await summarizer.summarize(LONG_ARTICLE, {
    maxLength: 75,
    strategy: 'abstractive'
  });
  console.log(brief.summary);

  console.log('\n\nLevel 3: Ultra-brief summary (30 words)');
  const ultraBrief = await summarizer.summarize(LONG_ARTICLE, {
    maxLength: 30,
    strategy: 'abstractive'
  });
  console.log(ultraBrief.summary);
}

/**
 * Domain-specific summarization
 */
async function domainSpecificSummarization() {
  console.log('\n=== Domain-Specific Summarization ===\n');

  const summarizer = new Summarizer();

  const scientificPaper = `
    Abstract: This study investigates the effects of machine learning algorithms
    on protein folding prediction accuracy. We evaluated five different neural
    network architectures on a dataset of 10,000 protein structures. Our results
    show that transformer-based models achieve 95% accuracy, significantly
    outperforming traditional methods. The implications for drug discovery are
    substantial, potentially reducing development time by years.
  `;

  const businessReport = `
    Q4 Financial Results: Revenue increased 25% year-over-year to $5.2 billion.
    Net income rose to $1.1 billion, exceeding analyst expectations. The company
    expanded into three new markets and acquired two competitors. Cloud services
    division grew 40%, now representing 35% of total revenue. Management projects
    continued strong growth in the upcoming fiscal year.
  `;

  console.log('Scientific Paper Summary:');
  const sciSummary = await summarizer.summarize(scientificPaper, {
    maxLength: 50
  });
  console.log(sciSummary.summary);

  console.log('\n\nBusiness Report Summary:');
  const bizSummary = await summarizer.summarize(businessReport, {
    maxLength: 50
  });
  console.log(bizSummary.summary);
}

/**
 * Meeting notes summarization
 */
async function meetingNotesSummarization() {
  console.log('\n=== Meeting Notes Summarization ===\n');

  const summarizer = new Summarizer();

  const meetingNotes = `
    Product Team Meeting - October 15, 2024

    Attendees: Sarah (PM), Mike (Engineering), Lisa (Design), John (Marketing)

    Discussion Points:
    - Reviewed user feedback on the new dashboard feature
    - 85% positive responses, but loading time needs improvement
    - Engineering will optimize queries to reduce load time by 40%
    - Design presented mockups for the mobile app redesign
    - Team approved the new color scheme and layout
    - Marketing shared Q4 campaign plans focusing on enterprise customers
    - Budget approved for targeted LinkedIn advertising
    - Next sprint will focus on performance improvements and bug fixes

    Action Items:
    - Mike: Implement query optimization by Oct 22
    - Lisa: Finalize mobile mockups by Oct 18
    - John: Launch LinkedIn campaign by Oct 20
    - Sarah: Schedule follow-up meeting for Oct 29
  `;

  console.log('Meeting Summary:');
  const summary = await summarizer.summarize(meetingNotes, {
    maxLength: 100,
    strategy: 'extractive'
  });
  console.log(summary.summary);

  console.log('\n\nKey Bullet Points:');
  const bullets = await summarizer.generateBulletPoints(meetingNotes, 4);
  for (const bullet of bullets) {
    console.log(`• ${bullet}`);
  }
}

/**
 * Quality evaluation
 */
async function qualityEvaluation() {
  console.log('\n=== Summary Quality Evaluation ===\n');

  const summarizer = new Summarizer();

  const text = LONG_ARTICLE;

  const summary = await summarizer.summarize(text, {
    maxLength: 100
  });

  console.log('Summary:');
  console.log(summary.summary);

  // Simulate reference summary (in real scenario, this would be human-written)
  const reference = "AI is revolutionizing healthcare through improved diagnostics, drug discovery, and patient care.";

  const rouge = SummarizationUtils.calculateRouge(summary.summary, reference);
  const faithfulness = SummarizationUtils.checkFaithfulness(summary.summary, text);

  console.log('\n\nQuality Metrics:');
  console.log(`ROUGE-1: ${rouge.rouge1.toFixed(3)}`);
  console.log(`ROUGE-2: ${rouge.rouge2.toFixed(3)}`);
  console.log(`ROUGE-L: ${rouge.rougeL.toFixed(3)}`);
  console.log(`Faithfulness: ${faithfulness.faithful ? 'Yes' : 'No'}`);
  console.log(`Coverage: ${(faithfulness.coverage * 100).toFixed(1)}%`);
}

/**
 * Main demo function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Summarization Demo - Elide NLP       ║');
  console.log('║   Powered by Elide Polyglot            ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await basicSummarization();
    await extractiveVsAbstractive();
    await generateHeadlines();
    await generateBulletPoints();
    await batchSummarization();
    await longDocumentSummarization();
    await multiLevelSummarization();
    await domainSpecificSummarization();
    await meetingNotesSummarization();
    await qualityEvaluation();

    console.log('\n✅ Demo completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run demo
if (require.main === module) {
  main();
}

export {
  basicSummarization,
  extractiveVsAbstractive,
  generateHeadlines,
  generateBulletPoints,
  batchSummarization,
  longDocumentSummarization,
  multiLevelSummarization,
  domainSpecificSummarization,
  meetingNotesSummarization,
  qualityEvaluation
};
