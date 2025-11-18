"""
Geospatial analytics using GeoPandas and Shapely
"""

import geopandas as gpd
import pandas as pd
from shapely.geometry import Point, Polygon, LineString
from shapely.ops import unary_union
import json
import sys
from typing import List, Dict, Any


class GeospatialEngine:
    """Geospatial operations and analytics"""

    def __init__(self):
        self.datasets: Dict[str, gpd.GeoDataFrame] = {}

    def create_points(self, points: List[Dict[str, float]]) -> gpd.GeoDataFrame:
        """Create GeoDataFrame from points"""
        geometry = [Point(p['lon'], p['lat']) for p in points]
        gdf = gpd.GeoDataFrame(points, geometry=geometry, crs='EPSG:4326')
        return gdf

    def calculate_distances(self, points1: List[Dict], points2: List[Dict]) -> List[float]:
        """Calculate distances between point sets"""
        gdf1 = self.create_points(points1)
        gdf2 = self.create_points(points2)

        # Project to metric CRS for accurate distance calculation
        gdf1_proj = gdf1.to_crs('EPSG:3857')
        gdf2_proj = gdf2.to_crs('EPSG:3857')

        distances = []
        for i in range(min(len(gdf1_proj), len(gdf2_proj))):
            dist = gdf1_proj.iloc[i].geometry.distance(gdf2_proj.iloc[i].geometry)
            distances.append(float(dist))  # meters

        return distances

    def points_in_polygon(self, points: List[Dict], polygon_coords: List[List[float]]) -> Dict[str, Any]:
        """Find points within polygon"""
        gdf = self.create_points(points)
        polygon = Polygon([(c[0], c[1]) for c in polygon_coords])

        within = gdf[gdf.geometry.within(polygon)]

        return {
            'total_points': len(gdf),
            'points_inside': len(within),
            'points_outside': len(gdf) - len(within),
            'inside_indices': within.index.tolist()
        }

    def buffer_analysis(self, points: List[Dict], radius_meters: float) -> Dict[str, Any]:
        """Create buffers around points and analyze"""
        gdf = self.create_points(points)
        gdf_proj = gdf.to_crs('EPSG:3857')

        # Create buffers
        buffers = gdf_proj.buffer(radius_meters)

        # Calculate union
        union = unary_union(buffers)

        return {
            'total_area_sqm': float(union.area),
            'total_area_sqkm': float(union.area / 1_000_000),
            'buffer_count': len(buffers)
        }

    def nearest_neighbor(self, points: List[Dict], query_point: Dict) -> Dict[str, Any]:
        """Find nearest neighbor to query point"""
        gdf = self.create_points(points)
        query_gdf = self.create_points([query_point])

        gdf_proj = gdf.to_crs('EPSG:3857')
        query_proj = query_gdf.to_crs('EPSG:3857')

        query_geom = query_proj.iloc[0].geometry

        distances = gdf_proj.geometry.distance(query_geom)
        nearest_idx = distances.idxmin()

        return {
            'nearest_index': int(nearest_idx),
            'distance_meters': float(distances[nearest_idx]),
            'point': points[nearest_idx]
        }

    def spatial_join(self, points1: List[Dict], points2: List[Dict], radius_meters: float) -> Dict[str, Any]:
        """Spatial join - find points within radius"""
        gdf1 = self.create_points(points1)
        gdf2 = self.create_points(points2)

        gdf1_proj = gdf1.to_crs('EPSG:3857')
        gdf2_proj = gdf2.to_crs('EPSG:3857')

        # Create buffers around first set
        gdf1_proj['geometry'] = gdf1_proj.buffer(radius_meters)

        # Spatial join
        joined = gpd.sjoin(gdf2_proj, gdf1_proj, how='inner', predicate='within')

        return {
            'matches': len(joined),
            'match_rate': float(len(joined) / len(gdf2))
        }


engine = GeospatialEngine()


def process_stdin():
    for line in sys.stdin:
        try:
            request = json.loads(line)
            command = request.get('command')

            if command == 'distances':
                points1 = request['points1']
                points2 = request['points2']
                result = engine.calculate_distances(points1, points2)
                response = {'status': 'success', 'result': {'distances': result}}

            elif command == 'points_in_polygon':
                points = request['points']
                polygon = request['polygon']
                result = engine.points_in_polygon(points, polygon)
                response = {'status': 'success', 'result': result}

            elif command == 'buffer':
                points = request['points']
                radius = request['radius_meters']
                result = engine.buffer_analysis(points, radius)
                response = {'status': 'success', 'result': result}

            elif command == 'nearest':
                points = request['points']
                query = request['query_point']
                result = engine.nearest_neighbor(points, query)
                response = {'status': 'success', 'result': result}

            elif command == 'spatial_join':
                points1 = request['points1']
                points2 = request['points2']
                radius = request['radius_meters']
                result = engine.spatial_join(points1, points2, radius)
                response = {'status': 'success', 'result': result}

            else:
                response = {'status': 'error', 'error': f'Unknown command: {command}'}

            print(json.dumps(response), flush=True)

        except Exception as e:
            import traceback
            print(json.dumps({
                'status': 'error',
                'error': str(e),
                'traceback': traceback.format_exc()
            }), flush=True)


if __name__ == "__main__":
    process_stdin()
