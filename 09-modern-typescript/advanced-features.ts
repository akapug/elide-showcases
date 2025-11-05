// Showcase #9: Modern TypeScript Features
// Elide supports latest TS without tsc!

console.log("🎯 Modern TypeScript in Elide\n");

// 1. Decorators (Stage 3 proposal)
function log(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const original = descriptor.value;
  descriptor.value = function(...args: any[]) {
    console.log(`  → Called ${propertyKey}(${args.join(", ")})`);
    return original.apply(this, args);
  };
}

class Calculator {
  @log
  add(a: number, b: number): number {
    return a + b;
  }

  @log
  multiply(a: number, b: number): number {
    return a * b;
  }
}

// 2. Advanced Types
type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

interface Config {
  server: {
    host: string;
    port: number;
  };
  database: {
    url: string;
    pool: number;
  };
}

const partialConfig: DeepPartial<Config> = {
  server: { port: 3000 } // host is optional!
};

// 3. Template Literal Types
type EventName = "click" | "focus" | "blur";
type HandlerName<T extends string> = `on${Capitalize<T>}`;
type Handlers = HandlerName<EventName>; // "onClick" | "onFocus" | "onBlur"

const handlers: Record<Handlers, () => void> = {
  onClick: () => console.log("clicked"),
  onFocus: () => console.log("focused"),
  onBlur: () => console.log("blurred"),
};

// 4. Const Assertions & As Const
const routes = [
  { path: "/home", method: "GET" },
  { path: "/api", method: "POST" },
] as const;

type Route = typeof routes[number]; // Exact type!

// 5. Satisfies Operator
type Color = { r: number; g: number; b: number } | string;

const color = {
  red: { r: 255, g: 0, b: 0 },
  green: "#00ff00",
} satisfies Record<string, Color>;

// Usage demo
console.log("1. Decorators:");
const calc = new Calculator();
calc.add(5, 3);
calc.multiply(4, 2);

console.log("\n2. Deep Partial Types:");
console.log("  Config:", partialConfig);

console.log("\n3. Template Literal Types:");
console.log("  Handlers:", Object.keys(handlers));

console.log("\n4. Const Assertions:");
console.log("  Routes:", routes);

console.log("\n5. Satisfies Operator:");
console.log("  Colors:", color);

console.log("\n✨ All these TypeScript features work WITHOUT tsc!");
console.log("   Elide compiles and runs them instantly!");
