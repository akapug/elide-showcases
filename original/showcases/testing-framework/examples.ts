import { create_test_suite, expect, run_example_tests } from "./rspec_runner.rb";

console.log("Running example tests:");
const results = run_example_tests();
console.log(JSON.stringify(results, null, 2));

console.log("\nCreating custom test suite:");
const suite = create_test_suite("TypeScript Tests");

suite.add_test("numbers compare correctly", () => {
  expect(10).to_eq(10);
});

suite.add_test("booleans work", () => {
  expect(true).to_be_truthy();
});

const customResults = suite.run();
console.log(JSON.stringify(customResults, null, 2));
