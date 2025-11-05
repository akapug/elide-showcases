// kind-of - Type checker for Elide/TypeScript
// Original: https://github.com/jonschlinkert/kind-of
// Author: Jon Schlinkert - Zero dependencies!

const toString = Object.prototype.toString;

export default function kindOf(val: any): string {
  if (val === void 0) return "undefined";
  if (val === null) return "null";

  const type = typeof val;
  if (type === "boolean") return "boolean";
  if (type === "string") return "string";
  if (type === "number") return "number";
  if (type === "symbol") return "symbol";
  if (type === "function") {
    return isGeneratorFn(val) ? "generatorfunction" : "function";
  }

  if (isArray(val)) return "array";
  if (isBuffer(val)) return "buffer";
  if (isArguments(val)) return "arguments";
  if (isDate(val)) return "date";
  if (isError(val)) return "error";
  if (isRegexp(val)) return "regexp";

  switch (ctorName(val)) {
    case "Symbol":
      return "symbol";
    case "Promise":
      return "promise";
    case "WeakMap":
      return "weakmap";
    case "WeakSet":
      return "weakset";
    case "Map":
      return "map";
    case "Set":
      return "set";
    case "Int8Array":
      return "int8array";
    case "Uint8Array":
      return "uint8array";
    case "Uint8ClampedArray":
      return "uint8clampedarray";
    case "Int16Array":
      return "int16array";
    case "Uint16Array":
      return "uint16array";
    case "Int32Array":
      return "int32array";
    case "Uint32Array":
      return "uint32array";
    case "Float32Array":
      return "float32array";
    case "Float64Array":
      return "float64array";
  }

  if (isGeneratorObj(val)) return "generator";

  const objType = toString.call(val);
  switch (objType) {
    case "[object Object]":
      return "object";
    case "[object Map Iterator]":
      return "mapiterator";
    case "[object Set Iterator]":
      return "setiterator";
    case "[object String Iterator]":
      return "stringiterator";
    case "[object Array Iterator]":
      return "arrayiterator";
  }

  return objType.slice(8, -1).toLowerCase().replace(/\s/g, "");
}

function ctorName(val: any): string | null {
  return typeof val.constructor === "function" ? val.constructor.name : null;
}

function isArray(val: any): boolean {
  if (Array.isArray) return Array.isArray(val);
  return val instanceof Array;
}

function isError(val: any): boolean {
  return (
    val instanceof Error ||
    (typeof val.message === "string" &&
      val.constructor &&
      typeof val.constructor.stackTraceLimit === "number")
  );
}

function isDate(val: any): boolean {
  if (val instanceof Date) return true;
  return (
    typeof val.toDateString === "function" &&
    typeof val.getDate === "function" &&
    typeof val.setDate === "function"
  );
}

function isRegexp(val: any): boolean {
  if (val instanceof RegExp) return true;
  return (
    typeof val.flags === "string" &&
    typeof val.ignoreCase === "boolean" &&
    typeof val.multiline === "boolean" &&
    typeof val.global === "boolean"
  );
}

function isGeneratorFn(val: any): boolean {
  return ctorName(val) === "GeneratorFunction";
}

function isGeneratorObj(val: any): boolean {
  return (
    typeof val.throw === "function" &&
    typeof val.return === "function" &&
    typeof val.next === "function"
  );
}

function isArguments(val: any): boolean {
  try {
    if (typeof val.length === "number" && typeof val.callee === "function") {
      return true;
    }
  } catch (err) {
    if ((err as Error).message.indexOf("callee") !== -1) {
      return true;
    }
  }
  return false;
}

function isBuffer(val: any): boolean {
  if (val.constructor && typeof val.constructor.isBuffer === "function") {
    return val.constructor.isBuffer(val);
  }
  return false;
}

// CLI Demo
if (import.meta.url.includes("elide-kind-of.ts")) {
  console.log("🔍 kind-of - Type Checker on Elide\n");
  console.log(`kindOf(undefined) = '${kindOf(undefined)}'`);
  console.log(`kindOf(null) = '${kindOf(null)}'`);
  console.log(`kindOf(true) = '${kindOf(true)}'`);
  console.log(`kindOf('foo') = '${kindOf("foo")}'`);
  console.log(`kindOf(123) = '${kindOf(123)}'`);
  console.log(`kindOf([1,2,3]) = '${kindOf([1, 2, 3])}'`);
  console.log(`kindOf({}) = '${kindOf({})}'`);
  console.log(`kindOf(/regex/) = '${kindOf(/regex/)}'`);
  console.log(`kindOf(new Date()) = '${kindOf(new Date())}'`);
  console.log(`kindOf(new Map()) = '${kindOf(new Map())}'`);
  console.log(`kindOf(new Set()) = '${kindOf(new Set())}'`);
  console.log(`kindOf(Promise.resolve()) = '${kindOf(Promise.resolve())}'`);
  console.log(`kindOf(new Uint8Array()) = '${kindOf(new Uint8Array())}'`);
  console.log("\n✅ 9M+ downloads/week - Perfect for Elide!");
}
