/**
 * Machine Learning Examples
 *
 * Comprehensive machine learning workflows using scikit-learn through Python bridge.
 * Demonstrates classification, regression, model selection, and evaluation.
 */

import { Statistics } from '../src/compute/statistics';
import { LinearAlgebra } from '../src/compute/linear-algebra';
import { Plotter } from '../src/visualization/plotter';
import Python from 'python';

export interface MLDataset {
  X: number[][];
  y: number[];
  featureNames?: string[];
}

export interface TrainTestSplit {
  Xtrain: number[][];
  Xtest: number[][];
  ytrain: number[];
  ytest: number[];
}

export interface ModelMetrics {
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  mae?: number;
}

export class MachineLearning {
  private stats: Statistics;
  private linalg: LinearAlgebra;
  private plotter: Plotter;
  private sklearn: any;
  private numpy: any;

  constructor() {
    this.stats = new Statistics();
    this.linalg = new LinearAlgebra();
    this.plotter = new Plotter();
    this.sklearn = Python.import('sklearn');
    this.numpy = Python.import('numpy');
  }

  // ==========================================================================
  // Data Preparation
  // ==========================================================================

  loadData(filepath: string, targetColumn?: string): MLDataset {
    const pandas = Python.import('pandas');
    const df = pandas.read_csv(filepath);

    let X, y;
    if (targetColumn) {
      y = df[targetColumn].values.tolist();
      X = df.drop(targetColumn, { axis: 1 }).values.tolist();
    } else {
      const data = df.values.tolist();
      X = data.map(row => row.slice(0, -1));
      y = data.map(row => row[row.length - 1]);
    }

    return {
      X,
      y,
      featureNames: df.columns.tolist()
    };
  }

  trainTestSplit(X: number[][], y: number[], testSize: number = 0.2, randomState: number = 42): TrainTestSplit {
    const model_selection = this.sklearn.model_selection;
    const [Xtrain, Xtest, ytrain, ytest] = model_selection.train_test_split(
      this.numpy.array(X),
      this.numpy.array(y),
      { test_size: testSize, random_state: randomState }
    );

    return {
      Xtrain: Xtrain.tolist(),
      Xtest: Xtest.tolist(),
      ytrain: ytrain.tolist(),
      ytest: ytest.tolist()
    };
  }

  // ==========================================================================
  // Feature Scaling
  // ==========================================================================

  createScaler(method: 'standard' | 'minmax' | 'robust' = 'standard'): any {
    const preprocessing = this.sklearn.preprocessing;

    if (method === 'standard') {
      return preprocessing.StandardScaler();
    } else if (method === 'minmax') {
      return preprocessing.MinMaxScaler();
    } else {
      return preprocessing.RobustScaler();
    }
  }

  fitTransform(scaler: any, X: number[][]): number[][] {
    const Xarray = this.numpy.array(X);
    const scaled = scaler.fit_transform(Xarray);
    return scaled.tolist();
  }

  transform(scaler: any, X: number[][]): number[][] {
    const Xarray = this.numpy.array(X);
    const scaled = scaler.transform(Xarray);
    return scaled.tolist();
  }

  // ==========================================================================
  // Model Creation
  // ==========================================================================

  createModel(modelType: string, params: any = {}): any {
    const models: { [key: string]: any } = {
      'LogisticRegression': this.sklearn.linear_model.LogisticRegression,
      'LinearRegression': this.sklearn.linear_model.LinearRegression,
      'Ridge': this.sklearn.linear_model.Ridge,
      'Lasso': this.sklearn.linear_model.Lasso,
      'ElasticNet': this.sklearn.linear_model.ElasticNet,
      'RandomForest': this.sklearn.ensemble.RandomForestClassifier,
      'RandomForestRegressor': this.sklearn.ensemble.RandomForestRegressor,
      'GradientBoosting': this.sklearn.ensemble.GradientBoostingClassifier,
      'GradientBoostingRegressor': this.sklearn.ensemble.GradientBoostingRegressor,
      'SVM': this.sklearn.svm.SVC,
      'SVR': this.sklearn.svm.SVR,
      'KNN': this.sklearn.neighbors.KNeighborsClassifier,
      'KNNRegressor': this.sklearn.neighbors.KNeighborsRegressor,
      'DecisionTree': this.sklearn.tree.DecisionTreeClassifier,
      'DecisionTreeRegressor': this.sklearn.tree.DecisionTreeRegressor,
      'NaiveBayes': this.sklearn.naive_bayes.GaussianNB,
      'AdaBoost': this.sklearn.ensemble.AdaBoostClassifier,
      'XGBoost': () => {
        try {
          const xgb = Python.import('xgboost');
          return xgb.XGBClassifier;
        } catch {
          console.error('XGBoost not available. Install with: pip install xgboost');
          return null;
        }
      }
    };

    const ModelClass = models[modelType];
    if (!ModelClass) {
      throw new Error(`Unknown model type: ${modelType}`);
    }

    return typeof ModelClass === 'function' ? ModelClass() : new ModelClass(params);
  }

  fit(model: any, X: number[][], y: number[]): void {
    const Xarray = this.numpy.array(X);
    const yarray = this.numpy.array(y);
    model.fit(Xarray, yarray);
  }

  predict(model: any, X: number[][]): number[] {
    const Xarray = this.numpy.array(X);
    const predictions = model.predict(Xarray);
    return predictions.tolist();
  }

  predictProba(model: any, X: number[][]): number[][] {
    const Xarray = this.numpy.array(X);
    const probabilities = model.predict_proba(Xarray);
    return probabilities.tolist();
  }

  // ==========================================================================
  // Model Evaluation
  // ==========================================================================

  accuracy(yTrue: number[], yPred: number[]): number {
    const metrics = this.sklearn.metrics;
    return metrics.accuracy_score(
      this.numpy.array(yTrue),
      this.numpy.array(yPred)
    );
  }

  confusionMatrix(yTrue: number[], yPred: number[]): number[][] {
    const metrics = this.sklearn.metrics;
    const cm = metrics.confusion_matrix(
      this.numpy.array(yTrue),
      this.numpy.array(yPred)
    );
    return cm.tolist();
  }

  classificationReport(yTrue: number[], yPred: number[]): any {
    const metrics = this.sklearn.metrics;
    return metrics.classification_report(
      this.numpy.array(yTrue),
      this.numpy.array(yPred),
      { output_dict: true }
    );
  }

  rocAucScore(yTrue: number[], yScore: number[]): number {
    const metrics = this.sklearn.metrics;
    return metrics.roc_auc_score(
      this.numpy.array(yTrue),
      this.numpy.array(yScore)
    );
  }

  rocCurve(yTrue: number[], yScore: number[]): {
    fpr: number[];
    tpr: number[];
    thresholds: number[];
  } {
    const metrics = this.sklearn.metrics;
    const [fpr, tpr, thresholds] = metrics.roc_curve(
      this.numpy.array(yTrue),
      this.numpy.array(yScore)
    );

    return {
      fpr: fpr.tolist(),
      tpr: tpr.tolist(),
      thresholds: thresholds.tolist()
    };
  }

  meanSquaredError(yTrue: number[], yPred: number[]): number {
    const metrics = this.sklearn.metrics;
    return metrics.mean_squared_error(
      this.numpy.array(yTrue),
      this.numpy.array(yPred)
    );
  }

  r2Score(yTrue: number[], yPred: number[]): number {
    const metrics = this.sklearn.metrics;
    return metrics.r2_score(
      this.numpy.array(yTrue),
      this.numpy.array(yPred)
    );
  }

  evaluateModel(model: any, Xtest: number[][], ytest: number[], task: 'classification' | 'regression'): ModelMetrics {
    const predictions = this.predict(model, Xtest);

    if (task === 'classification') {
      const accuracy = this.accuracy(ytest, predictions);
      const report = this.classificationReport(ytest, predictions);

      return {
        accuracy,
        precision: report.weighted_avg?.precision || 0,
        recall: report.weighted_avg?.recall || 0,
        f1: report.weighted_avg?.['f1-score'] || 0
      };
    } else {
      const mse = this.meanSquaredError(ytest, predictions);
      const r2 = this.r2Score(ytest, predictions);
      const mae = this.sklearn.metrics.mean_absolute_error(
        this.numpy.array(ytest),
        this.numpy.array(predictions)
      );

      return {
        mse,
        rmse: Math.sqrt(mse),
        r2,
        mae
      };
    }
  }

  // ==========================================================================
  // Cross-Validation
  // ==========================================================================

  crossValidate(model: any, X: number[][], y: number[], cv: number = 5, scoring?: string): {
    scores: number[];
    mean: number;
    std: number;
  } {
    const model_selection = this.sklearn.model_selection;
    const Xarray = this.numpy.array(X);
    const yarray = this.numpy.array(y);

    const scores = model_selection.cross_val_score(
      model,
      Xarray,
      yarray,
      { cv, scoring: scoring || 'accuracy' }
    );

    const scoresList = scores.tolist();

    return {
      scores: scoresList,
      mean: this.numpy.mean(scores),
      std: this.numpy.std(scores)
    };
  }

  kFold(nSplits: number = 5, shuffle: boolean = true, randomState: number = 42): any {
    const model_selection = this.sklearn.model_selection;
    return model_selection.KFold({ n_splits: nSplits, shuffle, random_state: randomState });
  }

  stratifiedKFold(nSplits: number = 5, shuffle: boolean = true, randomState: number = 42): any {
    const model_selection = this.sklearn.model_selection;
    return model_selection.StratifiedKFold({ n_splits: nSplits, shuffle, random_state: randomState });
  }

  // ==========================================================================
  // Hyperparameter Tuning
  // ==========================================================================

  gridSearch(
    modelType: string,
    X: number[][],
    y: number[],
    paramGrid: any,
    cv: number = 5,
    scoring?: string
  ): {
    bestParams: any;
    bestScore: number;
    bestModel: any;
  } {
    const model_selection = this.sklearn.model_selection;
    const baseModel = this.createModel(modelType);

    const grid = model_selection.GridSearchCV(
      baseModel,
      paramGrid,
      { cv, scoring: scoring || 'accuracy', n_jobs: -1 }
    );

    grid.fit(this.numpy.array(X), this.numpy.array(y));

    return {
      bestParams: grid.best_params_,
      bestScore: grid.best_score_,
      bestModel: grid.best_estimator_
    };
  }

  randomizedSearch(
    modelType: string,
    X: number[][],
    y: number[],
    paramDistributions: any,
    nIter: number = 10,
    cv: number = 5,
    scoring?: string
  ): {
    bestParams: any;
    bestScore: number;
    bestModel: any;
  } {
    const model_selection = this.sklearn.model_selection;
    const baseModel = this.createModel(modelType);

    const random = model_selection.RandomizedSearchCV(
      baseModel,
      paramDistributions,
      { n_iter: nIter, cv, scoring: scoring || 'accuracy', n_jobs: -1, random_state: 42 }
    );

    random.fit(this.numpy.array(X), this.numpy.array(y));

    return {
      bestParams: random.best_params_,
      bestScore: random.best_score_,
      bestModel: random.best_estimator_
    };
  }

  // ==========================================================================
  // Feature Importance
  // ==========================================================================

  featureImportance(model: any, featureNames?: string[]): {
    features: string[];
    importances: number[];
  } {
    if (!model.feature_importances_) {
      throw new Error('Model does not support feature importances');
    }

    const importances = model.feature_importances_.tolist();
    const features = featureNames || Array.from({ length: importances.length }, (_, i) => `Feature ${i}`);

    // Sort by importance
    const sorted = features
      .map((name, i) => ({ name, importance: importances[i] }))
      .sort((a, b) => b.importance - a.importance);

    return {
      features: sorted.map(item => item.name),
      importances: sorted.map(item => item.importance)
    };
  }

  selectKBest(X: number[][], y: number[], k: number = 10, scoreFunc?: string): {
    selectedFeatures: number[];
    scores: number[];
  } {
    const feature_selection = this.sklearn.feature_selection;

    const scoreFuncs: { [key: string]: any } = {
      'f_classif': feature_selection.f_classif,
      'mutual_info_classif': feature_selection.mutual_info_classif,
      'chi2': feature_selection.chi2
    };

    const func = scoreFuncs[scoreFunc || 'f_classif'];
    const selector = feature_selection.SelectKBest({ score_func: func, k });

    selector.fit(this.numpy.array(X), this.numpy.array(y));

    return {
      selectedFeatures: selector.get_support({ indices: true }).tolist(),
      scores: selector.scores_.tolist()
    };
  }

  // ==========================================================================
  // Ensemble Methods
  // ==========================================================================

  votingClassifier(models: any[], voting: 'hard' | 'soft' = 'hard'): any {
    const ensemble = this.sklearn.ensemble;
    const estimators = models.map((model, i) => [`model_${i}`, model]);

    return ensemble.VotingClassifier({ estimators, voting });
  }

  stackingClassifier(models: any[], finalEstimator?: any): any {
    const ensemble = this.sklearn.ensemble;
    const estimators = models.map((model, i) => [`model_${i}`, model]);

    return ensemble.StackingClassifier({
      estimators,
      final_estimator: finalEstimator || this.sklearn.linear_model.LogisticRegression()
    });
  }

  baggingClassifier(baseEstimator: any, nEstimators: number = 10): any {
    const ensemble = this.sklearn.ensemble;
    return ensemble.BaggingClassifier({
      base_estimator: baseEstimator,
      n_estimators: nEstimators,
      random_state: 42
    });
  }

  // ==========================================================================
  // Clustering (Unsupervised)
  // ==========================================================================

  kmeans(X: number[][], nClusters: number = 3): {
    labels: number[];
    centers: number[][];
    inertia: number;
  } {
    const cluster = this.sklearn.cluster;
    const kmeans = cluster.KMeans({ n_clusters: nClusters, random_state: 42 });

    kmeans.fit(this.numpy.array(X));

    return {
      labels: kmeans.labels_.tolist(),
      centers: kmeans.cluster_centers_.tolist(),
      inertia: kmeans.inertia_
    };
  }

  // ==========================================================================
  // Pipelines
  // ==========================================================================

  createPipeline(steps: Array<[string, any]>): any {
    const pipeline = this.sklearn.pipeline;
    return pipeline.Pipeline({ steps });
  }

  // ==========================================================================
  // Model Persistence
  // ==========================================================================

  saveModel(model: any, filepath: string): void {
    const joblib = Python.import('joblib');
    joblib.dump(model, filepath);
  }

  loadModel(filepath: string): any {
    const joblib = Python.import('joblib');
    return joblib.load(filepath);
  }

  // ==========================================================================
  // Visualization
  // ==========================================================================

  plotConfusionMatrix(cm: number[][], labels?: string[]): void {
    this.plotter.figure([8, 6]);

    this.plotter.heatmap(cm, {
      title: 'Confusion Matrix',
      cmap: 'Blues',
      annot: true,
      fmt: 'd',
      square: true
    });

    this.plotter.savefig(`confusion_matrix_${Date.now()}.png`);
  }

  plotROCCurve(roc: { fpr: number[]; tpr: number[] }, auc: number): void {
    this.plotter.figure([8, 6]);

    this.plotter.plot(roc.fpr, roc.tpr, {
      label: `ROC Curve (AUC = ${auc.toFixed(3)})`,
      linewidth: 2,
      color: 'blue'
    });

    // Diagonal line
    this.plotter.plot([0, 1], [0, 1], {
      linestyle: '--',
      color: 'gray',
      label: 'Random Classifier'
    });

    this.plotter.savefig(`roc_curve_${Date.now()}.png`);
  }

  plotFeatureImportance(importance: { features: string[]; importances: number[] }): void {
    this.plotter.figure([10, 6]);

    const top15 = {
      features: importance.features.slice(0, 15),
      importances: importance.importances.slice(0, 15)
    };

    this.plotter.barh(top15.features, top15.importances, {
      title: 'Top 15 Feature Importances',
      xlabel: 'Importance',
      color: 'steelblue'
    });

    this.plotter.savefig(`feature_importance_${Date.now()}.png`);
  }

  plotLearningCurve(model: any, X: number[][], y: number[], cv: number = 5): void {
    const model_selection = this.sklearn.model_selection;
    const [trainSizes, trainScores, testScores] = model_selection.learning_curve(
      model,
      this.numpy.array(X),
      this.numpy.array(y),
      { cv, n_jobs: -1 }
    );

    const trainMean = this.numpy.mean(trainScores, { axis: 1 }).tolist();
    const testMean = this.numpy.mean(testScores, { axis: 1 }).tolist();
    const sizes = trainSizes.tolist();

    this.plotter.figure([10, 6]);

    this.plotter.plot(sizes, trainMean, {
      label: 'Training Score',
      color: 'blue',
      linewidth: 2
    });

    this.plotter.plot(sizes, testMean, {
      label: 'Cross-validation Score',
      color: 'green',
      linewidth: 2
    });

    this.plotter.savefig(`learning_curve_${Date.now()}.png`);
  }

  plotDecisionBoundary(model: any, X: number[][], y: number[], resolution: number = 0.02): void {
    if (X[0].length !== 2) {
      throw new Error('Decision boundary plot only supports 2D data');
    }

    const x1Min = Math.min(...X.map(p => p[0])) - 1;
    const x1Max = Math.max(...X.map(p => p[0])) + 1;
    const x2Min = Math.min(...X.map(p => p[1])) - 1;
    const x2Max = Math.max(...X.map(p => p[1])) + 1;

    // Create meshgrid
    const x1Points = [];
    const x2Points = [];

    for (let x1 = x1Min; x1 <= x1Max; x1 += resolution) {
      for (let x2 = x2Min; x2 <= x2Max; x2 += resolution) {
        x1Points.push(x1);
        x2Points.push(x2);
      }
    }

    const gridPoints = x1Points.map((x1, i) => [x1, x2Points[i]]);
    const predictions = this.predict(model, gridPoints);

    // Plot
    this.plotter.figure([10, 8]);
    this.plotter.scatter(x1Points, x2Points, {
      c: predictions,
      cmap: 'viridis',
      alpha: 0.3,
      edgecolors: 'none'
    });

    // Plot actual points
    const x1Data = X.map(p => p[0]);
    const x2Data = X.map(p => p[1]);
    this.plotter.scatter(x1Data, x2Data, {
      c: y,
      cmap: 'viridis',
      edgecolors: 'black',
      linewidth: 1
    });

    this.plotter.savefig(`decision_boundary_${Date.now()}.png`);
  }
}

export default MachineLearning;
