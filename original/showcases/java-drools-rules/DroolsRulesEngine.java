/**
 * Java Drools Rules Engine + TypeScript
 */
package com.enterprise.drools;

import java.util.*;
import java.time.Instant;

public class DroolsRulesEngine {
    private Map<String, Rule> rules;
    private List<RuleExecution> executions;

    public DroolsRulesEngine() {
        this.rules = new HashMap<>();
        this.executions = new ArrayList<>();
        initializeDefaultRules();
    }

    private void initializeDefaultRules() {
        addRule("discount_rule", "Apply discount if total > 100",
                "facts.total > 100", "facts.discount = 0.1");
    }

    public Map<String, Object> addRule(String name, String description,
                                       String condition, String action) {
        Rule rule = new Rule(name, description, condition, action);
        rules.put(name, rule);
        return rule.getInfo();
    }

    public Map<String, Object> executeRules(Map<String, Object> facts) {
        RuleExecution execution = new RuleExecution(facts);

        for (Rule rule : rules.values()) {
            if (rule.evaluate(facts)) {
                rule.execute(facts);
                execution.addFiredRule(rule.getName());
            }
        }

        executions.add(execution);
        return execution.getResult();
    }

    public List<Map<String, Object>> listRules() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Rule rule : rules.values()) {
            result.add(rule.getInfo());
        }
        return result;
    }

    private static class Rule {
        private String name;
        private String description;
        private String condition;
        private String action;

        public Rule(String name, String description, String condition, String action) {
            this.name = name;
            this.description = description;
            this.condition = condition;
            this.action = action;
        }

        public boolean evaluate(Map<String, Object> facts) {
            // Simplified evaluation
            if (facts.containsKey("total")) {
                Object total = facts.get("total");
                if (total instanceof Number) {
                    return ((Number) total).doubleValue() > 100;
                }
            }
            return false;
        }

        public void execute(Map<String, Object> facts) {
            facts.put("discount", 0.1);
        }

        public String getName() { return name; }

        public Map<String, Object> getInfo() {
            return Map.of(
                "name", name,
                "description", description,
                "condition", condition,
                "action", action
            );
        }
    }

    private static class RuleExecution {
        private String id;
        private Map<String, Object> facts;
        private List<String> firedRules;
        private String timestamp;

        public RuleExecution(Map<String, Object> facts) {
            this.id = UUID.randomUUID().toString();
            this.facts = new HashMap<>(facts);
            this.firedRules = new ArrayList<>();
            this.timestamp = Instant.now().toString();
        }

        public void addFiredRule(String ruleName) {
            firedRules.add(ruleName);
        }

        public Map<String, Object> getResult() {
            return Map.of(
                "execution_id", id,
                "facts", facts,
                "fired_rules", firedRules,
                "timestamp", timestamp
            );
        }
    }
}
