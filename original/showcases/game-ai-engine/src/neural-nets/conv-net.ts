/**
 * Convolutional Neural Networks for Game AI
 *
 * CNN architectures for processing visual game inputs:
 * - Nature DQN architecture (for Atari)
 * - ResNet blocks
 * - Spatial attention mechanisms
 * - Feature extraction layers
 *
 * Demonstrates PyTorch CNN layers seamlessly integrated
 * in TypeScript via Elide's polyglot capabilities!
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

export interface ConvNetConfig {
  inputChannels: number;
  inputHeight: number;
  inputWidth: number;
  numActions?: number;
  architecture?: 'nature' | 'impala' | 'resnet' | 'custom';
  device?: string;
}

export interface ResNetBlockConfig {
  inChannels: number;
  outChannels: number;
  stride?: number;
  downsample?: boolean;
}

// ============================================================================
// Nature DQN Architecture (Atari)
// ============================================================================

export class NatureDQN {
  private conv1: any;
  private conv2: any;
  private conv3: any;
  private fc1: any;
  private fc2: any;
  private device: any;
  private config: Required<ConvNetConfig>;

  constructor(config: ConvNetConfig) {
    this.config = {
      numActions: 18, // Default Atari action size
      architecture: 'nature',
      device: 'cpu',
      ...config,
    };

    this.device = torch.device(this.config.device);

    // Nature DQN architecture from "Human-level control through deep RL"
    // Input: 84x84x4 (stacked grayscale frames)

    // Conv layer 1: 32 filters, 8x8 kernel, stride 4
    this.conv1 = torch.nn.Conv2d(
      this.config.inputChannels,
      32,
      kernel_size: 8,
      stride: 4
    );

    // Conv layer 2: 64 filters, 4x4 kernel, stride 2
    this.conv2 = torch.nn.Conv2d(
      32,
      64,
      kernel_size: 4,
      stride: 2
    );

    // Conv layer 3: 64 filters, 3x3 kernel, stride 1
    this.conv3 = torch.nn.Conv2d(
      64,
      64,
      kernel_size: 3,
      stride: 1
    );

    // Calculate flattened size after convolutions
    const flattenedSize = this.calculateFlattenedSize();

    // Fully connected layers
    this.fc1 = torch.nn.Linear(flattenedSize, 512);
    this.fc2 = torch.nn.Linear(512, this.config.numActions);

    // Move to device
    this.toDevice();

    console.log('[NatureDQN] Initialized');
    console.log(`  Input shape: ${this.config.inputChannels}x${this.config.inputHeight}x${this.config.inputWidth}`);
    console.log(`  Flattened size: ${flattenedSize}`);
    console.log(`  Output actions: ${this.config.numActions}`);
  }

  /**
   * Forward pass
   */
  forward(x: any): any {
    // Ensure input is on correct device
    if (!torch.is_tensor(x)) {
      x = torch.FloatTensor(x);
    }
    x = x.to(this.device);

    // Conv layers with ReLU activations
    x = torch.nn.functional.relu(this.conv1(x));
    x = torch.nn.functional.relu(this.conv2(x));
    x = torch.nn.functional.relu(this.conv3(x));

    // Flatten
    x = x.flatten(start_dim: 1);

    // Fully connected layers
    x = torch.nn.functional.relu(this.fc1(x));
    x = this.fc2(x);

    return x;
  }

  /**
   * Calculate size after convolutions
   */
  private calculateFlattenedSize(): number {
    // Create dummy input to calculate output size
    const dummyInput = torch.zeros([1, this.config.inputChannels, this.config.inputHeight, this.config.inputWidth]);
    let x = dummyInput;

    x = this.conv1(x);
    x = this.conv2(x);
    x = this.conv3(x);

    return Number(x.flatten(start_dim: 1).shape[1]);
  }

  /**
   * Get parameters for optimizer
   */
  getParameters(): any[] {
    return [
      ...Array.from(this.conv1.parameters()),
      ...Array.from(this.conv2.parameters()),
      ...Array.from(this.conv3.parameters()),
      ...Array.from(this.fc1.parameters()),
      ...Array.from(this.fc2.parameters()),
    ];
  }

  /**
   * Get state dict for saving
   */
  getStateDict(): any {
    return {
      conv1: this.conv1.state_dict(),
      conv2: this.conv2.state_dict(),
      conv3: this.conv3.state_dict(),
      fc1: this.fc1.state_dict(),
      fc2: this.fc2.state_dict(),
    };
  }

  /**
   * Load state dict
   */
  loadStateDict(stateDict: any): void {
    this.conv1.load_state_dict(stateDict.conv1);
    this.conv2.load_state_dict(stateDict.conv2);
    this.conv3.load_state_dict(stateDict.conv3);
    this.fc1.load_state_dict(stateDict.fc1);
    this.fc2.load_state_dict(stateDict.fc2);
  }

  /**
   * Move network to device
   */
  private toDevice(): void {
    this.conv1.to(this.device);
    this.conv2.to(this.device);
    this.conv3.to(this.device);
    this.fc1.to(this.device);
    this.fc2.to(this.device);
  }

  to(device: any): void {
    this.device = device;
    this.toDevice();
  }
}

// ============================================================================
// ResNet Block
// ============================================================================

export class ResNetBlock {
  private conv1: any;
  private bn1: any;
  private conv2: any;
  private bn2: any;
  private downsample: any | null = null;
  private stride: number;

  constructor(config: ResNetBlockConfig) {
    const stride = config.stride || 1;
    this.stride = stride;

    // First convolution
    this.conv1 = torch.nn.Conv2d(
      config.inChannels,
      config.outChannels,
      kernel_size: 3,
      stride: stride,
      padding: 1,
      bias: false
    );
    this.bn1 = torch.nn.BatchNorm2d(config.outChannels);

    // Second convolution
    this.conv2 = torch.nn.Conv2d(
      config.outChannels,
      config.outChannels,
      kernel_size: 3,
      stride: 1,
      padding: 1,
      bias: false
    );
    this.bn2 = torch.nn.BatchNorm2d(config.outChannels);

    // Downsample if needed
    if (config.downsample || stride !== 1 || config.inChannels !== config.outChannels) {
      this.downsample = torch.nn.Sequential(
        torch.nn.Conv2d(
          config.inChannels,
          config.outChannels,
          kernel_size: 1,
          stride: stride,
          bias: false
        ),
        torch.nn.BatchNorm2d(config.outChannels)
      );
    }
  }

  forward(x: any): any {
    const identity = x;

    // First conv + bn + relu
    let out = this.conv1(x);
    out = this.bn1(out);
    out = torch.nn.functional.relu(out);

    // Second conv + bn
    out = this.conv2(out);
    out = this.bn2(out);

    // Downsample residual if needed
    let residual = identity;
    if (this.downsample !== null) {
      residual = this.downsample(identity);
    }

    // Add residual connection
    out = out + residual;
    out = torch.nn.functional.relu(out);

    return out;
  }

  getParameters(): any[] {
    const params = [
      ...Array.from(this.conv1.parameters()),
      ...Array.from(this.bn1.parameters()),
      ...Array.from(this.conv2.parameters()),
      ...Array.from(this.bn2.parameters()),
    ];

    if (this.downsample !== null) {
      params.push(...Array.from(this.downsample.parameters()));
    }

    return params;
  }

  to(device: any): void {
    this.conv1.to(device);
    this.bn1.to(device);
    this.conv2.to(device);
    this.bn2.to(device);
    if (this.downsample !== null) {
      this.downsample.to(device);
    }
  }
}

// ============================================================================
// ResNet-based Feature Extractor
// ============================================================================

export class ResNetFeatureExtractor {
  private conv1: any;
  private bn1: any;
  private layer1: ResNetBlock[] = [];
  private layer2: ResNetBlock[] = [];
  private layer3: ResNetBlock[] = [];
  private avgPool: any;
  private device: any;

  constructor(inputChannels: number, device = 'cpu') {
    this.device = torch.device(device);

    // Initial convolution
    this.conv1 = torch.nn.Conv2d(
      inputChannels,
      64,
      kernel_size: 7,
      stride: 2,
      padding: 3,
      bias: false
    );
    this.bn1 = torch.nn.BatchNorm2d(64);

    // ResNet layers
    this.layer1 = this.makeLayer(64, 64, 2, 1);
    this.layer2 = this.makeLayer(64, 128, 2, 2);
    this.layer3 = this.makeLayer(128, 256, 2, 2);

    // Global average pooling
    this.avgPool = torch.nn.AdaptiveAvgPool2d([1, 1]);

    this.toDevice();

    console.log('[ResNetFeatureExtractor] Initialized');
  }

  private makeLayer(
    inChannels: number,
    outChannels: number,
    numBlocks: number,
    stride: number
  ): ResNetBlock[] {
    const layers: ResNetBlock[] = [];

    // First block (may downsample)
    layers.push(
      new ResNetBlock({
        inChannels,
        outChannels,
        stride,
        downsample: true,
      })
    );

    // Remaining blocks
    for (let i = 1; i < numBlocks; i++) {
      layers.push(
        new ResNetBlock({
          inChannels: outChannels,
          outChannels,
          stride: 1,
        })
      );
    }

    return layers;
  }

  forward(x: any): any {
    if (!torch.is_tensor(x)) {
      x = torch.FloatTensor(x);
    }
    x = x.to(this.device);

    // Initial conv
    x = this.conv1(x);
    x = this.bn1(x);
    x = torch.nn.functional.relu(x);
    x = torch.nn.functional.max_pool2d(x, kernel_size: 3, stride: 2, padding: 1);

    // ResNet layers
    for (const block of this.layer1) {
      x = block.forward(x);
    }
    for (const block of this.layer2) {
      x = block.forward(x);
    }
    for (const block of this.layer3) {
      x = block.forward(x);
    }

    // Global average pooling
    x = this.avgPool(x);
    x = x.flatten(start_dim: 1);

    return x;
  }

  getOutputSize(): number {
    return 256; // Output channels from layer3
  }

  getParameters(): any[] {
    let params = [
      ...Array.from(this.conv1.parameters()),
      ...Array.from(this.bn1.parameters()),
    ];

    for (const block of this.layer1) {
      params.push(...block.getParameters());
    }
    for (const block of this.layer2) {
      params.push(...block.getParameters());
    }
    for (const block of this.layer3) {
      params.push(...block.getParameters());
    }

    return params;
  }

  private toDevice(): void {
    this.conv1.to(this.device);
    this.bn1.to(this.device);

    for (const block of this.layer1) {
      block.to(this.device);
    }
    for (const block of this.layer2) {
      block.to(this.device);
    }
    for (const block of this.layer3) {
      block.to(this.device);
    }

    this.avgPool.to(this.device);
  }

  to(device: any): void {
    this.device = device;
    this.toDevice();
  }
}

// ============================================================================
// IMPALA Architecture (Scalable RL)
// ============================================================================

export class IMPALANetwork {
  private blocks: any[] = [];
  private fc: any;
  private device: any;

  constructor(inputChannels: number, numActions: number, device = 'cpu') {
    this.device = torch.device(device);

    // IMPALA uses residual blocks with different channel sizes
    const channels = [16, 32, 32];

    let inChannels = inputChannels;
    for (const outChannels of channels) {
      this.blocks.push(this.makeResidualBlock(inChannels, outChannels));
      inChannels = outChannels;
    }

    // Calculate flattened size
    const flattenedSize = this.calculateFlattenedSize(inputChannels);

    // Fully connected layer
    this.fc = torch.nn.Linear(flattenedSize, 256);

    this.toDevice();

    console.log('[IMPALANetwork] Initialized');
    console.log(`  Blocks: ${channels.length}`);
    console.log(`  Flattened size: ${flattenedSize}`);
  }

  private makeResidualBlock(inChannels: number, outChannels: number): any {
    return torch.nn.Sequential(
      torch.nn.Conv2d(inChannels, outChannels, kernel_size: 3, padding: 1),
      torch.nn.ReLU(),
      torch.nn.Conv2d(outChannels, outChannels, kernel_size: 3, padding: 1),
      torch.nn.MaxPool2d(kernel_size: 3, stride: 2, padding: 1)
    );
  }

  forward(x: any): any {
    if (!torch.is_tensor(x)) {
      x = torch.FloatTensor(x);
    }
    x = x.to(this.device);

    for (const block of this.blocks) {
      x = block(x);
    }

    x = x.flatten(start_dim: 1);
    x = torch.nn.functional.relu(this.fc(x));

    return x;
  }

  private calculateFlattenedSize(inputChannels: number): number {
    // Assume 84x84 input
    const dummyInput = torch.zeros([1, inputChannels, 84, 84]);
    let x = dummyInput;

    for (const block of this.blocks) {
      x = block(x);
    }

    return Number(x.flatten(start_dim: 1).shape[1]);
  }

  getParameters(): any[] {
    let params: any[] = [];

    for (const block of this.blocks) {
      params.push(...Array.from(block.parameters()));
    }

    params.push(...Array.from(this.fc.parameters()));

    return params;
  }

  private toDevice(): void {
    for (const block of this.blocks) {
      block.to(this.device);
    }
    this.fc.to(this.device);
  }

  to(device: any): void {
    this.device = device;
    this.toDevice();
  }
}

// ============================================================================
// Spatial Attention Module
// ============================================================================

export class SpatialAttention {
  private conv: any;
  private sigmoid: any;

  constructor() {
    // Spatial attention using convolution
    this.conv = torch.nn.Conv2d(2, 1, kernel_size: 7, padding: 3, bias: false);
    this.sigmoid = torch.nn.Sigmoid();
  }

  forward(x: any): any {
    // Average and max pooling across channels
    const avgOut = torch.mean(x, dim: 1, keepdim: true);
    const maxOut = torch.max(x, dim: 1, keepdim: true)[0];

    // Concatenate along channel dimension
    const combined = torch.cat([avgOut, maxOut], dim: 1);

    // Apply convolution and sigmoid
    const attention = this.sigmoid(this.conv(combined));

    // Apply attention to input
    return x * attention;
  }

  getParameters(): any[] {
    return Array.from(this.conv.parameters());
  }

  to(device: any): void {
    this.conv.to(device);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create feature extractor based on architecture name
 */
export function createFeatureExtractor(
  architecture: string,
  inputChannels: number,
  device = 'cpu'
): NatureDQN | ResNetFeatureExtractor | IMPALANetwork {
  if (architecture === 'nature') {
    return new NatureDQN({
      inputChannels,
      inputHeight: 84,
      inputWidth: 84,
      device,
    });
  } else if (architecture === 'resnet') {
    return new ResNetFeatureExtractor(inputChannels, device);
  } else if (architecture === 'impala') {
    return new IMPALANetwork(inputChannels, 18, device);
  }

  throw new Error(`Unknown architecture: ${architecture}`);
}

/**
 * Calculate output size after conv layers
 */
export function calculateConvOutputSize(
  inputSize: number,
  kernelSize: number,
  stride: number,
  padding = 0
): number {
  return Math.floor((inputSize + 2 * padding - kernelSize) / stride + 1);
}

/**
 * Initialize conv layer weights using He initialization
 */
export function initializeConvWeights(layer: any): void {
  torch.nn.init.kaiming_normal_(layer.weight, mode: 'fan_out', nonlinearity: 'relu');
  if (layer.bias !== null) {
    torch.nn.init.constant_(layer.bias, 0);
  }
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Convolutional Neural Networks for Game AI\n');
  console.log('This demonstrates:');
  console.log('  - Nature DQN architecture (Atari)');
  console.log('  - ResNet blocks with residual connections');
  console.log('  - IMPALA architecture for scalable RL');
  console.log('  - Spatial attention mechanisms');
  console.log('  - All using PyTorch in TypeScript!\n');

  // Create Nature DQN
  const natureDQN = new NatureDQN({
    inputChannels: 4,
    inputHeight: 84,
    inputWidth: 84,
    numActions: 18,
    device: 'cpu',
  });

  console.log('✅ Nature DQN created');

  // Create ResNet feature extractor
  const resnet = new ResNetFeatureExtractor(4, 'cpu');
  console.log('✅ ResNet feature extractor created');

  // Create IMPALA network
  const impala = new IMPALANetwork(4, 18, 'cpu');
  console.log('✅ IMPALA network created');

  console.log('\n🚀 CNNs ready for visual RL training!');
  console.log('These architectures can process game frames and learn');
  console.log('directly from pixels, all in TypeScript via Elide!');
}
