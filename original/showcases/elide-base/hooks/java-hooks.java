/**
 * ElideBase - Java Hooks
 *
 * Java hooks for enterprise system integrations, API calls, and data transformations.
 * These hooks are executed by ElideBase when database events occur.
 *
 * Example use cases:
 * - CRM integration (Salesforce, HubSpot)
 * - ERP integration (SAP, Oracle)
 * - Payment processing (Stripe, PayPal)
 * - Legacy system integration
 * - Enterprise message bus integration
 */

import com.google.gson.*;
import java.io.*;
import java.util.*;
import java.time.*;
import java.security.*;

/**
 * Base class for ElideBase Java hooks
 */
abstract class Hook {
    protected JsonObject event;
    protected String collection;
    protected JsonObject record;
    protected String action;

    public Hook(JsonObject event) {
        this.event = event;
        this.collection = event.get("collection").getAsString();
        this.record = event.getAsJsonObject("record");
        this.action = event.get("action").getAsString();
    }

    public abstract JsonObject execute();
}

/**
 * CRM Integration Hook
 * Syncs data with external CRM systems like Salesforce, HubSpot
 */
class CRMIntegrationHook extends Hook {
    public CRMIntegrationHook(JsonObject event) {
        super(event);
    }

    @Override
    public JsonObject execute() {
        JsonObject result = new JsonObject();

        try {
            switch (collection) {
                case "leads":
                    return handleLeadEvent();
                case "contacts":
                    return handleContactEvent();
                case "opportunities":
                    return handleOpportunityEvent();
                default:
                    result.addProperty("success", true);
                    return result;
            }
        } catch (Exception e) {
            result.addProperty("success", false);
            result.addProperty("error", e.getMessage());
            return result;
        }
    }

    private JsonObject handleLeadEvent() {
        JsonObject result = new JsonObject();

        if ("create".equals(action)) {
            String leadId = syncLeadToCRM(record);
            result.addProperty("success", true);
            result.addProperty("crm_lead_id", leadId);
            result.addProperty("synced_to_crm", true);

            logIntegration("Lead synced to CRM: " + leadId);
        } else {
            result.addProperty("success", true);
        }

        return result;
    }

    private JsonObject handleContactEvent() {
        JsonObject result = new JsonObject();

        if ("create".equals(action) || "update".equals(action)) {
            String contactId = syncContactToCRM(record);
            result.addProperty("success", true);
            result.addProperty("crm_contact_id", contactId);

            logIntegration("Contact synced to CRM: " + contactId);
        } else {
            result.addProperty("success", true);
        }

        return result;
    }

    private JsonObject handleOpportunityEvent() {
        JsonObject result = new JsonObject();

        if ("create".equals(action)) {
            String opportunityId = syncOpportunityToCRM(record);
            result.addProperty("success", true);
            result.addProperty("crm_opportunity_id", opportunityId);

            logIntegration("Opportunity synced to CRM: " + opportunityId);
        } else {
            result.addProperty("success", true);
        }

        return result;
    }

    private String syncLeadToCRM(JsonObject lead) {
        // Mock CRM sync - in real implementation, call CRM API
        String leadId = generateId();
        System.out.println("[CRM] Syncing lead: " + lead.get("email").getAsString());
        return leadId;
    }

    private String syncContactToCRM(JsonObject contact) {
        String contactId = generateId();
        System.out.println("[CRM] Syncing contact: " + contact.get("email").getAsString());
        return contactId;
    }

    private String syncOpportunityToCRM(JsonObject opportunity) {
        String opportunityId = generateId();
        System.out.println("[CRM] Syncing opportunity: " + opportunity.get("name").getAsString());
        return opportunityId;
    }

    private void logIntegration(String message) {
        System.out.println("[INTEGRATION] " + message);
    }

    private String generateId() {
        return UUID.randomUUID().toString().substring(0, 16);
    }
}

/**
 * Payment Processing Hook
 * Handles payment processing with Stripe, PayPal, etc.
 */
class PaymentProcessingHook extends Hook {
    public PaymentProcessingHook(JsonObject event) {
        super(event);
    }

    @Override
    public JsonObject execute() {
        JsonObject result = new JsonObject();

        try {
            if ("orders".equals(collection) && "create".equals(action)) {
                return processPayment();
            } else if ("refunds".equals(collection) && "create".equals(action)) {
                return processRefund();
            }

            result.addProperty("success", true);
            return result;
        } catch (Exception e) {
            result.addProperty("success", false);
            result.addProperty("error", e.getMessage());
            return result;
        }
    }

    private JsonObject processPayment() {
        JsonObject result = new JsonObject();

        double amount = record.get("amount").getAsDouble();
        String currency = record.has("currency") ? record.get("currency").getAsString() : "USD";
        String paymentMethod = record.has("payment_method")
            ? record.get("payment_method").getAsString()
            : "card";

        // Mock payment processing
        String chargeId = createCharge(amount, currency, paymentMethod);

        result.addProperty("success", true);
        result.addProperty("payment_processed", true);
        result.addProperty("charge_id", chargeId);
        result.addProperty("amount", amount);
        result.addProperty("currency", currency);

        logPayment("Payment processed: " + chargeId + " - $" + amount);

        return result;
    }

    private JsonObject processRefund() {
        JsonObject result = new JsonObject();

        String orderId = record.get("order_id").getAsString();
        double amount = record.get("amount").getAsDouble();

        // Mock refund processing
        String refundId = createRefund(orderId, amount);

        result.addProperty("success", true);
        result.addProperty("refund_processed", true);
        result.addProperty("refund_id", refundId);
        result.addProperty("amount", amount);

        logPayment("Refund processed: " + refundId + " - $" + amount);

        return result;
    }

    private String createCharge(double amount, String currency, String paymentMethod) {
        System.out.println("[PAYMENT] Processing charge: $" + amount + " " + currency);
        return "ch_" + generateId();
    }

    private String createRefund(String orderId, double amount) {
        System.out.println("[PAYMENT] Processing refund for order: " + orderId + " - $" + amount);
        return "ref_" + generateId();
    }

    private void logPayment(String message) {
        System.out.println("[PAYMENT] " + message);
    }

    private String generateId() {
        return UUID.randomUUID().toString().substring(0, 16);
    }
}

/**
 * ERP Integration Hook
 * Integrates with enterprise resource planning systems
 */
class ERPIntegrationHook extends Hook {
    public ERPIntegrationHook(JsonObject event) {
        super(event);
    }

    @Override
    public JsonObject execute() {
        JsonObject result = new JsonObject();

        try {
            switch (collection) {
                case "inventory":
                    return syncInventory();
                case "orders":
                    return syncOrder();
                case "invoices":
                    return syncInvoice();
                default:
                    result.addProperty("success", true);
                    return result;
            }
        } catch (Exception e) {
            result.addProperty("success", false);
            result.addProperty("error", e.getMessage());
            return result;
        }
    }

    private JsonObject syncInventory() {
        JsonObject result = new JsonObject();

        String sku = record.get("sku").getAsString();
        int quantity = record.get("quantity").getAsInt();

        // Mock ERP sync
        String syncId = updateInventoryInERP(sku, quantity);

        result.addProperty("success", true);
        result.addProperty("erp_sync_id", syncId);
        result.addProperty("synced_at", Instant.now().toString());

        System.out.println("[ERP] Inventory synced: " + sku + " - Qty: " + quantity);

        return result;
    }

    private JsonObject syncOrder() {
        JsonObject result = new JsonObject();

        String orderId = record.get("id").getAsString();

        // Mock ERP sync
        String erpOrderId = createOrderInERP(record);

        result.addProperty("success", true);
        result.addProperty("erp_order_id", erpOrderId);
        result.addProperty("synced_at", Instant.now().toString());

        System.out.println("[ERP] Order synced: " + orderId + " -> " + erpOrderId);

        return result;
    }

    private JsonObject syncInvoice() {
        JsonObject result = new JsonObject();

        String invoiceNumber = record.get("invoice_number").getAsString();

        // Mock ERP sync
        String erpInvoiceId = createInvoiceInERP(record);

        result.addProperty("success", true);
        result.addProperty("erp_invoice_id", erpInvoiceId);
        result.addProperty("synced_at", Instant.now().toString());

        System.out.println("[ERP] Invoice synced: " + invoiceNumber + " -> " + erpInvoiceId);

        return result;
    }

    private String updateInventoryInERP(String sku, int quantity) {
        return "inv_" + generateId();
    }

    private String createOrderInERP(JsonObject order) {
        return "ord_" + generateId();
    }

    private String createInvoiceInERP(JsonObject invoice) {
        return "inv_" + generateId();
    }

    private String generateId() {
        return UUID.randomUUID().toString().substring(0, 16);
    }
}

/**
 * Message Bus Integration Hook
 * Publishes events to enterprise message bus (Kafka, RabbitMQ, etc.)
 */
class MessageBusHook extends Hook {
    public MessageBusHook(JsonObject event) {
        super(event);
    }

    @Override
    public JsonObject execute() {
        JsonObject result = new JsonObject();

        try {
            String topic = determineTopicFromCollection(collection);
            String messageId = publishMessage(topic, event);

            result.addProperty("success", true);
            result.addProperty("message_published", true);
            result.addProperty("message_id", messageId);
            result.addProperty("topic", topic);

            System.out.println("[MESSAGE_BUS] Published to topic: " + topic + " - ID: " + messageId);

            return result;
        } catch (Exception e) {
            result.addProperty("success", false);
            result.addProperty("error", e.getMessage());
            return result;
        }
    }

    private String determineTopicFromCollection(String collection) {
        return "elidebase." + collection + "." + action;
    }

    private String publishMessage(String topic, JsonObject message) {
        String messageId = generateId();
        System.out.println("[MESSAGE_BUS] Publishing to " + topic + ": " + message.toString());
        return messageId;
    }

    private String generateId() {
        return UUID.randomUUID().toString().substring(0, 16);
    }
}

/**
 * Main hook registry and executor
 */
public class JavaHooks {
    private static final Map<String, Class<? extends Hook>> HOOKS = new HashMap<>();

    static {
        HOOKS.put("crm_integration", CRMIntegrationHook.class);
        HOOKS.put("payment_processing", PaymentProcessingHook.class);
        HOOKS.put("erp_integration", ERPIntegrationHook.class);
        HOOKS.put("message_bus", MessageBusHook.class);
    }

    public static void main(String[] args) {
        try {
            // Read event from stdin
            BufferedReader reader = new BufferedReader(new InputStreamReader(System.in));
            StringBuilder eventJson = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                eventJson.append(line);
            }

            // Parse JSON event
            Gson gson = new Gson();
            JsonObject event = gson.fromJson(eventJson.toString(), JsonObject.class);

            // Get hook name
            String hookName = event.has("hook") ? event.get("hook").getAsString() : "crm_integration";

            // Get hook class
            Class<? extends Hook> hookClass = HOOKS.get(hookName);

            JsonObject result;
            if (hookClass == null) {
                result = new JsonObject();
                result.addProperty("success", false);
                result.addProperty("error", "Unknown hook: " + hookName);
            } else {
                // Execute hook
                Hook hook = hookClass.getDeclaredConstructor(JsonObject.class).newInstance(event);
                result = hook.execute();
            }

            // Return result as JSON
            System.out.println(gson.toJson(result));

        } catch (Exception e) {
            // Return error
            JsonObject errorResult = new JsonObject();
            errorResult.addProperty("success", false);
            errorResult.addProperty("error", e.getMessage());

            Gson gson = new Gson();
            System.out.println(gson.toJson(errorResult));
            System.exit(1);
        }
    }
}
