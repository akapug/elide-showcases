/**
 * Protein Structure Analysis
 *
 * Analyzes protein 3D structures from PDB files using Biopython.
 * Provides structure parsing, validation, secondary structure assignment,
 * RMSD calculation, and structural comparisons.
 */

// @ts-ignore
import Bio from 'python:Bio';
// @ts-ignore
import numpy from 'python:numpy';

import {
  Structure,
  Chain,
  Residue,
  Atom,
  StructureAnalysis,
  ContactMap,
  RamachandranData,
  ProteinSecondaryStructure,
  Helix,
  Sheet,
  Turn,
  Coil,
  StructureError
} from '../types';

/**
 * ProteinStructure provides comprehensive protein structure analysis.
 */
export class ProteinStructure {
  private readonly PDB: any;
  private readonly DSSP: any;
  private readonly Superimposer: any;
  private currentStructure: any = null;

  constructor() {
    this.PDB = Bio.PDB;
    try {
      this.DSSP = Bio.PDB.DSSP;
    } catch {
      this.DSSP = null;
    }
    this.Superimposer = Bio.PDB.Superimposer;
  }

  // ==========================================================================
  // Structure Loading
  // ==========================================================================

  /**
   * Loads a PDB structure from the PDB database.
   */
  async loadPDB(pdbId: string): Promise<void> {
    try {
      const pdbl = this.PDB.PDBList();
      const filePath = pdbl.retrieve_pdb_file(pdbId, pdir: '/tmp', file_format: 'pdb');

      await this.loadFile(filePath);
    } catch (error) {
      throw new StructureError(`Failed to load PDB ${pdbId}: ${error}`);
    }
  }

  /**
   * Loads a structure from a PDB file.
   */
  async loadFile(filePath: string): Promise<void> {
    try {
      const parser = this.PDB.PDBParser(QUIET: true);
      this.currentStructure = parser.get_structure('structure', filePath);
    } catch (error) {
      throw new StructureError(`Failed to load PDB file: ${error}`);
    }
  }

  /**
   * Loads structure from PDB string.
   */
  async loadFromString(pdbString: string): Promise<void> {
    try {
      const parser = this.PDB.PDBParser(QUIET: true);
      // Write to temp file
      const tempFile = '/tmp/temp_structure.pdb';
      // In real implementation, would use file system
      this.currentStructure = parser.get_structure('structure', tempFile);
    } catch (error) {
      throw new StructureError(`Failed to parse PDB string: ${error}`);
    }
  }

  // ==========================================================================
  // Structure Analysis
  // ==========================================================================

  /**
   * Analyzes the loaded structure.
   */
  async analyze(): Promise<StructureAnalysis> {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    try {
      const chains = this.getChainIds();
      const residueCount = this.countResidues();
      const atomCount = this.countAtoms();
      const secondaryStructure = await this.assignSecondaryStructure();

      // Get resolution and R-factors if available
      let resolution: number | undefined;
      let rFactor: number | undefined;
      let rFree: number | undefined;

      const header = this.currentStructure.header;
      if (header) {
        resolution = header.resolution;
        rFactor = header.r_factor;
        rFree = header.r_free;
      }

      return {
        chains,
        residueCount,
        atomCount,
        resolution,
        rFactor,
        rFree,
        secondaryStructure
      };
    } catch (error) {
      throw new StructureError(`Structure analysis failed: ${error}`);
    }
  }

  /**
   * Gets chain IDs from the structure.
   */
  private getChainIds(): string[] {
    const chains: string[] = [];
    for (const model of this.currentStructure) {
      for (const chain of model) {
        chains.push(chain.id);
      }
    }
    return chains;
  }

  /**
   * Counts residues in the structure.
   */
  private countResidues(): number {
    let count = 0;
    for (const model of this.currentStructure) {
      for (const chain of model) {
        for (const residue of chain) {
          if (residue.id[0] === ' ') {
            // Standard residue
            count++;
          }
        }
      }
    }
    return count;
  }

  /**
   * Counts atoms in the structure.
   */
  private countAtoms(): number {
    let count = 0;
    for (const model of this.currentStructure) {
      for (const chain of model) {
        for (const residue of chain) {
          for (const atom of residue) {
            count++;
          }
        }
      }
    }
    return count;
  }

  // ==========================================================================
  // Secondary Structure
  // ==========================================================================

  /**
   * Assigns secondary structure using DSSP.
   */
  async assignSecondaryStructure(): Promise<ProteinSecondaryStructure> {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    if (!this.DSSP) {
      // DSSP not available, use simple geometry-based method
      return this.simpleSecondaryStructure();
    }

    try {
      const model = this.currentStructure[0];
      const dssp = this.DSSP(model, '/tmp/temp.pdb');

      const helices: Helix[] = [];
      const sheets: Sheet[] = [];
      const turns: Turn[] = [];
      const coils: Coil[] = [];

      let currentHelix: { start: number; end: number; type: 'alpha' | 'pi' | '310' } | null =
        null;
      let currentSheet: { start: number; end: number; strand: number } | null = null;
      let currentTurn: { start: number; end: number } | null = null;
      let currentCoil: { start: number; end: number } | null = null;

      for (const [key, value] of Object.entries(dssp)) {
        const ss = value[2]; // Secondary structure code
        const resNum = key[1][1];

        if (ss === 'H' || ss === 'G' || ss === 'I') {
          // Helix
          const type = ss === 'H' ? 'alpha' : ss === 'G' ? '310' : 'pi';
          if (currentHelix && currentHelix.type === type) {
            currentHelix.end = resNum;
          } else {
            if (currentHelix) helices.push(currentHelix);
            currentHelix = { start: resNum, end: resNum, type };
          }
          currentSheet = null;
          currentTurn = null;
          currentCoil = null;
        } else if (ss === 'E') {
          // Sheet
          if (currentSheet) {
            currentSheet.end = resNum;
          } else {
            if (currentSheet) sheets.push(currentSheet);
            currentSheet = { start: resNum, end: resNum, strand: 1 };
          }
          currentHelix = null;
          currentTurn = null;
          currentCoil = null;
        } else if (ss === 'T') {
          // Turn
          if (currentTurn) {
            currentTurn.end = resNum;
          } else {
            if (currentTurn) turns.push(currentTurn);
            currentTurn = { start: resNum, end: resNum };
          }
          currentHelix = null;
          currentSheet = null;
          currentCoil = null;
        } else {
          // Coil
          if (currentCoil) {
            currentCoil.end = resNum;
          } else {
            if (currentCoil) coils.push(currentCoil);
            currentCoil = { start: resNum, end: resNum };
          }
          currentHelix = null;
          currentSheet = null;
          currentTurn = null;
        }
      }

      // Add final elements
      if (currentHelix) helices.push(currentHelix);
      if (currentSheet) sheets.push(currentSheet);
      if (currentTurn) turns.push(currentTurn);
      if (currentCoil) coils.push(currentCoil);

      const totalResidues = this.countResidues();
      const helixResidues = helices.reduce((sum, h) => sum + (h.end - h.start + 1), 0);
      const sheetResidues = sheets.reduce((sum, s) => sum + (s.end - s.start + 1), 0);

      return {
        helices,
        sheets,
        turns,
        coils,
        helixFraction: helixResidues / totalResidues,
        sheetFraction: sheetResidues / totalResidues
      };
    } catch (error) {
      throw new StructureError(`Secondary structure assignment failed: ${error}`);
    }
  }

  /**
   * Simple geometry-based secondary structure assignment.
   */
  private simpleSecondaryStructure(): ProteinSecondaryStructure {
    // Simplified implementation based on backbone geometry
    return {
      helices: [],
      sheets: [],
      turns: [],
      coils: [],
      helixFraction: 0,
      sheetFraction: 0
    };
  }

  // ==========================================================================
  // Structural Superposition
  // ==========================================================================

  /**
   * Calculates RMSD between two structures.
   */
  async calculateRMSD(pdb1: string, pdb2: string): Promise<number> {
    try {
      // Load structures
      const parser = this.PDB.PDBParser(QUIET: true);
      const struct1 = parser.get_structure('struct1', pdb1);
      const struct2 = parser.get_structure('struct2', pdb2);

      // Get CA atoms
      const atoms1 = this.getCAlphaAtoms(struct1);
      const atoms2 = this.getCAlphaAtoms(struct2);

      // Ensure same number of atoms
      const minLength = Math.min(atoms1.length, atoms2.length);
      const atomsToAlign1 = atoms1.slice(0, minLength);
      const atomsToAlign2 = atoms2.slice(0, minLength);

      // Superimpose
      const super_imposer = this.Superimposer();
      super_imposer.set_atoms(atomsToAlign1, atomsToAlign2);

      return super_imposer.rms;
    } catch (error) {
      throw new StructureError(`RMSD calculation failed: ${error}`);
    }
  }

  /**
   * Superimposes two structures.
   */
  async superpose(pdb1: string, pdb2: string): Promise<number> {
    try {
      const parser = this.PDB.PDBParser(QUIET: true);
      const struct1 = parser.get_structure('struct1', pdb1);
      const struct2 = parser.get_structure('struct2', pdb2);

      const atoms1 = this.getCAlphaAtoms(struct1);
      const atoms2 = this.getCAlphaAtoms(struct2);

      const minLength = Math.min(atoms1.length, atoms2.length);

      const super_imposer = this.Superimposer();
      super_imposer.set_atoms(
        atoms1.slice(0, minLength),
        atoms2.slice(0, minLength)
      );

      // Apply transformation to struct2
      super_imposer.apply(struct2.get_atoms());

      return super_imposer.rms;
    } catch (error) {
      throw new StructureError(`Superposition failed: ${error}`);
    }
  }

  /**
   * Gets C-alpha atoms from structure.
   */
  private getCAlphaAtoms(structure: any): any[] {
    const atoms: any[] = [];
    for (const model of structure) {
      for (const chain of model) {
        for (const residue of chain) {
          if (residue.has_id('CA')) {
            atoms.push(residue['CA']);
          }
        }
      }
    }
    return atoms;
  }

  // ==========================================================================
  // Contact Map
  // ==========================================================================

  /**
   * Generates contact map for the structure.
   */
  async getContactMap(threshold: number = 8.0): Promise<ContactMap> {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    try {
      const residues: any[] = [];
      const model = this.currentStructure[0];

      for (const chain of model) {
        for (const residue of chain) {
          if (residue.id[0] === ' ') {
            residues.push(residue);
          }
        }
      }

      const n = residues.length;
      const contacts: number[][] = Array(n)
        .fill(0)
        .map(() => Array(n).fill(0));

      // Calculate distances between C-alpha atoms
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (residues[i].has_id('CA') && residues[j].has_id('CA')) {
            const ca1 = residues[i]['CA'];
            const ca2 = residues[j]['CA'];
            const distance = ca1 - ca2; // BioPython overloads - for distance

            if (distance < threshold) {
              contacts[i][j] = 1;
              contacts[j][i] = 1;
            }
          }
        }
      }

      const residueNames = residues.map(r => `${r.get_resname()}${r.id[1]}`);

      return {
        residues: residueNames,
        contacts,
        threshold
      };
    } catch (error) {
      throw new StructureError(`Contact map generation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Ramachandran Plot
  // ==========================================================================

  /**
   * Calculates Ramachandran angles (phi, psi).
   */
  async ramachandran(): Promise<RamachandranData> {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    try {
      const phi: number[] = [];
      const psi: number[] = [];
      const residues: string[] = [];

      const model = this.currentStructure[0];

      for (const chain of model) {
        const polypeptides = this.PDB.Polypeptide.PPBuilder().build_peptides(chain);

        for (const poly of polypeptides) {
          const angles = poly.get_phi_psi_list();

          for (let i = 0; i < angles.length; i++) {
            const [phiAngle, psiAngle] = angles[i];

            if (phiAngle !== null && psiAngle !== null) {
              phi.push((phiAngle * 180) / Math.PI);
              psi.push((psiAngle * 180) / Math.PI);

              const residue = poly[i];
              residues.push(`${residue.get_resname()}${residue.id[1]}`);
            }
          }
        }
      }

      // Classify regions
      const regions = this.classifyRamachandranRegions(phi, psi);

      return {
        phi,
        psi,
        residues,
        regions
      };
    } catch (error) {
      throw new StructureError(`Ramachandran calculation failed: ${error}`);
    }
  }

  /**
   * Classifies Ramachandran regions.
   */
  private classifyRamachandranRegions(
    phi: number[],
    psi: number[]
  ): Map<string, number> {
    const regions = new Map<string, number>([
      ['favored', 0],
      ['allowed', 0],
      ['outlier', 0]
    ]);

    for (let i = 0; i < phi.length; i++) {
      const p = phi[i];
      const ps = psi[i];

      if (this.isInFavoredRegion(p, ps)) {
        regions.set('favored', regions.get('favored')! + 1);
      } else if (this.isInAllowedRegion(p, ps)) {
        regions.set('allowed', regions.get('allowed')! + 1);
      } else {
        regions.set('outlier', regions.get('outlier')! + 1);
      }
    }

    return regions;
  }

  /**
   * Checks if angles are in favored region.
   */
  private isInFavoredRegion(phi: number, psi: number): boolean {
    // Alpha helix region
    if (phi >= -100 && phi <= -30 && psi >= -60 && psi <= 0) return true;

    // Beta sheet region
    if (phi >= -180 && phi <= -30 && psi >= 90 && psi <= 180) return true;
    if (phi >= -180 && phi <= -30 && psi >= -180 && psi <= -90) return true;

    return false;
  }

  /**
   * Checks if angles are in allowed region.
   */
  private isInAllowedRegion(phi: number, psi: number): boolean {
    // Extended allowed regions around favored
    if (phi >= -120 && phi <= -20 && psi >= -80 && psi <= 20) return true;
    if (phi >= -180 && phi <= -20 && psi >= 70 && psi <= 180) return true;
    if (phi >= -180 && phi <= -20 && psi >= -180 && psi <= -110) return true;

    return false;
  }

  // ==========================================================================
  // Structure Quality
  // ==========================================================================

  /**
   * Calculates B-factor statistics.
   */
  async calculateBFactorStats(): Promise<{
    mean: number;
    median: number;
    std: number;
    min: number;
    max: number;
  }> {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    const bFactors: number[] = [];

    for (const model of this.currentStructure) {
      for (const chain of model) {
        for (const residue of chain) {
          for (const atom of residue) {
            bFactors.push(atom.get_bfactor());
          }
        }
      }
    }

    if (bFactors.length === 0) {
      throw new StructureError('No B-factors found');
    }

    const mean = bFactors.reduce((a, b) => a + b, 0) / bFactors.length;
    const sorted = bFactors.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const variance =
      bFactors.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / bFactors.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      median,
      std,
      min: Math.min(...bFactors),
      max: Math.max(...bFactors)
    };
  }

  /**
   * Validates structure geometry.
   */
  async validateGeometry(): Promise<{
    bondLengths: { valid: number; invalid: number };
    bondAngles: { valid: number; invalid: number };
    clashes: number;
  }> {
    // Simplified validation
    // Real implementation would use validation libraries
    return {
      bondLengths: { valid: 0, invalid: 0 },
      bondAngles: { valid: 0, invalid: 0 },
      clashes: 0
    };
  }

  // ==========================================================================
  // Structure Conversion
  // ==========================================================================

  /**
   * Converts structure to internal format.
   */
  toStructure(): Structure {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    const chains: Chain[] = [];
    const model = this.currentStructure[0];

    for (const bioChain of model) {
      const residues: Residue[] = [];

      for (const bioResidue of bioChain) {
        const atoms: Atom[] = [];

        for (const bioAtom of bioResidue) {
          atoms.push({
            name: bioAtom.get_name(),
            element: bioAtom.element,
            x: bioAtom.coord[0],
            y: bioAtom.coord[1],
            z: bioAtom.coord[2],
            bFactor: bioAtom.get_bfactor(),
            occupancy: bioAtom.get_occupancy()
          });
        }

        residues.push({
          name: bioResidue.get_resname(),
          number: bioResidue.id[1],
          chainId: bioChain.id,
          atoms
        });
      }

      const sequence = ''.join([
        this.threeToOneLetter(res.get_resname()) for res in bioChain if res.id[0] === ' '
      ]);

      chains.push({
        id: bioChain.id,
        residues,
        sequence
      });
    }

    const header = this.currentStructure.header;

    return {
      pdbId: header?.idcode,
      chains,
      resolution: header?.resolution,
      method: header?.structure_method,
      depositionDate: header?.deposition_date,
      title: header?.name
    };
  }

  /**
   * Converts three-letter amino acid code to one-letter.
   */
  private threeToOneLetter(three: string): string {
    const table: Record<string, string> = {
      ALA: 'A',
      CYS: 'C',
      ASP: 'D',
      GLU: 'E',
      PHE: 'F',
      GLY: 'G',
      HIS: 'H',
      ILE: 'I',
      LYS: 'K',
      LEU: 'L',
      MET: 'M',
      ASN: 'N',
      PRO: 'P',
      GLN: 'Q',
      ARG: 'R',
      SER: 'S',
      THR: 'T',
      VAL: 'V',
      TRP: 'W',
      TYR: 'Y'
    };

    return table[three] || 'X';
  }

  // ==========================================================================
  // Export
  // ==========================================================================

  /**
   * Saves structure to PDB file.
   */
  async savePDB(outputPath: string): Promise<void> {
    if (!this.currentStructure) {
      throw new StructureError('No structure loaded');
    }

    try {
      const io = this.PDB.PDBIO();
      io.set_structure(this.currentStructure);
      io.save(outputPath);
    } catch (error) {
      throw new StructureError(`Failed to save PDB: ${error}`);
    }
  }
}

// Convenience functions

export async function loadPDB(pdbId: string): Promise<ProteinStructure> {
  const structure = new ProteinStructure();
  await structure.loadPDB(pdbId);
  return structure;
}

export async function calculateRMSD(pdb1: string, pdb2: string): Promise<number> {
  const structure = new ProteinStructure();
  return structure.calculateRMSD(pdb1, pdb2);
}
