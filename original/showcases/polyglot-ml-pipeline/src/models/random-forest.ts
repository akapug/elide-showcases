/**
 * scikit-learn Random Forest and Ensemble Models in TypeScript
 *
 * Demonstrates importing scikit-learn and using tree-based ensemble models
 * directly in TypeScript using Elide's polyglot capabilities.
 */

// @ts-ignore
import sklearn from 'python:sklearn';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import matplotlib from 'python:matplotlib.pyplot';
// @ts-ignore
import seaborn from 'python:seaborn';

/**
 * Advanced Random Forest Classifier with hyperparameter tuning
 */
export class RandomForestClassifier {
  private model: any;
  private best_params: Record<string, any>;
  private feature_importance: any;
  private feature_names: string[];

  constructor(feature_names?: string[]) {
    this.feature_names = feature_names || [];
    this.best_params = {};
  }

  /**
   * Train with automatic hyperparameter tuning
   */
  async trainWithTuning(
    X_train: any,
    y_train: any,
    cv: number = 5
  ): Promise<void> {
    console.log('Starting hyperparameter tuning...');

    // Define parameter grid
    const param_grid = {
      'n_estimators': [100, 200, 300, 500],
      'max_depth': [10, 20, 30, null],
      'min_samples_split': [2, 5, 10],
      'min_samples_leaf': [1, 2, 4],
      'max_features': ['sqrt', 'log2'],
      'bootstrap': [true, false]
    };

    // Base model
    const rf = new sklearn.ensemble.RandomForestClassifier({
      random_state: 42,
      n_jobs: -1
    });

    // Grid search with cross-validation
    const grid_search = new sklearn.model_selection.GridSearchCV(
      rf,
      param_grid,
      {
        cv: cv,
        scoring: 'accuracy',
        n_jobs: -1,
        verbose: 2,
        return_train_score: true
      }
    );

    grid_search.fit(X_train, y_train);

    this.model = grid_search.best_estimator_;
    this.best_params = grid_search.best_params_;
    this.feature_importance = this.model.feature_importances_;

    console.log('Best parameters:', this.best_params);
    console.log('Best cross-validation score:', grid_search.best_score_);

    // Print detailed CV results
    this.printCVResults(grid_search.cv_results_);
  }

  /**
   * Train with default or custom parameters
   */
  train(
    X_train: any,
    y_train: any,
    params?: Record<string, any>
  ): void {
    const default_params = {
      n_estimators: 200,
      max_depth: 20,
      min_samples_split: 5,
      min_samples_leaf: 2,
      max_features: 'sqrt',
      bootstrap: true,
      random_state: 42,
      n_jobs: -1,
      verbose: 1
    };

    const final_params = { ...default_params, ...params };

    this.model = new sklearn.ensemble.RandomForestClassifier(final_params);
    this.model.fit(X_train, y_train);
    this.feature_importance = this.model.feature_importances_;

    console.log('Random Forest trained successfully');
  }

  /**
   * Make predictions
   */
  predict(X: any): any {
    return this.model.predict(X);
  }

  /**
   * Get prediction probabilities
   */
  predictProba(X: any): any {
    return this.model.predict_proba(X);
  }

  /**
   * Evaluate model performance
   */
  evaluate(X_test: any, y_test: any): Record<string, number> {
    const y_pred = this.predict(X_test);
    const y_proba = this.predictProba(X_test);

    const metrics = {
      accuracy: sklearn.metrics.accuracy_score(y_test, y_pred),
      precision: sklearn.metrics.precision_score(y_test, y_pred, { average: 'weighted' }),
      recall: sklearn.metrics.recall_score(y_test, y_pred, { average: 'weighted' }),
      f1: sklearn.metrics.f1_score(y_test, y_pred, { average: 'weighted' })
    };

    // ROC-AUC for binary classification
    const n_classes = y_proba.shape[1];
    if (n_classes === 2) {
      metrics.roc_auc = sklearn.metrics.roc_auc_score(y_test, y_proba.slice([null, 1]));
    } else {
      metrics.roc_auc = sklearn.metrics.roc_auc_score(
        y_test,
        y_proba,
        { multi_class: 'ovr', average: 'weighted' }
      );
    }

    console.log('Evaluation Metrics:');
    for (const [key, value] of Object.entries(metrics)) {
      console.log(`  ${key}: ${value.toFixed(4)}`);
    }

    return metrics;
  }

  /**
   * Get feature importance
   */
  getFeatureImportance(): Record<string, number> {
    const importance: Record<string, number> = {};

    for (let i = 0; i < this.feature_importance.length; i++) {
      const feature_name = this.feature_names[i] || `Feature_${i}`;
      importance[feature_name] = this.feature_importance[i];
    }

    // Sort by importance
    const sorted = Object.entries(importance)
      .sort((a, b) => b[1] - a[1]);

    console.log('\nTop 10 Most Important Features:');
    for (let i = 0; i < Math.min(10, sorted.length); i++) {
      console.log(`  ${sorted[i][0]}: ${sorted[i][1].toFixed(4)}`);
    }

    return importance;
  }

  /**
   * Plot feature importance
   */
  plotFeatureImportance(top_n: number = 20): void {
    const importance = this.getFeatureImportance();
    const sorted = Object.entries(importance)
      .sort((a, b) => b[1] - a[1])
      .slice(0, top_n);

    const features = sorted.map(x => x[0]);
    const values = sorted.map(x => x[1]);

    matplotlib.figure({ figsize: [12, 8] });
    matplotlib.barh(features, values);
    matplotlib.xlabel('Importance');
    matplotlib.title('Feature Importance');
    matplotlib.tight_layout();
    matplotlib.savefig('feature_importance.png', { dpi: 300 });

    console.log('Feature importance plot saved to feature_importance.png');
  }

  /**
   * Print cross-validation results
   */
  private printCVResults(cv_results: any): void {
    console.log('\nCross-Validation Results:');
    console.log('Mean test score:', cv_results['mean_test_score'].mean());
    console.log('Std test score:', cv_results['std_test_score'].mean());
  }

  /**
   * Get individual tree predictions for analysis
   */
  getTreePredictions(X: any): any[] {
    const predictions: any[] = [];

    for (const tree of this.model.estimators_) {
      predictions.push(tree.predict(X));
    }

    return predictions;
  }

  /**
   * Analyze prediction confidence
   */
  analyzePredictionConfidence(X: any): Record<string, any> {
    const proba = this.predictProba(X);
    const max_proba = numpy.max(proba, { axis: 1 });

    return {
      mean_confidence: max_proba.mean(),
      median_confidence: numpy.median(max_proba),
      min_confidence: max_proba.min(),
      max_confidence: max_proba.max(),
      std_confidence: max_proba.std(),
      low_confidence_samples: (max_proba < 0.6).sum()
    };
  }
}

/**
 * Gradient Boosting Classifier with advanced features
 */
export class GradientBoostingClassifier {
  private model: any;
  private training_history: any[];

  constructor() {
    this.training_history = [];
  }

  /**
   * Train with early stopping
   */
  train(
    X_train: any,
    y_train: any,
    X_val: any,
    y_val: any,
    params?: Record<string, any>
  ): void {
    const default_params = {
      n_estimators: 300,
      learning_rate: 0.1,
      max_depth: 5,
      min_samples_split: 5,
      min_samples_leaf: 2,
      subsample: 0.8,
      max_features: 'sqrt',
      random_state: 42,
      verbose: 1,
      validation_fraction: 0.1,
      n_iter_no_change: 10,
      tol: 1e-4
    };

    const final_params = { ...default_params, ...params };

    this.model = new sklearn.ensemble.GradientBoostingClassifier(final_params);
    this.model.fit(X_train, y_train);

    // Track training progress
    this.trackTrainingProgress(X_train, y_train, X_val, y_val);

    console.log('Gradient Boosting trained successfully');
    console.log(`Stopped at iteration: ${this.model.n_estimators_}`);
  }

  /**
   * Track training progress over iterations
   */
  private trackTrainingProgress(
    X_train: any,
    y_train: any,
    X_val: any,
    y_val: any
  ): void {
    const train_scores: number[] = [];
    const val_scores: number[] = [];

    // Get staged predictions
    for (const y_pred of this.model.staged_predict(X_train)) {
      train_scores.push(sklearn.metrics.accuracy_score(y_train, y_pred));
    }

    for (const y_pred of this.model.staged_predict(X_val)) {
      val_scores.push(sklearn.metrics.accuracy_score(y_val, y_pred));
    }

    this.training_history = train_scores.map((train_score, i) => ({
      iteration: i + 1,
      train_score: train_score,
      val_score: val_scores[i]
    }));

    this.plotTrainingProgress();
  }

  /**
   * Plot training progress
   */
  private plotTrainingProgress(): void {
    const iterations = this.training_history.map(x => x.iteration);
    const train_scores = this.training_history.map(x => x.train_score);
    const val_scores = this.training_history.map(x => x.val_score);

    matplotlib.figure({ figsize: [10, 6] });
    matplotlib.plot(iterations, train_scores, { label: 'Training Score' });
    matplotlib.plot(iterations, val_scores, { label: 'Validation Score' });
    matplotlib.xlabel('Iteration');
    matplotlib.ylabel('Accuracy');
    matplotlib.title('Gradient Boosting Training Progress');
    matplotlib.legend();
    matplotlib.grid(true);
    matplotlib.savefig('gb_training_progress.png', { dpi: 300 });

    console.log('Training progress plot saved to gb_training_progress.png');
  }

  predict(X: any): any {
    return this.model.predict(X);
  }

  predictProba(X: any): any {
    return this.model.predict_proba(X);
  }

  evaluate(X_test: any, y_test: any): Record<string, number> {
    const y_pred = this.predict(X_test);

    return {
      accuracy: sklearn.metrics.accuracy_score(y_test, y_pred),
      precision: sklearn.metrics.precision_score(y_test, y_pred, { average: 'weighted' }),
      recall: sklearn.metrics.recall_score(y_test, y_pred, { average: 'weighted' }),
      f1: sklearn.metrics.f1_score(y_test, y_pred, { average: 'weighted' })
    };
  }
}

/**
 * XGBoost Classifier (if available)
 */
export class XGBoostClassifier {
  private model: any;

  train(
    X_train: any,
    y_train: any,
    X_val?: any,
    y_val?: any,
    params?: Record<string, any>
  ): void {
    try {
      // @ts-ignore
      const xgboost = require('python:xgboost');

      const default_params = {
        max_depth: 6,
        learning_rate: 0.1,
        n_estimators: 300,
        objective: 'multi:softprob',
        booster: 'gbtree',
        n_jobs: -1,
        gamma: 0,
        min_child_weight: 1,
        subsample: 0.8,
        colsample_bytree: 0.8,
        reg_alpha: 0,
        reg_lambda: 1,
        random_state: 42,
        early_stopping_rounds: 10
      };

      const final_params = { ...default_params, ...params };

      this.model = new xgboost.XGBClassifier(final_params);

      if (X_val && y_val) {
        this.model.fit(X_train, y_train, {
          eval_set: [[X_val, y_val]],
          verbose: true
        });
      } else {
        this.model.fit(X_train, y_train);
      }

      console.log('XGBoost trained successfully');
    } catch (error) {
      console.error('XGBoost not available. Please install: pip install xgboost');
      throw error;
    }
  }

  predict(X: any): any {
    return this.model.predict(X);
  }

  predictProba(X: any): any {
    return this.model.predict_proba(X);
  }

  getFeatureImportance(): any {
    return this.model.feature_importances_;
  }
}

/**
 * Ensemble Voting Classifier
 */
export class VotingEnsemble {
  private model: any;
  private estimators: [string, any][];

  constructor() {
    this.estimators = [];
  }

  /**
   * Add estimator to ensemble
   */
  addEstimator(name: string, model: any): void {
    this.estimators.push([name, model]);
  }

  /**
   * Build and train voting classifier
   */
  train(
    X_train: any,
    y_train: any,
    voting: 'hard' | 'soft' = 'soft'
  ): void {
    if (this.estimators.length === 0) {
      // Create default ensemble
      this.estimators = [
        ['rf', new sklearn.ensemble.RandomForestClassifier({
          n_estimators: 200,
          max_depth: 20,
          random_state: 42,
          n_jobs: -1
        })],
        ['gb', new sklearn.ensemble.GradientBoostingClassifier({
          n_estimators: 200,
          learning_rate: 0.1,
          max_depth: 5,
          random_state: 42
        })],
        ['svc', new sklearn.svm.SVC({
          kernel: 'rbf',
          probability: true,
          random_state: 42
        })]
      ];
    }

    this.model = new sklearn.ensemble.VotingClassifier({
      estimators: this.estimators,
      voting: voting,
      n_jobs: -1
    });

    this.model.fit(X_train, y_train);

    console.log(`Voting classifier trained with ${this.estimators.length} estimators`);
  }

  predict(X: any): any {
    return this.model.predict(X);
  }

  predictProba(X: any): any {
    return this.model.predict_proba(X);
  }

  /**
   * Get individual estimator predictions
   */
  getEstimatorPredictions(X: any): Record<string, any> {
    const predictions: Record<string, any> = {};

    for (const [name, estimator] of this.estimators) {
      predictions[name] = estimator.predict(X);
    }

    return predictions;
  }

  /**
   * Evaluate ensemble and individual estimators
   */
  evaluateAll(X_test: any, y_test: any): Record<string, Record<string, number>> {
    const results: Record<string, Record<string, number>> = {};

    // Evaluate ensemble
    const ensemble_pred = this.predict(X_test);
    results['ensemble'] = {
      accuracy: sklearn.metrics.accuracy_score(y_test, ensemble_pred),
      precision: sklearn.metrics.precision_score(y_test, ensemble_pred, { average: 'weighted' }),
      recall: sklearn.metrics.recall_score(y_test, ensemble_pred, { average: 'weighted' }),
      f1: sklearn.metrics.f1_score(y_test, ensemble_pred, { average: 'weighted' })
    };

    // Evaluate individual estimators
    for (const [name, estimator] of this.estimators) {
      const pred = estimator.predict(X_test);
      results[name] = {
        accuracy: sklearn.metrics.accuracy_score(y_test, pred),
        precision: sklearn.metrics.precision_score(y_test, pred, { average: 'weighted' }),
        recall: sklearn.metrics.recall_score(y_test, pred, { average: 'weighted' }),
        f1: sklearn.metrics.f1_score(y_test, pred, { average: 'weighted' })
      };
    }

    console.log('\nEnsemble and Individual Estimator Performance:');
    for (const [name, metrics] of Object.entries(results)) {
      console.log(`\n${name}:`);
      for (const [metric, value] of Object.entries(metrics)) {
        console.log(`  ${metric}: ${value.toFixed(4)}`);
      }
    }

    return results;
  }
}

/**
 * Stacking Ensemble Classifier
 */
export class StackingEnsemble {
  private model: any;
  private base_estimators: [string, any][];
  private meta_classifier: any;

  constructor() {
    this.base_estimators = [];
  }

  /**
   * Add base estimator
   */
  addBaseEstimator(name: string, model: any): void {
    this.base_estimators.push([name, model]);
  }

  /**
   * Set meta classifier
   */
  setMetaClassifier(model: any): void {
    this.meta_classifier = model;
  }

  /**
   * Build and train stacking classifier
   */
  train(X_train: any, y_train: any, cv: number = 5): void {
    if (this.base_estimators.length === 0) {
      // Create default base estimators
      this.base_estimators = [
        ['rf', new sklearn.ensemble.RandomForestClassifier({
          n_estimators: 100,
          random_state: 42,
          n_jobs: -1
        })],
        ['gb', new sklearn.ensemble.GradientBoostingClassifier({
          n_estimators: 100,
          random_state: 42
        })],
        ['svc', new sklearn.svm.SVC({
          probability: true,
          random_state: 42
        })]
      ];
    }

    if (!this.meta_classifier) {
      // Default meta classifier
      this.meta_classifier = new sklearn.linear_model.LogisticRegression({
        random_state: 42
      });
    }

    this.model = new sklearn.ensemble.StackingClassifier({
      estimators: this.base_estimators,
      final_estimator: this.meta_classifier,
      cv: cv,
      n_jobs: -1
    });

    this.model.fit(X_train, y_train);

    console.log('Stacking classifier trained successfully');
  }

  predict(X: any): any {
    return this.model.predict(X);
  }

  predictProba(X: any): any {
    return this.model.predict_proba(X);
  }

  evaluate(X_test: any, y_test: any): Record<string, number> {
    const y_pred = this.predict(X_test);

    return {
      accuracy: sklearn.metrics.accuracy_score(y_test, y_pred),
      precision: sklearn.metrics.precision_score(y_test, y_pred, { average: 'weighted' }),
      recall: sklearn.metrics.recall_score(y_test, y_pred, { average: 'weighted' }),
      f1: sklearn.metrics.f1_score(y_test, y_pred, { average: 'weighted' })
    };
  }
}

/**
 * Random Forest Regressor
 */
export class RandomForestRegressor {
  private model: any;
  private feature_importance: any;

  train(
    X_train: any,
    y_train: any,
    params?: Record<string, any>
  ): void {
    const default_params = {
      n_estimators: 200,
      max_depth: 20,
      min_samples_split: 5,
      min_samples_leaf: 2,
      max_features: 'sqrt',
      bootstrap: true,
      random_state: 42,
      n_jobs: -1,
      verbose: 1
    };

    const final_params = { ...default_params, ...params };

    this.model = new sklearn.ensemble.RandomForestRegressor(final_params);
    this.model.fit(X_train, y_train);
    this.feature_importance = this.model.feature_importances_;

    console.log('Random Forest Regressor trained successfully');
  }

  predict(X: any): any {
    return this.model.predict(X);
  }

  evaluate(X_test: any, y_test: any): Record<string, number> {
    const y_pred = this.predict(X_test);

    const mse = sklearn.metrics.mean_squared_error(y_test, y_pred);
    const rmse = Math.sqrt(mse);
    const mae = sklearn.metrics.mean_absolute_error(y_test, y_pred);
    const r2 = sklearn.metrics.r2_score(y_test, y_pred);

    const metrics = { mse, rmse, mae, r2 };

    console.log('Regression Metrics:');
    for (const [key, value] of Object.entries(metrics)) {
      console.log(`  ${key}: ${value.toFixed(4)}`);
    }

    return metrics;
  }

  getFeatureImportance(): any {
    return this.feature_importance;
  }

  /**
   * Get prediction intervals using quantile regression
   */
  getPredictionIntervals(
    X: any,
    lower_quantile: number = 0.05,
    upper_quantile: number = 0.95
  ): [any, any, any] {
    const predictions = this.predict(X);

    // Get predictions from all trees
    const tree_predictions: number[][] = [];
    for (const tree of this.model.estimators_) {
      tree_predictions.push(tree.predict(X));
    }

    // Calculate quantiles
    const tree_pred_array = numpy.array(tree_predictions);
    const lower = numpy.percentile(tree_pred_array, lower_quantile * 100, { axis: 0 });
    const upper = numpy.percentile(tree_pred_array, upper_quantile * 100, { axis: 0 });

    return [predictions, lower, upper];
  }
}

/**
 * Isolation Forest for anomaly detection
 */
export class IsolationForest {
  private model: any;

  constructor(contamination: number = 0.1) {
    this.model = new sklearn.ensemble.IsolationForest({
      contamination: contamination,
      random_state: 42,
      n_jobs: -1
    });
  }

  fit(X: any): void {
    this.model.fit(X);
    console.log('Isolation Forest fitted successfully');
  }

  /**
   * Predict anomalies (-1 for anomalies, 1 for normal)
   */
  predict(X: any): any {
    return this.model.predict(X);
  }

  /**
   * Get anomaly scores (lower scores = more abnormal)
   */
  scoresamples(X: any): any {
    return this.model.score_samples(X);
  }

  /**
   * Detect anomalies with threshold
   */
  detectAnomalies(X: any, threshold?: number): any {
    const scores = this.scoresamples(X);

    if (threshold !== undefined) {
      return scores < threshold;
    } else {
      return this.predict(X) === -1;
    }
  }

  /**
   * Analyze anomalies
   */
  analyzeAnomalies(X: any): Record<string, any> {
    const predictions = this.predict(X);
    const scores = this.scoresamples(X);

    const n_anomalies = (predictions === -1).sum();
    const anomaly_rate = n_anomalies / predictions.length;

    return {
      n_samples: predictions.length,
      n_anomalies: n_anomalies,
      anomaly_rate: anomaly_rate,
      mean_score: scores.mean(),
      min_score: scores.min(),
      max_score: scores.max()
    };
  }
}

export default {
  RandomForestClassifier,
  GradientBoostingClassifier,
  XGBoostClassifier,
  VotingEnsemble,
  StackingEnsemble,
  RandomForestRegressor,
  IsolationForest
};
