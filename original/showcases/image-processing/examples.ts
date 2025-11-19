import { processor } from "./image_proc.py";

console.log("Resize:", processor.resize(1920, 1080, 800, 600));
console.log("Filter:", processor.apply_filter("blur", 0.5));
console.log("Metadata:", processor.get_metadata("test.jpg"));
