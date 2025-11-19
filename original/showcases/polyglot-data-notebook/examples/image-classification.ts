/**
 * Image Classification with PyTorch Example
 *
 * This example demonstrates building a Convolutional Neural Network
 * for image classification using PyTorch directly in TypeScript.
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - Polyglot Magic!
// ============================================================================

// @ts-ignore
import torch from 'python:torch';
// @ts-ignore
import torch_nn from 'python:torch.nn';
// @ts-ignore
import torch_functional from 'python:torch.nn.functional';
// @ts-ignore
import torch_optim from 'python:torch.optim';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';

/**
 * Dataset preparation
 */
class ImageDataset {
  /**
   * Generate synthetic image dataset
   */
  static generateSyntheticDataset(
    n_samples: number,
    image_size: number,
    n_classes: number
  ): { X: any; y: any } {
    console.log('=== Generating Synthetic Image Dataset ===\n');
    console.log(`Samples: ${n_samples}`);
    console.log(`Image size: ${image_size}x${image_size}`);
    console.log(`Classes: ${n_classes}\n`);

    // Generate random images with patterns
    const X = torch.randn([n_samples, 1, image_size, image_size]);
    const y = torch.randint(0, n_classes, [n_samples]);

    // Add some structure to make classes distinguishable
    for (let i = 0; i < n_samples; i++) {
      const label = y[i].item();
      // Add class-specific patterns
      if (label === 0) {
        // Add horizontal lines
        X[i][0].slice([null, image_size / 4, image_size * 3 / 4]).add_(2.0);
      } else if (label === 1) {
        // Add vertical lines
        X[i][0].slice([image_size / 4, image_size * 3 / 4, null]).add_(2.0);
      } else if (label === 2) {
        // Add diagonal pattern
        for (let j = 0; j < image_size; j++) {
          X[i][0][j][j] += 2.0;
        }
      }
    }

    return { X, y };
  }

  /**
   * Create data loaders
   */
  static createDataLoaders(
    X_train: any,
    y_train: any,
    X_test: any,
    y_test: any,
    batch_size: number
  ): { train_loader: any; test_loader: any } {
    console.log('\n=== Creating Data Loaders ===\n');
    console.log(`Batch size: ${batch_size}`);
    console.log(`Training samples: ${X_train.size(0)}`);
    console.log(`Test samples: ${X_test.size(0)}\n`);

    // Note: In real PyTorch, we'd use torch.utils.data.DataLoader
    // For this example, we'll manually batch the data

    return {
      train_loader: { X: X_train, y: y_train },
      test_loader: { X: X_test, y: y_test }
    };
  }

  /**
   * Visualize sample images
   */
  static visualizeSamples(X: any, y: any, n_samples: number = 9): void {
    console.log('\n=== Visualizing Sample Images ===\n');

    matplotlib.figure({ figsize: [12, 12] });

    for (let i = 0; i < n_samples; i++) {
      matplotlib.subplot(3, 3, i + 1);
      const img = X[i][0].numpy();
      matplotlib.imshow(img, { cmap: 'gray' });
      matplotlib.title(`Class: ${y[i].item()}`);
      matplotlib.axis('off');
    }

    matplotlib.tight_layout();
    matplotlib.savefig('sample_images.png', { dpi: 300 });
    matplotlib.close();

    console.log('Sample images saved to sample_images.png');
  }
}

/**
 * CNN Model Architecture
 */
class CNNClassifier {
  private conv1: any;
  private conv2: any;
  private conv3: any;
  private pool: any;
  private dropout1: any;
  private dropout2: any;
  private fc1: any;
  private fc2: any;
  private fc3: any;

  constructor(num_classes: number) {
    // Convolutional layers
    this.conv1 = torch_nn.Conv2d(1, 32, { kernel_size: 3, padding: 1 });
    this.conv2 = torch_nn.Conv2d(32, 64, { kernel_size: 3, padding: 1 });
    this.conv3 = torch_nn.Conv2d(64, 128, { kernel_size: 3, padding: 1 });

    // Pooling
    this.pool = torch_nn.MaxPool2d({ kernel_size: 2, stride: 2 });

    // Dropout
    this.dropout1 = torch_nn.Dropout(0.25);
    this.dropout2 = torch_nn.Dropout(0.5);

    // Fully connected layers (assuming 28x28 input -> 3x3 after pooling)
    this.fc1 = torch_nn.Linear(128 * 3 * 3, 256);
    this.fc2 = torch_nn.Linear(256, 128);
    this.fc3 = torch_nn.Linear(128, num_classes);
  }

  forward(x: any): any {
    // First conv block
    x = this.conv1(x);
    x = torch_functional.relu(x);
    x = this.pool(x);

    // Second conv block
    x = this.conv2(x);
    x = torch_functional.relu(x);
    x = this.pool(x);

    // Third conv block
    x = this.conv3(x);
    x = torch_functional.relu(x);
    x = this.pool(x);
    x = this.dropout1(x);

    // Flatten
    x = x.view(x.size(0), -1);

    // Fully connected layers
    x = this.fc1(x);
    x = torch_functional.relu(x);
    x = this.dropout2(x);

    x = this.fc2(x);
    x = torch_functional.relu(x);

    x = this.fc3(x);

    return x;
  }

  getParameters(): any[] {
    return [
      ...this.conv1.parameters(),
      ...this.conv2.parameters(),
      ...this.conv3.parameters(),
      ...this.fc1.parameters(),
      ...this.fc2.parameters(),
      ...this.fc3.parameters()
    ];
  }

  printArchitecture(): void {
    console.log('\n=== CNN Architecture ===\n');
    console.log('Layer 1: Conv2d(1, 32, 3x3) + ReLU + MaxPool(2x2)');
    console.log('Layer 2: Conv2d(32, 64, 3x3) + ReLU + MaxPool(2x2)');
    console.log('Layer 3: Conv2d(64, 128, 3x3) + ReLU + MaxPool(2x2) + Dropout(0.25)');
    console.log('Layer 4: Flatten');
    console.log('Layer 5: Linear(1152, 256) + ReLU + Dropout(0.5)');
    console.log('Layer 6: Linear(256, 128) + ReLU');
    console.log('Layer 7: Linear(128, num_classes)\n');

    // Count parameters
    let total_params = 0;
    for (const param of this.getParameters()) {
      total_params += param.numel();
    }
    console.log(`Total parameters: ${total_params.toLocaleString()}\n`);
  }
}

/**
 * Training and Evaluation
 */
class ModelTrainer {
  private model: CNNClassifier;
  private optimizer: any;
  private criterion: any;
  private device: any;

  constructor(model: CNNClassifier, learning_rate: number) {
    this.model = model;
    this.criterion = torch_nn.CrossEntropyLoss();
    this.optimizer = torch_optim.Adam(model.getParameters(), { lr: learning_rate });
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    console.log(`Using device: ${this.device}`);
  }

  /**
   * Train for one epoch
   */
  trainEpoch(X_train: any, y_train: any, batch_size: number): number {
    const n_samples = X_train.size(0);
    const n_batches = Math.ceil(n_samples / batch_size);

    let total_loss = 0;
    let correct = 0;
    let total = 0;

    for (let i = 0; i < n_batches; i++) {
      const start = i * batch_size;
      const end = Math.min(start + batch_size, n_samples);

      const X_batch = X_train.slice([start, end]);
      const y_batch = y_train.slice([start, end]);

      // Forward pass
      const outputs = this.model.forward(X_batch);
      const loss = this.criterion(outputs, y_batch);

      // Backward pass
      this.optimizer.zero_grad();
      loss.backward();
      this.optimizer.step();

      // Statistics
      total_loss += loss.item();
      const predictions = torch.argmax(outputs, { dim: 1 });
      correct += predictions.eq(y_batch).sum().item();
      total += y_batch.size(0);
    }

    const avg_loss = total_loss / n_batches;
    const accuracy = (correct / total) * 100;

    return { loss: avg_loss, accuracy };
  }

  /**
   * Evaluate on test set
   */
  evaluate(X_test: any, y_test: any): any {
    const with_no_grad = torch.no_grad();
    with_no_grad.__enter__();

    const outputs = this.model.forward(X_test);
    const loss = this.criterion(outputs, y_test).item();

    const predictions = torch.argmax(outputs, { dim: 1 });
    const correct = predictions.eq(y_test).sum().item();
    const total = y_test.size(0);
    const accuracy = (correct / total) * 100;

    with_no_grad.__exit__(null, null, null);

    return {
      loss,
      accuracy,
      predictions: predictions.numpy(),
      true_labels: y_test.numpy()
    };
  }

  /**
   * Full training loop
   */
  train(
    X_train: any,
    y_train: any,
    X_test: any,
    y_test: any,
    epochs: number,
    batch_size: number
  ): any {
    console.log('\n=== Training CNN ===\n');
    console.log(`Epochs: ${epochs}`);
    console.log(`Batch size: ${batch_size}`);
    console.log(`Learning rate: ${this.optimizer.param_groups[0]['lr']}\n`);

    const history = {
      train_loss: [],
      train_acc: [],
      test_loss: [],
      test_acc: []
    };

    for (let epoch = 0; epoch < epochs; epoch++) {
      // Training
      const train_metrics = this.trainEpoch(X_train, y_train, batch_size);

      // Evaluation
      const test_metrics = this.evaluate(X_test, y_test);

      // Record history
      history.train_loss.push(train_metrics.loss);
      history.train_acc.push(train_metrics.accuracy);
      history.test_loss.push(test_metrics.loss);
      history.test_acc.push(test_metrics.accuracy);

      // Print progress
      if ((epoch + 1) % 5 === 0 || epoch === 0) {
        console.log(`Epoch ${epoch + 1}/${epochs}`);
        console.log(`  Train Loss: ${train_metrics.loss.toFixed(4)}, ` +
                    `Acc: ${train_metrics.accuracy.toFixed(2)}%`);
        console.log(`  Test Loss: ${test_metrics.loss.toFixed(4)}, ` +
                    `Acc: ${test_metrics.accuracy.toFixed(2)}%`);
      }
    }

    console.log('\nTraining complete!\n');

    return history;
  }
}

/**
 * Results Analysis
 */
class ResultsAnalyzer {
  /**
   * Plot training history
   */
  static plotTrainingHistory(history: any): void {
    console.log('=== Plotting Training History ===\n');

    const epochs = Array.from({ length: history.train_loss.length }, (_, i) => i + 1);

    matplotlib.figure({ figsize: [14, 5] });

    // Loss plot
    matplotlib.subplot(1, 2, 1);
    matplotlib.plot(epochs, history.train_loss, { label: 'Train Loss', marker: 'o' });
    matplotlib.plot(epochs, history.test_loss, { label: 'Test Loss', marker: 's' });
    matplotlib.title('Training and Test Loss', { fontsize: 14 });
    matplotlib.xlabel('Epoch');
    matplotlib.ylabel('Loss');
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });

    // Accuracy plot
    matplotlib.subplot(1, 2, 2);
    matplotlib.plot(epochs, history.train_acc, { label: 'Train Accuracy', marker: 'o' });
    matplotlib.plot(epochs, history.test_acc, { label: 'Test Accuracy', marker: 's' });
    matplotlib.title('Training and Test Accuracy', { fontsize: 14 });
    matplotlib.xlabel('Epoch');
    matplotlib.ylabel('Accuracy (%)');
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('training_history.png', { dpi: 300 });
    matplotlib.close();

    console.log('Training history saved to training_history.png');
  }

  /**
   * Compute confusion matrix
   */
  static computeConfusionMatrix(predictions: any, true_labels: any, n_classes: number): any {
    const conf_matrix = numpy.zeros([n_classes, n_classes], { dtype: 'int32' });

    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      const true_label = true_labels[i];
      conf_matrix[true_label][pred] += 1;
    }

    return conf_matrix;
  }

  /**
   * Plot confusion matrix
   */
  static plotConfusionMatrix(conf_matrix: any, n_classes: number): void {
    console.log('\n=== Confusion Matrix ===\n');

    // @ts-ignore
    import seaborn from 'python:seaborn';

    matplotlib.figure({ figsize: [8, 6] });
    seaborn.heatmap(conf_matrix, {
      annot: true,
      fmt: 'd',
      cmap: 'Blues',
      xticklabels: Array.from({ length: n_classes }, (_, i) => i),
      yticklabels: Array.from({ length: n_classes }, (_, i) => i)
    });

    matplotlib.title('Confusion Matrix', { fontsize: 14 });
    matplotlib.xlabel('Predicted Label');
    matplotlib.ylabel('True Label');

    matplotlib.tight_layout();
    matplotlib.savefig('confusion_matrix.png', { dpi: 300 });
    matplotlib.close();

    console.log('Confusion matrix saved to confusion_matrix.png');

    // Print matrix
    console.log('\nConfusion Matrix:');
    console.log(conf_matrix);
  }

  /**
   * Calculate per-class metrics
   */
  static calculateMetrics(conf_matrix: any, n_classes: number): void {
    console.log('\n=== Per-Class Metrics ===\n');

    for (let i = 0; i < n_classes; i++) {
      const tp = conf_matrix[i][i];
      const fp = conf_matrix.slice([null, i]).sum() - tp;
      const fn = conf_matrix[i].sum() - tp;
      const tn = conf_matrix.sum() - tp - fp - fn;

      const precision = tp / (tp + fp);
      const recall = tp / (tp + fn);
      const f1 = 2 * (precision * recall) / (precision + recall);
      const accuracy = (tp + tn) / conf_matrix.sum();

      console.log(`Class ${i}:`);
      console.log(`  Precision: ${(precision * 100).toFixed(2)}%`);
      console.log(`  Recall: ${(recall * 100).toFixed(2)}%`);
      console.log(`  F1-Score: ${f1.toFixed(4)}`);
      console.log(`  Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    }
  }

  /**
   * Visualize predictions
   */
  static visualizePredictions(
    X_test: any,
    predictions: any,
    true_labels: any,
    n_samples: number = 16
  ): void {
    console.log('\n=== Visualizing Predictions ===\n');

    matplotlib.figure({ figsize: [12, 12] });

    for (let i = 0; i < n_samples; i++) {
      matplotlib.subplot(4, 4, i + 1);
      const img = X_test[i][0].numpy();
      matplotlib.imshow(img, { cmap: 'gray' });

      const pred = predictions[i];
      const true_label = true_labels[i];
      const color = pred === true_label ? 'green' : 'red';

      matplotlib.title(
        `True: ${true_label}, Pred: ${pred}`,
        { color, fontsize: 10 }
      );
      matplotlib.axis('off');
    }

    matplotlib.tight_layout();
    matplotlib.savefig('predictions.png', { dpi: 300 });
    matplotlib.close();

    console.log('Predictions visualization saved to predictions.png');
  }
}

/**
 * Model Interpretation
 */
class ModelInterpretation {
  /**
   * Visualize learned filters
   */
  static visualizeFilters(model: CNNClassifier): void {
    console.log('\n=== Visualizing Learned Filters ===\n');

    // Get first conv layer weights
    const filters = model.conv1.weight.detach().numpy();

    matplotlib.figure({ figsize: [12, 8] });

    const n_filters = Math.min(32, filters.shape[0]);
    const n_cols = 8;
    const n_rows = Math.ceil(n_filters / n_cols);

    for (let i = 0; i < n_filters; i++) {
      matplotlib.subplot(n_rows, n_cols, i + 1);
      const filter = filters[i][0];
      matplotlib.imshow(filter, { cmap: 'viridis' });
      matplotlib.axis('off');
    }

    matplotlib.suptitle('First Convolutional Layer Filters', { fontsize: 14 });
    matplotlib.tight_layout();
    matplotlib.savefig('conv_filters.png', { dpi: 300 });
    matplotlib.close();

    console.log('Filter visualization saved to conv_filters.png');
  }

  /**
   * Compute feature maps
   */
  static computeFeatureMaps(model: CNNClassifier, sample_input: any): void {
    console.log('\n=== Computing Feature Maps ===\n');

    const with_no_grad = torch.no_grad();
    with_no_grad.__enter__();

    // Pass through first conv layer
    const conv1_output = model.conv1(sample_input);
    const activated = torch_functional.relu(conv1_output);

    with_no_grad.__exit__(null, null, null);

    // Visualize feature maps
    const feature_maps = activated[0].numpy();

    matplotlib.figure({ figsize: [12, 8] });

    const n_maps = Math.min(32, feature_maps.shape[0]);
    const n_cols = 8;
    const n_rows = Math.ceil(n_maps / n_cols);

    for (let i = 0; i < n_maps; i++) {
      matplotlib.subplot(n_rows, n_cols, i + 1);
      matplotlib.imshow(feature_maps[i], { cmap: 'viridis' });
      matplotlib.axis('off');
    }

    matplotlib.suptitle('First Layer Feature Maps', { fontsize: 14 });
    matplotlib.tight_layout();
    matplotlib.savefig('feature_maps.png', { dpi: 300 });
    matplotlib.close();

    console.log('Feature maps saved to feature_maps.png');
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('IMAGE CLASSIFICATION WITH PYTORCH IN TYPESCRIPT');
  console.log('='.repeat(80));

  // Set random seed for reproducibility
  torch.manual_seed(42);
  numpy.random.seed(42);

  // Configuration
  const config = {
    n_samples: 1000,
    image_size: 28,
    n_classes: 3,
    test_split: 0.2,
    batch_size: 32,
    epochs: 30,
    learning_rate: 0.001
  };

  // Generate dataset
  const dataset = ImageDataset.generateSyntheticDataset(
    config.n_samples,
    config.image_size,
    config.n_classes
  );

  // Visualize samples
  ImageDataset.visualizeSamples(dataset.X, dataset.y, 9);

  // Split data
  const split_idx = Math.floor(config.n_samples * (1 - config.test_split));
  const X_train = dataset.X.slice([0, split_idx]);
  const y_train = dataset.y.slice([0, split_idx]);
  const X_test = dataset.X.slice([split_idx, config.n_samples]);
  const y_test = dataset.y.slice([split_idx, config.n_samples]);

  console.log(`\nTrain size: ${X_train.size(0)}`);
  console.log(`Test size: ${X_test.size(0)}`);

  // Create model
  const model = new CNNClassifier(config.n_classes);
  model.printArchitecture();

  // Create trainer
  const trainer = new ModelTrainer(model, config.learning_rate);

  // Train model
  const history = trainer.train(
    X_train,
    y_train,
    X_test,
    y_test,
    config.epochs,
    config.batch_size
  );

  // Plot training history
  ResultsAnalyzer.plotTrainingHistory(history);

  // Final evaluation
  const results = trainer.evaluate(X_test, y_test);
  console.log('\n=== Final Test Results ===');
  console.log(`Test Loss: ${results.loss.toFixed(4)}`);
  console.log(`Test Accuracy: ${results.accuracy.toFixed(2)}%\n`);

  // Confusion matrix
  const conf_matrix = ResultsAnalyzer.computeConfusionMatrix(
    results.predictions,
    results.true_labels,
    config.n_classes
  );
  ResultsAnalyzer.plotConfusionMatrix(conf_matrix, config.n_classes);
  ResultsAnalyzer.calculateMetrics(conf_matrix, config.n_classes);

  // Visualize predictions
  ResultsAnalyzer.visualizePredictions(
    X_test,
    results.predictions,
    results.true_labels,
    16
  );

  // Model interpretation
  ModelInterpretation.visualizeFilters(model);
  ModelInterpretation.computeFeatureMaps(model, X_test.slice([0, 1]));

  console.log('\n' + '='.repeat(80));
  console.log('IMAGE CLASSIFICATION COMPLETE');
  console.log('='.repeat(80));
}

// Run the example
if (require.main === module) {
  main();
}

export {
  ImageDataset,
  CNNClassifier,
  ModelTrainer,
  ResultsAnalyzer,
  ModelInterpretation
};
