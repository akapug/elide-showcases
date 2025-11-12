#!/usr/bin/env node

/**
 * Java Migration Tools CLI
 *
 * Command-line interface for Java to Elide migration tools.
 */

import { parseArgs } from 'node:util';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMMANDS = {
  analyze: 'Analyze a Java project and generate migration report',
  convert: 'Convert Java files to TypeScript or Kotlin',
  plan: 'Generate a migration plan from analysis report',
  quick: 'Quick migration: analyze + plan + convert in one step',
  help: 'Show this help message',
} as const;

function showHelp() {
  console.log(`
Java Migration Tools for Elide

Usage: java-migration <command> [options]

Commands:
  analyze <project-path>              ${COMMANDS.analyze}
  convert <project-path> [options]    ${COMMANDS.convert}
  plan <analysis-json>                ${COMMANDS.plan}
  quick <project-path> [options]      ${COMMANDS.quick}
  help                                ${COMMANDS.help}

Options:
  --output, -o <dir>         Output directory (default: ./migrated)
  --target, -t <lang>        Target language: typescript or kotlin (default: typescript)
  --spring-bridge           Use Spring Bridge pattern (minimal changes)
  --files <pattern>         Convert only files matching pattern (incremental mode)

Examples:
  # Analyze a Java project
  java-migration analyze /path/to/java/project

  # Generate migration plan
  java-migration plan /path/to/migration-analysis.json

  # Quick migration (analyze + plan + convert)
  java-migration quick /path/to/java/project --output ./migrated

  # Convert with Spring Bridge
  java-migration convert /path/to/java/project --spring-bridge

  # Incremental migration (specific files only)
  java-migration convert /path/to/java/project --files "controller/**"

For more information, see README.md
  `);
}

async function runAnalyze(projectPath: string) {
  const { analyzeProject } = await import('./analyzer.js');

  console.log(`📊 Analyzing Java project: ${projectPath}\n`);

  try {
    await analyzeProject(projectPath);
    console.log('\n✅ Analysis complete!');
    console.log('\nNext steps:');
    console.log('  1. Review migration-analysis.json');
    console.log('  2. Run: java-migration plan migration-analysis.json');
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

async function runPlan(analysisPath: string) {
  const { generateMigrationPlan } = await import('./migration-plan-generator.js');

  console.log(`📋 Generating migration plan from: ${analysisPath}\n`);

  try {
    await generateMigrationPlan(analysisPath);
    console.log('\n✅ Migration plan generated!');
    console.log('\nNext steps:');
    console.log('  1. Review migration-plan.md');
    console.log('  2. Start migration with: java-migration convert <project-path>');
  } catch (error) {
    console.error('❌ Plan generation failed:', error);
    process.exit(1);
  }
}

async function runConvert(projectPath: string, options: any) {
  const { JavaProjectAnalyzer } = await import('./analyzer.js');
  const { JavaConverter, convertFiles } = await import('./converter.js');

  console.log(`🔄 Converting Java project: ${projectPath}\n`);

  try {
    // First analyze
    const analyzer = new JavaProjectAnalyzer(projectPath);
    const report = await analyzer.analyze();

    // Filter files if pattern specified
    let filesToConvert = report.javaFiles;
    if (options.files) {
      filesToConvert = report.javaFiles.filter(f =>
        f.path.includes(options.files)
      );
      console.log(`Filtered to ${filesToConvert.length} files matching: ${options.files}`);
    }

    // Convert files
    const results = await convertFiles(filesToConvert, {
      targetLanguage: options.target || 'typescript',
      convertSpringToElide: !options.springBridge,
      outputDir: options.output || './migrated',
    });

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`\n✅ Conversion complete!`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed files:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.originalFile}`);
        r.errors.forEach(err => console.log(`    Error: ${err}`));
      });
    }

    console.log(`\nOutput directory: ${options.output || './migrated'}`);
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

async function runQuick(projectPath: string, options: any) {
  const { quickMigrate } = await import('./index.js');
  const fs = await import('fs');

  console.log(`🚀 Quick migration: ${projectPath}\n`);

  try {
    const outputDir = options.output || './migrated';

    const result = await quickMigrate(projectPath, outputDir);

    // Save plan
    fs.writeFileSync(
      path.join(projectPath, 'migration-plan.md'),
      result.planMarkdown
    );

    // Summary
    const successful = result.conversionResults.filter(r => r.success).length;
    const failed = result.conversionResults.filter(r => !r.success).length;

    console.log(`\n✅ Quick migration complete!`);
    console.log(`\n📊 Analysis:`);
    console.log(`   Files analyzed: ${result.report.totalFiles}`);
    console.log(`   Complexity: ${result.report.complexity}`);
    console.log(`   Estimated effort: ${result.report.estimatedEffort}`);

    console.log(`\n🔄 Conversion:`);
    console.log(`   Successful: ${successful}`);
    console.log(`   Failed: ${failed}`);

    console.log(`\n📁 Output:`);
    console.log(`   Migrated code: ${outputDir}`);
    console.log(`   Analysis: ${projectPath}/migration-analysis.json`);
    console.log(`   Plan: ${projectPath}/migration-plan.md`);

    console.log('\nNext steps:');
    console.log('  1. Review migration-plan.md');
    console.log('  2. Check converted code for TODO comments');
    console.log('  3. Run tests');
    console.log('  4. Manual cleanup as needed');
  } catch (error) {
    console.error('❌ Quick migration failed:', error);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === 'help') {
    showHelp();
    return;
  }

  const command = args[0];
  const commandArgs = args.slice(1);

  // Parse options
  const options: any = {};
  for (let i = 0; i < commandArgs.length; i++) {
    const arg = commandArgs[i];
    if (arg === '--output' || arg === '-o') {
      options.output = commandArgs[++i];
    } else if (arg === '--target' || arg === '-t') {
      options.target = commandArgs[++i];
    } else if (arg === '--spring-bridge') {
      options.springBridge = true;
    } else if (arg === '--files') {
      options.files = commandArgs[++i];
    } else if (!options.path) {
      options.path = arg;
    }
  }

  switch (command) {
    case 'analyze':
      if (!options.path) {
        console.error('❌ Error: Project path required');
        console.log('Usage: java-migration analyze <project-path>');
        process.exit(1);
      }
      await runAnalyze(options.path);
      break;

    case 'convert':
      if (!options.path) {
        console.error('❌ Error: Project path required');
        console.log('Usage: java-migration convert <project-path> [options]');
        process.exit(1);
      }
      await runConvert(options.path, options);
      break;

    case 'plan':
      if (!options.path) {
        console.error('❌ Error: Analysis JSON path required');
        console.log('Usage: java-migration plan <analysis-json>');
        process.exit(1);
      }
      await runPlan(options.path);
      break;

    case 'quick':
      if (!options.path) {
        console.error('❌ Error: Project path required');
        console.log('Usage: java-migration quick <project-path> [options]');
        process.exit(1);
      }
      await runQuick(options.path, options);
      break;

    default:
      console.error(`❌ Error: Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

// Run CLI
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
