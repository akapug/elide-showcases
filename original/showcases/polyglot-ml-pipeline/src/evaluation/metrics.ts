/**
 * Model Evaluation Metrics with scikit-learn in TypeScript
 *
 * Demonstrates importing sklearn.metrics for comprehensive model evaluation
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
// @ts-ignore
import pandas from 'python:pandas';

/**
 * Classification Metrics Evaluator
 */
export class ClassificationMetrics {
  private y_true: any;
  private y_pred: any;
  private y_proba: any;
  private class_names: string[];

  constructor(
    y_true: any,
    y_pred: any,
    y_proba?: any,
    class_names?: string[]
  ) {
    this.y_true = y_true;
    this.y_pred = y_pred;
    this.y_proba = y_proba;
    this.class_names = class_names || [];
  }

  /**
   * Calculate all classification metrics
   */
  calculateAll(): Record<string, number> {
    const metrics: Record<string, number> = {
      accuracy: this.accuracy(),
      precision: this.precision(),
      recall: this.recall(),
      f1_score: this.f1Score(),
      balanced_accuracy: this.balancedAccuracy(),
      matthews_corrcoef: this.matthewsCorrCoef(),
      cohen_kappa: this.cohenKappa()
    };

    if (this.y_proba) {
      metrics.log_loss = this.logLoss();
      metrics.brier_score = this.brierScore();
      metrics.roc_auc = this.rocAuc();
      metrics.average_precision = this.averagePrecision();
    }

    console.log('\nClassification Metrics:');
    for (const [name, value] of Object.entries(metrics)) {
      console.log(`  ${name}: ${value.toFixed(4)}`);
    }

    return metrics;
  }

  /**
   * Accuracy score
   */
  accuracy(): number {
    return sklearn.metrics.accuracy_score(this.y_true, this.y_pred);
  }

  /**
   * Precision score
   */
  precision(average: string = 'weighted'): number {
    return sklearn.metrics.precision_score(this.y_true, this.y_pred, {
      average: average,
      zero_division: 0
    });
  }

  /**
   * Recall score
   */
  recall(average: string = 'weighted'): number {
    return sklearn.metrics.recall_score(this.y_true, this.y_pred, {
      average: average,
      zero_division: 0
    });
  }

  /**
   * F1 score
   */
  f1Score(average: string = 'weighted'): number {
    return sklearn.metrics.f1_score(this.y_true, this.y_pred, {
      average: average,
      zero_division: 0
    });
  }

  /**
   * Balanced accuracy
   */
  balancedAccuracy(): number {
    return sklearn.metrics.balanced_accuracy_score(this.y_true, this.y_pred);
  }

  /**
   * Matthews correlation coefficient
   */
  matthewsCorrCoef(): number {
    return sklearn.metrics.matthews_corrcoef(this.y_true, this.y_pred);
  }

  /**
   * Cohen's kappa
   */
  cohenKappa(): number {
    return sklearn.metrics.cohen_kappa_score(this.y_true, this.y_pred);
  }

  /**
   * Log loss
   */
  logLoss(): number {
    if (!this.y_proba) {
      throw new Error('y_proba is required for log loss');
    }
    return sklearn.metrics.log_loss(this.y_true, this.y_proba);
  }

  /**
   * Brier score (for binary classification)
   */
  brierScore(): number {
    if (!this.y_proba) {
      throw new Error('y_proba is required for Brier score');
    }

    // For binary classification
    if (this.y_proba.shape[1] === 2) {
      return sklearn.metrics.brier_score_loss(
        this.y_true,
        this.y_proba.slice([null, 1])
      );
    }

    return 0;
  }

  /**
   * ROC AUC score
   */
  rocAuc(average: string = 'weighted'): number {
    if (!this.y_proba) {
      throw new Error('y_proba is required for ROC AUC');
    }

    const n_classes = this.y_proba.shape[1];

    if (n_classes === 2) {
      return sklearn.metrics.roc_auc_score(
        this.y_true,
        this.y_proba.slice([null, 1])
      );
    } else {
      return sklearn.metrics.roc_auc_score(
        this.y_true,
        this.y_proba,
        { multi_class: 'ovr', average: average }
      );
    }
  }

  /**
   * Average precision score
   */
  averagePrecision(): number {
    if (!this.y_proba) {
      throw new Error('y_proba is required for average precision');
    }

    // For binary classification
    if (this.y_proba.shape[1] === 2) {
      return sklearn.metrics.average_precision_score(
        this.y_true,
        this.y_proba.slice([null, 1])
      );
    }

    return 0;
  }

  /**
   * Confusion matrix
   */
  confusionMatrix(): any {
    return sklearn.metrics.confusion_matrix(this.y_true, this.y_pred);
  }

  /**
   * Classification report
   */
  classificationReport(): string {
    return sklearn.metrics.classification_report(
      this.y_true,
      this.y_pred,
      { target_names: this.class_names.length > 0 ? this.class_names : null }
    );
  }

  /**
   * Per-class metrics
   */
  perClassMetrics(): Record<string, any> {
    const precision = sklearn.metrics.precision_score(
      this.y_true,
      this.y_pred,
      { average: null, zero_division: 0 }
    );

    const recall = sklearn.metrics.recall_score(
      this.y_true,
      this.y_pred,
      { average: null, zero_division: 0 }
    );

    const f1 = sklearn.metrics.f1_score(
      this.y_true,
      this.y_pred,
      { average: null, zero_division: 0 }
    );

    const support = numpy.bincount(this.y_true);

    const metrics: Record<string, any> = {};

    for (let i = 0; i < precision.length; i++) {
      const class_name = this.class_names[i] || `Class ${i}`;
      metrics[class_name] = {
        precision: precision[i],
        recall: recall[i],
        f1_score: f1[i],
        support: support[i]
      };
    }

    return metrics;
  }

  /**
   * Plot confusion matrix
   */
  plotConfusionMatrix(normalize: boolean = false): void {
    const cm = this.confusionMatrix();

    if (normalize) {
      const cm_normalized = cm.astype('float') / cm.sum({ axis: 1, keepdims: true });
      this.plotMatrix(cm_normalized, 'Normalized Confusion Matrix', '.2f');
    } else {
      this.plotMatrix(cm, 'Confusion Matrix', 'd');
    }
  }

  private plotMatrix(matrix: any, title: string, fmt: string): void {
    matplotlib.figure({ figsize: [10, 8] });

    seaborn.heatmap(matrix, {
      annot: true,
      fmt: fmt,
      cmap: 'Blues',
      xticklabels: this.class_names.length > 0 ? this.class_names : 'auto',
      yticklabels: this.class_names.length > 0 ? this.class_names : 'auto'
    });

    matplotlib.ylabel('True Label');
    matplotlib.xlabel('Predicted Label');
    matplotlib.title(title);
    matplotlib.tight_layout();

    const filename = title.toLowerCase().replace(/\s+/g, '_') + '.png';
    matplotlib.savefig(filename, { dpi: 300 });
    console.log(`${title} saved to ${filename}`);
  }

  /**
   * Plot ROC curve
   */
  plotROCCurve(): void {
    if (!this.y_proba) {
      throw new Error('y_proba is required for ROC curve');
    }

    matplotlib.figure({ figsize: [10, 8] });

    const n_classes = this.y_proba.shape[1];

    if (n_classes === 2) {
      // Binary classification
      const [fpr, tpr, _] = sklearn.metrics.roc_curve(
        this.y_true,
        this.y_proba.slice([null, 1])
      );
      const auc = sklearn.metrics.roc_auc_score(
        this.y_true,
        this.y_proba.slice([null, 1])
      );

      matplotlib.plot(fpr, tpr, {
        label: `ROC curve (AUC = ${auc.toFixed(2)})`,
        linewidth: 2
      });
    } else {
      // Multi-class classification
      const y_true_bin = sklearn.preprocessing.label_binarize(
        this.y_true,
        { classes: numpy.arange(n_classes) }
      );

      for (let i = 0; i < n_classes; i++) {
        const [fpr, tpr, _] = sklearn.metrics.roc_curve(
          y_true_bin.slice([null, i]),
          this.y_proba.slice([null, i])
        );
        const auc = sklearn.metrics.roc_auc_score(
          y_true_bin.slice([null, i]),
          this.y_proba.slice([null, i])
        );

        const class_name = this.class_names[i] || `Class ${i}`;
        matplotlib.plot(fpr, tpr, {
          label: `${class_name} (AUC = ${auc.toFixed(2)})`,
          linewidth: 2
        });
      }
    }

    matplotlib.plot([0, 1], [0, 1], {
      color: 'navy',
      linestyle: '--',
      linewidth: 2,
      label: 'Random Classifier'
    });

    matplotlib.xlim([0.0, 1.0]);
    matplotlib.ylim([0.0, 1.05]);
    matplotlib.xlabel('False Positive Rate');
    matplotlib.ylabel('True Positive Rate');
    matplotlib.title('Receiver Operating Characteristic (ROC) Curve');
    matplotlib.legend({ loc: 'lower right' });
    matplotlib.grid(true, { alpha: 0.3 });
    matplotlib.tight_layout();
    matplotlib.savefig('roc_curve.png', { dpi: 300 });

    console.log('ROC curve saved to roc_curve.png');
  }

  /**
   * Plot precision-recall curve
   */
  plotPrecisionRecallCurve(): void {
    if (!this.y_proba) {
      throw new Error('y_proba is required for precision-recall curve');
    }

    matplotlib.figure({ figsize: [10, 8] });

    const n_classes = this.y_proba.shape[1];

    if (n_classes === 2) {
      const [precision, recall, _] = sklearn.metrics.precision_recall_curve(
        this.y_true,
        this.y_proba.slice([null, 1])
      );
      const avg_precision = sklearn.metrics.average_precision_score(
        this.y_true,
        this.y_proba.slice([null, 1])
      );

      matplotlib.plot(recall, precision, {
        label: `PR curve (AP = ${avg_precision.toFixed(2)})`,
        linewidth: 2
      });
    } else {
      const y_true_bin = sklearn.preprocessing.label_binarize(
        this.y_true,
        { classes: numpy.arange(n_classes) }
      );

      for (let i = 0; i < n_classes; i++) {
        const [precision, recall, _] = sklearn.metrics.precision_recall_curve(
          y_true_bin.slice([null, i]),
          this.y_proba.slice([null, i])
        );
        const avg_precision = sklearn.metrics.average_precision_score(
          y_true_bin.slice([null, i]),
          this.y_proba.slice([null, i])
        );

        const class_name = this.class_names[i] || `Class ${i}`;
        matplotlib.plot(recall, precision, {
          label: `${class_name} (AP = ${avg_precision.toFixed(2)})`,
          linewidth: 2
        });
      }
    }

    matplotlib.xlabel('Recall');
    matplotlib.ylabel('Precision');
    matplotlib.title('Precision-Recall Curve');
    matplotlib.legend({ loc: 'lower left' });
    matplotlib.grid(true, { alpha: 0.3 });
    matplotlib.tight_layout();
    matplotlib.savefig('precision_recall_curve.png', { dpi: 300 });

    console.log('Precision-recall curve saved to precision_recall_curve.png');
  }

  /**
   * Plot calibration curve
   */
  plotCalibrationCurve(): void {
    if (!this.y_proba) {
      throw new Error('y_proba is required for calibration curve');
    }

    matplotlib.figure({ figsize: [10, 8] });

    // For binary classification
    if (this.y_proba.shape[1] === 2) {
      const [prob_true, prob_pred] = sklearn.calibration.calibration_curve(
        this.y_true,
        this.y_proba.slice([null, 1]),
        { n_bins: 10 }
      );

      matplotlib.plot(prob_pred, prob_true, {
        marker: 'o',
        linewidth: 2,
        label: 'Model'
      });
    }

    matplotlib.plot([0, 1], [0, 1], {
      linestyle: '--',
      color: 'gray',
      label: 'Perfectly Calibrated'
    });

    matplotlib.xlabel('Mean Predicted Probability');
    matplotlib.ylabel('Fraction of Positives');
    matplotlib.title('Calibration Curve');
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });
    matplotlib.tight_layout();
    matplotlib.savefig('calibration_curve.png', { dpi: 300 });

    console.log('Calibration curve saved to calibration_curve.png');
  }
}

/**
 * Regression Metrics Evaluator
 */
export class RegressionMetrics {
  private y_true: any;
  private y_pred: any;

  constructor(y_true: any, y_pred: any) {
    this.y_true = y_true;
    this.y_pred = y_pred;
  }

  /**
   * Calculate all regression metrics
   */
  calculateAll(): Record<string, number> {
    const metrics = {
      mse: this.mse(),
      rmse: this.rmse(),
      mae: this.mae(),
      mape: this.mape(),
      r2: this.r2(),
      adjusted_r2: this.adjustedR2(),
      explained_variance: this.explainedVariance(),
      max_error: this.maxError(),
      median_absolute_error: this.medianAbsoluteError()
    };

    console.log('\nRegression Metrics:');
    for (const [name, value] of Object.entries(metrics)) {
      console.log(`  ${name}: ${value.toFixed(4)}`);
    }

    return metrics;
  }

  /**
   * Mean Squared Error
   */
  mse(): number {
    return sklearn.metrics.mean_squared_error(this.y_true, this.y_pred);
  }

  /**
   * Root Mean Squared Error
   */
  rmse(): number {
    return Math.sqrt(this.mse());
  }

  /**
   * Mean Absolute Error
   */
  mae(): number {
    return sklearn.metrics.mean_absolute_error(this.y_true, this.y_pred);
  }

  /**
   * Mean Absolute Percentage Error
   */
  mape(): number {
    return sklearn.metrics.mean_absolute_percentage_error(this.y_true, this.y_pred);
  }

  /**
   * R² Score
   */
  r2(): number {
    return sklearn.metrics.r2_score(this.y_true, this.y_pred);
  }

  /**
   * Adjusted R²
   */
  adjustedR2(n_features?: number): number {
    const r2 = this.r2();
    const n = this.y_true.length;

    if (n_features) {
      return 1 - (1 - r2) * (n - 1) / (n - n_features - 1);
    }

    return r2;
  }

  /**
   * Explained Variance Score
   */
  explainedVariance(): number {
    return sklearn.metrics.explained_variance_score(this.y_true, this.y_pred);
  }

  /**
   * Max Error
   */
  maxError(): number {
    return sklearn.metrics.max_error(this.y_true, this.y_pred);
  }

  /**
   * Median Absolute Error
   */
  medianAbsoluteError(): number {
    return sklearn.metrics.median_absolute_error(this.y_true, this.y_pred);
  }

  /**
   * Residuals
   */
  residuals(): any {
    return this.y_true - this.y_pred;
  }

  /**
   * Plot predictions vs actual
   */
  plotPredictionsVsActual(): void {
    matplotlib.figure({ figsize: [10, 8] });

    matplotlib.scatter(this.y_true, this.y_pred, { alpha: 0.5 });
    matplotlib.plot(
      [this.y_true.min(), this.y_true.max()],
      [this.y_true.min(), this.y_true.max()],
      { color: 'red', linestyle: '--', linewidth: 2 }
    );

    matplotlib.xlabel('Actual Values');
    matplotlib.ylabel('Predicted Values');
    matplotlib.title('Predictions vs Actual Values');
    matplotlib.grid(true, { alpha: 0.3 });
    matplotlib.tight_layout();
    matplotlib.savefig('predictions_vs_actual.png', { dpi: 300 });

    console.log('Predictions vs actual plot saved to predictions_vs_actual.png');
  }

  /**
   * Plot residuals
   */
  plotResiduals(): void {
    const residuals = this.residuals();

    matplotlib.figure({ figsize: [15, 5] });

    // Residuals vs predicted
    matplotlib.subplot(1, 3, 1);
    matplotlib.scatter(this.y_pred, residuals, { alpha: 0.5 });
    matplotlib.axhline({ y: 0, color: 'red', linestyle: '--' });
    matplotlib.xlabel('Predicted Values');
    matplotlib.ylabel('Residuals');
    matplotlib.title('Residuals vs Predicted Values');
    matplotlib.grid(true, { alpha: 0.3 });

    // Residuals histogram
    matplotlib.subplot(1, 3, 2);
    matplotlib.hist(residuals, { bins: 30, edgecolor: 'black' });
    matplotlib.xlabel('Residuals');
    matplotlib.ylabel('Frequency');
    matplotlib.title('Residuals Distribution');
    matplotlib.grid(true, { alpha: 0.3 });

    // Q-Q plot
    matplotlib.subplot(1, 3, 3);
    scipy.stats.probplot(residuals, { dist: 'norm', plot: matplotlib });
    matplotlib.title('Q-Q Plot');
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('residuals_analysis.png', { dpi: 300 });

    console.log('Residuals analysis saved to residuals_analysis.png');
  }

  /**
   * Plot error distribution
   */
  plotErrorDistribution(): void {
    const errors = numpy.abs(this.residuals());

    matplotlib.figure({ figsize: [12, 5] });

    // Error distribution
    matplotlib.subplot(1, 2, 1);
    matplotlib.hist(errors, { bins: 50, edgecolor: 'black', alpha: 0.7 });
    matplotlib.xlabel('Absolute Error');
    matplotlib.ylabel('Frequency');
    matplotlib.title('Error Distribution');
    matplotlib.grid(true, { alpha: 0.3 });

    // Cumulative error distribution
    matplotlib.subplot(1, 2, 2);
    const sorted_errors = numpy.sort(errors);
    const cumulative = numpy.arange(1, sorted_errors.length + 1) / sorted_errors.length;
    matplotlib.plot(sorted_errors, cumulative, { linewidth: 2 });
    matplotlib.xlabel('Absolute Error');
    matplotlib.ylabel('Cumulative Probability');
    matplotlib.title('Cumulative Error Distribution');
    matplotlib.grid(true, { alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('error_distribution.png', { dpi: 300 });

    console.log('Error distribution saved to error_distribution.png');
  }
}

/**
 * Cross-Validation Evaluator
 */
export class CrossValidationEvaluator {
  private model: any;
  private X: any;
  private y: any;

  constructor(model: any, X: any, y: any) {
    this.model = model;
    this.X = X;
    this.y = y;
  }

  /**
   * K-Fold cross-validation
   */
  kFoldCV(
    cv: number = 5,
    scoring: string | string[] = 'accuracy'
  ): Record<string, any> {
    console.log(`Running ${cv}-fold cross-validation...`);

    const results = sklearn.model_selection.cross_validate(
      this.model,
      this.X,
      this.y,
      {
        cv: cv,
        scoring: Array.isArray(scoring) ? scoring : [scoring],
        return_train_score: true,
        n_jobs: -1
      }
    );

    const metrics: Record<string, any> = {};

    for (const key of Object.keys(results)) {
      const values = results[key];
      metrics[key] = {
        mean: values.mean(),
        std: values.std(),
        min: values.min(),
        max: values.max(),
        values: values
      };
    }

    this.printCVResults(metrics);

    return metrics;
  }

  /**
   * Stratified K-Fold cross-validation
   */
  stratifiedKFoldCV(
    cv: number = 5,
    scoring: string | string[] = 'accuracy'
  ): Record<string, any> {
    console.log(`Running stratified ${cv}-fold cross-validation...`);

    const skf = new sklearn.model_selection.StratifiedKFold({ n_splits: cv, shuffle: true });

    const results = sklearn.model_selection.cross_validate(
      this.model,
      this.X,
      this.y,
      {
        cv: skf,
        scoring: Array.isArray(scoring) ? scoring : [scoring],
        return_train_score: true,
        n_jobs: -1
      }
    );

    const metrics: Record<string, any> = {};

    for (const key of Object.keys(results)) {
      const values = results[key];
      metrics[key] = {
        mean: values.mean(),
        std: values.std(),
        min: values.min(),
        max: values.max(),
        values: values
      };
    }

    this.printCVResults(metrics);

    return metrics;
  }

  /**
   * Leave-One-Out cross-validation
   */
  leaveOneOutCV(scoring: string = 'accuracy'): Record<string, any> {
    console.log('Running leave-one-out cross-validation...');

    const loo = new sklearn.model_selection.LeaveOneOut();

    const scores = sklearn.model_selection.cross_val_score(
      this.model,
      this.X,
      this.y,
      { cv: loo, scoring: scoring, n_jobs: -1 }
    );

    const metrics = {
      scores: scores,
      mean: scores.mean(),
      std: scores.std()
    };

    console.log(`Mean ${scoring}: ${metrics.mean.toFixed(4)} (+/- ${metrics.std.toFixed(4)})`);

    return metrics;
  }

  /**
   * Time series split cross-validation
   */
  timeSeriesSplitCV(
    n_splits: number = 5,
    scoring: string = 'neg_mean_squared_error'
  ): Record<string, any> {
    console.log(`Running time series split cross-validation with ${n_splits} splits...`);

    const tscv = new sklearn.model_selection.TimeSeriesSplit({ n_splits: n_splits });

    const results = sklearn.model_selection.cross_validate(
      this.model,
      this.X,
      this.y,
      {
        cv: tscv,
        scoring: scoring,
        return_train_score: true,
        n_jobs: -1
      }
    );

    const metrics: Record<string, any> = {};

    for (const key of Object.keys(results)) {
      const values = results[key];
      metrics[key] = {
        mean: values.mean(),
        std: values.std(),
        values: values
      };
    }

    this.printCVResults(metrics);

    return metrics;
  }

  /**
   * Print cross-validation results
   */
  private printCVResults(metrics: Record<string, any>): void {
    console.log('\nCross-Validation Results:');
    for (const [key, value] of Object.entries(metrics)) {
      if (typeof value === 'object' && 'mean' in value) {
        console.log(`  ${key}: ${value.mean.toFixed(4)} (+/- ${value.std.toFixed(4)})`);
      }
    }
  }

  /**
   * Plot cross-validation scores
   */
  plotCVScores(cv_results: Record<string, any>): void {
    const test_scores = cv_results['test_score'].values;
    const train_scores = cv_results['train_score']?.values;

    matplotlib.figure({ figsize: [10, 6] });

    const folds = numpy.arange(1, test_scores.length + 1);

    matplotlib.plot(folds, test_scores, {
      marker: 'o',
      label: 'Test Score',
      linewidth: 2
    });

    if (train_scores) {
      matplotlib.plot(folds, train_scores, {
        marker: 's',
        label: 'Train Score',
        linewidth: 2
      });
    }

    matplotlib.xlabel('Fold');
    matplotlib.ylabel('Score');
    matplotlib.title('Cross-Validation Scores');
    matplotlib.legend();
    matplotlib.grid(true, { alpha: 0.3 });
    matplotlib.tight_layout();
    matplotlib.savefig('cv_scores.png', { dpi: 300 });

    console.log('Cross-validation scores plot saved to cv_scores.png');
  }
}

export default {
  ClassificationMetrics,
  RegressionMetrics,
  CrossValidationEvaluator
};
