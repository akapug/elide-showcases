/**
 * Bioinformatics Platform Type Definitions
 *
 * Comprehensive TypeScript types for bioinformatics data structures,
 * analysis results, and Python library interfaces.
 */

// ============================================================================
// Sequence Types
// ============================================================================

export type SequenceType = 'DNA' | 'RNA' | 'Protein';
export type Strand = '+' | '-';
export type ReadingFrame = 0 | 1 | 2;

export interface Sequence {
  sequence: string;
  type: SequenceType;
  id?: string;
  name?: string;
  description?: string;
  annotations?: Record<string, any>;
}

export interface DNASequence extends Sequence {
  type: 'DNA';
  circular?: boolean;
  chromosome?: string;
  start?: number;
  end?: number;
  strand?: Strand;
}

export interface RNASequence extends Sequence {
  type: 'RNA';
  secondaryStructure?: string;
}

export interface ProteinSequence extends Sequence {
  type: 'Protein';
  domains?: ProteinDomain[];
  modifications?: PTM[];
}

export interface ProteinDomain {
  name: string;
  start: number;
  end: number;
  eValue?: number;
  source?: string;
}

// ============================================================================
// Analysis Results
// ============================================================================

export interface DNAAnalysis {
  sequence: string;
  length: number;
  gcContent: number;
  atContent: number;
  molecularWeight: number;
  meltingTemperature?: number;
  nucleotideCounts: {
    A: number;
    T: number;
    C: number;
    G: number;
  };
  dinucleotideFrequencies?: Record<string, number>;
  trinucleotideFrequencies?: Record<string, number>;
}

export interface RNAAnalysis {
  sequence: string;
  length: number;
  gcContent: number;
  molecularWeight: number;
  nucleotideCounts: {
    A: number;
    U: number;
    C: number;
    G: number;
  };
  secondaryStructure?: SecondaryStructure;
  foldingEnergy?: number;
}

export interface ProteinAnalysis {
  sequence: string;
  length: number;
  molecularWeight: number;
  isoelectricPoint: number;
  aromaticity: number;
  instabilityIndex: number;
  gravy: number;
  aminoAcidComposition: Record<string, number>;
  secondaryStructure?: ProteinSecondaryStructure;
}

export interface SecondaryStructure {
  dotBracket: string;
  pairs: [number, number][];
  energy: number;
}

export interface ProteinSecondaryStructure {
  helices: Helix[];
  sheets: Sheet[];
  turns: Turn[];
  coils: Coil[];
  helixFraction: number;
  sheetFraction: number;
}

export interface Helix {
  start: number;
  end: number;
  type: 'alpha' | 'pi' | '310';
}

export interface Sheet {
  start: number;
  end: number;
  strand: number;
}

export interface Turn {
  start: number;
  end: number;
}

export interface Coil {
  start: number;
  end: number;
}

// ============================================================================
// Open Reading Frames
// ============================================================================

export interface ORF {
  start: number;
  end: number;
  strand: Strand;
  frame: ReadingFrame;
  sequence: string;
  proteinSequence: string;
  length: number;
  hasStartCodon: boolean;
  hasStopCodon: boolean;
}

export interface CodonUsage {
  codon: string;
  aminoAcid: string;
  count: number;
  frequency: number;
  rscu: number; // Relative Synonymous Codon Usage
}

// ============================================================================
// Alignment Types
// ============================================================================

export interface Alignment {
  sequences: AlignedSequence[];
  score: number;
  identity: number;
  similarity: number;
  gaps: number;
  length: number;
  formatted: string;
}

export interface AlignedSequence {
  id: string;
  sequence: string;
  start: number;
  end: number;
}

export interface PairwiseAlignment extends Alignment {
  sequences: [AlignedSequence, AlignedSequence];
  matches: number;
  mismatches: number;
  gapOpens: number;
  gapExtensions: number;
}

export interface MultipleAlignment {
  sequences: AlignedSequence[];
  consensus: string;
  conservation: number[];
  columns: number;
  identicalSites: number;
  conservedSites: number;
  variableSites: number;
}

export interface AlignmentOptions {
  algorithm?: 'global' | 'local';
  match?: number;
  mismatch?: number;
  gapOpen?: number;
  gapExtend?: number;
  matrix?: string; // 'BLOSUM62', 'PAM250', etc.
}

export interface MSAOptions {
  algorithm?: 'clustalw' | 'muscle' | 'mafft';
  gapPenalty?: number;
  iterations?: number;
}

// ============================================================================
// BLAST Types
// ============================================================================

export interface BlastOptions {
  database: string;
  program?: 'blastn' | 'blastp' | 'blastx' | 'tblastn' | 'tblastx';
  eValue?: number;
  maxHits?: number;
  wordSize?: number;
}

export interface BlastResult {
  queryId: string;
  hits: BlastHit[];
}

export interface BlastHit {
  hitId: string;
  hitDescription: string;
  eValue: number;
  bitScore: number;
  identity: number;
  positives: number;
  gaps: number;
  queryStart: number;
  queryEnd: number;
  hitStart: number;
  hitEnd: number;
  alignment: Alignment;
}

// ============================================================================
// Phylogenetic Types
// ============================================================================

export interface Tree {
  newick: string;
  root: TreeNode;
  leaves: TreeNode[];
  internal: TreeNode[];
}

export interface TreeNode {
  name?: string;
  branchLength?: number;
  children: TreeNode[];
  parent?: TreeNode;
  bootstrap?: number;
}

export interface TreeOptions {
  method: 'neighbor-joining' | 'upgma' | 'maximum-parsimony' | 'maximum-likelihood';
  model?: 'jukes-cantor' | 'kimura' | 'GTR' | 'GTR+G';
  bootstrap?: number;
}

export interface BootstrapResult {
  tree: Tree;
  support: Map<string, number>;
  replicates: number;
}

export interface DistanceMatrix {
  labels: string[];
  matrix: number[][];
}

// ============================================================================
// Protein Structure Types
// ============================================================================

export interface Structure {
  pdbId?: string;
  chains: Chain[];
  resolution?: number;
  method?: string;
  depositionDate?: Date;
  title?: string;
}

export interface Chain {
  id: string;
  residues: Residue[];
  sequence: string;
}

export interface Residue {
  name: string;
  number: number;
  chainId: string;
  atoms: Atom[];
  secondaryStructure?: 'H' | 'E' | 'C'; // Helix, Sheet, Coil
}

export interface Atom {
  name: string;
  element: string;
  x: number;
  y: number;
  z: number;
  bFactor: number;
  occupancy: number;
}

export interface StructureAnalysis {
  chains: string[];
  residueCount: number;
  atomCount: number;
  resolution?: number;
  rFactor?: number;
  rFree?: number;
  secondaryStructure: ProteinSecondaryStructure;
}

export interface ContactMap {
  residues: string[];
  contacts: number[][];
  threshold: number;
}

export interface RamachandranData {
  phi: number[];
  psi: number[];
  residues: string[];
  regions: Map<string, number>; // favored, allowed, outlier
}

// ============================================================================
// Genomics Types
// ============================================================================

export interface Variant {
  chromosome: string;
  position: number;
  id?: string;
  reference: string;
  alternate: string;
  quality: number;
  filter: string;
  info: Record<string, any>;
  genotype?: Genotype;
  depth?: number;
  alleleFrequency?: number;
  type: VariantType;
}

export type VariantType = 'SNP' | 'INSERTION' | 'DELETION' | 'MNP' | 'COMPLEX';

export interface Genotype {
  alleles: string[];
  phased: boolean;
  quality?: number;
}

export interface AnnotatedVariant extends Variant {
  gene?: string;
  transcript?: string;
  consequence?: string[];
  impact?: 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER';
  clinicalSignificance?: string;
  populationFrequency?: Record<string, number>;
  predictions?: VariantPrediction[];
}

export interface VariantPrediction {
  tool: string;
  score: number;
  prediction: 'benign' | 'pathogenic' | 'uncertain';
}

export interface VariantCallingOptions {
  reference: string;
  minQuality?: number;
  minDepth?: number;
  minAlleleFrequency?: number;
  caller?: 'gatk' | 'freebayes' | 'bcftools';
}

export interface AnnotationOptions {
  databases: string[];
  includeConsequences?: boolean;
  includePopulationFrequencies?: boolean;
  includePredictions?: boolean;
}

export interface FilterCriteria {
  minQuality?: number;
  minDepth?: number;
  maxDepth?: number;
  minAlleleFrequency?: number;
  maxAlleleFrequency?: number;
  type?: VariantType[];
  chromosomes?: string[];
}

// ============================================================================
// RNA-seq Types
// ============================================================================

export interface CountMatrix {
  genes: string[];
  samples: string[];
  counts: number[][];
}

export interface NormalizedMatrix {
  genes: string[];
  samples: string[];
  values: number[][];
  method: 'TPM' | 'RPKM' | 'FPKM' | 'CPM' | 'DESeq2' | 'TMM';
}

export interface NormalizationOptions {
  method: 'TPM' | 'RPKM' | 'FPKM' | 'CPM' | 'DESeq2' | 'TMM';
  geneLength?: Map<string, number>;
  librarySize?: number[];
}

export interface DEOptions {
  counts: CountMatrix;
  conditions: string[];
  replicates: number[];
  method: 'DESeq2' | 'edgeR' | 'limma';
  pValueThreshold?: number;
  foldChangeThreshold?: number;
}

export interface DEResult {
  geneId: string;
  baseMean: number;
  log2FoldChange: number;
  lfcSE: number;
  stat: number;
  pvalue: number;
  padj: number;
}

export interface PCAResult {
  components: number[][];
  variance: number[];
  varianceRatio: number[];
  labels: string[];
}

export interface ClusterResult {
  clusters: number[];
  centroids: number[][];
  method: string;
}

export interface EnrichmentResult {
  term: string;
  database: string;
  pValue: number;
  adjustedPValue: number;
  geneCount: number;
  genes: string[];
  enrichmentScore: number;
}

// ============================================================================
// Machine Learning Types
// ============================================================================

export interface TrainingOptions {
  sequences?: string[];
  labels?: any[];
  features?: string[];
  algorithm: 'random-forest' | 'svm' | 'neural-network' | 'gradient-boosting';
  nTrees?: number;
  maxDepth?: number;
  learningRate?: number;
  testSize?: number;
  crossValidation?: number;
}

export interface Model {
  algorithm: string;
  features: string[];
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrix: number[][];
  featureImportance: () => FeatureImportance[];
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface Metrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc?: number;
  confusionMatrix: number[][];
}

export interface GenePrediction {
  start: number;
  end: number;
  strand: Strand;
  score: number;
  codingPotential: number;
}

export interface SpliceSite {
  position: number;
  type: 'donor' | 'acceptor';
  score: number;
  sequence: string;
}

// ============================================================================
// Motif Types
// ============================================================================

export interface Motif {
  id: string;
  name?: string;
  instances: string[];
  consensus: string;
  length: number;
  pwm?: PWM;
  eValue?: number;
}

export interface PWM {
  matrix: number[][];
  alphabet: string[];
  length: number;
  background?: Record<string, number>;
}

export interface MotifOptions {
  minWidth: number;
  maxWidth: number;
  numMotifs: number;
  algorithm: 'meme' | 'gibbs' | 'bioprospector';
  background?: string;
}

export interface MotifHit {
  position: number;
  strand: Strand;
  sequence: string;
  score: number;
  pValue: number;
}

export interface ScanOptions {
  threshold: number;
  pseudocount?: number;
  bothStrands?: boolean;
}

// ============================================================================
// Proteomics Types
// ============================================================================

export interface Spectrum {
  id: string;
  mz: number[];
  intensity: number[];
  precursorMz: number;
  precursorCharge: number;
  retentionTime?: number;
  msLevel: number;
}

export interface PSM {
  spectrumId: string;
  peptide: string;
  score: number;
  eValue: number;
  charge: number;
  mzError: number;
  modifications?: Modification[];
  proteins: string[];
  fdr: number;
}

export interface Modification {
  position: number;
  name: string;
  mass: number;
}

export interface PTM {
  position: number;
  type: string;
  residue: string;
  score: number;
  localizationProbability: number;
}

export interface Protein {
  id: string;
  accession: string;
  description: string;
  sequence: string;
  peptides: string[];
  coverage: number;
  score: number;
}

export interface SearchOptions {
  database: string;
  enzyme?: 'trypsin' | 'chymotrypsin' | 'pepsin';
  missedCleavages?: number;
  modifications?: string[];
  fixedModifications?: string[];
  tolerance: number;
  fragmentTolerance?: number;
  minPeptideLength?: number;
  maxPeptideLength?: number;
}

export interface QuantificationResult {
  proteins: Map<string, number>;
  peptides: Map<string, number>;
  method: 'label-free' | 'silac' | 'tmt' | 'itraq';
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface BrowserOptions {
  reference: string;
  region?: string;
  width?: number;
  height?: number;
}

export interface Track {
  type: 'gene' | 'variant' | 'coverage' | 'alignment';
  data: any;
  color?: string;
  height?: number;
  label?: string;
}

export interface Browser {
  addTrack(track: Track): void;
  removeTrack(index: number): void;
  setRegion(region: string): void;
  render(output: string, options?: RenderOptions): Promise<void>;
}

export interface RenderOptions {
  width?: number;
  height?: number;
  dpi?: number;
  format?: 'png' | 'svg' | 'pdf';
}

export interface Gene {
  id: string;
  name: string;
  chromosome: string;
  start: number;
  end: number;
  strand: Strand;
  exons: Exon[];
  transcripts?: Transcript[];
}

export interface Exon {
  start: number;
  end: number;
}

export interface Transcript {
  id: string;
  name: string;
  start: number;
  end: number;
  exons: Exon[];
  cds?: [number, number];
}

// ============================================================================
// Error Types
// ============================================================================

export class BioinformaticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BioinformaticsError';
  }
}

export class InvalidSequenceError extends BioinformaticsError {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSequenceError';
  }
}

export class AlignmentError extends BioinformaticsError {
  constructor(message: string) {
    super(message);
    this.name = 'AlignmentError';
  }
}

export class StructureError extends BioinformaticsError {
  constructor(message: string) {
    super(message);
    this.name = 'StructureError';
  }
}

export class VariantCallingError extends BioinformaticsError {
  constructor(message: string) {
    super(message);
    this.name = 'VariantCallingError';
  }
}

export class AnalysisError extends BioinformaticsError {
  constructor(message: string) {
    super(message);
    this.name = 'AnalysisError';
  }
}

// ============================================================================
// Utility Types
// ============================================================================

export interface Range {
  start: number;
  end: number;
}

export interface GenomicRange extends Range {
  chromosome: string;
  strand?: Strand;
}

export interface FastaRecord {
  id: string;
  description: string;
  sequence: string;
}

export interface FastqRecord {
  id: string;
  sequence: string;
  quality: string;
}

export interface GenbankRecord {
  locus: string;
  definition: string;
  accession: string;
  version: string;
  organism: string;
  sequence: string;
  features: Feature[];
}

export interface Feature {
  type: string;
  location: string;
  qualifiers: Record<string, string>;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AnalysisConfig {
  threads?: number;
  memory?: number;
  tempDir?: string;
  verbose?: boolean;
}

export interface DatabaseConfig {
  path: string;
  type: 'blast' | 'uniprot' | 'pfam';
  version?: string;
}

export interface PipelineConfig {
  inputFiles: string[];
  outputDir: string;
  reference?: string;
  annotation?: string;
  parameters: Record<string, any>;
}
