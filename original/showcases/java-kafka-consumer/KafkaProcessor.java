/**
 * Java Kafka Consumer + TypeScript Processing
 *
 * Demonstrates Java Kafka consumer with TypeScript message processing
 */
package com.enterprise.kafka;

import java.util.*;
import java.time.Instant;

public class KafkaProcessor {
    private List<Message> messageQueue;
    private Map<String, TopicStats> topicStats;
    private MessageProcessor processor;

    public KafkaProcessor() {
        this.messageQueue = new ArrayList<>();
        this.topicStats = new HashMap<>();
        this.processor = new MessageProcessor();
    }

    public Message consumeMessage(String topic, String key, String value) {
        Message message = new Message(
            UUID.randomUUID().toString(),
            topic,
            key,
            value,
            Instant.now().toString()
        );

        messageQueue.add(message);
        updateTopicStats(topic);

        return message;
    }

    public List<Message> consumeBatch(String topic, List<Map<String, String>> records) {
        List<Message> messages = new ArrayList<>();

        for (Map<String, String> record : records) {
            String key = record.get("key");
            String value = record.get("value");
            Message msg = consumeMessage(topic, key, value);
            messages.add(msg);
        }

        return messages;
    }

    public ProcessingResult processMessage(String messageId) {
        Message message = findMessage(messageId);
        if (message == null) {
            throw new IllegalArgumentException("Message not found: " + messageId);
        }

        return processor.process(message);
    }

    public List<ProcessingResult> processBatch(List<String> messageIds) {
        List<ProcessingResult> results = new ArrayList<>();

        for (String id : messageIds) {
            try {
                results.add(processMessage(id));
            } catch (Exception e) {
                ProcessingResult error = new ProcessingResult();
                error.messageId = id;
                error.success = false;
                error.error = e.getMessage();
                results.add(error);
            }
        }

        return results;
    }

    public List<Message> getMessages(String topic) {
        if (topic == null) {
            return new ArrayList<>(messageQueue);
        }

        List<Message> filtered = new ArrayList<>();
        for (Message msg : messageQueue) {
            if (topic.equals(msg.getTopic())) {
                filtered.add(msg);
            }
        }
        return filtered;
    }

    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalMessages", messageQueue.size());
        stats.put("topicCount", topicStats.size());
        stats.put("topics", topicStats);
        stats.put("timestamp", Instant.now().toString());
        return stats;
    }

    public void clearMessages() {
        messageQueue.clear();
        topicStats.clear();
    }

    private void updateTopicStats(String topic) {
        TopicStats stats = topicStats.get(topic);
        if (stats == null) {
            stats = new TopicStats(topic);
            topicStats.put(topic, stats);
        }
        stats.incrementCount();
    }

    private Message findMessage(String messageId) {
        for (Message msg : messageQueue) {
            if (messageId.equals(msg.getId())) {
                return msg;
            }
        }
        return null;
    }

    // Inner classes
    public static class Message {
        private String id;
        private String topic;
        private String key;
        private String value;
        private String timestamp;

        public Message(String id, String topic, String key, String value, String timestamp) {
            this.id = id;
            this.topic = topic;
            this.key = key;
            this.value = value;
            this.timestamp = timestamp;
        }

        public String getId() { return id; }
        public String getTopic() { return topic; }
        public String getKey() { return key; }
        public String getValue() { return value; }
        public String getTimestamp() { return timestamp; }
    }

    public static class ProcessingResult {
        public String messageId;
        public boolean success;
        public String processedValue;
        public String error;
        public String processedAt;

        public ProcessingResult() {
            this.processedAt = Instant.now().toString();
        }

        public String getMessageId() { return messageId; }
        public boolean isSuccess() { return success; }
        public String getProcessedValue() { return processedValue; }
        public String getError() { return error; }
        public String getProcessedAt() { return processedAt; }
    }

    public static class TopicStats {
        private String name;
        private int messageCount;

        public TopicStats(String name) {
            this.name = name;
            this.messageCount = 0;
        }

        public void incrementCount() {
            this.messageCount++;
        }

        public String getName() { return name; }
        public int getMessageCount() { return messageCount; }
    }

    private static class MessageProcessor {
        public ProcessingResult process(Message message) {
            ProcessingResult result = new ProcessingResult();
            result.messageId = message.getId();
            result.success = true;

            // Simulate processing
            String value = message.getValue();
            result.processedValue = value.toUpperCase() + "_PROCESSED";

            return result;
        }
    }
}
