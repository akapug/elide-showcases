/**
 * Recurrent Neural Networks for Game AI
 *
 * RNN architectures for sequential decision making:
 * - LSTM networks
 * - GRU networks
 * - Attention mechanisms
 * - Sequence processing for partial observability
 *
 * Demonstrates PyTorch recurrent layers in TypeScript
 * via Elide's seamless polyglot integration!
 */

// @ts-ignore - PyTorch for neural networks
import torch from 'python:torch';
// @ts-ignore - PyTorch neural network modules
import torch_nn from 'python:torch.nn';
// @ts-ignore - NumPy for array operations
import numpy from 'python:numpy';

// ============================================================================
// Type Definitions
// ============================================================================

export interface RNNConfig {
  inputSize: number;
  hiddenSize: number;
  numLayers?: number;
  outputSize?: number;
  rnnType?: 'lstm' | 'gru' | 'vanilla';
  bidirectional?: boolean;
  dropout?: number;
  device?: string;
}

export interface AttentionConfig {
  hiddenSize: number;
  numHeads?: number;
  dropout?: number;
}

// ============================================================================
// LSTM Network
// ============================================================================

export class LSTMNetwork {
  private lstm: any;
  private fc: any;
  private device: any;
  private config: Required<RNNConfig>;
  private hiddenState: any = null;
  private cellState: any = null;

  constructor(config: RNNConfig) {
    this.config = {
      numLayers: 2,
      outputSize: config.inputSize,
      rnnType: 'lstm',
      bidirectional: false,
      dropout: 0.0,
      device: 'cpu',
      ...config,
    };

    this.device = torch.device(this.config.device);

    // LSTM layer
    this.lstm = torch.nn.LSTM(
      input_size: this.config.inputSize,
      hidden_size: this.config.hiddenSize,
      num_layers: this.config.numLayers,
      batch_first: true,
      bidirectional: this.config.bidirectional,
      dropout: this.config.dropout
    );

    // Output layer
    const lstmOutputSize = this.config.bidirectional
      ? this.config.hiddenSize * 2
      : this.config.hiddenSize;

    this.fc = torch.nn.Linear(lstmOutputSize, this.config.outputSize);

    this.toDevice();

    console.log('[LSTMNetwork] Initialized');
    console.log(`  Input size: ${this.config.inputSize}`);
    console.log(`  Hidden size: ${this.config.hiddenSize}`);
    console.log(`  Num layers: ${this.config.numLayers}`);
    console.log(`  Bidirectional: ${this.config.bidirectional}`);
  }

  /**
   * Forward pass through LSTM
   */
  forward(x: any, hidden: any = null): { output: any; hidden: any } {
    if (!torch.is_tensor(x)) {
      x = torch.FloatTensor(x);
    }
    x = x.to(this.device);

    // Ensure 3D input: (batch, sequence, features)
    if (x.dim() === 2) {
      x = x.unsqueeze(1); // Add sequence dimension
    }

    // LSTM forward
    let output: any;
    let newHidden: any;

    if (hidden === null) {
      [output, newHidden] = this.lstm(x);
    } else {
      [output, newHidden] = this.lstm(x, hidden);
    }

    // Take last output
    const lastOutput = output[:, -1, :];

    // Fully connected layer
    const fcOutput = this.fc(lastOutput);

    return {
      output: fcOutput,
      hidden: newHidden,
    };
  }

  /**
   * Forward sequence (returns all outputs)
   */
  forwardSequence(x: any, hidden: any = null): { outputs: any; hidden: any } {
    if (!torch.is_tensor(x)) {
      x = torch.FloatTensor(x);
    }
    x = x.to(this.device);

    let output: any;
    let newHidden: any;

    if (hidden === null) {
      [output, newHidden] = this.lstm(x);
    } else {
      [output, newHidden] = this.lstm(x, hidden);
    }

    // Apply FC to all outputs
    const outputs = this.fc(output);

    return {
      outputs,
      hidden: newHidden,
    };
  }

  /**
   * Initialize hidden state
   */
  initHidden(batchSize: number): any {
    const numDirections = this.config.bidirectional ? 2 : 1;

    const h0 = torch.zeros([
      this.config.numLayers * numDirections,
      batchSize,
      this.config.hiddenSize,
    ]).to(this.device);

    const c0 = torch.zeros([
      this.config.numLayers * numDirections,
      batchSize,
      this.config.hiddenSize,
    ]).to(this.device);

    return [h0, c0];
  }

  /**
   * Reset hidden state
   */
  resetHidden(): void {
    this.hiddenState = null;
    this.cellState = null;
  }

  /**
   * Get parameters
   */
  getParameters(): any[] {
    return [
      ...Array.from(this.lstm.parameters()),
      ...Array.from(this.fc.parameters()),
    ];
  }

  /**
   * Get state dict
   */
  getStateDict(): any {
    return {
      lstm: this.lstm.state_dict(),
      fc: this.fc.state_dict(),
    };
  }

  /**
   * Load state dict
   */
  loadStateDict(stateDict: any): void {
    this.lstm.load_state_dict(stateDict.lstm);
    this.fc.load_state_dict(stateDict.fc);
  }

  private toDevice(): void {
    this.lstm.to(this.device);
    this.fc.to(this.device);
  }

  to(device: any): void {
    this.device = device;
    this.toDevice();
  }
}

// ============================================================================
// GRU Network
// ============================================================================

export class GRUNetwork {
  private gru: any;
  private fc: any;
  private device: any;
  private config: Required<RNNConfig>;

  constructor(config: RNNConfig) {
    this.config = {
      numLayers: 2,
      outputSize: config.inputSize,
      rnnType: 'gru',
      bidirectional: false,
      dropout: 0.0,
      device: 'cpu',
      ...config,
    };

    this.device = torch.device(this.config.device);

    // GRU layer
    this.gru = torch.nn.GRU(
      input_size: this.config.inputSize,
      hidden_size: this.config.hiddenSize,
      num_layers: this.config.numLayers,
      batch_first: true,
      bidirectional: this.config.bidirectional,
      dropout: this.config.dropout
    );

    // Output layer
    const gruOutputSize = this.config.bidirectional
      ? this.config.hiddenSize * 2
      : this.config.hiddenSize;

    this.fc = torch.nn.Linear(gruOutputSize, this.config.outputSize);

    this.toDevice();

    console.log('[GRUNetwork] Initialized');
    console.log(`  Input size: ${this.config.inputSize}`);
    console.log(`  Hidden size: ${this.config.hiddenSize}`);
    console.log(`  Num layers: ${this.config.numLayers}`);
  }

  forward(x: any, hidden: any = null): { output: any; hidden: any } {
    if (!torch.is_tensor(x)) {
      x = torch.FloatTensor(x);
    }
    x = x.to(this.device);

    if (x.dim() === 2) {
      x = x.unsqueeze(1);
    }

    let output: any;
    let newHidden: any;

    if (hidden === null) {
      [output, newHidden] = this.gru(x);
    } else {
      [output, newHidden] = this.gru(x, hidden);
    }

    const lastOutput = output[:, -1, :];
    const fcOutput = this.fc(lastOutput);

    return {
      output: fcOutput,
      hidden: newHidden,
    };
  }

  initHidden(batchSize: number): any {
    const numDirections = this.config.bidirectional ? 2 : 1;

    return torch.zeros([
      this.config.numLayers * numDirections,
      batchSize,
      this.config.hiddenSize,
    ]).to(this.device);
  }

  getParameters(): any[] {
    return [
      ...Array.from(this.gru.parameters()),
      ...Array.from(this.fc.parameters()),
    ];
  }

  getStateDict(): any {
    return {
      gru: this.gru.state_dict(),
      fc: this.fc.state_dict(),
    };
  }

  loadStateDict(stateDict: any): void {
    this.gru.load_state_dict(stateDict.gru);
    this.fc.load_state_dict(stateDict.fc);
  }

  private toDevice(): void {
    this.gru.to(this.device);
    this.fc.to(this.device);
  }

  to(device: any): void {
    this.device = device;
    this.toDevice();
  }
}

// ============================================================================
// Attention Mechanism
// ============================================================================

export class AttentionLayer {
  private queryLinear: any;
  private keyLinear: any;
  private valueLinear: any;
  private outputLinear: any;
  private config: Required<AttentionConfig>;
  private device: any;

  constructor(config: AttentionConfig) {
    this.config = {
      numHeads: 1,
      dropout: 0.0,
      ...config,
    };

    const hiddenSize = this.config.hiddenSize;

    // Linear projections for Q, K, V
    this.queryLinear = torch.nn.Linear(hiddenSize, hiddenSize);
    this.keyLinear = torch.nn.Linear(hiddenSize, hiddenSize);
    this.valueLinear = torch.nn.Linear(hiddenSize, hiddenSize);

    // Output projection
    this.outputLinear = torch.nn.Linear(hiddenSize, hiddenSize);

    this.device = torch.device('cpu');

    console.log('[AttentionLayer] Initialized');
    console.log(`  Hidden size: ${hiddenSize}`);
    console.log(`  Num heads: ${this.config.numHeads}`);
  }

  forward(query: any, key: any, value: any, mask: any = null): any {
    // Linear projections
    const Q = this.queryLinear(query);
    const K = this.keyLinear(key);
    const V = this.valueLinear(value);

    // Scaled dot-product attention
    const scores = torch.matmul(Q, K.transpose(-2, -1));
    const scaledScores = scores / Math.sqrt(this.config.hiddenSize);

    // Apply mask if provided
    if (mask !== null) {
      scaledScores.masked_fill_(mask === 0, -1e9);
    }

    // Softmax to get attention weights
    const attentionWeights = torch.nn.functional.softmax(scaledScores, dim: -1);

    // Apply attention to values
    const attended = torch.matmul(attentionWeights, V);

    // Output projection
    const output = this.outputLinear(attended);

    return output;
  }

  getParameters(): any[] {
    return [
      ...Array.from(this.queryLinear.parameters()),
      ...Array.from(this.keyLinear.parameters()),
      ...Array.from(this.valueLinear.parameters()),
      ...Array.from(this.outputLinear.parameters()),
    ];
  }

  to(device: any): void {
    this.device = device;
    this.queryLinear.to(device);
    this.keyLinear.to(device);
    this.valueLinear.to(device);
    this.outputLinear.to(device);
  }
}

// ============================================================================
// LSTM with Attention
// ============================================================================

export class LSTMWithAttention {
  private lstm: LSTMNetwork;
  private attention: AttentionLayer;
  private fc: any;
  private device: any;

  constructor(config: RNNConfig) {
    this.device = torch.device(config.device || 'cpu');

    // LSTM network
    this.lstm = new LSTMNetwork(config);

    // Attention layer
    this.attention = new AttentionLayer({
      hiddenSize: config.hiddenSize,
    });

    // Output layer
    this.fc = torch.nn.Linear(config.hiddenSize, config.outputSize || config.inputSize);

    this.fc.to(this.device);

    console.log('[LSTMWithAttention] Initialized');
  }

  forward(x: any, hidden: any = null): { output: any; hidden: any } {
    // Pass through LSTM
    const { outputs, hidden: newHidden } = this.lstm.forwardSequence(x, hidden);

    // Apply self-attention
    const attended = this.attention.forward(outputs, outputs, outputs);

    // Take last output
    const lastOutput = attended[:, -1, :];

    // Final output layer
    const output = this.fc(lastOutput);

    return {
      output,
      hidden: newHidden,
    };
  }

  getParameters(): any[] {
    return [
      ...this.lstm.getParameters(),
      ...this.attention.getParameters(),
      ...Array.from(this.fc.parameters()),
    ];
  }

  to(device: any): void {
    this.device = device;
    this.lstm.to(device);
    this.attention.to(device);
    this.fc.to(device);
  }
}

// ============================================================================
// Sequence-to-Sequence Model
// ============================================================================

export class Seq2SeqModel {
  private encoder: LSTMNetwork;
  private decoder: LSTMNetwork;
  private device: any;

  constructor(
    inputSize: number,
    hiddenSize: number,
    outputSize: number,
    device = 'cpu'
  ) {
    this.device = torch.device(device);

    // Encoder LSTM
    this.encoder = new LSTMNetwork({
      inputSize,
      hiddenSize,
      outputSize: hiddenSize,
      numLayers: 2,
      device,
    });

    // Decoder LSTM
    this.decoder = new LSTMNetwork({
      inputSize: outputSize,
      hiddenSize,
      outputSize,
      numLayers: 2,
      device,
    });

    console.log('[Seq2SeqModel] Initialized');
    console.log(`  Input size: ${inputSize}`);
    console.log(`  Hidden size: ${hiddenSize}`);
    console.log(`  Output size: ${outputSize}`);
  }

  forward(
    encoderInput: any,
    decoderInput: any
  ): { output: any; encoderHidden: any } {
    // Encode input sequence
    const { output: encoderOutput, hidden: encoderHidden } =
      this.encoder.forwardSequence(encoderInput);

    // Decode with encoder's final hidden state
    const { outputs: decoderOutput } =
      this.decoder.forwardSequence(decoderInput, encoderHidden);

    return {
      output: decoderOutput,
      encoderHidden,
    };
  }

  getParameters(): any[] {
    return [
      ...this.encoder.getParameters(),
      ...this.decoder.getParameters(),
    ];
  }

  to(device: any): void {
    this.device = device;
    this.encoder.to(device);
    this.decoder.to(device);
  }
}

// ============================================================================
// Bidirectional LSTM for Policy and Value
// ============================================================================

export class BidirectionalLSTMActorCritic {
  private lstm: LSTMNetwork;
  private actorHead: any;
  private criticHead: any;
  private device: any;

  constructor(
    inputSize: number,
    hiddenSize: number,
    actionSize: number,
    device = 'cpu'
  ) {
    this.device = torch.device(device);

    // Bidirectional LSTM
    this.lstm = new LSTMNetwork({
      inputSize,
      hiddenSize,
      outputSize: hiddenSize * 2, // Bidirectional doubles size
      numLayers: 2,
      bidirectional: true,
      device,
    });

    // Actor head (policy)
    this.actorHead = torch.nn.Sequential(
      torch.nn.Linear(hiddenSize * 2, hiddenSize),
      torch.nn.ReLU(),
      torch.nn.Linear(hiddenSize, actionSize),
      torch.nn.Softmax(dim: -1)
    );

    // Critic head (value function)
    this.criticHead = torch.nn.Sequential(
      torch.nn.Linear(hiddenSize * 2, hiddenSize),
      torch.nn.ReLU(),
      torch.nn.Linear(hiddenSize, 1)
    );

    this.actorHead.to(this.device);
    this.criticHead.to(this.device);

    console.log('[BidirectionalLSTMActorCritic] Initialized');
    console.log(`  Bidirectional LSTM with actor-critic heads`);
  }

  forward(x: any, hidden: any = null): {
    policy: any;
    value: any;
    hidden: any;
  } {
    // LSTM forward
    const { output: lstmOutput, hidden: newHidden } = this.lstm.forward(x, hidden);

    // Actor and critic heads
    const policy = this.actorHead(lstmOutput);
    const value = this.criticHead(lstmOutput).squeeze(-1);

    return {
      policy,
      value,
      hidden: newHidden,
    };
  }

  getParameters(): any[] {
    return [
      ...this.lstm.getParameters(),
      ...Array.from(this.actorHead.parameters()),
      ...Array.from(this.criticHead.parameters()),
    ];
  }

  to(device: any): void {
    this.device = device;
    this.lstm.to(device);
    this.actorHead.to(device);
    this.criticHead.to(device);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create RNN based on type
 */
export function createRNN(config: RNNConfig): LSTMNetwork | GRUNetwork {
  const rnnType = config.rnnType || 'lstm';

  if (rnnType === 'lstm') {
    return new LSTMNetwork(config);
  } else if (rnnType === 'gru') {
    return new GRUNetwork(config);
  }

  throw new Error(`Unknown RNN type: ${rnnType}`);
}

/**
 * Pack padded sequence (utility for variable-length sequences)
 */
export function packPaddedSequence(
  sequences: any[],
  lengths: number[]
): any {
  // Sort by length (descending)
  const sorted = sequences
    .map((seq, idx) => ({ seq, len: lengths[idx] }))
    .sort((a, b) => b.len - a.len);

  const sortedSequences = sorted.map(item => item.seq);
  const sortedLengths = sorted.map(item => item.len);

  // Stack sequences
  const packed = torch.nn.utils.rnn.pack_padded_sequence(
    torch.stack(sortedSequences),
    sortedLengths,
    batch_first: true
  );

  return packed;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Recurrent Neural Networks for Game AI\n');
  console.log('This demonstrates:');
  console.log('  - LSTM networks for sequential decisions');
  console.log('  - GRU networks for efficient processing');
  console.log('  - Attention mechanisms');
  console.log('  - Bidirectional processing');
  console.log('  - All using PyTorch in TypeScript!\n');

  // Create LSTM network
  const lstm = new LSTMNetwork({
    inputSize: 64,
    hiddenSize: 128,
    outputSize: 32,
    numLayers: 2,
    device: 'cpu',
  });

  console.log('✅ LSTM network created');

  // Create GRU network
  const gru = new GRUNetwork({
    inputSize: 64,
    hiddenSize: 128,
    outputSize: 32,
    numLayers: 2,
    device: 'cpu',
  });

  console.log('✅ GRU network created');

  // Create LSTM with attention
  const lstmAttention = new LSTMWithAttention({
    inputSize: 64,
    hiddenSize: 128,
    outputSize: 32,
    device: 'cpu',
  });

  console.log('✅ LSTM with attention created');

  console.log('\n🚀 RNNs ready for sequential RL training!');
  console.log('Perfect for partially observable environments and');
  console.log('long-term dependencies in game AI!');
}
