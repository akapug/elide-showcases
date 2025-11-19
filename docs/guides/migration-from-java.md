# Migrating from Java to Elide

**Comprehensive guide for Java developers adopting Elide's polyglot runtime**

Learn how to run Java code on Elide, combine Java with TypeScript/Python, and leverage JVM libraries in a polyglot environment.

---

## Table of Contents

- [Why Use Java on Elide?](#why-use-java-on-elide)
- [Java Support Overview](#java-support-overview)
- [Running Java Code](#running-java-code)
- [Polyglot Integration](#polyglot-integration)
- [API Compatibility](#api-compatibility)
- [Common Patterns](#common-patterns)
- [Spring Boot Migration](#spring-boot-migration)
- [Best Practices](#best-practices)

---

## Why Use Java on Elide?

### Key Benefits

| Feature | Standard JVM | Elide (GraalVM) |
|---------|--------------|-----------------|
| **Startup Time** | ~2-5s | ~20-50ms |
| **Memory** | 500MB-2GB | 100-500MB |
| **Polyglot** | JNI/RMI | <1ms in-process |
| **TypeScript Integration** | REST/gRPC | Direct function calls |
| **Deployment** | Separate JARs | Single artifact |

### Use Cases

1. **Enterprise Integration**: Leverage existing Java libraries
2. **Performance**: Use Java for CPU-intensive operations
3. **Security**: Java cryptography + TypeScript API
4. **Legacy Code**: Reuse Java code in modern TypeScript apps
5. **JVM Ecosystem**: Access Maven Central libraries

---

## Java Support Overview

### GraalVM Java Compatibility

Elide runs Java on **GraalVM**, supporting:

- ✅ **Java 11-21** language features
- ✅ **Standard JDK** classes
- ✅ **Common frameworks** (Spring Boot, Micronaut)
- ✅ **JVM libraries** from Maven Central
- ✅ **Reflection** and **annotations**
- ⚠️ **Native libraries** (JNI) - limited
- ❌ **Java agents** - not supported

### Running Java on Elide

```bash
# Run Java file directly
elide run MyApp.java

# Run polyglot (TypeScript imports Java)
elide run server.ts
```

---

## Running Java Code

### Standalone Java Application

```java
// HelloElide.java
public class HelloElide {
    public static void main(String[] args) {
        System.out.println("Hello from Java on Elide!");
        System.out.println("Runtime: GraalVM");
        System.out.println("Startup: ~20ms (vs ~2s on JVM)");

        // Performance test
        long start = System.currentTimeMillis();

        long sum = 0;
        for (int i = 0; i < 1_000_000; i++) {
            sum += i * i;
        }

        long duration = System.currentTimeMillis() - start;
        System.out.println("Computed " + sum + " in " + duration + "ms");
    }
}
```

Run it:
```bash
elide run HelloElide.java
```

### Java Classes in TypeScript

**Java utility class** (`Crypto.java`):

```java
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

public class Crypto {
    /**
     * Generate SHA-256 hash
     */
    public static String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return Base64.getEncoder().encodeToString(hash);
    }

    /**
     * Generate secure random string
     */
    public static String randomString(int length) {
        SecureRandom random = new SecureRandom();
        byte[] bytes = new byte[length];
        random.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Generate AES encryption key
     */
    public static String generateKey() throws Exception {
        KeyGenerator keyGen = KeyGenerator.getInstance("AES");
        keyGen.init(256);
        SecretKey key = keyGen.generateKey();
        return Base64.getEncoder().encodeToString(key.getEncoded());
    }

    /**
     * Encrypt data with AES
     */
    public static String encrypt(String data, String keyString) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyString);
        SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.ENCRYPT_MODE, key);
        byte[] encrypted = cipher.doFinal(data.getBytes(StandardCharsets.UTF_8));

        return Base64.getEncoder().encodeToString(encrypted);
    }

    /**
     * Decrypt data with AES
     */
    public static String decrypt(String encryptedData, String keyString) throws Exception {
        byte[] keyBytes = Base64.getDecoder().decode(keyString);
        SecretKeySpec key = new SecretKeySpec(keyBytes, "AES");

        Cipher cipher = Cipher.getInstance("AES");
        cipher.init(Cipher.DECRYPT_MODE, key);
        byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedData));

        return new String(decrypted, StandardCharsets.UTF_8);
    }
}
```

**TypeScript usage** (`server.ts`):

```typescript
import { createServer } from "http";
// Import Java class directly!
import { Crypto } from "./Crypto.java";

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // SHA-256 hash endpoint
    if (path === "/hash" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        const data = JSON.parse(body);

        // Call Java method from TypeScript!
        const hash = await Crypto.sha256(data.text);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ text: data.text, hash }));
      });
      return;
    }

    // Generate random token
    if (path === "/token") {
      // Call Java method
      const token = await Crypto.randomString(32);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ token }));
      return;
    }

    // Encrypt/decrypt endpoint
    if (path === "/encrypt" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        const data = JSON.parse(body);

        // Generate key and encrypt with Java
        const key = await Crypto.generateKey();
        const encrypted = await Crypto.encrypt(data.text, key);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ encrypted, key }));
      });
      return;
    }

    if (path === "/decrypt" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end", async () => {
        const data = JSON.parse(body);

        // Decrypt with Java
        const decrypted = await Crypto.decrypt(data.encrypted, data.key);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ decrypted }));
      });
      return;
    }

    res.writeHead(404);
    res.end("Not Found");

  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(error) }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Java + TypeScript server running on http://localhost:${PORT}`);
  console.log("Endpoints:");
  console.log("  POST /hash - SHA-256 hash");
  console.log("  GET  /token - Random token");
  console.log("  POST /encrypt - Encrypt data");
  console.log("  POST /decrypt - Decrypt data");
});
```

Run it:
```bash
elide run server.ts

# Test
curl -X POST http://localhost:3000/hash \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello Elide"}'

curl http://localhost:3000/token
```

---

## Polyglot Integration

### Pattern 1: Java for Business Logic

```java
// OrderProcessor.java
import java.util.*;
import java.math.BigDecimal;

public class OrderProcessor {
    public static class Order {
        public String id;
        public List<OrderItem> items;
        public String customerId;
        public String status;

        public Order(String id, String customerId) {
            this.id = id;
            this.customerId = customerId;
            this.items = new ArrayList<>();
            this.status = "pending";
        }
    }

    public static class OrderItem {
        public String productId;
        public int quantity;
        public BigDecimal price;

        public OrderItem(String productId, int quantity, BigDecimal price) {
            this.productId = productId;
            this.quantity = quantity;
            this.price = price;
        }
    }

    public static class OrderResult {
        public String orderId;
        public BigDecimal subtotal;
        public BigDecimal tax;
        public BigDecimal total;
        public String status;

        public OrderResult(String orderId, BigDecimal subtotal, BigDecimal tax, BigDecimal total, String status) {
            this.orderId = orderId;
            this.subtotal = subtotal;
            this.tax = tax;
            this.total = total;
            this.status = status;
        }
    }

    public static OrderResult processOrder(Order order) {
        // Calculate subtotal
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderItem item : order.items) {
            BigDecimal itemTotal = item.price.multiply(BigDecimal.valueOf(item.quantity));
            subtotal = subtotal.add(itemTotal);
        }

        // Calculate tax (10%)
        BigDecimal taxRate = new BigDecimal("0.10");
        BigDecimal tax = subtotal.multiply(taxRate);

        // Calculate total
        BigDecimal total = subtotal.add(tax);

        // Update order status
        order.status = "processed";

        return new OrderResult(order.id, subtotal, tax, total, order.status);
    }

    public static boolean validateOrder(Order order) {
        if (order.items.isEmpty()) {
            return false;
        }

        for (OrderItem item : order.items) {
            if (item.quantity <= 0 || item.price.compareTo(BigDecimal.ZERO) <= 0) {
                return false;
            }
        }

        return true;
    }
}
```

```typescript
// server.ts
import { createServer } from "http";
import { OrderProcessor } from "./OrderProcessor.java";

const server = createServer(async (req, res) => {
  if (req.url === "/orders" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => { body += chunk; });
    req.on("end", () => {
      const data = JSON.parse(body);

      // Create Java Order object
      const order = new OrderProcessor.Order(data.id, data.customerId);

      // Add items
      data.items.forEach((item: any) => {
        const orderItem = new OrderProcessor.OrderItem(
          item.productId,
          item.quantity,
          java.math.BigDecimal.valueOf(item.price)
        );
        order.items.add(orderItem);
      });

      // Validate with Java
      const isValid = OrderProcessor.validateOrder(order);
      if (!isValid) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid order" }));
        return;
      }

      // Process with Java
      const result = OrderProcessor.processOrder(order);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        orderId: result.orderId,
        subtotal: result.subtotal.toString(),
        tax: result.tax.toString(),
        total: result.total.toString(),
        status: result.status
      }));
    });
    return;
  }

  res.writeHead(404);
  res.end("Not Found");
});

server.listen(3000);
```

### Pattern 2: Java for Data Processing

```java
// DataProcessor.java
import java.util.*;
import java.util.stream.*;

public class DataProcessor {
    public static class Statistics {
        public double mean;
        public double median;
        public double stdDev;
        public double min;
        public double max;

        public Statistics(double mean, double median, double stdDev, double min, double max) {
            this.mean = mean;
            this.median = median;
            this.stdDev = stdDev;
            this.min = min;
            this.max = max;
        }
    }

    public static Statistics calculateStatistics(List<Double> numbers) {
        if (numbers.isEmpty()) {
            return new Statistics(0, 0, 0, 0, 0);
        }

        // Mean
        double mean = numbers.stream()
            .mapToDouble(Double::doubleValue)
            .average()
            .orElse(0.0);

        // Median
        List<Double> sorted = numbers.stream()
            .sorted()
            .collect(Collectors.toList());
        double median;
        int size = sorted.size();
        if (size % 2 == 0) {
            median = (sorted.get(size / 2 - 1) + sorted.get(size / 2)) / 2.0;
        } else {
            median = sorted.get(size / 2);
        }

        // Standard deviation
        double variance = numbers.stream()
            .mapToDouble(n -> Math.pow(n - mean, 2))
            .average()
            .orElse(0.0);
        double stdDev = Math.sqrt(variance);

        // Min and max
        double min = numbers.stream()
            .mapToDouble(Double::doubleValue)
            .min()
            .orElse(0.0);
        double max = numbers.stream()
            .mapToDouble(Double::doubleValue)
            .max()
            .orElse(0.0);

        return new Statistics(mean, median, stdDev, min, max);
    }

    public static List<Double> movingAverage(List<Double> data, int window) {
        List<Double> result = new ArrayList<>();

        for (int i = 0; i <= data.size() - window; i++) {
            double sum = 0;
            for (int j = i; j < i + window; j++) {
                sum += data.get(j);
            }
            result.add(sum / window);
        }

        return result;
    }
}
```

```typescript
// analytics-server.ts
import { DataProcessor } from "./DataProcessor.java";

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/stats" && req.method === "POST") {
    const data = await req.json();

    // Call Java for statistics calculation
    const numbers = data.numbers.map((n: number) => java.lang.Double.valueOf(n));
    const stats = DataProcessor.calculateStatistics(numbers);

    return new Response(JSON.stringify({
      count: data.numbers.length,
      mean: stats.mean,
      median: stats.median,
      stdDev: stats.stdDev,
      min: stats.min,
      max: stats.max
    }));
  }

  if (url.pathname === "/moving-average" && req.method === "POST") {
    const data = await req.json();

    // Calculate moving average with Java
    const numbers = data.numbers.map((n: number) => java.lang.Double.valueOf(n));
    const result = DataProcessor.movingAverage(numbers, data.window || 3);

    return new Response(JSON.stringify({
      original: data.numbers,
      window: data.window || 3,
      result: result.map((n: any) => n.doubleValue())
    }));
  }

  return new Response("Not Found", { status: 404 });
}
```

### Pattern 3: Java for Integration

```java
// KafkaClient.java (Conceptual - shows pattern)
import java.util.*;

public class KafkaClient {
    private String brokers;
    private Map<String, Object> config;

    public KafkaClient(String brokers) {
        this.brokers = brokers;
        this.config = new HashMap<>();
    }

    public void send(String topic, String key, String value) {
        // Send message to Kafka
        System.out.println("Sending to " + topic + ": " + value);
    }

    public List<String> receive(String topic, int maxMessages) {
        // Receive messages from Kafka
        List<String> messages = new ArrayList<>();
        messages.add("{\"event\": \"test\"}");
        return messages;
    }

    public void close() {
        // Close connection
        System.out.println("Kafka client closed");
    }
}
```

```typescript
// kafka-server.ts
import { KafkaClient } from "./KafkaClient.java";

const kafkaClient = new KafkaClient("localhost:9092");

export default async function fetch(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/publish" && req.method === "POST") {
    const data = await req.json();

    // Publish to Kafka using Java client
    kafkaClient.send(data.topic, data.key, JSON.stringify(data.value));

    return new Response(JSON.stringify({ published: true }));
  }

  if (url.pathname === "/consume") {
    const topic = url.searchParams.get("topic") || "events";
    const max = parseInt(url.searchParams.get("max") || "10");

    // Consume from Kafka using Java client
    const messages = kafkaClient.receive(topic, max);

    return new Response(JSON.stringify({ messages }));
  }

  return new Response("Not Found", { status: 404 });
}
```

---

## API Compatibility

### Supported JDK Classes

**✅ Fully Supported**:
```java
// Core classes
java.lang.*
java.util.*
java.math.*
java.time.*

// I/O
java.io.*
java.nio.*

// Security
java.security.*
javax.crypto.*

// Networking
java.net.*

// Concurrency
java.util.concurrent.*
```

**⚠️ Partially Supported**:
```java
// Reflection (works but limited)
java.lang.reflect.*

// JDBC (basic support)
java.sql.*
```

**❌ Not Supported**:
```java
// JNI
System.loadLibrary()

// Java agents
-javaagent

// Some JMX features
java.lang.management.*
```

---

## Spring Boot Migration

### Minimal Spring Boot App

```java
// Application.java
import org.springframework.boot.*;
import org.springframework.boot.autoconfigure.*;
import org.springframework.web.bind.annotation.*;

@SpringBootApplication
@RestController
public class Application {
    @GetMapping("/")
    public String home() {
        return "Hello from Spring Boot on Elide!";
    }

    @GetMapping("/api/users/{id}")
    public User getUser(@PathVariable String id) {
        return new User(id, "Alice", "alice@example.com");
    }

    @PostMapping("/api/users")
    public User createUser(@RequestBody User user) {
        return user;
    }

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}

class User {
    private String id;
    private String name;
    private String email;

    public User(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

**Note**: Spring Boot on Elide requires additional setup. Consider migrating to lightweight frameworks or using Java classes with TypeScript orchestration.

---

## Best Practices

### 1. Use Java for CPU-Intensive Tasks

```java
// FastAlgorithms.java
public class FastAlgorithms {
    public static long fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }

    public static int[] quickSort(int[] arr) {
        if (arr.length <= 1) return arr;
        // Quick sort implementation
        return arr;
    }
}
```

```typescript
// Use Java for performance-critical code
import { FastAlgorithms } from "./FastAlgorithms.java";

const result = FastAlgorithms.fibonacci(40);  // Fast with Java!
```

### 2. Type Safety Across Languages

```java
// User.java
public class User {
    private final String id;
    private final String name;
    private final String email;

    public User(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
}
```

```typescript
// TypeScript types match Java class
interface UserType {
  id: string;
  name: string;
  email: string;
}

const user: UserType = new User("1", "Alice", "alice@example.com");
```

### 3. Error Handling

```java
// Validator.java
public class Validator {
    public static class ValidationException extends Exception {
        public ValidationException(String message) {
            super(message);
        }
    }

    public static void validateEmail(String email) throws ValidationException {
        if (!email.contains("@")) {
            throw new ValidationException("Invalid email format");
        }
    }
}
```

```typescript
// Catch Java exceptions in TypeScript
try {
  Validator.validateEmail("invalid");
} catch (error) {
  console.error("Validation error:", error);
  return new Response(JSON.stringify({ error: String(error) }), { status: 400 });
}
```

---

## Next Steps

- **[Polyglot Programming](./polyglot-programming.md)** - Multi-language patterns
- **[Performance Optimization](./performance-optimization.md)** - Optimize Java/TypeScript integration
- **[HTTP Servers](./http-servers.md)** - Build web services
- **[Testing](./testing.md)** - Test polyglot applications

---

## Summary

**Java on Elide Benefits:**

- ✅ **50-100x faster startup** (~20ms vs ~2s JVM)
- ✅ **<1ms overhead** for TypeScript ↔ Java calls
- ✅ **JDK standard library** support
- ✅ **Shared memory** with TypeScript/Python/Ruby
- ✅ **Enterprise libraries** available
- ✅ **Type safety** across languages

**Best Use Cases:**

1. **Cryptography**: Java security APIs + TypeScript API
2. **Enterprise Integration**: JVM libraries + modern API
3. **Performance**: CPU-intensive algorithms in Java
4. **Legacy Code**: Reuse existing Java code
5. **Business Logic**: Complex rules in Java, orchestration in TypeScript

🚀 **Combine Java's power with TypeScript's simplicity!**
