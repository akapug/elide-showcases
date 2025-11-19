/**
 * Java Spark Jobs + TypeScript Orchestration
 */
package com.enterprise.spark;

import java.util.*;
import java.time.Instant;

public class SparkOrchestrator {
    private Map<String, SparkJob> jobs;
    private List<JobExecution> executions;

    public SparkOrchestrator() {
        this.jobs = new HashMap<>();
        this.executions = new ArrayList<>();
        initializeDefaultJobs();
    }

    private void initializeDefaultJobs() {
        registerJob("word_count", "Count words in dataset");
        registerJob("data_aggregation", "Aggregate data by key");
    }

    public Map<String, Object> registerJob(String jobName, String description) {
        SparkJob job = new SparkJob(jobName, description);
        jobs.put(jobName, job);
        return Map.of("registered", true, "job", jobName);
    }

    public Map<String, Object> submitJob(String jobName, Map<String, Object> config) {
        SparkJob job = jobs.get(jobName);
        if (job == null) {
            return Map.of("error", "Job not found");
        }

        JobExecution execution = new JobExecution(jobName, config);
        executions.add(execution);
        execution.execute();

        return execution.getInfo();
    }

    public List<Map<String, Object>> listJobs() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (SparkJob job : jobs.values()) {
            result.add(job.getInfo());
        }
        return result;
    }

    public Map<String, Object> getJobStatus(String executionId) {
        for (JobExecution exec : executions) {
            if (exec.getId().equals(executionId)) {
                return exec.getInfo();
            }
        }
        return Map.of("error", "Execution not found");
    }

    public Map<String, Object> getStats() {
        return Map.of(
            "total_jobs", jobs.size(),
            "total_executions", executions.size(),
            "running", executions.stream().filter(e -> "running".equals(e.getStatus())).count()
        );
    }

    private static class SparkJob {
        private String name;
        private String description;

        public SparkJob(String name, String description) {
            this.name = name;
            this.description = description;
        }

        public Map<String, Object> getInfo() {
            return Map.of("name", name, "description", description);
        }
    }

    private static class JobExecution {
        private String id;
        private String jobName;
        private Map<String, Object> config;
        private String status;
        private String startTime;
        private String endTime;
        private Map<String, Object> result;

        public JobExecution(String jobName, Map<String, Object> config) {
            this.id = UUID.randomUUID().toString();
            this.jobName = jobName;
            this.config = config;
            this.status = "pending";
        }

        public void execute() {
            this.status = "running";
            this.startTime = Instant.now().toString();

            // Simulate Spark execution
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {}

            this.status = "completed";
            this.endTime = Instant.now().toString();
            this.result = Map.of("records_processed", 1000, "success", true);
        }

        public String getId() { return id; }
        public String getStatus() { return status; }

        public Map<String, Object> getInfo() {
            Map<String, Object> info = new HashMap<>();
            info.put("id", id);
            info.put("job_name", jobName);
            info.put("status", status);
            info.put("start_time", startTime);
            info.put("end_time", endTime);
            if (result != null) info.put("result", result);
            return info;
        }
    }
}
