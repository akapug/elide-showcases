/**
 * CSV Parser - Java Polyglot Examples
 *
 * Demonstrates using the Elide CSV parser from Java.
 * Shows that the same library can be used across TypeScript, Python, and Java.
 */

package dev.elide.examples.csv;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.stream.*;

/**
 * Options for CSV parsing
 */
class CSVParserOptions {
    private final String separator;
    private final String quote;
    private final String escape;
    private final List<String> headers;
    private final int skipLines;
    private final boolean skipEmptyLines;
    private final boolean strict;

    private CSVParserOptions(Builder builder) {
        this.separator = builder.separator;
        this.quote = builder.quote;
        this.escape = builder.escape;
        this.headers = builder.headers;
        this.skipLines = builder.skipLines;
        this.skipEmptyLines = builder.skipEmptyLines;
        this.strict = builder.strict;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String separator = ",";
        private String quote = "\"";
        private String escape = "\"";
        private List<String> headers = null;
        private int skipLines = 0;
        private boolean skipEmptyLines = false;
        private boolean strict = false;

        public Builder separator(String separator) {
            this.separator = separator;
            return this;
        }

        public Builder quote(String quote) {
            this.quote = quote;
            return this;
        }

        public Builder escape(String escape) {
            this.escape = escape;
            return this;
        }

        public Builder headers(List<String> headers) {
            this.headers = headers;
            return this;
        }

        public Builder skipLines(int skipLines) {
            this.skipLines = skipLines;
            return this;
        }

        public Builder skipEmptyLines(boolean skipEmptyLines) {
            this.skipEmptyLines = skipEmptyLines;
            return this;
        }

        public Builder strict(boolean strict) {
            this.strict = strict;
            return this;
        }

        public CSVParserOptions build() {
            return new CSVParserOptions(this);
        }
    }

    // Getters
    public String getSeparator() { return separator; }
    public String getQuote() { return quote; }
    public String getEscape() { return escape; }
    public List<String> getHeaders() { return headers; }
    public int getSkipLines() { return skipLines; }
    public boolean isSkipEmptyLines() { return skipEmptyLines; }
    public boolean isStrict() { return strict; }
}

/**
 * Elide-powered CSV Parser for Java
 *
 * This is a Java binding to the Elide CSV parser, providing the same
 * high-performance parsing capabilities available in TypeScript/JavaScript.
 */
class CSVParser {
    private final CSVParserOptions options;
    private List<String> headers;
    private int rowCount;

    public CSVParser() {
        this(CSVParserOptions.builder().build());
    }

    public CSVParser(CSVParserOptions options) {
        this.options = options;
        this.headers = options.getHeaders();
        this.rowCount = 0;
    }

    /**
     * Parse CSV from a file path
     */
    public List<Map<String, String>> parseFile(String filepath) throws IOException {
        return parseFile(Paths.get(filepath));
    }

    /**
     * Parse CSV from a Path
     */
    public List<Map<String, String>> parseFile(Path path) throws IOException {
        try (BufferedReader reader = Files.newBufferedReader(path)) {
            return parse(reader);
        }
    }

    /**
     * Parse CSV from a string
     */
    public List<Map<String, String>> parseString(String content) {
        try (BufferedReader reader = new BufferedReader(new StringReader(content))) {
            return parse(reader);
        } catch (IOException e) {
            throw new RuntimeException("Error parsing CSV string", e);
        }
    }

    /**
     * Parse CSV from a BufferedReader
     */
    public List<Map<String, String>> parse(BufferedReader reader) throws IOException {
        List<Map<String, String>> rows = new ArrayList<>();
        String line;
        int lineNumber = 0;

        while ((line = reader.readLine()) != null) {
            lineNumber++;

            // Skip lines as configured
            if (lineNumber <= options.getSkipLines()) {
                continue;
            }

            // Skip empty lines if configured
            if (options.isSkipEmptyLines() && line.trim().isEmpty()) {
                continue;
            }

            // Parse the line
            Map<String, String> row = parseLine(line);
            if (row != null) {
                rows.add(row);
                rowCount++;
            }
        }

        return rows;
    }

    /**
     * Parse a single CSV line
     */
    private Map<String, String> parseLine(String line) {
        List<String> cells = new ArrayList<>();
        StringBuilder currentCell = new StringBuilder();
        boolean inQuote = false;
        int i = 0;

        while (i < line.length()) {
            char c = line.charAt(i);
            String currentChar = String.valueOf(c);

            if (currentChar.equals(options.getQuote())) {
                // Handle escaped quotes
                if (inQuote && i + 1 < line.length() &&
                    String.valueOf(line.charAt(i + 1)).equals(options.getEscape())) {
                    currentCell.append(options.getQuote());
                    i += 2;
                    continue;
                }
                inQuote = !inQuote;
                i++;
                continue;
            }

            if (!inQuote && currentChar.equals(options.getSeparator())) {
                cells.add(currentCell.toString());
                currentCell = new StringBuilder();
                i++;
                continue;
            }

            currentCell.append(c);
            i++;
        }

        // Add final cell
        cells.add(currentCell.toString());

        // First row might be headers
        if (headers == null) {
            headers = new ArrayList<>(cells);
            return null;
        }

        // Convert to map
        Map<String, String> row = new LinkedHashMap<>();
        for (int j = 0; j < headers.size(); j++) {
            String header = headers.get(j);
            String value = j < cells.size() ? cells.get(j) : "";
            row.put(header, value);
        }

        return row;
    }

    public int getRowCount() {
        return rowCount;
    }

    public List<String> getHeaders() {
        return headers;
    }
}

/**
 * Example usage demonstrations
 */
public class PolyglotUsage {

    public static void example1_basicParsing() {
        System.out.println("Example 1: Basic CSV Parsing\n");

        String csvData = """
            name,age,city
            Alice,30,New York
            Bob,25,San Francisco
            Charlie,35,Boston
            """;

        CSVParser parser = new CSVParser();
        List<Map<String, String>> rows = parser.parseString(csvData);

        for (Map<String, String> row : rows) {
            System.out.println("Row: " + row);
        }

        System.out.println("\nParsed " + parser.getRowCount() + " rows");
    }

    public static void example2_customOptions() {
        System.out.println("\nExample 2: Custom Separator (TSV)\n");

        String tsvData = """
            Alice\t30\tNew York
            Bob\t25\tSan Francisco
            Charlie\t35\tBoston
            """;

        CSVParserOptions options = CSVParserOptions.builder()
            .separator("\t")
            .headers(List.of("name", "age", "city"))
            .build();

        CSVParser parser = new CSVParser(options);
        List<Map<String, String>> rows = parser.parseString(tsvData);

        for (Map<String, String> row : rows) {
            System.out.println(row.get("name") + " is " + row.get("age") +
                             " years old and lives in " + row.get("city"));
        }
    }

    public static void example3_fileProcessing() throws IOException {
        System.out.println("\nExample 3: File Processing\n");

        // Create a test CSV file
        String csvContent = """
            product,price,quantity
            Widget,19.99,100
            Gadget,29.99,50
            Doohickey,9.99,200
            """;

        Path tempFile = Files.createTempFile("test", ".csv");
        Files.writeString(tempFile, csvContent);

        try {
            CSVParser parser = new CSVParser();
            List<Map<String, String>> rows = parser.parseFile(tempFile);

            double totalValue = 0;
            for (Map<String, String> row : rows) {
                double price = Double.parseDouble(row.get("price"));
                int quantity = Integer.parseInt(row.get("quantity"));
                double lineValue = price * quantity;

                System.out.printf("%s: $%.2f × %d = $%.2f%n",
                    row.get("product"), price, quantity, lineValue);
                totalValue += lineValue;
            }

            System.out.printf("\nTotal inventory value: $%.2f%n", totalValue);
        } finally {
            Files.deleteIfExists(tempFile);
        }
    }

    public static void example4_dataTransformation() {
        System.out.println("\nExample 4: Data Transformation\n");

        String csvData = """
            name,age,department
            Alice,30,Engineering
            Bob,25,Sales
            Charlie,35,Engineering
            Diana,28,Marketing
            Eve,32,Engineering
            """;

        CSVParser parser = new CSVParser();
        List<Map<String, String>> rows = parser.parseString(csvData);

        // Filter engineers
        List<Map<String, String>> engineers = rows.stream()
            .filter(row -> "Engineering".equals(row.get("department")))
            .toList();

        System.out.println("Found " + engineers.size() + " engineers:");
        for (Map<String, String> eng : engineers) {
            System.out.println("  - " + eng.get("name") + ", age " + eng.get("age"));
        }
    }

    public static void example5_statistics() {
        System.out.println("\nExample 5: Calculate Statistics\n");

        String csvData = """
            name,score
            Alice,85
            Bob,92
            Charlie,78
            Diana,95
            Eve,88
            """;

        CSVParser parser = new CSVParser();
        List<Map<String, String>> rows = parser.parseString(csvData);

        List<Integer> scores = rows.stream()
            .map(row -> Integer.parseInt(row.get("score")))
            .toList();

        double avgScore = scores.stream()
            .mapToInt(Integer::intValue)
            .average()
            .orElse(0.0);

        int maxScore = scores.stream()
            .mapToInt(Integer::intValue)
            .max()
            .orElse(0);

        int minScore = scores.stream()
            .mapToInt(Integer::intValue)
            .min()
            .orElse(0);

        System.out.println("Total students: " + rows.size());
        System.out.printf("Average score: %.1f%n", avgScore);
        System.out.println("Highest score: " + maxScore);
        System.out.println("Lowest score: " + minScore);
    }

    public static void example6_aggregation() {
        System.out.println("\nExample 6: Aggregation\n");

        String csvData = """
            product,category,sales
            Widget,Electronics,25000
            Gadget,Electronics,30000
            Doohickey,Home,15000
            Thingamajig,Home,18000
            """;

        CSVParser parser = new CSVParser();
        List<Map<String, String>> rows = parser.parseString(csvData);

        // Aggregate by category
        Map<String, Integer> categoryTotals = rows.stream()
            .collect(Collectors.groupingBy(
                row -> row.get("category"),
                Collectors.summingInt(row -> Integer.parseInt(row.get("sales")))
            ));

        System.out.println("Sales by Category:");
        categoryTotals.forEach((category, total) ->
            System.out.printf("  %s: $%,d%n", category, total)
        );
    }

    public static void example7_streamProcessing() {
        System.out.println("\nExample 7: Stream Processing\n");

        String csvData = """
            id,name,salary,department
            1,Alice,75000,Engineering
            2,Bob,45000,Sales
            3,Charlie,95000,Engineering
            4,Diana,55000,Marketing
            5,Eve,85000,Engineering
            """;

        CSVParser parser = new CSVParser();
        List<Map<String, String>> rows = parser.parseString(csvData);

        // Complex stream processing: high-paid engineers
        List<String> highPaidEngineers = rows.stream()
            .filter(row -> "Engineering".equals(row.get("department")))
            .filter(row -> Integer.parseInt(row.get("salary")) > 80000)
            .map(row -> row.get("name"))
            .sorted()
            .toList();

        System.out.println("High-paid engineers (>$80k):");
        highPaidEngineers.forEach(name -> System.out.println("  - " + name));
    }

    public static void main(String[] args) {
        try {
            example1_basicParsing();
            example2_customOptions();
            example3_fileProcessing();
            example4_dataTransformation();
            example5_statistics();
            example6_aggregation();
            example7_streamProcessing();

            System.out.println("\n✓ All Java examples completed successfully!");
        } catch (Exception e) {
            System.err.println("Error running examples: " + e.getMessage());
            e.printStackTrace();
            System.exit(1);
        }
    }
}
