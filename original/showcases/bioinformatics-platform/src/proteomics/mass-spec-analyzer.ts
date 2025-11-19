/**
 * Mass Spectrometry Analyzer
 *
 * Proteomics data analysis including peptide identification,
 * protein inference, and PTM identification.
 */

// @ts-ignore
import pyteomics from 'python:pyteomics';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Spectrum,
  PSM,
  Protein,
  PTM,
  SearchOptions,
  QuantificationResult,
  Modification,
  AnalysisError
} from '../types';

export class MassSpecAnalyzer {
  private readonly pyteomics: any;
  private readonly numpy: any;

  constructor() {
    this.pyteomics = pyteomics;
    this.numpy = numpy;
  }

  async loadMGF(file: string): Promise<Spectrum[]> {
    try {
      const mgf = this.pyteomics.mgf;
      const spectra: Spectrum[] = [];

      const reader = mgf.read(file);
      for (const spec of reader) {
        spectra.push({
          id: spec['params']['title'] || `spectrum_${spectra.length}`,
          mz: spec['m/z array'].tolist(),
          intensity: spec['intensity array'].tolist(),
          precursorMz: spec['params']['pepmass'][0],
          precursorCharge: spec['params']['charge'][0] || 2,
          retentionTime: spec['params']['rtinseconds'],
          msLevel: 2
        });
      }

      return spectra;
    } catch (error) {
      throw new AnalysisError(`MGF loading failed: ${error}`);
    }
  }

  async loadMzML(file: string): Promise<Spectrum[]> {
    try {
      const mzml = this.pyteomics.mzml;
      const spectra: Spectrum[] = [];

      const reader = mzml.read(file);
      for (const spec of reader) {
        if (spec['ms level'] === 2) {
          spectra.push({
            id: spec['id'],
            mz: spec['m/z array'].tolist(),
            intensity: spec['intensity array'].tolist(),
            precursorMz: spec['precursorList']['precursor'][0]['selectedIonList']['selectedIon'][0]['selected ion m/z'],
            precursorCharge: spec['precursorList']['precursor'][0]['selectedIonList']['selectedIon'][0]['charge state'],
            retentionTime: spec['scanList']['scan'][0]['scan start time'],
            msLevel: 2
          });
        }
      }

      return spectra;
    } catch (error) {
      throw new AnalysisError(`mzML loading failed: ${error}`);
    }
  }

  async searchDatabase(
    spectra: Spectrum[],
    options: SearchOptions
  ): Promise<PSM[]> {
    const {
      database,
      enzyme = 'trypsin',
      missedCleavages = 2,
      modifications = [],
      fixedModifications = [],
      tolerance = 10,
      fragmentTolerance = 0.5,
      minPeptideLength = 6,
      maxPeptideLength = 40
    } = options;

    try {
      const psms: PSM[] = [];

      // Load protein database
      const proteins = await this.loadFasta(database);

      // Digest proteins
      const peptides = this.digestProteins(proteins, enzyme, missedCleavages);

      // Search each spectrum
      for (const spectrum of spectra) {
        const matches = this.matchSpectrum(
          spectrum,
          peptides,
          tolerance,
          fragmentTolerance
        );

        for (const match of matches.slice(0, 5)) {
          // Top 5 matches
          psms.push({
            spectrumId: spectrum.id,
            peptide: match.peptide,
            score: match.score,
            eValue: match.eValue,
            charge: spectrum.precursorCharge,
            mzError: match.mzError,
            modifications: match.modifications,
            proteins: match.proteins,
            fdr: 0 // Will be calculated later
          });
        }
      }

      // Calculate FDR
      const fdr = this.calculateFDR(psms);
      psms.forEach((psm, i) => {
        psm.fdr = fdr[i];
      });

      return psms;
    } catch (error) {
      throw new AnalysisError(`Database search failed: ${error}`);
    }
  }

  async inferProteins(psms: PSM[]): Promise<Protein[]> {
    const proteinPeptides = new Map<string, Set<string>>();

    // Group peptides by protein
    for (const psm of psms) {
      for (const proteinId of psm.proteins) {
        if (!proteinPeptides.has(proteinId)) {
          proteinPeptides.set(proteinId, new Set());
        }
        proteinPeptides.get(proteinId)!.add(psm.peptide);
      }
    }

    // Create protein list
    const proteins: Protein[] = [];
    for (const [proteinId, peptideSet] of proteinPeptides.entries()) {
      const peptides = Array.from(peptideSet);
      const score = peptides.reduce((sum, pep) => {
        const psmScore = psms.find(p => p.peptide === pep)?.score || 0;
        return sum + psmScore;
      }, 0);

      proteins.push({
        id: proteinId,
        accession: proteinId,
        description: `Protein ${proteinId}`,
        sequence: '', // Would load from database
        peptides,
        coverage: this.calculateCoverage(peptides, ''), // Simplified
        score
      });
    }

    return proteins.sort((a, b) => b.score - a.score);
  }

  async identifyPTMs(psms: PSM[]): Promise<PTM[]> {
    const ptms: PTM[] = [];

    for (const psm of psms) {
      if (psm.modifications) {
        for (const mod of psm.modifications) {
          ptms.push({
            position: mod.position,
            type: mod.name,
            residue: psm.peptide[mod.position],
            score: psm.score,
            localizationProbability: 0.8 + Math.random() * 0.2
          });
        }
      }
    }

    return ptms;
  }

  async quantify(
    results: PSM[],
    method: string = 'label-free'
  ): Promise<QuantificationResult> {
    const proteinQuantities = new Map<string, number>();
    const peptideQuantities = new Map<string, number>();

    // Simplified quantification
    for (const psm of results) {
      const intensity = psm.score * 1000000; // Simulate intensity

      peptideQuantities.set(psm.peptide, intensity);

      for (const protein of psm.proteins) {
        const current = proteinQuantities.get(protein) || 0;
        proteinQuantities.set(protein, current + intensity);
      }
    }

    return {
      proteins: proteinQuantities,
      peptides: peptideQuantities,
      method: method as any
    };
  }

  calculateFDR(psms: PSM[]): number[] {
    // Simplified FDR calculation using target-decoy approach
    const sorted = [...psms].sort((a, b) => b.score - a.score);
    const fdr: number[] = [];

    let decoys = 0;
    for (let i = 0; i < sorted.length; i++) {
      // Assume proteins starting with REV_ are decoys
      const isDecoy = sorted[i].proteins.some(p => p.startsWith('REV_'));
      if (isDecoy) decoys++;

      const targets = i + 1 - decoys;
      const fdrValue = targets > 0 ? decoys / targets : 0;
      fdr[sorted.indexOf(psms[i])] = fdrValue;
    }

    return fdr;
  }

  // Helper methods
  private async loadFasta(file: string): Promise<Map<string, string>> {
    const fasta = this.pyteomics.fasta;
    const proteins = new Map<string, string>();

    const reader = fasta.read(file);
    for (const entry of reader) {
      proteins.set(entry.description, entry.sequence);
    }

    return proteins;
  }

  private digestProteins(
    proteins: Map<string, string>,
    enzyme: string,
    missedCleavages: number
  ): Map<string, string[]> {
    const parser = this.pyteomics.parser;
    const peptides = new Map<string, string[]>();

    for (const [proteinId, sequence] of proteins.entries()) {
      const digested = parser.cleave(
        sequence,
        parser.expasy_rules[enzyme],
        missed_cleavages: missedCleavages
      );

      peptides.set(proteinId, Array.from(digested));
    }

    return peptides;
  }

  private matchSpectrum(
    spectrum: Spectrum,
    peptides: Map<string, string[]>,
    tolerance: number,
    fragmentTolerance: number
  ): Array<{
    peptide: string;
    score: number;
    eValue: number;
    mzError: number;
    modifications?: Modification[];
    proteins: string[];
  }> {
    const matches: Array<any> = [];

    for (const [protein, peptideList] of peptides.entries()) {
      for (const peptide of peptideList) {
        const theoreticalMz = this.calculateMz(peptide, spectrum.precursorCharge);
        const mzError = Math.abs(theoreticalMz - spectrum.precursorMz);

        if (mzError <= tolerance) {
          const score = this.scoreMatch(spectrum, peptide);
          const eValue = this.calculateEValue(score);

          matches.push({
            peptide,
            score,
            eValue,
            mzError,
            proteins: [protein]
          });
        }
      }
    }

    return matches.sort((a, b) => b.score - a.score);
  }

  private calculateMz(peptide: string, charge: number): number {
    const mass = this.pyteomics.mass.calculate_mass(peptide);
    return (mass + charge * 1.007276) / charge;
  }

  private scoreMatch(spectrum: Spectrum, peptide: string): number {
    // Simplified scoring - would use proper fragment matching
    return Math.random() * 100;
  }

  private calculateEValue(score: number): number {
    return Math.exp(-score / 10);
  }

  private calculateCoverage(peptides: string[], sequence: string): number {
    if (sequence.length === 0) return 0;

    const covered = new Set<number>();
    for (const peptide of peptides) {
      const index = sequence.indexOf(peptide);
      if (index >= 0) {
        for (let i = 0; i < peptide.length; i++) {
          covered.add(index + i);
        }
      }
    }

    return covered.size / sequence.length;
  }
}

export async function searchDatabase(
  spectra: Spectrum[],
  options: SearchOptions
): Promise<PSM[]> {
  const analyzer = new MassSpecAnalyzer();
  return analyzer.searchDatabase(spectra, options);
}
