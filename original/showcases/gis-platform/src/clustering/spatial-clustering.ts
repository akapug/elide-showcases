/**
 * Spatial Clustering
 *
 * Spatial clustering and autocorrelation analysis using python:sklearn
 * for DBSCAN, K-Means, and spatial statistics.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import scipy from 'python:scipy';

import {
  Feature,
  Point,
  Polygon,
  MultiPolygon,
  Cluster,
  ClusteringAlgorithm,
  DBSCANOptions,
  KMeansOptions,
  HierarchicalOptions,
  AutocorrelationResult,
  HotSpotResult,
  GeometryError,
} from '../types';

/**
 * SpatialClustering class for spatial data clustering
 */
export class SpatialClustering {
  constructor() {}

  /**
   * DBSCAN clustering
   */
  async dbscan(points: Feature<Point>[], options: DBSCANOptions): Promise<Cluster[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      // DBSCAN
      const metric = options.metric || 'euclidean';
      let dbscan: any;

      if (metric === 'haversine') {
        // Convert to radians for haversine
        const X_rad = numpy.radians(X);
        dbscan = sklearn.cluster.DBSCAN(
          eps=options.eps / 6371000, // Convert meters to radians
          min_samples=options.minSamples,
          metric='haversine',
          algorithm=options.algorithm || 'ball_tree'
        );
        dbscan.fit(X_rad);
      } else {
        dbscan = sklearn.cluster.DBSCAN(
          eps=options.eps,
          min_samples=options.minSamples,
          metric=metric,
          algorithm=options.algorithm || 'auto'
        );
        dbscan.fit(X);
      }

      const labels = Array.from(dbscan.labels_);

      // Group points into clusters
      const clusterMap = new Map<number, number[]>();

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        if (label >= 0) {
          // Exclude noise (-1)
          if (!clusterMap.has(label)) {
            clusterMap.set(label, []);
          }
          clusterMap.get(label)!.push(i);
        }
      }

      const clusters: Cluster[] = [];

      for (const [id, members] of clusterMap.entries()) {
        // Calculate centroid
        const clusterCoords = members.map((i) => coords[i]);
        const centroid: [number, number] = [
          clusterCoords.reduce((sum, c) => sum + c[0], 0) / clusterCoords.length,
          clusterCoords.reduce((sum, c) => sum + c[1], 0) / clusterCoords.length,
        ];

        // Calculate bounds
        const xs = clusterCoords.map((c) => c[0]);
        const ys = clusterCoords.map((c) => c[1]);
        const bounds: [number, number, number, number] = [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs),
          Math.max(...ys),
        ];

        clusters.push({
          id,
          centroid,
          members,
          size: members.length,
          bounds,
        });
      }

      return clusters;
    } catch (error) {
      throw new GeometryError(`DBSCAN clustering failed: ${error}`);
    }
  }

  /**
   * K-Means clustering
   */
  async kmeans(points: Feature<Point>[], options: KMeansOptions): Promise<Cluster[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      const kmeans = sklearn.cluster.KMeans(
        n_clusters=options.nClusters,
        max_iter=options.maxIterations || 300,
        tol=options.tolerance || 0.0001,
        init=options.init || 'k-means++',
        random_state=options.randomState || 42
      );

      kmeans.fit(X);

      const labels = Array.from(kmeans.labels_);
      const centroids = Array.from(kmeans.cluster_centers_);

      const clusters: Cluster[] = [];

      for (let id = 0; id < options.nClusters; id++) {
        const members = labels
          .map((label, idx) => (label === id ? idx : -1))
          .filter((idx) => idx >= 0);

        if (members.length > 0) {
          const clusterCoords = members.map((i) => coords[i]);
          const xs = clusterCoords.map((c) => c[0]);
          const ys = clusterCoords.map((c) => c[1]);

          const bounds: [number, number, number, number] = [
            Math.min(...xs),
            Math.min(...ys),
            Math.max(...xs),
            Math.max(...ys),
          ];

          clusters.push({
            id,
            centroid: centroids[id] as [number, number],
            members,
            size: members.length,
            bounds,
          });
        }
      }

      return clusters;
    } catch (error) {
      throw new GeometryError(`K-Means clustering failed: ${error}`);
    }
  }

  /**
   * Hierarchical clustering
   */
  async hierarchical(points: Feature<Point>[], options: HierarchicalOptions): Promise<Cluster[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      const hierarchical = sklearn.cluster.AgglomerativeClustering(
        n_clusters=options.nClusters || null,
        linkage=options.method || 'ward',
        distance_threshold=options.distanceThreshold || null
      );

      hierarchical.fit(X);

      const labels = Array.from(hierarchical.labels_);
      const nClusters = hierarchical.n_clusters_;

      const clusters: Cluster[] = [];

      for (let id = 0; id < nClusters; id++) {
        const members = labels
          .map((label, idx) => (label === id ? idx : -1))
          .filter((idx) => idx >= 0);

        if (members.length > 0) {
          const clusterCoords = members.map((i) => coords[i]);

          const centroid: [number, number] = [
            clusterCoords.reduce((sum, c) => sum + c[0], 0) / clusterCoords.length,
            clusterCoords.reduce((sum, c) => sum + c[1], 0) / clusterCoords.length,
          ];

          const xs = clusterCoords.map((c) => c[0]);
          const ys = clusterCoords.map((c) => c[1]);

          const bounds: [number, number, number, number] = [
            Math.min(...xs),
            Math.min(...ys),
            Math.max(...xs),
            Math.max(...ys),
          ];

          clusters.push({
            id,
            centroid,
            members,
            size: members.length,
            bounds,
          });
        }
      }

      return clusters;
    } catch (error) {
      throw new GeometryError(`Hierarchical clustering failed: ${error}`);
    }
  }

  /**
   * OPTICS clustering
   */
  async optics(
    points: Feature<Point>[],
    options?: { minSamples?: number; maxEps?: number; metric?: string }
  ): Promise<Cluster[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      const optics = sklearn.cluster.OPTICS(
        min_samples=options?.minSamples || 5,
        max_eps=options?.maxEps || numpy.inf,
        metric=options?.metric || 'euclidean'
      );

      optics.fit(X);

      const labels = Array.from(optics.labels_);

      const clusterMap = new Map<number, number[]>();

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i];
        if (label >= 0) {
          if (!clusterMap.has(label)) {
            clusterMap.set(label, []);
          }
          clusterMap.get(label)!.push(i);
        }
      }

      const clusters: Cluster[] = [];

      for (const [id, members] of clusterMap.entries()) {
        const clusterCoords = members.map((i) => coords[i]);

        const centroid: [number, number] = [
          clusterCoords.reduce((sum, c) => sum + c[0], 0) / clusterCoords.length,
          clusterCoords.reduce((sum, c) => sum + c[1], 0) / clusterCoords.length,
        ];

        const xs = clusterCoords.map((c) => c[0]);
        const ys = clusterCoords.map((c) => c[1]);

        const bounds: [number, number, number, number] = [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs),
          Math.max(...ys),
        ];

        clusters.push({
          id,
          centroid,
          members,
          size: members.length,
          bounds,
        });
      }

      return clusters;
    } catch (error) {
      throw new GeometryError(`OPTICS clustering failed: ${error}`);
    }
  }

  /**
   * Mean Shift clustering
   */
  async meanShift(
    points: Feature<Point>[],
    options?: { bandwidth?: number; binSeeding?: boolean }
  ): Promise<Cluster[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      let bandwidth = options?.bandwidth;

      if (!bandwidth) {
        // Estimate bandwidth
        bandwidth = sklearn.cluster.estimate_bandwidth(X, quantile=0.2);
      }

      const meanShift = sklearn.cluster.MeanShift(
        bandwidth=bandwidth,
        bin_seeding=options?.binSeeding || false
      );

      meanShift.fit(X);

      const labels = Array.from(meanShift.labels_);
      const centroids = Array.from(meanShift.cluster_centers_);

      const clusters: Cluster[] = [];

      for (let id = 0; id < centroids.length; id++) {
        const members = labels
          .map((label, idx) => (label === id ? idx : -1))
          .filter((idx) => idx >= 0);

        if (members.length > 0) {
          const clusterCoords = members.map((i) => coords[i]);
          const xs = clusterCoords.map((c) => c[0]);
          const ys = clusterCoords.map((c) => c[1]);

          const bounds: [number, number, number, number] = [
            Math.min(...xs),
            Math.min(...ys),
            Math.max(...xs),
            Math.max(...ys),
          ];

          clusters.push({
            id,
            centroid: centroids[id] as [number, number],
            members,
            size: members.length,
            bounds,
          });
        }
      }

      return clusters;
    } catch (error) {
      throw new GeometryError(`Mean Shift clustering failed: ${error}`);
    }
  }

  /**
   * Moran's I spatial autocorrelation
   */
  async moransI(
    features: Feature<Polygon | MultiPolygon>[],
    field: string,
    options?: { weightType?: 'queen' | 'rook'; permutations?: number }
  ): Promise<AutocorrelationResult> {
    try {
      const values = features.map((f) => f.properties[field] as number);
      const n = values.length;

      // Create spatial weights matrix
      const weights = this.createSpatialWeights(features, options?.weightType || 'queen');

      // Calculate Moran's I
      const mean = values.reduce((a, b) => a + b, 0) / n;
      let numerator = 0;
      let denominator = 0;
      let sumWeights = 0;

      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          if (weights[i][j] > 0) {
            numerator += weights[i][j] * (values[i] - mean) * (values[j] - mean);
            sumWeights += weights[i][j];
          }
        }
        denominator += Math.pow(values[i] - mean, 2);
      }

      const moransI = (n / sumWeights) * (numerator / denominator);

      // Calculate expected value
      const expectedI = -1 / (n - 1);

      // Calculate variance (simplified)
      const varianceI = 1 / (n - 1);

      // Calculate z-score
      const zScore = (moransI - expectedI) / Math.sqrt(varianceI);

      // Calculate p-value
      const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

      return {
        statistic: moransI,
        pValue,
        zScore,
        expectedValue: expectedI,
        variance: varianceI,
      };
    } catch (error) {
      throw new GeometryError(`Moran's I calculation failed: ${error}`);
    }
  }

  /**
   * Hot spot analysis (Getis-Ord Gi*)
   */
  async hotspotAnalysis(
    points: Feature<Point>[],
    field: string,
    options?: { method?: 'getis-ord'; distanceBand?: number; confidenceLevel?: number }
  ): Promise<HotSpotResult[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const values = points.map((p) => p.properties[field] as number);
      const n = points.length;

      const distanceBand = options?.distanceBand || 1000;
      const confidenceLevel = options?.confidenceLevel || 0.95;
      const zThreshold = confidenceLevel === 0.95 ? 1.96 : confidenceLevel === 0.99 ? 2.576 : 1.645;

      const globalMean = values.reduce((a, b) => a + b, 0) / n;
      const globalStd = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - globalMean, 2), 0) / n);

      const results: HotSpotResult[] = [];

      for (let i = 0; i < n; i++) {
        let sumWeightedValues = 0;
        let sumWeights = 0;

        for (let j = 0; j < n; j++) {
          const dist = this.haversineDistance(coords[i], coords[j]);

          if (dist <= distanceBand) {
            const weight = 1;
            sumWeightedValues += weight * values[j];
            sumWeights += weight;
          }
        }

        const giStar = sumWeightedValues / sumWeights;
        const zScore = (giStar - globalMean) / (globalStd / Math.sqrt(sumWeights));
        const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

        let hotspotType: 'hot' | 'cold' | 'not-significant' = 'not-significant';
        if (zScore > zThreshold) hotspotType = 'hot';
        else if (zScore < -zThreshold) hotspotType = 'cold';

        results.push({
          type: 'Feature',
          geometry: points[i].geometry,
          properties: {
            ...points[i].properties,
            zScore,
            pValue,
            confidence: 1 - pValue,
            type: hotspotType,
          },
        });
      }

      return results;
    } catch (error) {
      throw new GeometryError(`Hot spot analysis failed: ${error}`);
    }
  }

  /**
   * Outlier detection
   */
  async detectOutliers(
    points: Feature<Point>[],
    options?: { method?: 'isolation_forest' | 'lof'; contamination?: number }
  ): Promise<Feature<Point>[]> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      let outlierDetector: any;

      if (options?.method === 'lof') {
        outlierDetector = sklearn.neighbors.LocalOutlierFactor(contamination=options.contamination || 0.1);
      } else {
        outlierDetector = sklearn.ensemble.IsolationForest(
          contamination=options?.contamination || 0.1,
          random_state=42
        );
      }

      const predictions = outlierDetector.fit_predict(X);
      const outliers: Feature<Point>[] = [];

      for (let i = 0; i < predictions.length; i++) {
        if (predictions[i] === -1) {
          outliers.push(points[i]);
        }
      }

      return outliers;
    } catch (error) {
      throw new GeometryError(`Outlier detection failed: ${error}`);
    }
  }

  /**
   * Spatial regression
   */
  async spatialRegression(
    features: Feature<Polygon>[],
    dependentVar: string,
    independentVars: string[]
  ): Promise<{
    coefficients: Record<string, number>;
    rSquared: number;
    predictions: number[];
  }> {
    try {
      const y = features.map((f) => f.properties[dependentVar] as number);
      const X = features.map((f) => independentVars.map((v) => f.properties[v] as number));

      const X_array = numpy.array(X);
      const y_array = numpy.array(y);

      // Linear regression
      const regression = sklearn.linear_model.LinearRegression();
      regression.fit(X_array, y_array);

      const predictions = Array.from(regression.predict(X_array));
      const rSquared = regression.score(X_array, y_array);

      const coefficients: Record<string, number> = {};
      for (let i = 0; i < independentVars.length; i++) {
        coefficients[independentVars[i]] = regression.coef_[i];
      }
      coefficients['intercept'] = regression.intercept_;

      return {
        coefficients,
        rSquared,
        predictions,
      };
    } catch (error) {
      throw new GeometryError(`Spatial regression failed: ${error}`);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private createSpatialWeights(
    features: Feature<Polygon | MultiPolygon>[],
    type: 'queen' | 'rook'
  ): number[][] {
    const n = features.length;
    const weights: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    // Simplified weights matrix based on adjacency
    // In practice, would use proper spatial topology

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        // Check if polygons are adjacent (simplified)
        if (this.areAdjacent(features[i], features[j])) {
          weights[i][j] = 1;
          weights[j][i] = 1;
        }
      }
    }

    return weights;
  }

  private areAdjacent(feature1: Feature<Polygon | MultiPolygon>, feature2: Feature<Polygon | MultiPolygon>): boolean {
    // Simplified adjacency check
    // In practice, would use proper geometric intersection
    return false; // Placeholder
  }

  private haversineDistance(coord1: number[], coord2: number[]): number {
    const R = 6371000; // Earth radius in meters
    const lat1 = (coord1[1] * Math.PI) / 180;
    const lat2 = (coord2[1] * Math.PI) / 180;
    const deltaLat = ((coord2[1] - coord1[1]) * Math.PI) / 180;
    const deltaLon = ((coord2[0] - coord1[0]) * Math.PI) / 180;

    const a =
      Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private normalCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp((-x * x) / 2);
    const prob =
      d *
      t *
      (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - prob : prob;
  }

  /**
   * Silhouette score for cluster quality
   */
  async silhouetteScore(points: Feature<Point>[], clusters: Cluster[]): Promise<number> {
    try {
      const coords = points.map((p) => p.geometry.coordinates);
      const X = numpy.array(coords);

      const labels = Array(points.length).fill(-1);
      for (const cluster of clusters) {
        for (const member of cluster.members) {
          labels[member] = cluster.id;
        }
      }

      const score = sklearn.metrics.silhouette_score(X, labels);

      return score;
    } catch (error) {
      throw new GeometryError(`Silhouette score calculation failed: ${error}`);
    }
  }
}

export default SpatialClustering;
