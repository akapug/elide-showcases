import { compress, analyzeCompression } from "./Compressor.java";

(async () => {
  const data = "Hello World! ".repeat(100);
  console.log("Compression:", await compress(data));
  console.log("Analysis:", analyzeCompression(data));
})();
