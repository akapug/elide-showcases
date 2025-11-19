# Native Image Tools

GraalVM Native Image compilation tools for building ultra-fast, low-memory native executables from Java/Kotlin code.

## Features

- **Native Image Compilation**: Build standalone executables
- **Configuration Generation**: Auto-generate reflection, resource, JNI configs
- **Profile-Guided Optimization (PGO)**: Optimize based on runtime profiles
- **Static Analysis**: Comprehensive build analysis and optimization
- **Framework Support**: Spring, Quarkus, Micronaut, Helidon
- **Quick Build Mode**: Fast iterative development builds

## Quick Start

```typescript
import { NativeImageBuilder } from './native-image-builder';

const builder = new NativeImageBuilder({
  mainClass: 'com.example.Main',
  classpath: ['./build/libs/app.jar'],
  imageName: 'myapp',
  optimizationLevel: 'O3'
});

const result = await builder.build();

if (result.success) {
  console.log(`Built: ${result.imagePath}`);
  console.log(`Size: ${result.imageSize! / 1024 / 1024} MB`);
  console.log(`Time: ${result.buildTime / 1000}s`);
}
```

## Performance

**Startup Time:**
- Traditional JVM: ~200ms
- Native Image: ~1-5ms
- **40-200x faster** startup

**Memory Usage:**
- Traditional JVM: 50-100MB minimum
- Native Image: 5-15MB resident
- **5-10x less** memory

**Binary Size:**
- Typical application: 20-50MB
- With compression: 10-25MB

See [examples](../examples) for complete demos.
