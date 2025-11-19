import { getUserService, getEventPublisher, getContext } from "./SpringBeans.java";

export async function runExamples() {
  console.log("Java Spring Integration Examples\n");

  // Example 1: Use Spring beans from TypeScript
  const userService = getUserService();
  const user1 = userService.createUser("Alice", "alice@example.com");
  const user2 = userService.createUser("Bob", "bob@example.com");

  console.log("Created users:", userService.getAllUsers());

  // Example 2: Event publishing
  const eventPublisher = getEventPublisher();
  eventPublisher.publishEvent("user.login", { userId: 1, ip: "127.0.0.1" });
  console.log("\nEvents:", eventPublisher.getEvents());

  // Example 3: Bean inspection
  const context = getContext();
  const beans = context.getBeanNames();
  console.log("\nRegistered beans:", beans);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
