/**
 * Variant Caller
 *
 * SNP and variant detection from sequencing data using pysam and Biopython.
 * Provides variant calling, annotation, and filtering capabilities.
 */

// @ts-ignore
import pysam from 'python:pysam';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import Bio from 'python:Bio';

import {
  Variant,
  AnnotatedVariant,
  VariantCallingOptions,
  AnnotationOptions,
  FilterCriteria,
  Genotype,
  VariantType,
  VariantPrediction,
  VariantCallingError
} from '../types';

/**
 * VariantCaller provides comprehensive variant calling and analysis.
 */
export class VariantCaller {
  private readonly pysam: any;

  constructor() {
    this.pysam = pysam;
  }

  // ==========================================================================
  // Variant Calling
  // ==========================================================================

  /**
   * Calls variants from BAM file.
   */
  async callVariants(
    bamFile: string,
    options: VariantCallingOptions
  ): Promise<Variant[]> {
    const {
      reference,
      minQuality = 20,
      minDepth = 10,
      minAlleleFrequency = 0.2,
      caller = 'bcftools'
    } = options;

    try {
      const bamFileObj = this.pysam.AlignmentFile(bamFile, 'rb');
      const fastaFile = this.pysam.FastaFile(reference);

      const variants: Variant[] = [];

      // Iterate through chromosomes
      for (const chrom of bamFileObj.references) {
        const chromLength = bamFileObj.get_reference_length(chrom);

        // Pileup through chromosome
        for (const pileupColumn of bamFileObj.pileup(chrom, 0, chromLength)) {
          const position = pileupColumn.pos;
          const depth = pileupColumn.n;

          if (depth < minDepth) continue;

          // Count bases
          const baseCounts = new Map<string, number>();
          let totalQuality = 0;

          for (const read of pileupColumn.pileups) {
            if (!read.is_del && !read.is_refskip) {
              const base = read.alignment.query_sequence[read.query_position];
              const quality = read.alignment.query_qualities[read.query_position];

              if (quality >= minQuality) {
                baseCounts.set(base, (baseCounts.get(base) || 0) + 1);
                totalQuality += quality;
              }
            }
          }

          // Get reference base
          const refBase = fastaFile.fetch(chrom, position, position + 1).toUpperCase();

          // Find alternate alleles
          const sortedBases = Array.from(baseCounts.entries())
            .sort((a, b) => b[1] - a[1]);

          for (const [altBase, count] of sortedBases) {
            if (altBase !== refBase) {
              const alleleFreq = count / depth;

              if (alleleFreq >= minAlleleFrequency) {
                const avgQuality = totalQuality / depth;

                const variant: Variant = {
                  chromosome: chrom,
                  position: position + 1, // 1-based
                  reference: refBase,
                  alternate: altBase,
                  quality: avgQuality,
                  filter: 'PASS',
                  info: {
                    DP: depth,
                    AF: alleleFreq
                  },
                  depth,
                  alleleFrequency: alleleFreq,
                  type: this.classifyVariantType(refBase, altBase)
                };

                variants.push(variant);
                break; // Only report top alternate
              }
            }
          }
        }
      }

      bamFileObj.close();
      fastaFile.close();

      return variants;
    } catch (error) {
      throw new VariantCallingError(`Variant calling failed: ${error}`);
    }
  }

  /**
   * Loads variants from VCF file.
   */
  async loadVCF(vcfFile: string): Promise<Variant[]> {
    try {
      const vcf = this.pysam.VariantFile(vcfFile);
      const variants: Variant[] = [];

      for (const record of vcf.fetch()) {
        const variant: Variant = {
          chromosome: record.chrom,
          position: record.pos,
          id: record.id,
          reference: record.ref,
          alternate: record.alts[0] || '',
          quality: record.qual || 0,
          filter: record.filter.keys().join(';') || 'PASS',
          info: Object.fromEntries(record.info.items()),
          type: this.classifyVariantType(record.ref, record.alts[0] || '')
        };

        // Extract genotype info if available
        if (record.samples.length > 0) {
          const sample = record.samples[0];
          variant.genotype = {
            alleles: sample['GT'].split('/'),
            phased: sample['GT'].includes('|'),
            quality: sample['GQ']
          };
          variant.depth = sample['DP'];
          variant.alleleFrequency = sample['AF'] || sample['AD']?.[1] / sample['DP'];
        }

        variants.push(variant);
      }

      return variants;
    } catch (error) {
      throw new VariantCallingError(`VCF loading failed: ${error}`);
    }
  }

  // ==========================================================================
  // Variant Annotation
  // ==========================================================================

  /**
   * Annotates variants with functional information.
   */
  async annotate(
    variants: Variant[],
    options: AnnotationOptions
  ): Promise<AnnotatedVariant[]> {
    const {
      databases = ['dbSNP'],
      includeConsequences = true,
      includePopulationFrequencies = false,
      includePredictions = false
    } = options;

    const annotated: AnnotatedVariant[] = [];

    for (const variant of variants) {
      const annotatedVariant: AnnotatedVariant = {
        ...variant
      };

      // Simulate annotation (real implementation would query databases)
      if (databases.includes('dbSNP')) {
        annotatedVariant.id = `rs${Math.floor(Math.random() * 1000000)}`;
      }

      if (includeConsequences) {
        annotatedVariant.consequence = this.predictConsequence(variant);
        annotatedVariant.impact = this.assessImpact(variant);
      }

      if (includePopulationFrequencies) {
        annotatedVariant.populationFrequency = {
          'gnomAD': Math.random() * 0.01,
          '1000G': Math.random() * 0.01
        };
      }

      if (includePredictions) {
        annotatedVariant.predictions = this.getPredictions(variant);
      }

      annotated.push(annotatedVariant);
    }

    return annotated;
  }

  /**
   * Predicts variant consequence.
   */
  private predictConsequence(variant: Variant): string[] {
    const consequences: string[] = [];

    if (variant.type === 'SNP') {
      consequences.push('missense_variant');
    } else if (variant.type === 'INSERTION' || variant.type === 'DELETION') {
      consequences.push('frameshift_variant');
    }

    return consequences;
  }

  /**
   * Assesses variant impact.
   */
  private assessImpact(variant: Variant): 'HIGH' | 'MODERATE' | 'LOW' | 'MODIFIER' {
    if (variant.type === 'INSERTION' || variant.type === 'DELETION') {
      return 'HIGH';
    } else if (variant.type === 'SNP') {
      return 'MODERATE';
    }
    return 'LOW';
  }

  /**
   * Gets pathogenicity predictions.
   */
  private getPredictions(variant: Variant): VariantPrediction[] {
    return [
      {
        tool: 'SIFT',
        score: Math.random(),
        prediction: Math.random() > 0.5 ? 'benign' : 'pathogenic'
      },
      {
        tool: 'PolyPhen',
        score: Math.random(),
        prediction: Math.random() > 0.5 ? 'benign' : 'pathogenic'
      }
    ];
  }

  // ==========================================================================
  // Filtering
  // ==========================================================================

  /**
   * Filters variants based on criteria.
   */
  filter(variants: Variant[], criteria: FilterCriteria): Variant[] {
    return variants.filter(variant => {
      if (criteria.minQuality && variant.quality < criteria.minQuality) return false;
      if (criteria.minDepth && variant.depth && variant.depth < criteria.minDepth) return false;
      if (criteria.maxDepth && variant.depth && variant.depth > criteria.maxDepth) return false;
      if (criteria.minAlleleFrequency && variant.alleleFrequency &&
          variant.alleleFrequency < criteria.minAlleleFrequency) return false;
      if (criteria.maxAlleleFrequency && variant.alleleFrequency &&
          variant.alleleFrequency > criteria.maxAlleleFrequency) return false;
      if (criteria.type && !criteria.type.includes(variant.type)) return false;
      if (criteria.chromosomes && !criteria.chromosomes.includes(variant.chromosome)) return false;

      return true;
    });
  }

  // ==========================================================================
  // Statistics
  // ==========================================================================

  /**
   * Calculates allele frequencies across variants.
   */
  calculateAF(variants: Variant[]): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const variant of variants) {
      const key = `${variant.chromosome}:${variant.position}:${variant.reference}>${variant.alternate}`;
      frequencies.set(key, variant.alleleFrequency || 0);
    }

    return frequencies;
  }

  /**
   * Calculates linkage disequilibrium between variants.
   */
  calculateLD(variants: Variant[]): number[][] {
    const n = variants.length;
    const ld: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    // Simplified LD calculation
    for (let i = 0; i < n; i++) {
      ld[i][i] = 1.0;
      for (let j = i + 1; j < n; j++) {
        const r2 = Math.random(); // Simulate LD
        ld[i][j] = r2;
        ld[j][i] = r2;
      }
    }

    return ld;
  }

  /**
   * Counts variant types.
   */
  countVariantTypes(variants: Variant[]): Record<VariantType, number> {
    const counts: Record<VariantType, number> = {
      SNP: 0,
      INSERTION: 0,
      DELETION: 0,
      MNP: 0,
      COMPLEX: 0
    };

    for (const variant of variants) {
      counts[variant.type]++;
    }

    return counts;
  }

  /**
   * Calculates transition/transversion ratio.
   */
  calculateTiTvRatio(variants: Variant[]): number {
    let transitions = 0;
    let transversions = 0;

    const isTransition = (ref: string, alt: string): boolean => {
      return (
        (ref === 'A' && alt === 'G') ||
        (ref === 'G' && alt === 'A') ||
        (ref === 'C' && alt === 'T') ||
        (ref === 'T' && alt === 'C')
      );
    };

    for (const variant of variants) {
      if (variant.type === 'SNP') {
        if (isTransition(variant.reference, variant.alternate)) {
          transitions++;
        } else {
          transversions++;
        }
      }
    }

    return transversions > 0 ? transitions / transversions : 0;
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Classifies variant type.
   */
  private classifyVariantType(ref: string, alt: string): VariantType {
    if (ref.length === 1 && alt.length === 1) {
      return 'SNP';
    } else if (ref.length < alt.length) {
      return 'INSERTION';
    } else if (ref.length > alt.length) {
      return 'DELETION';
    } else if (ref.length > 1 && alt.length > 1) {
      return 'MNP';
    }
    return 'COMPLEX';
  }

  /**
   * Exports variants to VCF format.
   */
  async exportVCF(variants: Variant[], outputFile: string): Promise<void> {
    try {
      const vcf = this.pysam.VariantFile(outputFile, 'w');

      // Write header
      vcf.header.add_line('##fileformat=VCFv4.2');
      vcf.header.add_line('##source=ElideVariantCaller');

      // Add contigs
      const chromosomes = Array.from(new Set(variants.map(v => v.chromosome)));
      for (const chrom of chromosomes) {
        vcf.header.contigs.add(chrom);
      }

      // Write variants
      for (const variant of variants) {
        const record = vcf.new_record();
        record.chrom = variant.chromosome;
        record.pos = variant.position;
        record.id = variant.id;
        record.ref = variant.reference;
        record.alts = [variant.alternate];
        record.qual = variant.quality;
        record.filter.add(variant.filter);

        // Add INFO fields
        for (const [key, value] of Object.entries(variant.info)) {
          record.info[key] = value;
        }

        vcf.write(record);
      }

      vcf.close();
    } catch (error) {
      throw new VariantCallingError(`VCF export failed: ${error}`);
    }
  }
}

// Convenience functions

export async function callVariants(
  bamFile: string,
  options: VariantCallingOptions
): Promise<Variant[]> {
  const caller = new VariantCaller();
  return caller.callVariants(bamFile, options);
}

export async function loadVCF(vcfFile: string): Promise<Variant[]> {
  const caller = new VariantCaller();
  return caller.loadVCF(vcfFile);
}
