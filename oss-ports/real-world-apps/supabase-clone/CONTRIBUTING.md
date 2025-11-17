# Contributing to Elidebase

Thank you for your interest in contributing to Elidebase! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

Examples of behavior that contributes to creating a positive environment include:

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

Examples of unacceptable behavior include:

- The use of sexualized language or imagery
- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Instances of abusive, harassing, or otherwise unacceptable behavior may be reported by contacting the project team. All complaints will be reviewed and investigated promptly and fairly.

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Java 21 or higher
- Gradle 8 or higher
- PostgreSQL 14 or higher
- Git
- Docker (optional, for testing)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/your-username/elidebase.git
cd elidebase
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/elide-dev/elidebase.git
```

4. Create a new branch for your changes:

```bash
git checkout -b feature/my-new-feature
```

## Development Setup

### 1. Install Dependencies

```bash
./gradlew build
```

### 2. Setup PostgreSQL

```bash
# Create database
createdb elidebase_dev

# Create test database
createdb elidebase_test
```

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
DATABASE_URL=postgresql://localhost:5432/elidebase_dev
TEST_DATABASE_URL=postgresql://localhost:5432/elidebase_test
JWT_SECRET=your-development-secret-key
```

### 4. Run Migrations

```bash
./gradlew :cli:run --args="migrate up"
```

### 5. Start Development Server

```bash
./gradlew :cli:run --args="start"
```

The server will start at `http://localhost:8000`.

### 6. Run Tests

```bash
# Run all tests
./gradlew test

# Run specific module tests
./gradlew :database:test
./gradlew :auth:test

# Run with coverage
./gradlew test jacocoTestReport
```

## Project Structure

```
elidebase/
├── core/              # Core utilities and models
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/core/
│           ├── Models.kt
│           └── Utils.kt
├── database/          # Database REST API
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/database/
│           ├── DatabaseManager.kt
│           ├── RLSManager.kt
│           └── MigrationManager.kt
├── auth/              # Authentication system
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/auth/
│           ├── AuthManager.kt
│           └── OAuthManager.kt
├── storage/           # File storage
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/storage/
│           ├── StorageManager.kt
│           └── ImageTransform.kt
├── realtime/          # WebSocket server
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/realtime/
│           └── RealtimeServer.kt
├── functions/         # Edge functions runtime
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/functions/
│           └── FunctionsRuntime.kt
├── admin/             # Admin dashboard
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/admin/
│           └── AdminDashboard.kt
├── sdk/               # Client SDK
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/sdk/
│           └── ElidebaseClient.kt
├── cli/               # Command-line interface
│   └── src/
│       └── main/kotlin/tools/elide/oss/elidebase/cli/
│           └── Main.kt
├── docs/              # Documentation
├── examples/          # Example applications
└── README.md
```

## Coding Standards

### Kotlin Style Guide

We follow the [Kotlin Coding Conventions](https://kotlinlang.org/docs/coding-conventions.html) with some additional rules:

#### File Organization

```kotlin
// 1. Package declaration
package tools.elide.oss.elidebase.module

// 2. Imports (grouped and sorted)
import java.util.UUID
import kotlinx.coroutines.*
import tools.elide.oss.elidebase.core.*

// 3. File-level documentation
/**
 * Brief description of the file's purpose
 */

// 4. Class/interface/object declarations
class MyClass {
    // ...
}
```

#### Naming Conventions

- **Classes/Interfaces**: PascalCase (`UserManager`, `DatabaseConfig`)
- **Functions/Variables**: camelCase (`getUserById`, `connectionPool`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`, `DEFAULT_TIMEOUT`)
- **Private members**: prefix with underscore (`_internalCache`)

#### Code Formatting

```kotlin
// Use 4 spaces for indentation
class ExampleClass(
    private val dependency1: Dependency1,
    private val dependency2: Dependency2
) {

    // Separate logical blocks with blank lines
    fun processData(input: String): Result<String> {
        val validated = validateInput(input)
        if (!validated) {
            return Result.Failure(ApiError("INVALID_INPUT", "Input validation failed"))
        }

        // Process the data
        val processed = transform(input)

        return Result.Success(processed)
    }

    // Private helper functions
    private fun validateInput(input: String): Boolean {
        return input.isNotEmpty() && input.length <= MAX_LENGTH
    }

    private fun transform(input: String): String {
        return input.trim().lowercase()
    }
}
```

#### Documentation

Use KDoc for public APIs:

```kotlin
/**
 * Authenticates a user with email and password.
 *
 * This function validates the credentials against the database,
 * generates JWT tokens, and returns a session.
 *
 * @param email User's email address
 * @param password User's password (will be hashed)
 * @return [ApiResponse] containing [SessionTokens] on success, or error
 *
 * @throws IllegalArgumentException if email is invalid
 *
 * @sample
 * ```kotlin
 * val result = authManager.signIn("user@example.com", "password123")
 * if (result.data != null) {
 *     println("Logged in: ${result.data.user.email}")
 * }
 * ```
 */
suspend fun signIn(
    email: String,
    password: String
): ApiResponse<SessionTokens> {
    // Implementation
}
```

### Error Handling

Use the `Result` type for operations that can fail:

```kotlin
sealed class Result<out T> {
    data class Success<T>(val value: T) : Result<T>()
    data class Failure(val error: ApiError) : Result<Nothing>()
}

// Usage
fun processData(input: String): Result<ProcessedData> {
    return try {
        val data = transformData(input)
        Result.Success(data)
    } catch (e: Exception) {
        Result.Failure(ApiError("PROCESS_ERROR", e.message ?: "Unknown error"))
    }
}
```

### Logging

Use structured logging:

```kotlin
import io.github.oshai.kotlinlogging.KotlinLogging

private val logger = KotlinLogging.logger {}

class MyService {
    fun processRequest(id: String) {
        logger.info { "Processing request: $id" }

        try {
            // Process
            logger.debug { "Request processed successfully: $id" }
        } catch (e: Exception) {
            logger.error(e) { "Error processing request: $id" }
        }
    }
}
```

### Testing

#### Unit Tests

```kotlin
import kotlin.test.*
import kotlinx.coroutines.test.runTest

class AuthManagerTest {

    private lateinit var authManager: AuthManager
    private lateinit var dbManager: DatabaseManager

    @BeforeTest
    fun setup() {
        dbManager = DatabaseManager(testConfig)
        authManager = AuthManager(dbManager, "test-secret")
    }

    @AfterTest
    fun teardown() {
        dbManager.close()
    }

    @Test
    fun `signIn with valid credentials returns session`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "password123"

        // First create the user
        authManager.signUpWithEmail(email, password)

        // When
        val result = authManager.signInWithEmail(email, password)

        // Then
        assertNotNull(result.data)
        assertEquals(email, result.data?.user?.email)
    }

    @Test
    fun `signIn with invalid credentials returns error`() = runTest {
        // Given
        val email = "test@example.com"
        val password = "wrong-password"

        // When
        val result = authManager.signInWithEmail(email, password)

        // Then
        assertNull(result.data)
        assertNotNull(result.error)
        assertEquals("SIGNIN_ERROR", result.error?.code)
    }
}
```

#### Integration Tests

```kotlin
@Test
fun `full authentication flow`() = runTest {
    // 1. Sign up
    val signUpResult = authManager.signUpWithEmail(
        "user@example.com",
        "password123"
    )
    assertNotNull(signUpResult.data)

    val accessToken = signUpResult.data!!.accessToken

    // 2. Make authenticated request
    val posts = dbApi.select(
        table = "posts",
        userId = signUpResult.data!!.user.id
    )
    assertNotNull(posts.data)

    // 3. Refresh token
    val refreshResult = authManager.refreshAccessToken(
        RefreshTokenRequest(signUpResult.data!!.refreshToken)
    )
    assertNotNull(refreshResult.data)

    // 4. Sign out
    authManager.signOut(refreshResult.data!!.refreshToken)
}
```

## Pull Request Process

### 1. Before Submitting

- Run all tests: `./gradlew test`
- Run linter: `./gradlew ktlintCheck`
- Format code: `./gradlew ktlintFormat`
- Update documentation if needed
- Add tests for new features
- Update CHANGELOG.md

### 2. Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:

```
feat(auth): add phone authentication support

Implements phone/SMS authentication with OTP verification.
Adds new endpoints for sending and verifying OTP codes.

Closes #123
```

```
fix(database): prevent SQL injection in query builder

Properly escape user input in WHERE clause construction.

Fixes #456
```

### 3. Pull Request Template

When creating a PR, use this template:

```markdown
## Description

Brief description of the changes.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist

- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added for new features
- [ ] All tests passing

## Screenshots (if applicable)

Add screenshots here.

## Related Issues

Closes #issue_number
```

### 4. Review Process

1. Submit your PR
2. Automated CI checks will run
3. Reviewers will be assigned
4. Address any feedback
5. Once approved, your PR will be merged

## Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):

- MAJOR version for incompatible API changes
- MINOR version for backwards-compatible functionality
- PATCH version for backwards-compatible bug fixes

### Release Checklist

1. Update version in `build.gradle.kts`
2. Update CHANGELOG.md
3. Create release branch: `release/v1.2.3`
4. Run full test suite
5. Build release: `./gradlew build`
6. Create git tag: `git tag -a v1.2.3 -m "Release v1.2.3"`
7. Push tag: `git push origin v1.2.3`
8. GitHub Actions will create release
9. Update documentation
10. Announce release

### Changelog Format

```markdown
# Changelog

## [1.2.3] - 2024-01-15

### Added
- Phone authentication support
- Image transformation API

### Changed
- Improved database connection pooling
- Updated dependencies

### Fixed
- SQL injection vulnerability in query builder
- Memory leak in real-time server

### Deprecated
- Old authentication API (will be removed in 2.0)

### Removed
- Legacy migration system

### Security
- Fixed XSS vulnerability in admin dashboard
```

## Documentation

### Adding Documentation

- Add user guides in `docs/` directory
- Update README.md for major changes
- Add code examples
- Keep documentation up-to-date

### Documentation Standards

- Use clear, concise language
- Provide code examples
- Include common use cases
- Add troubleshooting sections
- Link to related documentation

## Community

### Getting Help

- Join our [Discord](https://discord.gg/elide)
- Check [Discussions](https://github.com/elide-dev/elidebase/discussions)
- Read the [Documentation](https://elidebase.dev/docs)

### Reporting Issues

When reporting issues, include:

1. Description of the problem
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Environment details (OS, Java version, etc.)
6. Error logs
7. Screenshots (if applicable)

### Feature Requests

When requesting features:

1. Describe the feature
2. Explain the use case
3. Provide examples
4. Suggest implementation (optional)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Thank You!

Thank you for contributing to Elidebase! Your contributions help make this project better for everyone.
