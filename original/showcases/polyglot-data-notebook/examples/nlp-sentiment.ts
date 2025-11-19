/**
 * NLP Sentiment Analysis Example
 *
 * This example demonstrates natural language processing and sentiment analysis
 * using transformers and scikit-learn directly in TypeScript.
 */

// ============================================================================
// PYTHON LIBRARY IMPORTS - Polyglot Magic!
// ============================================================================

// @ts-ignore
import transformers from 'python:transformers';
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
 * Text Data Generator
 */
class TextDataGenerator {
  /**
   * Generate synthetic text dataset
   */
  static generateSyntheticDataset(n_samples: number): any {
    console.log('=== Generating Synthetic Text Dataset ===\n');

    // Sample texts with varying sentiments
    const positive_templates = [
      'This product is absolutely amazing! I love it.',
      'Excellent quality and great value for money.',
      'Highly recommended! Best purchase ever.',
      'Outstanding service and fantastic product.',
      'I am extremely satisfied with this purchase.',
      'This exceeded all my expectations. Perfect!',
      'The best product in its category. Love it!',
      'Incredible quality and attention to detail.',
      'Worth every penny. Very happy with it.',
      'This is exactly what I was looking for!'
    ];

    const negative_templates = [
      'This product is terrible. Complete waste of money.',
      'Very disappointed with the quality. Do not buy.',
      'Horrible experience. Would not recommend.',
      'Poor quality and overpriced. Avoid this.',
      'I regret buying this. Total disappointment.',
      'This is the worst product I have ever used.',
      'Extremely unhappy with this purchase.',
      'Low quality and not worth the price at all.',
      'This broke after just one use. Terrible.',
      'Save your money and buy something else.'
    ];

    const neutral_templates = [
      'This product is okay. Nothing special.',
      'It works as described. Average quality.',
      'Decent product but nothing exceptional.',
      'It is alright. Gets the job done.',
      'Not bad, not great. Just average.',
      'This is a standard product. As expected.',
      'Acceptable quality for the price.',
      'It is functional but unremarkable.',
      'Does what it is supposed to do.',
      'Average product with standard features.'
    ];

    const texts: string[] = [];
    const labels: number[] = [];

    const samples_per_class = Math.floor(n_samples / 3);

    // Generate positive samples
    for (let i = 0; i < samples_per_class; i++) {
      const idx = i % positive_templates.length;
      texts.push(positive_templates[idx]);
      labels.push(2); // Positive
    }

    // Generate negative samples
    for (let i = 0; i < samples_per_class; i++) {
      const idx = i % negative_templates.length;
      texts.push(negative_templates[idx]);
      labels.push(0); // Negative
    }

    // Generate neutral samples
    for (let i = 0; i < samples_per_class; i++) {
      const idx = i % neutral_templates.length;
      texts.push(neutral_templates[idx]);
      labels.push(1); // Neutral
    }

    const df = pandas.DataFrame({
      text: texts,
      sentiment: labels
    });

    // Shuffle
    const shuffled = df.sample({ frac: 1, random_state: 42 }).reset_index({ drop: true });

    console.log(`Generated ${shuffled.shape[0]} text samples`);
    console.log('Label distribution:');
    console.log(shuffled['sentiment'].value_counts().toString());

    return shuffled;
  }

  /**
   * Display sample texts
   */
  static displaySamples(df: any, n_samples: number = 5): void {
    console.log('\n=== Sample Texts ===\n');

    const sentiment_map = { 0: 'Negative', 1: 'Neutral', 2: 'Positive' };

    for (let i = 0; i < n_samples; i++) {
      const text = df.iloc(i)['text'];
      const sentiment = df.iloc(i)['sentiment'];
      console.log(`${i + 1}. [${sentiment_map[sentiment]}]`);
      console.log(`   "${text}"\n`);
    }
  }
}

/**
 * Text Preprocessing
 */
class TextPreprocessor {
  /**
   * Clean and preprocess text
   */
  static preprocessText(texts: any): any {
    console.log('\n=== Preprocessing Text ===\n');

    // Convert to lowercase
    const processed = texts.str.lower();

    // Remove extra whitespace
    const cleaned = processed.str.strip();

    console.log('Preprocessing steps:');
    console.log('- Convert to lowercase');
    console.log('- Remove extra whitespace');

    return cleaned;
  }

  /**
   * Tokenize and encode texts
   */
  static tokenizeTexts(texts: any, max_length: number = 128): any {
    console.log('\n=== Tokenizing Texts ===\n');

    // For this example, we'll use simple word-based tokenization
    // In production, you'd use the transformers tokenizer

    const { CountVectorizer } = sklearn.feature_extraction.text;

    const vectorizer = CountVectorizer({
      max_features: 1000,
      max_df: 0.8,
      min_df: 2
    });

    const X = vectorizer.fit_transform(texts);

    console.log(`Vocabulary size: ${vectorizer.vocabulary_.length}`);
    console.log(`Feature matrix shape: ${X.shape}`);

    return { X, vectorizer };
  }

  /**
   * TF-IDF vectorization
   */
  static tfidfVectorization(texts: any): any {
    console.log('\n=== TF-IDF Vectorization ===\n');

    const { TfidfVectorizer } = sklearn.feature_extraction.text;

    const vectorizer = TfidfVectorizer({
      max_features: 1000,
      max_df: 0.8,
      min_df: 2,
      ngram_range: [1, 2]
    });

    const X = vectorizer.fit_transform(texts);

    console.log(`Vocabulary size: ${vectorizer.vocabulary_.length}`);
    console.log(`Feature matrix shape: ${X.shape}`);
    console.log('Using bigrams (1-2 word combinations)');

    return { X, vectorizer };
  }
}

/**
 * Traditional ML Classifiers
 */
class TraditionalClassifiers {
  /**
   * Train Naive Bayes classifier
   */
  static trainNaiveBayes(X_train: any, y_train: any, X_test: any, y_test: any): any {
    console.log('\n=== Training Naive Bayes ===\n');

    const { MultinomialNB } = sklearn.naive_bayes;
    const { accuracy_score, classification_report } = sklearn.metrics;

    const model = MultinomialNB();
    model.fit(X_train, y_train);

    const predictions = model.predict(X_test);
    const accuracy = accuracy_score(y_test, predictions);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log('\nClassification Report:');
    console.log(classification_report(y_test, predictions, {
      target_names: ['Negative', 'Neutral', 'Positive']
    }));

    return { model, predictions, accuracy };
  }

  /**
   * Train Logistic Regression
   */
  static trainLogisticRegression(X_train: any, y_train: any, X_test: any, y_test: any): any {
    console.log('\n=== Training Logistic Regression ===\n');

    const { LogisticRegression } = sklearn.linear_model;
    const { accuracy_score, classification_report } = sklearn.metrics;

    const model = LogisticRegression({
      max_iter: 1000,
      random_state: 42,
      multi_class: 'multinomial'
    });
    model.fit(X_train, y_train);

    const predictions = model.predict(X_test);
    const accuracy = accuracy_score(y_test, predictions);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log('\nClassification Report:');
    console.log(classification_report(y_test, predictions, {
      target_names: ['Negative', 'Neutral', 'Positive']
    }));

    return { model, predictions, accuracy };
  }

  /**
   * Train Random Forest
   */
  static trainRandomForest(X_train: any, y_train: any, X_test: any, y_test: any): any {
    console.log('\n=== Training Random Forest ===\n');

    const { RandomForestClassifier } = sklearn.ensemble;
    const { accuracy_score, classification_report } = sklearn.metrics;

    const model = RandomForestClassifier({
      n_estimators: 100,
      max_depth: 10,
      random_state: 42
    });
    model.fit(X_train, y_train);

    const predictions = model.predict(X_test);
    const accuracy = accuracy_score(y_test, predictions);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log('\nClassification Report:');
    console.log(classification_report(y_test, predictions, {
      target_names: ['Negative', 'Neutral', 'Positive']
    }));

    return { model, predictions, accuracy };
  }

  /**
   * Train SVM classifier
   */
  static trainSVM(X_train: any, y_train: any, X_test: any, y_test: any): any {
    console.log('\n=== Training SVM ===\n');

    const { SVC } = sklearn.svm;
    const { accuracy_score, classification_report } = sklearn.metrics;

    const model = SVC({ kernel: 'linear', random_state: 42 });
    model.fit(X_train, y_train);

    const predictions = model.predict(X_test);
    const accuracy = accuracy_score(y_test, predictions);

    console.log(`Accuracy: ${(accuracy * 100).toFixed(2)}%`);
    console.log('\nClassification Report:');
    console.log(classification_report(y_test, predictions, {
      target_names: ['Negative', 'Neutral', 'Positive']
    }));

    return { model, predictions, accuracy };
  }
}

/**
 * Transformer-based Models
 */
class TransformerModels {
  /**
   * Use pre-trained sentiment analysis pipeline
   */
  static pretrainedSentimentAnalysis(texts: string[]): void {
    console.log('\n=== Pre-trained Sentiment Analysis ===\n');
    console.log('Using transformers pipeline for sentiment analysis...\n');

    const { pipeline } = transformers;

    try {
      const classifier = pipeline('sentiment-analysis');

      console.log('Analyzing sample texts:\n');

      for (let i = 0; i < Math.min(5, texts.length); i++) {
        const text = texts[i];
        const result = classifier(text);

        console.log(`Text: "${text}"`);
        console.log(`Sentiment: ${result[0].label}`);
        console.log(`Confidence: ${(result[0].score * 100).toFixed(2)}%\n`);
      }
    } catch (error) {
      console.log('Note: Pre-trained models require internet connection and model download');
      console.log('Example output:');
      console.log('Sentiment: POSITIVE, Confidence: 99.8%');
    }
  }

  /**
   * Zero-shot classification
   */
  static zeroShotClassification(texts: string[]): void {
    console.log('\n=== Zero-Shot Classification ===\n');

    const { pipeline } = transformers;

    console.log('Zero-shot classification allows classifying without training data');
    console.log('Example usage:\n');

    console.log('const classifier = pipeline("zero-shot-classification");');
    console.log('const labels = ["positive", "negative", "neutral"];');
    console.log('const result = classifier(text, { candidate_labels: labels });');
    console.log('');
    console.log('This would classify text into one of the provided labels');
    console.log('without any fine-tuning or training!');
  }

  /**
   * Named Entity Recognition
   */
  static namedEntityRecognition(): void {
    console.log('\n=== Named Entity Recognition ===\n');

    const { pipeline } = transformers;

    const sample_text = 'Apple Inc. was founded by Steve Jobs in Cupertino, California.';

    console.log('Example NER usage:');
    console.log(`Text: "${sample_text}"\n`);

    console.log('const ner = pipeline("ner", { grouped_entities: true });');
    console.log('const entities = ner(text);\n');

    console.log('Expected entities:');
    console.log('- Apple Inc.: ORGANIZATION');
    console.log('- Steve Jobs: PERSON');
    console.log('- Cupertino: LOCATION');
    console.log('- California: LOCATION');
  }
}

/**
 * Results Analysis
 */
class SentimentAnalyzer {
  /**
   * Compare model performances
   */
  static compareModels(results: Map<string, any>): void {
    console.log('\n=== Model Comparison ===\n');

    const model_names: string[] = [];
    const accuracies: number[] = [];

    for (const [name, result] of results.entries()) {
      model_names.push(name);
      accuracies.push(result.accuracy * 100);
    }

    // Display results
    for (let i = 0; i < model_names.length; i++) {
      console.log(`${model_names[i].padEnd(20)}: ${accuracies[i].toFixed(2)}%`);
    }

    // Find best model
    const max_idx = accuracies.indexOf(Math.max(...accuracies));
    console.log(`\nBest Model: ${model_names[max_idx]} (${accuracies[max_idx].toFixed(2)}%)`);
  }

  /**
   * Plot model comparison
   */
  static plotModelComparison(results: Map<string, any>): void {
    console.log('\n=== Plotting Model Comparison ===\n');

    const model_names: string[] = [];
    const accuracies: number[] = [];

    for (const [name, result] of results.entries()) {
      model_names.push(name);
      accuracies.push(result.accuracy * 100);
    }

    matplotlib.figure({ figsize: [10, 6] });
    matplotlib.bar(model_names, accuracies, {
      color: ['skyblue', 'lightgreen', 'coral', 'gold'],
      alpha: 0.8,
      edgecolor: 'black'
    });

    matplotlib.title('Model Performance Comparison', { fontsize: 14, fontweight: 'bold' });
    matplotlib.xlabel('Model', { fontsize: 12 });
    matplotlib.ylabel('Accuracy (%)', { fontsize: 12 });
    matplotlib.ylim([0, 100]);
    matplotlib.grid({ axis: 'y', alpha: 0.3 });

    // Add value labels on bars
    for (let i = 0; i < accuracies.length; i++) {
      matplotlib.text(
        i,
        accuracies[i] + 2,
        `${accuracies[i].toFixed(1)}%`,
        { ha: 'center', fontweight: 'bold' }
      );
    }

    matplotlib.tight_layout();
    matplotlib.savefig('model_comparison.png', { dpi: 300 });
    matplotlib.close();

    console.log('Model comparison saved to model_comparison.png');
  }

  /**
   * Plot confusion matrix
   */
  static plotConfusionMatrix(y_true: any, y_pred: any): void {
    console.log('\n=== Confusion Matrix ===\n');

    const { confusion_matrix } = sklearn.metrics;

    const cm = confusion_matrix(y_true, y_pred);

    matplotlib.figure({ figsize: [8, 6] });
    seaborn.heatmap(cm, {
      annot: true,
      fmt: 'd',
      cmap: 'Blues',
      xticklabels: ['Negative', 'Neutral', 'Positive'],
      yticklabels: ['Negative', 'Neutral', 'Positive']
    });

    matplotlib.title('Confusion Matrix', { fontsize: 14 });
    matplotlib.xlabel('Predicted Sentiment');
    matplotlib.ylabel('True Sentiment');

    matplotlib.tight_layout();
    matplotlib.savefig('confusion_matrix.png', { dpi: 300 });
    matplotlib.close();

    console.log('Confusion matrix saved to confusion_matrix.png');
  }

  /**
   * Analyze sentiment distribution
   */
  static analyzeSentimentDistribution(df: any): void {
    console.log('\n=== Sentiment Distribution ===\n');

    const counts = df['sentiment'].value_counts();
    const sentiment_map = { 0: 'Negative', 1: 'Neutral', 2: 'Positive' };

    matplotlib.figure({ figsize: [10, 6] });

    const labels = [sentiment_map[0], sentiment_map[1], sentiment_map[2]];
    const values = [counts[0], counts[1], counts[2]];
    const colors = ['#ff6b6b', '#ffd93d', '#6bcf7f'];

    matplotlib.bar(labels, values, { color: colors, alpha: 0.8, edgecolor: 'black' });
    matplotlib.title('Sentiment Distribution', { fontsize: 14, fontweight: 'bold' });
    matplotlib.xlabel('Sentiment', { fontsize: 12 });
    matplotlib.ylabel('Count', { fontsize: 12 });
    matplotlib.grid({ axis: 'y', alpha: 0.3 });

    matplotlib.tight_layout();
    matplotlib.savefig('sentiment_distribution.png', { dpi: 300 });
    matplotlib.close();

    console.log('Sentiment distribution saved to sentiment_distribution.png');
  }

  /**
   * Word cloud analysis
   */
  static wordCloudAnalysis(texts: any, sentiments: any): void {
    console.log('\n=== Word Cloud Analysis ===\n');

    console.log('Word cloud analysis would show most frequent words');
    console.log('per sentiment class using python:wordcloud');
    console.log('');
    console.log('Example:');
    console.log('// @ts-ignore');
    console.log("import WordCloud from 'python:wordcloud';");
    console.log('');
    console.log('const positive_texts = texts[sentiments === 2].str.cat(sep=" ");');
    console.log('const wordcloud = WordCloud({ width: 800, height: 400 });');
    console.log('wordcloud.generate(positive_texts);');
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('='.repeat(80));
  console.log('NLP SENTIMENT ANALYSIS - POLYGLOT DATA SCIENCE');
  console.log('='.repeat(80));

  // Generate dataset
  const df = TextDataGenerator.generateSyntheticDataset(300);
  TextDataGenerator.displaySamples(df, 5);

  // Analyze distribution
  SentimentAnalyzer.analyzeSentimentDistribution(df);

  // Preprocess text
  const texts = TextPreprocessor.preprocessText(df['text']);

  // Vectorization
  const { X: X_tfidf, vectorizer } = TextPreprocessor.tfidfVectorization(texts);
  const y = df['sentiment'].values;

  // Split data
  const { train_test_split } = sklearn.model_selection;
  const [X_train, X_test, y_train, y_test] = train_test_split(
    X_tfidf,
    y,
    { test_size: 0.2, random_state: 42 }
  );

  console.log(`\nTrain size: ${X_train.shape[0]}`);
  console.log(`Test size: ${X_test.shape[0]}`);

  // Train models
  const results = new Map<string, any>();

  results.set(
    'Naive Bayes',
    TraditionalClassifiers.trainNaiveBayes(X_train, y_train, X_test, y_test)
  );

  results.set(
    'Logistic Regression',
    TraditionalClassifiers.trainLogisticRegression(X_train, y_train, X_test, y_test)
  );

  results.set(
    'Random Forest',
    TraditionalClassifiers.trainRandomForest(X_train, y_train, X_test, y_test)
  );

  results.set(
    'SVM',
    TraditionalClassifiers.trainSVM(X_train, y_train, X_test, y_test)
  );

  // Compare models
  SentimentAnalyzer.compareModels(results);
  SentimentAnalyzer.plotModelComparison(results);

  // Plot confusion matrix (best model)
  const best_result = results.get('Logistic Regression');
  SentimentAnalyzer.plotConfusionMatrix(y_test, best_result.predictions);

  // Transformer examples
  const sample_texts = df['text'].head(5).tolist();
  TransformerModels.pretrainedSentimentAnalysis(sample_texts);
  TransformerModels.zeroShotClassification(sample_texts);
  TransformerModels.namedEntityRecognition();

  // Word cloud
  SentimentAnalyzer.wordCloudAnalysis(df['text'], df['sentiment']);

  console.log('\n' + '='.repeat(80));
  console.log('SENTIMENT ANALYSIS COMPLETE');
  console.log('='.repeat(80));
}

// Run the analysis
if (require.main === module) {
  main();
}

export {
  TextDataGenerator,
  TextPreprocessor,
  TraditionalClassifiers,
  TransformerModels,
  SentimentAnalyzer
};
