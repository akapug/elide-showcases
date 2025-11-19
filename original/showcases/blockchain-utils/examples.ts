import { getBalance, createTransaction, getBlockInfo, validateAddress } from "./Web3Utils.java";

const address = "0x1234567890123456789012345678901234567890";

console.log("Balance:", getBalance(address));
console.log("Valid:", validateAddress(address));
console.log("TX:", createTransaction(address, "0xabcd...", "1000000"));
console.log("Block:", getBlockInfo(12345));
