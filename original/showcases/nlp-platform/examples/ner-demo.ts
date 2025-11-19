/**
 * Named Entity Recognition Demo
 * Demonstrates NER capabilities with Elide polyglot
 */

import { EntityRecognizer, EntityUtils, createEntityRecognizer } from '../src/analysis/entity-recognizer';

/**
 * Basic NER example
 */
async function basicNER() {
  console.log('=== Basic Named Entity Recognition ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = "Apple Inc. CEO Tim Cook announced the new iPhone in San Francisco on October 15th for $999.";

  console.log(`Text: "${text}"\n`);

  const result = await recognizer.recognize(text);

  console.log('Entities found:');
  for (const entity of result.entities) {
    console.log(EntityUtils.format(entity));
  }
}

/**
 * Extract specific entity types
 */
async function extractSpecificEntities() {
  console.log('\n=== Extract Specific Entity Types ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = `
    Microsoft CEO Satya Nadella spoke at the Technology Summit in Seattle.
    The event was attended by representatives from Google, Amazon, and Meta.
    Topics included AI, cloud computing, and the future of work.
    The summit raised $5 million for tech education initiatives.
  `;

  console.log('Extracting people...');
  const people = await recognizer.extractPeople(text);
  console.log(people.map(e => e.text).join(', '), '\n');

  console.log('Extracting organizations...');
  const orgs = await recognizer.extractOrganizations(text);
  console.log(orgs.map(e => e.text).join(', '), '\n');

  console.log('Extracting locations...');
  const locations = await recognizer.extractLocations(text);
  console.log(locations.map(e => e.text).join(', '), '\n');

  console.log('Extracting money...');
  const money = await recognizer.extractMoney(text);
  console.log(money.map(e => e.text).join(', '));
}

/**
 * Group entities by type
 */
async function groupEntitiesByType() {
  console.log('\n=== Group Entities by Type ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = `
    The United Nations held a conference in New York City yesterday.
    President Biden and Prime Minister Trudeau discussed climate change.
    The European Union committed €100 billion to renewable energy.
  `;

  const groups = await recognizer.groupByType(text);

  console.log('Entities grouped by type:\n');
  for (const [type, entities] of groups) {
    console.log(`${type}:`);
    for (const entity of entities) {
      console.log(`  - ${entity.text}`);
    }
    console.log();
  }
}

/**
 * Batch NER processing
 */
async function batchNER() {
  console.log('\n=== Batch NER Processing ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const articles = [
    "Tesla CEO Elon Musk announced record deliveries for Q4 2024.",
    "Amazon opened a new warehouse in Dallas, creating 1,000 jobs.",
    "Apple launched the iPhone 15 at an event in Cupertino.",
    "Google invested $2 billion in AI research facilities.",
    "Meta's Mark Zuckerberg testified before Congress on Tuesday."
  ];

  console.log(`Processing ${articles.length} articles...\n`);

  const results = await recognizer.recognizeBatch(articles, {
    batchSize: 2,
    showProgress: true,
    parallel: true
  });

  console.log('\nExtracted Entities:');
  for (let i = 0; i < results.length; i++) {
    console.log(`\nArticle ${i + 1}: "${articles[i]}"`);
    console.log('Entities:', results[i].entities.map(e => e.text).join(', '));
  }
}

/**
 * Entity context extraction
 */
async function entityContext() {
  console.log('\n=== Entity Context Extraction ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = `
    In a groundbreaking announcement, Dr. Sarah Johnson from Stanford University
    revealed that their research team has developed a new treatment for
    Alzheimer's disease. The study, published in Nature Medicine, shows
    promising results in clinical trials conducted at Johns Hopkins Hospital.
  `;

  const entitiesWithContext = await recognizer.getEntitiesWithContext(text, 30);

  console.log('Entities with surrounding context:\n');
  for (const entity of entitiesWithContext) {
    console.log(`Entity: ${entity.text} [${entity.label}]`);
    console.log(`Context: ...${entity.context}...`);
    console.log();
  }
}

/**
 * Most common entities
 */
async function mostCommonEntities() {
  console.log('\n=== Most Common Entities ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = `
    Microsoft announced a partnership with OpenAI to develop new AI models.
    Microsoft's Azure cloud platform will host the OpenAI models.
    Sam Altman, CEO of OpenAI, praised Microsoft's commitment to AI.
    The Microsoft-OpenAI collaboration includes investment in compute resources.
    Microsoft President Brad Smith welcomed the OpenAI partnership.
  `;

  const mostCommon = await recognizer.getMostCommon(text, 5);

  console.log('Top 5 most mentioned entities:\n');
  for (const item of mostCommon) {
    console.log(`${item.entity} (${item.label}): ${item.count} times`);
  }
}

/**
 * Highlight entities in text
 */
async function highlightEntities() {
  console.log('\n=== Highlight Entities ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = "Jeff Bezos founded Amazon in Seattle in 1994.";

  console.log('Original text:');
  console.log(text, '\n');

  // Highlight with markdown bold
  const highlighted = await recognizer.highlight(text, (entity) => {
    return `**${entity.text}** [${entity.label}]`;
  });

  console.log('Highlighted text:');
  console.log(highlighted);
}

/**
 * Relationship extraction
 */
async function relationshipExtraction() {
  console.log('\n=== Relationship Extraction ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const text = "Elon Musk founded Tesla. Tesla manufactures electric vehicles.";

  console.log(`Text: "${text}"\n`);

  const relationships = await recognizer.extractRelationships(text);

  console.log('Extracted relationships:');
  for (const rel of relationships) {
    console.log(`${rel.subject.text} --[${rel.predicate}]--> ${rel.object.text}`);
  }
}

/**
 * News article analysis
 */
async function newsArticleAnalysis() {
  console.log('\n=== News Article Analysis ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const article = `
    Tech Giant Announces Major Expansion

    SAN FRANCISCO - Tech giant Apple Inc. announced plans to invest $430 billion
    in the United States over the next five years. CEO Tim Cook made the
    announcement at the company's headquarters in Cupertino, California.

    The investment will create 20,000 new jobs across the country, with major
    facilities planned for North Carolina, Arizona, and Texas. The company will
    also increase its spending with U.S. suppliers to over $80 billion annually.

    "We're deeply committed to investing in innovation and American ingenuity,"
    Cook said at the press conference on Monday.

    The announcement comes as other tech companies like Google and Microsoft
    are also expanding their U.S. operations. Industry analysts predict this
    could create over 100,000 jobs in the tech sector by 2025.
  `;

  console.log('Analyzing news article...\n');

  const result = await recognizer.recognize(article);

  // Extract key information
  const companies = result.entities.filter(e => e.label === 'ORG');
  const people = result.entities.filter(e => e.label === 'PERSON');
  const locations = result.entities.filter(e => e.label === 'GPE');
  const money = result.entities.filter(e => e.label === 'MONEY');
  const dates = result.entities.filter(e => e.label === 'DATE');

  console.log('Key Information Extracted:');
  console.log('\nCompanies mentioned:', EntityUtils.getUnique(companies).join(', '));
  console.log('People mentioned:', EntityUtils.getUnique(people).join(', '));
  console.log('Locations mentioned:', EntityUtils.getUnique(locations).join(', '));
  console.log('Financial figures:', EntityUtils.getUnique(money).join(', '));
  console.log('Dates mentioned:', EntityUtils.getUnique(dates).join(', '));

  console.log(`\nTotal entities: ${result.entities.length}`);
}

/**
 * Document intelligence
 */
async function documentIntelligence() {
  console.log('\n=== Document Intelligence ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const contract = `
    EMPLOYMENT AGREEMENT

    This Employment Agreement is entered into on January 15, 2024, between
    TechCorp Inc., a Delaware corporation ("Company"), and John Smith ("Employee").

    Position: Senior Software Engineer
    Salary: $150,000 per year
    Start Date: February 1, 2024
    Location: San Francisco, California

    The Employee will report to Jane Doe, VP of Engineering.
  `;

  console.log('Extracting information from employment contract...\n');

  const result = await recognizer.recognize(contract);

  const info = {
    company: result.entities.find(e => e.label === 'ORG')?.text || 'N/A',
    employee: result.entities.find(e => e.label === 'PERSON' && e.text === 'John Smith')?.text || 'N/A',
    manager: result.entities.find(e => e.label === 'PERSON' && e.text === 'Jane Doe')?.text || 'N/A',
    location: result.entities.find(e => e.label === 'GPE')?.text || 'N/A',
    salary: result.entities.find(e => e.label === 'MONEY')?.text || 'N/A',
    date: result.entities.find(e => e.label === 'DATE')?.text || 'N/A'
  };

  console.log('Extracted Information:');
  console.log(`Company: ${info.company}`);
  console.log(`Employee: ${info.employee}`);
  console.log(`Manager: ${info.manager}`);
  console.log(`Location: ${info.location}`);
  console.log(`Salary: ${info.salary}`);
  console.log(`Date: ${info.date}`);
}

/**
 * Entity statistics
 */
async function entityStatistics() {
  console.log('\n=== Entity Statistics ===\n');

  const recognizer = new EntityRecognizer('en_core_web_sm');

  const texts = [
    "Apple announced new products in California.",
    "Microsoft opened an office in Seattle.",
    "Google invested in renewable energy.",
    "Amazon expanded operations in Texas.",
    "Meta hired 500 engineers in New York."
  ];

  const allResults = await recognizer.recognizeBatch(texts);

  const allEntities = allResults.flatMap(r => r.entities);
  const counts = EntityUtils.countByType(allEntities);

  console.log('Entity Type Distribution:\n');
  for (const [type, count] of counts) {
    const percentage = (count / allEntities.length * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`${type.padEnd(10)}: ${bar} ${count} (${percentage}%)`);
  }

  console.log(`\nTotal entities: ${allEntities.length}`);
  console.log(`Unique entity texts: ${EntityUtils.getUnique(allEntities).length}`);
}

/**
 * Main demo function
 */
async function main() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║           NER Demo - Elide NLP         ║');
  console.log('║   Powered by Elide Polyglot + spaCy    ║');
  console.log('╚════════════════════════════════════════╝\n');

  try {
    await basicNER();
    await extractSpecificEntities();
    await groupEntitiesByType();
    await batchNER();
    await entityContext();
    await mostCommonEntities();
    await highlightEntities();
    await relationshipExtraction();
    await newsArticleAnalysis();
    await documentIntelligence();
    await entityStatistics();

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
  basicNER,
  extractSpecificEntities,
  groupEntitiesByType,
  batchNER,
  entityContext,
  mostCommonEntities,
  highlightEntities,
  relationshipExtraction,
  newsArticleAnalysis,
  documentIntelligence,
  entityStatistics
};
