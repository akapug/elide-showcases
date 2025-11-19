/**
 * Sequence Aligner
 *
 * Pairwise and multiple sequence alignment using Biopython.
 * Supports various alignment algorithms including global, local,
 * and multiple sequence alignment.
 */

// @ts-ignore
import Bio from 'python:Bio';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Alignment,
  PairwiseAlignment,
  MultipleAlignment,
  AlignmentOptions,
  MSAOptions,
  BlastOptions,
  BlastResult,
  BlastHit,
  AlignedSequence,
  AlignmentError
} from '../types';

/**
 * SequenceAligner provides comprehensive sequence alignment capabilities.
 */
export class SequenceAligner {
  private readonly Align: any;
  private readonly pairwise2: any;
  private readonly AlignIO: any;
  private readonly Blast: any;

  constructor() {
    this.Align = Bio.Align;
    this.pairwise2 = Bio.pairwise2;
    this.AlignIO = Bio.AlignIO;
    try {
      this.Blast = Bio.Blast;
    } catch {
      // BLAST might not be available
      this.Blast = null;
    }
  }

  // ==========================================================================
  // Pairwise Alignment
  // ==========================================================================

  /**
   * Performs pairwise sequence alignment.
   */
  async alignPairwise(
    seq1: string,
    seq2: string,
    options: AlignmentOptions = {}
  ): Promise<PairwiseAlignment> {
    try {
      const {
        algorithm = 'global',
        match = 2,
        mismatch = -1,
        gapOpen = -2,
        gapExtend = -0.5,
        matrix
      } = options;

      let alignments;

      if (matrix) {
        // Use substitution matrix (e.g., BLOSUM62)
        const substitutionMatrix = this.getSubstitutionMatrix(matrix);
        alignments = this.pairwise2.align.globalds(
          seq1,
          seq2,
          substitutionMatrix,
          gapOpen,
          gapExtend
        );
      } else {
        // Use match/mismatch scores
        if (algorithm === 'global') {
          alignments = this.pairwise2.align.globalms(
            seq1,
            seq2,
            match,
            mismatch,
            gapOpen,
            gapExtend
          );
        } else {
          // Local alignment
          alignments = this.pairwise2.align.localms(
            seq1,
            seq2,
            match,
            mismatch,
            gapOpen,
            gapExtend
          );
        }
      }

      // Get best alignment
      const bestAlignment = alignments[0];
      const [alignedSeq1, alignedSeq2, score, begin, end] = bestAlignment;

      // Calculate statistics
      const stats = this.calculateAlignmentStats(
        str(alignedSeq1),
        str(alignedSeq2)
      );

      // Format alignment
      const formatted = this.formatPairwiseAlignment(
        str(alignedSeq1),
        str(alignedSeq2)
      );

      return {
        sequences: [
          {
            id: 'seq1',
            sequence: str(alignedSeq1),
            start: begin,
            end: end
          },
          {
            id: 'seq2',
            sequence: str(alignedSeq2),
            start: begin,
            end: end
          }
        ],
        score,
        identity: stats.identity,
        similarity: stats.similarity,
        gaps: stats.gaps,
        length: str(alignedSeq1).length,
        matches: stats.matches,
        mismatches: stats.mismatches,
        gapOpens: stats.gapOpens,
        gapExtensions: stats.gapExtensions,
        formatted
      };
    } catch (error) {
      throw new AlignmentError(`Pairwise alignment failed: ${error}`);
    }
  }

  /**
   * Performs global alignment using Needleman-Wunsch algorithm.
   */
  async alignGlobal(
    seq1: string,
    seq2: string,
    options: AlignmentOptions = {}
  ): Promise<PairwiseAlignment> {
    return this.alignPairwise(seq1, seq2, { ...options, algorithm: 'global' });
  }

  /**
   * Performs local alignment using Smith-Waterman algorithm.
   */
  async alignLocal(
    seq1: string,
    seq2: string,
    options: AlignmentOptions = {}
  ): Promise<PairwiseAlignment> {
    return this.alignPairwise(seq1, seq2, { ...options, algorithm: 'local' });
  }

  // ==========================================================================
  // Multiple Sequence Alignment
  // ==========================================================================

  /**
   * Performs multiple sequence alignment.
   */
  async alignMultiple(
    sequences: string[],
    options: MSAOptions = {}
  ): Promise<MultipleAlignment> {
    try {
      const { algorithm = 'muscle', gapPenalty = -2, iterations = 16 } = options;

      // Create temporary FASTA file
      const fastaContent = sequences
        .map((seq, i) => `>seq${i}\n${seq}`)
        .join('\n');

      let alignedSeqs: string[];

      if (algorithm === 'muscle') {
        alignedSeqs = await this.runMuscle(fastaContent, iterations);
      } else if (algorithm === 'clustalw') {
        alignedSeqs = await this.runClustalW(fastaContent);
      } else {
        alignedSeqs = await this.runMafft(fastaContent);
      }

      // Calculate consensus
      const consensus = this.calculateConsensus(alignedSeqs);

      // Calculate conservation
      const conservation = this.calculateConservation(alignedSeqs);

      // Calculate statistics
      const stats = this.calculateMSAStats(alignedSeqs);

      const alignedSequences: AlignedSequence[] = alignedSeqs.map((seq, i) => ({
        id: `seq${i}`,
        sequence: seq,
        start: 0,
        end: seq.replace(/-/g, '').length
      }));

      return {
        sequences: alignedSequences,
        consensus,
        conservation,
        columns: alignedSeqs[0].length,
        identicalSites: stats.identicalSites,
        conservedSites: stats.conservedSites,
        variableSites: stats.variableSites
      };
    } catch (error) {
      throw new AlignmentError(`Multiple sequence alignment failed: ${error}`);
    }
  }

  /**
   * Runs MUSCLE alignment.
   */
  private async runMuscle(fastaContent: string, iterations: number): Promise<string[]> {
    // In a real implementation, this would call MUSCLE
    // For this showcase, we'll simulate the output
    const ClustalW = Bio.AlignIO.ClustalIO;
    // Simulate alignment
    return this.simulateMSA(fastaContent);
  }

  /**
   * Runs ClustalW alignment.
   */
  private async runClustalW(fastaContent: string): Promise<string[]> {
    // Simulate alignment
    return this.simulateMSA(fastaContent);
  }

  /**
   * Runs MAFFT alignment.
   */
  private async runMafft(fastaContent: string): Promise<string[]> {
    // Simulate alignment
    return this.simulateMSA(fastaContent);
  }

  /**
   * Simulates MSA for demonstration.
   */
  private simulateMSA(fastaContent: string): string[] {
    const sequences = fastaContent
      .split('>')
      .filter(s => s.trim())
      .map(s => s.split('\n').slice(1).join(''));

    // Simple simulation: just add gaps to make sequences equal length
    const maxLength = Math.max(...sequences.map(s => s.length));
    return sequences.map(seq => seq.padEnd(maxLength, '-'));
  }

  // ==========================================================================
  // BLAST Search
  // ==========================================================================

  /**
   * Performs BLAST search.
   */
  async blast(
    query: string,
    options: BlastOptions
  ): Promise<BlastResult[]> {
    if (!this.Blast) {
      throw new AlignmentError('BLAST not available');
    }

    try {
      const {
        database,
        program = 'blastn',
        eValue = 0.001,
        maxHits = 100,
        wordSize = 11
      } = options;

      // Run BLAST
      const blastResults = this.Blast.qblast(
        program,
        database,
        query,
        expect: eValue,
        hitlist_size: maxHits,
        word_size: wordSize
      );

      const results: BlastResult[] = [];

      // Parse results
      for (const record of blastResults) {
        const hits: BlastHit[] = [];

        for (const alignment of record.alignments) {
          for (const hsp of alignment.hsps) {
            hits.push({
              hitId: alignment.hit_id,
              hitDescription: alignment.hit_def,
              eValue: hsp.expect,
              bitScore: hsp.bits,
              identity: (hsp.identities / hsp.align_length) * 100,
              positives: (hsp.positives / hsp.align_length) * 100,
              gaps: hsp.gaps,
              queryStart: hsp.query_start,
              queryEnd: hsp.query_end,
              hitStart: hsp.sbjct_start,
              hitEnd: hsp.sbjct_end,
              alignment: {
                sequences: [
                  {
                    id: 'query',
                    sequence: str(hsp.query),
                    start: hsp.query_start,
                    end: hsp.query_end
                  },
                  {
                    id: 'hit',
                    sequence: str(hsp.sbjct),
                    start: hsp.sbjct_start,
                    end: hsp.sbjct_end
                  }
                ],
                score: hsp.score,
                identity: (hsp.identities / hsp.align_length) * 100,
                similarity: (hsp.positives / hsp.align_length) * 100,
                gaps: hsp.gaps,
                length: hsp.align_length,
                formatted: this.formatPairwiseAlignment(
                  str(hsp.query),
                  str(hsp.sbjct)
                )
              }
            });
          }
        }

        results.push({
          queryId: record.query,
          hits
        });
      }

      return results;
    } catch (error) {
      throw new AlignmentError(`BLAST search failed: ${error}`);
    }
  }

  // ==========================================================================
  // Alignment Statistics
  // ==========================================================================

  /**
   * Calculates alignment statistics.
   */
  private calculateAlignmentStats(
    seq1: string,
    seq2: string
  ): {
    matches: number;
    mismatches: number;
    gaps: number;
    identity: number;
    similarity: number;
    gapOpens: number;
    gapExtensions: number;
  } {
    let matches = 0;
    let mismatches = 0;
    let gaps = 0;
    let gapOpens = 0;
    let inGap = false;

    for (let i = 0; i < seq1.length; i++) {
      const c1 = seq1[i];
      const c2 = seq2[i];

      if (c1 === '-' || c2 === '-') {
        gaps++;
        if (!inGap) {
          gapOpens++;
          inGap = true;
        }
      } else {
        inGap = false;
        if (c1 === c2) {
          matches++;
        } else {
          mismatches++;
        }
      }
    }

    const totalPositions = seq1.length - gaps;
    const identity = totalPositions > 0 ? (matches / totalPositions) * 100 : 0;
    const similarity = identity; // Simplified; would use similarity matrix for proteins

    return {
      matches,
      mismatches,
      gaps,
      identity,
      similarity,
      gapOpens,
      gapExtensions: gaps - gapOpens
    };
  }

  /**
   * Calculates MSA statistics.
   */
  private calculateMSAStats(
    sequences: string[]
  ): {
    identicalSites: number;
    conservedSites: number;
    variableSites: number;
  } {
    if (sequences.length === 0) {
      return { identicalSites: 0, conservedSites: 0, variableSites: 0 };
    }

    const length = sequences[0].length;
    let identicalSites = 0;
    let conservedSites = 0;
    let variableSites = 0;

    for (let i = 0; i < length; i++) {
      const column = sequences.map(seq => seq[i]);
      const uniqueChars = new Set(column.filter(c => c !== '-'));

      if (uniqueChars.size === 1) {
        identicalSites++;
        conservedSites++;
      } else if (uniqueChars.size <= 3) {
        conservedSites++;
      } else {
        variableSites++;
      }
    }

    return { identicalSites, conservedSites, variableSites };
  }

  /**
   * Calculates identity percentage between two sequences.
   */
  calculateIdentity(alignment: Alignment): number {
    const [seq1, seq2] = alignment.sequences;
    const stats = this.calculateAlignmentStats(seq1.sequence, seq2.sequence);
    return stats.identity;
  }

  /**
   * Calculates conservation for each position in MSA.
   */
  calculateConservation(sequences: string[]): number[] {
    if (sequences.length === 0) return [];

    const length = sequences[0].length;
    const conservation: number[] = [];

    for (let i = 0; i < length; i++) {
      const column = sequences.map(seq => seq[i]);
      const nonGap = column.filter(c => c !== '-');

      if (nonGap.length === 0) {
        conservation.push(0);
        continue;
      }

      // Calculate entropy-based conservation
      const freq: Record<string, number> = {};
      for (const char of nonGap) {
        freq[char] = (freq[char] || 0) + 1;
      }

      let entropy = 0;
      for (const count of Object.values(freq)) {
        const p = count / nonGap.length;
        entropy -= p * Math.log2(p);
      }

      // Convert entropy to conservation score (0-1)
      const maxEntropy = Math.log2(20); // 20 amino acids
      const conservationScore = 1 - entropy / maxEntropy;
      conservation.push(Math.max(0, conservationScore));
    }

    return conservation;
  }

  /**
   * Calculates consensus sequence from MSA.
   */
  calculateConsensus(sequences: string[]): string {
    if (sequences.length === 0) return '';

    const length = sequences[0].length;
    let consensus = '';

    for (let i = 0; i < length; i++) {
      const column = sequences.map(seq => seq[i]);
      const nonGap = column.filter(c => c !== '-');

      if (nonGap.length === 0) {
        consensus += '-';
        continue;
      }

      // Find most common character
      const freq: Record<string, number> = {};
      for (const char of nonGap) {
        freq[char] = (freq[char] || 0) + 1;
      }

      const mostCommon = Object.entries(freq).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0];

      consensus += mostCommon;
    }

    return consensus;
  }

  // ==========================================================================
  // Formatting
  // ==========================================================================

  /**
   * Formats pairwise alignment for display.
   */
  formatPairwiseAlignment(seq1: string, seq2: string, width: number = 60): string {
    let formatted = '';
    const numBlocks = Math.ceil(seq1.length / width);

    for (let block = 0; block < numBlocks; block++) {
      const start = block * width;
      const end = Math.min(start + width, seq1.length);

      const s1 = seq1.slice(start, end);
      const s2 = seq2.slice(start, end);

      // Create match string
      let match = '';
      for (let i = 0; i < s1.length; i++) {
        if (s1[i] === s2[i]) {
          match += '|';
        } else if (s1[i] === '-' || s2[i] === '-') {
          match += ' ';
        } else {
          match += '.';
        }
      }

      formatted += `Seq1  ${start.toString().padStart(5)}  ${s1}\n`;
      formatted += `                 ${match}\n`;
      formatted += `Seq2  ${start.toString().padStart(5)}  ${s2}\n\n`;
    }

    return formatted;
  }

  /**
   * Formats multiple sequence alignment for display.
   */
  formatMultipleAlignment(alignment: MultipleAlignment, width: number = 60): string {
    let formatted = '';
    const numBlocks = Math.ceil(alignment.columns / width);

    for (let block = 0; block < numBlocks; block++) {
      const start = block * width;
      const end = Math.min(start + width, alignment.columns);

      for (const seq of alignment.sequences) {
        const segment = seq.sequence.slice(start, end);
        formatted += `${seq.id.padEnd(10)}  ${start.toString().padStart(5)}  ${segment}\n`;
      }

      // Add consensus
      const consensusSegment = alignment.consensus.slice(start, end);
      formatted += `${'Consensus'.padEnd(10)}  ${start.toString().padStart(5)}  ${consensusSegment}\n\n`;
    }

    return formatted;
  }

  // ==========================================================================
  // Substitution Matrices
  // ==========================================================================

  /**
   * Gets a substitution matrix.
   */
  private getSubstitutionMatrix(name: string): any {
    try {
      const MatrixInfo = Bio.Align.substitution_matrices;
      return MatrixInfo.load(name);
    } catch {
      // Fallback to simple scoring
      return null;
    }
  }

  // ==========================================================================
  // Profile Alignment
  // ==========================================================================

  /**
   * Aligns a sequence to a profile (MSA).
   */
  async alignToProfile(
    sequence: string,
    profile: MultipleAlignment
  ): Promise<MultipleAlignment> {
    try {
      // Build position-specific scoring matrix from profile
      const pssm = this.buildPSSM(profile);

      // Align sequence to PSSM
      const alignment = await this.alignSequenceToPSSM(sequence, pssm);

      // Add to profile
      const newSequences = [...profile.sequences, alignment];
      const newConsensus = this.calculateConsensus(
        newSequences.map(s => s.sequence)
      );
      const newConservation = this.calculateConservation(
        newSequences.map(s => s.sequence)
      );
      const newStats = this.calculateMSAStats(newSequences.map(s => s.sequence));

      return {
        sequences: newSequences,
        consensus: newConsensus,
        conservation: newConservation,
        columns: profile.columns,
        identicalSites: newStats.identicalSites,
        conservedSites: newStats.conservedSites,
        variableSites: newStats.variableSites
      };
    } catch (error) {
      throw new AlignmentError(`Profile alignment failed: ${error}`);
    }
  }

  /**
   * Builds Position-Specific Scoring Matrix from MSA.
   */
  private buildPSSM(alignment: MultipleAlignment): number[][] {
    const pssm: number[][] = [];
    const alphabet = 'ACDEFGHIKLMNPQRSTVWY-';

    for (let i = 0; i < alignment.columns; i++) {
      const column = alignment.sequences.map(seq => seq.sequence[i]);
      const scores: number[] = [];

      for (const char of alphabet) {
        const count = column.filter(c => c === char).length;
        const freq = count / column.length;
        const score = Math.log2((freq + 0.01) / 0.05); // Pseudocount
        scores.push(score);
      }

      pssm.push(scores);
    }

    return pssm;
  }

  /**
   * Aligns a sequence to a PSSM.
   */
  private async alignSequenceToPSSM(
    sequence: string,
    pssm: number[][]
  ): Promise<AlignedSequence> {
    // Simple scoring approach
    // In production, would use dynamic programming
    const aligned = sequence.padEnd(pssm.length, '-');

    return {
      id: 'new_seq',
      sequence: aligned,
      start: 0,
      end: sequence.length
    };
  }

  // ==========================================================================
  // Alignment Quality Assessment
  // ==========================================================================

  /**
   * Calculates alignment quality score.
   */
  calculateQualityScore(alignment: Alignment): number {
    const identity = alignment.identity;
    const gapPenalty = (alignment.gaps / alignment.length) * 100;
    return identity - gapPenalty;
  }

  /**
   * Detects poorly aligned regions.
   */
  detectPoorlyAlignedRegions(
    alignment: MultipleAlignment,
    windowSize: number = 20,
    threshold: number = 0.3
  ): Array<{ start: number; end: number; conservation: number }> {
    const poorRegions: Array<{ start: number; end: number; conservation: number }> = [];

    for (let i = 0; i <= alignment.conservation.length - windowSize; i++) {
      const window = alignment.conservation.slice(i, i + windowSize);
      const avgConservation = window.reduce((a, b) => a + b, 0) / window.length;

      if (avgConservation < threshold) {
        poorRegions.push({
          start: i,
          end: i + windowSize,
          conservation: avgConservation
        });
      }
    }

    return poorRegions;
  }

  /**
   * Trims poorly aligned regions from MSA.
   */
  trimAlignment(
    alignment: MultipleAlignment,
    minConservation: number = 0.3
  ): MultipleAlignment {
    const goodPositions: number[] = [];

    for (let i = 0; i < alignment.conservation.length; i++) {
      if (alignment.conservation[i] >= minConservation) {
        goodPositions.push(i);
      }
    }

    const trimmedSequences = alignment.sequences.map(seq => ({
      ...seq,
      sequence: goodPositions.map(i => seq.sequence[i]).join('')
    }));

    const trimmedConsensus = goodPositions.map(i => alignment.consensus[i]).join('');
    const trimmedConservation = goodPositions.map(i => alignment.conservation[i]);
    const stats = this.calculateMSAStats(trimmedSequences.map(s => s.sequence));

    return {
      sequences: trimmedSequences,
      consensus: trimmedConsensus,
      conservation: trimmedConservation,
      columns: trimmedSequences[0].sequence.length,
      identicalSites: stats.identicalSites,
      conservedSites: stats.conservedSites,
      variableSites: stats.variableSites
    };
  }
}

// Convenience functions

export async function alignPairwise(
  seq1: string,
  seq2: string,
  options?: AlignmentOptions
): Promise<PairwiseAlignment> {
  const aligner = new SequenceAligner();
  return aligner.alignPairwise(seq1, seq2, options);
}

export async function alignMultiple(
  sequences: string[],
  options?: MSAOptions
): Promise<MultipleAlignment> {
  const aligner = new SequenceAligner();
  return aligner.alignMultiple(sequences, options);
}
