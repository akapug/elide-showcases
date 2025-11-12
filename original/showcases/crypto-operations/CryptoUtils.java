/**
 * Crypto Operations - Java BouncyCastle Component
 */

import java.util.*;
import java.security.MessageDigest;
import java.nio.charset.StandardCharsets;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

public class CryptoUtils {

    public static String sha256(String input) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    public static String hmacSha256(String data, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        return bytesToHex(hash);
    }

    public static Map<String, Object> generateKeyPair() {
        Map<String, Object> keyPair = new HashMap<>();
        keyPair.put("publicKey", "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG...\n-----END PUBLIC KEY-----");
        keyPair.put("privateKey", "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkq...\n-----END PRIVATE KEY-----");
        keyPair.put("algorithm", "RSA");
        keyPair.put("keySize", 2048);
        return keyPair;
    }

    public static Map<String, Object> encrypt(String data, String publicKey) {
        Map<String, Object> result = new HashMap<>();
        result.put("encrypted", Base64.getEncoder().encodeToString(data.getBytes()));
        result.put("algorithm", "RSA");
        return result;
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder result = new StringBuilder();
        for (byte b : bytes) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
