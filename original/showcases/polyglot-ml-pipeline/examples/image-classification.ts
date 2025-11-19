/**
 * Image Classification with CNNs using TensorFlow in TypeScript
 *
 * Demonstrates building and training convolutional neural networks
 * for image classification using TensorFlow imported directly in TypeScript.
 */

// @ts-ignore
import tensorflow from 'python:tensorflow';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';
// @ts-ignore
import sklearn from 'python:sklearn';

/**
 * Image Classification Pipeline
 */
export class ImageClassifier {
  private model: any;
  private history: any;
  private class_names: string[];
  private input_shape: number[];

  constructor(
    input_shape: number[] = [224, 224, 3],
    num_classes: number = 10,
    class_names?: string[]
  ) {
    this.input_shape = input_shape;
    this.class_names = class_names || [];
    this.model = this.buildModel(num_classes);
  }

  /**
   * Build CNN architecture (ResNet-inspired)
   */
  private buildModel(num_classes: number): any {
    console.log('Building CNN model...');

    const input = tensorflow.keras.Input({ shape: this.input_shape });

    // Initial convolution block
    let x = tensorflow.keras.layers.Conv2D(64, [7, 7], {
      strides: 2,
      padding: 'same',
      kernel_initializer: 'he_normal'
    })(input);
    x = tensorflow.keras.layers.BatchNormalization()(x);
    x = tensorflow.keras.layers.Activation('relu')(x);
    x = tensorflow.keras.layers.MaxPooling2D([3, 3], { strides: 2, padding: 'same' })(x);

    // Residual blocks
    x = this.residualBlock(x, 64, 1);
    x = this.residualBlock(x, 64, 1);
    x = this.residualBlock(x, 64, 1);

    x = this.residualBlock(x, 128, 2);
    x = this.residualBlock(x, 128, 1);
    x = this.residualBlock(x, 128, 1);

    x = this.residualBlock(x, 256, 2);
    x = this.residualBlock(x, 256, 1);
    x = this.residualBlock(x, 256, 1);

    x = this.residualBlock(x, 512, 2);
    x = this.residualBlock(x, 512, 1);
    x = this.residualBlock(x, 512, 1);

    // Global average pooling
    x = tensorflow.keras.layers.GlobalAveragePooling2D()(x);

    // Fully connected layers
    x = tensorflow.keras.layers.Dense(512, { activation: 'relu' })(x);
    x = tensorflow.keras.layers.Dropout(0.5)(x);
    x = tensorflow.keras.layers.Dense(256, { activation: 'relu' })(x);
    x = tensorflow.keras.layers.Dropout(0.3)(x);

    // Output layer
    const output = tensorflow.keras.layers.Dense(num_classes, {
      activation: 'softmax',
      name: 'predictions'
    })(x);

    const model = tensorflow.keras.Model({ inputs: input, outputs: output });

    console.log('Model built successfully');
    return model;
  }

  /**
   * Residual block with bottleneck architecture
   */
  private residualBlock(x: any, filters: number, stride: number): any {
    const shortcut = x;

    // First convolution
    x = tensorflow.keras.layers.Conv2D(filters, [3, 3], {
      strides: stride,
      padding: 'same',
      kernel_initializer: 'he_normal'
    })(x);
    x = tensorflow.keras.layers.BatchNormalization()(x);
    x = tensorflow.keras.layers.Activation('relu')(x);

    // Second convolution
    x = tensorflow.keras.layers.Conv2D(filters, [3, 3], {
      padding: 'same',
      kernel_initializer: 'he_normal'
    })(x);
    x = tensorflow.keras.layers.BatchNormalization()(x);

    // Shortcut connection
    if (stride !== 1 || shortcut.shape[-1] !== filters) {
      const shortcut_conv = tensorflow.keras.layers.Conv2D(filters, [1, 1], {
        strides: stride,
        padding: 'same',
        kernel_initializer: 'he_normal'
      })(shortcut);
      const shortcut_norm = tensorflow.keras.layers.BatchNormalization()(shortcut_conv);
      x = tensorflow.keras.layers.Add()([x, shortcut_norm]);
    } else {
      x = tensorflow.keras.layers.Add()([x, shortcut]);
    }

    x = tensorflow.keras.layers.Activation('relu')(x);

    return x;
  }

  /**
   * Compile model with optimizer and loss
   */
  compile(
    learning_rate: number = 0.001,
    optimizer: string = 'adam'
  ): void {
    console.log('Compiling model...');

    // Learning rate schedule
    const lr_schedule = tensorflow.keras.optimizers.schedules.CosineDecay(
      learning_rate,
      { decay_steps: 10000, alpha: 0.1 }
    );

    let opt: any;
    if (optimizer === 'adam') {
      opt = tensorflow.keras.optimizers.Adam({ learning_rate: lr_schedule });
    } else if (optimizer === 'sgd') {
      opt = tensorflow.keras.optimizers.SGD({
        learning_rate: lr_schedule,
        momentum: 0.9,
        nesterov: true
      });
    } else if (optimizer === 'rmsprop') {
      opt = tensorflow.keras.optimizers.RMSprop({ learning_rate: lr_schedule });
    }

    this.model.compile({
      optimizer: opt,
      loss: 'sparse_categorical_crossentropy',
      metrics: [
        'accuracy',
        tensorflow.keras.metrics.TopKCategoricalAccuracy({ k: 5, name: 'top_5_accuracy' })
      ]
    });

    console.log('Model compiled');
  }

  /**
   * Load and preprocess image data
   */
  loadImageData(
    train_dir: string,
    validation_dir: string,
    batch_size: number = 32
  ): [any, any] {
    console.log('Loading image data...');

    // Data augmentation for training
    const train_datagen = tensorflow.keras.preprocessing.image.ImageDataGenerator({
      rescale: 1.0 / 255,
      rotation_range: 20,
      width_shift_range: 0.2,
      height_shift_range: 0.2,
      horizontal_flip: true,
      zoom_range: 0.2,
      shear_range: 0.2,
      fill_mode: 'nearest'
    });

    // Only rescaling for validation
    const val_datagen = tensorflow.keras.preprocessing.image.ImageDataGenerator({
      rescale: 1.0 / 255
    });

    const train_generator = train_datagen.flow_from_directory(
      train_dir,
      {
        target_size: [this.input_shape[0], this.input_shape[1]],
        batch_size: batch_size,
        class_mode: 'sparse',
        shuffle: true
      }
    );

    const val_generator = val_datagen.flow_from_directory(
      validation_dir,
      {
        target_size: [this.input_shape[0], this.input_shape[1]],
        batch_size: batch_size,
        class_mode: 'sparse',
        shuffle: false
      }
    );

    this.class_names = Object.keys(train_generator.class_indices);

    console.log(`Found ${train_generator.samples} training images`);
    console.log(`Found ${val_generator.samples} validation images`);
    console.log(`Classes: ${this.class_names.join(', ')}`);

    return [train_generator, val_generator];
  }

  /**
   * Load data from numpy arrays
   */
  loadNumpyData(
    x_train: any,
    y_train: any,
    x_val: any,
    y_val: any
  ): [any, any, any, any] {
    console.log('Loading numpy data...');

    // Normalize pixel values
    x_train = x_train.astype('float32') / 255.0;
    x_val = x_val.astype('float32') / 255.0;

    console.log(`Training set: ${x_train.shape[0]} images`);
    console.log(`Validation set: ${x_val.shape[0]} images`);

    return [x_train, y_train, x_val, y_val];
  }

  /**
   * Train the model
   */
  async train(
    train_data: any,
    val_data: any,
    epochs: number = 50,
    batch_size: number = 32
  ): Promise<any> {
    console.log('Training model...');

    // Callbacks
    const callbacks = [
      tensorflow.keras.callbacks.EarlyStopping({
        monitor: 'val_loss',
        patience: 10,
        restore_best_weights: true,
        verbose: 1
      }),
      tensorflow.keras.callbacks.ReduceLROnPlateau({
        monitor: 'val_loss',
        factor: 0.5,
        patience: 5,
        min_lr: 1e-7,
        verbose: 1
      }),
      tensorflow.keras.callbacks.ModelCheckpoint({
        filepath: 'best_image_classifier.h5',
        monitor: 'val_accuracy',
        save_best_only: true,
        verbose: 1
      }),
      tensorflow.keras.callbacks.TensorBoard({
        log_dir: './logs',
        histogram_freq: 1,
        write_images: true
      })
    ];

    // Check if data is generator or numpy array
    if (train_data.next) {
      // Data generator
      this.history = await this.model.fit(
        train_data,
        {
          epochs: epochs,
          validation_data: val_data,
          callbacks: callbacks,
          verbose: 1
        }
      );
    } else {
      // Numpy arrays
      const [x_train, y_train] = train_data;
      const [x_val, y_val] = val_data;

      this.history = await this.model.fit(
        x_train,
        y_train,
        {
          epochs: epochs,
          batch_size: batch_size,
          validation_data: [x_val, y_val],
          callbacks: callbacks,
          verbose: 1
        }
      );
    }

    console.log('Training completed');
    this.plotTrainingHistory();

    return this.history;
  }

  /**
   * Transfer learning from pre-trained model
   */
  async transferLearning(
    base_model_name: string = 'ResNet50',
    freeze_layers: boolean = true,
    num_classes: number = 10
  ): Promise<void> {
    console.log(`Loading pre-trained ${base_model_name} model...`);

    let base_model: any;

    if (base_model_name === 'ResNet50') {
      base_model = tensorflow.keras.applications.ResNet50({
        include_top: false,
        weights: 'imagenet',
        input_shape: this.input_shape
      });
    } else if (base_model_name === 'VGG16') {
      base_model = tensorflow.keras.applications.VGG16({
        include_top: false,
        weights: 'imagenet',
        input_shape: this.input_shape
      });
    } else if (base_model_name === 'InceptionV3') {
      base_model = tensorflow.keras.applications.InceptionV3({
        include_top: false,
        weights: 'imagenet',
        input_shape: this.input_shape
      });
    } else if (base_model_name === 'MobileNetV2') {
      base_model = tensorflow.keras.applications.MobileNetV2({
        include_top: false,
        weights: 'imagenet',
        input_shape: this.input_shape
      });
    } else if (base_model_name === 'EfficientNetB0') {
      base_model = tensorflow.keras.applications.EfficientNetB0({
        include_top: false,
        weights: 'imagenet',
        input_shape: this.input_shape
      });
    }

    // Freeze base model layers
    if (freeze_layers) {
      base_model.trainable = false;
    }

    // Build new model
    const inputs = tensorflow.keras.Input({ shape: this.input_shape });
    let x = base_model(inputs, { training: false });
    x = tensorflow.keras.layers.GlobalAveragePooling2D()(x);
    x = tensorflow.keras.layers.Dense(512, { activation: 'relu' })(x);
    x = tensorflow.keras.layers.Dropout(0.5)(x);
    x = tensorflow.keras.layers.Dense(256, { activation: 'relu' })(x);
    x = tensorflow.keras.layers.Dropout(0.3)(x);
    const outputs = tensorflow.keras.layers.Dense(num_classes, {
      activation: 'softmax'
    })(x);

    this.model = tensorflow.keras.Model({ inputs: inputs, outputs: outputs });

    console.log(`Transfer learning model built using ${base_model_name}`);
  }

  /**
   * Fine-tune the model
   */
  async fineTune(
    train_data: any,
    val_data: any,
    epochs: number = 10,
    learning_rate: number = 1e-5
  ): Promise<void> {
    console.log('Fine-tuning model...');

    // Unfreeze the base model
    this.model.trainable = true;

    // Recompile with lower learning rate
    this.model.compile({
      optimizer: tensorflow.keras.optimizers.Adam({ learning_rate: learning_rate }),
      loss: 'sparse_categorical_crossentropy',
      metrics: ['accuracy']
    });

    // Train
    await this.train(train_data, val_data, epochs);

    console.log('Fine-tuning completed');
  }

  /**
   * Evaluate model
   */
  evaluate(test_data: any): Record<string, number> {
    console.log('Evaluating model...');

    let results: any;

    if (test_data.next) {
      // Data generator
      results = this.model.evaluate(test_data, { verbose: 1 });
    } else {
      // Numpy arrays
      const [x_test, y_test] = test_data;
      results = this.model.evaluate(x_test, y_test, { verbose: 1 });
    }

    const metrics: Record<string, number> = {};
    const metric_names = this.model.metrics_names;

    for (let i = 0; i < metric_names.length; i++) {
      metrics[metric_names[i]] = results[i];
    }

    console.log('\nEvaluation Results:');
    for (const [key, value] of Object.entries(metrics)) {
      console.log(`  ${key}: ${value.toFixed(4)}`);
    }

    return metrics;
  }

  /**
   * Make predictions
   */
  predict(images: any): any {
    // Ensure images are normalized
    if (images.max() > 1.0) {
      images = images.astype('float32') / 255.0;
    }

    const predictions = this.model.predict(images);
    return predictions;
  }

  /**
   * Predict with class names
   */
  predictWithClasses(images: any): Array<{ class: string; probability: number }[]> {
    const predictions = this.predict(images);
    const results: Array<{ class: string; probability: number }[]> = [];

    for (let i = 0; i < predictions.shape[0]; i++) {
      const probs = predictions[i];
      const class_probs: { class: string; probability: number }[] = [];

      for (let j = 0; j < probs.length; j++) {
        class_probs.push({
          class: this.class_names[j] || `Class ${j}`,
          probability: probs[j]
        });
      }

      // Sort by probability
      class_probs.sort((a, b) => b.probability - a.probability);
      results.push(class_probs);
    }

    return results;
  }

  /**
   * Plot training history
   */
  private plotTrainingHistory(): void {
    matplotlib.figure({ figsize: [15, 5] });

    // Loss
    matplotlib.subplot(1, 3, 1);
    matplotlib.plot(this.history.history['loss'], { label: 'Train Loss' });
    matplotlib.plot(this.history.history['val_loss'], { label: 'Val Loss' });
    matplotlib.xlabel('Epoch');
    matplotlib.ylabel('Loss');
    matplotlib.title('Model Loss');
    matplotlib.legend();
    matplotlib.grid(true);

    // Accuracy
    matplotlib.subplot(1, 3, 2);
    matplotlib.plot(this.history.history['accuracy'], { label: 'Train Accuracy' });
    matplotlib.plot(this.history.history['val_accuracy'], { label: 'Val Accuracy' });
    matplotlib.xlabel('Epoch');
    matplotlib.ylabel('Accuracy');
    matplotlib.title('Model Accuracy');
    matplotlib.legend();
    matplotlib.grid(true);

    // Top-5 Accuracy (if available)
    if ('top_5_accuracy' in this.history.history) {
      matplotlib.subplot(1, 3, 3);
      matplotlib.plot(this.history.history['top_5_accuracy'], { label: 'Train Top-5' });
      matplotlib.plot(this.history.history['val_top_5_accuracy'], { label: 'Val Top-5' });
      matplotlib.xlabel('Epoch');
      matplotlib.ylabel('Top-5 Accuracy');
      matplotlib.title('Top-5 Accuracy');
      matplotlib.legend();
      matplotlib.grid(true);
    }

    matplotlib.tight_layout();
    matplotlib.savefig('image_classifier_training.png', { dpi: 300 });
    console.log('Training history saved to image_classifier_training.png');
  }

  /**
   * Visualize predictions
   */
  visualizePredictions(images: any, labels: any, num_images: number = 16): void {
    const predictions = this.predict(images);

    const rows = Math.ceil(Math.sqrt(num_images));
    const cols = Math.ceil(num_images / rows);

    matplotlib.figure({ figsize: [cols * 3, rows * 3] });

    for (let i = 0; i < num_images; i++) {
      matplotlib.subplot(rows, cols, i + 1);

      // Display image
      if (images[i].shape[2] === 1) {
        matplotlib.imshow(images[i].squeeze(), { cmap: 'gray' });
      } else {
        matplotlib.imshow(images[i]);
      }

      // Get prediction
      const pred_class = numpy.argmax(predictions[i]);
      const pred_prob = predictions[i][pred_class];
      const true_class = labels[i];

      const color = pred_class === true_class ? 'green' : 'red';
      const pred_label = this.class_names[pred_class] || `Class ${pred_class}`;
      const true_label = this.class_names[true_class] || `Class ${true_class}`;

      matplotlib.title(
        `Pred: ${pred_label} (${(pred_prob * 100).toFixed(1)}%)\nTrue: ${true_label}`,
        { color: color, fontsize: 10 }
      );
      matplotlib.axis('off');
    }

    matplotlib.tight_layout();
    matplotlib.savefig('prediction_visualization.png', { dpi: 300 });
    console.log('Prediction visualization saved to prediction_visualization.png');
  }

  /**
   * Compute and visualize class activation maps (Grad-CAM)
   */
  visualizeGradCAM(image: any, class_idx?: number): any {
    // Get the last convolutional layer
    const last_conv_layer = this.getLastConvLayer();

    // Create model that outputs both predictions and last conv layer
    const grad_model = tensorflow.keras.Model({
      inputs: this.model.input,
      outputs: [last_conv_layer.output, this.model.output]
    });

    // Compute gradients
    const tape = tensorflow.GradientTape();
    tape.watch([image]);

    const [conv_outputs, predictions] = grad_model(image);

    if (!class_idx) {
      class_idx = numpy.argmax(predictions[0]);
    }

    const class_output = predictions.slice([null, class_idx]);

    // Get gradients
    const grads = tape.gradient(class_output, conv_outputs);

    // Pool gradients
    const pooled_grads = tensorflow.reduce_mean(grads, { axis: [0, 1, 2] });

    // Weight the channels by gradient importance
    let heatmap = conv_outputs[0];
    for (let i = 0; i < pooled_grads.shape[0]; i++) {
      heatmap = heatmap.slice([null, null, i]).multiply(pooled_grads[i]);
    }

    heatmap = tensorflow.reduce_mean(heatmap, { axis: -1 });
    heatmap = tensorflow.maximum(heatmap, 0);
    heatmap = heatmap / tensorflow.reduce_max(heatmap);

    return heatmap.numpy();
  }

  /**
   * Get last convolutional layer
   */
  private getLastConvLayer(): any {
    for (const layer of this.model.layers.reverse()) {
      if (layer.name.includes('conv')) {
        return layer;
      }
    }
    return this.model.layers[-1];
  }

  /**
   * Save model
   */
  save(path: string): void {
    this.model.save(path);
    console.log(`Model saved to ${path}`);
  }

  /**
   * Load model
   */
  static load(path: string): ImageClassifier {
    const model = tensorflow.keras.models.load_model(path);
    const classifier = new ImageClassifier();
    classifier.model = model;
    console.log(`Model loaded from ${path}`);
    return classifier;
  }
}

/**
 * Example usage: CIFAR-10 classification
 */
async function trainCIFAR10() {
  console.log('=== CIFAR-10 Image Classification ===\n');

  // Load CIFAR-10 dataset
  const cifar10 = tensorflow.keras.datasets.cifar10;
  const [[x_train, y_train], [x_test, y_test]] = cifar10.load_data();

  // Class names
  const class_names = [
    'airplane', 'automobile', 'bird', 'cat', 'deer',
    'dog', 'frog', 'horse', 'ship', 'truck'
  ];

  // Create classifier
  const classifier = new ImageClassifier([32, 32, 3], 10, class_names);

  // Compile model
  classifier.compile(0.001, 'adam');

  // Prepare data
  const [x_train_prep, y_train_prep, x_val, y_val] = classifier.loadNumpyData(
    x_train.slice([0, 45000]),
    y_train.slice([0, 45000]),
    x_train.slice([45000, 50000]),
    y_train.slice([45000, 50000])
  );

  // Train model
  await classifier.train(
    [x_train_prep, y_train_prep],
    [x_val, y_val],
    50,
    128
  );

  // Evaluate
  const [x_test_prep, y_test_prep] = [
    x_test.astype('float32') / 255.0,
    y_test
  ];

  const metrics = classifier.evaluate([x_test_prep, y_test_prep]);

  // Visualize predictions
  classifier.visualizePredictions(x_test_prep, y_test_prep, 16);

  // Save model
  classifier.save('cifar10_classifier.h5');

  console.log('\nCIFAR-10 training completed!');
}

export { ImageClassifier, trainCIFAR10 };
export default ImageClassifier;
