/**
 * Java Spring Integration - Spring Beans Component
 *
 * Demonstrates real polyglot integration with Java Spring beans.
 * This module is directly imported by TypeScript via Elide's polyglot runtime.
 */

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class SpringBeans {

    // Simulated Spring ApplicationContext
    public static class ApplicationContext {
        private Map<String, Object> beans = new ConcurrentHashMap<>();
        private Map<String, String> beanScopes = new ConcurrentHashMap<>();

        public void registerBean(String name, Object bean, String scope) {
            beans.put(name, bean);
            beanScopes.put(name, scope);
        }

        public Object getBean(String name) {
            if (!beans.containsKey(name)) {
                throw new IllegalArgumentException("No bean named '" + name + "' found");
            }

            String scope = beanScopes.get(name);
            if ("prototype".equals(scope)) {
                // Create new instance for prototype scope
                Object bean = beans.get(name);
                if (bean instanceof PrototypeBean) {
                    return ((PrototypeBean) bean).createNewInstance();
                }
            }

            return beans.get(name);
        }

        public List<String> getBeanNames() {
            return new ArrayList<>(beans.keySet());
        }

        public Map<String, Object> getBeanInfo(String name) {
            Map<String, Object> info = new HashMap<>();
            info.put("name", name);
            info.put("exists", beans.containsKey(name));
            info.put("scope", beanScopes.getOrDefault(name, "singleton"));
            info.put("type", beans.containsKey(name) ?
                beans.get(name).getClass().getSimpleName() : "unknown");
            return info;
        }
    }

    // Service Bean Example
    public static class UserService {
        private List<Map<String, Object>> users = new ArrayList<>();
        private int nextId = 1;

        public Map<String, Object> createUser(String name, String email) {
            Map<String, Object> user = new HashMap<>();
            user.put("id", nextId++);
            user.put("name", name);
            user.put("email", email);
            user.put("createdAt", LocalDateTime.now().format(
                DateTimeFormatter.ISO_DATE_TIME));
            users.add(user);
            return user;
        }

        public List<Map<String, Object>> getAllUsers() {
            return new ArrayList<>(users);
        }

        public Map<String, Object> getUserById(int id) {
            return users.stream()
                .filter(u -> (Integer) u.get("id") == id)
                .findFirst()
                .orElse(null);
        }

        public boolean deleteUser(int id) {
            return users.removeIf(u -> (Integer) u.get("id") == id);
        }
    }

    // Repository Bean Example
    public static class DataRepository {
        private Map<String, List<Map<String, Object>>> collections = new ConcurrentHashMap<>();

        public void save(String collection, Map<String, Object> data) {
            collections.computeIfAbsent(collection, k -> new ArrayList<>()).add(data);
        }

        public List<Map<String, Object>> findAll(String collection) {
            return new ArrayList<>(collections.getOrDefault(collection, new ArrayList<>()));
        }

        public Map<String, Object> findById(String collection, Object id) {
            return collections.getOrDefault(collection, new ArrayList<>())
                .stream()
                .filter(item -> Objects.equals(item.get("id"), id))
                .findFirst()
                .orElse(null);
        }

        public long count(String collection) {
            return collections.getOrDefault(collection, new ArrayList<>()).size();
        }
    }

    // Component Bean Example
    public static class EventPublisher {
        private List<Map<String, Object>> events = new ArrayList<>();

        public void publishEvent(String eventType, Map<String, Object> payload) {
            Map<String, Object> event = new HashMap<>();
            event.put("type", eventType);
            event.put("payload", payload);
            event.put("timestamp", LocalDateTime.now().format(
                DateTimeFormatter.ISO_DATE_TIME));
            events.add(event);
        }

        public List<Map<String, Object>> getEvents() {
            return new ArrayList<>(events);
        }

        public List<Map<String, Object>> getEventsByType(String eventType) {
            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> event : events) {
                if (eventType.equals(event.get("type"))) {
                    filtered.add(event);
                }
            }
            return filtered;
        }
    }

    // Prototype Bean Example
    public interface PrototypeBean {
        Object createNewInstance();
    }

    public static class RequestScope implements PrototypeBean {
        private String requestId;
        private LocalDateTime createdAt;

        public RequestScope() {
            this.requestId = UUID.randomUUID().toString();
            this.createdAt = LocalDateTime.now();
        }

        public String getRequestId() {
            return requestId;
        }

        public String getCreatedAt() {
            return createdAt.format(DateTimeFormatter.ISO_DATE_TIME);
        }

        @Override
        public Object createNewInstance() {
            return new RequestScope();
        }
    }

    // Global application context
    private static ApplicationContext context = new ApplicationContext();

    static {
        // Register default beans
        context.registerBean("userService", new UserService(), "singleton");
        context.registerBean("dataRepository", new DataRepository(), "singleton");
        context.registerBean("eventPublisher", new EventPublisher(), "singleton");
        context.registerBean("requestScope", new RequestScope(), "prototype");
    }

    // Public API for TypeScript
    public static ApplicationContext getContext() {
        return context;
    }

    public static UserService getUserService() {
        return (UserService) context.getBean("userService");
    }

    public static DataRepository getDataRepository() {
        return (DataRepository) context.getBean("dataRepository");
    }

    public static EventPublisher getEventPublisher() {
        return (EventPublisher) context.getBean("eventPublisher");
    }
}
