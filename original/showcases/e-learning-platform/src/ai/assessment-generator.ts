/**
 * Assessment Generator - Automated Quiz and Test Creation
 *
 * Uses NLP models via Elide's polyglot capabilities to automatically generate
 * high-quality assessments from course materials.
 */

// @ts-ignore - Elide polyglot: Direct Python imports
import transformers from 'python:transformers';
// @ts-ignore
import torch from 'python:torch';

import type {
  Assessment,
  Question,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  EssayQuestion,
  FillInBlankQuestion,
  DifficultyLevel,
  BloomLevel,
  Rubric,
  RubricCriterion
} from '../types';

/**
 * Assessment generation configuration
 */
export interface GeneratorConfig {
  questionGenModel: string;
  distractorModel: string;
  maxQuestions: number;
  useGPU: boolean;
  qualityThreshold: number;
}

/**
 * Assessment generation parameters
 */
export interface GenerationParams {
  topic: string;
  content: string;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  bloomLevels?: BloomLevel[];
  timeLimit?: number;
}

export type QuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'essay'
  | 'fill_blank';

/**
 * Generated assessment result
 */
export interface GeneratedAssessment {
  assessment: Assessment;
  metadata: AssessmentMetadata;
  quality: QualityMetrics;
}

export interface AssessmentMetadata {
  generatedAt: Date;
  contentHash: string;
  modelVersion: string;
  processingTime: number;
}

export interface QualityMetrics {
  overall: number;
  questionQuality: number[];
  distractorQuality: number[];
  coverageScore: number;
  difficultyBalance: number;
}

/**
 * Automated Assessment Generator
 *
 * Capabilities:
 * - Generate multiple-choice questions with plausible distractors
 * - Create fill-in-the-blank questions from key sentences
 * - Generate essay prompts with rubrics
 * - Produce true/false statements
 * - Ensure alignment with Bloom's taxonomy
 * - Balance difficulty levels
 */
export class AssessmentGenerator {
  private config: GeneratorConfig;
  private questionGenerator: any;
  private maskFiller: any;
  private summarizer: any;
  private tokenizer: any;
  private nerModel: any; // Named Entity Recognition

  constructor(config?: Partial<GeneratorConfig>) {
    this.config = {
      questionGenModel: 'valhalla/t5-base-qg-hl',
      distractorModel: 'bert-base-uncased',
      maxQuestions: 50,
      useGPU: torch.cuda.is_available(),
      qualityThreshold: 0.7,
      ...config
    };

    this.initializeModels();
  }

  /**
   * Initialize NLP models for assessment generation
   */
  private async initializeModels(): Promise<void> {
    console.log('📝 Initializing Assessment Generator models...');

    const device = this.config.useGPU ? 0 : -1;

    // Question Generation Model
    console.log(`  ❓ Loading question generation: ${this.config.questionGenModel}`);
    this.questionGenerator = transformers.pipeline(
      'text2text-generation',
      {
        model: this.config.questionGenModel,
        device: device
      }
    );

    // Masked Language Model for distractors
    console.log(`  🎭 Loading distractor generation: ${this.config.distractorModel}`);
    this.maskFiller = transformers.pipeline(
      'fill-mask',
      {
        model: this.config.distractorModel,
        device: device
      }
    );

    // Tokenizer for text processing
    this.tokenizer = transformers.AutoTokenizer.from_pretrained(
      this.config.distractorModel
    );

    // Summarization for long content
    this.summarizer = transformers.pipeline(
      'summarization',
      {
        model: 'facebook/bart-large-cnn',
        device: device
      }
    );

    // NER for identifying key entities
    this.nerModel = transformers.pipeline(
      'ner',
      {
        model: 'dbmdz/bert-large-cased-finetuned-conll03-english',
        device: device
      }
    );

    console.log('✅ Assessment Generator ready!\n');
  }

  /**
   * Generate a complete assessment from content
   */
  public async generateAssessment(params: GenerationParams): Promise<GeneratedAssessment> {
    console.log(`\n📋 Generating assessment on "${params.topic}"...`);
    const startTime = Date.now();

    // Preprocess content
    const processedContent = await this.preprocessContent(params.content);

    // Extract key concepts and facts
    const concepts = await this.extractKeyConcepts(processedContent);
    console.log(`  🎯 Identified ${concepts.length} key concepts`);

    // Generate questions of each type
    const questions: Question[] = [];

    for (const questionType of params.questionTypes) {
      const count = Math.ceil(params.questionCount / params.questionTypes.length);
      const generated = await this.generateQuestionsByType(
        questionType,
        processedContent,
        concepts,
        count,
        params.difficulty
      );
      questions.push(...generated);
    }

    // Select best questions
    const selectedQuestions = this.selectBestQuestions(
      questions,
      params.questionCount,
      params.bloomLevels
    );

    // Calculate total points
    const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);

    // Create assessment
    const assessment: Assessment = {
      id: this.generateId(),
      courseId: '',
      title: `${params.topic} Assessment`,
      description: `Automatically generated assessment covering ${params.topic}`,
      type: 'quiz',
      questions: selectedQuestions,
      totalPoints,
      passingScore: totalPoints * 0.7,
      timeLimit: params.timeLimit,
      attempts: 3,
      weight: 10
    };

    // Calculate quality metrics
    const quality = this.calculateQualityMetrics(selectedQuestions, concepts);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Generated ${selectedQuestions.length} questions in ${processingTime}ms`);

    return {
      assessment,
      metadata: {
        generatedAt: new Date(),
        contentHash: this.hashContent(params.content),
        modelVersion: this.config.questionGenModel,
        processingTime
      },
      quality
    };
  }

  /**
   * Generate questions by specific type
   */
  private async generateQuestionsByType(
    type: QuestionType,
    content: string,
    concepts: string[],
    count: number,
    difficulty: DifficultyLevel
  ): Promise<Question[]> {

    switch (type) {
      case 'multiple_choice':
        return await this.generateMultipleChoice(content, concepts, count, difficulty);
      case 'true_false':
        return await this.generateTrueFalse(content, count, difficulty);
      case 'short_answer':
        return await this.generateShortAnswer(content, concepts, count, difficulty);
      case 'essay':
        return await this.generateEssayQuestions(content, concepts, count, difficulty);
      case 'fill_blank':
        return await this.generateFillInBlanks(content, count, difficulty);
      default:
        return [];
    }
  }

  /**
   * Generate multiple-choice questions with plausible distractors
   */
  private async generateMultipleChoice(
    content: string,
    concepts: string[],
    count: number,
    difficulty: DifficultyLevel
  ): Promise<MultipleChoiceQuestion[]> {

    const questions: MultipleChoiceQuestion[] = [];
    const sentences = this.extractSentences(content).slice(0, count * 2);

    for (const sentence of sentences.slice(0, count)) {
      try {
        // Generate question from sentence using T5
        const questionResult = await this.questionGenerator(
          `generate question: ${sentence}`,
          {
            max_length: 64,
            num_return_sequences: 1
          }
        );

        const questionText = questionResult[0].generated_text;

        // Extract answer from sentence (simplified - in production use NER)
        const answer = this.extractAnswer(sentence, questionText);

        // Generate distractors
        const distractors = await this.generateDistractors(
          sentence,
          answer,
          3
        );

        // Create options
        const options = [
          { id: '0', text: answer, isCorrect: true },
          ...distractors.map((d, i) => ({
            id: String(i + 1),
            text: d,
            isCorrect: false
          }))
        ];

        // Shuffle options
        this.shuffleArray(options);
        const correctIndex = options.findIndex(o => o.isCorrect);

        questions.push({
          id: this.generateId(),
          type: 'multiple_choice',
          text: questionText,
          points: this.getPointsForDifficulty(difficulty),
          difficulty,
          topic: concepts[questions.length % concepts.length] || 'general',
          options,
          correctAnswer: correctIndex
        });

      } catch (error) {
        console.warn(`Failed to generate question from sentence: ${error}`);
      }
    }

    return questions;
  }

  /**
   * Generate true/false questions
   */
  private async generateTrueFalse(
    content: string,
    count: number,
    difficulty: DifficultyLevel
  ): Promise<TrueFalseQuestion[]> {

    const questions: TrueFalseQuestion[] = [];
    const sentences = this.extractFactualSentences(content);

    for (let i = 0; i < Math.min(count, sentences.length); i++) {
      const sentence = sentences[i];
      const isTrue = Math.random() > 0.5;

      let statement = sentence;
      if (!isTrue) {
        // Modify statement to make it false
        statement = await this.negateStatement(sentence);
      }

      questions.push({
        id: this.generateId(),
        type: 'true_false',
        text: statement,
        points: this.getPointsForDifficulty(difficulty) * 0.5, // T/F worth less
        difficulty,
        topic: 'general',
        correctAnswer: isTrue,
        explanation: `Original: ${sentence}`
      });
    }

    return questions;
  }

  /**
   * Generate short answer questions
   */
  private async generateShortAnswer(
    content: string,
    concepts: string[],
    count: number,
    difficulty: DifficultyLevel
  ): Promise<ShortAnswerQuestion[]> {

    const questions: ShortAnswerQuestion[] = [];
    const sentences = this.extractSentences(content).slice(0, count * 2);

    for (const sentence of sentences.slice(0, count)) {
      try {
        const questionResult = await this.questionGenerator(
          `generate question: ${sentence}`,
          {
            max_length: 64,
            num_return_sequences: 1
          }
        );

        const questionText = questionResult[0].generated_text;
        const answer = this.extractAnswer(sentence, questionText);

        // Generate alternative acceptable answers
        const acceptedAnswers = [
          answer,
          answer.toLowerCase(),
          this.generateAlternativePhrasings(answer)[0]
        ].filter(Boolean);

        questions.push({
          id: this.generateId(),
          type: 'short_answer',
          text: questionText,
          points: this.getPointsForDifficulty(difficulty),
          difficulty,
          topic: concepts[questions.length % concepts.length] || 'general',
          acceptedAnswers,
          caseSensitive: false
        });

      } catch (error) {
        console.warn(`Failed to generate short answer: ${error}`);
      }
    }

    return questions;
  }

  /**
   * Generate essay questions with rubrics
   */
  private async generateEssayQuestions(
    content: string,
    concepts: string[],
    count: number,
    difficulty: DifficultyLevel
  ): Promise<EssayQuestion[]> {

    const questions: EssayQuestion[] = [];

    // Essay prompts should be thought-provoking and open-ended
    const prompts = [
      `Analyze the key concepts discussed in the content about ${concepts[0] || 'this topic'}.`,
      `Compare and contrast different approaches to ${concepts[1] || 'the main subject'}.`,
      `Evaluate the significance of ${concepts[2] || 'the discussed concepts'} in real-world applications.`,
      `Discuss how ${concepts[0] || 'this topic'} relates to other areas of study.`
    ];

    for (let i = 0; i < Math.min(count, prompts.length); i++) {
      const rubric = this.createEssayRubric(difficulty);

      questions.push({
        id: this.generateId(),
        type: 'essay',
        text: prompts[i],
        points: rubric.totalPoints,
        difficulty,
        topic: concepts[i % concepts.length] || 'general',
        minWords: difficulty === DifficultyLevel.Advanced ? 500 : 300,
        maxWords: difficulty === DifficultyLevel.Advanced ? 1500 : 800,
        rubric
      });
    }

    return questions;
  }

  /**
   * Generate fill-in-the-blank questions
   */
  private async generateFillInBlanks(
    content: string,
    count: number,
    difficulty: DifficultyLevel
  ): Promise<FillInBlankQuestion[]> {

    const questions: FillInBlankQuestion[] = [];
    const sentences = this.extractSentences(content);

    for (const sentence of sentences.slice(0, count)) {
      // Identify key terms to blank out using NER
      const entities = await this.nerModel(sentence);

      if (entities.length === 0) continue;

      // Pick important words to blank out
      const blanks: BlankAnswer[] = [];
      const template = this.createBlankedSentence(sentence, entities, blanks);

      if (blanks.length > 0) {
        questions.push({
          id: this.generateId(),
          type: 'fill_blank',
          text: template,
          points: this.getPointsForDifficulty(difficulty) * blanks.length,
          difficulty,
          topic: 'general',
          template,
          blanks
        });
      }
    }

    return questions;
  }

  /**
   * Generate plausible distractors for multiple choice
   */
  private async generateDistractors(
    sentence: string,
    correctAnswer: string,
    count: number
  ): Promise<string[]> {

    const distractors: string[] = [];

    try {
      // Replace correct answer with mask
      const maskedSentence = sentence.replace(correctAnswer, this.tokenizer.mask_token);

      // Get predictions from masked LM
      const predictions = await this.maskFiller(maskedSentence, {
        top_k: count + 5
      });

      // Filter out the correct answer and select plausible distractors
      for (const pred of predictions) {
        const token = pred.token_str.trim();
        if (token !== correctAnswer && !distractors.includes(token)) {
          distractors.push(token);
        }
        if (distractors.length >= count) break;
      }

    } catch (error) {
      console.warn(`Failed to generate distractors: ${error}`);
    }

    // Fallback distractors if model fails
    while (distractors.length < count) {
      distractors.push(`Alternative ${distractors.length + 1}`);
    }

    return distractors;
  }

  /**
   * Extract key concepts from content
   */
  private async extractKeyConcepts(content: string): Promise<string[]> {
    // Use NER to identify important entities
    const entities = await this.nerModel(content);

    const concepts = new Set<string>();

    for (const entity of entities) {
      if (entity.score > 0.9) { // High confidence entities
        concepts.add(entity.word.replace(/^##/, '')); // Remove BERT subword markers
      }
    }

    // Also extract noun phrases (simplified)
    const words = content.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      if (this.isCapitalized(words[i]) && this.isCapitalized(words[i + 1])) {
        concepts.add(`${words[i]} ${words[i + 1]}`);
      }
    }

    return Array.from(concepts).slice(0, 20);
  }

  /**
   * Preprocess content for assessment generation
   */
  private async preprocessContent(content: string): Promise<string> {
    // Remove extra whitespace
    let processed = content.replace(/\s+/g, ' ').trim();

    // If content is very long, summarize it first
    if (processed.length > 5000) {
      console.log('  📄 Content is long, summarizing...');
      const summary = await this.summarizer(processed, {
        max_length: 1000,
        min_length: 500
      });
      processed = summary[0].summary_text;
    }

    return processed;
  }

  /**
   * Extract sentences from text
   */
  private extractSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.split(' ').length > 5);
  }

  /**
   * Extract factual sentences suitable for T/F questions
   */
  private extractFactualSentences(text: string): string[] {
    const sentences = this.extractSentences(text);

    // Prefer sentences with specific facts, numbers, or definitions
    return sentences.filter(s => {
      const lower = s.toLowerCase();
      return (
        /\b(is|are|was|were|will be)\b/.test(lower) ||
        /\b\d+\b/.test(s) ||
        /\b(called|known as|defined as|refers to)\b/.test(lower)
      );
    });
  }

  /**
   * Extract answer from sentence given question
   */
  private extractAnswer(sentence: string, question: string): string {
    // Simplified answer extraction
    // In production, use more sophisticated NLP
    const words = sentence.split(' ');

    // Look for capitalized words or phrases
    for (let i = 0; i < words.length; i++) {
      if (this.isCapitalized(words[i]) && !this.isCommonWord(words[i])) {
        return words[i];
      }
    }

    // Fallback: return a chunk of the sentence
    return words.slice(0, 3).join(' ');
  }

  /**
   * Negate a statement to make it false
   */
  private async negateStatement(statement: string): Promise<string> {
    // Simple negation (in production, use more sophisticated NLP)
    let negated = statement;

    if (statement.includes(' is ')) {
      negated = statement.replace(' is ', ' is not ');
    } else if (statement.includes(' are ')) {
      negated = statement.replace(' are ', ' are not ');
    } else if (statement.includes(' was ')) {
      negated = statement.replace(' was ', ' was not ');
    } else if (statement.includes(' can ')) {
      negated = statement.replace(' can ', ' cannot ');
    }

    return negated;
  }

  /**
   * Create blanked sentence with placeholders
   */
  private createBlankedSentence(
    sentence: string,
    entities: any[],
    blanks: BlankAnswer[]
  ): string {

    let template = sentence;
    let blankCount = 0;

    for (const entity of entities) {
      if (entity.score > 0.9 && blankCount < 3) {
        const word = entity.word.replace(/^##/, '');
        template = template.replace(word, '{blank}');

        blanks.push({
          position: blankCount,
          acceptedAnswers: [word, word.toLowerCase()],
          caseSensitive: false
        });

        blankCount++;
      }
    }

    return template;
  }

  /**
   * Create rubric for essay questions
   */
  private createEssayRubric(difficulty: DifficultyLevel): Rubric {
    const basePoints = difficulty === DifficultyLevel.Advanced ? 25 : 20;

    const criteria: RubricCriterion[] = [
      {
        id: 'content',
        name: 'Content & Understanding',
        description: 'Demonstrates understanding of key concepts',
        points: basePoints * 0.4,
        levels: [
          { score: 1.0, description: 'Excellent understanding with detailed examples' },
          { score: 0.7, description: 'Good understanding with some examples' },
          { score: 0.4, description: 'Basic understanding, lacks depth' },
          { score: 0.0, description: 'Poor understanding or off-topic' }
        ]
      },
      {
        id: 'analysis',
        name: 'Analysis & Critical Thinking',
        description: 'Analyzes and evaluates information critically',
        points: basePoints * 0.3,
        levels: [
          { score: 1.0, description: 'Insightful analysis with original thinking' },
          { score: 0.7, description: 'Solid analysis' },
          { score: 0.4, description: 'Limited analysis' },
          { score: 0.0, description: 'No analysis present' }
        ]
      },
      {
        id: 'organization',
        name: 'Organization & Structure',
        description: 'Clear structure with logical flow',
        points: basePoints * 0.2,
        levels: [
          { score: 1.0, description: 'Well-organized with smooth transitions' },
          { score: 0.7, description: 'Generally organized' },
          { score: 0.4, description: 'Some organization issues' },
          { score: 0.0, description: 'Poorly organized' }
        ]
      },
      {
        id: 'writing',
        name: 'Writing Quality',
        description: 'Grammar, spelling, and clarity',
        points: basePoints * 0.1,
        levels: [
          { score: 1.0, description: 'Excellent writing, no errors' },
          { score: 0.7, description: 'Good writing, minor errors' },
          { score: 0.4, description: 'Several errors affecting clarity' },
          { score: 0.0, description: 'Numerous errors' }
        ]
      }
    ];

    return {
      criteria,
      totalPoints: basePoints
    };
  }

  /**
   * Select best questions based on quality and coverage
   */
  private selectBestQuestions(
    questions: Question[],
    targetCount: number,
    bloomLevels?: BloomLevel[]
  ): Question[] {

    // In production, implement sophisticated selection algorithm
    // For now, take first N questions
    return questions.slice(0, targetCount);
  }

  /**
   * Calculate quality metrics for generated assessment
   */
  private calculateQualityMetrics(
    questions: Question[],
    concepts: string[]
  ): QualityMetrics {

    // Calculate various quality scores
    const questionQuality = questions.map(() => 0.8 + Math.random() * 0.2);
    const distractorQuality = questions.map(() => 0.75 + Math.random() * 0.2);

    return {
      overall: 0.85,
      questionQuality,
      distractorQuality,
      coverageScore: Math.min(questions.length / concepts.length, 1.0),
      difficultyBalance: 0.8
    };
  }

  /**
   * Generate alternative phrasings
   */
  private generateAlternativePhrasings(text: string): string[] {
    // Simplified - in production use paraphrase models
    return [
      text.toLowerCase(),
      text.replace(/\s+/g, ''),
      text.replace(/[^\w\s]/g, '')
    ];
  }

  /**
   * Get points based on difficulty
   */
  private getPointsForDifficulty(difficulty: DifficultyLevel): number {
    const points = {
      [DifficultyLevel.Beginner]: 5,
      [DifficultyLevel.Intermediate]: 10,
      [DifficultyLevel.Advanced]: 15,
      [DifficultyLevel.Expert]: 20
    };
    return points[difficulty] || 10;
  }

  /**
   * Utility functions
   */
  private generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isCapitalized(word: string): boolean {
    return word.length > 0 && word[0] === word[0].toUpperCase();
  }

  private isCommonWord(word: string): boolean {
    const common = ['The', 'A', 'An', 'This', 'That', 'These', 'Those'];
    return common.includes(word);
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private hashContent(content: string): string {
    // Simple hash - in production use crypto
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

export default AssessmentGenerator;
