# Java Migration Tools for Elide

Comprehensive tools to help migrate Java/Spring applications to Elide framework.

## Overview

This toolkit provides automated analysis, conversion, and migration planning tools to help teams move from Java/Spring Boot applications to modern Elide-based TypeScript/Kotlin applications.

## Tools

### 1. analyzer.ts - Java Project Analyzer

Scans Java projects to identify Spring patterns, dependencies, and generate comprehensive migration reports.

**Features:**
- Scans Java source files recursively
- Identifies Spring annotations (@RestController, @Service, @Repository, etc.)
- Extracts JPA entities and relationships
- Parses Maven pom.xml and Gradle build files
- Calculates project complexity
- Estimates migration effort
- Generates actionable recommendations

**Usage:**

```bash
# Analyze a Java project
ts-node analyzer.ts /path/to/java/project

# Output: migration-analysis.json
```

**Example Output:**

```
=== Java Project Analysis Report ===

Project: my-spring-app
Build Tool: maven
Total Java Files: 45
Complexity: medium
Estimated Effort: 45 - 90 hours

--- Spring Patterns ---
  controller: 8
  service: 12
  repository: 6
  entity: 15

--- Key Dependencies ---
  org.springframework.boot:spring-boot-starter-web:2.7.0
  org.springframework.boot:spring-boot-starter-data-jpa:2.7.0
  org.postgresql:postgresql:42.5.0

--- Recommendations ---
  1. Found 8 Spring controllers - migrate to Elide HTTP handlers
  2. Found 12 Spring services - use Elide dependency injection
  3. Found 15 JPA entities - consider migrating to modern ORM
  ...
```

### 2. converter.ts - Java to Kotlin/TypeScript Converter

Converts Java classes to Kotlin or TypeScript, with special handling for Spring patterns.

**Features:**
- Convert Spring @RestController to Elide HTTP handlers
- Convert @Service classes to TypeScript/Kotlin services
- Convert JPA @Entity to TypeScript interfaces or Kotlin data classes
- Preserve business logic and comments
- Generate TODO comments for manual review
- Support for both Big Bang and incremental migration

**Usage:**

```bash
# Convert a single file
import { JavaConverter } from './converter';

const converter = new JavaConverter({
  targetLanguage: 'typescript', // or 'kotlin'
  convertSpringToElide: true,
  outputDir: './converted'
});

const result = await converter.convertFile(javaFile);
```

**Example Conversion:**

**Before (Java):**
```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    @GetMapping("/{id}")
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(userService.findById(id));
    }
}
```

**After (TypeScript):**
```typescript
export const getUser: Handler = async (req: HttpRequest): Promise<HttpResponse> => {
  const id = req.pathParams.get('id');
  const user = await userService.findById(parseInt(id));

  return new HttpResponse({
    status: Status.OK,
    body: JSON.stringify(user),
  });
};
```

### 3. spring-bridge.ts - Spring Compatibility Layer

Provides Spring-like decorators and APIs for gradual migration.

**Features:**
- @Component, @Service, @Repository decorators
- @RestController, @GetMapping, @PostMapping
- @Autowired dependency injection
- ResponseEntity wrapper
- Dependency injection container
- Compatible with Elide runtime

**Usage:**

```typescript
import {
  RestController,
  GetMapping,
  PostMapping,
  PathVariable,
  RequestBody,
  Autowired,
  ResponseEntity,
} from './spring-bridge';

@RestController('/api/users')
class UserController {
  @Autowired()
  private userService!: UserService;

  @GetMapping('/:id')
  async getUser(@PathVariable('id') id: string): Promise<ResponseEntity<User>> {
    const user = await this.userService.findById(parseInt(id));
    return ResponseEntity.ok(user);
  }
}
```

**Benefits:**
- Minimal code changes during migration
- Team can continue using familiar patterns
- Gradual refactoring to native Elide
- Lower risk, faster initial migration

### 4. jpa-bridge.ts - JPA Compatibility

JPA-like API for database operations in Elide.

**Features:**
- @Entity, @Table, @Column decorators
- EntityManager interface
- Repository pattern (JpaRepository)
- Transaction management
- Query building
- Compatible with TypeORM, Prisma, or custom implementations

**Usage:**

```typescript
import { Entity, Column, Id, GeneratedValue } from './jpa-bridge';

@Entity({ name: 'users' })
class User {
  @Id()
  @GeneratedValue('IDENTITY')
  id: number;

  @Column({ nullable: false })
  name: string;

  @Column({ unique: true })
  email: string;
}

// Using EntityManager
const em = createEntityManager();
const user = await em.find(User, 1);
await em.persist(newUser);
await em.flush();
```

### 5. migration-plan-generator.ts - Migration Plan Generator

Generates comprehensive migration plans with phases, tasks, and estimates.

**Features:**
- Analyzes project complexity
- Recommends migration approach (Big Bang, Strangler Fig, or Bridge)
- Generates phased migration plan
- Estimates effort and timeline
- Identifies risks and mitigation strategies
- Creates detailed checklist
- Exports to Markdown and JSON

**Usage:**

```bash
# Generate migration plan from analysis report
ts-node migration-plan-generator.ts migration-analysis.json

# Output: migration-plan.md and migration-plan.json
```

**Migration Approaches:**

1. **Big Bang Migration** (2-8 weeks)
   - Complete rewrite in one go
   - Best for: Small/medium projects, good test coverage
   - Phases: Preparation → Data Layer → Business Logic → API → Testing

2. **Strangler Fig Pattern** (3-6 months)
   - Gradual replacement, running both systems in parallel
   - Best for: Large projects, high uptime requirements
   - Phases: Setup → Read Operations → Write Operations → Decommission

3. **Bridge Pattern** (1-4 weeks)
   - Use spring-bridge.ts for compatibility
   - Best for: Quick migrations, legacy systems
   - Phases: Bridge Setup → Minimal Migration → Gradual Modernization

## Examples

The `examples/` directory contains detailed migration guides:

### 1. spring-boot-to-elide.md

Complete example of migrating a Spring Boot REST API to Elide, including:
- Original Spring Boot code (Controller, Service, Repository, Entity)
- Native Elide conversion (recommended approach)
- Spring Bridge conversion (quick migration)
- Side-by-side comparison
- Testing strategies

### 2. hibernate-to-modern-orm.md

Guide for migrating from Hibernate/JPA to modern ORMs:
- TypeORM (most JPA-like)
- Prisma (modern, type-safe)
- Drizzle ORM (lightweight, SQL-like)
- Comparison table and recommendations
- Complete code examples for each ORM

### 3. maven-to-elide-build.md

Comprehensive guide for migrating build systems:
- Maven pom.xml → package.json
- Gradle build.gradle → package.json
- Dependency mapping (Spring → Elide ecosystem)
- Build scripts comparison
- CI/CD migration (GitHub Actions)
- Docker configuration updates
- Complete migration checklist

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Or if you prefer pnpm
pnpm install
```

### Basic Workflow

```bash
# 1. Analyze your Java project
ts-node analyzer.ts /path/to/java/project

# 2. Review the analysis report
cat /path/to/java/project/migration-analysis.json

# 3. Generate migration plan
ts-node migration-plan-generator.ts /path/to/java/project/migration-analysis.json

# 4. Review migration plan
cat migration-plan.md

# 5. Start conversion (programmatic)
node convert-project.js /path/to/java/project
```

### Programmatic API

```typescript
import { JavaProjectAnalyzer } from './analyzer';
import { JavaConverter } from './converter';
import { MigrationPlanGenerator } from './migration-plan-generator';

// Analyze project
const analyzer = new JavaProjectAnalyzer('/path/to/project');
const report = await analyzer.analyze();

// Generate migration plan
const planGenerator = new MigrationPlanGenerator(report);
const plan = planGenerator.generate();

// Convert files
const converter = new JavaConverter({
  targetLanguage: 'typescript',
  convertSpringToElide: true,
  outputDir: './migrated'
});

for (const javaFile of report.javaFiles) {
  await converter.convertFile(javaFile);
}
```

## Migration Strategies

### Strategy 1: Big Bang (Fastest)

1. Run analyzer on Java project
2. Review analysis report and migration plan
3. Set up new Elide project structure
4. Convert all code at once using converter
5. Manual cleanup and testing
6. Deploy new system

**Timeline:** 2-8 weeks
**Risk:** High
**Best for:** Small projects, good tests

### Strategy 2: Strangler Fig (Safest)

1. Set up routing proxy
2. Run both Spring and Elide in parallel
3. Migrate read operations first
4. Gradually move write operations
5. Decommission Spring when complete

**Timeline:** 3-6 months
**Risk:** Low
**Best for:** Large projects, production systems

### Strategy 3: Bridge Pattern (Quickest to Production)

1. Use spring-bridge.ts for compatibility
2. Copy and convert code with minimal changes
3. Get to production quickly
4. Refactor to native Elide over time

**Timeline:** 1-4 weeks
**Risk:** Medium (technical debt)
**Best for:** Quick migrations, POCs

## Best Practices

### Before Migration

- [ ] Backup everything (code and database)
- [ ] Document current API contracts
- [ ] Ensure test coverage is good
- [ ] Get team buy-in
- [ ] Set up new Elide project

### During Migration

- [ ] Start with non-critical components
- [ ] Maintain test coverage
- [ ] Commit working code frequently
- [ ] Document all decisions
- [ ] Regular team updates

### After Migration

- [ ] Smoke test in production
- [ ] Monitor error rates for 48 hours
- [ ] Compare performance metrics
- [ ] Update all documentation
- [ ] Train team on Elide

## Common Pitfalls

### 1. Incomplete Analysis
**Problem:** Not understanding all dependencies
**Solution:** Run analyzer thoroughly, check for hidden integrations

### 2. Breaking API Changes
**Problem:** Client applications break
**Solution:** Maintain API compatibility, use versioning

### 3. Data Migration Issues
**Problem:** Database schema incompatibilities
**Solution:** Plan schema migrations, test with production data copy

### 4. Performance Regression
**Problem:** New system is slower
**Solution:** Benchmark before/after, optimize hot paths

### 5. Team Resistance
**Problem:** Team struggles with new stack
**Solution:** Training, documentation, pair programming

## Troubleshooting

### Analyzer Issues

**Problem:** Can't find Java files
```bash
# Check path is correct
ls -la /path/to/java/project/src
```

**Problem:** Can't parse build files
```bash
# Ensure pom.xml or build.gradle exists
cat /path/to/java/project/pom.xml
```

### Converter Issues

**Problem:** Generated code doesn't compile
- Review TODO comments in generated code
- Check type mappings
- Manual cleanup may be needed

**Problem:** Complex business logic not converted
- Converter handles structure, not complex logic
- Review and manually port business logic

### Bridge Issues

**Problem:** Decorators don't work
```typescript
// Ensure reflect-metadata is imported
import 'reflect-metadata';
```

**Problem:** Dependency injection fails
```typescript
// Check service is registered
const container = DependencyContainer.getInstance();
container.register('MyService', () => new MyService());
```

## Limitations

### Analyzer
- Simple regex-based parsing (not a full Java parser)
- May miss complex annotation patterns
- Limited Maven/Gradle parsing

### Converter
- Structure conversion only
- Complex business logic requires manual review
- May not handle all Java idioms

### Bridge
- Not 100% Spring-compatible
- Some features may differ in behavior
- Performance may differ from Spring

## Contributing

Contributions welcome! These tools are designed to be extended:

1. Add new Spring annotations to spring-bridge.ts
2. Improve Java parsing in analyzer.ts
3. Add more ORM support to jpa-bridge.ts
4. Enhance converter.ts for better code generation
5. Add migration patterns to examples/

## Support

For issues or questions:
- Open an issue on GitHub
- Check examples/ for detailed guides
- Review Elide documentation
- Join the Elide community

## License

MIT License - See LICENSE file for details

## Resources

### Elide
- [Elide Documentation](https://elide.dev)
- [Elide Examples](https://github.com/elide-dev/elide)

### Migration Guides
- [Spring Boot to Elide](./examples/spring-boot-to-elide.md)
- [Hibernate to Modern ORM](./examples/hibernate-to-modern-orm.md)
- [Maven to Elide Build](./examples/maven-to-elide-build.md)

### Community
- [Elide Discord](https://discord.gg/elide)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/elide)

---

Made with ❤️ by the Elide team
