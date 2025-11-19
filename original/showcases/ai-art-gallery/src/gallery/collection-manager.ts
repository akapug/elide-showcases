/**
 * Collection Manager - Art Collection and Curation System
 *
 * Manages art collections with advanced curation algorithms, similarity detection,
 * and metadata management. Integrates with AI analysis for automatic quality assessment.
 *
 * Features:
 * - Collection CRUD operations
 * - Auto-curation based on aesthetic scores
 * - Similarity detection and clustering
 * - Metadata extraction and management
 * - Export/import functionality
 * - Collection versioning
 * - Tag management and search
 *
 * @module collection-manager
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Collection interface
 */
export interface Collection {
  id: string;
  name: string;
  description?: string;
  theme?: string;
  artworks: Artwork[];
  metadata: CollectionMetadata;
  created: number;
  updated: number;
  version: number;
}

/**
 * Artwork interface
 */
export interface Artwork {
  id: string;
  path: string;
  prompt?: string;
  model: string;
  dimensions: { width: number; height: number };
  generationParams: Record<string, any>;
  analysis?: ArtworkAnalysis;
  tags: string[];
  created: number;
}

/**
 * Artwork analysis interface
 */
export interface ArtworkAnalysis {
  style: {
    primary: string;
    secondary?: string;
    confidence: number;
  };
  aesthetic: {
    score: number;
    aspects: {
      composition: number;
      colorHarmony: number;
      lighting: number;
      detail: number;
    };
  };
  composition: {
    ruleOfThirds: number;
    goldenRatio: number;
    balance: number;
    symmetry: number;
  };
  colors: {
    dominant: string[];
    palette: string[];
    mood: string;
    contrast: number;
  };
  technical: {
    sharpness: number;
    noise: number;
    artifacts: number;
  };
}

/**
 * Collection metadata interface
 */
export interface CollectionMetadata {
  totalArtworks: number;
  avgAestheticScore: number;
  styles: Map<string, number>;
  tags: Map<string, number>;
  dateRange: { start: number; end: number };
}

/**
 * Curation criteria interface
 */
export interface CurationCriteria {
  aestheticThreshold?: number;
  diversityScore?: number;
  maxItems?: number;
  sortBy?: 'aesthetic' | 'diversity' | 'date' | 'random';
  filterStyles?: string[];
  filterTags?: string[];
  minScore?: number;
}

/**
 * Similarity result interface
 */
export interface SimilarityResult {
  artwork1: string;
  artwork2: string;
  similarity: number;
  method: string;
}

/**
 * Collection Manager Configuration
 */
export interface CollectionManagerConfig {
  storageDir: string;
  analyzer?: any;
  autoBackup?: boolean;
  backupInterval?: number;
}

/**
 * Collection Manager
 */
export class CollectionManager {
  private storageDir: string;
  private analyzer: any;
  private collections: Map<string, Collection> = new Map();
  private autoBackup: boolean;
  private backupInterval: number;
  private backupTimer?: NodeJS.Timeout;

  constructor(config: CollectionManagerConfig) {
    this.storageDir = config.storageDir;
    this.analyzer = config.analyzer;
    this.autoBackup = config.autoBackup ?? true;
    this.backupInterval = config.backupInterval ?? 3600000; // 1 hour

    // Ensure storage directory exists
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  /**
   * Initialize collection manager
   */
  async initialize(): Promise<void> {
    // Load existing collections
    await this.loadCollections();

    // Start auto-backup if enabled
    if (this.autoBackup) {
      this.startAutoBackup();
    }

    console.log(`Collection Manager initialized (${this.collections.size} collections loaded)`);
  }

  /**
   * Create new collection
   */
  async create(options: {
    name: string;
    description?: string;
    theme?: string;
    count?: number;
    styles?: string[];
    variation?: 'low' | 'medium' | 'high';
  }): Promise<Collection> {
    const id = crypto.randomBytes(16).toString('hex');

    const collection: Collection = {
      id,
      name: options.name,
      description: options.description,
      theme: options.theme,
      artworks: [],
      metadata: {
        totalArtworks: 0,
        avgAestheticScore: 0,
        styles: new Map(),
        tags: new Map(),
        dateRange: { start: Date.now(), end: Date.now() }
      },
      created: Date.now(),
      updated: Date.now(),
      version: 1
    };

    this.collections.set(id, collection);
    await this.saveCollection(collection);

    return collection;
  }

  /**
   * Get collection by ID
   */
  async get(id: string): Promise<Collection> {
    const collection = this.collections.get(id);
    if (!collection) {
      throw new Error(`Collection not found: ${id}`);
    }
    return collection;
  }

  /**
   * List all collections
   */
  async listAll(): Promise<Collection[]> {
    return Array.from(this.collections.values());
  }

  /**
   * Add artwork to collection
   */
  async addArtwork(
    collectionId: string,
    artwork: Omit<Artwork, 'id' | 'created'>
  ): Promise<Artwork> {
    const collection = await this.get(collectionId);

    const artworkWithId: Artwork = {
      id: crypto.randomBytes(16).toString('hex'),
      ...artwork,
      created: Date.now()
    };

    // Analyze artwork if analyzer is available and analysis not provided
    if (this.analyzer && !artworkWithId.analysis) {
      const imageBuffer = fs.readFileSync(artworkWithId.path);
      artworkWithId.analysis = await this.analyzer.analyze(imageBuffer, {
        includeStyle: true,
        includeAesthetic: true,
        includeComposition: true,
        includeColors: true,
        includeTechnical: true
      });
    }

    collection.artworks.push(artworkWithId);
    await this.updateMetadata(collection);
    collection.updated = Date.now();
    collection.version++;

    await this.saveCollection(collection);

    return artworkWithId;
  }

  /**
   * Remove artwork from collection
   */
  async removeArtwork(collectionId: string, artworkId: string): Promise<void> {
    const collection = await this.get(collectionId);

    const index = collection.artworks.findIndex(a => a.id === artworkId);
    if (index === -1) {
      throw new Error(`Artwork not found: ${artworkId}`);
    }

    collection.artworks.splice(index, 1);
    await this.updateMetadata(collection);
    collection.updated = Date.now();
    collection.version++;

    await this.saveCollection(collection);
  }

  /**
   * Curate collection based on criteria
   */
  async curate(
    collection: Collection,
    criteria: CurationCriteria = {}
  ): Promise<Collection> {
    let artworks = [...collection.artworks];

    // Filter by aesthetic threshold
    if (criteria.aestheticThreshold !== undefined) {
      artworks = artworks.filter(
        a => a.analysis && a.analysis.aesthetic.score >= criteria.aestheticThreshold!
      );
    }

    // Filter by minimum score
    if (criteria.minScore !== undefined) {
      artworks = artworks.filter(
        a => a.analysis && a.analysis.aesthetic.score >= criteria.minScore!
      );
    }

    // Filter by styles
    if (criteria.filterStyles && criteria.filterStyles.length > 0) {
      artworks = artworks.filter(
        a => a.analysis && criteria.filterStyles!.includes(a.analysis.style.primary)
      );
    }

    // Filter by tags
    if (criteria.filterTags && criteria.filterTags.length > 0) {
      artworks = artworks.filter(
        a => a.tags.some(tag => criteria.filterTags!.includes(tag))
      );
    }

    // Apply diversity filtering if requested
    if (criteria.diversityScore !== undefined && criteria.diversityScore > 0) {
      artworks = await this.selectDiverseSet(artworks, criteria.diversityScore);
    }

    // Sort artworks
    switch (criteria.sortBy) {
      case 'aesthetic':
        artworks.sort((a, b) => {
          const scoreA = a.analysis?.aesthetic.score || 0;
          const scoreB = b.analysis?.aesthetic.score || 0;
          return scoreB - scoreA;
        });
        break;

      case 'diversity':
        // Already handled by selectDiverseSet
        break;

      case 'date':
        artworks.sort((a, b) => b.created - a.created);
        break;

      case 'random':
        artworks = this.shuffleArray(artworks);
        break;
    }

    // Limit number of items
    if (criteria.maxItems !== undefined) {
      artworks = artworks.slice(0, criteria.maxItems);
    }

    // Create curated collection
    const curatedCollection: Collection = {
      ...collection,
      id: crypto.randomBytes(16).toString('hex'),
      name: `${collection.name} (Curated)`,
      artworks,
      created: Date.now(),
      updated: Date.now(),
      version: 1
    };

    await this.updateMetadata(curatedCollection);
    this.collections.set(curatedCollection.id, curatedCollection);
    await this.saveCollection(curatedCollection);

    return curatedCollection;
  }

  /**
   * Find similar artworks
   */
  async findSimilar(
    artworkId: string,
    collectionId?: string,
    limit: number = 10
  ): Promise<SimilarityResult[]> {
    let artworks: Artwork[];

    if (collectionId) {
      const collection = await this.get(collectionId);
      artworks = collection.artworks;
    } else {
      // Search across all collections
      artworks = [];
      for (const collection of this.collections.values()) {
        artworks.push(...collection.artworks);
      }
    }

    const targetArtwork = artworks.find(a => a.id === artworkId);
    if (!targetArtwork || !targetArtwork.analysis) {
      throw new Error('Artwork not found or not analyzed');
    }

    const similarities: SimilarityResult[] = [];

    for (const artwork of artworks) {
      if (artwork.id === artworkId || !artwork.analysis) continue;

      const similarity = this.calculateSimilarity(
        targetArtwork.analysis,
        artwork.analysis
      );

      similarities.push({
        artwork1: artworkId,
        artwork2: artwork.id,
        similarity,
        method: 'multi-factor'
      });
    }

    // Sort by similarity and return top results
    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.slice(0, limit);
  }

  /**
   * Cluster artworks by similarity
   */
  async clusterArtworks(
    collection: Collection,
    numClusters: number = 5
  ): Promise<Map<number, Artwork[]>> {
    const artworks = collection.artworks.filter(a => a.analysis);

    if (artworks.length === 0) {
      return new Map();
    }

    // Simple k-means clustering based on aesthetic features
    const clusters = new Map<number, Artwork[]>();

    // Initialize clusters with random artworks
    const centroids: ArtworkAnalysis[] = [];
    const selectedIndices = new Set<number>();

    while (centroids.length < numClusters && selectedIndices.size < artworks.length) {
      const index = Math.floor(Math.random() * artworks.length);
      if (!selectedIndices.has(index)) {
        selectedIndices.add(index);
        centroids.push(artworks[index].analysis!);
      }
    }

    // Iterate until convergence or max iterations
    const maxIterations = 50;
    for (let iter = 0; iter < maxIterations; iter++) {
      // Clear clusters
      clusters.clear();
      for (let i = 0; i < numClusters; i++) {
        clusters.set(i, []);
      }

      // Assign artworks to nearest centroid
      for (const artwork of artworks) {
        let nearestCluster = 0;
        let minDistance = Infinity;

        for (let i = 0; i < centroids.length; i++) {
          const distance = 1 - this.calculateSimilarity(artwork.analysis!, centroids[i]);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCluster = i;
          }
        }

        clusters.get(nearestCluster)!.push(artwork);
      }

      // Update centroids
      let changed = false;
      for (let i = 0; i < numClusters; i++) {
        const clusterArtworks = clusters.get(i)!;
        if (clusterArtworks.length > 0) {
          const newCentroid = this.calculateCentroid(
            clusterArtworks.map(a => a.analysis!)
          );

          if (this.calculateSimilarity(centroids[i], newCentroid) < 0.99) {
            centroids[i] = newCentroid;
            changed = true;
          }
        }
      }

      if (!changed) break;
    }

    return clusters;
  }

  /**
   * Get collection statistics
   */
  async getStatistics(collectionId: string): Promise<{
    totalArtworks: number;
    avgAestheticScore: number;
    styleDistribution: Map<string, number>;
    tagDistribution: Map<string, number>;
    qualityDistribution: {
      excellent: number;
      good: number;
      average: number;
      poor: number;
    };
    dimensionDistribution: Map<string, number>;
  }> {
    const collection = await this.get(collectionId);

    const stats = {
      totalArtworks: collection.artworks.length,
      avgAestheticScore: 0,
      styleDistribution: new Map<string, number>(),
      tagDistribution: new Map<string, number>(),
      qualityDistribution: {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0
      },
      dimensionDistribution: new Map<string, number>()
    };

    let totalScore = 0;

    for (const artwork of collection.artworks) {
      // Aesthetic score
      if (artwork.analysis) {
        const score = artwork.analysis.aesthetic.score;
        totalScore += score;

        // Quality distribution
        if (score >= 8) stats.qualityDistribution.excellent++;
        else if (score >= 6) stats.qualityDistribution.good++;
        else if (score >= 4) stats.qualityDistribution.average++;
        else stats.qualityDistribution.poor++;

        // Style distribution
        const style = artwork.analysis.style.primary;
        stats.styleDistribution.set(
          style,
          (stats.styleDistribution.get(style) || 0) + 1
        );
      }

      // Tag distribution
      for (const tag of artwork.tags) {
        stats.tagDistribution.set(
          tag,
          (stats.tagDistribution.get(tag) || 0) + 1
        );
      }

      // Dimension distribution
      const dimKey = `${artwork.dimensions.width}x${artwork.dimensions.height}`;
      stats.dimensionDistribution.set(
        dimKey,
        (stats.dimensionDistribution.get(dimKey) || 0) + 1
      );
    }

    stats.avgAestheticScore = totalScore / collection.artworks.length;

    return stats;
  }

  /**
   * Export collection
   */
  async export(
    collectionId: string,
    format: 'json' | 'csv' | 'html' = 'json',
    outputPath?: string
  ): Promise<string> {
    const collection = await this.get(collectionId);

    let content: string;
    let extension: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(collection, null, 2);
        extension = 'json';
        break;

      case 'csv':
        content = this.collectionToCSV(collection);
        extension = 'csv';
        break;

      case 'html':
        content = this.collectionToHTML(collection);
        extension = 'html';
        break;

      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    const filename = outputPath || path.join(
      this.storageDir,
      'exports',
      `${collection.name.replace(/\s+/g, '_')}_${Date.now()}.${extension}`
    );

    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filename, content);

    return filename;
  }

  /**
   * Import collection
   */
  async import(filePath: string): Promise<Collection> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const collection: Collection = JSON.parse(content);

    // Generate new ID
    collection.id = crypto.randomBytes(16).toString('hex');
    collection.created = Date.now();
    collection.updated = Date.now();
    collection.version = 1;

    this.collections.set(collection.id, collection);
    await this.saveCollection(collection);

    return collection;
  }

  /**
   * Search collections
   */
  async search(query: {
    name?: string;
    theme?: string;
    tags?: string[];
    styles?: string[];
    minAestheticScore?: number;
    dateRange?: { start: number; end: number };
  }): Promise<Collection[]> {
    const results: Collection[] = [];

    for (const collection of this.collections.values()) {
      let match = true;

      if (query.name && !collection.name.toLowerCase().includes(query.name.toLowerCase())) {
        match = false;
      }

      if (query.theme && collection.theme !== query.theme) {
        match = false;
      }

      if (query.minAestheticScore && collection.metadata.avgAestheticScore < query.minAestheticScore) {
        match = false;
      }

      if (query.dateRange) {
        if (collection.created < query.dateRange.start || collection.created > query.dateRange.end) {
          match = false;
        }
      }

      if (query.tags && query.tags.length > 0) {
        const hasTag = query.tags.some(tag => collection.metadata.tags.has(tag));
        if (!hasTag) match = false;
      }

      if (query.styles && query.styles.length > 0) {
        const hasStyle = query.styles.some(style => collection.metadata.styles.has(style));
        if (!hasStyle) match = false;
      }

      if (match) {
        results.push(collection);
      }
    }

    return results;
  }

  /**
   * Delete collection
   */
  async delete(collectionId: string): Promise<void> {
    const collection = await this.get(collectionId);

    // Delete collection file
    const collectionPath = path.join(this.storageDir, `${collectionId}.json`);
    if (fs.existsSync(collectionPath)) {
      fs.unlinkSync(collectionPath);
    }

    this.collections.delete(collectionId);
  }

  /**
   * Update collection metadata
   */
  private async updateMetadata(collection: Collection): Promise<void> {
    const metadata: CollectionMetadata = {
      totalArtworks: collection.artworks.length,
      avgAestheticScore: 0,
      styles: new Map(),
      tags: new Map(),
      dateRange: {
        start: Number.MAX_SAFE_INTEGER,
        end: 0
      }
    };

    let totalScore = 0;

    for (const artwork of collection.artworks) {
      // Update date range
      if (artwork.created < metadata.dateRange.start) {
        metadata.dateRange.start = artwork.created;
      }
      if (artwork.created > metadata.dateRange.end) {
        metadata.dateRange.end = artwork.created;
      }

      // Update styles
      if (artwork.analysis) {
        const style = artwork.analysis.style.primary;
        metadata.styles.set(style, (metadata.styles.get(style) || 0) + 1);
        totalScore += artwork.analysis.aesthetic.score;
      }

      // Update tags
      for (const tag of artwork.tags) {
        metadata.tags.set(tag, (metadata.tags.get(tag) || 0) + 1);
      }
    }

    metadata.avgAestheticScore = collection.artworks.length > 0
      ? totalScore / collection.artworks.length
      : 0;

    collection.metadata = metadata;
  }

  /**
   * Calculate similarity between two artworks
   */
  private calculateSimilarity(
    analysis1: ArtworkAnalysis,
    analysis2: ArtworkAnalysis
  ): number {
    // Multi-factor similarity calculation

    // Aesthetic similarity (20%)
    const aestheticSim = 1 - Math.abs(
      analysis1.aesthetic.score - analysis2.aesthetic.score
    ) / 10;

    // Composition similarity (20%)
    const compSim = (
      (1 - Math.abs(analysis1.composition.ruleOfThirds - analysis2.composition.ruleOfThirds)) +
      (1 - Math.abs(analysis1.composition.goldenRatio - analysis2.composition.goldenRatio)) +
      (1 - Math.abs(analysis1.composition.balance - analysis2.composition.balance)) +
      (1 - Math.abs(analysis1.composition.symmetry - analysis2.composition.symmetry))
    ) / 4;

    // Style similarity (30%)
    const styleSim = analysis1.style.primary === analysis2.style.primary ? 1.0 : 0.3;

    // Color similarity (30%)
    const colorSim = this.calculateColorSimilarity(
      analysis1.colors.palette,
      analysis2.colors.palette
    );

    return (
      aestheticSim * 0.2 +
      compSim * 0.2 +
      styleSim * 0.3 +
      colorSim * 0.3
    );
  }

  /**
   * Calculate color palette similarity
   */
  private calculateColorSimilarity(palette1: string[], palette2: string[]): number {
    let matches = 0;
    const maxLen = Math.max(palette1.length, palette2.length);

    for (const color1 of palette1) {
      if (palette2.includes(color1)) {
        matches++;
      }
    }

    return matches / maxLen;
  }

  /**
   * Calculate centroid from multiple analyses
   */
  private calculateCentroid(analyses: ArtworkAnalysis[]): ArtworkAnalysis {
    const centroid: ArtworkAnalysis = {
      style: { primary: '', confidence: 0 },
      aesthetic: {
        score: 0,
        aspects: { composition: 0, colorHarmony: 0, lighting: 0, detail: 0 }
      },
      composition: { ruleOfThirds: 0, goldenRatio: 0, balance: 0, symmetry: 0 },
      colors: { dominant: [], palette: [], mood: '', contrast: 0 },
      technical: { sharpness: 0, noise: 0, artifacts: 0 }
    };

    for (const analysis of analyses) {
      centroid.aesthetic.score += analysis.aesthetic.score;
      centroid.composition.ruleOfThirds += analysis.composition.ruleOfThirds;
      centroid.composition.goldenRatio += analysis.composition.goldenRatio;
      centroid.composition.balance += analysis.composition.balance;
      centroid.composition.symmetry += analysis.composition.symmetry;
    }

    const count = analyses.length;
    centroid.aesthetic.score /= count;
    centroid.composition.ruleOfThirds /= count;
    centroid.composition.goldenRatio /= count;
    centroid.composition.balance /= count;
    centroid.composition.symmetry /= count;

    // Most common style
    const styleCounts = new Map<string, number>();
    for (const analysis of analyses) {
      const style = analysis.style.primary;
      styleCounts.set(style, (styleCounts.get(style) || 0) + 1);
    }

    let maxCount = 0;
    for (const [style, count] of styleCounts) {
      if (count > maxCount) {
        maxCount = count;
        centroid.style.primary = style;
        centroid.style.confidence = count / analyses.length;
      }
    }

    return centroid;
  }

  /**
   * Select diverse set of artworks
   */
  private async selectDiverseSet(
    artworks: Artwork[],
    diversityScore: number
  ): Promise<Artwork[]> {
    const selected: Artwork[] = [];

    if (artworks.length === 0) return selected;

    // Start with highest scoring artwork
    const sorted = artworks
      .filter(a => a.analysis)
      .sort((a, b) => (b.analysis!.aesthetic.score - a.analysis!.aesthetic.score));

    selected.push(sorted[0]);

    // Iteratively add artworks that are different from already selected
    while (selected.length < artworks.length) {
      let maxMinDistance = 0;
      let nextArtwork: Artwork | null = null;

      for (const artwork of sorted) {
        if (selected.includes(artwork)) continue;

        // Find minimum distance to selected artworks
        let minDistance = Infinity;
        for (const selectedArtwork of selected) {
          const similarity = this.calculateSimilarity(
            artwork.analysis!,
            selectedArtwork.analysis!
          );
          const distance = 1 - similarity;
          if (distance < minDistance) {
            minDistance = distance;
          }
        }

        // Select artwork with maximum minimum distance
        if (minDistance > maxMinDistance) {
          maxMinDistance = minDistance;
          nextArtwork = artwork;
        }
      }

      if (!nextArtwork || maxMinDistance < (1 - diversityScore)) break;

      selected.push(nextArtwork);
    }

    return selected;
  }

  /**
   * Shuffle array
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Convert collection to CSV
   */
  private collectionToCSV(collection: Collection): string {
    const headers = [
      'ID', 'Path', 'Model', 'Width', 'Height', 'Prompt',
      'Style', 'Aesthetic Score', 'Tags', 'Created'
    ];

    const rows = collection.artworks.map(a => [
      a.id,
      a.path,
      a.model,
      a.dimensions.width,
      a.dimensions.height,
      a.prompt || '',
      a.analysis?.style.primary || '',
      a.analysis?.aesthetic.score || '',
      a.tags.join(';'),
      new Date(a.created).toISOString()
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Convert collection to HTML
   */
  private collectionToHTML(collection: Collection): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${collection.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { margin-bottom: 30px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
    .item { border: 1px solid #ddd; padding: 10px; border-radius: 8px; }
    .item img { width: 100%; border-radius: 4px; }
    .score { font-weight: bold; color: #2196F3; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${collection.name}</h1>
    <p>${collection.description || ''}</p>
    <p><strong>Total Artworks:</strong> ${collection.artworks.length}</p>
    <p><strong>Avg Aesthetic Score:</strong> ${collection.metadata.avgAestheticScore.toFixed(2)}</p>
  </div>
  <div class="grid">
    ${collection.artworks.map(a => `
      <div class="item">
        <img src="${a.path}" alt="${a.prompt || 'Artwork'}">
        <p><strong>Model:</strong> ${a.model}</p>
        <p><strong>Style:</strong> ${a.analysis?.style.primary || 'N/A'}</p>
        <p class="score">Score: ${a.analysis?.aesthetic.score.toFixed(2) || 'N/A'}</p>
        <p><small>${a.tags.join(', ')}</small></p>
      </div>
    `).join('')}
  </div>
</body>
</html>
    `;
  }

  /**
   * Load collections from storage
   */
  private async loadCollections(): Promise<void> {
    const files = fs.readdirSync(this.storageDir);

    for (const file of files) {
      if (file.endsWith('.json') && !file.startsWith('backup_')) {
        const filePath = path.join(this.storageDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const collection: Collection = JSON.parse(content);
        this.collections.set(collection.id, collection);
      }
    }
  }

  /**
   * Save collection to storage
   */
  private async saveCollection(collection: Collection): Promise<void> {
    const filePath = path.join(this.storageDir, `${collection.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(collection, null, 2));
  }

  /**
   * Start auto-backup
   */
  private startAutoBackup(): void {
    this.backupTimer = setInterval(async () => {
      await this.backupAll();
    }, this.backupInterval);
  }

  /**
   * Backup all collections
   */
  private async backupAll(): Promise<void> {
    const backupDir = path.join(this.storageDir, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = Date.now();

    for (const collection of this.collections.values()) {
      const backupPath = path.join(
        backupDir,
        `backup_${collection.id}_${timestamp}.json`
      );
      fs.writeFileSync(backupPath, JSON.stringify(collection, null, 2));
    }

    console.log(`Backed up ${this.collections.size} collections`);
  }

  /**
   * Cleanup old backups
   */
  async cleanupBackups(keepLast: number = 10): Promise<void> {
    const backupDir = path.join(this.storageDir, 'backups');
    if (!fs.existsSync(backupDir)) return;

    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_'))
      .map(f => ({
        name: f,
        path: path.join(backupDir, f),
        mtime: fs.statSync(path.join(backupDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);

    // Keep only the last N backups
    for (let i = keepLast; i < files.length; i++) {
      fs.unlinkSync(files[i].path);
    }
  }

  /**
   * Dispose and cleanup
   */
  async dispose(): Promise<void> {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    // Final backup
    if (this.autoBackup) {
      await this.backupAll();
    }
  }
}

export default CollectionManager;
