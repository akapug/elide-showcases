import { nlp } from "./nlp_engine.py";

console.log("Tokens:", nlp.tokenize("Hello world from Elide"));
console.log("Entities:", nlp.extract_entities("OpenAI is in New York"));
console.log("Sentiment:", nlp.sentiment_analysis("This is great!"));
