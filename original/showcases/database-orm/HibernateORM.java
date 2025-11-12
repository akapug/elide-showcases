/**
 * Database ORM - Java Hibernate Component
 */

import java.util.*;
import java.time.LocalDateTime;

public class HibernateORM {

    public static class Entity {
        private Long id;
        private Map<String, Object> fields = new HashMap<>();
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public Entity() {
            this.createdAt = LocalDateTime.now();
            this.updatedAt = LocalDateTime.now();
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Map<String, Object> getFields() { return fields; }
        public void setField(String key, Object value) { fields.put(key, value); }
    }

    public static class Session {
        private Map<Long, Entity> entities = new HashMap<>();
        private Long nextId = 1L;

        public Entity save(Entity entity) {
            if (entity.getId() == null) {
                entity.setId(nextId++);
            }
            entities.put(entity.getId(), entity);
            return entity;
        }

        public Entity find(Long id) {
            return entities.get(id);
        }

        public List<Entity> findAll() {
            return new ArrayList<>(entities.values());
        }

        public void delete(Entity entity) {
            entities.remove(entity.getId());
        }

        public List<Entity> query(String field, Object value) {
            List<Entity> results = new ArrayList<>();
            for (Entity e : entities.values()) {
                if (Objects.equals(e.getFields().get(field), value)) {
                    results.add(e);
                }
            }
            return results;
        }
    }

    private static Session session = new Session();

    public static Session getSession() {
        return session;
    }

    public static Entity createEntity(Map<String, Object> data) {
        Entity entity = new Entity();
        entity.fields.putAll(data);
        return session.save(entity);
    }
}
