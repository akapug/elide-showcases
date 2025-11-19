# Maven/Gradle to Elide Build System Migration

This guide shows how to migrate from Maven or Gradle build systems to Elide's npm/pnpm-based build system.

## Original Maven Configuration

### pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>demo-api</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>Demo API</name>
    <description>Demo Spring Boot API</description>

    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.7.0</version>
    </parent>

    <properties>
        <java.version>17</java.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- Spring Boot -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>

        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>

        <!-- Database -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>

        <!-- Validation -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>

        <!-- Logging -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>

        <!-- Utilities -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <dependency>
            <groupId>com.google.guava</groupId>
            <artifactId>guava</artifactId>
            <version>31.1-jre</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <configuration>
                    <source>17</source>
                    <target>17</target>
                </configuration>
            </plugin>

            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-surefire-plugin</artifactId>
                <configuration>
                    <includes>
                        <include>**/*Test.java</include>
                        <include>**/*Tests.java</include>
                    </includes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

## Migrated Elide Configuration

### package.json

```json
{
  "name": "demo-api",
  "version": "1.0.0",
  "description": "Demo Elide API",
  "type": "module",
  "scripts": {
    "dev": "elide run api/main.ts",
    "build": "elide build",
    "start": "node dist/main.js",
    "test": "vitest",
    "test:ci": "vitest run",
    "lint": "eslint . --ext .ts",
    "format": "prettier --write \"**/*.ts\"",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@elide-dev/elide": "^1.0.0-beta11",
    "pg": "^8.11.3",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/pg": "^8.11.0",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.4",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "noEmit": true,

    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,

    "types": ["node", "vitest/globals"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": [
    "api/**/*",
    "tests/**/*",
    "*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## Alternative: Using Gradle

### build.gradle (Original)

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '2.7.0'
    id 'io.spring.dependency-management' version '1.0.11.RELEASE'
}

group = 'com.example'
version = '1.0.0'
sourceCompatibility = '17'

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-data-jpa'
    implementation 'org.springframework.boot:spring-boot-starter-validation'

    // Database
    runtimeOnly 'org.postgresql:postgresql'

    // Utilities
    compileOnly 'org.projectlombok:lombok'
    annotationProcessor 'org.projectlombok:lombok'
    implementation 'com.google.guava:guava:31.1-jre'

    // Testing
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

## Dependency Migration Guide

### Spring Boot → Elide

| Maven/Gradle Dependency | npm Package | Purpose |
|------------------------|-------------|---------|
| spring-boot-starter-web | @elide-dev/elide | Web framework |
| spring-boot-starter-data-jpa | prisma / typeorm | ORM |
| postgresql | pg | PostgreSQL driver |
| spring-boot-starter-validation | zod | Validation |
| slf4j-api | pino | Logging |
| lombok | N/A | Use TypeScript |
| guava | lodash-es | Utilities |
| spring-boot-starter-test | vitest | Testing |
| junit | vitest | Test framework |
| mockito | vitest (built-in) | Mocking |

### Detailed Package.json

```json
{
  "name": "demo-api",
  "version": "1.0.0",
  "description": "Demo Elide API",
  "type": "module",
  "scripts": {
    "dev": "elide run api/main.ts",
    "build": "elide build",
    "start": "node dist/main.js",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "lint": "eslint . --ext .ts,.tsx",
    "lint:fix": "eslint . --ext .ts,.tsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,json,md}\"",
    "typecheck": "tsc --noEmit",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@elide-dev/elide": "^1.0.0-beta11",
    "@prisma/client": "^5.9.0",
    "pg": "^8.11.3",
    "zod": "^3.22.4",
    "pino": "^8.17.2",
    "lodash-es": "^4.17.21",
    "dotenv": "^16.4.1"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/pg": "^8.11.0",
    "@types/lodash-es": "^4.17.12",
    "@typescript-eslint/eslint-plugin": "^6.19.0",
    "@typescript-eslint/parser": "^6.19.0",
    "@vitest/coverage-v8": "^1.2.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.2.4",
    "prisma": "^5.9.0",
    "typescript": "^5.3.3",
    "vitest": "^1.2.0"
  },
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=9.0.0"
  }
}
```

## Build Scripts Comparison

### Maven Commands → npm Scripts

| Maven Command | npm Script | Purpose |
|--------------|-----------|---------|
| mvn clean | rm -rf dist | Clean build |
| mvn compile | npm run build | Compile code |
| mvn test | npm test | Run tests |
| mvn package | npm run build | Build package |
| mvn spring-boot:run | npm run dev | Run app |
| mvn install | npm install | Install deps |
| mvn dependency:tree | npm list | Show deps |

## Build Configuration Files

### ESLint (.eslintrc.json)

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn"
  }
}
```

### Prettier (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid"
}
```

### Vitest (vitest.config.ts)

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
```

## CI/CD Migration

### Maven GitHub Actions → npm GitHub Actions

**Before (Maven):**

```yaml
name: Java CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3
    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'
    - name: Build with Maven
      run: mvn clean install
    - name: Run tests
      run: mvn test
```

**After (npm):**

```yaml
name: Node.js CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - name: Install dependencies
      run: npm ci
    - name: Type check
      run: npm run typecheck
    - name: Lint
      run: npm run lint
    - name: Run tests
      run: npm test
    - name: Build
      run: npm run build
```

## Docker Migration

### Maven Dockerfile → npm Dockerfile

**Before (Maven):**

```dockerfile
FROM maven:3.8-openjdk-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

FROM openjdk:17-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**After (npm):**

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main.js"]
```

## Migration Checklist

- [ ] Install Node.js 20+ and npm
- [ ] Create package.json with dependencies
- [ ] Set up TypeScript configuration
- [ ] Configure linting (ESLint)
- [ ] Configure formatting (Prettier)
- [ ] Set up testing (Vitest)
- [ ] Update CI/CD pipelines
- [ ] Update Docker configuration
- [ ] Document new build commands
- [ ] Train team on npm/Node.js ecosystem
- [ ] Update deployment scripts
- [ ] Test all build/test/deploy workflows

## Tips for Migration

1. **Start Fresh**: Don't try to convert build.gradle/pom.xml line-by-line
2. **Use Modern Tools**: Take advantage of modern JavaScript tooling
3. **Simplify**: npm/pnpm are simpler than Maven/Gradle
4. **Fast Installs**: Use pnpm or npm ci for faster installs
5. **Lock Files**: Commit package-lock.json or pnpm-lock.yaml
6. **Scripts**: Use npm scripts for common tasks
7. **Environment Variables**: Use .env files with dotenv
8. **Monorepos**: Consider workspaces for multi-module projects
