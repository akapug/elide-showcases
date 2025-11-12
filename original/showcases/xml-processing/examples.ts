import { parseXML, generateXML, validateXML } from "./XMLProcessor.java";

const xml = "<root><item>test</item></root>";
console.log("Parsed:", parseXML(xml));

const generated = generateXML({ name: "John", age: "30" });
console.log("Generated:", generated);

console.log("Valid:", validateXML(xml, "schema.xsd"));
