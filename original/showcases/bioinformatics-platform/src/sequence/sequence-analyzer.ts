/**
 * Sequence Analyzer
 *
 * Advanced DNA, RNA, and protein sequence analysis using Biopython.
 * Demonstrates Elide's polyglot capabilities by directly importing and using
 * Python's BioPython library in TypeScript.
 */

// @ts-ignore
import Bio from 'python:Bio';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Sequence,
  DNASequence,
  RNASequence,
  ProteinSequence,
  DNAAnalysis,
  RNAAnalysis,
  ProteinAnalysis,
  ORF,
  CodonUsage,
  InvalidSequenceError,
  AnalysisError,
  ReadingFrame,
  Strand
} from '../types';

/**
 * SequenceAnalyzer provides comprehensive sequence analysis capabilities
 * for DNA, RNA, and protein sequences using Biopython.
 */
export class SequenceAnalyzer {
  private readonly Bio: any;
  private readonly SeqUtils: any;
  private readonly Seq: any;

  constructor() {
    // Initialize Biopython modules
    this.Bio = Bio;
    this.Seq = Bio.Seq;
    this.SeqUtils = Bio.SeqUtils;
  }

  // ==========================================================================
  // DNA Analysis
  // ==========================================================================

  /**
   * Analyzes a DNA sequence and returns comprehensive statistics.
   */
  async analyzeDNA(sequence: string): Promise<DNAAnalysis> {
    this.validateDNA(sequence);

    try {
      // Create Biopython Seq object
      const seq = this.Seq.Seq(sequence.toUpperCase());

      // Calculate nucleotide counts
      const counts = this.countNucleotides(sequence);

      // GC content
      const gcContent = this.SeqUtils.gc_fraction(seq) * 100;

      // AT content
      const atContent = 100 - gcContent;

      // Molecular weight
      const molecularWeight = this.SeqUtils.molecular_weight(seq, 'DNA');

      // Melting temperature (if sequence is short enough)
      let meltingTemperature: number | undefined;
      if (sequence.length <= 14) {
        meltingTemperature = this.SeqUtils.MeltingTemp.Tm_Wallace(seq);
      } else {
        meltingTemperature = this.SeqUtils.MeltingTemp.Tm_GC(seq);
      }

      // Dinucleotide frequencies
      const dinucleotideFrequencies = this.calculateDinucleotideFrequencies(sequence);

      // Trinucleotide frequencies
      const trinucleotideFrequencies = this.calculateTrinucleotideFrequencies(sequence);

      return {
        sequence,
        length: sequence.length,
        gcContent,
        atContent,
        molecularWeight,
        meltingTemperature,
        nucleotideCounts: {
          A: counts.A,
          T: counts.T,
          C: counts.C,
          G: counts.G
        },
        dinucleotideFrequencies,
        trinucleotideFrequencies
      };
    } catch (error) {
      throw new AnalysisError(`DNA analysis failed: ${error}`);
    }
  }

  /**
   * Analyzes an RNA sequence and returns comprehensive statistics.
   */
  async analyzeRNA(sequence: string): Promise<RNAAnalysis> {
    this.validateRNA(sequence);

    try {
      const seq = this.Seq.Seq(sequence.toUpperCase());
      const counts = this.countNucleotidesRNA(sequence);
      const gcContent = this.calculateGCContentRNA(sequence);
      const molecularWeight = this.SeqUtils.molecular_weight(seq, 'RNA');

      return {
        sequence,
        length: sequence.length,
        gcContent,
        molecularWeight,
        nucleotideCounts: {
          A: counts.A,
          U: counts.U,
          C: counts.C,
          G: counts.G
        }
      };
    } catch (error) {
      throw new AnalysisError(`RNA analysis failed: ${error}`);
    }
  }

  /**
   * Analyzes a protein sequence and returns comprehensive statistics.
   */
  async analyzeProtein(sequence: string): Promise<ProteinAnalysis> {
    this.validateProtein(sequence);

    try {
      const seq = this.Seq.Seq(sequence.toUpperCase());
      const ProtParam = Bio.SeqUtils.ProtParam;
      const analysis = ProtParam.ProteinAnalysis(str(seq));

      // Molecular weight
      const molecularWeight = analysis.molecular_weight();

      // Isoelectric point
      const isoelectricPoint = analysis.isoelectric_point();

      // Aromaticity
      const aromaticity = analysis.aromaticity();

      // Instability index
      const instabilityIndex = analysis.instability_index();

      // GRAVY (Grand Average of Hydropathy)
      const gravy = analysis.gravy();

      // Amino acid composition
      const aminoAcidComposition = this.getAminoAcidComposition(sequence);

      return {
        sequence,
        length: sequence.length,
        molecularWeight,
        isoelectricPoint,
        aromaticity,
        instabilityIndex,
        gravy,
        aminoAcidComposition
      };
    } catch (error) {
      throw new AnalysisError(`Protein analysis failed: ${error}`);
    }
  }

  // ==========================================================================
  // Translation and Transcription
  // ==========================================================================

  /**
   * Transcribes DNA to RNA.
   */
  async transcribe(dnaSequence: string): Promise<RNASequence> {
    this.validateDNA(dnaSequence);

    try {
      const seq = this.Seq.Seq(dnaSequence.toUpperCase());
      const rnaSeq = seq.transcribe();

      return {
        sequence: str(rnaSeq),
        type: 'RNA'
      };
    } catch (error) {
      throw new AnalysisError(`Transcription failed: ${error}`);
    }
  }

  /**
   * Translates DNA or RNA to protein.
   */
  async translate(
    sequence: string,
    frame: ReadingFrame = 0,
    toStop: boolean = false
  ): Promise<ProteinSequence> {
    try {
      const seq = this.Seq.Seq(sequence.toUpperCase());
      let proteinSeq;

      if (toStop) {
        proteinSeq = seq.translate(to_stop: true);
      } else {
        proteinSeq = seq.translate();
      }

      return {
        sequence: str(proteinSeq),
        type: 'Protein'
      };
    } catch (error) {
      throw new AnalysisError(`Translation failed: ${error}`);
    }
  }

  /**
   * Back-translates a protein sequence to DNA (uses most common codons).
   */
  async backTranslate(proteinSequence: string): Promise<DNASequence> {
    this.validateProtein(proteinSequence);

    try {
      const seq = this.Seq.Seq(proteinSequence.toUpperCase());
      const dnaSeq = seq.back_transcribe();

      return {
        sequence: str(dnaSeq),
        type: 'DNA'
      };
    } catch (error) {
      throw new AnalysisError(`Back-translation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Sequence Manipulation
  // ==========================================================================

  /**
   * Returns the reverse complement of a DNA sequence.
   */
  async reverseComplement(dnaSequence: string): Promise<string> {
    this.validateDNA(dnaSequence);

    try {
      const seq = this.Seq.Seq(dnaSequence.toUpperCase());
      const revComp = seq.reverse_complement();
      return str(revComp);
    } catch (error) {
      throw new AnalysisError(`Reverse complement failed: ${error}`);
    }
  }

  /**
   * Returns the complement of a DNA sequence.
   */
  async complement(dnaSequence: string): Promise<string> {
    this.validateDNA(dnaSequence);

    try {
      const seq = this.Seq.Seq(dnaSequence.toUpperCase());
      const comp = seq.complement();
      return str(comp);
    } catch (error) {
      throw new AnalysisError(`Complement failed: ${error}`);
    }
  }

  /**
   * Returns the reverse of a sequence.
   */
  reverse(sequence: string): string {
    return sequence.split('').reverse().join('');
  }

  // ==========================================================================
  // Open Reading Frame (ORF) Detection
  // ==========================================================================

  /**
   * Finds all open reading frames in a DNA sequence.
   */
  async findORFs(
    dnaSequence: string,
    minLength: number = 100,
    findAll: boolean = true
  ): Promise<ORF[]> {
    this.validateDNA(dnaSequence);

    const orfs: ORF[] = [];
    const seq = dnaSequence.toUpperCase();

    // Find ORFs in all 6 reading frames (3 forward, 3 reverse)
    for (let strand of ['+', '-'] as Strand[]) {
      const searchSeq = strand === '+' ? seq : await this.reverseComplement(seq);

      for (let frame of [0, 1, 2] as ReadingFrame[]) {
        const frameORFs = await this.findORFsInFrame(
          searchSeq,
          frame,
          strand,
          minLength,
          findAll
        );
        orfs.push(...frameORFs);
      }
    }

    // Sort by length (descending)
    return orfs.sort((a, b) => b.length - a.length);
  }

  /**
   * Finds ORFs in a specific reading frame.
   */
  private async findORFsInFrame(
    sequence: string,
    frame: ReadingFrame,
    strand: Strand,
    minLength: number,
    findAll: boolean
  ): Promise<ORF[]> {
    const orfs: ORF[] = [];
    const startCodons = ['ATG'];
    const stopCodons = ['TAA', 'TAG', 'TGA'];

    // Extract sequence starting from the reading frame
    const frameSeq = sequence.slice(frame);

    // Find all start codons
    const starts: number[] = [];
    for (let i = 0; i < frameSeq.length - 2; i += 3) {
      const codon = frameSeq.slice(i, i + 3);
      if (startCodons.includes(codon)) {
        starts.push(i);
      }
    }

    // Find ORFs from each start codon
    for (const startPos of starts) {
      for (let i = startPos; i < frameSeq.length - 2; i += 3) {
        const codon = frameSeq.slice(i, i + 3);

        if (stopCodons.includes(codon)) {
          const orfLength = i - startPos + 3;

          if (orfLength >= minLength) {
            const orfSeq = frameSeq.slice(startPos, i + 3);
            const proteinSeq = await this.translate(orfSeq, 0, true);

            const orf: ORF = {
              start: frame + startPos,
              end: frame + i + 3,
              strand,
              frame,
              sequence: orfSeq,
              proteinSequence: proteinSeq.sequence,
              length: orfLength,
              hasStartCodon: true,
              hasStopCodon: true
            };

            orfs.push(orf);
          }

          if (!findAll) break;
        }
      }
    }

    return orfs;
  }

  // ==========================================================================
  // Codon Usage Analysis
  // ==========================================================================

  /**
   * Calculates codon usage statistics for a DNA sequence.
   */
  async codonUsage(dnaSequence: string): Promise<CodonUsage[]> {
    this.validateDNA(dnaSequence);

    const seq = dnaSequence.toUpperCase();
    const codonCounts = new Map<string, number>();

    // Count codons
    for (let i = 0; i < seq.length - 2; i += 3) {
      const codon = seq.slice(i, i + 3);
      if (codon.length === 3) {
        codonCounts.set(codon, (codonCounts.get(codon) || 0) + 1);
      }
    }

    // Convert to codon usage array
    const usage: CodonUsage[] = [];
    const totalCodons = Array.from(codonCounts.values()).reduce((a, b) => a + b, 0);

    for (const [codon, count] of codonCounts.entries()) {
      const aminoAcid = this.getAminoAcid(codon);
      const frequency = count / totalCodons;
      const rscu = this.calculateRSCU(codon, codonCounts);

      usage.push({
        codon,
        aminoAcid,
        count,
        frequency,
        rscu
      });
    }

    return usage.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Calculates Relative Synonymous Codon Usage (RSCU).
   */
  private calculateRSCU(codon: string, codonCounts: Map<string, number>): number {
    const aminoAcid = this.getAminoAcid(codon);
    const synonymousCodons = this.getSynonymousCodons(aminoAcid);

    let totalSynonymous = 0;
    for (const synCodon of synonymousCodons) {
      totalSynonymous += codonCounts.get(synCodon) || 0;
    }

    const observed = codonCounts.get(codon) || 0;
    const expected = totalSynonymous / synonymousCodons.length;

    return expected > 0 ? observed / expected : 0;
  }

  /**
   * Gets the amino acid encoded by a codon.
   */
  private getAminoAcid(codon: string): string {
    const geneticCode: Record<string, string> = {
      'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
      'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
      'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
      'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
      'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
      'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
      'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
      'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
      'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
      'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
      'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
      'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
      'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
      'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
      'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
      'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
    };

    return geneticCode[codon] || 'X';
  }

  /**
   * Gets all synonymous codons for an amino acid.
   */
  private getSynonymousCodons(aminoAcid: string): string[] {
    const reverseCode: Record<string, string[]> = {
      'F': ['TTT', 'TTC'],
      'L': ['TTA', 'TTG', 'CTT', 'CTC', 'CTA', 'CTG'],
      'S': ['TCT', 'TCC', 'TCA', 'TCG', 'AGT', 'AGC'],
      'Y': ['TAT', 'TAC'],
      '*': ['TAA', 'TAG', 'TGA'],
      'C': ['TGT', 'TGC'],
      'W': ['TGG'],
      'P': ['CCT', 'CCC', 'CCA', 'CCG'],
      'H': ['CAT', 'CAC'],
      'Q': ['CAA', 'CAG'],
      'R': ['CGT', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
      'I': ['ATT', 'ATC', 'ATA'],
      'M': ['ATG'],
      'T': ['ACT', 'ACC', 'ACA', 'ACG'],
      'N': ['AAT', 'AAC'],
      'K': ['AAA', 'AAG'],
      'V': ['GTT', 'GTC', 'GTA', 'GTG'],
      'A': ['GCT', 'GCC', 'GCA', 'GCG'],
      'D': ['GAT', 'GAC'],
      'E': ['GAA', 'GAG'],
      'G': ['GGT', 'GGC', 'GGA', 'GGG']
    };

    return reverseCode[aminoAcid] || [];
  }

  // ==========================================================================
  // Validation Methods
  // ==========================================================================

  /**
   * Validates a DNA sequence.
   */
  private validateDNA(sequence: string): void {
    if (!sequence || sequence.length === 0) {
      throw new InvalidSequenceError('Sequence cannot be empty');
    }

    if (!/^[ATCGN]+$/i.test(sequence)) {
      throw new InvalidSequenceError('Invalid DNA sequence: contains invalid characters');
    }
  }

  /**
   * Validates an RNA sequence.
   */
  private validateRNA(sequence: string): void {
    if (!sequence || sequence.length === 0) {
      throw new InvalidSequenceError('Sequence cannot be empty');
    }

    if (!/^[AUCGN]+$/i.test(sequence)) {
      throw new InvalidSequenceError('Invalid RNA sequence: contains invalid characters');
    }
  }

  /**
   * Validates a protein sequence.
   */
  private validateProtein(sequence: string): void {
    if (!sequence || sequence.length === 0) {
      throw new InvalidSequenceError('Sequence cannot be empty');
    }

    if (!/^[ACDEFGHIKLMNPQRSTVWY*]+$/i.test(sequence)) {
      throw new InvalidSequenceError('Invalid protein sequence: contains invalid characters');
    }
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Counts nucleotides in a DNA sequence.
   */
  private countNucleotides(sequence: string): { A: number; T: number; C: number; G: number } {
    const upper = sequence.toUpperCase();
    return {
      A: (upper.match(/A/g) || []).length,
      T: (upper.match(/T/g) || []).length,
      C: (upper.match(/C/g) || []).length,
      G: (upper.match(/G/g) || []).length
    };
  }

  /**
   * Counts nucleotides in an RNA sequence.
   */
  private countNucleotidesRNA(sequence: string): { A: number; U: number; C: number; G: number } {
    const upper = sequence.toUpperCase();
    return {
      A: (upper.match(/A/g) || []).length,
      U: (upper.match(/U/g) || []).length,
      C: (upper.match(/C/g) || []).length,
      G: (upper.match(/G/g) || []).length
    };
  }

  /**
   * Calculates GC content for RNA.
   */
  private calculateGCContentRNA(sequence: string): number {
    const counts = this.countNucleotidesRNA(sequence);
    const total = counts.A + counts.U + counts.C + counts.G;
    return total > 0 ? ((counts.G + counts.C) / total) * 100 : 0;
  }

  /**
   * Gets amino acid composition of a protein.
   */
  private getAminoAcidComposition(sequence: string): Record<string, number> {
    const composition: Record<string, number> = {};
    const upper = sequence.toUpperCase();

    for (const aa of 'ACDEFGHIKLMNPQRSTVWY') {
      const count = (upper.match(new RegExp(aa, 'g')) || []).length;
      composition[aa] = count / sequence.length;
    }

    return composition;
  }

  /**
   * Calculates dinucleotide frequencies.
   */
  private calculateDinucleotideFrequencies(sequence: string): Record<string, number> {
    const frequencies: Record<string, number> = {};
    const upper = sequence.toUpperCase();

    for (let i = 0; i < upper.length - 1; i++) {
      const dinuc = upper.slice(i, i + 2);
      if (/^[ATCG]{2}$/.test(dinuc)) {
        frequencies[dinuc] = (frequencies[dinuc] || 0) + 1;
      }
    }

    // Normalize
    const total = Object.values(frequencies).reduce((a, b) => a + b, 0);
    for (const key in frequencies) {
      frequencies[key] = frequencies[key] / total;
    }

    return frequencies;
  }

  /**
   * Calculates trinucleotide frequencies.
   */
  private calculateTrinucleotideFrequencies(sequence: string): Record<string, number> {
    const frequencies: Record<string, number> = {};
    const upper = sequence.toUpperCase();

    for (let i = 0; i < upper.length - 2; i++) {
      const trinuc = upper.slice(i, i + 3);
      if (/^[ATCG]{3}$/.test(trinuc)) {
        frequencies[trinuc] = (frequencies[trinuc] || 0) + 1;
      }
    }

    // Normalize
    const total = Object.values(frequencies).reduce((a, b) => a + b, 0);
    for (const key in frequencies) {
      frequencies[key] = frequencies[key] / total;
    }

    return frequencies;
  }

  // ==========================================================================
  // Sequence Quality Analysis
  // ==========================================================================

  /**
   * Calculates the complexity of a sequence (Shannon entropy).
   */
  calculateComplexity(sequence: string): number {
    const freq: Record<string, number> = {};
    const upper = sequence.toUpperCase();

    // Count frequencies
    for (const char of upper) {
      freq[char] = (freq[char] || 0) + 1;
    }

    // Calculate Shannon entropy
    let entropy = 0;
    for (const count of Object.values(freq)) {
      const p = count / sequence.length;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  /**
   * Detects low complexity regions in a sequence.
   */
  detectLowComplexityRegions(
    sequence: string,
    windowSize: number = 20,
    threshold: number = 1.5
  ): Array<{ start: number; end: number; complexity: number }> {
    const regions: Array<{ start: number; end: number; complexity: number }> = [];

    for (let i = 0; i <= sequence.length - windowSize; i++) {
      const window = sequence.slice(i, i + windowSize);
      const complexity = this.calculateComplexity(window);

      if (complexity < threshold) {
        regions.push({
          start: i,
          end: i + windowSize,
          complexity
        });
      }
    }

    // Merge overlapping regions
    return this.mergeRegions(regions);
  }

  /**
   * Merges overlapping regions.
   */
  private mergeRegions(
    regions: Array<{ start: number; end: number; complexity: number }>
  ): Array<{ start: number; end: number; complexity: number }> {
    if (regions.length === 0) return [];

    const sorted = regions.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number; complexity: number }> = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
        last.complexity = Math.min(last.complexity, current.complexity);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  // ==========================================================================
  // CpG Island Detection
  // ==========================================================================

  /**
   * Detects CpG islands in a DNA sequence.
   */
  detectCpGIslands(
    sequence: string,
    windowSize: number = 200,
    minLength: number = 200,
    gcThreshold: number = 0.5,
    obsExpThreshold: number = 0.6
  ): Array<{ start: number; end: number; gcContent: number; obsExp: number }> {
    this.validateDNA(sequence);

    const islands: Array<{ start: number; end: number; gcContent: number; obsExp: number }> = [];
    const upper = sequence.toUpperCase();

    for (let i = 0; i <= upper.length - windowSize; i++) {
      const window = upper.slice(i, i + windowSize);

      const gcContent = this.calculateGCContent(window);
      const obsExp = this.calculateCpGObsExp(window);

      if (gcContent >= gcThreshold && obsExp >= obsExpThreshold) {
        islands.push({
          start: i,
          end: i + windowSize,
          gcContent,
          obsExp
        });
      }
    }

    // Merge overlapping islands
    return this.mergeCpGIslands(islands, minLength);
  }

  /**
   * Calculates GC content.
   */
  private calculateGCContent(sequence: string): number {
    const counts = this.countNucleotides(sequence);
    const total = counts.A + counts.T + counts.C + counts.G;
    return total > 0 ? (counts.G + counts.C) / total : 0;
  }

  /**
   * Calculates CpG observed/expected ratio.
   */
  private calculateCpGObsExp(sequence: string): number {
    const counts = this.countNucleotides(sequence);
    const cpg = (sequence.match(/CG/gi) || []).length;

    const total = counts.A + counts.T + counts.C + counts.G;
    if (total === 0) return 0;

    const expected = (counts.C * counts.G) / total;
    return expected > 0 ? cpg / expected : 0;
  }

  /**
   * Merges overlapping CpG islands.
   */
  private mergeCpGIslands(
    islands: Array<{ start: number; end: number; gcContent: number; obsExp: number }>,
    minLength: number
  ): Array<{ start: number; end: number; gcContent: number; obsExp: number }> {
    if (islands.length === 0) return [];

    const sorted = islands.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number; gcContent: number; obsExp: number }> = [
      sorted[0]
    ];

    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const last = merged[merged.length - 1];

      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
        last.gcContent = (last.gcContent + current.gcContent) / 2;
        last.obsExp = (last.obsExp + current.obsExp) / 2;
      } else {
        merged.push(current);
      }
    }

    // Filter by minimum length
    return merged.filter(island => island.end - island.start >= minLength);
  }
}

// Convenience functions for quick analysis

/**
 * Quick DNA analysis.
 */
export async function analyzeDNA(sequence: string): Promise<DNAAnalysis> {
  const analyzer = new SequenceAnalyzer();
  return analyzer.analyzeDNA(sequence);
}

/**
 * Quick RNA analysis.
 */
export async function analyzeRNA(sequence: string): Promise<RNAAnalysis> {
  const analyzer = new SequenceAnalyzer();
  return analyzer.analyzeRNA(sequence);
}

/**
 * Quick protein analysis.
 */
export async function analyzeProtein(sequence: string): Promise<ProteinAnalysis> {
  const analyzer = new SequenceAnalyzer();
  return analyzer.analyzeProtein(sequence);
}

/**
 * Quick translation.
 */
export async function translate(sequence: string): Promise<ProteinSequence> {
  const analyzer = new SequenceAnalyzer();
  return analyzer.translate(sequence);
}

/**
 * Quick reverse complement.
 */
export async function reverseComplement(sequence: string): Promise<string> {
  const analyzer = new SequenceAnalyzer();
  return analyzer.reverseComplement(sequence);
}
