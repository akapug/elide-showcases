/**
 * Phylogenetic Tree Builder
 *
 * Constructs and analyzes phylogenetic trees using various methods
 * including distance-based, parsimony, and maximum likelihood approaches.
 */

// @ts-ignore
import Bio from 'python:Bio';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Tree,
  TreeNode,
  TreeOptions,
  BootstrapResult,
  DistanceMatrix,
  AlignmentError
} from '../types';

/**
 * TreeBuilder provides phylogenetic tree construction and analysis.
 */
export class TreeBuilder {
  private readonly Phylo: any;
  private readonly TreeConstruction: any;
  private readonly Consensus: any;

  constructor() {
    this.Phylo = Bio.Phylo;
    this.TreeConstruction = Bio.Phylo.TreeConstruction;
    this.Consensus = Bio.Phylo.Consensus;
  }

  // ==========================================================================
  // Tree Construction from Sequences
  // ==========================================================================

  /**
   * Builds a phylogenetic tree from sequences.
   */
  async buildFromSequences(
    sequences: Record<string, string>,
    options: TreeOptions = { method: 'neighbor-joining' }
  ): Promise<Tree> {
    try {
      const { method, model = 'jukes-cantor', bootstrap } = options;

      // Calculate distance matrix
      const distanceMatrix = await this.calculateDistanceMatrix(sequences, model);

      // Build tree based on method
      let tree;
      if (method === 'neighbor-joining') {
        tree = await this.neighborJoining(distanceMatrix);
      } else if (method === 'upgma') {
        tree = await this.upgma(distanceMatrix);
      } else if (method === 'maximum-parsimony') {
        tree = await this.maximumParsimony(sequences);
      } else {
        tree = await this.maximumLikelihood(sequences, model);
      }

      return tree;
    } catch (error) {
      throw new AlignmentError(`Tree construction failed: ${error}`);
    }
  }

  /**
   * Builds tree from pre-calculated distance matrix.
   */
  async buildFromDistances(
    distances: number[][],
    labels: string[],
    method: 'neighbor-joining' | 'upgma' = 'neighbor-joining'
  ): Promise<Tree> {
    try {
      const distanceMatrix: DistanceMatrix = {
        labels,
        matrix: distances
      };

      if (method === 'neighbor-joining') {
        return this.neighborJoining(distanceMatrix);
      } else {
        return this.upgma(distanceMatrix);
      }
    } catch (error) {
      throw new AlignmentError(`Tree construction failed: ${error}`);
    }
  }

  // ==========================================================================
  // Distance-Based Methods
  // ==========================================================================

  /**
   * Neighbor-Joining tree construction.
   */
  private async neighborJoining(distanceMatrix: DistanceMatrix): Promise<Tree> {
    try {
      // Create Bio.Phylo distance matrix
      const dm = this.createBioDistanceMatrix(distanceMatrix);

      // Build tree using Neighbor-Joining
      const constructor = this.TreeConstruction.DistanceTreeConstructor();
      const bioTree = constructor.nj(dm);

      // Convert to our tree format
      return this.convertBioTree(bioTree);
    } catch (error) {
      throw new AlignmentError(`Neighbor-Joining failed: ${error}`);
    }
  }

  /**
   * UPGMA tree construction.
   */
  private async upgma(distanceMatrix: DistanceMatrix): Promise<Tree> {
    try {
      const dm = this.createBioDistanceMatrix(distanceMatrix);
      const constructor = this.TreeConstruction.DistanceTreeConstructor();
      const bioTree = constructor.upgma(dm);

      return this.convertBioTree(bioTree);
    } catch (error) {
      throw new AlignmentError(`UPGMA failed: ${error}`);
    }
  }

  // ==========================================================================
  // Parsimony Methods
  // ==========================================================================

  /**
   * Maximum Parsimony tree construction.
   */
  private async maximumParsimony(sequences: Record<string, string>): Promise<Tree> {
    try {
      // Convert sequences to alignment
      const alignment = this.createAlignment(sequences);

      // Build parsimony tree
      const scorer = this.TreeConstruction.ParsimonyScorer();
      const searcher = this.TreeConstruction.NNITreeSearcher(scorer);
      const constructor = this.TreeConstruction.ParsimonyTreeConstructor(searcher);

      const bioTree = constructor.build_tree(alignment);

      return this.convertBioTree(bioTree);
    } catch (error) {
      throw new AlignmentError(`Maximum Parsimony failed: ${error}`);
    }
  }

  /**
   * Calculates parsimony score for a tree.
   */
  async calculateParsimonyScore(
    tree: Tree,
    sequences: Record<string, string>
  ): Promise<number> {
    try {
      const alignment = this.createAlignment(sequences);
      const bioTree = this.convertToBioTree(tree);
      const scorer = this.TreeConstruction.ParsimonyScorer();

      return scorer.get_score(bioTree, alignment);
    } catch (error) {
      throw new AlignmentError(`Parsimony score calculation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Maximum Likelihood Methods
  // ==========================================================================

  /**
   * Maximum Likelihood tree construction.
   */
  private async maximumLikelihood(
    sequences: Record<string, string>,
    model: string
  ): Promise<Tree> {
    // Note: Full ML requires external tools like RAxML or PhyML
    // This is a simplified version
    try {
      // For demonstration, use distance-based method with ML distances
      const distanceMatrix = await this.calculateDistanceMatrix(sequences, model);
      return this.neighborJoining(distanceMatrix);
    } catch (error) {
      throw new AlignmentError(`Maximum Likelihood failed: ${error}`);
    }
  }

  // ==========================================================================
  // Bootstrap Analysis
  // ==========================================================================

  /**
   * Performs bootstrap analysis.
   */
  async bootstrap(
    sequences: Record<string, string>,
    options: {
      replicates?: number;
      method?: 'neighbor-joining' | 'upgma' | 'maximum-parsimony';
      model?: string;
    } = {}
  ): Promise<BootstrapResult> {
    const { replicates = 100, method = 'neighbor-joining', model = 'jukes-cantor' } = options;

    try {
      const trees: Tree[] = [];
      const seqArray = Object.entries(sequences);

      // Generate bootstrap replicates
      for (let i = 0; i < replicates; i++) {
        const bootstrapSeqs = this.generateBootstrapSample(seqArray);
        const tree = await this.buildFromSequences(
          Object.fromEntries(bootstrapSeqs),
          { method, model }
        );
        trees.push(tree);
      }

      // Build consensus tree
      const consensusTree = this.buildConsensusTree(trees);

      // Calculate support values
      const support = this.calculateBootstrapSupport(trees);

      return {
        tree: consensusTree,
        support,
        replicates
      };
    } catch (error) {
      throw new AlignmentError(`Bootstrap analysis failed: ${error}`);
    }
  }

  /**
   * Generates bootstrap sample.
   */
  private generateBootstrapSample(
    sequences: Array<[string, string]>
  ): Array<[string, string]> {
    if (sequences.length === 0) return [];

    const seqLength = sequences[0][1].length;
    const positions: number[] = [];

    // Randomly sample positions with replacement
    for (let i = 0; i < seqLength; i++) {
      positions.push(Math.floor(Math.random() * seqLength));
    }

    // Create bootstrap sequences
    return sequences.map(([name, seq]) => {
      const bootstrapSeq = positions.map(pos => seq[pos]).join('');
      return [name, bootstrapSeq];
    });
  }

  /**
   * Builds consensus tree from multiple trees.
   */
  private buildConsensusTree(trees: Tree[]): Tree {
    // Convert to Bio.Phylo trees
    const bioTrees = trees.map(t => this.convertToBioTree(t));

    // Build majority rule consensus
    const consensus = this.Consensus.majority_consensus(bioTrees, 0.5);

    return this.convertBioTree(consensus);
  }

  /**
   * Calculates bootstrap support values.
   */
  private calculateBootstrapSupport(trees: Tree[]): Map<string, number> {
    const support = new Map<string, number>();

    // Count bipartitions
    const bipartitions = new Map<string, number>();

    for (const tree of trees) {
      const splits = this.getBipartitions(tree);
      for (const split of splits) {
        const key = split.sort().join('|');
        bipartitions.set(key, (bipartitions.get(key) || 0) + 1);
      }
    }

    // Convert to percentages
    for (const [key, count] of bipartitions.entries()) {
      support.set(key, (count / trees.length) * 100);
    }

    return support;
  }

  /**
   * Gets bipartitions (splits) from a tree.
   */
  private getBipartitions(tree: Tree): string[][] {
    const splits: string[][] = [];

    const traverse = (node: TreeNode, leaves: Set<string>) => {
      if (node.children.length === 0) {
        // Leaf node
        if (node.name) leaves.add(node.name);
        return;
      }

      // Internal node
      for (const child of node.children) {
        const childLeaves = new Set<string>();
        traverse(child, childLeaves);
        if (childLeaves.size > 0) {
          splits.push(Array.from(childLeaves));
        }
        for (const leaf of childLeaves) {
          leaves.add(leaf);
        }
      }
    };

    traverse(tree.root, new Set());
    return splits;
  }

  // ==========================================================================
  // Distance Matrix Calculation
  // ==========================================================================

  /**
   * Calculates distance matrix from sequences.
   */
  private async calculateDistanceMatrix(
    sequences: Record<string, string>,
    model: string = 'jukes-cantor'
  ): Promise<DistanceMatrix> {
    const labels = Object.keys(sequences);
    const seqArray = Object.values(sequences);
    const n = labels.length;
    const matrix: number[][] = Array(n)
      .fill(0)
      .map(() => Array(n).fill(0));

    // Calculate pairwise distances
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const distance = this.calculatePairwiseDistance(
          seqArray[i],
          seqArray[j],
          model
        );
        matrix[i][j] = distance;
        matrix[j][i] = distance;
      }
    }

    return { labels, matrix };
  }

  /**
   * Calculates pairwise distance between two sequences.
   */
  private calculatePairwiseDistance(
    seq1: string,
    seq2: string,
    model: string
  ): number {
    // Calculate number of differences
    let differences = 0;
    let validPositions = 0;

    for (let i = 0; i < Math.min(seq1.length, seq2.length); i++) {
      if (seq1[i] !== '-' && seq2[i] !== '-') {
        validPositions++;
        if (seq1[i] !== seq2[i]) {
          differences++;
        }
      }
    }

    if (validPositions === 0) return 1.0;

    const p = differences / validPositions;

    // Apply evolutionary model
    if (model === 'jukes-cantor') {
      return this.jukesCantor(p);
    } else if (model === 'kimura') {
      return this.kimuraTwoParameter(seq1, seq2);
    } else {
      return p; // Raw p-distance
    }
  }

  /**
   * Jukes-Cantor distance correction.
   */
  private jukesCantor(p: number): number {
    if (p >= 0.75) return 3.5; // Maximum distance
    return (-3 / 4) * Math.log(1 - (4 * p) / 3);
  }

  /**
   * Kimura two-parameter distance.
   */
  private kimuraTwoParameter(seq1: string, seq2: string): number {
    let transitions = 0;
    let transversions = 0;
    let validPositions = 0;

    const isTransition = (a: string, b: string): boolean => {
      return (
        (a === 'A' && b === 'G') ||
        (a === 'G' && b === 'A') ||
        (a === 'C' && b === 'T') ||
        (a === 'T' && b === 'C')
      );
    };

    for (let i = 0; i < Math.min(seq1.length, seq2.length); i++) {
      if (seq1[i] !== '-' && seq2[i] !== '-') {
        validPositions++;
        if (seq1[i] !== seq2[i]) {
          if (isTransition(seq1[i], seq2[i])) {
            transitions++;
          } else {
            transversions++;
          }
        }
      }
    }

    if (validPositions === 0) return 1.0;

    const P = transitions / validPositions;
    const Q = transversions / validPositions;

    const term1 = 1 - 2 * P - Q;
    const term2 = 1 - 2 * Q;

    if (term1 <= 0 || term2 <= 0) return 3.5;

    return -0.5 * Math.log(term1) - 0.25 * Math.log(term2);
  }

  // ==========================================================================
  // Tree Conversion and Formatting
  // ==========================================================================

  /**
   * Converts Bio.Phylo tree to our format.
   */
  private convertBioTree(bioTree: any): Tree {
    const convertNode = (bioNode: any): TreeNode => {
      const node: TreeNode = {
        name: bioNode.name || undefined,
        branchLength: bioNode.branch_length || undefined,
        children: [],
        bootstrap: bioNode.confidence || undefined
      };

      if (bioNode.clades) {
        node.children = bioNode.clades.map((child: any) => convertNode(child));
        for (const child of node.children) {
          child.parent = node;
        }
      }

      return node;
    };

    const root = convertNode(bioTree.clade || bioTree.root);
    const leaves: TreeNode[] = [];
    const internal: TreeNode[] = [];

    const traverse = (node: TreeNode) => {
      if (node.children.length === 0) {
        leaves.push(node);
      } else {
        internal.push(node);
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(root);

    return {
      newick: this.toNewick(root),
      root,
      leaves,
      internal
    };
  }

  /**
   * Converts our tree to Bio.Phylo format.
   */
  private convertToBioTree(tree: Tree): any {
    // Create Bio.Phylo tree structure
    const Clade = this.Phylo.BaseTree.Clade;

    const convertNode = (node: TreeNode): any => {
      const clade = Clade(
        branch_length: node.branchLength,
        name: node.name,
        confidence: node.bootstrap
      );

      if (node.children.length > 0) {
        clade.clades = node.children.map(child => convertNode(child));
      }

      return clade;
    };

    const rootClade = convertNode(tree.root);
    return this.Phylo.BaseTree.Tree(rootClade);
  }

  /**
   * Converts tree to Newick format.
   */
  toNewick(node: TreeNode): string {
    if (node.children.length === 0) {
      // Leaf node
      const name = node.name || '';
      const length = node.branchLength !== undefined ? `:${node.branchLength}` : '';
      return `${name}${length}`;
    }

    // Internal node
    const children = node.children.map(child => this.toNewick(child)).join(',');
    const name = node.name || '';
    const length = node.branchLength !== undefined ? `:${node.branchLength}` : '';
    const bootstrap = node.bootstrap !== undefined ? `[${node.bootstrap}]` : '';

    return `(${children})${name}${bootstrap}${length}`;
  }

  /**
   * Parses Newick format string to tree.
   */
  fromNewick(newick: string): Tree {
    try {
      const bioTree = this.Phylo.read(newick, 'newick');
      return this.convertBioTree(bioTree);
    } catch (error) {
      throw new AlignmentError(`Newick parsing failed: ${error}`);
    }
  }

  // ==========================================================================
  // Tree Comparison
  // ==========================================================================

  /**
   * Compares two trees and returns Robinson-Foulds distance.
   */
  async compareTrees(tree1: Tree, tree2: Tree): Promise<number> {
    const splits1 = new Set(this.getBipartitions(tree1).map(s => s.sort().join('|')));
    const splits2 = new Set(this.getBipartitions(tree2).map(s => s.sort().join('|')));

    // Count symmetric difference
    let distance = 0;

    for (const split of splits1) {
      if (!splits2.has(split)) distance++;
    }

    for (const split of splits2) {
      if (!splits1.has(split)) distance++;
    }

    return distance;
  }

  // ==========================================================================
  // Visualization
  // ==========================================================================

  /**
   * Generates ASCII tree visualization.
   */
  visualizeASCII(tree: Tree): string {
    const lines: string[] = [];

    const traverse = (node: TreeNode, prefix: string, isLast: boolean) => {
      const connector = isLast ? '└── ' : '├── ';
      const name = node.name || 'internal';
      const length = node.branchLength !== undefined ? ` (${node.branchLength.toFixed(4)})` : '';
      const bootstrap = node.bootstrap !== undefined ? ` [${node.bootstrap.toFixed(1)}]` : '';

      lines.push(prefix + connector + name + length + bootstrap);

      if (node.children.length > 0) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        for (let i = 0; i < node.children.length; i++) {
          traverse(node.children[i], childPrefix, i === node.children.length - 1);
        }
      }
    };

    lines.push('Root');
    for (let i = 0; i < tree.root.children.length; i++) {
      traverse(tree.root.children[i], '', i === tree.root.children.length - 1);
    }

    return lines.join('\n');
  }

  /**
   * Exports tree for visualization with external tools.
   */
  async visualize(tree: Tree, outputPath: string): Promise<void> {
    try {
      const bioTree = this.convertToBioTree(tree);
      this.Phylo.write(bioTree, outputPath, 'newick');
    } catch (error) {
      throw new AlignmentError(`Tree visualization failed: ${error}`);
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Creates Bio.Phylo distance matrix.
   */
  private createBioDistanceMatrix(dm: DistanceMatrix): any {
    const DistanceMatrix = this.TreeConstruction.DistanceMatrix;
    return DistanceMatrix(dm.labels, dm.matrix);
  }

  /**
   * Creates alignment from sequences.
   */
  private createAlignment(sequences: Record<string, string>): any {
    const MultipleSeqAlignment = Bio.Align.MultipleSeqAlignment;
    const Seq = Bio.Seq.Seq;
    const SeqRecord = Bio.SeqRecord.SeqRecord;

    const records = Object.entries(sequences).map(
      ([name, seq]) => SeqRecord(Seq(seq), id: name)
    );

    return MultipleSeqAlignment(records);
  }

  /**
   * Gets all leaf names from tree.
   */
  getLeafNames(tree: Tree): string[] {
    return tree.leaves.map(leaf => leaf.name).filter((name): name is string => !!name);
  }

  /**
   * Calculates tree depth (longest path from root to leaf).
   */
  calculateDepth(tree: Tree): number {
    const traverse = (node: TreeNode): number => {
      if (node.children.length === 0) {
        return node.branchLength || 0;
      }

      const childDepths = node.children.map(child => traverse(child));
      const maxChildDepth = Math.max(...childDepths);
      return (node.branchLength || 0) + maxChildDepth;
    };

    return traverse(tree.root);
  }
}

// Convenience functions

export async function buildTree(
  sequences: Record<string, string>,
  options?: TreeOptions
): Promise<Tree> {
  const builder = new TreeBuilder();
  return builder.buildFromSequences(sequences, options);
}

export async function bootstrapTree(
  sequences: Record<string, string>,
  replicates: number = 100
): Promise<BootstrapResult> {
  const builder = new TreeBuilder();
  return builder.bootstrap(sequences, { replicates });
}
