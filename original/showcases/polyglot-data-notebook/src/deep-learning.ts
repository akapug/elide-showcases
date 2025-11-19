/**
 * Deep Learning with PyTorch and TensorFlow in TypeScript
 *
 * This module demonstrates building and training neural networks
 * using PyTorch and TensorFlow directly in TypeScript through Elide's polyglot syntax.
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - Polyglot Magic!
// ============================================================================

// @ts-ignore
import torch from 'python:torch';
// @ts-ignore
import torch_nn from 'python:torch.nn';
// @ts-ignore
import torch_optim from 'python:torch.optim';
// @ts-ignore
import torch_functional from 'python:torch.nn.functional';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';

/**
 * PyTorch Neural Networks
 */
class PyTorchNetworks {
  /**
   * Simple feedforward neural network
   */
  static feedforwardNetwork(): void {
    console.log('=== PyTorch Feedforward Network ===\n');

    // Define network architecture
    class SimpleNet {
      private model: any;

      constructor(inputSize: number, hiddenSize: number, outputSize: number) {
        this.model = torch_nn.Sequential(
          torch_nn.Linear(inputSize, hiddenSize),
          torch_nn.ReLU(),
          torch_nn.Dropout(0.2),
          torch_nn.Linear(hiddenSize, hiddenSize),
          torch_nn.ReLU(),
          torch_nn.Dropout(0.2),
          torch_nn.Linear(hiddenSize, outputSize)
        );
      }

      forward(x: any): any {
        return this.model(x);
      }

      getModel(): any {
        return this.model;
      }
    }

    // Create synthetic data
    const n_samples = 1000;
    const n_features = 20;
    const n_classes = 3;

    const X = torch.randn([n_samples, n_features]);
    const y = torch.randint(0, n_classes, [n_samples]);

    // Split data
    const split_idx = Math.floor(n_samples * 0.8);
    const X_train = X.slice([0, split_idx]);
    const X_test = X.slice([split_idx, n_samples]);
    const y_train = y.slice([0, split_idx]);
    const y_test = y.slice([split_idx, n_samples]);

    // Create model
    const model = new SimpleNet(n_features, 64, n_classes);
    const criterion = torch_nn.CrossEntropyLoss();
    const optimizer = torch_optim.Adam(model.getModel().parameters(), { lr: 0.001 });

    // Training loop
    const epochs = 50;
    console.log('Training feedforward network...\n');

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Forward pass
      const outputs = model.forward(X_train);
      const loss = criterion(outputs, y_train);

      // Backward pass and optimization
      optimizer.zero_grad();
      loss.backward();
      optimizer.step();

      if ((epoch + 1) % 10 === 0) {
        console.log(`Epoch ${epoch + 1}/${epochs}, Loss: ${loss.item().toFixed(4)}`);
      }
    }

    // Evaluation
    const with_no_grad = torch.no_grad();
    with_no_grad.__enter__();

    const test_outputs = model.forward(X_test);
    const predictions = torch.argmax(test_outputs, { dim: 1 });
    const accuracy = (predictions.eq(y_test).sum().item() / y_test.size(0)) * 100;

    with_no_grad.__exit__(null, null, null);

    console.log(`\nTest Accuracy: ${accuracy.toFixed(2)}%`);
  }

  /**
   * Convolutional Neural Network
   */
  static convolutionalNetwork(): void {
    console.log('\n=== PyTorch Convolutional Network ===\n');

    // Define CNN architecture
    class ConvNet {
      private model: any;

      constructor() {
        this.model = torch_nn.Sequential(
          // Conv layer 1
          torch_nn.Conv2d(1, 32, { kernel_size: 3, padding: 1 }),
          torch_nn.ReLU(),
          torch_nn.MaxPool2d({ kernel_size: 2 }),

          // Conv layer 2
          torch_nn.Conv2d(32, 64, { kernel_size: 3, padding: 1 }),
          torch_nn.ReLU(),
          torch_nn.MaxPool2d({ kernel_size: 2 }),

          // Flatten
          torch_nn.Flatten(),

          // FC layers
          torch_nn.Linear(64 * 7 * 7, 128),
          torch_nn.ReLU(),
          torch_nn.Dropout(0.5),
          torch_nn.Linear(128, 10)
        );
      }

      forward(x: any): any {
        return this.model(x);
      }

      getModel(): any {
        return this.model;
      }
    }

    // Create synthetic image data
    const batch_size = 64;
    const n_batches = 10;

    console.log('Creating CNN for 28x28 images (10 classes)...\n');

    const model = new ConvNet();
    const criterion = torch_nn.CrossEntropyLoss();
    const optimizer = torch_optim.Adam(model.getModel().parameters(), { lr: 0.001 });

    console.log('CNN Architecture:');
    console.log('- Conv2d(1, 32, 3x3) + ReLU + MaxPool(2x2)');
    console.log('- Conv2d(32, 64, 3x3) + ReLU + MaxPool(2x2)');
    console.log('- Flatten');
    console.log('- Linear(3136, 128) + ReLU + Dropout(0.5)');
    console.log('- Linear(128, 10)');

    // Simulate training
    console.log('\nTraining CNN...\n');

    for (let batch = 0; batch < n_batches; batch++) {
      const X_batch = torch.randn([batch_size, 1, 28, 28]);
      const y_batch = torch.randint(0, 10, [batch_size]);

      const outputs = model.forward(X_batch);
      const loss = criterion(outputs, y_batch);

      optimizer.zero_grad();
      loss.backward();
      optimizer.step();

      console.log(`Batch ${batch + 1}/${n_batches}, Loss: ${loss.item().toFixed(4)}`);
    }

    console.log('\nCNN training complete');
  }

  /**
   * Recurrent Neural Network (LSTM)
   */
  static recurrentNetwork(): void {
    console.log('\n=== PyTorch LSTM Network ===\n');

    // Define LSTM architecture
    class LSTMNet {
      private lstm: any;
      private fc: any;

      constructor(inputSize: number, hiddenSize: number, numLayers: number, outputSize: number) {
        this.lstm = torch_nn.LSTM(inputSize, hiddenSize, { num_layers: numLayers, batch_first: true });
        this.fc = torch_nn.Linear(hiddenSize, outputSize);
      }

      forward(x: any): any {
        const [lstm_out, _] = this.lstm(x);
        const last_output = lstm_out.slice([null, -1, null]);
        return this.fc(last_output);
      }

      getLSTM(): any {
        return this.lstm;
      }

      getFC(): any {
        return this.fc;
      }
    }

    // Create sequence data
    const batch_size = 32;
    const seq_length = 50;
    const input_size = 10;
    const hidden_size = 64;
    const num_layers = 2;
    const output_size = 5;

    console.log('LSTM Configuration:');
    console.log(`- Input size: ${input_size}`);
    console.log(`- Hidden size: ${hidden_size}`);
    console.log(`- Number of layers: ${num_layers}`);
    console.log(`- Output size: ${output_size}`);
    console.log(`- Sequence length: ${seq_length}\n`);

    const model = new LSTMNet(input_size, hidden_size, num_layers, output_size);
    const criterion = torch_nn.CrossEntropyLoss();
    const optimizer = torch_optim.Adam(
      [...model.getLSTM().parameters(), ...model.getFC().parameters()],
      { lr: 0.001 }
    );

    // Training
    console.log('Training LSTM...\n');

    for (let epoch = 0; epoch < 20; epoch++) {
      const X_batch = torch.randn([batch_size, seq_length, input_size]);
      const y_batch = torch.randint(0, output_size, [batch_size]);

      const outputs = model.forward(X_batch);
      const loss = criterion(outputs, y_batch);

      optimizer.zero_grad();
      loss.backward();
      optimizer.step();

      if ((epoch + 1) % 5 === 0) {
        console.log(`Epoch ${epoch + 1}/20, Loss: ${loss.item().toFixed(4)}`);
      }
    }

    console.log('\nLSTM training complete');
  }

  /**
   * Autoencoder
   */
  static autoencoder(): void {
    console.log('\n=== PyTorch Autoencoder ===\n');

    // Define autoencoder
    class Autoencoder {
      private encoder: any;
      private decoder: any;

      constructor(inputDim: number, encodingDim: number) {
        // Encoder
        this.encoder = torch_nn.Sequential(
          torch_nn.Linear(inputDim, 128),
          torch_nn.ReLU(),
          torch_nn.Linear(128, 64),
          torch_nn.ReLU(),
          torch_nn.Linear(64, encodingDim)
        );

        // Decoder
        this.decoder = torch_nn.Sequential(
          torch_nn.Linear(encodingDim, 64),
          torch_nn.ReLU(),
          torch_nn.Linear(64, 128),
          torch_nn.ReLU(),
          torch_nn.Linear(128, inputDim),
          torch_nn.Sigmoid()
        );
      }

      forward(x: any): any {
        const encoded = this.encoder(x);
        const decoded = this.decoder(encoded);
        return decoded;
      }

      encode(x: any): any {
        return this.encoder(x);
      }

      getEncoder(): any {
        return this.encoder;
      }

      getDecoder(): any {
        return this.decoder;
      }
    }

    const input_dim = 784; // 28x28 images
    const encoding_dim = 32; // Compressed representation

    console.log('Autoencoder Configuration:');
    console.log(`- Input dimension: ${input_dim}`);
    console.log(`- Encoding dimension: ${encoding_dim}`);
    console.log(`- Compression ratio: ${(input_dim / encoding_dim).toFixed(1)}x\n`);

    const model = new Autoencoder(input_dim, encoding_dim);
    const criterion = torch_nn.MSELoss();
    const optimizer = torch_optim.Adam(
      [...model.getEncoder().parameters(), ...model.getDecoder().parameters()],
      { lr: 0.001 }
    );

    // Training
    console.log('Training autoencoder...\n');

    for (let epoch = 0; epoch < 30; epoch++) {
      const X_batch = torch.rand([64, input_dim]);

      const reconstructed = model.forward(X_batch);
      const loss = criterion(reconstructed, X_batch);

      optimizer.zero_grad();
      loss.backward();
      optimizer.step();

      if ((epoch + 1) % 10 === 0) {
        console.log(`Epoch ${epoch + 1}/30, Loss: ${loss.item().toFixed(6)}`);
      }
    }

    console.log('\nAutoencoder training complete');
  }

  /**
   * Generative Adversarial Network (GAN)
   */
  static gan(): void {
    console.log('\n=== PyTorch GAN ===\n');

    // Generator
    class Generator {
      private model: any;

      constructor(latentDim: number, outputDim: number) {
        this.model = torch_nn.Sequential(
          torch_nn.Linear(latentDim, 128),
          torch_nn.ReLU(),
          torch_nn.Linear(128, 256),
          torch_nn.ReLU(),
          torch_nn.Linear(256, outputDim),
          torch_nn.Tanh()
        );
      }

      forward(x: any): any {
        return this.model(x);
      }

      getModel(): any {
        return this.model;
      }
    }

    // Discriminator
    class Discriminator {
      private model: any;

      constructor(inputDim: number) {
        this.model = torch_nn.Sequential(
          torch_nn.Linear(inputDim, 256),
          torch_nn.LeakyReLU(0.2),
          torch_nn.Linear(256, 128),
          torch_nn.LeakyReLU(0.2),
          torch_nn.Linear(128, 1),
          torch_nn.Sigmoid()
        );
      }

      forward(x: any): any {
        return this.model(x);
      }

      getModel(): any {
        return this.model;
      }
    }

    const latent_dim = 100;
    const data_dim = 784;

    console.log('GAN Configuration:');
    console.log(`- Latent dimension: ${latent_dim}`);
    console.log(`- Data dimension: ${data_dim}\n`);

    const generator = new Generator(latent_dim, data_dim);
    const discriminator = new Discriminator(data_dim);

    const criterion = torch_nn.BCELoss();
    const optimizer_G = torch_optim.Adam(generator.getModel().parameters(), { lr: 0.0002 });
    const optimizer_D = torch_optim.Adam(discriminator.getModel().parameters(), { lr: 0.0002 });

    console.log('Training GAN...\n');

    const batch_size = 64;
    const real_label = 1;
    const fake_label = 0;

    for (let epoch = 0; epoch < 20; epoch++) {
      // Train Discriminator
      // Real data
      const real_data = torch.rand([batch_size, data_dim]);
      const real_labels = torch.ones([batch_size, 1]) * real_label;

      optimizer_D.zero_grad();
      const real_output = discriminator.forward(real_data);
      const d_loss_real = criterion(real_output, real_labels);

      // Fake data
      const noise = torch.randn([batch_size, latent_dim]);
      const fake_data = generator.forward(noise);
      const fake_labels = torch.zeros([batch_size, 1]);

      const fake_output = discriminator.forward(fake_data.detach());
      const d_loss_fake = criterion(fake_output, fake_labels);

      const d_loss = d_loss_real + d_loss_fake;
      d_loss.backward();
      optimizer_D.step();

      // Train Generator
      optimizer_G.zero_grad();
      const noise_g = torch.randn([batch_size, latent_dim]);
      const generated = generator.forward(noise_g);
      const output = discriminator.forward(generated);
      const g_labels = torch.ones([batch_size, 1]);

      const g_loss = criterion(output, g_labels);
      g_loss.backward();
      optimizer_G.step();

      if ((epoch + 1) % 5 === 0) {
        console.log(`Epoch ${epoch + 1}/20, D Loss: ${d_loss.item().toFixed(4)}, G Loss: ${g_loss.item().toFixed(4)}`);
      }
    }

    console.log('\nGAN training complete');
  }
}

/**
 * Transfer Learning and Pre-trained Models
 */
class TransferLearning {
  /**
   * Using pre-trained models
   */
  static pretrainedModels(): void {
    console.log('\n=== Transfer Learning with Pre-trained Models ===\n');

    console.log('Pre-trained models available in PyTorch:');
    console.log('- ResNet (18, 34, 50, 101, 152)');
    console.log('- VGG (11, 13, 16, 19)');
    console.log('- DenseNet (121, 161, 169, 201)');
    console.log('- MobileNet (v2, v3)');
    console.log('- EfficientNet (b0-b7)');
    console.log('- Vision Transformer (ViT)\n');

    console.log('Example usage:');
    console.log('// @ts-ignore');
    console.log("import torchvision from 'python:torchvision.models';");
    console.log('');
    console.log('// Load pre-trained ResNet50');
    console.log('const model = torchvision.resnet50({ pretrained: true });');
    console.log('');
    console.log('// Freeze all layers');
    console.log('for (const param of model.parameters()) {');
    console.log('  param.requires_grad = false;');
    console.log('}');
    console.log('');
    console.log('// Replace final layer for fine-tuning');
    console.log('const num_features = model.fc.in_features;');
    console.log('model.fc = torch_nn.Linear(num_features, num_classes);');
  }

  /**
   * Fine-tuning strategies
   */
  static fineTuning(): void {
    console.log('\n=== Fine-tuning Strategies ===\n');

    console.log('Strategy 1: Feature Extraction');
    console.log('- Freeze all pre-trained layers');
    console.log('- Train only the new classifier head');
    console.log('- Fast, requires less data\n');

    console.log('Strategy 2: Full Fine-tuning');
    console.log('- Unfreeze all layers');
    console.log('- Train entire network with small learning rate');
    console.log('- Better performance, requires more data\n');

    console.log('Strategy 3: Gradual Unfreezing');
    console.log('- Start with frozen layers');
    console.log('- Gradually unfreeze from top to bottom');
    console.log('- Progressive fine-tuning\n');

    console.log('Example: Different learning rates for different layers');
    console.log('const optimizer = torch_optim.Adam([');
    console.log('  { params: model.features.parameters(), lr: 1e-5 },');
    console.log('  { params: model.classifier.parameters(), lr: 1e-3 }');
    console.log(']);');
  }
}

/**
 * Advanced Training Techniques
 */
class TrainingTechniques {
  /**
   * Learning rate scheduling
   */
  static learningRateScheduling(): void {
    console.log('\n=== Learning Rate Scheduling ===\n');

    // Create dummy model
    const model = torch_nn.Sequential(
      torch_nn.Linear(10, 50),
      torch_nn.ReLU(),
      torch_nn.Linear(50, 10)
    );

    const optimizer = torch_optim.Adam(model.parameters(), { lr: 0.001 });

    console.log('Available schedulers:');
    console.log('1. StepLR - Reduce LR by gamma every step_size epochs');
    console.log('2. MultiStepLR - Reduce LR at specific milestones');
    console.log('3. ExponentialLR - Exponential decay');
    console.log('4. CosineAnnealingLR - Cosine annealing');
    console.log('5. ReduceLROnPlateau - Reduce when metric plateaus\n');

    // Example: StepLR
    const { StepLR } = torch_optim.lr_scheduler;
    const scheduler = StepLR(optimizer, { step_size: 30, gamma: 0.1 });

    console.log('Example with StepLR:');
    for (let epoch = 0; epoch < 100; epoch++) {
      // Training code here

      if (epoch % 30 === 0) {
        const lr = optimizer.param_groups[0]['lr'];
        console.log(`Epoch ${epoch}, Learning Rate: ${lr}`);
      }

      scheduler.step();
    }
  }

  /**
   * Early stopping
   */
  static earlyStopping(): void {
    console.log('\n=== Early Stopping ===\n');

    console.log('Early Stopping Implementation:');
    console.log('');
    console.log('class EarlyStopping {');
    console.log('  private patience: number;');
    console.log('  private counter: number = 0;');
    console.log('  private bestLoss: number = Infinity;');
    console.log('');
    console.log('  constructor(patience: number) {');
    console.log('    this.patience = patience;');
    console.log('  }');
    console.log('');
    console.log('  shouldStop(validationLoss: number): boolean {');
    console.log('    if (validationLoss < this.bestLoss) {');
    console.log('      this.bestLoss = validationLoss;');
    console.log('      this.counter = 0;');
    console.log('      return false;');
    console.log('    }');
    console.log('    this.counter++;');
    console.log('    return this.counter >= this.patience;');
    console.log('  }');
    console.log('}');
  }

  /**
   * Gradient clipping
   */
  static gradientClipping(): void {
    console.log('\n=== Gradient Clipping ===\n');

    console.log('Gradient clipping prevents exploding gradients:\n');

    console.log('// Clip by norm');
    console.log('torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0);\n');

    console.log('// Clip by value');
    console.log('torch.nn.utils.clip_grad_value_(model.parameters(), clip_value=0.5);\n');

    console.log('Usage in training loop:');
    console.log('loss.backward();');
    console.log('torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0);');
    console.log('optimizer.step();');
  }

  /**
   * Mixed precision training
   */
  static mixedPrecisionTraining(): void {
    console.log('\n=== Mixed Precision Training ===\n');

    console.log('Mixed precision training uses float16 for faster computation:');
    console.log('');
    console.log('// @ts-ignore');
    console.log("import amp from 'python:torch.cuda.amp';");
    console.log('');
    console.log('const scaler = amp.GradScaler();');
    console.log('');
    console.log('for (const [X, y] of dataloader) {');
    console.log('  optimizer.zero_grad();');
    console.log('');
    console.log('  // Automatic mixed precision');
    console.log('  const with_autocast = amp.autocast();');
    console.log('  with_autocast.__enter__();');
    console.log('  const outputs = model(X);');
    console.log('  const loss = criterion(outputs, y);');
    console.log('  with_autocast.__exit__(null, null, null);');
    console.log('');
    console.log('  // Scaled backward pass');
    console.log('  scaler.scale(loss).backward();');
    console.log('  scaler.step(optimizer);');
    console.log('  scaler.update();');
    console.log('}');
    console.log('');
    console.log('Benefits:');
    console.log('- 2-3x faster training');
    console.log('- Lower memory usage');
    console.log('- Maintained model accuracy');
  }

  /**
   * Model checkpointing
   */
  static modelCheckpointing(): void {
    console.log('\n=== Model Checkpointing ===\n');

    console.log('Save model checkpoint:');
    console.log('');
    console.log('torch.save({');
    console.log('  epoch,');
    console.log('  model_state_dict: model.state_dict(),');
    console.log('  optimizer_state_dict: optimizer.state_dict(),');
    console.log('  loss');
    console.log('}, "checkpoint.pth");\n');

    console.log('Load model checkpoint:');
    console.log('');
    console.log('const checkpoint = torch.load("checkpoint.pth");');
    console.log('model.load_state_dict(checkpoint["model_state_dict"]);');
    console.log('optimizer.load_state_dict(checkpoint["optimizer_state_dict"]);');
    console.log('const epoch = checkpoint["epoch"];');
    console.log('const loss = checkpoint["loss"];');
  }
}

/**
 * Model Evaluation and Metrics
 */
class ModelEvaluation {
  /**
   * Classification metrics
   */
  static classificationMetrics(): void {
    console.log('\n=== Classification Metrics ===\n');

    // Generate predictions
    const y_true = torch.tensor([0, 1, 2, 1, 0, 2, 1, 0]);
    const y_pred = torch.tensor([0, 2, 2, 1, 0, 1, 1, 0]);

    console.log('True labels:', y_true.tolist());
    console.log('Predictions:', y_pred.tolist());

    // Accuracy
    const correct = y_true.eq(y_pred).sum().item();
    const total = y_true.size(0);
    const accuracy = (correct / total) * 100;

    console.log(`\nAccuracy: ${accuracy.toFixed(2)}%`);
    console.log(`Correct: ${correct}/${total}`);

    console.log('\nFor more detailed metrics, use scikit-learn:');
    console.log('// @ts-ignore');
    console.log("import metrics from 'python:sklearn.metrics';");
    console.log('');
    console.log('const report = metrics.classification_report(y_true, y_pred);');
    console.log('const conf_matrix = metrics.confusion_matrix(y_true, y_pred);');
  }

  /**
   * Regression metrics
   */
  static regressionMetrics(): void {
    console.log('\n=== Regression Metrics ===\n');

    // Generate predictions
    const y_true = torch.randn([100]);
    const y_pred = y_true + torch.randn([100]) * 0.1;

    // MSE
    const mse = torch_functional.mse_loss(y_pred, y_true);
    console.log(`MSE: ${mse.item().toFixed(4)}`);

    // MAE
    const mae = torch_functional.l1_loss(y_pred, y_true);
    console.log(`MAE: ${mae.item().toFixed(4)}`);

    // RMSE
    const rmse = Math.sqrt(mse.item());
    console.log(`RMSE: ${rmse.toFixed(4)}`);

    console.log('\nFor R² score:');
    console.log('// @ts-ignore');
    console.log("import metrics from 'python:sklearn.metrics';");
    console.log('const r2 = metrics.r2_score(y_true.numpy(), y_pred.numpy());');
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('DEEP LEARNING WITH PYTORCH IN TYPESCRIPT');
  console.log('='.repeat(80));

  // PyTorch Networks
  PyTorchNetworks.feedforwardNetwork();
  PyTorchNetworks.convolutionalNetwork();
  PyTorchNetworks.recurrentNetwork();
  PyTorchNetworks.autoencoder();
  PyTorchNetworks.gan();

  // Transfer Learning
  TransferLearning.pretrainedModels();
  TransferLearning.fineTuning();

  // Training Techniques
  TrainingTechniques.learningRateScheduling();
  TrainingTechniques.earlyStopping();
  TrainingTechniques.gradientClipping();
  TrainingTechniques.mixedPrecisionTraining();
  TrainingTechniques.modelCheckpointing();

  // Model Evaluation
  ModelEvaluation.classificationMetrics();
  ModelEvaluation.regressionMetrics();

  console.log('\n' + '='.repeat(80));
  console.log('DEEP LEARNING COMPLETE');
  console.log('='.repeat(80));
}

// Run the examples
if (require.main === module) {
  main();
}

export {
  PyTorchNetworks,
  TransferLearning,
  TrainingTechniques,
  ModelEvaluation
};
