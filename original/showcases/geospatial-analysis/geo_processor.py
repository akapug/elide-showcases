"""Geospatial Analysis - Python GeoPandas"""
from typing import List, Dict, Any
import math

class GeoProcessor:
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points (Haversine formula)"""
        R = 6371  # Earth radius in km

        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)

        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    def find_nearest(self, point: Dict[str, float], locations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Find nearest location to a point"""
        min_dist = float('inf')
        nearest = None

        for loc in locations:
            dist = self.calculate_distance(
                point["lat"], point["lon"],
                loc["lat"], loc["lon"]
            )
            if dist < min_dist:
                min_dist = dist
                nearest = {**loc, "distance_km": dist}

        return nearest

geo = GeoProcessor()
