/**
 * Zod for Java (via Elide)
 *
 * This is a Java implementation of Zod's validation API that works seamlessly
 * with TypeScript Zod schemas. This demonstrates Elide's unique polyglot capabilities:
 *
 * - Define schemas once in TypeScript
 * - Use the SAME schemas in Java
 * - Share validation logic across services
 * - Impossible with Node.js, Deno, or Bun!
 *
 * Example:
 *     // Import schema defined in TypeScript
 *     Map<String, Object> user = UserSchema.validate(data);
 */

package zod;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Zod validation error
 */
class ValidationException extends Exception {
    private List<Map<String, Object>> issues;

    public ValidationException(List<Map<String, Object>> issues) {
        super(formatIssues(issues));
        this.issues = issues;
    }

    public List<Map<String, Object>> getIssues() {
        return issues;
    }

    private static String formatIssues(List<Map<String, Object>> issues) {
        StringBuilder sb = new StringBuilder();
        for (Map<String, Object> issue : issues) {
            List<String> path = (List<String>) issue.get("path");
            String pathStr = path.isEmpty() ? "" : String.join(".", path) + ": ";
            sb.append(pathStr).append(issue.get("message")).append("; ");
        }
        return sb.toString();
    }

    public Map<String, Object> format() {
        Map<String, Object> formatted = new HashMap<>();
        for (Map<String, Object> issue : issues) {
            List<String> path = (List<String>) issue.get("path");
            Map<String, Object> current = formatted;

            for (int i = 0; i < path.size() - 1; i++) {
                String key = path.get(i);
                if (!current.containsKey(key)) {
                    current.put(key, new HashMap<String, Object>());
                }
                current = (Map<String, Object>) current.get(key);
            }

            String lastKey = path.isEmpty() ? "_errors" : path.get(path.size() - 1);
            if (!current.containsKey(lastKey)) {
                current.put(lastKey, new ArrayList<String>());
            }
            ((List<String>) current.get(lastKey)).add((String) issue.get("message"));
        }
        return formatted;
    }
}

/**
 * Base class for all Zod types
 */
abstract class ZodType<T> {
    public T parse(Object value) throws ValidationException {
        try {
            return _parse(value);
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            throw createValidationException("custom", e.getMessage(), Collections.emptyList());
        }
    }

    public Map<String, Object> safeParse(Object value) {
        Map<String, Object> result = new HashMap<>();
        try {
            T data = _parse(value);
            result.put("success", true);
            result.put("data", data);
        } catch (ValidationException e) {
            result.put("success", false);
            result.put("error", e);
        }
        return result;
    }

    protected abstract T _parse(Object value) throws ValidationException;

    protected ValidationException createValidationException(String code, String message, List<String> path) {
        Map<String, Object> issue = new HashMap<>();
        issue.put("code", code);
        issue.put("message", message);
        issue.put("path", path);
        return new ValidationException(Collections.singletonList(issue));
    }
}

/**
 * String schema
 */
class ZodString extends ZodType<String> {
    private List<Map<String, Object>> checks = new ArrayList<>();

    @Override
    protected String _parse(Object value) throws ValidationException {
        if (!(value instanceof String)) {
            throw createValidationException(
                "invalid_type",
                "Expected string, received " + value.getClass().getSimpleName(),
                Collections.emptyList()
            );
        }

        String str = (String) value;

        for (Map<String, Object> check : checks) {
            String kind = (String) check.get("kind");
            switch (kind) {
                case "min":
                    int min = (Integer) check.get("value");
                    if (str.length() < min) {
                        throw createValidationException(
                            "too_small",
                            "String must be at least " + min + " characters",
                            Collections.emptyList()
                        );
                    }
                    break;
                case "max":
                    int max = (Integer) check.get("value");
                    if (str.length() > max) {
                        throw createValidationException(
                            "too_big",
                            "String must be at most " + max + " characters",
                            Collections.emptyList()
                        );
                    }
                    break;
                case "email":
                    if (!Pattern.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$", str)) {
                        throw createValidationException(
                            "invalid_string",
                            "Invalid email",
                            Collections.emptyList()
                        );
                    }
                    break;
                case "url":
                    if (!str.startsWith("http://") && !str.startsWith("https://")) {
                        throw createValidationException(
                            "invalid_string",
                            "Invalid url",
                            Collections.emptyList()
                        );
                    }
                    break;
            }
        }

        return str;
    }

    public ZodString min(int value) {
        ZodString newSchema = new ZodString();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "min");
        check.put("value", value);
        newSchema.checks.add(check);
        return newSchema;
    }

    public ZodString max(int value) {
        ZodString newSchema = new ZodString();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "max");
        check.put("value", value);
        newSchema.checks.add(check);
        return newSchema;
    }

    public ZodString email() {
        ZodString newSchema = new ZodString();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "email");
        newSchema.checks.add(check);
        return newSchema;
    }

    public ZodString url() {
        ZodString newSchema = new ZodString();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "url");
        newSchema.checks.add(check);
        return newSchema;
    }
}

/**
 * Number schema
 */
class ZodNumber extends ZodType<Number> {
    private List<Map<String, Object>> checks = new ArrayList<>();

    @Override
    protected Number _parse(Object value) throws ValidationException {
        if (!(value instanceof Number)) {
            throw createValidationException(
                "invalid_type",
                "Expected number, received " + value.getClass().getSimpleName(),
                Collections.emptyList()
            );
        }

        Number num = (Number) value;

        for (Map<String, Object> check : checks) {
            String kind = (String) check.get("kind");
            switch (kind) {
                case "min":
                    double min = ((Number) check.get("value")).doubleValue();
                    if (num.doubleValue() < min) {
                        throw createValidationException(
                            "too_small",
                            "Number must be at least " + min,
                            Collections.emptyList()
                        );
                    }
                    break;
                case "max":
                    double max = ((Number) check.get("value")).doubleValue();
                    if (num.doubleValue() > max) {
                        throw createValidationException(
                            "too_big",
                            "Number must be at most " + max,
                            Collections.emptyList()
                        );
                    }
                    break;
                case "int":
                    if (!(value instanceof Integer) && !(value instanceof Long)) {
                        throw createValidationException(
                            "invalid_type",
                            "Expected integer, received float",
                            Collections.emptyList()
                        );
                    }
                    break;
            }
        }

        return num;
    }

    public ZodNumber min(double value) {
        ZodNumber newSchema = new ZodNumber();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "min");
        check.put("value", value);
        newSchema.checks.add(check);
        return newSchema;
    }

    public ZodNumber max(double value) {
        ZodNumber newSchema = new ZodNumber();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "max");
        check.put("value", value);
        newSchema.checks.add(check);
        return newSchema;
    }

    public ZodNumber intType() {
        ZodNumber newSchema = new ZodNumber();
        newSchema.checks = new ArrayList<>(this.checks);
        Map<String, Object> check = new HashMap<>();
        check.put("kind", "int");
        newSchema.checks.add(check);
        return newSchema;
    }
}

/**
 * Boolean schema
 */
class ZodBoolean extends ZodType<Boolean> {
    @Override
    protected Boolean _parse(Object value) throws ValidationException {
        if (!(value instanceof Boolean)) {
            throw createValidationException(
                "invalid_type",
                "Expected boolean, received " + value.getClass().getSimpleName(),
                Collections.emptyList()
            );
        }
        return (Boolean) value;
    }
}

/**
 * Object schema
 */
class ZodObject extends ZodType<Map<String, Object>> {
    private Map<String, ZodType<?>> shape;

    public ZodObject(Map<String, ZodType<?>> shape) {
        this.shape = shape;
    }

    @Override
    protected Map<String, Object> _parse(Object value) throws ValidationException {
        if (!(value instanceof Map)) {
            throw createValidationException(
                "invalid_type",
                "Expected object, received " + value.getClass().getSimpleName(),
                Collections.emptyList()
            );
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> inputMap = (Map<String, Object>) value;
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> issues = new ArrayList<>();

        for (Map.Entry<String, ZodType<?>> entry : shape.entrySet()) {
            String key = entry.getKey();
            ZodType<?> schema = entry.getValue();

            try {
                result.put(key, schema._parse(inputMap.get(key)));
            } catch (ValidationException e) {
                for (Map<String, Object> issue : e.getIssues()) {
                    List<String> path = new ArrayList<>();
                    path.add(key);
                    path.addAll((List<String>) issue.get("path"));
                    issue.put("path", path);
                    issues.add(issue);
                }
            }
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }

        return result;
    }
}

/**
 * Array schema
 */
class ZodArray extends ZodType<List<Object>> {
    private ZodType<?> elementType;
    private Integer minLength;
    private Integer maxLength;

    public ZodArray(ZodType<?> elementType) {
        this.elementType = elementType;
    }

    @Override
    protected List<Object> _parse(Object value) throws ValidationException {
        if (!(value instanceof List)) {
            throw createValidationException(
                "invalid_type",
                "Expected array, received " + value.getClass().getSimpleName(),
                Collections.emptyList()
            );
        }

        @SuppressWarnings("unchecked")
        List<Object> list = (List<Object>) value;

        if (minLength != null && list.size() < minLength) {
            throw createValidationException(
                "too_small",
                "Array must have at least " + minLength + " elements",
                Collections.emptyList()
            );
        }

        if (maxLength != null && list.size() > maxLength) {
            throw createValidationException(
                "too_big",
                "Array must have at most " + maxLength + " elements",
                Collections.emptyList()
            );
        }

        List<Object> result = new ArrayList<>();
        List<Map<String, Object>> issues = new ArrayList<>();

        for (int i = 0; i < list.size(); i++) {
            try {
                result.add(elementType._parse(list.get(i)));
            } catch (ValidationException e) {
                for (Map<String, Object> issue : e.getIssues()) {
                    List<String> path = new ArrayList<>();
                    path.add(String.valueOf(i));
                    path.addAll((List<String>) issue.get("path"));
                    issue.put("path", path);
                    issues.add(issue);
                }
            }
        }

        if (!issues.isEmpty()) {
            throw new ValidationException(issues);
        }

        return result;
    }

    public ZodArray min(int value) {
        ZodArray newSchema = new ZodArray(this.elementType);
        newSchema.minLength = value;
        newSchema.maxLength = this.maxLength;
        return newSchema;
    }

    public ZodArray max(int value) {
        ZodArray newSchema = new ZodArray(this.elementType);
        newSchema.minLength = this.minLength;
        newSchema.maxLength = value;
        return newSchema;
    }
}

/**
 * Main Zod API (mimics TypeScript's 'z')
 */
public class Zod {
    public static ZodString string() {
        return new ZodString();
    }

    public static ZodNumber number() {
        return new ZodNumber();
    }

    public static ZodBoolean booleanType() {
        return new ZodBoolean();
    }

    public static ZodObject object(Map<String, ZodType<?>> shape) {
        return new ZodObject(shape);
    }

    public static ZodArray array(ZodType<?> elementType) {
        return new ZodArray(elementType);
    }
}

/**
 * Validator for deserializing and validating with schemas
 */
class ZodValidator {
    private static final ObjectMapper mapper = new ObjectMapper();

    public static Object validateWithSchema(Object data, JsonNode schemaDef) throws ValidationException {
        ZodType<?> schema = deserializeSchema(schemaDef);
        return schema.parse(data);
    }

    private static ZodType<?> deserializeSchema(JsonNode schemaDef) {
        String schemaType = schemaDef.get("type").asText();

        switch (schemaType) {
            case "ZodString":
                ZodString stringSchema = new ZodString();
                // Add checks if needed
                return stringSchema;

            case "ZodNumber":
                ZodNumber numberSchema = new ZodNumber();
                // Add checks if needed
                return numberSchema;

            case "ZodBoolean":
                return new ZodBoolean();

            case "ZodObject":
                Map<String, ZodType<?>> shape = new HashMap<>();
                JsonNode shapeNode = schemaDef.get("shape");
                shapeNode.fieldNames().forEachRemaining(key -> {
                    shape.put(key, deserializeSchema(shapeNode.get(key)));
                });
                return new ZodObject(shape);

            case "ZodArray":
                ZodType<?> element = deserializeSchema(schemaDef.get("element"));
                return new ZodArray(element);

            default:
                throw new IllegalArgumentException("Unknown schema type: " + schemaType);
        }
    }
}
