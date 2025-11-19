/**
 * Quantum Computing Platform - Comprehensive Demos
 *
 * Demonstrates all major features of the quantum computing platform including
 * algorithms, simulations, optimization, and error correction.
 */

import { CircuitBuilder, createBellState, createGHZState } from '../src/circuits/circuit-builder';
import { GroverSearch } from '../src/algorithms/grover';
import { ShorFactoring } from '../src/algorithms/shor';
import { QuantumTeleportation } from '../src/algorithms/quantum-teleportation';
import { VQE } from '../src/algorithms/vqe';
import { QuantumSimulator } from '../src/simulation/simulator';
import { QAOA } from '../src/optimization/qaoa';
import { CustomGate } from '../src/gates/custom-gates';
import { NoiseModel } from '../src/noise/noise-models';

/**
 * Demo 1: Bell State and Entanglement
 */
async function demoBellState() {
  console.log('\n========================================');
  console.log('Demo 1: Bell State and Entanglement');
  console.log('========================================\n');

  const circuit = createBellState();

  console.log('Created Bell state circuit:');
  console.log(circuit.drawText());

  const simulator = new QuantumSimulator({ backend: 'qasm', shots: 1024 });
  const result = await simulator.simulate(circuit);

  console.log('\nMeasurement results:');
  result.counts.forEach((count, bitstring) => {
    const percentage = ((count / 1024) * 100).toFixed(1);
    console.log(`  |${bitstring}⟩: ${count} (${percentage}%)`);
  });

  console.log('\nExpected: ~50% |00⟩ and ~50% |11⟩ (perfect entanglement)');
}

/**
 * Demo 2: Grover's Search Algorithm
 */
async function demoGroverSearch() {
  console.log('\n========================================');
  console.log('Demo 2: Grover\'s Search Algorithm');
  console.log('========================================\n');

  // Search in 4-item database
  const database = ['00', '01', '10', '11'];
  const target = '10';

  console.log(`Database: [${database.join(', ')}]`);
  console.log(`Target: ${target}\n`);

  const grover = new GroverSearch(database);
  const info = grover.getDatabaseInfo();

  console.log(`Qubits required: ${info.qubits}`);
  console.log(`Optimal iterations: ${info.optimalIterations}`);
  console.log(`Quantum speedup: ~${info.speedup.toFixed(1)}x\n`);

  console.log('Running Grover search...');
  const result = await grover.search(target);

  console.log(`\nFound: ${result.target}`);
  console.log(`Probability: ${(result.probability * 100).toFixed(1)}%`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
  console.log(`Time: ${result.executionTime}ms`);

  // Visualize amplitude amplification
  console.log('\nAmplitude amplification demonstration:');
  await grover.visualizeSearch(target);
}

/**
 * Demo 3: Shor's Factoring Algorithm
 */
async function demoShorFactoring() {
  console.log('\n========================================');
  console.log('Demo 3: Shor\'s Factoring Algorithm');
  console.log('========================================\n');

  const numbersToFactor = [15, 21, 35];

  for (const n of numbersToFactor) {
    console.log(`\nFactoring ${n}...`);

    try {
      const shor = new ShorFactoring(n);
      const requirements = shor.getRequirements();

      console.log(`  Qubits required: ${requirements.qubits}`);
      console.log(`  Circuit complexity: ${requirements.complexity}`);

      const result = await shor.factor({ simplified: true });

      console.log(`  Factors: ${result.factors.join(' × ')}`);
      console.log(`  Verification: ${result.factors[0]} × ${result.factors[1]} = ${n}`);
      console.log(`  Time: ${result.executionTime}ms`);
    } catch (error) {
      console.error(`  Error: ${error}`);
    }
  }

  // Demonstrate quantum advantage
  console.log('\n\nQuantum Advantage:');
  const advantage = ShorFactoring.demonstrateQuantumAdvantage(2048);
  console.log(`  For 2048-bit numbers:`);
  console.log(`  Classical: ${advantage.classical}`);
  console.log(`  Quantum: ${advantage.quantum}`);
  console.log(`  Speedup: ${advantage.speedup}`);
}

/**
 * Demo 4: Quantum Teleportation
 */
async function demoQuantumTeleportation() {
  console.log('\n========================================');
  console.log('Demo 4: Quantum Teleportation');
  console.log('========================================\n');

  const teleport = new QuantumTeleportation();

  // Teleport different quantum states
  const states = [
    { name: '|0⟩', state: [1, 0] as [number, number] },
    { name: '|1⟩', state: [0, 1] as [number, number] },
    { name: '|+⟩', state: [0.707, 0.707] as [number, number] },
    { name: '|ψ⟩ = 0.6|0⟩ + 0.8|1⟩', state: [0.6, 0.8] as [number, number] },
  ];

  console.log('Teleporting quantum states:\n');

  for (const { name, state } of states) {
    const result = await teleport.teleport(state);

    console.log(`${name}:`);
    console.log(`  Fidelity: ${(result.fidelity * 100).toFixed(1)}%`);
    console.log(`  Classical bits sent: ${result.classicalBits}`);
    console.log(`  Time: ${result.executionTime}ms\n`);
  }

  // Show protocol details
  const stats = teleport.getProtocolStats();
  console.log('Protocol Statistics:');
  console.log(`  Qubits: ${stats.qubits}`);
  console.log(`  Classical bits: ${stats.classicalBits}`);
  console.log(`  Entangled pairs: ${stats.entangledPairs}`);
  console.log(`  Measurements: ${stats.measurements}`);
}

/**
 * Demo 5: VQE for Molecular Ground States
 */
async function demoVQE() {
  console.log('\n========================================');
  console.log('Demo 5: VQE - Molecular Ground States');
  console.log('========================================\n');

  // H2 molecule at different distances
  const distances = [0.5, 0.735, 1.0, 1.5];

  console.log('Finding H₂ ground state at different bond lengths:\n');

  for (const distance of distances) {
    const vqe = new VQE({
      molecule: 'H2',
      distance,
      basis: 'sto3g',
      maxIterations: 50,
    });

    console.log(`\nH-H distance: ${distance}Å`);

    const result = await vqe.findGroundState();

    console.log(`  Ground state energy: ${result.energy.toFixed(6)} Ha`);
    console.log(`  Converged: ${result.converged ? 'Yes' : 'No'}`);
    console.log(`  Iterations: ${result.iterations}`);
    console.log(`  Time: ${result.executionTime}ms`);
  }

  // Visualize optimization for equilibrium distance
  console.log('\n\nOptimization progress at equilibrium (0.735Å):');

  const vqe = new VQE({
    molecule: 'H2',
    distance: 0.735,
    basis: 'sto3g',
    maxIterations: 30,
    callback: async (iter, energy, params) => {
      if (iter % 5 === 0) {
        console.log(`  Iteration ${iter}: Energy = ${energy.toFixed(6)} Ha`);
      }
    },
  });

  await vqe.findGroundState();
  console.log(vqe.visualizeEnergyLandscape());
}

/**
 * Demo 6: QAOA for Combinatorial Optimization
 */
async function demoQAOA() {
  console.log('\n========================================');
  console.log('Demo 6: QAOA - MaxCut Problem');
  console.log('========================================\n');

  // Define a graph
  const graph = {
    nodes: 4,
    edges: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [0, 2],
    ] as Array<[number, number]>,
  };

  console.log('Graph:');
  console.log(`  Nodes: ${graph.nodes}`);
  console.log(`  Edges: ${graph.edges.map(e => `(${e[0]},${e[1]})`).join(', ')}`);
  console.log(`  Max possible cut: ${graph.edges.length}\n`);

  // Try different QAOA depths
  for (const layers of [1, 2, 3]) {
    console.log(`\nQAOA with p = ${layers} layers:`);

    const qaoa = new QAOA({
      problem: 'maxcut',
      graph,
      layers,
      maxIterations: 20,
      callback: async (iter, cost, params) => {
        if (iter % 5 === 0) {
          console.log(`  Iteration ${iter}: Cost = ${cost.toFixed(4)}`);
        }
      },
    });

    const result = await qaoa.optimize();

    console.log(`  Best partition: ${result.solution}`);
    console.log(`  Cut size: ${Math.abs(result.objectiveValue)}`);
    console.log(`  Approximation ratio: ${(result.approximationRatio * 100).toFixed(1)}%`);
    console.log(`  Time: ${result.executionTime}ms`);
  }
}

/**
 * Demo 7: Custom Quantum Gates
 */
async function demoCustomGates() {
  console.log('\n========================================');
  console.log('Demo 7: Custom Quantum Gates');
  console.log('========================================\n');

  const circuit = new CircuitBuilder(4, 4);

  console.log('Applying custom gates:\n');

  // QFT
  console.log('1. Quantum Fourier Transform (4 qubits)');
  const qft = CustomGate.createQFT(4);
  qft.apply(circuit, [0, 1, 2, 3]);

  // GHZ state
  console.log('2. GHZ State Preparation');
  const ghz = CustomGate.createGHZState(3);
  ghz.apply(circuit, [0, 1, 2]);

  // W state
  console.log('3. W State Preparation');
  const wState = CustomGate.createWState(3);
  wState.apply(circuit, [1, 2, 3]);

  // Toffoli
  console.log('4. Toffoli (CCX) Gate');
  const toffoli = CustomGate.createToffoli();
  toffoli.apply(circuit, [0, 1, 2]);

  console.log('\nCircuit properties:');
  const props = circuit.properties();
  console.log(`  Depth: ${props.depth}`);
  console.log(`  Gate count: ${props.gateCount}`);
  console.log(`  Two-qubit gates: ${props.twoQubitGates}`);
}

/**
 * Demo 8: Noise Modeling and Mitigation
 */
async function demoNoise() {
  console.log('\n========================================');
  console.log('Demo 8: Noise Modeling');
  console.log('========================================\n');

  // Create a test circuit
  const circuit = new CircuitBuilder(3, 3);
  for (let i = 0; i < 5; i++) {
    circuit.addHadamard(0);
    circuit.addCNOT(0, 1);
    circuit.addCNOT(1, 2);
  }
  circuit.measureAll();

  console.log('Test circuit with 5 layers of H-CNOT-CNOT\n');

  // Ideal simulation
  console.log('1. Ideal (noiseless) simulation:');
  const idealSim = new QuantumSimulator({ backend: 'qasm', shots: 1024 });
  const idealResult = await idealSim.simulate(circuit);

  let maxIdeal = 0;
  let maxIdealState = '';
  idealResult.counts.forEach((count, state) => {
    if (count > maxIdeal) {
      maxIdeal = count;
      maxIdealState = state;
    }
  });
  console.log(`  Most frequent: |${maxIdealState}⟩ (${maxIdeal} counts)`);

  // Realistic noise
  console.log('\n2. Realistic noise (IBM hardware):');
  const realisticNoise = NoiseModel.createRealistic({
    gateError: 0.001,
    measurementError: 0.01,
  });

  const noisySim = new QuantumSimulator({
    backend: 'qasm',
    shots: 1024,
    noise_model: realisticNoise,
  });

  console.log('  Gate error: 0.1%');
  console.log('  Measurement error: 1%');

  // High noise
  console.log('\n3. High noise:');
  const highNoise = NoiseModel.createHighNoise();

  const highNoiseSim = new QuantumSimulator({
    backend: 'qasm',
    shots: 1024,
    noise_model: highNoise,
  });

  console.log('  Gate error: 5%');
  console.log('  Measurement error: 10%');
}

/**
 * Demo 9: Quantum Simulation Backends
 */
async function demoBackends() {
  console.log('\n========================================');
  console.log('Demo 9: Simulation Backends');
  console.log('========================================\n');

  const circuit = new CircuitBuilder(3, 3);
  circuit.addHadamard(0);
  circuit.addCNOT(0, 1);
  circuit.addCNOT(1, 2);
  circuit.measureAll();

  const backends: Array<'statevector' | 'qasm' | 'unitary'> = ['statevector', 'qasm', 'unitary'];

  for (const backend of backends) {
    console.log(`\n${backend.toUpperCase()} Backend:`);

    const simulator = new QuantumSimulator({ backend });
    const info = simulator.getBackendInfo();

    console.log(`  Max qubits: ${info.maxQubits}`);
    console.log(`  Features: ${info.supportedFeatures.join(', ')}`);

    const memEstimate = simulator.estimateMemory(20);
    console.log(`  Memory for 20 qubits: ${memEstimate.megabytes.toFixed(1)} MB`);

    if (backend !== 'unitary') {
      const startTime = Date.now();
      const result = await simulator.simulate(circuit);
      const time = Date.now() - startTime;

      console.log(`  Execution time: ${time}ms`);
      console.log(`  Success: ${result.success ? 'Yes' : 'No'}`);
    }
  }
}

/**
 * Demo 10: Quantum Algorithm Comparison
 */
async function demoAlgorithmComparison() {
  console.log('\n========================================');
  console.log('Demo 10: Algorithm Performance Comparison');
  console.log('========================================\n');

  console.log('Comparing quantum algorithms:\n');

  const results = [];

  // Grover
  console.log('1. Grover Search (16-item database):');
  const groverStart = Date.now();
  const database = GroverSearch.generateRandomDatabase(16);
  const grover = new GroverSearch(database);
  const groverResult = await grover.search(database[5]);
  const groverTime = Date.now() - groverStart;

  results.push({
    algorithm: 'Grover',
    qubits: 4,
    time: groverTime,
    success: groverResult.probability > 0.9,
  });

  console.log(`  Time: ${groverTime}ms`);
  console.log(`  Success probability: ${(groverResult.probability * 100).toFixed(1)}%\n`);

  // Shor
  console.log('2. Shor Factoring (15):');
  const shorStart = Date.now();
  const shor = new ShorFactoring(15);
  const shorResult = await shor.factor({ simplified: true });
  const shorTime = Date.now() - shorStart;

  results.push({
    algorithm: 'Shor',
    qubits: shor.getRequirements().qubits,
    time: shorTime,
    success: ShorFactoring.verifyFactorization(15, shorResult.factors),
  });

  console.log(`  Time: ${shorTime}ms`);
  console.log(`  Factors: ${shorResult.factors.join(' × ')}\n`);

  // Summary
  console.log('\nSummary:');
  console.log('Algorithm    Qubits  Time(ms)  Success');
  console.log('----------  ------  --------  -------');
  results.forEach(r => {
    console.log(
      `${r.algorithm.padEnd(10)}  ${r.qubits.toString().padStart(6)}  ` +
        `${r.time.toString().padStart(8)}  ${r.success ? 'Yes' : 'No'}`
    );
  });
}

/**
 * Main demo runner
 */
async function runAllDemos() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  Quantum Computing Platform - Comprehensive Demonstrations  ║');
  console.log('║  Powered by Elide Polyglot TypeScript/Python Integration  ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const demos = [
    { name: 'Bell State', fn: demoBellState },
    { name: 'Grover Search', fn: demoGroverSearch },
    { name: 'Shor Factoring', fn: demoShorFactoring },
    { name: 'Quantum Teleportation', fn: demoQuantumTeleportation },
    { name: 'VQE', fn: demoVQE },
    { name: 'QAOA', fn: demoQAOA },
    { name: 'Custom Gates', fn: demoCustomGates },
    { name: 'Noise Modeling', fn: demoNoise },
    { name: 'Simulation Backends', fn: demoBackends },
    { name: 'Algorithm Comparison', fn: demoAlgorithmComparison },
  ];

  for (const demo of demos) {
    try {
      await demo.fn();
    } catch (error) {
      console.error(`\nError in ${demo.name}:`, error);
    }
  }

  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║  All demonstrations completed!                             ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');
}

// Run all demos if executed directly
if (require.main === module) {
  runAllDemos().catch(console.error);
}

export {
  demoBellState,
  demoGroverSearch,
  demoShorFactoring,
  demoQuantumTeleportation,
  demoVQE,
  demoQAOA,
  demoCustomGates,
  demoNoise,
  demoBackends,
  demoAlgorithmComparison,
  runAllDemos,
};
