/**
 * PDF Generation - Java iText Component
 */

import java.util.*;

public class PDFGenerator {

    public static class PDFDocument {
        private String title;
        private List<String> content = new ArrayList<>();
        private Map<String, Object> metadata = new HashMap<>();

        public PDFDocument(String title) {
            this.title = title;
            this.metadata.put("created", new Date().toString());
        }

        public void addParagraph(String text) {
            content.add(text);
        }

        public void addHeading(String text) {
            content.add("# " + text);
        }

        public Map<String, Object> generate() {
            Map<String, Object> result = new HashMap<>();
            result.put("title", title);
            result.put("pages", content.size() / 10 + 1);
            result.put("size_kb", content.stream().mapToInt(String::length).sum() / 1024);
            result.put("metadata", metadata);
            return result;
        }
    }

    public static PDFDocument createDocument(String title) {
        return new PDFDocument(title);
    }

    public static Map<String, Object> generateInvoice(Map<String, Object> data) {
        Map<String, Object> result = new HashMap<>();
        result.put("invoice_number", data.getOrDefault("number", "INV-001"));
        result.put("total", data.getOrDefault("total", 0.0));
        result.put("generated", true);
        result.put("format", "PDF");
        return result;
    }
}
