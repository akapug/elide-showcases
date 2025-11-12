/**
 * Java Migration Tools for Elide
 *
 * Comprehensive toolkit for migrating Java/Spring applications to Elide.
 */

// Analyzer exports
export {
  JavaProjectAnalyzer,
  analyzeProject,
  type JavaFile,
  type MethodInfo,
  type FieldInfo,
  type SpringPattern,
  type DependencyInfo,
  type MigrationReport,
} from './analyzer';

// Converter exports
export {
  JavaConverter,
  convertFiles,
  type TargetLanguage,
  type ConversionOptions,
  type ConversionResult,
} from './converter';

// Spring Bridge exports
export {
  Component,
  Service,
  Repository,
  RestController,
  Controller,
  Autowired,
  GetMapping,
  PostMapping,
  PutMapping,
  DeleteMapping,
  PatchMapping,
  RequestMapping,
  PathVariable,
  RequestParam,
  RequestBody,
  RequestHeader,
  Configuration,
  Bean,
  Value,
  Transactional,
  ResponseEntity,
  HttpStatus,
  DependencyContainer,
  SpringBridgeRouter,
  createSpringApplication,
  type RouteInfo,
} from './spring-bridge';

// JPA Bridge exports
export {
  Entity,
  Table,
  Column,
  Id,
  GeneratedValue,
  NamedQuery,
  getNamedQuery,
  EntityManager,
  createEntityManager,
  withTransaction,
  Transaction,
  TransactionManager,
  TransactionTemplate,
  JpaRepository,
  type IEntityManager,
  type Query,
  type CrudRepository,
  type PagingAndSortingRepository,
  type Page,
  type Pageable,
  type Sort,
  type SortOrder,
  type Specification,
  type CriteriaBuilder,
} from './jpa-bridge';

// Migration Plan Generator exports
export {
  MigrationPlanGenerator,
  generateMigrationPlan,
  type MigrationPhase,
  type MigrationTask,
  type MigrationApproach,
  type MigrationPlan,
} from './migration-plan-generator';

/**
 * Quick start migration workflow
 */
export async function quickMigrate(javaProjectPath: string, outputDir: string = './migrated') {
  const { JavaProjectAnalyzer } = await import('./analyzer');
  const { JavaConverter } = await import('./converter');
  const { MigrationPlanGenerator } = await import('./migration-plan-generator');

  console.log('🔍 Analyzing Java project...');
  const analyzer = new JavaProjectAnalyzer(javaProjectPath);
  const report = await analyzer.analyze();

  console.log('📋 Generating migration plan...');
  const planGenerator = new MigrationPlanGenerator(report);
  const plan = planGenerator.generate();
  const planMarkdown = planGenerator.exportToMarkdown(plan);

  console.log('🔄 Converting Java files to TypeScript...');
  const converter = new JavaConverter({
    targetLanguage: 'typescript',
    convertSpringToElide: true,
    outputDir,
  });

  const results = [];
  for (const javaFile of report.javaFiles) {
    const result = await converter.convertFile(javaFile);
    results.push(result);
  }

  return {
    report,
    plan,
    planMarkdown,
    conversionResults: results,
  };
}

/**
 * Incremental migration workflow
 */
export async function incrementalMigrate(
  javaProjectPath: string,
  filesToMigrate: string[],
  outputDir: string = './migrated'
) {
  const { JavaProjectAnalyzer } = await import('./analyzer');
  const { JavaConverter } = await import('./converter');

  console.log('🔍 Analyzing selected files...');
  const analyzer = new JavaProjectAnalyzer(javaProjectPath);
  const report = await analyzer.analyze();

  // Filter to only selected files
  const selectedFiles = report.javaFiles.filter(f =>
    filesToMigrate.some(pattern => f.path.includes(pattern))
  );

  console.log(`🔄 Converting ${selectedFiles.length} files...`);
  const converter = new JavaConverter({
    targetLanguage: 'typescript',
    convertSpringToElide: true,
    outputDir,
  });

  const results = [];
  for (const javaFile of selectedFiles) {
    const result = await converter.convertFile(javaFile);
    results.push(result);
  }

  return {
    report,
    conversionResults: results,
  };
}

/**
 * Generate migration report only (no conversion)
 */
export async function generateReport(javaProjectPath: string, outputPath?: string) {
  const { JavaProjectAnalyzer } = await import('./analyzer');
  const { MigrationPlanGenerator } = await import('./migration-plan-generator');
  const fs = await import('fs');
  const path = await import('path');

  console.log('🔍 Analyzing Java project...');
  const analyzer = new JavaProjectAnalyzer(javaProjectPath);
  const report = await analyzer.analyze();

  console.log('📋 Generating migration plan...');
  const planGenerator = new MigrationPlanGenerator(report);
  const plan = planGenerator.generate();

  // Export reports
  const outputDir = outputPath || javaProjectPath;

  // Save JSON reports
  fs.writeFileSync(
    path.join(outputDir, 'migration-analysis.json'),
    JSON.stringify(report, null, 2)
  );

  fs.writeFileSync(
    path.join(outputDir, 'migration-plan.json'),
    JSON.stringify(plan, null, 2)
  );

  // Save Markdown plan
  const markdown = planGenerator.exportToMarkdown(plan);
  fs.writeFileSync(path.join(outputDir, 'migration-plan.md'), markdown);

  console.log(`✅ Reports generated in: ${outputDir}`);

  return { report, plan };
}

/**
 * Default export for CLI usage
 */
export default {
  quickMigrate,
  incrementalMigrate,
  generateReport,
};
