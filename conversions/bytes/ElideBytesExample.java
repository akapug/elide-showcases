/**
 * Java Integration Example for elide-bytes (Byte Formatter)
 *
 * Demonstrates calling the TypeScript bytes implementation from Java
 * for consistent byte formatting across JVM services.
 */

// NOTE: Exact syntax depends on Elide's Java polyglot API
// import org.graalvm.polyglot.Context;
// import org.graalvm.polyglot.Value;

public class ElideBytesExample {
    public static void main(String[] args) {
        System.out.println("=== Java Calling TypeScript Bytes ===\n");

        // Example: Load TypeScript module via GraalVM
        // Context context = Context.newBuilder("js")
        //     .allowAllAccess(true)
        //     .build();
        // Value bytesModule = context.eval("js", "require('./elide-bytes.ts')");

        // Example 1: Format byte sizes
        // String fileSize = bytesModule.invokeMember("format", 1024).asString();
        // System.out.println("1024 bytes = " + fileSize);  // "1KB"
        //
        // String memUsage = bytesModule.invokeMember("format", 1024L * 1024 * 512).asString();
        // System.out.println("Memory usage = " + memUsage);  // "512MB"

        // Example 2: Parse byte strings
        // long maxUpload = bytesModule.invokeMember("parse", "100MB").asLong();
        // System.out.println("'100MB' = " + maxUpload + " bytes");  // 104857600

        // Example 3: Spring Boot file upload configuration
        // @Configuration
        // public class FileUploadConfig {
        //     private final Value bytesModule;
        //
        //     public FileUploadConfig(Context graalContext) {
        //         this.bytesModule = graalContext.eval("js", "require('./elide-bytes.ts')");
        //     }
        //
        //     @Bean
        //     public MultipartConfigElement multipartConfigElement() {
        //         long maxFileSize = bytesModule.invokeMember("parse", "100MB").asLong();
        //         long maxRequestSize = bytesModule.invokeMember("parse", "100MB").asLong();
        //
        //         MultipartConfigFactory factory = new MultipartConfigFactory();
        //         factory.setMaxFileSize(DataSize.ofBytes(maxFileSize));
        //         factory.setMaxRequestSize(DataSize.ofBytes(maxRequestSize));
        //         return factory.createMultipartConfig();
        //     }
        // }

        // Example 4: REST API with consistent byte formatting
        // @RestController
        // @RequestMapping("/api/storage")
        // public class StorageController {
        //     @Autowired
        //     private Value bytesModule;
        //
        //     @GetMapping("/stats")
        //     public ResponseEntity<StorageStats> getStorageStats() {
        //         File diskPartition = new File("/");
        //         long totalSpace = diskPartition.getTotalSpace();
        //         long usedSpace = totalSpace - diskPartition.getFreeSpace();
        //
        //         StorageStats stats = new StorageStats();
        //         stats.setTotal(bytesModule.invokeMember("format", totalSpace).asString());
        //         stats.setUsed(bytesModule.invokeMember("format", usedSpace).asString());
        //         // Same format as Node.js dashboard!
        //
        //         return ResponseEntity.ok(stats);
        //     }
        //
        //     @PostMapping("/upload")
        //     public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file) {
        //         long maxSize = bytesModule.invokeMember("parse", "100MB").asLong();
        //
        //         if (file.getSize() > maxSize) {
        //             String maxSizeStr = bytesModule.invokeMember("format", maxSize).asString();
        //             return ResponseEntity.badRequest()
        //                 .body("File too large. Max: " + maxSizeStr);
        //         }
        //
        //         // Process upload...
        //         return ResponseEntity.ok("Upload successful");
        //     }
        // }

        // Example 5: JMX monitoring with consistent formatting
        // public class MemoryMonitor {
        //     private final Value bytesModule;
        //     private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
        //
        //     public String getHeapUsage() {
        //         long heapUsed = memoryBean.getHeapMemoryUsage().getUsed();
        //         return bytesModule.invokeMember("format", heapUsed).asString();
        //     }
        //
        //     public String getNonHeapUsage() {
        //         long nonHeapUsed = memoryBean.getNonHeapMemoryUsage().getUsed();
        //         return bytesModule.invokeMember("format", nonHeapUsed).asString();
        //     }
        //     // Formatted consistently with Node.js monitoring service!
        // }

        System.out.println("Real-world use case:");
        System.out.println("- Java service reports: disk_used = 1073741824 bytes");
        System.out.println("- Uses same bytes formatter as Node.js dashboard");
        System.out.println("- Guarantees identical '1GB' display across entire platform");
        System.out.println();

        System.out.println("Example: Monitoring Platform");
        System.out.println("┌─────────────────────────────────────┐");
        System.out.println("│   Elide Bytes (TypeScript)         │");
        System.out.println("│   conversions/bytes/elide-bytes.ts │");
        System.out.println("└─────────────────────────────────────┘");
        System.out.println("         ↓           ↓           ↓");
        System.out.println("    ┌────────┐  ┌────────┐  ┌────────┐");
        System.out.println("    │ Node.js│  │  Java  │  │ Python │");
        System.out.println("    │Dashboard│ │ API    │  │Worker  │");
        System.out.println("    └────────┘  └────────┘  └────────┘");
        System.out.println("     All services format 1073741824 = '1GB'");
        System.out.println("     ✓ Perfect consistency!");
        System.out.println();

        System.out.println("Problem Solved:");
        System.out.println("Before: Each language formats bytes differently");
        System.out.println("After: One Elide implementation = identical formatting");
    }
}
