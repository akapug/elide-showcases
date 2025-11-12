import { geo } from "./geo_processor.py";

const distance = geo.calculate_distance(40.7128, -74.0060, 34.0522, -118.2437);
console.log("Distance NY to LA:", distance, "km");

const locations = [
  { name: "Store A", lat: 40.7580, lon: -73.9855 },
  { name: "Store B", lat: 40.7489, lon: -73.9680 }
];
const nearest = geo.find_nearest({ lat: 40.7500, lon: -73.9700 }, locations);
console.log("Nearest:", nearest);
