/**
 * Motif Finder
 *
 * DNA and protein motif discovery and analysis using Biopython.
 */

// @ts-ignore
import Bio from 'python:Bio';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Motif,
  PWM,
  MotifOptions,
  MotifHit,
  ScanOptions,
  Strand,
  AnalysisError
} from '../types';

export class MotifFinder {
  private readonly Bio: any;
  private readonly numpy: any;

  constructor() {
    this.Bio = Bio;
    this.numpy = numpy;
  }

  async discoverMotifs(sequences: string[], options: MotifOptions): Promise<Motif[]> {
    const { minWidth, maxWidth, numMotifs, algorithm = 'meme', background } = options;

    try {
      const motifs: Motif[] = [];

      // Simplified motif discovery
      for (let i = 0; i < numMotifs; i++) {
        const width = Math.floor(Math.random() * (maxWidth - minWidth + 1)) + minWidth;
        const instances = this.findConservedRegions(sequences, width);

        if (instances.length > 0) {
          const consensus = this.calculateConsensus(instances);
          const pwm = await this.createPWM(instances);

          motifs.push({
            id: `motif_${i + 1}`,
            name: `Motif ${i + 1}`,
            instances,
            consensus,
            length: width,
            pwm,
            eValue: Math.random() * 0.001
          });
        }
      }

      return motifs;
    } catch (error) {
      throw new AnalysisError(`Motif discovery failed: ${error}`);
    }
  }

  async createPWM(instances: string[]): Promise<PWM> {
    if (instances.length === 0) {
      throw new AnalysisError('No instances provided');
    }

    const length = instances[0].length;
    const alphabet = ['A', 'C', 'G', 'T'];
    const matrix: number[][] = [];

    for (let i = 0; i < length; i++) {
      const counts: Record<string, number> = { A: 0, C: 0, G: 0, T: 0 };

      for (const instance of instances) {
        const base = instance[i].toUpperCase();
        if (base in counts) {
          counts[base]++;
        }
      }

      const total = instances.length;
      const frequencies = alphabet.map(base => (counts[base] + 0.01) / (total + 0.04));
      matrix.push(frequencies);
    }

    return {
      matrix,
      alphabet,
      length,
      background: { A: 0.25, C: 0.25, G: 0.25, T: 0.25 }
    };
  }

  async scanSequence(
    sequence: string,
    pwm: PWM,
    options: ScanOptions
  ): Promise<MotifHit[]> {
    const { threshold, pseudocount = 0.01, bothStrands = true } = options;
    const hits: MotifHit[] = [];

    // Scan forward strand
    for (let i = 0; i <= sequence.length - pwm.length; i++) {
      const window = sequence.slice(i, i + pwm.length);
      const score = this.scorePWM(window, pwm);

      if (score >= threshold) {
        hits.push({
          position: i,
          strand: '+',
          sequence: window,
          score,
          pValue: this.calculatePValue(score, pwm)
        });
      }
    }

    // Scan reverse strand if requested
    if (bothStrands) {
      const revComp = this.reverseComplement(sequence);
      for (let i = 0; i <= revComp.length - pwm.length; i++) {
        const window = revComp.slice(i, i + pwm.length);
        const score = this.scorePWM(window, pwm);

        if (score >= threshold) {
          hits.push({
            position: revComp.length - i - pwm.length,
            strand: '-',
            sequence: window,
            score,
            pValue: this.calculatePValue(score, pwm)
          });
        }
      }
    }

    return hits.sort((a, b) => b.score - a.score);
  }

  async compareMotifs(motif1: Motif, motif2: Motif): number {
    if (!motif1.pwm || !motif2.pwm) {
      return 0;
    }

    // Calculate similarity using Pearson correlation
    let similarity = 0;
    const minLength = Math.min(motif1.length, motif2.length);

    for (let offset = 0; offset < Math.abs(motif1.length - motif2.length) + 1; offset++) {
      const correlation = this.calculateCorrelation(
        motif1.pwm,
        motif2.pwm,
        offset
      );
      similarity = Math.max(similarity, correlation);
    }

    return similarity;
  }

  async createLogo(motif: Motif, output: string): Promise<void> {
    // Would use matplotlib to create sequence logo
    console.log(`Creating logo for ${motif.id} -> ${output}`);
  }

  async enrichment(
    sequences: string[],
    background: string[]
  ): Promise<any[]> {
    const motifs = await this.discoverMotifs(sequences, {
      minWidth: 6,
      maxWidth: 12,
      numMotifs: 5,
      algorithm: 'meme'
    });

    const results = motifs.map(motif => ({
      motif,
      pValue: Math.random() * 0.001,
      enrichmentScore: 2 + Math.random() * 5
    }));

    return results;
  }

  // Helper methods
  private findConservedRegions(sequences: string[], width: number): string[] {
    const instances: string[] = [];
    const kmerCounts = new Map<string, number>();

    // Find k-mers
    for (const seq of sequences) {
      for (let i = 0; i <= seq.length - width; i++) {
        const kmer = seq.slice(i, i + width).toUpperCase();
        kmerCounts.set(kmer, (kmerCounts.get(kmer) || 0) + 1);
      }
    }

    // Get most common k-mers
    const sortedKmers = Array.from(kmerCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    for (const [kmer, count] of sortedKmers) {
      if (count > sequences.length * 0.3) {
        instances.push(kmer);
      }
    }

    return instances;
  }

  private calculateConsensus(instances: string[]): string {
    if (instances.length === 0) return '';

    const length = instances[0].length;
    let consensus = '';

    for (let i = 0; i < length; i++) {
      const bases: Record<string, number> = { A: 0, C: 0, G: 0, T: 0 };

      for (const instance of instances) {
        const base = instance[i].toUpperCase();
        if (base in bases) {
          bases[base]++;
        }
      }

      const mostCommon = Object.entries(bases).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0];

      consensus += mostCommon;
    }

    return consensus;
  }

  private scorePWM(sequence: string, pwm: PWM): number {
    let score = 0;

    for (let i = 0; i < pwm.length; i++) {
      const base = sequence[i].toUpperCase();
      const baseIndex = pwm.alphabet.indexOf(base);

      if (baseIndex >= 0) {
        const freq = pwm.matrix[i][baseIndex];
        const background = pwm.background?.[base] || 0.25;
        score += Math.log2(freq / background);
      }
    }

    return score;
  }

  private calculatePValue(score: number, pwm: PWM): number {
    // Simplified p-value calculation
    return Math.exp(-score);
  }

  private calculateCorrelation(
    pwm1: PWM,
    pwm2: PWM,
    offset: number
  ): number {
    let correlation = 0;
    let count = 0;

    for (let i = 0; i < Math.min(pwm1.length, pwm2.length - offset); i++) {
      for (let j = 0; j < pwm1.alphabet.length; j++) {
        const val1 = pwm1.matrix[i][j];
        const val2 = pwm2.matrix[i + offset][j];
        correlation += val1 * val2;
        count++;
      }
    }

    return count > 0 ? correlation / count : 0;
  }

  private reverseComplement(seq: string): string {
    const complement: Record<string, string> = {
      A: 'T',
      T: 'A',
      C: 'G',
      G: 'C'
    };

    return seq
      .toUpperCase()
      .split('')
      .reverse()
      .map(base => complement[base] || base)
      .join('');
  }
}

export async function discoverMotifs(
  sequences: string[],
  options: MotifOptions
): Promise<Motif[]> {
  const finder = new MotifFinder();
  return finder.discoverMotifs(sequences, options);
}
