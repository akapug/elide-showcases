/**
 * Blockchain Utils - Java Web3j Component
 */

import java.util.*;
import java.math.BigInteger;

public class Web3Utils {

    public static class Transaction {
        private String from;
        private String to;
        private BigInteger value;
        private long timestamp;
        private String hash;

        public Transaction(String from, String to, BigInteger value) {
            this.from = from;
            this.to = to;
            this.value = value;
            this.timestamp = System.currentTimeMillis();
            this.hash = generateHash();
        }

        private String generateHash() {
            return "0x" + Integer.toHexString((from + to + value.toString()).hashCode());
        }

        public Map<String, Object> toMap() {
            Map<String, Object> map = new HashMap<>();
            map.put("from", from);
            map.put("to", to);
            map.put("value", value.toString());
            map.put("timestamp", timestamp);
            map.put("hash", hash);
            return map;
        }
    }

    public static Map<String, Object> getBalance(String address) {
        Map<String, Object> result = new HashMap<>();
        result.put("address", address);
        result.put("balance", "1000000000000000000");
        result.put("unit", "wei");
        return result;
    }

    public static Map<String, Object> createTransaction(String from, String to, String value) {
        BigInteger valueBigInt = new BigInteger(value);
        Transaction tx = new Transaction(from, to, valueBigInt);
        return tx.toMap();
    }

    public static Map<String, Object> getBlockInfo(int blockNumber) {
        Map<String, Object> block = new HashMap<>();
        block.put("number", blockNumber);
        block.put("hash", "0x" + Integer.toHexString(blockNumber));
        block.put("timestamp", System.currentTimeMillis());
        block.put("transactions", 15);
        return block;
    }

    public static boolean validateAddress(String address) {
        return address != null && address.startsWith("0x") && address.length() == 42;
    }
}
