/**
 * Legacy Java System
 *
 * Represents an old enterprise Java codebase that needs to be
 * integrated with modern TypeScript applications.
 */
package com.enterprise.legacy;

import java.util.*;
import java.text.SimpleDateFormat;

public class LegacySystem {
    private Map<String, Customer> customerDatabase;
    private List<Transaction> transactionHistory;

    public LegacySystem() {
        this.customerDatabase = new HashMap<>();
        this.transactionHistory = new ArrayList<>();
        initializeSampleData();
    }

    private void initializeSampleData() {
        addCustomer("CUST001", "Acme Corp", "Enterprise");
        addCustomer("CUST002", "TechStart Inc", "SMB");
        addCustomer("CUST003", "Global Industries", "Enterprise");
    }

    public void addCustomer(String id, String name, String tier) {
        Customer customer = new Customer(id, name, tier);
        customerDatabase.put(id, customer);
    }

    public Customer getCustomer(String customerId) {
        return customerDatabase.get(customerId);
    }

    public List<Customer> getAllCustomers() {
        return new ArrayList<>(customerDatabase.values());
    }

    public Transaction processTransaction(String customerId, double amount, String type) {
        Customer customer = customerDatabase.get(customerId);
        if (customer == null) {
            throw new IllegalArgumentException("Customer not found: " + customerId);
        }

        Transaction txn = new Transaction(
            "TXN" + System.currentTimeMillis(),
            customerId,
            amount,
            type,
            new Date()
        );

        transactionHistory.add(txn);
        customer.addTransaction(txn);

        return txn;
    }

    public double getCustomerBalance(String customerId) {
        Customer customer = customerDatabase.get(customerId);
        if (customer == null) {
            return 0.0;
        }
        return customer.getBalance();
    }

    public List<Transaction> getCustomerTransactions(String customerId) {
        Customer customer = customerDatabase.get(customerId);
        if (customer == null) {
            return new ArrayList<>();
        }
        return customer.getTransactions();
    }

    public Map<String, Object> generateReport() {
        Map<String, Object> report = new HashMap<>();
        report.put("totalCustomers", customerDatabase.size());
        report.put("totalTransactions", transactionHistory.size());

        double totalVolume = 0;
        for (Transaction txn : transactionHistory) {
            totalVolume += txn.getAmount();
        }
        report.put("totalVolume", totalVolume);
        report.put("generatedAt", new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss").format(new Date()));

        return report;
    }

    // Inner classes
    public static class Customer {
        private String id;
        private String name;
        private String tier;
        private List<Transaction> transactions;
        private double balance;

        public Customer(String id, String name, String tier) {
            this.id = id;
            this.name = name;
            this.tier = tier;
            this.transactions = new ArrayList<>();
            this.balance = 0.0;
        }

        public void addTransaction(Transaction txn) {
            transactions.add(txn);
            if ("CREDIT".equals(txn.getType())) {
                balance += txn.getAmount();
            } else if ("DEBIT".equals(txn.getType())) {
                balance -= txn.getAmount();
            }
        }

        public String getId() { return id; }
        public String getName() { return name; }
        public String getTier() { return tier; }
        public List<Transaction> getTransactions() { return transactions; }
        public double getBalance() { return balance; }
    }

    public static class Transaction {
        private String id;
        private String customerId;
        private double amount;
        private String type;
        private Date timestamp;

        public Transaction(String id, String customerId, double amount, String type, Date timestamp) {
            this.id = id;
            this.customerId = customerId;
            this.amount = amount;
            this.type = type;
            this.timestamp = timestamp;
        }

        public String getId() { return id; }
        public String getCustomerId() { return customerId; }
        public double getAmount() { return amount; }
        public String getType() { return type; }
        public Date getTimestamp() { return timestamp; }
    }
}
