import { sha256, hmacSha256, generateKeyPair } from "./CryptoUtils.java";

(async () => {
  console.log("SHA256:", await sha256("Hello World"));
  console.log("HMAC:", await hmacSha256("data", "secret"));
  console.log("KeyPair:", generateKeyPair());
})();
