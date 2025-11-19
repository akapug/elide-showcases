/**
 * NLP with Transformers using Hugging Face in TypeScript
 *
 * Demonstrates using transformer models for NLP tasks
 * (classification, NER, QA) by importing transformers library in TypeScript.
 */

// @ts-ignore
import transformers from 'python:transformers';
// @ts-ignore
import torch from 'python:torch';
// @ts-ignore
import numpy from 'python:numpy';
// @ts-ignore
import pandas from 'python:pandas';
// @ts-ignore
import sklearn from 'python:sklearn';

/**
 * Text Classification with Transformers
 */
export class TransformerTextClassifier {
  private tokenizer: any;
  private model: any;
  private device: any;
  private max_length: number;

  constructor(
    model_name: string = 'bert-base-uncased',
    num_labels: number = 2,
    max_length: number = 512
  ) {
    this.max_length = max_length;
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    console.log(`Loading ${model_name} model...`);
    console.log(`Using device: ${this.device}`);

    // Load tokenizer and model
    this.tokenizer = transformers.AutoTokenizer.from_pretrained(model_name);
    this.model = transformers.AutoModelForSequenceClassification.from_pretrained(
      model_name,
      { num_labels: num_labels }
    );

    this.model.to(this.device);
    console.log('Model loaded successfully');
  }

  /**
   * Tokenize texts
   */
  private tokenize(
    texts: string[],
    padding: boolean = true,
    truncation: boolean = true
  ): any {
    return this.tokenizer(texts, {
      padding: padding,
      truncation: truncation,
      max_length: this.max_length,
      return_tensors: 'pt'
    });
  }

  /**
   * Train the model
   */
  async train(
    train_texts: string[],
    train_labels: number[],
    val_texts: string[],
    val_labels: number[],
    epochs: number = 3,
    batch_size: number = 16,
    learning_rate: number = 2e-5
  ): Promise<void> {
    console.log('Starting training...');

    // Create datasets
    const train_dataset = this.createDataset(train_texts, train_labels);
    const val_dataset = this.createDataset(val_texts, val_labels);

    // Training arguments
    const training_args = new transformers.TrainingArguments({
      output_dir: './results',
      num_train_epochs: epochs,
      per_device_train_batch_size: batch_size,
      per_device_eval_batch_size: batch_size,
      learning_rate: learning_rate,
      warmup_steps: 500,
      weight_decay: 0.01,
      logging_dir: './logs',
      logging_steps: 100,
      evaluation_strategy: 'epoch',
      save_strategy: 'epoch',
      load_best_model_at_end: true,
      metric_for_best_model: 'accuracy',
      save_total_limit: 2
    });

    // Metrics computation
    const compute_metrics = (eval_pred: any) => {
      const predictions = numpy.argmax(eval_pred.predictions, { axis: 1 });
      const labels = eval_pred.label_ids;

      return {
        accuracy: sklearn.metrics.accuracy_score(labels, predictions),
        f1: sklearn.metrics.f1_score(labels, predictions, { average: 'weighted' }),
        precision: sklearn.metrics.precision_score(labels, predictions, { average: 'weighted' }),
        recall: sklearn.metrics.recall_score(labels, predictions, { average: 'weighted' })
      };
    };

    // Create trainer
    const trainer = new transformers.Trainer({
      model: this.model,
      args: training_args,
      train_dataset: train_dataset,
      eval_dataset: val_dataset,
      compute_metrics: compute_metrics
    });

    // Train
    trainer.train();

    console.log('Training completed');
  }

  /**
   * Create dataset
   */
  private createDataset(texts: string[], labels: number[]): any {
    const encodings = this.tokenize(texts);

    // Custom dataset class
    class TextDataset {
      encodings: any;
      labels: any;

      constructor(encodings: any, labels: any) {
        this.encodings = encodings;
        this.labels = labels;
      }

      __getitem__(idx: number): any {
        const item: any = {};
        for (const key of Object.keys(this.encodings)) {
          item[key] = this.encodings[key][idx];
        }
        item['labels'] = torch.tensor(this.labels[idx]);
        return item;
      }

      __len__(): number {
        return this.labels.length;
      }
    }

    return new TextDataset(encodings, labels);
  }

  /**
   * Predict sentiment
   */
  predict(texts: string[]): Array<{ label: number; score: number }> {
    this.model.eval();

    const encodings = this.tokenize(texts);
    const input_ids = encodings['input_ids'].to(this.device);
    const attention_mask = encodings['attention_mask'].to(this.device);

    let outputs: any;
    torch.no_grad(() => {
      outputs = this.model(input_ids, attention_mask);
    });

    const logits = outputs.logits;
    const probs = torch.nn.functional.softmax(logits, { dim: 1 });

    const results: Array<{ label: number; score: number }> = [];

    for (let i = 0; i < texts.length; i++) {
      const prob = probs[i].cpu().numpy();
      const label = numpy.argmax(prob);
      const score = prob[label];

      results.push({ label: label, score: score });
    }

    return results;
  }

  /**
   * Get embeddings
   */
  getEmbeddings(texts: string[]): any {
    this.model.eval();

    const encodings = this.tokenize(texts);
    const input_ids = encodings['input_ids'].to(this.device);
    const attention_mask = encodings['attention_mask'].to(this.device);

    let embeddings: any;
    torch.no_grad(() => {
      const outputs = this.model.bert(input_ids, attention_mask);
      // Use [CLS] token embeddings
      embeddings = outputs.last_hidden_state.slice([null, 0, null]);
    });

    return embeddings.cpu().numpy();
  }

  /**
   * Save model
   */
  save(path: string): void {
    this.model.save_pretrained(path);
    this.tokenizer.save_pretrained(path);
    console.log(`Model saved to ${path}`);
  }

  /**
   * Load model
   */
  static load(path: string, num_labels: number = 2): TransformerTextClassifier {
    const classifier = new TransformerTextClassifier('bert-base-uncased', num_labels);
    classifier.model = transformers.AutoModelForSequenceClassification.from_pretrained(path);
    classifier.tokenizer = transformers.AutoTokenizer.from_pretrained(path);
    classifier.model.to(classifier.device);
    console.log(`Model loaded from ${path}`);
    return classifier;
  }
}

/**
 * Named Entity Recognition with Transformers
 */
export class TransformerNER {
  private tokenizer: any;
  private model: any;
  private device: any;
  private label_list: string[];

  constructor(
    model_name: string = 'bert-base-uncased',
    label_list: string[] = ['O', 'B-PER', 'I-PER', 'B-ORG', 'I-ORG', 'B-LOC', 'I-LOC']
  ) {
    this.label_list = label_list;
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    console.log(`Loading ${model_name} for NER...`);

    this.tokenizer = transformers.AutoTokenizer.from_pretrained(model_name);
    this.model = transformers.AutoModelForTokenClassification.from_pretrained(
      model_name,
      { num_labels: label_list.length }
    );

    this.model.to(this.device);
    console.log('NER model loaded successfully');
  }

  /**
   * Predict entities in text
   */
  predictEntities(text: string): Array<{ word: string; entity: string; score: number }> {
    this.model.eval();

    const encoding = this.tokenizer(text, {
      return_tensors: 'pt',
      truncation: true,
      padding: true
    });

    const input_ids = encoding['input_ids'].to(this.device);
    const attention_mask = encoding['attention_mask'].to(this.device);

    let outputs: any;
    torch.no_grad(() => {
      outputs = this.model(input_ids, attention_mask);
    });

    const predictions = torch.argmax(outputs.logits, { dim: 2 });
    const predicted_labels = predictions[0].cpu().numpy();

    // Get tokens
    const tokens = this.tokenizer.convert_ids_to_tokens(input_ids[0]);

    // Extract entities
    const entities: Array<{ word: string; entity: string; score: number }> = [];
    let current_entity: string[] = [];
    let current_label = 'O';

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const label = this.label_list[predicted_labels[i]];

      if (token.startsWith('##')) {
        continue;
      }

      if (label.startsWith('B-')) {
        if (current_entity.length > 0) {
          entities.push({
            word: current_entity.join(' '),
            entity: current_label,
            score: 1.0
          });
        }
        current_entity = [token];
        current_label = label.slice(2);
      } else if (label.startsWith('I-') && current_label === label.slice(2)) {
        current_entity.push(token);
      } else {
        if (current_entity.length > 0) {
          entities.push({
            word: current_entity.join(' '),
            entity: current_label,
            score: 1.0
          });
        }
        current_entity = [];
        current_label = 'O';
      }
    }

    if (current_entity.length > 0) {
      entities.push({
        word: current_entity.join(' '),
        entity: current_label,
        score: 1.0
      });
    }

    return entities;
  }
}

/**
 * Question Answering with Transformers
 */
export class TransformerQA {
  private tokenizer: any;
  private model: any;
  private device: any;

  constructor(model_name: string = 'bert-large-uncased-whole-word-masking-finetuned-squad') {
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    console.log(`Loading ${model_name} for QA...`);

    this.tokenizer = transformers.AutoTokenizer.from_pretrained(model_name);
    this.model = transformers.AutoModelForQuestionAnswering.from_pretrained(model_name);

    this.model.to(this.device);
    console.log('QA model loaded successfully');
  }

  /**
   * Answer question based on context
   */
  answerQuestion(
    question: string,
    context: string
  ): { answer: string; score: number; start: number; end: number } {
    this.model.eval();

    const encoding = this.tokenizer(question, context, {
      return_tensors: 'pt',
      truncation: true,
      padding: true,
      max_length: 512
    });

    const input_ids = encoding['input_ids'].to(this.device);
    const attention_mask = encoding['attention_mask'].to(this.device);

    let outputs: any;
    torch.no_grad(() => {
      outputs = this.model(input_ids, attention_mask);
    });

    const start_scores = outputs.start_logits[0];
    const end_scores = outputs.end_logits[0];

    const start_idx = torch.argmax(start_scores).item();
    const end_idx = torch.argmax(end_scores).item();

    const answer_tokens = input_ids[0][start_idx:end_idx + 1];
    const answer = this.tokenizer.decode(answer_tokens);

    const score = (start_scores[start_idx] + end_scores[end_idx]).item() / 2;

    return {
      answer: answer.trim(),
      score: score,
      start: start_idx,
      end: end_idx
    };
  }

  /**
   * Get top N answers
   */
  getTopAnswers(
    question: string,
    context: string,
    n: number = 5
  ): Array<{ answer: string; score: number }> {
    this.model.eval();

    const encoding = this.tokenizer(question, context, {
      return_tensors: 'pt',
      truncation: true,
      padding: true,
      max_length: 512
    });

    const input_ids = encoding['input_ids'].to(this.device);
    const attention_mask = encoding['attention_mask'].to(this.device);

    let outputs: any;
    torch.no_grad(() => {
      outputs = this.model(input_ids, attention_mask);
    });

    const start_scores = outputs.start_logits[0];
    const end_scores = outputs.end_logits[0];

    // Get top start and end positions
    const top_starts = torch.topk(start_scores, n);
    const top_ends = torch.topk(end_scores, n);

    const answers: Array<{ answer: string; score: number }> = [];

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const start_idx = top_starts.indices[i].item();
        const end_idx = top_ends.indices[j].item();

        if (end_idx >= start_idx && end_idx - start_idx < 50) {
          const answer_tokens = input_ids[0][start_idx:end_idx + 1];
          const answer = this.tokenizer.decode(answer_tokens);

          const score = (
            top_starts.values[i].item() + top_ends.values[j].item()
          ) / 2;

          answers.push({
            answer: answer.trim(),
            score: score
          });
        }
      }
    }

    // Sort by score and remove duplicates
    answers.sort((a, b) => b.score - a.score);
    const unique_answers = answers.filter(
      (ans, idx, self) => self.findIndex(a => a.answer === ans.answer) === idx
    );

    return unique_answers.slice(0, n);
  }
}

/**
 * Text Generation with GPT
 */
export class TransformerTextGenerator {
  private tokenizer: any;
  private model: any;
  private device: any;

  constructor(model_name: string = 'gpt2') {
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    console.log(`Loading ${model_name} for text generation...`);

    this.tokenizer = transformers.AutoTokenizer.from_pretrained(model_name);
    this.model = transformers.AutoModelForCausalLM.from_pretrained(model_name);

    this.model.to(this.device);
    console.log('Text generation model loaded successfully');
  }

  /**
   * Generate text
   */
  generate(
    prompt: string,
    max_length: number = 100,
    num_return_sequences: number = 1,
    temperature: number = 1.0,
    top_k: number = 50,
    top_p: number = 0.95
  ): string[] {
    this.model.eval();

    const input_ids = this.tokenizer.encode(prompt, { return_tensors: 'pt' }).to(this.device);

    let outputs: any;
    torch.no_grad(() => {
      outputs = this.model.generate(
        input_ids,
        {
          max_length: max_length,
          num_return_sequences: num_return_sequences,
          temperature: temperature,
          top_k: top_k,
          top_p: top_p,
          do_sample: true,
          pad_token_id: this.tokenizer.eos_token_id
        }
      );
    });

    const generated_texts: string[] = [];

    for (let i = 0; i < num_return_sequences; i++) {
      const generated_text = this.tokenizer.decode(outputs[i], {
        skip_special_tokens: true
      });
      generated_texts.push(generated_text);
    }

    return generated_texts;
  }
}

/**
 * Summarization with T5
 */
export class TransformerSummarizer {
  private tokenizer: any;
  private model: any;
  private device: any;

  constructor(model_name: string = 't5-base') {
    this.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu');

    console.log(`Loading ${model_name} for summarization...`);

    this.tokenizer = transformers.AutoTokenizer.from_pretrained(model_name);
    this.model = transformers.AutoModelForSeq2SeqLM.from_pretrained(model_name);

    this.model.to(this.device);
    console.log('Summarization model loaded successfully');
  }

  /**
   * Summarize text
   */
  summarize(
    text: string,
    max_length: number = 150,
    min_length: number = 40,
    num_beams: number = 4
  ): string {
    this.model.eval();

    // Prepend task prefix for T5
    const input_text = `summarize: ${text}`;

    const input_ids = this.tokenizer.encode(
      input_text,
      { return_tensors: 'pt', max_length: 512, truncation: true }
    ).to(this.device);

    let summary_ids: any;
    torch.no_grad(() => {
      summary_ids = this.model.generate(
        input_ids,
        {
          max_length: max_length,
          min_length: min_length,
          num_beams: num_beams,
          early_stopping: true
        }
      );
    });

    const summary = this.tokenizer.decode(summary_ids[0], {
      skip_special_tokens: true
    });

    return summary;
  }
}

/**
 * Zero-Shot Classification
 */
export class ZeroShotClassifier {
  private pipeline: any;

  constructor(model_name: string = 'facebook/bart-large-mnli') {
    console.log(`Loading ${model_name} for zero-shot classification...`);

    this.pipeline = transformers.pipeline(
      'zero-shot-classification',
      { model: model_name }
    );

    console.log('Zero-shot classifier loaded successfully');
  }

  /**
   * Classify text with candidate labels
   */
  classify(
    text: string,
    candidate_labels: string[],
    multi_label: boolean = false
  ): { labels: string[]; scores: number[] } {
    const result = this.pipeline(text, candidate_labels, {
      multi_label: multi_label
    });

    return {
      labels: result['labels'],
      scores: result['scores']
    };
  }
}

/**
 * Example usage: Sentiment analysis
 */
async function sentimentAnalysisExample() {
  console.log('=== Sentiment Analysis with BERT ===\n');

  // Sample data
  const train_texts = [
    'I love this product, it works great!',
    'This is the worst experience ever.',
    'Amazing quality and fast delivery.',
    'Terrible customer service, very disappointed.',
    'Highly recommended, worth every penny!',
    'Complete waste of money.'
  ];

  const train_labels = [1, 0, 1, 0, 1, 0]; // 1 = positive, 0 = negative

  const val_texts = [
    'Good value for money.',
    'Not satisfied with the purchase.'
  ];

  const val_labels = [1, 0];

  // Create classifier
  const classifier = new TransformerTextClassifier('distilbert-base-uncased', 2, 128);

  // Train
  await classifier.train(
    train_texts,
    train_labels,
    val_texts,
    val_labels,
    3,
    8,
    5e-5
  );

  // Test predictions
  const test_texts = [
    'This product exceeded my expectations!',
    'Very poor quality, do not buy.'
  ];

  const predictions = classifier.predict(test_texts);

  console.log('\nPredictions:');
  for (let i = 0; i < test_texts.length; i++) {
    const sentiment = predictions[i].label === 1 ? 'Positive' : 'Negative';
    console.log(`Text: "${test_texts[i]}"`);
    console.log(`Sentiment: ${sentiment} (${(predictions[i].score * 100).toFixed(2)}%)\n`);
  }

  // Save model
  classifier.save('./sentiment_model');
}

/**
 * Example usage: Question answering
 */
function questionAnsweringExample() {
  console.log('=== Question Answering with BERT ===\n');

  const qa = new TransformerQA();

  const context = `
    The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris, France.
    It is named after the engineer Gustave Eiffel, whose company designed and built the tower.
    Constructed from 1887 to 1889, it was initially criticized by some of France's leading
    artists and intellectuals for its design, but it has become a global cultural icon of
    France and one of the most recognizable structures in the world. The tower is 330 meters
    (1,083 ft) tall, about the same height as an 81-story building.
  `;

  const questions = [
    'Where is the Eiffel Tower located?',
    'When was the Eiffel Tower built?',
    'How tall is the Eiffel Tower?',
    'Who designed the Eiffel Tower?'
  ];

  console.log('Context:', context.trim(), '\n');

  for (const question of questions) {
    const answer = qa.answerQuestion(question, context);
    console.log(`Q: ${question}`);
    console.log(`A: ${answer.answer} (confidence: ${answer.score.toFixed(2)})\n`);
  }
}

export {
  TransformerTextClassifier,
  TransformerNER,
  TransformerQA,
  TransformerTextGenerator,
  TransformerSummarizer,
  ZeroShotClassifier,
  sentimentAnalysisExample,
  questionAnsweringExample
};

export default TransformerTextClassifier;
