/**
 * Question Answering Demo
 * Demonstrates QA capabilities with Elide polyglot
 */

import { QuestionAnswerer, ConversationalQA, DocumentQA, QAUtils, createQuestionAnswerer } from '../src/qa/question-answering';

const KNOWLEDGE_BASE = `
The Eiffel Tower is a wrought-iron lattice tower located in Paris, France. It was
designed by engineer Gustave Eiffel and completed in 1889. The tower stands 330
meters (1,083 feet) tall and was the tallest man-made structure in the world until
1930. It attracts millions of visitors each year and has become a global cultural
icon of France. The tower has three levels accessible to visitors, with restaurants
on the first and second levels.
`;

/**
 * Basic question answering
 */
async function basicQA() {
  console.log('=== Basic Question Answering ===\n');

  const qa = new QuestionAnswerer();

  const questions = [
    "Where is the Eiffel Tower located?",
    "Who designed the Eiffel Tower?",
    "When was the Eiffel Tower completed?",
    "How tall is the Eiffel Tower?",
    "How many levels does the tower have?"
  ];

  console.log('Context:', KNOWLEDGE_BASE.substring(0, 100) + '...\n');

  for (const question of questions) {
    const result = await qa.answer(question, KNOWLEDGE_BASE);
    console.log(QAUtils.format(result));
    console.log();
  }
}

/**
 * Multiple answers
 */
async function multipleAnswers() {
  console.log('\n=== Top-K Answers ===\n');

  const qa = new QuestionAnswerer();

  const question = "What makes the Eiffel Tower famous?";

  console.log(`Question: ${question}\n`);

  const answers = await qa.getTopKAnswers(question, KNOWLEDGE_BASE, 3);

  console.log('Top 3 answers:');
  for (let i = 0; i < answers.length; i++) {
    console.log(`${i + 1}. "${answers[i].answer}" (${(answers[i].confidence * 100).toFixed(1)}%)`);
  }
}

/**
 * Multi-passage QA
 */
async function multiPassageQA() {
  console.log('\n=== Multi-Passage QA ===\n');

  const qa = new QuestionAnswerer();

  const passages = [
    "The Eiffel Tower was built as the entrance arch for the 1889 World's Fair. The fair celebrated the 100th anniversary of the French Revolution.",
    "Gustave Eiffel's company designed and built the tower over a period of two years. The construction employed over 300 workers.",
    "The Eiffel Tower is painted every seven years to prevent rust. It takes approximately 60 tons of paint to cover the entire structure."
  ];

  const question = "How long did it take to build the Eiffel Tower?";

  console.log(`Question: ${question}\n`);

  const result = await qa.answerMultiPassage(question, passages);

  console.log('Best answer:', result.bestAnswer.answer);
  console.log('Confidence:', (result.bestAnswer.confidence * 100).toFixed(1) + '%');
  console.log('Source passage:', result.bestAnswer.context.substring(0, 80) + '...');
  console.log('\nAggregated confidence:', (result.aggregatedConfidence * 100).toFixed(1) + '%');
}

/**
 * Batch question answering
 */
async function batchQA() {
  console.log('\n=== Batch Question Answering ===\n');

  const qa = new QuestionAnswerer();

  const context = `
    Python is a high-level programming language created by Guido van Rossum.
    It was first released in 1991. Python emphasizes code readability and uses
    significant indentation. It supports multiple programming paradigms including
    procedural, object-oriented, and functional programming. Python is widely
    used in web development, data science, artificial intelligence, and automation.
  `;

  const questions = [
    "Who created Python?",
    "When was Python released?",
    "What programming paradigms does Python support?",
    "What is Python used for?"
  ];

  console.log('Answering multiple questions...\n');

  const results = await qa.answerBatch(questions, context, {
    showProgress: true
  });

  console.log('\nResults:');
  for (let i = 0; i < results.length; i++) {
    console.log(`Q: ${questions[i]}`);
    console.log(`A: ${results[i].answer}\n`);
  }
}

/**
 * Conversational QA
 */
async function conversationalQA() {
  console.log('\n=== Conversational QA ===\n');

  const conversation = new ConversationalQA();

  const initialContext = `
    SpaceX is a private aerospace company founded by Elon Musk in 2002.
    The company is headquartered in Hawthorne, California. SpaceX develops
    and manufactures spacecraft, including the Falcon 9 rocket and Dragon
    spacecraft. In 2020, SpaceX became the first private company to send
    astronauts to the International Space Station.
  `;

  console.log('Starting conversation...\n');

  const q1 = "Who founded SpaceX?";
  const a1 = await conversation.ask(q1, initialContext);
  console.log(`Q: ${q1}`);
  console.log(`A: ${a1.answer}\n`);

  const q2 = "When was it founded?";
  const a2 = await conversation.ask(q2);
  console.log(`Q: ${q2}`);
  console.log(`A: ${a2.answer}\n`);

  const q3 = "Where is the headquarters?";
  const a3 = await conversation.ask(q3);
  console.log(`Q: ${q3}`);
  console.log(`A: ${a3.answer}\n`);

  console.log('Conversation history:');
  const history = conversation.getHistory();
  for (let i = 0; i < history.length; i++) {
    console.log(`${i + 1}. ${history[i].question} → ${history[i].answer}`);
  }
}

/**
 * Document QA
 */
async function documentQA() {
  console.log('\n=== Document QA ===\n');

  const docQA = new DocumentQA();

  const longDocument = `
    Climate Change and Its Global Impact

    Climate change refers to long-term shifts in global temperatures and weather
    patterns. While climate change is natural, human activities have been the main
    driver of climate change since the 1800s, primarily due to burning fossil fuels.

    The main greenhouse gases include carbon dioxide, methane, and nitrous oxide.
    Carbon dioxide is released through activities like burning coal, oil, and gas.
    Deforestation also contributes as trees absorb CO2.

    The effects of climate change are widespread. Rising temperatures are melting
    polar ice caps and glaciers, leading to rising sea levels. This threatens
    coastal communities worldwide. Extreme weather events are becoming more frequent,
    including hurricanes, droughts, and heat waves.

    Scientists warn that we must limit global warming to 1.5 degrees Celsius above
    pre-industrial levels to avoid catastrophic consequences. This requires immediate
    action to reduce greenhouse gas emissions, transition to renewable energy, and
    protect natural ecosystems.

    Individual actions matter too. People can reduce their carbon footprint by using
    public transportation, reducing meat consumption, conserving energy, and supporting
    sustainable businesses. Collective action at all levels is essential to address
    this global challenge.
  `.repeat(2);

  const question = "What are the main greenhouse gases?";

  console.log(`Question: ${question}`);
  console.log(`Document length: ${longDocument.split(' ').length} words\n`);

  const result = await docQA.answerFromDocument(question, longDocument);

  console.log('Answer:', result.answer);
  console.log('Confidence:', (result.confidence * 100).toFixed(1) + '%');
}

/**
 * Fact extraction
 */
async function factExtraction() {
  console.log('\n=== Fact Extraction ===\n');

  const qa = new QuestionAnswerer();

  const biography = `
    Marie Curie was born on November 7, 1867, in Warsaw, Poland. She was a physicist
    and chemist who conducted pioneering research on radioactivity. She was the first
    woman to win a Nobel Prize, the first person to win two Nobel Prizes, and the only
    person to win Nobel Prizes in two scientific fields (Physics in 1903 and Chemistry
    in 1911). She died on July 4, 1934, in Passy, France.
  `;

  const factQuestions = [
    "When was Marie Curie born?",
    "Where was Marie Curie born?",
    "What field did Marie Curie research?",
    "How many Nobel Prizes did Marie Curie win?",
    "When did Marie Curie die?"
  ];

  console.log('Extracting facts...\n');

  const facts = await qa.extractFacts(biography, factQuestions);

  console.log('Extracted Facts:');
  for (const [question, answer] of Object.entries(facts)) {
    console.log(`${question}`);
    console.log(`→ ${answer}\n`);
  }
}

/**
 * Answer highlighting
 */
async function answerHighlighting() {
  console.log('\n=== Answer Highlighting ===\n');

  const qa = new QuestionAnswerer();

  const context = "The Amazon Rainforest covers 5.5 million square kilometers across nine countries.";
  const question = "How large is the Amazon Rainforest?";

  const result = await qa.answer(question, context);

  console.log('Question:', question);
  console.log('Answer:', result.answer);
  console.log('\nContext with highlighted answer:');
  console.log(qa.highlightAnswer(result, (ans) => `>>> ${ans} <<<`));
}

/**
 * Impossible questions
 */
async function impossibleQuestions() {
  console.log('\n=== Handling Impossible Questions ===\n');

  const qa = new QuestionAnswerer();

  const context = "The Great Wall of China was built over many centuries to protect against invasions.";

  const questions = [
    "How long is the Great Wall?",          // Answerable from other knowledge
    "Who built the Great Wall?",            // Not in context
    "What is the capital of Australia?",    // Completely unrelated
    "Why was the Great Wall built?"         // Answerable
  ];

  for (const question of questions) {
    const result = await qa.answer(question, context);

    console.log(`Q: ${question}`);

    if (result.answer && result.confidence > 0.3) {
      console.log(`A: ${result.answer} (${(result.confidence * 100).toFixed(1)}%)`);
    } else {
      console.log(`A: [Cannot answer from given context]`);
    }
    console.log();
  }
}

/**
 * Reading comprehension test
 */
async function readingComprehension() {
  console.log('\n=== Reading Comprehension Test ===\n');

  const qa = new QuestionAnswerer();

  const passage = `
    Photosynthesis is the process by which green plants and some other organisms
    use sunlight to synthesize foods with the help of chlorophyll. During this
    process, plants absorb carbon dioxide from the air and water from the soil.
    Using the energy from sunlight, they convert these into glucose (sugar) and
    oxygen. The oxygen is released into the atmosphere as a byproduct. This process
    is essential for life on Earth as it produces the oxygen we breathe and forms
    the base of most food chains.
  `;

  const questions = [
    { q: "What is photosynthesis?", type: "definition" },
    { q: "What do plants absorb during photosynthesis?", type: "process" },
    { q: "What is produced during photosynthesis?", type: "output" },
    { q: "Why is photosynthesis important?", type: "significance" }
  ];

  console.log('Passage:', passage.substring(0, 100) + '...\n');

  for (const item of questions) {
    const result = await qa.answer(item.q, passage);
    console.log(`[${item.type.toUpperCase()}]`);
    console.log(`Q: ${item.q}`);
    console.log(`A: ${result.answer}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
  }
}

/**
 * Customer support QA
 */
async function customerSupportQA() {
  console.log('\n=== Customer Support QA System ===\n');

  const qa = new QuestionAnswerer();

  const faq = `
    Shipping and Delivery

    We offer free standard shipping on orders over $50. Standard shipping takes
    5-7 business days. Express shipping is available for $15 and takes 2-3 business
    days. International shipping is available to most countries and takes 10-15
    business days.

    Returns and Refunds

    You can return items within 30 days of purchase for a full refund. Items must
    be unused and in original packaging. Refunds are processed within 5-7 business
    days after we receive the returned item. Shipping costs are non-refundable.
  `;

  const customerQuestions = [
    "How long does standard shipping take?",
    "What is the return policy?",
    "Do you offer international shipping?",
    "How much is express shipping?"
  ];

  console.log('Processing customer questions...\n');

  for (const question of customerQuestions) {
    const result = await qa.answer(question, faq);
    const quality = QAUtils.isHighQuality(result) ? '✓' : '⚠';

    console.log(`${quality} Customer: "${question}"`);
    console.log(`  Bot: "${result.answer}"`);
    console.log(`  Confidence: ${(result.confidence * 100).toFixed(1)}%\n`);
  }
}

/**
 * Main demo function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Question Answering Demo - Elide NLP  ║');
  console.log('║   Powered by Elide Polyglot            ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await basicQA();
    await multipleAnswers();
    await multiPassageQA();
    await batchQA();
    await conversationalQA();
    await documentQA();
    await factExtraction();
    await answerHighlighting();
    await impossibleQuestions();
    await readingComprehension();
    await customerSupportQA();

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
  basicQA,
  multipleAnswers,
  multiPassageQA,
  batchQA,
  conversationalQA,
  documentQA,
  factExtraction,
  answerHighlighting,
  impossibleQuestions,
  readingComprehension,
  customerSupportQA
};
