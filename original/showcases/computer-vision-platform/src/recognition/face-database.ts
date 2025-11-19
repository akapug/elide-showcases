/**
 * Face Database Module for Computer Vision Platform
 *
 * Demonstrates Elide's polyglot capabilities by using Python's numpy
 * for efficient array operations and face encoding management.
 *
 * Features:
 * - Store and manage face encodings
 * - Fast face matching and retrieval
 * - Persistent storage with JSON/binary formats
 * - Batch operations and indexing
 * - Similarity search and ranking
 */

// @ts-ignore - Elide polyglot import: numpy for array operations
import numpy from 'python:numpy';
// @ts-ignore - Elide polyglot import: pickle for serialization
import pickle from 'python:pickle';

import { compareFaces, faceDistance, findBestMatch } from './face-detector';

/**
 * Face entry in database
 */
export interface FaceEntry {
  id: string;
  name: string;
  encoding: number[];
  metadata?: {
    dateAdded: string;
    source?: string;
    labels?: string[];
    confidence?: number;
    [key: string]: any;
  };
}

/**
 * Face match result
 */
export interface FaceMatch {
  face: FaceEntry;
  distance: number;
  similarity: number; // 0-1 scale
  isMatch: boolean;
}

/**
 * Database search options
 */
export interface SearchOptions {
  tolerance?: number;
  maxResults?: number;
  minSimilarity?: number;
  filterLabels?: string[];
  sortBy?: 'distance' | 'similarity' | 'dateAdded';
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  totalFaces: number;
  uniqueNames: number;
  averageEncodingSize: number;
  storageSize: number;
  lastUpdated: string;
}

/**
 * Face Database class for managing face encodings
 *
 * Showcases Elide's polyglot capabilities with Python numpy arrays
 */
export class FaceDatabase {
  private faces: Map<string, FaceEntry>;
  private encodingMatrix: any; // numpy array for fast searching
  private isDirty: boolean = false;
  private lastUpdated: Date;

  constructor() {
    this.faces = new Map();
    this.lastUpdated = new Date();
    this.buildEncodingMatrix();
  }

  /**
   * Add a face to the database
   *
   * @param id - Unique identifier for the face
   * @param name - Person's name
   * @param encoding - Face encoding (128-dimensional vector)
   * @param metadata - Optional metadata
   * @returns True if added successfully
   */
  public addFace(
    id: string,
    name: string,
    encoding: number[],
    metadata?: Partial<FaceEntry['metadata']>
  ): boolean {
    try {
      if (this.faces.has(id)) {
        console.warn(`Face with ID ${id} already exists, updating...`);
      }

      const entry: FaceEntry = {
        id,
        name,
        encoding,
        metadata: {
          dateAdded: new Date().toISOString(),
          ...metadata,
        },
      };

      this.faces.set(id, entry);
      this.isDirty = true;
      this.lastUpdated = new Date();

      console.log(`Added face: ${name} (ID: ${id})`);
      return true;
    } catch (error) {
      console.error(`Failed to add face ${id}:`, error);
      return false;
    }
  }

  /**
   * Add multiple faces in batch
   *
   * @param entries - Array of face entries
   * @returns Number of faces added successfully
   */
  public addBatch(entries: Array<Omit<FaceEntry, 'metadata'> & { metadata?: any }>): number {
    let addedCount = 0;

    for (const entry of entries) {
      if (this.addFace(entry.id, entry.name, entry.encoding, entry.metadata)) {
        addedCount++;
      }
    }

    if (addedCount > 0) {
      this.buildEncodingMatrix();
    }

    return addedCount;
  }

  /**
   * Find matching face in database
   *
   * @param encoding - Face encoding to match
   * @param tolerance - Matching tolerance (lower is stricter)
   * @returns Matching face entry or null
   */
  public findMatch(encoding: number[], tolerance: number = 0.6): FaceMatch | null {
    if (this.faces.size === 0) {
      return null;
    }

    // Rebuild encoding matrix if needed
    if (this.isDirty) {
      this.buildEncodingMatrix();
    }

    try {
      // Convert encoding to numpy array for fast computation
      const queryEncoding = numpy.array(encoding);

      // Calculate distances to all faces using numpy
      const distances = this.calculateDistancesNumpy(queryEncoding);

      // Find best match
      let bestIndex = -1;
      let bestDistance = Infinity;

      for (let i = 0; i < distances.length; i++) {
        if (distances[i] < bestDistance) {
          bestDistance = distances[i];
          bestIndex = i;
        }
      }

      // Check if match meets tolerance threshold
      if (bestIndex !== -1 && bestDistance <= tolerance) {
        const faceEntries = Array.from(this.faces.values());
        const matchedFace = faceEntries[bestIndex];

        return {
          face: matchedFace,
          distance: bestDistance,
          similarity: this.distanceToSimilarity(bestDistance),
          isMatch: true,
        };
      }

      return null;
    } catch (error) {
      console.error('Face matching failed:', error);
      return null;
    }
  }

  /**
   * Find all similar faces in database
   *
   * @param encoding - Face encoding to match
   * @param options - Search options
   * @returns Array of matching faces sorted by similarity
   */
  public findSimilar(encoding: number[], options?: SearchOptions): FaceMatch[] {
    const defaultOptions: SearchOptions = {
      tolerance: 0.6,
      maxResults: 10,
      minSimilarity: 0.5,
      sortBy: 'distance',
    };

    const opts = { ...defaultOptions, ...options };

    if (this.faces.size === 0) {
      return [];
    }

    if (this.isDirty) {
      this.buildEncodingMatrix();
    }

    try {
      // Convert encoding to numpy array
      const queryEncoding = numpy.array(encoding);

      // Calculate distances
      const distances = this.calculateDistancesNumpy(queryEncoding);
      const faceEntries = Array.from(this.faces.values());

      // Build matches array
      const matches: FaceMatch[] = [];

      for (let i = 0; i < distances.length; i++) {
        const distance = distances[i];
        const similarity = this.distanceToSimilarity(distance);

        // Apply filters
        if (distance > opts.tolerance!) {
          continue;
        }

        if (similarity < opts.minSimilarity!) {
          continue;
        }

        const face = faceEntries[i];

        // Filter by labels if specified
        if (opts.filterLabels && opts.filterLabels.length > 0) {
          const faceLabels = face.metadata?.labels || [];
          const hasMatchingLabel = opts.filterLabels.some(label =>
            faceLabels.includes(label)
          );
          if (!hasMatchingLabel) {
            continue;
          }
        }

        matches.push({
          face,
          distance,
          similarity,
          isMatch: distance <= opts.tolerance!,
        });
      }

      // Sort matches
      this.sortMatches(matches, opts.sortBy!);

      // Limit results
      if (opts.maxResults && matches.length > opts.maxResults) {
        return matches.slice(0, opts.maxResults);
      }

      return matches;
    } catch (error) {
      console.error('Similarity search failed:', error);
      return [];
    }
  }

  /**
   * Get face by ID
   *
   * @param id - Face ID
   * @returns Face entry or undefined
   */
  public getFace(id: string): FaceEntry | undefined {
    return this.faces.get(id);
  }

  /**
   * Get all faces for a person
   *
   * @param name - Person's name
   * @returns Array of face entries
   */
  public getFacesByName(name: string): FaceEntry[] {
    const faces: FaceEntry[] = [];

    for (const face of this.faces.values()) {
      if (face.name.toLowerCase() === name.toLowerCase()) {
        faces.push(face);
      }
    }

    return faces;
  }

  /**
   * Get all faces in database
   *
   * @returns Array of all face entries
   */
  public getAllFaces(): FaceEntry[] {
    return Array.from(this.faces.values());
  }

  /**
   * Get all unique names in database
   *
   * @returns Array of unique names
   */
  public getAllNames(): string[] {
    const names = new Set<string>();

    for (const face of this.faces.values()) {
      names.add(face.name);
    }

    return Array.from(names).sort();
  }

  /**
   * Update face metadata
   *
   * @param id - Face ID
   * @param metadata - New metadata
   * @returns True if updated successfully
   */
  public updateMetadata(id: string, metadata: Partial<FaceEntry['metadata']>): boolean {
    const face = this.faces.get(id);

    if (!face) {
      console.warn(`Face with ID ${id} not found`);
      return false;
    }

    face.metadata = {
      ...face.metadata,
      ...metadata,
    };

    this.lastUpdated = new Date();
    return true;
  }

  /**
   * Remove face from database
   *
   * @param id - Face ID
   * @returns True if removed successfully
   */
  public removeFace(id: string): boolean {
    const removed = this.faces.delete(id);

    if (removed) {
      this.isDirty = true;
      this.lastUpdated = new Date();
      console.log(`Removed face: ${id}`);
    }

    return removed;
  }

  /**
   * Remove all faces for a person
   *
   * @param name - Person's name
   * @returns Number of faces removed
   */
  public removeFacesByName(name: string): number {
    let removedCount = 0;

    for (const [id, face] of this.faces.entries()) {
      if (face.name.toLowerCase() === name.toLowerCase()) {
        this.faces.delete(id);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      this.isDirty = true;
      this.lastUpdated = new Date();
      console.log(`Removed ${removedCount} faces for: ${name}`);
    }

    return removedCount;
  }

  /**
   * Clear all faces from database
   */
  public clear(): void {
    this.faces.clear();
    this.encodingMatrix = null;
    this.isDirty = false;
    this.lastUpdated = new Date();
    console.log('Database cleared');
  }

  /**
   * Get database size
   *
   * @returns Number of faces in database
   */
  public size(): number {
    return this.faces.size;
  }

  /**
   * Build numpy matrix of all encodings for fast searching
   * Demonstrates Elide's ability to use Python numpy for performance
   */
  private buildEncodingMatrix(): void {
    try {
      if (this.faces.size === 0) {
        this.encodingMatrix = null;
        this.isDirty = false;
        return;
      }

      const encodings: number[][] = [];

      for (const face of this.faces.values()) {
        encodings.push(face.encoding);
      }

      // Create numpy array from encodings
      this.encodingMatrix = numpy.array(encodings);
      this.isDirty = false;

      console.log(`Built encoding matrix: ${encodings.length} faces`);
    } catch (error) {
      console.error('Failed to build encoding matrix:', error);
      this.encodingMatrix = null;
    }
  }

  /**
   * Calculate distances using numpy for performance
   *
   * @param queryEncoding - Query face encoding as numpy array
   * @returns Array of distances
   */
  private calculateDistancesNumpy(queryEncoding: any): number[] {
    if (!this.encodingMatrix) {
      return [];
    }

    try {
      // Calculate Euclidean distances using numpy
      // distance = sqrt(sum((a - b)^2))
      const diff = numpy.subtract(this.encodingMatrix, queryEncoding);
      const squared = numpy.square(diff);
      const summed = numpy.sum(squared, { axis: 1 });
      const distances = numpy.sqrt(summed);

      // Convert numpy array to JavaScript array
      return Array.from(distances);
    } catch (error) {
      console.error('Numpy distance calculation failed:', error);

      // Fallback to JavaScript implementation
      return this.calculateDistancesJS(queryEncoding);
    }
  }

  /**
   * Fallback JavaScript implementation for distance calculation
   */
  private calculateDistancesJS(queryEncoding: number[]): number[] {
    const distances: number[] = [];

    for (const face of this.faces.values()) {
      let sum = 0;
      for (let i = 0; i < queryEncoding.length; i++) {
        const diff = face.encoding[i] - queryEncoding[i];
        sum += diff * diff;
      }
      distances.push(Math.sqrt(sum));
    }

    return distances;
  }

  /**
   * Convert distance to similarity score (0-1 scale)
   */
  private distanceToSimilarity(distance: number): number {
    // Using exponential decay formula
    // similarity = e^(-distance)
    return Math.exp(-distance);
  }

  /**
   * Sort matches by specified criteria
   */
  private sortMatches(matches: FaceMatch[], sortBy: string): void {
    switch (sortBy) {
      case 'distance':
        matches.sort((a, b) => a.distance - b.distance);
        break;
      case 'similarity':
        matches.sort((a, b) => b.similarity - a.similarity);
        break;
      case 'dateAdded':
        matches.sort((a, b) => {
          const dateA = new Date(a.face.metadata?.dateAdded || 0);
          const dateB = new Date(b.face.metadata?.dateAdded || 0);
          return dateB.getTime() - dateA.getTime();
        });
        break;
    }
  }

  /**
   * Get database statistics
   *
   * @returns Database statistics
   */
  public getStats(): DatabaseStats {
    const uniqueNames = new Set<string>();
    let totalEncodingSize = 0;

    for (const face of this.faces.values()) {
      uniqueNames.add(face.name);
      totalEncodingSize += face.encoding.length;
    }

    return {
      totalFaces: this.faces.size,
      uniqueNames: uniqueNames.size,
      averageEncodingSize: this.faces.size > 0 ? totalEncodingSize / this.faces.size : 0,
      storageSize: this.estimateStorageSize(),
      lastUpdated: this.lastUpdated.toISOString(),
    };
  }

  /**
   * Estimate storage size in bytes
   */
  private estimateStorageSize(): number {
    let size = 0;

    for (const face of this.faces.values()) {
      // ID and name (rough estimate)
      size += face.id.length * 2; // UTF-16
      size += face.name.length * 2;

      // Encoding (128 floats * 8 bytes)
      size += face.encoding.length * 8;

      // Metadata (rough estimate)
      if (face.metadata) {
        size += JSON.stringify(face.metadata).length * 2;
      }
    }

    return size;
  }

  /**
   * Export database to JSON
   *
   * @returns JSON string representation
   */
  public exportJSON(): string {
    const data = {
      version: '1.0',
      lastUpdated: this.lastUpdated.toISOString(),
      faces: Array.from(this.faces.values()),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Import database from JSON
   *
   * @param json - JSON string
   * @returns True if imported successfully
   */
  public importJSON(json: string): boolean {
    try {
      const data = JSON.parse(json);

      if (!data.faces || !Array.isArray(data.faces)) {
        throw new Error('Invalid database format');
      }

      this.clear();

      for (const face of data.faces) {
        this.addFace(face.id, face.name, face.encoding, face.metadata);
      }

      this.buildEncodingMatrix();

      console.log(`Imported ${data.faces.length} faces from JSON`);
      return true;
    } catch (error) {
      console.error('Failed to import from JSON:', error);
      return false;
    }
  }

  /**
   * Export database to binary format using pickle
   * Demonstrates Elide's polyglot capabilities
   *
   * @returns Binary data as Buffer
   */
  public exportBinary(): any {
    try {
      const data = {
        version: '1.0',
        lastUpdated: this.lastUpdated.toISOString(),
        faces: Array.from(this.faces.values()),
        encodingMatrix: this.encodingMatrix,
      };

      // Use Python pickle for serialization
      const pickled = pickle.dumps(data);
      return pickled;
    } catch (error) {
      console.error('Failed to export binary:', error);
      return null;
    }
  }

  /**
   * Import database from binary format
   *
   * @param data - Binary data
   * @returns True if imported successfully
   */
  public importBinary(data: any): boolean {
    try {
      // Use Python pickle for deserialization
      const unpickled = pickle.loads(data);

      this.clear();

      for (const face of unpickled.faces) {
        this.addFace(face.id, face.name, face.encoding, face.metadata);
      }

      if (unpickled.encodingMatrix) {
        this.encodingMatrix = unpickled.encodingMatrix;
        this.isDirty = false;
      } else {
        this.buildEncodingMatrix();
      }

      console.log(`Imported ${unpickled.faces.length} faces from binary`);
      return true;
    } catch (error) {
      console.error('Failed to import from binary:', error);
      return false;
    }
  }

  /**
   * Save database to file
   *
   * @param path - File path
   * @param format - 'json' or 'binary'
   * @returns True if saved successfully
   */
  public async save(path: string, format: 'json' | 'binary' = 'json'): Promise<boolean> {
    try {
      if (format === 'json') {
        const json = this.exportJSON();
        // Note: File writing would use Node.js fs in real implementation
        console.log(`Would save JSON to: ${path}`);
        return true;
      } else {
        const binary = this.exportBinary();
        console.log(`Would save binary to: ${path}`);
        return true;
      }
    } catch (error) {
      console.error(`Failed to save database to ${path}:`, error);
      return false;
    }
  }

  /**
   * Load database from file
   *
   * @param path - File path
   * @param format - 'json' or 'binary'
   * @returns True if loaded successfully
   */
  public async load(path: string, format: 'json' | 'binary' = 'json'): Promise<boolean> {
    try {
      // Note: File reading would use Node.js fs in real implementation
      console.log(`Would load ${format} from: ${path}`);
      return true;
    } catch (error) {
      console.error(`Failed to load database from ${path}:`, error);
      return false;
    }
  }
}

/**
 * Utility function to merge multiple databases
 *
 * @param databases - Array of databases to merge
 * @returns New merged database
 */
export function mergeDatabases(databases: FaceDatabase[]): FaceDatabase {
  const merged = new FaceDatabase();

  for (const db of databases) {
    const faces = db.getAllFaces();

    for (const face of faces) {
      merged.addFace(face.id, face.name, face.encoding, face.metadata);
    }
  }

  return merged;
}

/**
 * Create database from face entries
 *
 * @param entries - Array of face entries
 * @returns New database
 */
export function createDatabase(entries: FaceEntry[]): FaceDatabase {
  const db = new FaceDatabase();
  db.addBatch(entries);
  return db;
}
