import { compute, quick_mean } from "./numpy_compute.py";

async function run() {
  const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log("Array ops:", compute.array_operations(arr));
  console.log("Mean:", quick_mean(arr));
  console.log("Linspace:", compute.linspace(0, 10, 5));
}

run().catch(console.error);
