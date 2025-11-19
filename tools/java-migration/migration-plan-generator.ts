/**
 * Migration Plan Generator
 *
 * Generates comprehensive migration plans for moving Java/Spring applications to Elide,
 * including phases, effort estimates, checklists, and recommended approaches.
 */

import * as fs from 'fs';
import * as path from 'path';
import { MigrationReport, SpringPattern } from './analyzer';

export interface MigrationPhase {
  name: string;
  description: string;
  duration: string;
  tasks: MigrationTask[];
  dependencies: string[];
  risks: string[];
}

export interface MigrationTask {
  id: string;
  title: string;
  description: string;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'setup' | 'code' | 'data' | 'testing' | 'deployment';
  completed: boolean;
}

export interface MigrationApproach {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  recommendedFor: string[];
  timeline: string;
}

export interface MigrationPlan {
  projectName: string;
  generatedAt: Date;
  approach: MigrationApproach;
  phases: MigrationPhase[];
  totalEstimate: string;
  checklist: MigrationTask[];
  risks: string[];
  recommendations: string[];
}

/**
 * Migration Plan Generator
 */
export class MigrationPlanGenerator {
  constructor(private report: MigrationReport) {}

  /**
   * Generate complete migration plan
   */
  generate(): MigrationPlan {
    const approach = this.selectApproach();
    const phases = this.generatePhases(approach);
    const checklist = this.generateChecklist();
    const risks = this.identifyRisks();
    const recommendations = this.generateRecommendations();
    const totalEstimate = this.calculateTotalEstimate(phases);

    return {
      projectName: this.report.projectName,
      generatedAt: new Date(),
      approach,
      phases,
      totalEstimate,
      checklist,
      risks,
      recommendations,
    };
  }

  /**
   * Select migration approach based on project complexity
   */
  private selectApproach(): MigrationApproach {
    const approaches: MigrationApproach[] = [
      {
        name: 'Big Bang Migration',
        description: 'Complete rewrite in one go, replace entire Spring application with Elide',
        pros: [
          'Clean start with modern architecture',
          'No need to maintain two systems',
          'Faster overall completion',
          'Easier to implement best practices from scratch',
        ],
        cons: [
          'Higher risk of failures',
          'Longer downtime',
          'Difficult to rollback',
          'Requires complete testing before deployment',
        ],
        recommendedFor: [
          'Small to medium projects',
          'Projects with low complexity',
          'Projects with good test coverage',
          'New or recently started projects',
        ],
        timeline: '2-8 weeks',
      },
      {
        name: 'Strangler Fig Pattern',
        description: 'Gradually replace Spring components with Elide, running both in parallel',
        pros: [
          'Lower risk - incremental changes',
          'Can rollback individual components',
          'Continuous delivery possible',
          'Team can learn gradually',
        ],
        cons: [
          'More complex deployment',
          'Need to maintain both systems temporarily',
          'Longer overall timeline',
          'Requires careful API versioning',
        ],
        recommendedFor: [
          'Large, complex projects',
          'Production systems with high uptime requirements',
          'Projects with many dependencies',
          'Teams new to Elide',
        ],
        timeline: '3-6 months',
      },
      {
        name: 'Bridge Pattern',
        description: 'Use spring-bridge.ts to make Elide compatible with Spring APIs',
        pros: [
          'Minimal code changes required',
          'Quick initial migration',
          'Preserve existing patterns',
          'Easiest for team adoption',
        ],
        cons: [
          'Not using Elide idiomatically',
          'May miss performance benefits',
          'Technical debt remains',
          'Future refactoring needed',
        ],
        recommendedFor: [
          'Projects needing quick migration',
          'Legacy systems with complex Spring usage',
          'Teams with limited resources',
          'Proof of concept migrations',
        ],
        timeline: '1-4 weeks',
      },
    ];

    // Select based on complexity
    if (this.report.complexity === 'low') {
      return approaches[0]; // Big Bang
    } else if (this.report.complexity === 'high') {
      return approaches[1]; // Strangler Fig
    } else {
      // Medium complexity - consider file count
      if (this.report.totalFiles < 30) {
        return approaches[0]; // Big Bang
      } else {
        return approaches[1]; // Strangler Fig
      }
    }
  }

  /**
   * Generate migration phases
   */
  private generatePhases(approach: MigrationApproach): MigrationPhase[] {
    if (approach.name === 'Big Bang Migration') {
      return this.generateBigBangPhases();
    } else if (approach.name === 'Strangler Fig Pattern') {
      return this.generateStranglerPhases();
    } else {
      return this.generateBridgePhases();
    }
  }

  /**
   * Generate phases for Big Bang approach
   */
  private generateBigBangPhases(): MigrationPhase[] {
    return [
      {
        name: 'Phase 1: Preparation',
        description: 'Set up Elide project and analyze existing code',
        duration: '3-5 days',
        tasks: [
          this.createTask('setup-elide', 'Initialize Elide project', 'Set up new Elide project with proper structure', 'low', 'critical', 'setup'),
          this.createTask('analyze-code', 'Run code analyzer', 'Use analyzer.ts to understand current codebase', 'low', 'critical', 'setup'),
          this.createTask('identify-deps', 'Identify dependencies', 'Map out all external dependencies and libraries', 'medium', 'high', 'setup'),
          this.createTask('backup', 'Backup current system', 'Create complete backup of existing application', 'low', 'critical', 'setup'),
        ],
        dependencies: [],
        risks: ['Incomplete analysis', 'Missing dependencies'],
      },
      {
        name: 'Phase 2: Data Layer Migration',
        description: 'Convert JPA entities and repositories',
        duration: '1-2 weeks',
        tasks: [
          this.createTask('convert-entities', 'Convert JPA entities', 'Convert all @Entity classes to Elide data models', 'high', 'critical', 'code'),
          this.createTask('setup-database', 'Configure database', 'Set up database connection in Elide', 'medium', 'critical', 'data'),
          this.createTask('migrate-repos', 'Migrate repositories', 'Convert Spring Data repositories', 'high', 'high', 'code'),
          this.createTask('test-data-layer', 'Test data access', 'Write and run tests for data layer', 'medium', 'critical', 'testing'),
        ],
        dependencies: ['Phase 1'],
        risks: ['Data model incompatibilities', 'Transaction handling differences'],
      },
      {
        name: 'Phase 3: Business Logic Migration',
        description: 'Convert services and business logic',
        duration: '1-3 weeks',
        tasks: [
          this.createTask('convert-services', 'Convert @Service classes', 'Migrate all Spring services to Elide', 'high', 'critical', 'code'),
          this.createTask('dependency-injection', 'Set up DI', 'Configure Elide dependency injection', 'medium', 'high', 'code'),
          this.createTask('transaction-mgmt', 'Implement transactions', 'Set up transaction management', 'high', 'high', 'code'),
          this.createTask('test-services', 'Test business logic', 'Unit test all migrated services', 'high', 'critical', 'testing'),
        ],
        dependencies: ['Phase 2'],
        risks: ['Complex business logic', 'Transaction boundaries'],
      },
      {
        name: 'Phase 4: API Layer Migration',
        description: 'Convert REST controllers to Elide handlers',
        duration: '1-2 weeks',
        tasks: [
          this.createTask('convert-controllers', 'Convert @RestController', 'Migrate all REST endpoints to Elide HTTP handlers', 'high', 'critical', 'code'),
          this.createTask('request-validation', 'Implement validation', 'Add request/response validation', 'medium', 'high', 'code'),
          this.createTask('error-handling', 'Error handling', 'Implement consistent error handling', 'medium', 'high', 'code'),
          this.createTask('api-docs', 'Update API docs', 'Document all API endpoints', 'low', 'medium', 'code'),
        ],
        dependencies: ['Phase 3'],
        risks: ['API contract changes', 'Breaking changes for clients'],
      },
      {
        name: 'Phase 5: Testing & Deployment',
        description: 'Comprehensive testing and production deployment',
        duration: '1-2 weeks',
        tasks: [
          this.createTask('integration-tests', 'Integration testing', 'Run full integration test suite', 'high', 'critical', 'testing'),
          this.createTask('performance-tests', 'Performance testing', 'Load test and benchmark', 'medium', 'high', 'testing'),
          this.createTask('staging-deploy', 'Deploy to staging', 'Deploy to staging environment', 'medium', 'critical', 'deployment'),
          this.createTask('smoke-tests', 'Smoke testing', 'Run smoke tests in staging', 'medium', 'critical', 'testing'),
          this.createTask('prod-deploy', 'Production deployment', 'Deploy to production', 'low', 'critical', 'deployment'),
          this.createTask('monitoring', 'Set up monitoring', 'Configure monitoring and alerts', 'medium', 'high', 'deployment'),
        ],
        dependencies: ['Phase 4'],
        risks: ['Production issues', 'Performance degradation', 'Rollback complexity'],
      },
    ];
  }

  /**
   * Generate phases for Strangler Fig approach
   */
  private generateStranglerPhases(): MigrationPhase[] {
    return [
      {
        name: 'Phase 1: Setup & Planning',
        description: 'Prepare infrastructure for parallel systems',
        duration: '1 week',
        tasks: [
          this.createTask('setup-proxy', 'Set up routing proxy', 'Configure proxy to route between Spring and Elide', 'medium', 'critical', 'setup'),
          this.createTask('identify-boundaries', 'Identify service boundaries', 'Determine which components to migrate first', 'high', 'critical', 'setup'),
          this.createTask('setup-elide', 'Initialize Elide project', 'Create Elide project structure', 'low', 'critical', 'setup'),
        ],
        dependencies: [],
        risks: ['Proxy configuration issues', 'Routing complexity'],
      },
      {
        name: 'Phase 2: Migrate Read Operations',
        description: 'Start with read-only endpoints (lowest risk)',
        duration: '2-3 weeks',
        tasks: [
          this.createTask('migrate-get-endpoints', 'Migrate GET endpoints', 'Convert read-only controllers first', 'high', 'high', 'code'),
          this.createTask('dual-read', 'Dual read testing', 'Test both systems return same data', 'high', 'critical', 'testing'),
          this.createTask('route-reads', 'Route read traffic', 'Gradually shift GET requests to Elide', 'medium', 'high', 'deployment'),
        ],
        dependencies: ['Phase 1'],
        risks: ['Data inconsistencies', 'Response format differences'],
      },
      {
        name: 'Phase 3: Migrate Write Operations',
        description: 'Move write operations to Elide',
        duration: '3-4 weeks',
        tasks: [
          this.createTask('migrate-post-endpoints', 'Migrate POST endpoints', 'Convert create operations', 'high', 'critical', 'code'),
          this.createTask('migrate-put-endpoints', 'Migrate PUT endpoints', 'Convert update operations', 'high', 'critical', 'code'),
          this.createTask('migrate-delete-endpoints', 'Migrate DELETE endpoints', 'Convert delete operations', 'high', 'critical', 'code'),
          this.createTask('dual-write', 'Implement dual-write', 'Write to both systems temporarily', 'high', 'critical', 'code'),
        ],
        dependencies: ['Phase 2'],
        risks: ['Data synchronization issues', 'Transaction consistency'],
      },
      {
        name: 'Phase 4: Decommission Spring',
        description: 'Remove Spring application once Elide is fully operational',
        duration: '1-2 weeks',
        tasks: [
          this.createTask('remove-dual-write', 'Remove dual-write', 'Stop writing to Spring system', 'medium', 'critical', 'code'),
          this.createTask('route-all-traffic', 'Route all traffic', 'Direct 100% traffic to Elide', 'medium', 'critical', 'deployment'),
          this.createTask('monitor-production', 'Monitor production', 'Watch for issues for 1 week', 'low', 'critical', 'deployment'),
          this.createTask('remove-spring', 'Remove Spring code', 'Delete old Spring application', 'low', 'medium', 'code'),
        ],
        dependencies: ['Phase 3'],
        risks: ['Hidden dependencies', 'Rollback difficulties'],
      },
    ];
  }

  /**
   * Generate phases for Bridge approach
   */
  private generateBridgePhases(): MigrationPhase[] {
    return [
      {
        name: 'Phase 1: Bridge Setup',
        description: 'Set up Spring compatibility layer',
        duration: '3-5 days',
        tasks: [
          this.createTask('install-bridge', 'Install spring-bridge', 'Add spring-bridge.ts to project', 'low', 'critical', 'setup'),
          this.createTask('configure-di', 'Configure DI container', 'Set up dependency injection bridge', 'medium', 'critical', 'setup'),
          this.createTask('test-bridge', 'Test bridge', 'Verify Spring decorators work', 'medium', 'critical', 'testing'),
        ],
        dependencies: [],
        risks: ['Bridge incompatibilities', 'Missing features'],
      },
      {
        name: 'Phase 2: Minimal Migration',
        description: 'Move code to Elide with minimal changes',
        duration: '1-2 weeks',
        tasks: [
          this.createTask('copy-code', 'Copy Java code', 'Copy and convert code to TypeScript', 'high', 'critical', 'code'),
          this.createTask('add-decorators', 'Update decorators', 'Replace Spring imports with bridge', 'medium', 'high', 'code'),
          this.createTask('test-compatibility', 'Test compatibility', 'Verify all features work', 'high', 'critical', 'testing'),
        ],
        dependencies: ['Phase 1'],
        risks: ['Subtle behavior differences', 'Runtime errors'],
      },
      {
        name: 'Phase 3: Gradual Modernization',
        description: 'Incrementally replace bridge with native Elide',
        duration: 'Ongoing',
        tasks: [
          this.createTask('refactor-controllers', 'Refactor controllers', 'Replace bridge controllers with native handlers', 'medium', 'low', 'code'),
          this.createTask('refactor-services', 'Refactor services', 'Update services to use Elide patterns', 'medium', 'low', 'code'),
          this.createTask('remove-bridge', 'Remove bridge dependencies', 'Gradually remove bridge code', 'low', 'low', 'code'),
        ],
        dependencies: ['Phase 2'],
        risks: ['Technical debt accumulation', 'Team resistance to change'],
      },
    ];
  }

  /**
   * Generate master checklist
   */
  private generateChecklist(): MigrationTask[] {
    const checklist: MigrationTask[] = [];

    // Pre-migration
    checklist.push(
      this.createTask('backup-db', 'Backup production database', 'Create full database backup', 'low', 'critical', 'setup'),
      this.createTask('backup-code', 'Backup code repository', 'Tag current version in git', 'low', 'critical', 'setup'),
      this.createTask('document-apis', 'Document existing APIs', 'Document all API contracts', 'medium', 'high', 'setup'),
      this.createTask('list-integrations', 'List integrations', 'Identify all external integrations', 'low', 'high', 'setup')
    );

    // During migration
    checklist.push(
      this.createTask('maintain-tests', 'Maintain test coverage', 'Keep tests passing throughout migration', 'high', 'critical', 'testing'),
      this.createTask('api-compat', 'Maintain API compatibility', 'Ensure no breaking changes to APIs', 'high', 'critical', 'code'),
      this.createTask('incremental-commits', 'Incremental commits', 'Commit working code frequently', 'low', 'high', 'code'),
      this.createTask('peer-review', 'Peer review', 'Review all migration code', 'medium', 'high', 'code')
    );

    // Post-migration
    checklist.push(
      this.createTask('smoke-test-prod', 'Smoke test production', 'Verify critical paths work', 'medium', 'critical', 'testing'),
      this.createTask('monitor-errors', 'Monitor error rates', 'Watch error logs for 48 hours', 'low', 'critical', 'deployment'),
      this.createTask('performance-baseline', 'Check performance', 'Compare performance metrics', 'medium', 'high', 'testing'),
      this.createTask('update-docs', 'Update documentation', 'Update all technical documentation', 'low', 'medium', 'code'),
      this.createTask('team-training', 'Train team', 'Conduct Elide training sessions', 'medium', 'high', 'setup')
    );

    return checklist;
  }

  /**
   * Identify migration risks
   */
  private identifyRisks(): string[] {
    const risks: string[] = [];

    // Complexity-based risks
    if (this.report.complexity === 'high') {
      risks.push('High complexity may lead to longer timeline and more issues');
      risks.push('Extensive testing required due to complex business logic');
    }

    // Pattern-based risks
    const controllers = this.report.springPatterns.filter(p => p.type === 'controller');
    if (controllers.length > 20) {
      risks.push(`Large number of controllers (${controllers.length}) increases migration effort`);
    }

    const entities = this.report.springPatterns.filter(p => p.type === 'entity');
    if (entities.length > 30) {
      risks.push(`Complex data model (${entities.length} entities) may have migration challenges`);
    }

    // Dependency risks
    const hasComplexDeps = this.report.dependencies.some(d =>
      d.artifactId.includes('security') ||
      d.artifactId.includes('oauth') ||
      d.artifactId.includes('actuator')
    );

    if (hasComplexDeps) {
      risks.push('Complex Spring dependencies (security, OAuth) require careful migration');
    }

    // General risks
    risks.push('API contract changes may affect clients');
    risks.push('Database schema changes may require migration scripts');
    risks.push('Performance characteristics may differ - benchmark required');
    risks.push('Team learning curve for Elide framework');

    return risks;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    recommendations.push('Start with comprehensive test coverage before migration');
    recommendations.push('Use version control branches for experimental conversions');
    recommendations.push('Migrate non-critical components first to build confidence');
    recommendations.push('Set up monitoring before switching production traffic');
    recommendations.push('Have a rollback plan ready for each phase');
    recommendations.push('Document all decisions and changes during migration');
    recommendations.push('Consider feature flags for gradual rollout');
    recommendations.push('Keep the team informed with regular migration updates');

    return recommendations;
  }

  /**
   * Calculate total estimate
   */
  private calculateTotalEstimate(phases: MigrationPhase[]): string {
    // This is a simplified calculation
    // In reality, you'd parse duration strings and sum them
    return `${phases.length * 2} - ${phases.length * 4} weeks`;
  }

  /**
   * Helper to create task
   */
  private createTask(
    id: string,
    title: string,
    description: string,
    effort: 'low' | 'medium' | 'high',
    priority: 'low' | 'medium' | 'high' | 'critical',
    category: 'setup' | 'code' | 'data' | 'testing' | 'deployment'
  ): MigrationTask {
    return {
      id,
      title,
      description,
      effort,
      priority,
      category,
      completed: false,
    };
  }

  /**
   * Export plan to various formats
   */
  exportToMarkdown(plan: MigrationPlan): string {
    let md = `# Migration Plan: ${plan.projectName}\n\n`;
    md += `**Generated:** ${plan.generatedAt.toISOString()}\n\n`;

    // Approach
    md += `## Recommended Approach: ${plan.approach.name}\n\n`;
    md += `${plan.approach.description}\n\n`;
    md += `**Timeline:** ${plan.approach.timeline}\n\n`;

    md += `### Pros\n`;
    plan.approach.pros.forEach(pro => {
      md += `- ${pro}\n`;
    });

    md += `\n### Cons\n`;
    plan.approach.cons.forEach(con => {
      md += `- ${con}\n`;
    });

    // Phases
    md += `\n## Migration Phases\n\n`;
    md += `**Total Estimate:** ${plan.totalEstimate}\n\n`;

    plan.phases.forEach((phase, index) => {
      md += `### ${phase.name}\n\n`;
      md += `${phase.description}\n\n`;
      md += `**Duration:** ${phase.duration}\n\n`;

      if (phase.dependencies.length > 0) {
        md += `**Dependencies:** ${phase.dependencies.join(', ')}\n\n`;
      }

      md += `#### Tasks\n\n`;
      phase.tasks.forEach(task => {
        md += `- [ ] **${task.title}** (${task.effort} effort, ${task.priority} priority)\n`;
        md += `  ${task.description}\n\n`;
      });

      if (phase.risks.length > 0) {
        md += `#### Risks\n\n`;
        phase.risks.forEach(risk => {
          md += `- ⚠️  ${risk}\n`;
        });
        md += `\n`;
      }
    });

    // Checklist
    md += `## Master Checklist\n\n`;
    const categories = ['setup', 'code', 'data', 'testing', 'deployment'];

    categories.forEach(category => {
      const tasks = plan.checklist.filter(t => t.category === category);
      if (tasks.length > 0) {
        md += `### ${this.capitalize(category)}\n\n`;
        tasks.forEach(task => {
          md += `- [ ] ${task.title}\n`;
        });
        md += `\n`;
      }
    });

    // Risks
    md += `## Risks & Mitigation\n\n`;
    plan.risks.forEach(risk => {
      md += `- ⚠️  ${risk}\n`;
    });

    // Recommendations
    md += `\n## Recommendations\n\n`;
    plan.recommendations.forEach(rec => {
      md += `- 💡 ${rec}\n`;
    });

    return md;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

/**
 * CLI entry point
 */
export async function generateMigrationPlan(analysisPath: string, outputPath?: string): Promise<void> {
  // Load analysis report
  const reportData = fs.readFileSync(analysisPath, 'utf-8');
  const report: MigrationReport = JSON.parse(reportData);

  // Generate plan
  const generator = new MigrationPlanGenerator(report);
  const plan = generator.generate();

  // Export to markdown
  const markdown = generator.exportToMarkdown(plan);

  // Save plan
  const output = outputPath || path.join(path.dirname(analysisPath), 'migration-plan.md');
  fs.writeFileSync(output, markdown);

  console.log(`\n✓ Migration plan generated: ${output}`);
  console.log(`\nApproach: ${plan.approach.name}`);
  console.log(`Timeline: ${plan.totalEstimate}`);
  console.log(`Phases: ${plan.phases.length}`);
  console.log(`Tasks: ${plan.checklist.length}`);

  // Also save JSON version
  const jsonOutput = output.replace('.md', '.json');
  fs.writeFileSync(jsonOutput, JSON.stringify(plan, null, 2));
  console.log(`JSON plan: ${jsonOutput}`);
}

// Run if called directly
if (require.main === module) {
  const analysisPath = process.argv[2];
  if (!analysisPath) {
    console.error('Usage: ts-node migration-plan-generator.ts <analysis-report.json>');
    process.exit(1);
  }

  generateMigrationPlan(analysisPath).catch(console.error);
}
