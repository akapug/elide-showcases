/**
 * Polyglot ML Training Pipeline
 *
 * Demonstrates Elide's ability to import and use Python ML libraries
 * (TensorFlow, PyTorch, scikit-learn, pandas, numpy) directly in TypeScript.
 */

// @ts-ignore
import tensorflow from 'python:tensorflow';
// @ts-ignore
import torch from 'python:torch';
// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';
// @ts-ignore
import seaborn from 'python:seaborn';

/**
 * Configuration interface for ML pipeline
 */
interface PipelineConfig {
  data_path: string;
  model_type: 'tensorflow' | 'pytorch' | 'sklearn';
  task: 'classification' | 'regression' | 'clustering';
  test_size: number;
  validation_split: number;
  random_state: number;
  verbose: boolean;
}

/**
 * Training configuration
 */
interface TrainingConfig {
  epochs: number;
  batch_size: number;
  learning_rate: number;
  optimizer: string;
  loss_function: string;
  metrics: string[];
  early_stopping_patience: number;
  reduce_lr_patience: number;
}

/**
 * Model metadata
 */
interface ModelMetadata {
  name: string;
  version: string;
  framework: string;
  task: string;
  features: string[];
  target: string;
  trained_at: Date;
  metrics: Record<string, number>;
}

/**
 * Main ML Training Pipeline
 *
 * Orchestrates data loading, preprocessing, model training,
 * evaluation, and deployment using Python ML libraries in TypeScript.
 */
export class MLTrainingPipeline {
  private config: PipelineConfig;
  private training_config: TrainingConfig;
  private model: any;
  private preprocessor: any;
  private feature_names: string[];
  private target_name: string;
  private metadata: ModelMetadata;
  private history: any;

  constructor(config: PipelineConfig, training_config: TrainingConfig) {
    this.config = config;
    this.training_config = training_config;
    this.feature_names = [];
    this.target_name = '';
    this.metadata = {
      name: '',
      version: '1.0.0',
      framework: config.model_type,
      task: config.task,
      features: [],
      target: '',
      trained_at: new Date(),
      metrics: {}
    };

    this.log('Pipeline initialized');
  }

  /**
   * Load data from various sources
   */
  async loadData(path: string): Promise<[any, any]> {
    this.log(`Loading data from ${path}`);

    let df: any;

    if (path.endsWith('.csv')) {
      df = pandas.read_csv(path);
    } else if (path.endsWith('.json')) {
      df = pandas.read_json(path);
    } else if (path.endsWith('.parquet')) {
      df = pandas.read_parquet(path);
    } else if (path.endsWith('.xlsx')) {
      df = pandas.read_excel(path);
    } else {
      throw new Error(`Unsupported file format: ${path}`);
    }

    this.log(`Loaded ${df.shape[0]} rows and ${df.shape[1]} columns`);

    // Basic data exploration
    this.exploreData(df);

    return [df, df];
  }

  /**
   * Explore and visualize data
   */
  private exploreData(df: any): void {
    this.log('Data Exploration:');
    console.log('\nDataset Info:');
    console.log(df.info());

    console.log('\nFirst 5 rows:');
    console.log(df.head());

    console.log('\nStatistical Summary:');
    console.log(df.describe());

    console.log('\nMissing Values:');
    const missing = df.isnull().sum();
    const missing_percent = (missing / df.shape[0]) * 100;
    console.log(pandas.DataFrame({
      'Missing Count': missing,
      'Percentage': missing_percent
    }));

    // Check for duplicates
    const duplicates = df.duplicated().sum();
    console.log(`\nDuplicate rows: ${duplicates}`);

    // Data types
    console.log('\nData Types:');
    console.log(df.dtypes);
  }

  /**
   * Preprocess data with advanced feature engineering
   */
  async preprocessData(
    df: any,
    target_column: string,
    feature_columns?: string[]
  ): Promise<[any, any, any, any]> {
    this.log('Preprocessing data...');

    this.target_name = target_column;

    // Separate features and target
    const y = df[target_column];
    let X = feature_columns
      ? df[feature_columns]
      : df.drop(target_column, { axis: 1 });

    this.feature_names = X.columns.tolist();

    // Handle missing values
    X = this.handleMissingValues(X);

    // Feature engineering
    X = this.engineerFeatures(X);

    // Encode categorical variables
    X = this.encodeCategorical(X);

    // Feature scaling
    const [X_scaled, scaler] = this.scaleFeatures(X);
    this.preprocessor = scaler;

    // Train-test split
    const [X_train, X_test, y_train, y_test] = sklearn.model_selection.train_test_split(
      X_scaled,
      y,
      {
        test_size: this.config.test_size,
        random_state: this.config.random_state,
        stratify: this.config.task === 'classification' ? y : null
      }
    );

    this.log(`Training set: ${X_train.shape[0]} samples`);
    this.log(`Test set: ${X_test.shape[0]} samples`);

    return [X_train, X_test, y_train, y_test];
  }

  /**
   * Handle missing values intelligently
   */
  private handleMissingValues(X: any): any {
    this.log('Handling missing values...');

    const numeric_features = X.select_dtypes({ include: ['number'] }).columns;
    const categorical_features = X.select_dtypes({ include: ['object', 'category'] }).columns;

    // Numeric features: impute with median
    if (numeric_features.length > 0) {
      const numeric_imputer = new sklearn.impute.SimpleImputer({
        strategy: 'median'
      });
      X[numeric_features] = numeric_imputer.fit_transform(X[numeric_features]);
    }

    // Categorical features: impute with mode
    if (categorical_features.length > 0) {
      const categorical_imputer = new sklearn.impute.SimpleImputer({
        strategy: 'most_frequent'
      });
      X[categorical_features] = categorical_imputer.fit_transform(X[categorical_features]);
    }

    return X;
  }

  /**
   * Advanced feature engineering
   */
  private engineerFeatures(X: any): any {
    this.log('Engineering features...');

    const numeric_features = X.select_dtypes({ include: ['number'] }).columns.tolist();

    // Polynomial features for numeric columns
    if (numeric_features.length > 0 && numeric_features.length <= 10) {
      for (let i = 0; i < numeric_features.length; i++) {
        for (let j = i + 1; j < numeric_features.length; j++) {
          const feat1 = numeric_features[i];
          const feat2 = numeric_features[j];
          X[`${feat1}_x_${feat2}`] = X[feat1] * X[feat2];
        }
      }
    }

    // Log transformations for skewed features
    for (const col of numeric_features) {
      const values = X[col];
      if (values.min() > 0) {
        const skewness = values.skew();
        if (Math.abs(skewness) > 1) {
          X[`log_${col}`] = numpy.log1p(values);
        }
      }
    }

    // Square root transformations
    for (const col of numeric_features) {
      const values = X[col];
      if (values.min() >= 0) {
        X[`sqrt_${col}`] = numpy.sqrt(values);
      }
    }

    // Binning continuous features
    for (const col of numeric_features.slice(0, 5)) {
      X[`${col}_binned`] = pandas.cut(
        X[col],
        { bins: 5, labels: false }
      );
    }

    return X;
  }

  /**
   * Encode categorical variables
   */
  private encodeCategorical(X: any): any {
    this.log('Encoding categorical variables...');

    const categorical_features = X.select_dtypes({
      include: ['object', 'category']
    }).columns.tolist();

    if (categorical_features.length === 0) {
      return X;
    }

    // Label encoding for ordinal features
    const label_encoders: Record<string, any> = {};

    for (const col of categorical_features) {
      const n_unique = X[col].nunique();

      if (n_unique <= 2) {
        // Binary encoding
        const le = new sklearn.preprocessing.LabelEncoder();
        X[col] = le.fit_transform(X[col]);
        label_encoders[col] = le;
      } else if (n_unique <= 10) {
        // One-hot encoding for low cardinality
        const dummies = pandas.get_dummies(X[col], { prefix: col });
        X = pandas.concat([X, dummies], { axis: 1 });
        X = X.drop(col, { axis: 1 });
      } else {
        // Target encoding for high cardinality
        const le = new sklearn.preprocessing.LabelEncoder();
        X[col] = le.fit_transform(X[col]);
        label_encoders[col] = le;
      }
    }

    return X;
  }

  /**
   * Scale features using StandardScaler or MinMaxScaler
   */
  private scaleFeatures(X: any): [any, any] {
    this.log('Scaling features...');

    // Use StandardScaler for most cases
    const scaler = new sklearn.preprocessing.StandardScaler();
    const X_scaled = scaler.fit_transform(X);

    return [X_scaled, scaler];
  }

  /**
   * Build TensorFlow/Keras model
   */
  private buildTensorFlowModel(input_dim: number): any {
    this.log('Building TensorFlow model...');

    const model = tensorflow.keras.Sequential();

    if (this.config.task === 'classification') {
      // Deep neural network for classification
      model.add(tensorflow.keras.layers.Dense(512, {
        activation: 'relu',
        input_shape: [input_dim],
        kernel_regularizer: tensorflow.keras.regularizers.l2(0.001)
      }));
      model.add(tensorflow.keras.layers.BatchNormalization());
      model.add(tensorflow.keras.layers.Dropout(0.3));

      model.add(tensorflow.keras.layers.Dense(256, {
        activation: 'relu',
        kernel_regularizer: tensorflow.keras.regularizers.l2(0.001)
      }));
      model.add(tensorflow.keras.layers.BatchNormalization());
      model.add(tensorflow.keras.layers.Dropout(0.3));

      model.add(tensorflow.keras.layers.Dense(128, {
        activation: 'relu',
        kernel_regularizer: tensorflow.keras.regularizers.l2(0.001)
      }));
      model.add(tensorflow.keras.layers.BatchNormalization());
      model.add(tensorflow.keras.layers.Dropout(0.2));

      model.add(tensorflow.keras.layers.Dense(64, { activation: 'relu' }));
      model.add(tensorflow.keras.layers.Dropout(0.2));

      // Output layer
      const n_classes = 10; // This should be determined from data
      model.add(tensorflow.keras.layers.Dense(n_classes, {
        activation: 'softmax'
      }));

    } else if (this.config.task === 'regression') {
      // Deep neural network for regression
      model.add(tensorflow.keras.layers.Dense(256, {
        activation: 'relu',
        input_shape: [input_dim]
      }));
      model.add(tensorflow.keras.layers.BatchNormalization());
      model.add(tensorflow.keras.layers.Dropout(0.2));

      model.add(tensorflow.keras.layers.Dense(128, { activation: 'relu' }));
      model.add(tensorflow.keras.layers.BatchNormalization());
      model.add(tensorflow.keras.layers.Dropout(0.2));

      model.add(tensorflow.keras.layers.Dense(64, { activation: 'relu' }));
      model.add(tensorflow.keras.layers.Dropout(0.1));

      model.add(tensorflow.keras.layers.Dense(32, { activation: 'relu' }));

      // Output layer
      model.add(tensorflow.keras.layers.Dense(1, { activation: 'linear' }));
    }

    // Compile model
    const optimizer = this.getOptimizer(
      this.training_config.optimizer,
      this.training_config.learning_rate
    );

    model.compile({
      optimizer: optimizer,
      loss: this.training_config.loss_function || (
        this.config.task === 'classification'
          ? 'sparse_categorical_crossentropy'
          : 'mse'
      ),
      metrics: this.training_config.metrics || ['accuracy']
    });

    this.log('TensorFlow model built successfully');
    console.log(model.summary());

    return model;
  }

  /**
   * Get optimizer with learning rate schedule
   */
  private getOptimizer(name: string, learning_rate: number): any {
    // Learning rate schedule
    const lr_schedule = tensorflow.keras.optimizers.schedules.ExponentialDecay(
      learning_rate,
      { decay_steps: 10000, decay_rate: 0.96, staircase: true }
    );

    switch (name.toLowerCase()) {
      case 'adam':
        return tensorflow.keras.optimizers.Adam({ learning_rate: lr_schedule });
      case 'sgd':
        return tensorflow.keras.optimizers.SGD({
          learning_rate: lr_schedule,
          momentum: 0.9,
          nesterov: true
        });
      case 'rmsprop':
        return tensorflow.keras.optimizers.RMSprop({ learning_rate: lr_schedule });
      case 'adagrad':
        return tensorflow.keras.optimizers.Adagrad({ learning_rate: lr_schedule });
      default:
        return tensorflow.keras.optimizers.Adam({ learning_rate: lr_schedule });
    }
  }

  /**
   * Build PyTorch model
   */
  private buildPyTorchModel(input_dim: number): any {
    this.log('Building PyTorch model...');

    // Define PyTorch model architecture
    const torch_nn = torch.nn;

    const model_layers: any[] = [];

    if (this.config.task === 'classification') {
      model_layers.push(torch_nn.Linear(input_dim, 512));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.BatchNorm1d(512));
      model_layers.push(torch_nn.Dropout(0.3));

      model_layers.push(torch_nn.Linear(512, 256));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.BatchNorm1d(256));
      model_layers.push(torch_nn.Dropout(0.3));

      model_layers.push(torch_nn.Linear(256, 128));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.BatchNorm1d(128));
      model_layers.push(torch_nn.Dropout(0.2));

      model_layers.push(torch_nn.Linear(128, 64));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.Dropout(0.2));

      const n_classes = 10;
      model_layers.push(torch_nn.Linear(64, n_classes));
      model_layers.push(torch_nn.Softmax({ dim: 1 }));

    } else if (this.config.task === 'regression') {
      model_layers.push(torch_nn.Linear(input_dim, 256));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.Dropout(0.2));

      model_layers.push(torch_nn.Linear(256, 128));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.Dropout(0.2));

      model_layers.push(torch_nn.Linear(128, 64));
      model_layers.push(torch_nn.ReLU());
      model_layers.push(torch_nn.Dropout(0.1));

      model_layers.push(torch_nn.Linear(64, 32));
      model_layers.push(torch_nn.ReLU());

      model_layers.push(torch_nn.Linear(32, 1));
    }

    const model = torch_nn.Sequential(...model_layers);

    // Move to GPU if available
    const device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
    model.to(device);

    this.log(`PyTorch model built successfully on ${device}`);
    console.log(model);

    return model;
  }

  /**
   * Build scikit-learn model
   */
  private buildSklearnModel(): any {
    this.log('Building scikit-learn model...');

    let model: any;

    if (this.config.task === 'classification') {
      // Ensemble of multiple classifiers
      const rf = new sklearn.ensemble.RandomForestClassifier({
        n_estimators: 200,
        max_depth: 20,
        min_samples_split: 5,
        min_samples_leaf: 2,
        max_features: 'sqrt',
        random_state: this.config.random_state,
        n_jobs: -1
      });

      const gb = new sklearn.ensemble.GradientBoostingClassifier({
        n_estimators: 200,
        learning_rate: 0.1,
        max_depth: 5,
        min_samples_split: 5,
        min_samples_leaf: 2,
        subsample: 0.8,
        random_state: this.config.random_state
      });

      const svc = new sklearn.svm.SVC({
        kernel: 'rbf',
        C: 1.0,
        gamma: 'scale',
        probability: true,
        random_state: this.config.random_state
      });

      // Voting classifier
      model = new sklearn.ensemble.VotingClassifier({
        estimators: [
          ['rf', rf],
          ['gb', gb],
          ['svc', svc]
        ],
        voting: 'soft',
        n_jobs: -1
      });

    } else if (this.config.task === 'regression') {
      // Ensemble of regression models
      const rf = new sklearn.ensemble.RandomForestRegressor({
        n_estimators: 200,
        max_depth: 20,
        min_samples_split: 5,
        min_samples_leaf: 2,
        max_features: 'sqrt',
        random_state: this.config.random_state,
        n_jobs: -1
      });

      const gb = new sklearn.ensemble.GradientBoostingRegressor({
        n_estimators: 200,
        learning_rate: 0.1,
        max_depth: 5,
        min_samples_split: 5,
        min_samples_leaf: 2,
        subsample: 0.8,
        random_state: this.config.random_state
      });

      const svr = new sklearn.svm.SVR({
        kernel: 'rbf',
        C: 1.0,
        gamma: 'scale'
      });

      // Voting regressor
      model = new sklearn.ensemble.VotingRegressor({
        estimators: [
          ['rf', rf],
          ['gb', gb],
          ['svr', svr]
        ],
        n_jobs: -1
      });

    } else if (this.config.task === 'clustering') {
      // Multiple clustering algorithms
      model = new sklearn.cluster.KMeans({
        n_clusters: 8,
        init: 'k-means++',
        n_init: 10,
        max_iter: 300,
        random_state: this.config.random_state
      });
    }

    this.log('scikit-learn model built successfully');
    return model;
  }

  /**
   * Train TensorFlow model
   */
  private async trainTensorFlowModel(
    model: any,
    X_train: any,
    y_train: any,
    X_val: any,
    y_val: any
  ): Promise<any> {
    this.log('Training TensorFlow model...');

    // Callbacks
    const callbacks = [
      tensorflow.keras.callbacks.EarlyStopping({
        monitor: 'val_loss',
        patience: this.training_config.early_stopping_patience,
        restore_best_weights: true,
        verbose: 1
      }),
      tensorflow.keras.callbacks.ReduceLROnPlateau({
        monitor: 'val_loss',
        factor: 0.5,
        patience: this.training_config.reduce_lr_patience,
        min_lr: 1e-7,
        verbose: 1
      }),
      tensorflow.keras.callbacks.ModelCheckpoint({
        filepath: 'best_model.h5',
        monitor: 'val_loss',
        save_best_only: true,
        verbose: 1
      })
    ];

    // Train model
    const history = await model.fit(X_train, y_train, {
      epochs: this.training_config.epochs,
      batch_size: this.training_config.batch_size,
      validation_data: [X_val, y_val],
      callbacks: callbacks,
      verbose: this.config.verbose ? 1 : 0
    });

    this.history = history;
    this.log('TensorFlow model training completed');

    // Plot training history
    this.plotTrainingHistory(history);

    return history;
  }

  /**
   * Train PyTorch model
   */
  private async trainPyTorchModel(
    model: any,
    X_train: any,
    y_train: any,
    X_val: any,
    y_val: any
  ): Promise<any> {
    this.log('Training PyTorch model...');

    const device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    // Convert to PyTorch tensors
    const X_train_tensor = torch.FloatTensor(X_train).to(device);
    const y_train_tensor = torch.LongTensor(y_train).to(device);
    const X_val_tensor = torch.FloatTensor(X_val).to(device);
    const y_val_tensor = torch.LongTensor(y_val).to(device);

    // Loss function
    const criterion = this.config.task === 'classification'
      ? torch.nn.CrossEntropyLoss()
      : torch.nn.MSELoss();

    // Optimizer
    const optimizer = torch.optim.Adam(
      model.parameters(),
      { lr: this.training_config.learning_rate }
    );

    // Learning rate scheduler
    const scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
      optimizer,
      {
        mode: 'min',
        factor: 0.5,
        patience: this.training_config.reduce_lr_patience,
        verbose: true
      }
    );

    const history: Record<string, number[]> = {
      train_loss: [],
      val_loss: [],
      train_acc: [],
      val_acc: []
    };

    let best_val_loss = Infinity;
    let patience_counter = 0;

    // Training loop
    for (let epoch = 0; epoch < this.training_config.epochs; epoch++) {
      // Training phase
      model.train();
      let train_loss = 0;
      let train_correct = 0;

      const n_batches = Math.ceil(X_train_tensor.shape[0] / this.training_config.batch_size);

      for (let i = 0; i < n_batches; i++) {
        const start = i * this.training_config.batch_size;
        const end = Math.min(start + this.training_config.batch_size, X_train_tensor.shape[0]);

        const batch_X = X_train_tensor.slice([start, end]);
        const batch_y = y_train_tensor.slice([start, end]);

        optimizer.zero_grad();
        const outputs = model(batch_X);
        const loss = criterion(outputs, batch_y);

        loss.backward();
        optimizer.step();

        train_loss += loss.item();

        if (this.config.task === 'classification') {
          const predicted = torch.argmax(outputs, { dim: 1 });
          train_correct += predicted.eq(batch_y).sum().item();
        }
      }

      train_loss /= n_batches;
      const train_acc = train_correct / X_train_tensor.shape[0];

      // Validation phase
      model.eval();
      let val_loss = 0;
      let val_correct = 0;

      torch.no_grad(() => {
        const val_outputs = model(X_val_tensor);
        val_loss = criterion(val_outputs, y_val_tensor).item();

        if (this.config.task === 'classification') {
          const predicted = torch.argmax(val_outputs, { dim: 1 });
          val_correct = predicted.eq(y_val_tensor).sum().item();
        }
      });

      const val_acc = val_correct / X_val_tensor.shape[0];

      history.train_loss.push(train_loss);
      history.val_loss.push(val_loss);
      history.train_acc.push(train_acc);
      history.val_acc.push(val_acc);

      if (this.config.verbose) {
        console.log(
          `Epoch ${epoch + 1}/${this.training_config.epochs} - ` +
          `train_loss: ${train_loss.toFixed(4)} - train_acc: ${train_acc.toFixed(4)} - ` +
          `val_loss: ${val_loss.toFixed(4)} - val_acc: ${val_acc.toFixed(4)}`
        );
      }

      // Learning rate scheduling
      scheduler.step(val_loss);

      // Early stopping
      if (val_loss < best_val_loss) {
        best_val_loss = val_loss;
        patience_counter = 0;
        // Save best model
        torch.save(model.state_dict(), 'best_pytorch_model.pth');
      } else {
        patience_counter++;
        if (patience_counter >= this.training_config.early_stopping_patience) {
          this.log(`Early stopping at epoch ${epoch + 1}`);
          break;
        }
      }
    }

    this.history = history;
    this.log('PyTorch model training completed');

    return history;
  }

  /**
   * Train scikit-learn model
   */
  private trainSklearnModel(
    model: any,
    X_train: any,
    y_train: any
  ): void {
    this.log('Training scikit-learn model...');

    // Fit model
    model.fit(X_train, y_train);

    this.log('scikit-learn model training completed');
  }

  /**
   * Plot training history
   */
  private plotTrainingHistory(history: any): void {
    // Set style
    seaborn.set_style('whitegrid');

    // Create figure
    const fig = matplotlib.figure({ figsize: [15, 5] });

    // Plot loss
    matplotlib.subplot(1, 2, 1);
    matplotlib.plot(history.history['loss'], { label: 'Train Loss' });
    matplotlib.plot(history.history['val_loss'], { label: 'Val Loss' });
    matplotlib.xlabel('Epoch');
    matplotlib.ylabel('Loss');
    matplotlib.title('Model Loss');
    matplotlib.legend();
    matplotlib.grid(true);

    // Plot accuracy (if classification)
    if (this.config.task === 'classification') {
      matplotlib.subplot(1, 2, 2);
      matplotlib.plot(history.history['accuracy'], { label: 'Train Accuracy' });
      matplotlib.plot(history.history['val_accuracy'], { label: 'Val Accuracy' });
      matplotlib.xlabel('Epoch');
      matplotlib.ylabel('Accuracy');
      matplotlib.title('Model Accuracy');
      matplotlib.legend();
      matplotlib.grid(true);
    }

    matplotlib.tight_layout();
    matplotlib.savefig('training_history.png', { dpi: 300 });
    this.log('Training history plot saved to training_history.png');
  }

  /**
   * Evaluate model performance
   */
  evaluateModel(X_test: any, y_test: any): Record<string, number> {
    this.log('Evaluating model...');

    const metrics: Record<string, number> = {};

    if (this.config.model_type === 'tensorflow') {
      const results = this.model.evaluate(X_test, y_test, { verbose: 0 });
      const metric_names = this.model.metrics_names;

      for (let i = 0; i < metric_names.length; i++) {
        metrics[metric_names[i]] = results[i];
      }

    } else if (this.config.model_type === 'pytorch') {
      const device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
      const X_test_tensor = torch.FloatTensor(X_test).to(device);
      const y_test_tensor = torch.LongTensor(y_test).to(device);

      this.model.eval();
      torch.no_grad(() => {
        const outputs = this.model(X_test_tensor);

        if (this.config.task === 'classification') {
          const predicted = torch.argmax(outputs, { dim: 1 });
          const accuracy = predicted.eq(y_test_tensor).sum().item() / y_test_tensor.shape[0];
          metrics.accuracy = accuracy;

          // Convert to numpy for sklearn metrics
          const y_pred_np = predicted.cpu().numpy();
          const y_test_np = y_test_tensor.cpu().numpy();

          metrics.precision = sklearn.metrics.precision_score(
            y_test_np,
            y_pred_np,
            { average: 'weighted' }
          );
          metrics.recall = sklearn.metrics.recall_score(
            y_test_np,
            y_pred_np,
            { average: 'weighted' }
          );
          metrics.f1 = sklearn.metrics.f1_score(
            y_test_np,
            y_pred_np,
            { average: 'weighted' }
          );

        } else {
          const mse = torch.nn.MSELoss()(outputs, y_test_tensor).item();
          metrics.mse = mse;
          metrics.rmse = Math.sqrt(mse);
        }
      });

    } else if (this.config.model_type === 'sklearn') {
      const y_pred = this.model.predict(X_test);

      if (this.config.task === 'classification') {
        metrics.accuracy = sklearn.metrics.accuracy_score(y_test, y_pred);
        metrics.precision = sklearn.metrics.precision_score(
          y_test,
          y_pred,
          { average: 'weighted' }
        );
        metrics.recall = sklearn.metrics.recall_score(
          y_test,
          y_pred,
          { average: 'weighted' }
        );
        metrics.f1 = sklearn.metrics.f1_score(
          y_test,
          y_pred,
          { average: 'weighted' }
        );

        // Confusion matrix
        const cm = sklearn.metrics.confusion_matrix(y_test, y_pred);
        this.plotConfusionMatrix(cm);

      } else if (this.config.task === 'regression') {
        metrics.mse = sklearn.metrics.mean_squared_error(y_test, y_pred);
        metrics.rmse = Math.sqrt(metrics.mse);
        metrics.mae = sklearn.metrics.mean_absolute_error(y_test, y_pred);
        metrics.r2 = sklearn.metrics.r2_score(y_test, y_pred);
      }
    }

    this.metadata.metrics = metrics;

    this.log('Evaluation Results:');
    for (const [key, value] of Object.entries(metrics)) {
      console.log(`  ${key}: ${value.toFixed(4)}`);
    }

    return metrics;
  }

  /**
   * Plot confusion matrix
   */
  private plotConfusionMatrix(cm: any): void {
    matplotlib.figure({ figsize: [10, 8] });
    seaborn.heatmap(cm, { annot: true, fmt: 'd', cmap: 'Blues' });
    matplotlib.xlabel('Predicted');
    matplotlib.ylabel('Actual');
    matplotlib.title('Confusion Matrix');
    matplotlib.savefig('confusion_matrix.png', { dpi: 300 });
    this.log('Confusion matrix saved to confusion_matrix.png');
  }

  /**
   * Main training workflow
   */
  async train(data_path: string, target_column: string): Promise<void> {
    this.log('=== Starting ML Training Pipeline ===');

    // Load data
    const [df, _] = await this.loadData(data_path);

    // Preprocess data
    const [X_train, X_test, y_train, y_test] = await this.preprocessData(
      df,
      target_column
    );

    // Split training data for validation
    const [X_train_final, X_val, y_train_final, y_val] = sklearn.model_selection.train_test_split(
      X_train,
      y_train,
      {
        test_size: this.config.validation_split,
        random_state: this.config.random_state
      }
    );

    // Build model
    const input_dim = X_train.shape[1];

    if (this.config.model_type === 'tensorflow') {
      this.model = this.buildTensorFlowModel(input_dim);
      await this.trainTensorFlowModel(this.model, X_train_final, y_train_final, X_val, y_val);
    } else if (this.config.model_type === 'pytorch') {
      this.model = this.buildPyTorchModel(input_dim);
      await this.trainPyTorchModel(this.model, X_train_final, y_train_final, X_val, y_val);
    } else if (this.config.model_type === 'sklearn') {
      this.model = this.buildSklearnModel();
      this.trainSklearnModel(this.model, X_train, y_train);
    }

    // Evaluate model
    const metrics = this.evaluateModel(X_test, y_test);

    this.log('=== Training Pipeline Completed ===');
  }

  /**
   * Make predictions
   */
  predict(X: any): any {
    if (this.config.model_type === 'tensorflow') {
      return this.model.predict(X);
    } else if (this.config.model_type === 'pytorch') {
      const device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');
      const X_tensor = torch.FloatTensor(X).to(device);

      this.model.eval();
      let predictions: any;
      torch.no_grad(() => {
        const outputs = this.model(X_tensor);
        if (this.config.task === 'classification') {
          predictions = torch.argmax(outputs, { dim: 1 }).cpu().numpy();
        } else {
          predictions = outputs.cpu().numpy();
        }
      });

      return predictions;
    } else if (this.config.model_type === 'sklearn') {
      return this.model.predict(X);
    }
  }

  /**
   * Save model to disk
   */
  saveModel(path: string): void {
    this.log(`Saving model to ${path}`);

    if (this.config.model_type === 'tensorflow') {
      this.model.save(path);
    } else if (this.config.model_type === 'pytorch') {
      torch.save(this.model.state_dict(), path);
    } else if (this.config.model_type === 'sklearn') {
      const joblib = require('python:joblib');
      joblib.dump(this.model, path);
    }

    // Save metadata
    const fs = require('fs');
    fs.writeFileSync(
      `${path}_metadata.json`,
      JSON.stringify(this.metadata, null, 2)
    );

    this.log('Model saved successfully');
  }

  /**
   * Load model from disk
   */
  static loadModel(path: string, framework: string): any {
    if (framework === 'tensorflow') {
      return tensorflow.keras.models.load_model(path);
    } else if (framework === 'pytorch') {
      const state_dict = torch.load(path);
      // Note: Need to recreate model architecture first
      // model.load_state_dict(state_dict)
      return state_dict;
    } else if (framework === 'sklearn') {
      const joblib = require('python:joblib');
      return joblib.load(path);
    }
  }

  /**
   * Logging utility
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
  }
}

/**
 * Example usage
 */
async function main() {
  // Pipeline configuration
  const config: PipelineConfig = {
    data_path: 'data/training_data.csv',
    model_type: 'tensorflow',
    task: 'classification',
    test_size: 0.2,
    validation_split: 0.2,
    random_state: 42,
    verbose: true
  };

  // Training configuration
  const training_config: TrainingConfig = {
    epochs: 50,
    batch_size: 32,
    learning_rate: 0.001,
    optimizer: 'adam',
    loss_function: 'sparse_categorical_crossentropy',
    metrics: ['accuracy'],
    early_stopping_patience: 10,
    reduce_lr_patience: 5
  };

  // Create and run pipeline
  const pipeline = new MLTrainingPipeline(config, training_config);
  await pipeline.train('data/training_data.csv', 'target');

  // Save model
  pipeline.saveModel('models/trained_model');

  console.log('Pipeline completed successfully!');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export default MLTrainingPipeline;
