/**
 * Java Elasticsearch Client + TypeScript API
 */
package com.enterprise.elasticsearch;

import java.util.*;
import java.time.Instant;

public class ElasticsearchClient {
    private Map<String, Index> indices;
    private List<SearchQuery> queryHistory;

    public ElasticsearchClient() {
        this.indices = new HashMap<>();
        this.queryHistory = new ArrayList<>();
        initializeDefaultIndex();
    }

    private void initializeDefaultIndex() {
        createIndex("products");
        indexDocument("products", "1", Map.of(
            "name", "Laptop",
            "price", 999.99,
            "category", "Electronics"
        ));
    }

    public Map<String, Object> createIndex(String indexName) {
        if (indices.containsKey(indexName)) {
            return Map.of("error", "Index already exists");
        }

        Index index = new Index(indexName);
        indices.put(indexName, index);

        return Map.of(
            "acknowledged", true,
            "index", indexName,
            "created_at", Instant.now().toString()
        );
    }

    public Map<String, Object> indexDocument(String indexName, String id, Map<String, Object> document) {
        Index index = indices.get(indexName);
        if (index == null) {
            return Map.of("error", "Index not found");
        }

        Document doc = new Document(id, document);
        index.addDocument(doc);

        return Map.of(
            "result", "created",
            "index", indexName,
            "id", id,
            "version", 1
        );
    }

    public Map<String, Object> getDocument(String indexName, String id) {
        Index index = indices.get(indexName);
        if (index == null) {
            return Map.of("error", "Index not found");
        }

        Document doc = index.getDocument(id);
        if (doc == null) {
            return Map.of("found", false);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("found", true);
        result.put("index", indexName);
        result.put("id", id);
        result.put("source", doc.getSource());
        return result;
    }

    public Map<String, Object> search(String indexName, String queryString) {
        Index index = indices.get(indexName);
        if (index == null) {
            return Map.of("error", "Index not found");
        }

        SearchQuery query = new SearchQuery(queryString);
        queryHistory.add(query);

        List<Document> results = index.search(queryString);

        Map<String, Object> response = new HashMap<>();
        response.put("took", 5);
        response.put("hits", Map.of(
            "total", Map.of("value", results.size()),
            "hits", results.stream().map(d -> Map.of(
                "id", d.getId(),
                "source", d.getSource()
            )).toList()
        ));

        return response;
    }

    public Map<String, Object> bulkIndex(String indexName, List<Map<String, Object>> documents) {
        Index index = indices.get(indexName);
        if (index == null) {
            return Map.of("error", "Index not found");
        }

        int indexed = 0;
        for (Map<String, Object> doc : documents) {
            String id = UUID.randomUUID().toString();
            index.addDocument(new Document(id, doc));
            indexed++;
        }

        return Map.of(
            "indexed", indexed,
            "errors", false
        );
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("indices_count", indices.size());
        stats.put("total_documents", indices.values().stream()
            .mapToInt(Index::getDocumentCount).sum());
        stats.put("queries_count", queryHistory.size());

        return stats;
    }

    // Inner classes
    private static class Index {
        private String name;
        private Map<String, Document> documents;

        public Index(String name) {
            this.name = name;
            this.documents = new HashMap<>();
        }

        public void addDocument(Document doc) {
            documents.put(doc.getId(), doc);
        }

        public Document getDocument(String id) {
            return documents.get(id);
        }

        public List<Document> search(String query) {
            // Simple search implementation
            String lowerQuery = query.toLowerCase();
            return documents.values().stream()
                .filter(doc -> matchesQuery(doc, lowerQuery))
                .toList();
        }

        private boolean matchesQuery(Document doc, String query) {
            String docString = doc.getSource().toString().toLowerCase();
            return docString.contains(query);
        }

        public int getDocumentCount() {
            return documents.size();
        }

        public String getName() { return name; }
    }

    private static class Document {
        private String id;
        private Map<String, Object> source;
        private String timestamp;

        public Document(String id, Map<String, Object> source) {
            this.id = id;
            this.source = new HashMap<>(source);
            this.timestamp = Instant.now().toString();
        }

        public String getId() { return id; }
        public Map<String, Object> getSource() { return source; }
        public String getTimestamp() { return timestamp; }
    }

    private static class SearchQuery {
        private String query;
        private String timestamp;

        public SearchQuery(String query) {
            this.query = query;
            this.timestamp = Instant.now().toString();
        }

        public String getQuery() { return query; }
        public String getTimestamp() { return timestamp; }
    }
}
