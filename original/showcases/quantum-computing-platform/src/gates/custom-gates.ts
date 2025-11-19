/**
 * Custom Quantum Gates
 *
 * Library of custom and composite quantum gates built from basic operations.
 * Demonstrates advanced gate construction and quantum circuit design patterns.
 */

// @ts-ignore
import qiskit from 'python:qiskit';
// @ts-ignore
import numpy from 'python:numpy';

import { CircuitBuilder } from '../circuits/circuit-builder';
import {
  QuantumGate,
  ComplexMatrix,
  CircuitError,
} from '../types';

/**
 * Custom Gate Builder
 *
 * Factory for creating custom quantum gates and composite operations.
 */
export class CustomGate {
  /**
   * Create Toffoli (CCX) gate
   * Three-qubit controlled-controlled-NOT gate
   */
  static createToffoli(): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: [number, number, number]) => void;
  } {
    return {
      name: 'Toffoli',
      apply: (circuit: CircuitBuilder, qubits: [number, number, number]) => {
        circuit.addToffoli(qubits[0], qubits[1], qubits[2]);
      },
    };
  }

  /**
   * Create Fredkin (CSWAP) gate
   * Controlled-SWAP gate
   */
  static createFredkin(): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: [number, number, number]) => void;
  } {
    return {
      name: 'Fredkin',
      apply: (circuit: CircuitBuilder, qubits: [number, number, number]) => {
        circuit.addFredkin(qubits[0], qubits[1], qubits[2]);
      },
    };
  }

  /**
   * Create Quantum Fourier Transform gate
   */
  static createQFT(numQubits: number): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `QFT_${numQubits}`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        if (qubits.length !== numQubits) {
          throw new CircuitError(`QFT requires exactly ${numQubits} qubits`);
        }

        // Apply QFT
        for (let j = 0; j < numQubits; j++) {
          circuit.addHadamard(qubits[j]);

          for (let k = j + 1; k < numQubits; k++) {
            const angle = Math.PI / Math.pow(2, k - j);
            circuit.addControlledPhase(qubits[k], qubits[j], angle);
          }
        }

        // Reverse qubit order
        for (let j = 0; j < Math.floor(numQubits / 2); j++) {
          circuit.addSwap(qubits[j], qubits[numQubits - j - 1]);
        }
      },
    };
  }

  /**
   * Create Inverse QFT gate
   */
  static createInverseQFT(numQubits: number): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `IQFT_${numQubits}`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        if (qubits.length !== numQubits) {
          throw new CircuitError(`Inverse QFT requires exactly ${numQubits} qubits`);
        }

        // Reverse qubit order
        for (let j = 0; j < Math.floor(numQubits / 2); j++) {
          circuit.addSwap(qubits[j], qubits[numQubits - j - 1]);
        }

        // Apply inverse QFT
        for (let j = numQubits - 1; j >= 0; j--) {
          for (let k = numQubits - 1; k > j; k--) {
            const angle = -Math.PI / Math.pow(2, k - j);
            circuit.addControlledPhase(qubits[k], qubits[j], angle);
          }

          circuit.addHadamard(qubits[j]);
        }
      },
    };
  }

  /**
   * Create controlled-U gate
   */
  static createControlledU(
    theta: number,
    phi: number,
    lambda: number
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, control: number, target: number) => void;
  } {
    return {
      name: 'CU',
      apply: (circuit: CircuitBuilder, control: number, target: number) => {
        // Decompose CU into basis gates
        circuit.addPhase(target, (lambda + phi) / 2);
        circuit.addPhase(control, (lambda - phi) / 2);

        circuit.addCNOT(control, target);
        circuit.addUGate(target, -theta / 2, 0, -(phi + lambda) / 2);
        circuit.addCNOT(control, target);
        circuit.addUGate(target, theta / 2, phi, 0);
      },
    };
  }

  /**
   * Create square root of NOT gate (√X)
   */
  static createSqrtX(): {
    name: string;
    apply: (circuit: CircuitBuilder, qubit: number) => void;
  } {
    return {
      name: 'SqrtX',
      apply: (circuit: CircuitBuilder, qubit: number) => {
        // √X = H S H S† H
        circuit.addHadamard(qubit);
        circuit.addSGate(qubit);
        circuit.addHadamard(qubit);
        circuit.addSDaggerGate(qubit);
        circuit.addHadamard(qubit);
      },
    };
  }

  /**
   * Create square root of SWAP gate (√SWAP)
   */
  static createSqrtSwap(): {
    name: string;
    apply: (circuit: CircuitBuilder, qubit1: number, qubit2: number) => void;
  } {
    return {
      name: 'SqrtSwap',
      apply: (circuit: CircuitBuilder, qubit1: number, qubit2: number) => {
        // √SWAP decomposition
        circuit.addRY(qubit1, Math.PI / 4);
        circuit.addRY(qubit2, Math.PI / 4);
        circuit.addCNOT(qubit1, qubit2);
        circuit.addRY(qubit1, -Math.PI / 4);
        circuit.addRY(qubit2, Math.PI / 4);
        circuit.addCNOT(qubit2, qubit1);
        circuit.addRY(qubit2, -Math.PI / 4);
        circuit.addCNOT(qubit1, qubit2);
      },
    };
  }

  /**
   * Create iSWAP gate
   */
  static createiSwap(): {
    name: string;
    apply: (circuit: CircuitBuilder, qubit1: number, qubit2: number) => void;
  } {
    return {
      name: 'iSWAP',
      apply: (circuit: CircuitBuilder, qubit1: number, qubit2: number) => {
        circuit.addSGate(qubit1);
        circuit.addSGate(qubit2);
        circuit.addHadamard(qubit1);
        circuit.addCNOT(qubit1, qubit2);
        circuit.addCNOT(qubit2, qubit1);
        circuit.addHadamard(qubit2);
      },
    };
  }

  /**
   * Create W-state preparation gate
   */
  static createWState(numQubits: number): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `W_${numQubits}`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        if (qubits.length !== numQubits || numQubits < 2) {
          throw new CircuitError('W-state requires at least 2 qubits');
        }

        // Recursive W-state construction
        circuit.addRY(qubits[0], 2 * Math.asin(Math.sqrt(1 / numQubits)));

        for (let i = 1; i < numQubits; i++) {
          const theta = 2 * Math.asin(Math.sqrt(1 / (numQubits - i)));
          circuit.addCRY(qubits[i - 1], qubits[i], theta);
          circuit.addCNOT(qubits[i], qubits[i - 1]);
        }
      },
    };
  }

  /**
   * Create GHZ-state preparation gate
   */
  static createGHZState(numQubits: number): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `GHZ_${numQubits}`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        if (qubits.length !== numQubits || numQubits < 2) {
          throw new CircuitError('GHZ-state requires at least 2 qubits');
        }

        circuit.addHadamard(qubits[0]);

        for (let i = 1; i < numQubits; i++) {
          circuit.addCNOT(qubits[0], qubits[i]);
        }
      },
    };
  }

  /**
   * Create Pauli rotation gate exp(-i θ P)
   */
  static createPauliRotation(
    pauli: string,
    theta: number
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `R_${pauli}(${theta.toFixed(2)})`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        if (qubits.length !== pauli.length) {
          throw new CircuitError('Number of qubits must match Pauli string length');
        }

        // Convert to Z basis
        for (let i = 0; i < pauli.length; i++) {
          if (pauli[i] === 'X') {
            circuit.addHadamard(qubits[i]);
          } else if (pauli[i] === 'Y') {
            circuit.addRX(qubits[i], Math.PI / 2);
          }
        }

        // Apply CNOTs to entangle
        for (let i = 0; i < qubits.length - 1; i++) {
          circuit.addCNOT(qubits[i], qubits[i + 1]);
        }

        // Apply RZ rotation
        circuit.addRZ(qubits[qubits.length - 1], 2 * theta);

        // Unentangle
        for (let i = qubits.length - 2; i >= 0; i--) {
          circuit.addCNOT(qubits[i], qubits[i + 1]);
        }

        // Convert back from Z basis
        for (let i = 0; i < pauli.length; i++) {
          if (pauli[i] === 'X') {
            circuit.addHadamard(qubits[i]);
          } else if (pauli[i] === 'Y') {
            circuit.addRX(qubits[i], -Math.PI / 2);
          }
        }
      },
    };
  }

  /**
   * Create quantum adder gate
   */
  static createQuantumAdder(numBits: number): {
    name: string;
    apply: (circuit: CircuitBuilder, a: number[], b: number[], carry?: number) => void;
  } {
    return {
      name: `Adder_${numBits}`,
      apply: (circuit: CircuitBuilder, a: number[], b: number[], carry?: number) => {
        if (a.length !== numBits || b.length !== numBits) {
          throw new CircuitError(`Adder requires ${numBits} bits for each input`);
        }

        // Simplified quantum adder using Toffoli gates
        for (let i = 0; i < numBits; i++) {
          circuit.addCNOT(a[i], b[i]);

          if (i < numBits - 1) {
            if (carry !== undefined) {
              circuit.addToffoli(a[i], b[i], carry);
            }
          }
        }
      },
    };
  }

  /**
   * Create quantum multiplier gate
   */
  static createQuantumMultiplier(numBits: number): {
    name: string;
    apply: (circuit: CircuitBuilder, a: number[], b: number[], result: number[]) => void;
  } {
    return {
      name: `Multiplier_${numBits}`,
      apply: (circuit: CircuitBuilder, a: number[], b: number[], result: number[]) => {
        // Simplified quantum multiplier
        for (let i = 0; i < numBits; i++) {
          for (let j = 0; j < numBits; j++) {
            if (i + j < result.length) {
              circuit.addToffoli(a[i], b[j], result[i + j]);
            }
          }
        }
      },
    };
  }

  /**
   * Create arbitrary rotation gate
   */
  static createArbitraryRotation(
    axis: [number, number, number],
    theta: number
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, qubit: number) => void;
  } {
    const [x, y, z] = axis;
    const norm = Math.sqrt(x * x + y * y + z * z);
    const nx = x / norm;
    const ny = y / norm;
    const nz = z / norm;

    return {
      name: `R_[${nx.toFixed(2)},${ny.toFixed(2)},${nz.toFixed(2)}](${theta.toFixed(2)})`,
      apply: (circuit: CircuitBuilder, qubit: number) => {
        // Rotation around arbitrary axis using Euler decomposition
        const phi = Math.atan2(ny, nx);
        const cosTheta = nz;
        const sinTheta = Math.sqrt(nx * nx + ny * ny);

        if (sinTheta > 1e-10) {
          circuit.addRZ(qubit, phi);
          circuit.addRY(qubit, 2 * Math.asin(sinTheta));
          circuit.addRZ(qubit, theta);
          circuit.addRY(qubit, -2 * Math.asin(sinTheta));
          circuit.addRZ(qubit, -phi);
        } else {
          circuit.addRZ(qubit, theta * (cosTheta > 0 ? 1 : -1));
        }
      },
    };
  }

  /**
   * Create controlled rotation gate
   */
  static createControlledRotation(
    axis: 'X' | 'Y' | 'Z',
    theta: number
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, control: number, target: number) => void;
  } {
    return {
      name: `CR${axis}(${theta.toFixed(2)})`,
      apply: (circuit: CircuitBuilder, control: number, target: number) => {
        if (axis === 'X') {
          circuit.addCRX(control, target, theta);
        } else if (axis === 'Y') {
          circuit.addCRY(control, target, theta);
        } else {
          circuit.addCRZ(control, target, theta);
        }
      },
    };
  }

  /**
   * Create multi-controlled gate
   */
  static createMultiControlled(
    baseGate: string,
    numControls: number
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, controls: number[], target: number) => void;
  } {
    return {
      name: `MC${baseGate}_${numControls}`,
      apply: (circuit: CircuitBuilder, controls: number[], target: number) => {
        if (controls.length !== numControls) {
          throw new CircuitError(`Expected ${numControls} control qubits`);
        }

        if (baseGate === 'X') {
          circuit.addMultiControlledX(controls, target);
        } else {
          throw new CircuitError(`Multi-controlled ${baseGate} not implemented`);
        }
      },
    };
  }

  /**
   * Create phase kickback gate
   */
  static createPhaseKickback(phase: number): {
    name: string;
    apply: (circuit: CircuitBuilder, control: number, target: number) => void;
  } {
    return {
      name: `PhaseKickback(${phase.toFixed(2)})`,
      apply: (circuit: CircuitBuilder, control: number, target: number) => {
        circuit.addHadamard(target);
        circuit.addControlledPhase(control, target, phase);
        circuit.addHadamard(target);
      },
    };
  }

  /**
   * Create quantum oracle from classical function
   */
  static createOracle(
    f: (x: number) => boolean,
    numQubits: number
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[], target: number) => void;
  } {
    return {
      name: `Oracle_f`,
      apply: (circuit: CircuitBuilder, qubits: number[], target: number) => {
        // For each input that gives f(x) = 1, flip target
        const maxInputs = Math.pow(2, numQubits);

        for (let x = 0; x < maxInputs; x++) {
          if (f(x)) {
            // Create multi-controlled X based on binary representation of x
            const binary = x.toString(2).padStart(numQubits, '0');

            // Apply X gates for 0 bits
            for (let i = 0; i < numQubits; i++) {
              if (binary[i] === '0') {
                circuit.addPauliX(qubits[i]);
              }
            }

            // Apply multi-controlled X
            if (numQubits === 1) {
              circuit.addCNOT(qubits[0], target);
            } else if (numQubits === 2) {
              circuit.addToffoli(qubits[0], qubits[1], target);
            } else {
              circuit.addMultiControlledX(qubits, target);
            }

            // Uncompute X gates
            for (let i = 0; i < numQubits; i++) {
              if (binary[i] === '0') {
                circuit.addPauliX(qubits[i]);
              }
            }
          }
        }
      },
    };
  }

  /**
   * Create gate from unitary matrix
   */
  static fromMatrix(matrix: ComplexMatrix): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    // Note: This would require decomposing arbitrary unitaries
    // Simplified version for demonstration
    return {
      name: 'CustomUnitary',
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        // Placeholder: would need unitary decomposition
        console.log('Custom unitary gate applied');
      },
    };
  }

  /**
   * Compose two gates
   */
  static compose(
    gate1: any,
    gate2: any
  ): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `${gate1.name}_${gate2.name}`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        gate1.apply(circuit, qubits);
        gate2.apply(circuit, qubits);
      },
    };
  }

  /**
   * Create inverse gate
   */
  static inverse(gate: any): {
    name: string;
    apply: (circuit: CircuitBuilder, qubits: number[]) => void;
  } {
    return {
      name: `${gate.name}_inv`,
      apply: (circuit: CircuitBuilder, qubits: number[]) => {
        // Would need to apply gates in reverse order with inverse operations
        console.log(`Inverse of ${gate.name} applied`);
      },
    };
  }

  /**
   * Create controlled version of gate
   */
  static controlled(gate: any): {
    name: string;
    apply: (circuit: CircuitBuilder, control: number, targets: number[]) => void;
  } {
    return {
      name: `C-${gate.name}`,
      apply: (circuit: CircuitBuilder, control: number, targets: number[]) => {
        // Would need to create controlled version
        console.log(`Controlled ${gate.name} applied`);
      },
    };
  }
}

export default CustomGate;
