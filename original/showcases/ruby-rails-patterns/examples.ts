import { create_user, get_all_users, seed_data } from "./active_record.rb";

export async function runExamples() {
  console.log("Ruby Rails Patterns Examples\n");

  // Seed data
  const seeded = seed_data();
  console.log("Seeded:", seeded);

  // Create user
  const user = create_user("Charlie", "charlie@example.com", "admin");
  console.log("\nCreated user:", user);

  // Get all users
  const users = get_all_users();
  console.log("\nAll users:", users);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
