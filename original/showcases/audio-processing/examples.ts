import { audio } from "./audio_processor.py";

console.log("Features:", audio.extract_features("song.mp3"));
console.log("Tempo:", audio.detect_tempo([1, 2, 3, 4, 5]));
console.log("Spectral:", audio.spectral_analysis([1, 2, 3, 4, 5]));
