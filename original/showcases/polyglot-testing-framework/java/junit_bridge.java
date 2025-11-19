/**
 * JUnit Bridge for Polyglot Testing Framework
 *
 * Integrates JUnit with the unified testing framework, providing
 * cross-language test execution, assertions, and reporting.
 */

package com.polyglot.testing;

import java.lang.annotation.*;
import java.lang.reflect.*;
import java.net.URI;
import java.net.http.*;
import java.util.*;
import java.util.concurrent.*;
import com.google.gson.*;

/**
 * Custom assertion error with detailed information
 */
class AssertionError extends RuntimeException {
    private final Object actual;
    private final Object expected;
    private final String operator;

    public AssertionError(String message, Object actual, Object expected, String operator) {
        super(message);
        this.actual = actual;
        this.expected = expected;
        this.operator = operator;
    }

    public Object getActual() { return actual; }
    public Object getExpected() { return expected; }
    public String getOperator() { return operator; }
}

/**
 * Unified assertion library for Java
 */
class Assertion<T> {
    private final T actual;
    private final boolean negated;

    public Assertion(T actual) {
        this(actual, false);
    }

    private Assertion(T actual, boolean negated) {
        this.actual = actual;
        this.negated = negated;
    }

    public Assertion<T> not() {
        return new Assertion<>(actual, !negated);
    }

    public void toBe(T expected) {
        boolean passed = actual == expected;

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be %s", actual, expected),
                actual,
                expected,
                "toBe"
            );
        }
    }

    public void toEqual(T expected) {
        boolean passed = Objects.equals(actual, expected);

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to equal %s", actual, expected),
                actual,
                expected,
                "toEqual"
            );
        }
    }

    public void toBeTruthy() {
        boolean passed = isTruthy(actual);

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be truthy", actual),
                actual,
                true,
                "toBeTruthy"
            );
        }
    }

    public void toBeFalsy() {
        boolean passed = !isTruthy(actual);

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be falsy", actual),
                actual,
                false,
                "toBeFalsy"
            );
        }
    }

    public void toBeNull() {
        boolean passed = actual == null;

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be null", actual),
                actual,
                null,
                "toBeNull"
            );
        }
    }

    public void toBeGreaterThan(Number expected) {
        if (!(actual instanceof Number)) {
            throw new IllegalArgumentException("toBeGreaterThan can only be used with numbers");
        }

        double actualValue = ((Number) actual).doubleValue();
        double expectedValue = expected.doubleValue();
        boolean passed = actualValue > expectedValue;

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be greater than %s", actual, expected),
                actual,
                expected,
                "toBeGreaterThan"
            );
        }
    }

    public void toBeLessThan(Number expected) {
        if (!(actual instanceof Number)) {
            throw new IllegalArgumentException("toBeLessThan can only be used with numbers");
        }

        double actualValue = ((Number) actual).doubleValue();
        double expectedValue = expected.doubleValue();
        boolean passed = actualValue < expectedValue;

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be less than %s", actual, expected),
                actual,
                expected,
                "toBeLessThan"
            );
        }
    }

    public void toContain(Object item) {
        boolean passed = false;

        if (actual instanceof String) {
            passed = ((String) actual).contains((String) item);
        } else if (actual instanceof Collection) {
            passed = ((Collection<?>) actual).contains(item);
        } else if (actual instanceof Object[]) {
            passed = Arrays.asList((Object[]) actual).contains(item);
        } else {
            throw new IllegalArgumentException("toContain can only be used with strings, collections, or arrays");
        }

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to contain %s", actual, item),
                actual,
                item,
                "toContain"
            );
        }
    }

    public void toHaveLength(int length) {
        int actualLength = -1;

        if (actual instanceof String) {
            actualLength = ((String) actual).length();
        } else if (actual instanceof Collection) {
            actualLength = ((Collection<?>) actual).size();
        } else if (actual instanceof Object[]) {
            actualLength = ((Object[]) actual).length;
        } else {
            throw new IllegalArgumentException("toHaveLength can only be used with strings, collections, or arrays");
        }

        boolean passed = actualLength == length;

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected length %d to be %d", actualLength, length),
                actualLength,
                length,
                "toHaveLength"
            );
        }
    }

    public void toMatch(String pattern) {
        if (!(actual instanceof String)) {
            throw new IllegalArgumentException("toMatch can only be used with strings");
        }

        boolean passed = ((String) actual).matches(pattern);

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected '%s' to match pattern '%s'", actual, pattern),
                actual,
                pattern,
                "toMatch"
            );
        }
    }

    public void toThrow(Class<? extends Throwable> expectedException) {
        if (!(actual instanceof Runnable)) {
            throw new IllegalArgumentException("toThrow can only be used with runnables");
        }

        boolean thrown = false;
        Throwable error = null;

        try {
            ((Runnable) actual).run();
        } catch (Throwable e) {
            thrown = true;
            error = e;
        }

        if (!thrown && !negated) {
            throw new AssertionError(
                "Expected function to throw, but it did not",
                null,
                "exception",
                "toThrow"
            );
        }

        if (thrown && expectedException != null && !expectedException.isInstance(error)) {
            throw new AssertionError(
                String.format("Expected %s, got %s", expectedException.getName(), error.getClass().getName()),
                error.getClass().getName(),
                expectedException.getName(),
                "toThrow"
            );
        }
    }

    public void toBeInstanceOf(Class<?> klass) {
        boolean passed = klass.isInstance(actual);

        if (shouldFail(passed)) {
            throw new AssertionError(
                String.format("Expected %s to be instance of %s", actual, klass.getName()),
                actual != null ? actual.getClass().getName() : "null",
                klass.getName(),
                "toBeInstanceOf"
            );
        }
    }

    private boolean shouldFail(boolean passed) {
        return negated ? passed : !passed;
    }

    private boolean isTruthy(Object value) {
        if (value == null) return false;
        if (value instanceof Boolean) return (Boolean) value;
        if (value instanceof Number) return ((Number) value).doubleValue() != 0;
        if (value instanceof String) return !((String) value).isEmpty();
        if (value instanceof Collection) return !((Collection<?>) value).isEmpty();
        return true;
    }
}

/**
 * Assertion helper
 */
class Assertions {
    public static <T> Assertion<T> expect(T actual) {
        return new Assertion<>(actual);
    }
}

/**
 * Test annotation
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Test {
    String value() default "";
    int timeout() default 0;
}

/**
 * Test suite annotation
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface TestSuite {
    String value();
}

/**
 * Before all hook annotation
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface BeforeAll {}

/**
 * After all hook annotation
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface AfterAll {}

/**
 * Before each hook annotation
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface BeforeEach {}

/**
 * After each hook annotation
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface AfterEach {}

/**
 * Test case representation
 */
class TestCase {
    private final String name;
    private final Method method;
    private final String suite;
    private final int timeout;

    public TestCase(String name, Method method, String suite, int timeout) {
        this.name = name;
        this.method = method;
        this.suite = suite;
        this.timeout = timeout;
    }

    public String getName() { return name; }
    public Method getMethod() { return method; }
    public String getSuite() { return suite; }
    public int getTimeout() { return timeout; }
}

/**
 * Test result representation
 */
class TestResult {
    private String suite;
    private String test;
    private String language = "java";
    private String status = "running";
    private double duration;
    private Map<String, Object> error;
    private long startTime;
    private long endTime;

    public TestResult() {
        this.startTime = System.currentTimeMillis();
    }

    public void setSuite(String suite) { this.suite = suite; }
    public void setTest(String test) { this.test = test; }
    public void setStatus(String status) { this.status = status; }
    public void setError(Map<String, Object> error) { this.error = error; }

    public void complete() {
        this.endTime = System.currentTimeMillis();
        this.duration = (endTime - startTime) / 1000.0;
    }

    public Map<String, Object> toMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("suite", suite);
        map.put("test", test);
        map.put("language", language);
        map.put("status", status);
        map.put("duration", duration);
        map.put("error", error);
        map.put("startTime", startTime);
        map.put("endTime", endTime);
        return map;
    }
}

/**
 * JUnit Bridge
 */
public class junit_bridge {
    private final List<Class<?>> testClasses = new ArrayList<>();
    private final List<TestResult> results = new ArrayList<>();
    private final String bridgeUrl;

    public junit_bridge(String bridgeUrl) {
        this.bridgeUrl = bridgeUrl != null ? bridgeUrl : "http://localhost:9876";
    }

    public junit_bridge() {
        this(null);
    }

    public void registerTestClass(Class<?> testClass) {
        testClasses.add(testClass);
    }

    public List<TestResult> runAll() throws Exception {
        List<TestResult> allResults = new ArrayList<>();

        for (Class<?> testClass : testClasses) {
            List<TestResult> classResults = runTestClass(testClass);
            allResults.addAll(classResults);
        }

        results.addAll(allResults);
        return allResults;
    }

    private List<TestResult> runTestClass(Class<?> testClass) throws Exception {
        List<TestResult> results = new ArrayList<>();

        TestSuite suiteAnnotation = testClass.getAnnotation(TestSuite.class);
        String suiteName = suiteAnnotation != null ? suiteAnnotation.value() : testClass.getSimpleName();

        Object instance = testClass.getDeclaredConstructor().newInstance();

        // Get hooks
        List<Method> beforeAllMethods = getMethodsWithAnnotation(testClass, BeforeAll.class);
        List<Method> afterAllMethods = getMethodsWithAnnotation(testClass, AfterAll.class);
        List<Method> beforeEachMethods = getMethodsWithAnnotation(testClass, BeforeEach.class);
        List<Method> afterEachMethods = getMethodsWithAnnotation(testClass, AfterEach.class);

        // Run before all hooks
        for (Method method : beforeAllMethods) {
            method.invoke(instance);
        }

        // Get test methods
        List<TestCase> tests = getTestCases(testClass, suiteName);

        // Run tests
        for (TestCase test : tests) {
            TestResult result = runTest(instance, test, beforeEachMethods, afterEachMethods);
            results.add(result);
        }

        // Run after all hooks
        for (Method method : afterAllMethods) {
            method.invoke(instance);
        }

        return results;
    }

    private TestResult runTest(Object instance, TestCase test, List<Method> beforeEachMethods, List<Method> afterEachMethods) {
        TestResult result = new TestResult();
        result.setSuite(test.getSuite());
        result.setTest(test.getName());

        try {
            // Run before each hooks
            for (Method method : beforeEachMethods) {
                method.invoke(instance);
            }

            // Run test
            test.getMethod().invoke(instance);

            result.setStatus("passed");
        } catch (InvocationTargetException e) {
            Throwable cause = e.getCause();
            result.setStatus("failed");

            Map<String, Object> error = new HashMap<>();
            error.put("message", cause.getMessage());

            if (cause instanceof AssertionError) {
                AssertionError ae = (AssertionError) cause;
                error.put("actual", ae.getActual());
                error.put("expected", ae.getExpected());
                error.put("operator", ae.getOperator());
            }

            List<String> stackTrace = new ArrayList<>();
            for (StackTraceElement element : cause.getStackTrace()) {
                stackTrace.add(element.toString());
            }
            error.put("stack", stackTrace);

            result.setError(error);
        } catch (Exception e) {
            result.setStatus("failed");

            Map<String, Object> error = new HashMap<>();
            error.put("message", e.getMessage());

            List<String> stackTrace = new ArrayList<>();
            for (StackTraceElement element : e.getStackTrace()) {
                stackTrace.add(element.toString());
            }
            error.put("stack", stackTrace);

            result.setError(error);
        } finally {
            // Run after each hooks
            for (Method method : afterEachMethods) {
                try {
                    method.invoke(instance);
                } catch (Exception e) {
                    System.err.println("Error in after each hook: " + e.getMessage());
                }
            }

            result.complete();
        }

        return result;
    }

    private List<Method> getMethodsWithAnnotation(Class<?> clazz, Class<? extends Annotation> annotation) {
        List<Method> methods = new ArrayList<>();
        for (Method method : clazz.getDeclaredMethods()) {
            if (method.isAnnotationPresent(annotation)) {
                methods.add(method);
            }
        }
        return methods;
    }

    private List<TestCase> getTestCases(Class<?> clazz, String suiteName) {
        List<TestCase> testCases = new ArrayList<>();

        for (Method method : clazz.getDeclaredMethods()) {
            Test testAnnotation = method.getAnnotation(Test.class);
            if (testAnnotation != null) {
                String testName = testAnnotation.value().isEmpty() ? method.getName() : testAnnotation.value();
                int timeout = testAnnotation.timeout();

                testCases.add(new TestCase(testName, method, suiteName, timeout));
            }
        }

        return testCases;
    }

    public void reportToBridge(List<TestResult> results) {
        try {
            Gson gson = new Gson();

            Map<String, Object> payload = new HashMap<>();
            payload.put("language", "java");

            List<Map<String, Object>> resultMaps = new ArrayList<>();
            for (TestResult result : results) {
                resultMaps.add(result.toMap());
            }
            payload.put("results", resultMaps);

            String json = gson.toJson(payload);

            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(bridgeUrl + "/results"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                System.err.println("Failed to report results: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Failed to connect to bridge: " + e.getMessage());
        }
    }

    public Map<String, Object> getSummary() {
        int passed = 0;
        int failed = 0;
        int skipped = 0;
        double totalDuration = 0;

        for (TestResult result : results) {
            switch (result.status) {
                case "passed": passed++; break;
                case "failed": failed++; break;
                case "skipped": skipped++; break;
            }
            totalDuration += result.duration;
        }

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", results.size());
        summary.put("passed", passed);
        summary.put("failed", failed);
        summary.put("skipped", skipped);
        summary.put("duration", totalDuration);

        return summary;
    }

    public void printSummary() {
        Map<String, Object> summary = getSummary();

        System.out.println("\n=== Test Results ===");
        System.out.println("Total: " + summary.get("total"));
        System.out.println("Passed: " + summary.get("passed"));
        System.out.println("Failed: " + summary.get("failed"));
        System.out.println("Skipped: " + summary.get("skipped"));
        System.out.println("Duration: " + String.format("%.2f", summary.get("duration")) + "s");
    }
}
