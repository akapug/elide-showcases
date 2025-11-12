import { video } from "./video_analyzer.py";

console.log("Metadata:", video.extract_metadata("video.mp4"));
console.log("Objects:", video.detect_objects([1, 2, 3]));
console.log("Frames:", video.extract_frames("video.mp4", 5));
