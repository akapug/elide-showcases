/**
 * Java Hadoop MapReduce + TypeScript UI
 */
package com.enterprise.hadoop;

import java.util.*;
import java.time.Instant;

public class HadoopMapReduce {
    private List<MapReduceJob> jobs;

    public HadoopMapReduce() {
        this.jobs = new ArrayList<>();
    }

    public Map<String, Object> submitJob(String jobName, String inputPath, String outputPath) {
        MapReduceJob job = new MapReduceJob(jobName, inputPath, outputPath);
        jobs.add(job);
        job.execute();

        return job.getInfo();
    }

    public List<Map<String, Object>> listJobs() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (MapReduceJob job : jobs) {
            result.add(job.getInfo());
        }
        return result;
    }

    public Map<String, Object> getJobInfo(String jobId) {
        for (MapReduceJob job : jobs) {
            if (job.getId().equals(jobId)) {
                return job.getInfo();
            }
        }
        return Map.of("error", "Job not found");
    }

    private static class MapReduceJob {
        private String id;
        private String name;
        private String inputPath;
        private String outputPath;
        private String status;
        private String startTime;
        private String endTime;
        private Map<String, Object> metrics;

        public MapReduceJob(String name, String inputPath, String outputPath) {
            this.id = UUID.randomUUID().toString();
            this.name = name;
            this.inputPath = inputPath;
            this.outputPath = outputPath;
            this.status = "pending";
        }

        public void execute() {
            this.status = "running";
            this.startTime = Instant.now().toString();

            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {}

            this.status = "completed";
            this.endTime = Instant.now().toString();
            this.metrics = Map.of(
                "map_tasks", 10,
                "reduce_tasks", 5,
                "records_processed", 100000
            );
        }

        public String getId() { return id; }

        public Map<String, Object> getInfo() {
            Map<String, Object> info = new HashMap<>();
            info.put("id", id);
            info.put("name", name);
            info.put("input_path", inputPath);
            info.put("output_path", outputPath);
            info.put("status", status);
            info.put("start_time", startTime);
            info.put("end_time", endTime);
            if (metrics != null) info.put("metrics", metrics);
            return info;
        }
    }
}
