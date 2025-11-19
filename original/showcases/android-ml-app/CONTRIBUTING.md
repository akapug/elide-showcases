# Contributing to Android ML App Showcase

Thank you for your interest in contributing to the Android ML App showcase! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## How to Contribute

### Reporting Issues

If you find a bug or have a feature request:

1. Check if the issue already exists in the [issue tracker](https://github.com/elide-dev/android-ml-showcase/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Device/OS information
   - Code samples if applicable

### Submitting Changes

1. **Fork the repository**
```bash
git clone https://github.com/YOUR_USERNAME/android-ml-showcase
cd android-ml-showcase
```

2. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

3. **Make your changes**
   - Write clean, readable code
   - Follow Kotlin coding conventions
   - Add tests for new functionality
   - Update documentation

4. **Test your changes**
```bash
./gradlew test
./gradlew connectedAndroidTest
```

5. **Commit your changes**
```bash
git add .
git commit -m "Add feature: your feature description"
```

6. **Push to your fork**
```bash
git push origin feature/your-feature-name
```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your feature branch
   - Fill in the PR template

## Development Guidelines

### Code Style

Follow Kotlin conventions:

```kotlin
// Good
class ImageClassifier(
    private val modelManager: ModelManager
) {
    suspend fun classify(bitmap: Bitmap): List<ClassificationResult> {
        // Implementation
    }
}

// Bad
class image_classifier(modelManager:ModelManager){
    fun classify(bitmap:Bitmap):List<ClassificationResult>{
        // Implementation  
    }
}
```

### Documentation

- Add KDoc comments for public APIs
- Include usage examples
- Document parameters and return values
- Explain complex algorithms

```kotlin
/**
 * Classify an image using a deep learning model
 *
 * @param bitmap Input image to classify
 * @param topK Number of top predictions to return
 * @param threshold Minimum confidence threshold
 * @return List of classification results sorted by confidence
 *
 * @throws IOException if model loading fails
 *
 * Example:
 * ```kotlin
 * val results = classifier.classify(myImage, topK = 5)
 * results.forEach { println("${it.label}: ${it.confidence}") }
 * ```
 */
suspend fun classify(
    bitmap: Bitmap,
    topK: Int = 5,
    threshold: Float = 0.1f
): List<ClassificationResult>
```

### Testing

Write tests for new features:

```kotlin
@Test
fun testImageClassification() = runBlocking {
    val classifier = ImageClassifier(modelManager)
    val testImage = loadTestImage()
    
    val results = classifier.classify(testImage)
    
    assertNotNull(results)
    assertTrue(results.isNotEmpty())
    assertTrue(results.first().confidence > 0.5f)
}
```

### Performance

- Profile new features
- Optimize for mobile devices
- Minimize memory allocations
- Use coroutines for async operations

## Project Structure

```
android-ml-app/
├── src/main/kotlin/
│   ├── MainActivity.kt
│   ├── ml/               # ML models and inference
│   ├── camera/           # Camera integration
│   ├── ui/               # UI components
│   └── utils/            # Utilities
├── examples/             # Usage examples
├── benchmarks/           # Performance tests
└── docs/                 # Documentation
```

## Adding New Features

### Adding a New ML Model

1. Create model class in `src/main/kotlin/ml/`
2. Implement inference logic
3. Add tests
4. Update documentation
5. Add usage examples

Example:

```kotlin
package com.example.androidml.ml

class NewMLModel(private val modelManager: ModelManager) {
    suspend fun predict(input: Bitmap): Result {
        // Implementation
    }
}
```

### Adding New Examples

1. Create example in `examples/`
2. Document the use case
3. Provide complete working code
4. Add to README

## Documentation

Update relevant documentation:

- README.md - Overview and quick start
- TUTORIAL.md - Step-by-step guides
- API_REFERENCE.md - API documentation
- ADVANCED_EXAMPLES.md - Complex use cases

## Release Process

1. Update version in build.gradle.kts
2. Update CHANGELOG.md
3. Create release notes
4. Tag release
5. Build and test
6. Publish to Maven Central

## Community

- Discord: https://discord.gg/elide
- GitHub Discussions: https://github.com/elide-dev/android-ml-showcase/discussions
- Twitter: @elidedev

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

## Questions?

If you have questions about contributing:

1. Check existing documentation
2. Search closed issues
3. Ask in Discord
4. Create a discussion thread

Thank you for contributing! 🎉
