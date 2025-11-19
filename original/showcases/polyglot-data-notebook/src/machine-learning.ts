/**
 * Machine Learning with Scikit-learn in TypeScript
 *
 * This module demonstrates comprehensive machine learning workflows
 * using scikit-learn directly in TypeScript through Elide's polyglot syntax.
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - Polyglot Magic!
// ============================================================================

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
 * Classification Algorithms
 */
class ClassificationAlgorithms {
  /**
   * Logistic Regression
   */
  static logisticRegression(): void {
    console.log('=== Logistic Regression ===\n');

    const { LogisticRegression } = sklearn.linear_model;
    const { train_test_split } = sklearn.model_selection;
    const { StandardScaler } = sklearn.preprocessing;
    const { accuracy_score, classification_report, roc_auc_score } = sklearn.metrics;
    const { make_classification } = sklearn.datasets;

    // Generate synthetic data
    const [X, y] = make_classification({
      n_samples: 1000,
      n_features: 20,
      n_classes: 2,
      n_informative: 15,
      random_state: 42
    });

    // Split data
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Scale features
    const scaler = StandardScaler();
    const X_train_scaled = scaler.fit_transform(X_train);
    const X_test_scaled = scaler.transform(X_test);

    // Train model
    const model = LogisticRegression({
      max_iter: 1000,
      random_state: 42,
      solver: 'lbfgs'
    });
    model.fit(X_train_scaled, y_train);

    // Predictions
    const y_pred = model.predict(X_test_scaled);
    const y_proba = model.predict_proba(X_test_scaled);

    // Evaluation
    const accuracy = accuracy_score(y_test, y_pred);
    const auc = roc_auc_score(y_test, y_proba.slice(null, 1));

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log(`AUC-ROC: ${auc.toFixed(4)}`);
    console.log('\nClassification Report:');
    console.log(classification_report(y_test, y_pred));

    // Model coefficients
    console.log('\nTop 5 feature coefficients:');
    const coeffs = model.coef_[0];
    const indices = numpy.argsort(numpy.abs(coeffs)).slice(-5);
    for (const idx of indices.tolist().reverse()) {
      console.log(`Feature ${idx}: ${coeffs[idx].toFixed(4)}`);
    }
  }

  /**
   * Random Forest Classifier
   */
  static randomForest(): void {
    console.log('\n=== Random Forest Classifier ===\n');

    const { RandomForestClassifier } = sklearn.ensemble;
    const { train_test_split } = sklearn.model_selection;
    const { accuracy_score, confusion_matrix } = sklearn.metrics;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 1000,
      n_features: 20,
      n_classes: 3,
      n_informative: 15,
      random_state: 42
    });

    // Split
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Train
    const model = RandomForestClassifier({
      n_estimators: 100,
      max_depth: 10,
      min_samples_split: 5,
      random_state: 42
    });
    model.fit(X_train, y_train);

    // Evaluate
    const y_pred = model.predict(X_test);
    const accuracy = accuracy_score(y_test, y_pred);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log('\nConfusion Matrix:');
    console.log(confusion_matrix(y_test, y_pred));

    // Feature importance
    console.log('\nFeature Importances (top 10):');
    const importances = model.feature_importances_;
    const indices = numpy.argsort(importances).slice(-10);

    for (const idx of indices.tolist().reverse()) {
      console.log(`Feature ${idx}: ${importances[idx].toFixed(4)}`);
    }
  }

  /**
   * Support Vector Machine
   */
  static supportVectorMachine(): void {
    console.log('\n=== Support Vector Machine ===\n');

    const { SVC } = sklearn.svm;
    const { train_test_split } = sklearn.model_selection;
    const { StandardScaler } = sklearn.preprocessing;
    const { accuracy_score } = sklearn.metrics;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 500,
      n_features: 10,
      n_classes: 2,
      random_state: 42
    });

    // Split and scale
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    const scaler = StandardScaler();
    const X_train_scaled = scaler.fit_transform(X_train);
    const X_test_scaled = scaler.transform(X_test);

    // Train with different kernels
    const kernels = ['linear', 'rbf', 'poly'];

    for (const kernel of kernels) {
      const model = SVC({ kernel, random_state: 42 });
      model.fit(X_train_scaled, y_train);

      const y_pred = model.predict(X_test_scaled);
      const accuracy = accuracy_score(y_test, y_pred);

      console.log(`${kernel.toUpperCase()} kernel accuracy: ${(accuracy * 100).toFixed(2)}%`);
    }
  }

  /**
   * Gradient Boosting
   */
  static gradientBoosting(): void {
    console.log('\n=== Gradient Boosting Classifier ===\n');

    const { GradientBoostingClassifier } = sklearn.ensemble;
    const { train_test_split } = sklearn.model_selection;
    const { accuracy_score } = sklearn.metrics;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 1000,
      n_features: 20,
      n_classes: 2,
      random_state: 42
    });

    // Split
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Train
    const model = GradientBoostingClassifier({
      n_estimators: 100,
      learning_rate: 0.1,
      max_depth: 3,
      random_state: 42
    });
    model.fit(X_train, y_train);

    // Evaluate
    const y_pred = model.predict(X_test);
    const accuracy = accuracy_score(y_test, y_pred);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);

    // Feature importance
    console.log('\nTop 5 important features:');
    const importances = model.feature_importances_;
    const indices = numpy.argsort(importances).slice(-5);

    for (const idx of indices.tolist().reverse()) {
      console.log(`Feature ${idx}: ${importances[idx].toFixed(4)}`);
    }
  }

  /**
   * K-Nearest Neighbors
   */
  static knn(): void {
    console.log('\n=== K-Nearest Neighbors ===\n');

    const { KNeighborsClassifier } = sklearn.neighbors;
    const { train_test_split } = sklearn.model_selection;
    const { StandardScaler } = sklearn.preprocessing;
    const { accuracy_score } = sklearn.metrics;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 500,
      n_features: 10,
      n_classes: 3,
      random_state: 42
    });

    // Split and scale
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    const scaler = StandardScaler();
    const X_train_scaled = scaler.fit_transform(X_train);
    const X_test_scaled = scaler.transform(X_test);

    // Try different k values
    console.log('Testing different k values:');
    for (const k of [3, 5, 7, 9, 11]) {
      const model = KNeighborsClassifier({ n_neighbors: k });
      model.fit(X_train_scaled, y_train);

      const y_pred = model.predict(X_test_scaled);
      const accuracy = accuracy_score(y_test, y_pred);

      console.log(`k=${k}: Accuracy = ${(accuracy * 100).toFixed(2)}%`);
    }
  }
}

/**
 * Regression Algorithms
 */
class RegressionAlgorithms {
  /**
   * Linear Regression
   */
  static linearRegression(): void {
    console.log('\n=== Linear Regression ===\n');

    const { LinearRegression } = sklearn.linear_model;
    const { train_test_split } = sklearn.model_selection;
    const { mean_squared_error, r2_score, mean_absolute_error } = sklearn.metrics;
    const { make_regression } = sklearn.datasets;

    // Generate data
    const [X, y] = make_regression({
      n_samples: 1000,
      n_features: 10,
      noise: 10,
      random_state: 42
    });

    // Split
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Train
    const model = LinearRegression();
    model.fit(X_train, y_train);

    // Predict
    const y_pred = model.predict(X_test);

    // Evaluate
    const mse = mean_squared_error(y_test, y_pred);
    const rmse = Math.sqrt(mse);
    const mae = mean_absolute_error(y_test, y_pred);
    const r2 = r2_score(y_test, y_pred);

    console.log(`RMSE: ${rmse.toFixed(4)}`);
    console.log(`MAE: ${mae.toFixed(4)}`);
    console.log(`R² Score: ${r2.toFixed(4)}`);
    console.log(`\nIntercept: ${model.intercept_.toFixed(4)}`);
    console.log('Coefficients:', model.coef_.tolist().slice(0, 5).map((c: number) => c.toFixed(4)), '...');
  }

  /**
   * Ridge Regression
   */
  static ridgeRegression(): void {
    console.log('\n=== Ridge Regression ===\n');

    const { Ridge } = sklearn.linear_model;
    const { train_test_split } = sklearn.model_selection;
    const { mean_squared_error, r2_score } = sklearn.metrics;
    const { make_regression } = sklearn.datasets;

    // Generate data
    const [X, y] = make_regression({
      n_samples: 1000,
      n_features: 50,
      noise: 10,
      random_state: 42
    });

    // Split
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Try different alpha values
    console.log('Testing different alpha values:');
    for (const alpha of [0.1, 1.0, 10.0, 100.0]) {
      const model = Ridge({ alpha });
      model.fit(X_train, y_train);

      const y_pred = model.predict(X_test);
      const rmse = Math.sqrt(mean_squared_error(y_test, y_pred));
      const r2 = r2_score(y_test, y_pred);

      console.log(`Alpha=${alpha}: RMSE=${rmse.toFixed(4)}, R²=${r2.toFixed(4)}`);
    }
  }

  /**
   * Lasso Regression
   */
  static lassoRegression(): void {
    console.log('\n=== Lasso Regression ===\n');

    const { Lasso } = sklearn.linear_model;
    const { train_test_split } = sklearn.model_selection;
    const { mean_squared_error, r2_score } = sklearn.metrics;
    const { make_regression } = sklearn.datasets;

    // Generate data with many features
    const [X, y] = make_regression({
      n_samples: 1000,
      n_features: 50,
      n_informative: 10,
      noise: 10,
      random_state: 42
    });

    // Split
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Train
    const model = Lasso({ alpha: 1.0, random_state: 42 });
    model.fit(X_train, y_train);

    // Evaluate
    const y_pred = model.predict(X_test);
    const rmse = Math.sqrt(mean_squared_error(y_test, y_pred));
    const r2 = r2_score(y_test, y_pred);

    console.log(`RMSE: ${rmse.toFixed(4)}`);
    console.log(`R² Score: ${r2.toFixed(4)}`);

    // Feature selection (coefficients = 0)
    const coeffs = model.coef_;
    const nonzero = numpy.count_nonzero(coeffs);
    console.log(`\nNon-zero features: ${nonzero} out of ${coeffs.length}`);
    console.log('Lasso selected features:', numpy.where(coeffs !== 0)[0].tolist());
  }

  /**
   * Random Forest Regressor
   */
  static randomForestRegressor(): void {
    console.log('\n=== Random Forest Regressor ===\n');

    const { RandomForestRegressor } = sklearn.ensemble;
    const { train_test_split } = sklearn.model_selection;
    const { mean_squared_error, r2_score } = sklearn.metrics;
    const { make_regression } = sklearn.datasets;

    // Generate data
    const [X, y] = make_regression({
      n_samples: 1000,
      n_features: 20,
      noise: 10,
      random_state: 42
    });

    // Split
    const [X_train, X_test, y_train, y_test] = train_test_split(
      X, y, { test_size: 0.2, random_state: 42 }
    );

    // Train
    const model = RandomForestRegressor({
      n_estimators: 100,
      max_depth: 10,
      random_state: 42
    });
    model.fit(X_train, y_train);

    // Evaluate
    const y_pred = model.predict(X_test);
    const rmse = Math.sqrt(mean_squared_error(y_test, y_pred));
    const r2 = r2_score(y_test, y_pred);

    console.log(`RMSE: ${rmse.toFixed(4)}`);
    console.log(`R² Score: ${r2.toFixed(4)}`);

    // Feature importance
    console.log('\nTop 10 important features:');
    const importances = model.feature_importances_;
    const indices = numpy.argsort(importances).slice(-10);

    for (const idx of indices.tolist().reverse()) {
      console.log(`Feature ${idx}: ${importances[idx].toFixed(4)}`);
    }
  }
}

/**
 * Clustering Algorithms
 */
class ClusteringAlgorithms {
  /**
   * K-Means Clustering
   */
  static kMeans(): void {
    console.log('\n=== K-Means Clustering ===\n');

    const { KMeans } = sklearn.cluster;
    const { silhouette_score, davies_bouldin_score } = sklearn.metrics;
    const { make_blobs } = sklearn.datasets;

    // Generate data
    const [X, y_true] = make_blobs({
      n_samples: 500,
      centers: 4,
      n_features: 2,
      cluster_std: 1.0,
      random_state: 42
    });

    // Try different numbers of clusters
    console.log('Finding optimal number of clusters:');
    for (const k of [2, 3, 4, 5, 6]) {
      const model = KMeans({ n_clusters: k, random_state: 42 });
      const labels = model.fit_predict(X);

      const silhouette = silhouette_score(X, labels);
      const davies_bouldin = davies_bouldin_score(X, labels);
      const inertia = model.inertia_;

      console.log(`k=${k}: Silhouette=${silhouette.toFixed(4)}, ` +
                  `Davies-Bouldin=${davies_bouldin.toFixed(4)}, ` +
                  `Inertia=${inertia.toFixed(2)}`);
    }

    // Best model (k=4, true number of clusters)
    const best_model = KMeans({ n_clusters: 4, random_state: 42 });
    const labels = best_model.fit_predict(X);

    console.log('\nCluster centers:');
    console.log(best_model.cluster_centers_);

    console.log('\nCluster sizes:');
    for (let i = 0; i < 4; i++) {
      const count = numpy.sum(labels === i);
      console.log(`Cluster ${i}: ${count} samples`);
    }
  }

  /**
   * DBSCAN Clustering
   */
  static dbscan(): void {
    console.log('\n=== DBSCAN Clustering ===\n');

    const { DBSCAN } = sklearn.cluster;
    const { silhouette_score } = sklearn.metrics;
    const { make_moons } = sklearn.datasets;

    // Generate non-linear data
    const [X, y_true] = make_moons({ n_samples: 500, noise: 0.1, random_state: 42 });

    // DBSCAN
    const model = DBSCAN({ eps: 0.3, min_samples: 5 });
    const labels = model.fit_predict(X);

    // Number of clusters
    const n_clusters = labels.max() + 1;
    const n_noise = numpy.sum(labels === -1);

    console.log(`Number of clusters: ${n_clusters}`);
    console.log(`Number of noise points: ${n_noise}`);

    if (n_clusters > 1) {
      // Silhouette score (excluding noise points)
      const non_noise = labels !== -1;
      const X_clustered = X[non_noise];
      const labels_clustered = labels[non_noise];

      const silhouette = silhouette_score(X_clustered, labels_clustered);
      console.log(`Silhouette Score: ${silhouette.toFixed(4)}`);
    }

    // Cluster sizes
    console.log('\nCluster sizes:');
    for (let i = 0; i < n_clusters; i++) {
      const count = numpy.sum(labels === i);
      console.log(`Cluster ${i}: ${count} samples`);
    }
  }

  /**
   * Hierarchical Clustering
   */
  static hierarchical(): void {
    console.log('\n=== Hierarchical Clustering ===\n');

    const { AgglomerativeClustering } = sklearn.cluster;
    const { silhouette_score } = sklearn.metrics;
    const { make_blobs } = sklearn.datasets;

    // Generate data
    const [X, y_true] = make_blobs({
      n_samples: 300,
      centers: 3,
      n_features: 2,
      random_state: 42
    });

    // Try different linkage methods
    const linkages = ['ward', 'complete', 'average', 'single'];

    console.log('Comparing linkage methods:');
    for (const linkage of linkages) {
      const model = AgglomerativeClustering({
        n_clusters: 3,
        linkage
      });
      const labels = model.fit_predict(X);

      const silhouette = silhouette_score(X, labels);
      console.log(`${linkage.padEnd(10)}: Silhouette = ${silhouette.toFixed(4)}`);
    }
  }

  /**
   * Gaussian Mixture Models
   */
  static gaussianMixture(): void {
    console.log('\n=== Gaussian Mixture Models ===\n');

    const { GaussianMixture } = sklearn.mixture;
    const { make_blobs } = sklearn.datasets;

    // Generate data
    const [X, y_true] = make_blobs({
      n_samples: 500,
      centers: 3,
      n_features: 2,
      random_state: 42
    });

    // Fit GMM
    const model = GaussianMixture({
      n_components: 3,
      covariance_type: 'full',
      random_state: 42
    });
    model.fit(X);

    const labels = model.predict(X);
    const proba = model.predict_proba(X);

    console.log('Model converged:', model.converged_);
    console.log('Number of iterations:', model.n_iter_);
    console.log('Log-likelihood:', model.score(X).toFixed(4));

    console.log('\nCluster sizes:');
    for (let i = 0; i < 3; i++) {
      const count = numpy.sum(labels === i);
      console.log(`Cluster ${i}: ${count} samples`);
    }

    console.log('\nMixture weights:', model.weights_.tolist().map((w: number) => w.toFixed(4)));
  }
}

/**
 * Model Selection and Evaluation
 */
class ModelSelection {
  /**
   * Cross-validation
   */
  static crossValidation(): void {
    console.log('\n=== Cross-Validation ===\n');

    const { cross_val_score, cross_validate } = sklearn.model_selection;
    const { RandomForestClassifier } = sklearn.ensemble;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 1000,
      n_features: 20,
      random_state: 42
    });

    // Model
    const model = RandomForestClassifier({ n_estimators: 100, random_state: 42 });

    // Simple cross-validation
    const scores = cross_val_score(model, X, y, { cv: 5 });
    console.log('5-Fold CV Accuracy Scores:', scores.tolist().map((s: number) => s.toFixed(4)));
    console.log(`Mean: ${numpy.mean(scores).toFixed(4)} (+/- ${numpy.std(scores).toFixed(4)})`);

    // Cross-validation with multiple metrics
    const cv_results = cross_validate(
      model, X, y,
      {
        cv: 5,
        scoring: ['accuracy', 'precision', 'recall', 'f1'],
        return_train_score: true
      }
    );

    console.log('\nDetailed CV Results:');
    for (const metric of ['accuracy', 'precision', 'recall', 'f1']) {
      const test_scores = cv_results[`test_${metric}`];
      const mean = numpy.mean(test_scores);
      const std = numpy.std(test_scores);
      console.log(`${metric.padEnd(10)}: ${mean.toFixed(4)} (+/- ${std.toFixed(4)})`);
    }
  }

  /**
   * Grid Search
   */
  static gridSearch(): void {
    console.log('\n=== Grid Search ===\n');

    const { GridSearchCV } = sklearn.model_selection;
    const { RandomForestClassifier } = sklearn.ensemble;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 500,
      n_features: 10,
      random_state: 42
    });

    // Define parameter grid
    const param_grid = {
      n_estimators: [50, 100, 200],
      max_depth: [5, 10, 20],
      min_samples_split: [2, 5, 10]
    };

    // Grid search
    const model = RandomForestClassifier({ random_state: 42 });
    const grid_search = GridSearchCV(
      model,
      param_grid,
      { cv: 3, scoring: 'accuracy', n_jobs: -1 }
    );

    console.log('Performing grid search...');
    grid_search.fit(X, y);

    console.log('\nBest parameters:');
    console.log(grid_search.best_params_);
    console.log(`\nBest CV score: ${grid_search.best_score_.toFixed(4)}`);

    // Results DataFrame
    const results = pandas.DataFrame(grid_search.cv_results_);
    console.log('\nTop 5 configurations:');
    const top5 = results.sort_values('rank_test_score').head(5);
    console.log(top5[['params', 'mean_test_score', 'std_test_score']].toString());
  }

  /**
   * Learning Curves
   */
  static learningCurves(): void {
    console.log('\n=== Learning Curves ===\n');

    const { learning_curve } = sklearn.model_selection;
    const { RandomForestClassifier } = sklearn.ensemble;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 1000,
      n_features: 20,
      random_state: 42
    });

    // Model
    const model = RandomForestClassifier({ n_estimators: 50, random_state: 42 });

    // Learning curve
    const [train_sizes, train_scores, test_scores] = learning_curve(
      model, X, y,
      {
        cv: 5,
        train_sizes: numpy.linspace(0.1, 1.0, 10),
        random_state: 42
      }
    );

    console.log('Training set sizes:', train_sizes.tolist());
    console.log('\nTrain scores (mean):');
    console.log(numpy.mean(train_scores, { axis: 1 }).tolist().map((s: number) => s.toFixed(4)));
    console.log('\nTest scores (mean):');
    console.log(numpy.mean(test_scores, { axis: 1 }).tolist().map((s: number) => s.toFixed(4)));
  }

  /**
   * Feature Selection
   */
  static featureSelection(): void {
    console.log('\n=== Feature Selection ===\n');

    const { SelectKBest, f_classif, RFE } = sklearn.feature_selection;
    const { RandomForestClassifier } = sklearn.ensemble;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 500,
      n_features: 50,
      n_informative: 10,
      random_state: 42
    });

    console.log(`Original features: ${X.shape[1]}`);

    // SelectKBest
    const selector1 = SelectKBest({ score_func: f_classif, k: 10 });
    const X_selected = selector1.fit_transform(X, y);

    console.log(`\nSelectKBest (k=10): ${X_selected.shape[1]} features`);
    console.log('Selected features:', selector1.get_support().tolist());

    // RFE (Recursive Feature Elimination)
    const model = RandomForestClassifier({ n_estimators: 50, random_state: 42 });
    const selector2 = RFE({ estimator: model, n_features_to_select: 10 });
    selector2.fit(X, y);

    console.log(`\nRFE (n=10): ${selector2.n_features_} features selected`);
    console.log('Selected features:', selector2.get_support().tolist());
    console.log('Feature rankings:', selector2.ranking_.tolist());
  }
}

/**
 * Dimensionality Reduction
 */
class DimensionalityReduction {
  /**
   * Principal Component Analysis (PCA)
   */
  static pca(): void {
    console.log('\n=== Principal Component Analysis ===\n');

    const { PCA } = sklearn.decomposition;
    const { make_classification } = sklearn.datasets;

    // Generate high-dimensional data
    const [X, y] = make_classification({
      n_samples: 500,
      n_features: 50,
      random_state: 42
    });

    console.log(`Original shape: ${X.shape}`);

    // Fit PCA
    const pca = PCA({ n_components: 10, random_state: 42 });
    const X_transformed = pca.fit_transform(X);

    console.log(`Transformed shape: ${X_transformed.shape}`);
    console.log('\nExplained variance ratio:');
    console.log(pca.explained_variance_ratio_.tolist().map((r: number) => r.toFixed(4)));
    console.log(`\nCumulative explained variance: ${pca.explained_variance_ratio_.sum().toFixed(4)}`);

    // Find number of components for 95% variance
    const cumsum = numpy.cumsum(pca.explained_variance_ratio_);
    const n_components_95 = numpy.argmax(cumsum >= 0.95) + 1;
    console.log(`\nComponents for 95% variance: ${n_components_95}`);
  }

  /**
   * t-SNE
   */
  static tsne(): void {
    console.log('\n=== t-SNE ===\n');

    const { TSNE } = sklearn.manifold;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 300,
      n_features: 30,
      n_classes: 3,
      random_state: 42
    });

    console.log(`Original shape: ${X.shape}`);

    // Apply t-SNE
    const tsne = TSNE({
      n_components: 2,
      random_state: 42,
      perplexity: 30
    });

    console.log('Fitting t-SNE (this may take a moment)...');
    const X_embedded = tsne.fit_transform(X);

    console.log(`Embedded shape: ${X_embedded.shape}`);
    console.log(`KL divergence: ${tsne.kl_divergence_.toFixed(4)}`);
  }

  /**
   * Truncated SVD
   */
  static truncatedSVD(): void {
    console.log('\n=== Truncated SVD ===\n');

    const { TruncatedSVD } = sklearn.decomposition;
    const { make_classification } = sklearn.datasets;

    // Generate data
    const [X, y] = make_classification({
      n_samples: 500,
      n_features: 100,
      random_state: 42
    });

    console.log(`Original shape: ${X.shape}`);

    // Apply SVD
    const svd = TruncatedSVD({ n_components: 20, random_state: 42 });
    const X_reduced = svd.fit_transform(X);

    console.log(`Reduced shape: ${X_reduced.shape}`);
    console.log('\nExplained variance ratio:');
    console.log(svd.explained_variance_ratio_.tolist().slice(0, 10).map((r: number) => r.toFixed(4)));
    console.log(`\nTotal explained variance: ${svd.explained_variance_ratio_.sum().toFixed(4)}`);
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('MACHINE LEARNING WITH SCIKIT-LEARN IN TYPESCRIPT');
  console.log('='.repeat(80));

  // Classification
  ClassificationAlgorithms.logisticRegression();
  ClassificationAlgorithms.randomForest();
  ClassificationAlgorithms.supportVectorMachine();
  ClassificationAlgorithms.gradientBoosting();
  ClassificationAlgorithms.knn();

  // Regression
  RegressionAlgorithms.linearRegression();
  RegressionAlgorithms.ridgeRegression();
  RegressionAlgorithms.lassoRegression();
  RegressionAlgorithms.randomForestRegressor();

  // Clustering
  ClusteringAlgorithms.kMeans();
  ClusteringAlgorithms.dbscan();
  ClusteringAlgorithms.hierarchical();
  ClusteringAlgorithms.gaussianMixture();

  // Model Selection
  ModelSelection.crossValidation();
  ModelSelection.gridSearch();
  ModelSelection.learningCurves();
  ModelSelection.featureSelection();

  // Dimensionality Reduction
  DimensionalityReduction.pca();
  DimensionalityReduction.tsne();
  DimensionalityReduction.truncatedSVD();

  console.log('\n' + '='.repeat(80));
  console.log('MACHINE LEARNING COMPLETE');
  console.log('='.repeat(80));
}

// Run the examples
if (require.main === module) {
  main();
}

export {
  ClassificationAlgorithms,
  RegressionAlgorithms,
  ClusteringAlgorithms,
  ModelSelection,
  DimensionalityReduction
};
