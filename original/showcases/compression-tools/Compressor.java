/**
 * Compression Tools - Java Component
 */

import java.util.*;
import java.util.zip.*;
import java.io.*;
import java.nio.charset.StandardCharsets;

public class Compressor {

    public static Map<String, Object> compress(String data) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPOutputStream gzos = new GZIPOutputStream(baos)) {
            gzos.write(data.getBytes(StandardCharsets.UTF_8));
        }

        byte[] compressed = baos.toByteArray();

        Map<String, Object> result = new HashMap<>();
        result.put("original_size", data.length());
        result.put("compressed_size", compressed.length);
        result.put("compression_ratio", (double) compressed.length / data.length());
        result.put("savings_percent", (1.0 - (double) compressed.length / data.length()) * 100);
        result.put("algorithm", "GZIP");
        return result;
    }

    public static String decompress(byte[] compressed) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (GZIPInputStream gzis = new GZIPInputStream(new ByteArrayInputStream(compressed))) {
            byte[] buffer = new byte[1024];
            int len;
            while ((len = gzis.read(buffer)) > 0) {
                baos.write(buffer, 0, len);
            }
        }
        return baos.toString(StandardCharsets.UTF_8.name());
    }

    public static Map<String, Object> analyzeCompression(String data) {
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("size", data.length());
        analysis.put("entropy", calculateEntropy(data));
        analysis.put("compressible", calculateEntropy(data) > 0.5);
        return analysis;
    }

    private static double calculateEntropy(String data) {
        Map<Character, Integer> freq = new HashMap<>();
        for (char c : data.toCharArray()) {
            freq.put(c, freq.getOrDefault(c, 0) + 1);
        }

        double entropy = 0.0;
        int length = data.length();
        for (int count : freq.values()) {
            double probability = (double) count / length;
            entropy -= probability * (Math.log(probability) / Math.log(2));
        }

        return entropy / 8.0;
    }
}
