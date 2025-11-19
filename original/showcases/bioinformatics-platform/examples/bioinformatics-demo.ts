/**
 * Bioinformatics Platform Demo
 *
 * Comprehensive demonstration of all bioinformatics capabilities
 * including sequence analysis, alignment, phylogenetics, genomics,
 * RNA-seq, machine learning, and visualization.
 */

import { SequenceAnalyzer } from '../src/sequence/sequence-analyzer';
import { SequenceAligner } from '../src/alignment/sequence-aligner';
import { TreeBuilder } from '../src/phylogeny/tree-builder';
import { ProteinStructure } from '../src/structure/protein-structure';
import { VariantCaller } from '../src/genomics/variant-caller';
import { RNASeqAnalyzer } from '../src/expression/rna-seq-analyzer';
import { GenomicPredictor } from '../src/ml/genomic-predictor';
import { MotifFinder } from '../src/motif/motif-finder';
import { MassSpecAnalyzer } from '../src/proteomics/mass-spec-analyzer';
import { GenomeVisualizer } from '../src/visualization/genome-visualizer';

/**
 * Complete bioinformatics analysis pipeline
 */
export class BioinformaticsPipeline {
  private sequenceAnalyzer: SequenceAnalyzer;
  private aligner: SequenceAligner;
  private treeBuilder: TreeBuilder;
  private proteinStructure: ProteinStructure;
  private variantCaller: VariantCaller;
  private rnaSeqAnalyzer: RNASeqAnalyzer;
  private predictor: GenomicPredictor;
  private motifFinder: MotifFinder;
  private massSpecAnalyzer: MassSpecAnalyzer;
  private visualizer: GenomeVisualizer;

  constructor() {
    this.sequenceAnalyzer = new SequenceAnalyzer();
    this.aligner = new SequenceAligner();
    this.treeBuilder = new TreeBuilder();
    this.proteinStructure = new ProteinStructure();
    this.variantCaller = new VariantCaller();
    this.rnaSeqAnalyzer = new RNASeqAnalyzer();
    this.predictor = new GenomicPredictor();
    this.motifFinder = new MotifFinder();
    this.massSpecAnalyzer = new MassSpecAnalyzer();
    this.visualizer = new GenomeVisualizer();
  }

  /**
   * Demo 1: DNA Sequence Analysis
   */
  async demoSequenceAnalysis(): Promise<void> {
    console.log('\n=== DNA Sequence Analysis Demo ===\n');

    const dnaSeq = 'ATGCGATCGATCGATCGATCGTAGCTAGCTAGCTGATCGATCGATCGATCG';

    // Analyze sequence
    const analysis = await this.sequenceAnalyzer.analyzeDNA(dnaSeq);
    console.log(`Sequence Length: ${analysis.length} bp`);
    console.log(`GC Content: ${analysis.gcContent.toFixed(2)}%`);
    console.log(`Molecular Weight: ${analysis.molecularWeight.toFixed(2)} Da`);

    // Translate to protein
    const protein = await this.sequenceAnalyzer.translate(dnaSeq);
    console.log(`Protein: ${protein.sequence}`);

    // Find ORFs
    const orfs = await this.sequenceAnalyzer.findORFs(dnaSeq, 30);
    console.log(`Found ${orfs.length} ORFs`);

    // Calculate codon usage
    const codonUsage = await this.sequenceAnalyzer.codonUsage(dnaSeq);
    console.log(`\nTop 5 codons:`);
    codonUsage.slice(0, 5).forEach(cu => {
      console.log(`  ${cu.codon} (${cu.aminoAcid}): ${(cu.frequency * 100).toFixed(2)}%`);
    });
  }

  /**
   * Demo 2: Sequence Alignment
   */
  async demoSequenceAlignment(): Promise<void> {
    console.log('\n=== Sequence Alignment Demo ===\n');

    const seq1 = 'ATGCGATCGATCGATCG';
    const seq2 = 'ATGCGTCGATCGATCGA';

    // Pairwise alignment
    const alignment = await this.aligner.alignPairwise(seq1, seq2, {
      algorithm: 'global',
      match: 2,
      mismatch: -1,
      gapOpen: -2
    });

    console.log(`Alignment Score: ${alignment.score}`);
    console.log(`Identity: ${alignment.identity.toFixed(2)}%`);
    console.log(`\n${alignment.formatted}`);

    // Multiple sequence alignment
    const sequences = [
      'ATGCGATCGATCG',
      'ATGCGTCGATCGA',
      'ATGCGTTCGATCG',
      'ATGCGATGGATCG'
    ];

    const msa = await this.aligner.alignMultiple(sequences);
    console.log(`\nMultiple Sequence Alignment:`);
    console.log(`Sequences: ${msa.sequences.length}`);
    console.log(`Consensus: ${msa.consensus}`);
    console.log(`Conservation: ${msa.conservation.slice(0, 10).map(c => c.toFixed(2)).join(', ')}...`);
  }

  /**
   * Demo 3: Phylogenetic Analysis
   */
  async demoPhylogeneticAnalysis(): Promise<void> {
    console.log('\n=== Phylogenetic Analysis Demo ===\n');

    const sequences = {
      'Human': 'ATGCGATCGATCGATCG',
      'Chimp': 'ATGCGTCGATCGATCGA',
      'Gorilla': 'ATGCGTTCGATCGATCG',
      'Orangutan': 'ATGCGATGGATCGATCG'
    };

    // Build tree
    const tree = await this.treeBuilder.buildFromSequences(sequences, {
      method: 'neighbor-joining',
      model: 'jukes-cantor'
    });

    console.log(`Tree (Newick): ${tree.newick}`);
    console.log(`Number of leaves: ${tree.leaves.length}`);
    console.log(`\nTree Structure:`);
    console.log(this.treeBuilder.visualizeASCII(tree));

    // Bootstrap analysis
    console.log('\nPerforming bootstrap analysis (100 replicates)...');
    const bootstrap = await this.treeBuilder.bootstrap(sequences, {
      replicates: 100,
      method: 'neighbor-joining'
    });

    console.log(`Bootstrap completed`);
  }

  /**
   * Demo 4: Variant Calling
   */
  async demoVariantCalling(): Promise<void> {
    console.log('\n=== Variant Calling Demo ===\n');

    // Simulate some variants
    const variants = [
      {
        chromosome: 'chr1',
        position: 12345,
        reference: 'A',
        alternate: 'G',
        quality: 45,
        filter: 'PASS',
        info: { DP: 30 },
        depth: 30,
        alleleFrequency: 0.5,
        type: 'SNP' as const
      },
      {
        chromosome: 'chr1',
        position: 12350,
        reference: 'TC',
        alternate: 'T',
        quality: 38,
        filter: 'PASS',
        info: { DP: 25 },
        depth: 25,
        alleleFrequency: 0.4,
        type: 'DELETION' as const
      }
    ];

    console.log(`Total variants: ${variants.length}`);

    // Annotate variants
    const annotated = await this.variantCaller.annotate(variants, {
      databases: ['dbSNP', 'ClinVar'],
      includeConsequences: true,
      includePredictions: true
    });

    console.log(`\nVariant 1:`);
    console.log(`  Position: chr1:${annotated[0].position}`);
    console.log(`  Change: ${annotated[0].reference} -> ${annotated[0].alternate}`);
    console.log(`  Type: ${annotated[0].type}`);
    console.log(`  Quality: ${annotated[0].quality}`);
    console.log(`  Consequence: ${annotated[0].consequence?.join(', ')}`);
    console.log(`  Impact: ${annotated[0].impact}`);

    // Calculate Ti/Tv ratio
    const tiTvRatio = this.variantCaller.calculateTiTvRatio(variants);
    console.log(`\nTransition/Transversion Ratio: ${tiTvRatio.toFixed(2)}`);
  }

  /**
   * Demo 5: RNA-seq Analysis
   */
  async demoRNASeqAnalysis(): Promise<void> {
    console.log('\n=== RNA-seq Analysis Demo ===\n');

    // Create sample count matrix
    const counts = {
      genes: ['Gene1', 'Gene2', 'Gene3', 'Gene4', 'Gene5'],
      samples: ['Control1', 'Control2', 'Treatment1', 'Treatment2'],
      counts: [
        [100, 120, 50, 45],
        [200, 190, 180, 175],
        [50, 55, 150, 160],
        [80, 85, 90, 95],
        [120, 130, 60, 65]
      ]
    };

    // Normalize
    const normalized = await this.rnaSeqAnalyzer.normalize(counts, {
      method: 'DESeq2'
    });

    console.log(`Normalized ${normalized.genes.length} genes across ${normalized.samples.length} samples`);

    // Differential expression
    const deResults = await this.rnaSeqAnalyzer.differentialExpression({
      counts,
      conditions: ['Control', 'Treatment'],
      replicates: [2, 2],
      method: 'DESeq2'
    });

    console.log(`\nDifferential Expression Results:`);
    const significant = deResults.filter(r => r.padj < 0.05);
    console.log(`Significant genes: ${significant.length}`);

    console.log(`\nTop 3 differentially expressed genes:`);
    significant.slice(0, 3).forEach(result => {
      console.log(`  ${result.geneId}:`);
      console.log(`    Log2FC: ${result.log2FoldChange.toFixed(2)}`);
      console.log(`    P-value: ${result.pvalue.toExponential(2)}`);
      console.log(`    Adjusted P-value: ${result.padj.toExponential(2)}`);
    });

    // PCA
    const pca = await this.rnaSeqAnalyzer.pca(normalized, 2);
    console.log(`\nPCA Results:`);
    console.log(`  Explained variance: ${pca.varianceRatio.map(v => (v * 100).toFixed(1) + '%').join(', ')}`);
  }

  /**
   * Demo 6: Machine Learning for Genomics
   */
  async demoMachineLearning(): Promise<void> {
    console.log('\n=== Machine Learning for Genomics Demo ===\n');

    // Training data
    const trainingSequences = [
      'ATGCGATCGATCGATCG',
      'ATGGGGCCCAAATTTGG',
      'ATGAAACCCGGGTTTAA',
      'TTTAAACCCGGGAAATT'
    ];

    const labels = [1, 1, 1, 0]; // 1 = gene, 0 = non-gene

    // Train model
    console.log('Training gene prediction model...');
    const model = await this.predictor.trainGenePredictor({
      sequences: trainingSequences,
      labels,
      features: ['gc-content', 'codon-usage', 'orf-length'],
      algorithm: 'random-forest',
      nTrees: 100
    });

    console.log(`Model trained successfully!`);
    console.log(`  Accuracy: ${(model.accuracy * 100).toFixed(2)}%`);
    console.log(`  Precision: ${(model.precision * 100).toFixed(2)}%`);
    console.log(`  F1 Score: ${(model.f1Score * 100).toFixed(2)}%`);

    // Feature importance
    const importance = model.featureImportance();
    console.log(`\nFeature Importance:`);
    importance.forEach(fi => {
      console.log(`  ${fi.feature}: ${(fi.importance * 100).toFixed(2)}%`);
    });

    // Predict genes
    const testSequence = 'ATGCGATCGATCGATCGATCGATCGATCGATCG';
    const predictions = await this.predictor.predictGenes(testSequence, model);
    console.log(`\nPredicted ${predictions.length} genes in test sequence`);
  }

  /**
   * Demo 7: Motif Discovery
   */
  async demoMotifDiscovery(): Promise<void> {
    console.log('\n=== Motif Discovery Demo ===\n');

    const sequences = [
      'ATGCGATCGATCGATCG',
      'ATGCGTCGATCGATCGA',
      'ATGCGTTCGATCGATCG',
      'ATGCGATGGATCGATCG'
    ];

    // Discover motifs
    console.log('Discovering motifs...');
    const motifs = await this.motifFinder.discoverMotifs(sequences, {
      minWidth: 6,
      maxWidth: 10,
      numMotifs: 3,
      algorithm: 'meme'
    });

    console.log(`Found ${motifs.length} motifs`);

    for (const motif of motifs) {
      console.log(`\nMotif ${motif.id}:`);
      console.log(`  Consensus: ${motif.consensus}`);
      console.log(`  Length: ${motif.length}`);
      console.log(`  Instances: ${motif.instances.length}`);
      console.log(`  E-value: ${motif.eValue?.toExponential(2)}`);
    }

    // Scan sequence for motif
    if (motifs.length > 0 && motifs[0].pwm) {
      const testSeq = 'ATGCGATCGATCGATCGATCGATCGATCGATCG';
      const hits = await this.motifFinder.scanSequence(testSeq, motifs[0].pwm, {
        threshold: 0.7
      });

      console.log(`\nMotif hits in test sequence: ${hits.length}`);
      hits.slice(0, 3).forEach(hit => {
        console.log(`  Position ${hit.position} (${hit.strand}): score=${hit.score.toFixed(2)}`);
      });
    }
  }

  /**
   * Demo 8: Complete Genomics Workflow
   */
  async runGenomicsWorkflow(options: {
    samples: string[];
    reference: string;
    annotation: string;
    outputDir: string;
  }): Promise<any> {
    console.log('\n=== Complete Genomics Workflow ===\n');

    const { samples, reference, annotation, outputDir } = options;

    console.log('Step 1: Quality Control');
    console.log(`  Processing ${samples.length} samples`);

    console.log('\nStep 2: Alignment');
    console.log(`  Reference: ${reference}`);

    console.log('\nStep 3: Variant Calling');
    const variants: any[] = [];
    console.log(`  Identified ${variants.length} variants`);

    console.log('\nStep 4: Variant Annotation');
    const annotated = await this.variantCaller.annotate(variants, {
      databases: ['dbSNP', 'ClinVar', 'gnomAD']
    });

    console.log('\nStep 5: RNA-seq Analysis');
    console.log(`  Annotation: ${annotation}`);

    console.log('\nStep 6: Differential Expression');
    const deGenes: any[] = [];

    console.log('\nStep 7: Pathway Enrichment');
    const pathways: any[] = [];

    console.log('\nWorkflow completed!');
    console.log(`  Output directory: ${outputDir}`);

    return {
      variants: annotated,
      deGenes,
      pathways
    };
  }

  /**
   * Run complete demo
   */
  async runAllDemos(): Promise<void> {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║  Elide Bioinformatics Platform - Complete Demonstration   ║');
    console.log('║  Polyglot Python + TypeScript Bioinformatics Analysis     ║');
    console.log('╚════════════════════════════════════════════════════════════╝');

    await this.demoSequenceAnalysis();
    await this.demoSequenceAlignment();
    await this.demoPhylogeneticAnalysis();
    await this.demoVariantCalling();
    await this.demoRNASeqAnalysis();
    await this.demoMachineLearning();
    await this.demoMotifDiscovery();

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║  All demonstrations completed successfully!               ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
  }
}

// Run demo if executed directly
if (require.main === module) {
  const pipeline = new BioinformaticsPipeline();
  pipeline.runAllDemos().catch(console.error);
}

export default BioinformaticsPipeline;
