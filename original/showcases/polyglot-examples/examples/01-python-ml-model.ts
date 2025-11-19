/**
 * Example 1: Using Python ML Models from TypeScript
 *
 * Demonstrates:
 * - Importing Python modules
 * - Calling Python ML functions
 * - Converting data between TypeScript and Python
 * - Using scikit-learn from TypeScript
 *
 * Performance: ~0.5ms overhead per prediction after warmup
 */

// Import Python's polyglot API
const Python = Polyglot.import('python');

// Define training data in TypeScript
const trainingData = {
  features: [
    [1, 2],
    [2, 3],
    [3, 4],
    [5, 6],
    [6, 7],
  ],
  labels: [0, 0, 1, 1, 1],
};

/**
 * Train a simple ML model using Python's scikit-learn
 */
function trainModel() {
  console.log('Training ML model using Python scikit-learn...');

  // Python code to train a classifier
  const pythonCode = `
import numpy as np
from sklearn.linear_model import LogisticRegression

def train_classifier(X, y):
    """Train a logistic regression classifier"""
    model = LogisticRegression()
    model.fit(np.array(X), np.array(y))
    return model

def predict(model, X):
    """Make predictions"""
    return model.predict(np.array(X)).tolist()

def predict_proba(model, X):
    """Get prediction probabilities"""
    return model.predict_proba(np.array(X)).tolist()
`;

  // Execute Python code
  Python.eval(pythonCode);

  // Get the training function
  const trainClassifier = Python.eval('train_classifier');

  // Train the model (Python object)
  const model = trainClassifier(trainingData.features, trainingData.labels);

  console.log('Model trained successfully!');
  return model;
}

/**
 * Make predictions using the trained model
 */
function makePredictions(model: any) {
  console.log('\nMaking predictions...');

  // Get the prediction function
  const predict = Python.eval('predict');
  const predictProba = Python.eval('predict_proba');

  // Test data
  const testData = [
    [1.5, 2.5],
    [4, 5],
    [7, 8],
  ];

  // Make predictions
  const start = Date.now();
  const predictions = predict(model, testData);
  const probabilities = predictProba(model, testData);
  const duration = Date.now() - start;

  // Display results
  console.log('\nTest Data\t\tPrediction\tProbabilities');
  console.log('─'.repeat(60));

  for (let i = 0; i < testData.length; i++) {
    const dataPoint = testData[i];
    const pred = predictions[i];
    const probs = probabilities[i].map((p: number) => p.toFixed(3)).join(', ');
    console.log(`[${dataPoint}]\t\t${pred}\t\t[${probs}]`);
  }

  console.log(`\nPrediction time: ${duration}ms`);
}

/**
 * Demonstrate more complex ML operations
 */
function advancedMLExample() {
  console.log('\n\nAdvanced ML Example: Feature Engineering');

  const pythonCode = `
import numpy as np
from sklearn.preprocessing import StandardScaler

def preprocess_features(X):
    """Normalize features using StandardScaler"""
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(np.array(X))
    return X_scaled.tolist()

def compute_metrics(y_true, y_pred):
    """Compute ML metrics"""
    from sklearn.metrics import accuracy_score, precision_score, recall_score

    return {
        'accuracy': float(accuracy_score(y_true, y_pred)),
        'precision': float(precision_score(y_true, y_pred)),
        'recall': float(recall_score(y_true, y_pred))
    }
`;

  Python.eval(pythonCode);

  // Preprocess features
  const preprocessFeatures = Python.eval('preprocess_features');
  const scaledFeatures = preprocessFeatures(trainingData.features);

  console.log('Scaled features:', scaledFeatures.slice(0, 2));

  // Compute metrics
  const computeMetrics = Python.eval('compute_metrics');
  const metrics = computeMetrics(
    [0, 0, 1, 1, 1],
    [0, 0, 1, 1, 0]
  );

  console.log('Model metrics:', metrics);
}

// Main execution
console.log('='.repeat(60));
console.log('Polyglot Example 1: Python ML Model from TypeScript');
console.log('='.repeat(60));

try {
  const model = trainModel();
  makePredictions(model);
  advancedMLExample();

  console.log('\n✓ Example completed successfully!');
} catch (error) {
  console.error('Error:', error);
  console.log('\nNote: This example requires Python with scikit-learn installed.');
  console.log('Install with: pip install scikit-learn numpy');
}
