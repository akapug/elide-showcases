/**
 * Map Renderer
 *
 * Map visualization and rendering using python:folium for interactive maps
 * and python:matplotlib for static map generation.
 */

// @ts-ignore
import folium from 'python:folium';
// @ts-ignore
import matplotlib from 'python:matplotlib';
// @ts-ignore
import matplotlib_pyplot as plt from 'python:matplotlib.pyplot';
// @ts-ignore
import numpy from 'python:numpy';

import {
  MapOptions,
  Style,
  ChoroplethOptions,
  HeatmapOptions,
  Colormap,
  Feature,
  Point,
  LineString,
  Polygon,
  Raster,
  GeometryError,
} from '../types';

/**
 * MapRenderer class for map visualization
 */
export class MapRenderer {
  private maps: Map<string, any> = new Map();

  constructor() {
    // Configure matplotlib for non-interactive backend
    matplotlib.use('Agg');
  }

  /**
   * Create interactive map
   */
  async createMap(options?: MapOptions): Promise<string> {
    try {
      const center = options?.center || [0, 0];
      const zoom = options?.zoom || 10;
      const basemap = options?.basemap || 'OpenStreetMap';

      const map = folium.Map(
        location=[center[1], center[0]], // folium uses lat, lon
        zoom_start=zoom,
        tiles=basemap,
        width=options?.width || 800,
        height=options?.height || 600
      );

      const mapId = `map_${Date.now()}`;
      this.maps.set(mapId, map);

      return mapId;
    } catch (error) {
      throw new GeometryError(`Map creation failed: ${error}`);
    }
  }

  /**
   * Add vector layer to map
   */
  async addVectorLayer(
    mapId: string,
    features: Feature[],
    options?: {
      style?: Style;
      popup?: (feature: Feature) => string;
      tooltip?: (feature: Feature) => string;
      name?: string;
    }
  ): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      const style = options?.style || {};
      const featureGroup = folium.FeatureGroup(name=options?.name || 'Vector Layer');

      for (const feature of features) {
        let marker: any;

        if (feature.geometry.type === 'Point') {
          const coords = (feature.geometry as Point).coordinates;
          marker = folium.CircleMarker(
            location=[coords[1], coords[0]],
            radius=style.radius || 5,
            color=style.strokeColor || '#3388ff',
            fill=true,
            fillColor=style.fillColor || '#3388ff',
            fillOpacity=style.fillOpacity || 0.5,
            weight=style.strokeWidth || 2
          );
        } else if (feature.geometry.type === 'LineString') {
          const coords = (feature.geometry as LineString).coordinates;
          marker = folium.PolyLine(
            locations=coords.map((c) => [c[1], c[0]]),
            color=style.strokeColor || '#3388ff',
            weight=style.strokeWidth || 2,
            opacity=style.strokeOpacity || 1
          );
        } else if (feature.geometry.type === 'Polygon') {
          const coords = (feature.geometry as Polygon).coordinates[0];
          marker = folium.Polygon(
            locations=coords.map((c) => [c[1], c[0]]),
            color=style.strokeColor || '#3388ff',
            weight=style.strokeWidth || 2,
            fillColor=style.fillColor || '#3388ff',
            fillOpacity=style.fillOpacity || 0.3
          );
        }

        if (marker && options?.popup) {
          marker.add_child(folium.Popup(options.popup(feature)));
        }

        if (marker && options?.tooltip) {
          marker.add_child(folium.Tooltip(options.tooltip(feature)));
        }

        if (marker) {
          featureGroup.add_child(marker);
        }
      }

      featureGroup.add_to(map);
    } catch (error) {
      throw new GeometryError(`Add vector layer failed: ${error}`);
    }
  }

  /**
   * Add raster layer to map
   */
  async addRasterLayer(
    mapId: string,
    raster: Raster,
    options?: {
      opacity?: number;
      colormap?: Colormap;
      bounds?: [[number, number], [number, number]];
      name?: string;
    }
  ): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      const bounds = options?.bounds || [
        [raster.metadata.bounds[1], raster.metadata.bounds[0]],
        [raster.metadata.bounds[3], raster.metadata.bounds[2]],
      ];

      // For simplicity, we'll use ImageOverlay
      // In production, you'd want to properly render the raster data
      const imageUrl = await this.rasterToImageURL(raster, options?.colormap);

      const overlay = folium.raster_layers.ImageOverlay(
        image=imageUrl,
        bounds=bounds,
        opacity=options?.opacity || 0.7,
        name=options?.name || 'Raster Layer'
      );

      overlay.add_to(map);
    } catch (error) {
      throw new GeometryError(`Add raster layer failed: ${error}`);
    }
  }

  /**
   * Create choropleth map
   */
  async createChoropleth(
    mapId: string,
    features: Feature<Polygon>[],
    options: ChoroplethOptions
  ): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      // Extract values
      const values = features.map((f) => f.properties[options.valueField]);

      // Calculate bins
      const bins = this.calculateBins(values, options.bins || 5, options.method || 'quantile');

      // Create choropleth
      const choropleth = folium.Choropleth(
        geo_data=this.featuresToGeoJSON(features),
        data=values,
        columns=['id', options.valueField],
        key_on='feature.id',
        fill_color=options.colorScheme || 'YlOrRd',
        fill_opacity=0.7,
        line_opacity=0.2,
        legend_name=options.legendTitle || options.valueField,
        bins=bins
      );

      choropleth.add_to(map);
    } catch (error) {
      throw new GeometryError(`Choropleth creation failed: ${error}`);
    }
  }

  /**
   * Create heat map
   */
  async createHeatmap(
    mapId: string,
    points: Feature<Point>[],
    options?: HeatmapOptions
  ): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      const data: Array<[number, number, number?]> = points.map((p) => {
        const coords = p.geometry.coordinates;
        const intensity =
          typeof options?.intensity === 'string'
            ? p.properties[options.intensity] || 1
            : options?.intensity || 1;

        return [coords[1], coords[0], intensity];
      });

      const heatmap = folium.plugins.HeatMap(
        data,
        radius=options?.radius || 25,
        blur=options?.blur || 15,
        min_opacity=options?.minOpacity || 0.2,
        max_zoom=options?.maxZoom || 18,
        gradient=options?.gradient || null
      );

      heatmap.add_to(map);
    } catch (error) {
      throw new GeometryError(`Heatmap creation failed: ${error}`);
    }
  }

  /**
   * Add marker cluster
   */
  async addMarkerCluster(
    mapId: string,
    points: Feature<Point>[],
    options?: {
      popup?: (feature: Feature) => string;
      icon?: string;
      color?: string;
    }
  ): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      const cluster = folium.plugins.MarkerCluster();

      for (const point of points) {
        const coords = point.geometry.coordinates;
        const marker = folium.Marker(
          location=[coords[1], coords[0]],
          icon=folium.Icon(color=options?.color || 'blue', icon=options?.icon || 'info-sign')
        );

        if (options?.popup) {
          marker.add_child(folium.Popup(options.popup(point)));
        }

        cluster.add_child(marker);
      }

      cluster.add_to(map);
    } catch (error) {
      throw new GeometryError(`Marker cluster creation failed: ${error}`);
    }
  }

  /**
   * Add layer control
   */
  async addLayerControl(mapId: string): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      folium.LayerControl().add_to(map);
    } catch (error) {
      throw new GeometryError(`Layer control addition failed: ${error}`);
    }
  }

  /**
   * Export map to HTML
   */
  async exportMap(mapId: string, outputPath: string): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      map.save(outputPath);
    } catch (error) {
      throw new GeometryError(`Map export failed: ${error}`);
    }
  }

  /**
   * Export map to image (PNG)
   */
  async exportImage(
    mapId: string,
    outputPath: string,
    options?: { width?: number; height?: number }
  ): Promise<void> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      // This requires selenium or similar for folium
      // For now, we'll throw not implemented
      throw new Error('Image export requires additional dependencies (selenium)');
    } catch (error) {
      throw new GeometryError(`Image export failed: ${error}`);
    }
  }

  /**
   * Create static map with matplotlib
   */
  async createStaticMap(
    features: Feature[],
    options?: {
      figsize?: [number, number];
      dpi?: number;
      title?: string;
      style?: Style;
    }
  ): Promise<string> {
    try {
      const figsize = options?.figsize || [10, 8];
      const dpi = options?.dpi || 100;

      const fig, ax = plt.subplots(figsize=figsize, dpi=dpi);

      for (const feature of features) {
        if (feature.geometry.type === 'Point') {
          const coords = (feature.geometry as Point).coordinates;
          ax.plot(
            coords[0],
            coords[1],
            'o',
            color=options?.style?.fillColor || 'blue',
            markersize=options?.style?.radius || 5
          );
        } else if (feature.geometry.type === 'LineString') {
          const coords = (feature.geometry as LineString).coordinates;
          const x = coords.map((c) => c[0]);
          const y = coords.map((c) => c[1]);
          ax.plot(x, y, color=options?.style?.strokeColor || 'blue', linewidth=options?.style?.strokeWidth || 2);
        } else if (feature.geometry.type === 'Polygon') {
          const coords = (feature.geometry as Polygon).coordinates[0];
          const x = coords.map((c) => c[0]);
          const y = coords.map((c) => c[1]);
          ax.fill(
            x,
            y,
            color=options?.style?.fillColor || 'blue',
            alpha=options?.style?.fillOpacity || 0.3,
            edgecolor=options?.style?.strokeColor || 'black',
            linewidth=options?.style?.strokeWidth || 1
          );
        }
      }

      if (options?.title) {
        ax.set_title(options.title);
      }

      ax.set_aspect('equal');
      ax.grid(true, alpha=0.3);

      const outputPath = `/tmp/static_map_${Date.now()}.png`;
      plt.savefig(outputPath, dpi=dpi, bbox_inches='tight');
      plt.close(fig);

      return outputPath;
    } catch (error) {
      throw new GeometryError(`Static map creation failed: ${error}`);
    }
  }

  /**
   * Get map HTML
   */
  async getMapHTML(mapId: string): Promise<string> {
    try {
      const map = this.maps.get(mapId);
      if (!map) throw new Error(`Map not found: ${mapId}`);

      return map._repr_html_();
    } catch (error) {
      throw new GeometryError(`Get map HTML failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private featuresToGeoJSON(features: Feature[]): any {
    return {
      type: 'FeatureCollection',
      features: features.map((f, i) => ({
        ...f,
        id: f.id || i,
      })),
    };
  }

  private calculateBins(
    values: number[],
    count: number,
    method: 'equal_interval' | 'quantile' | 'natural_breaks' | 'standard_deviation'
  ): number[] {
    const sorted = [...values].sort((a, b) => a - b);
    const min = sorted[0];
    const max = sorted[sorted.length - 1];

    switch (method) {
      case 'equal_interval':
        const interval = (max - min) / count;
        return Array.from({ length: count + 1 }, (_, i) => min + i * interval);

      case 'quantile':
        const bins: number[] = [min];
        for (let i = 1; i < count; i++) {
          const idx = Math.floor((sorted.length * i) / count);
          bins.push(sorted[idx]);
        }
        bins.push(max);
        return bins;

      case 'natural_breaks':
        // Simplified Jenks natural breaks
        return this.jenksBreaks(sorted, count);

      case 'standard_deviation':
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const stddev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
        const stdbins: number[] = [];
        for (let i = -count / 2; i <= count / 2; i++) {
          stdbins.push(mean + i * stddev);
        }
        return stdbins;

      default:
        return Array.from({ length: count + 1 }, (_, i) => min + (i * (max - min)) / count);
    }
  }

  private jenksBreaks(data: number[], numClasses: number): number[] {
    // Simplified Jenks natural breaks algorithm
    const n = data.length;

    if (n <= numClasses) {
      return data;
    }

    // Initialize matrices
    const mat1: number[][] = Array(n + 1)
      .fill(0)
      .map(() => Array(numClasses + 1).fill(0));
    const mat2: number[][] = Array(n + 1)
      .fill(0)
      .map(() => Array(numClasses + 1).fill(0));

    for (let i = 1; i <= numClasses; i++) {
      mat1[1][i] = 1;
      mat2[1][i] = 0;
      for (let j = 2; j <= n; j++) {
        mat2[j][i] = Infinity;
      }
    }

    for (let l = 2; l <= n; l++) {
      let sum = 0;
      let sumSquares = 0;
      let w = 0;

      for (let m = 1; m <= l; m++) {
        const lm = l - m + 1;
        const val = data[lm - 1];
        w++;
        sum += val;
        sumSquares += val * val;
        const variance = sumSquares - (sum * sum) / w;

        if (lm > 1) {
          for (let j = 2; j <= numClasses; j++) {
            if (mat2[l][j] >= variance + mat2[lm - 1][j - 1]) {
              mat1[l][j] = lm;
              mat2[l][j] = variance + mat2[lm - 1][j - 1];
            }
          }
        }
      }

      mat1[l][1] = 1;
      mat2[l][1] = sumSquares - (sum * sum) / w;
    }

    const breaks: number[] = [];
    let k = n;

    for (let j = numClasses; j >= 1; j--) {
      breaks.unshift(data[mat1[k][j] - 1]);
      k = mat1[k][j] - 1;
    }

    return breaks;
  }

  private async rasterToImageURL(raster: Raster, colormap?: Colormap): Promise<string> {
    // Placeholder - in production you'd render the raster to an image
    // and return a data URL or save to file
    return 'data:image/png;base64,...';
  }
}

export default MapRenderer;
