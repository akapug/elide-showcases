/**
 * ML-Powered Diagnosis Assistant
 *
 * Clinical decision support using machine learning models (scikit-learn)
 * for diagnosis prediction, risk stratification, and treatment recommendations.
 */

import { randomUUID } from 'crypto'
import type {
  MLDiagnosisRequest,
  MLDiagnosisResponse,
  MLModelMetrics,
  VitalSigns,
  Patient
} from '../types'

// @ts-ignore - Python ML libraries via Elide
import sklearn from 'python:sklearn'
// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import pickle from 'python:pickle'

/**
 * Diagnosis Assistant
 *
 * Provides ML-powered clinical decision support for:
 * - Diagnosis prediction from symptoms and vitals
 * - Risk stratification
 * - Treatment recommendations
 * - Clinical alerts and warnings
 */
export class DiagnosisAssistant {
  private model: any = null
  private featureScaler: any = null
  private labelEncoder: any = null
  private featureNames: string[] = []
  private diagnosisLabels: string[] = []
  private modelMetrics: MLModelMetrics | null = null

  constructor() {
    this.initializeModels()
  }

  private initializeModels(): void {
    console.log('Diagnosis Assistant initialized')
  }

  // ============================================================================
  // Model Training
  // ============================================================================

  /**
   * Train diagnosis prediction model
   */
  async train(options: {
    dataPath?: string
    data?: any[]
    features: string[]
    target: string
    algorithm?: 'random-forest' | 'gradient-boosting' | 'logistic-regression' | 'svm'
    testSize?: number
  }): Promise<MLModelMetrics> {
    console.log('Training diagnosis prediction model...')

    // Load or prepare data
    let df: any
    if (options.dataPath) {
      df = pandas.read_csv(options.dataPath)
    } else if (options.data) {
      df = pandas.DataFrame(options.data)
    } else {
      throw new Error('No training data provided')
    }

    this.featureNames = options.features

    // Prepare features (X) and target (y)
    const X = df[options.features].values
    const y = df[options.target].values

    // Encode labels if categorical
    const LabelEncoder = sklearn.preprocessing.LabelEncoder
    this.labelEncoder = new LabelEncoder()
    const yEncoded = this.labelEncoder.fit_transform(y)
    this.diagnosisLabels = this.labelEncoder.classes_.tolist()

    // Split data
    const testSize = options.testSize || 0.2
    const { train_test_split } = sklearn.model_selection
    const [XTrain, XTest, yTrain, yTest] = train_test_split(
      X,
      yEncoded,
      { test_size: testSize, random_state: 42 }
    )

    // Scale features
    const StandardScaler = sklearn.preprocessing.StandardScaler
    this.featureScaler = new StandardScaler()
    const XTrainScaled = this.featureScaler.fit_transform(XTrain)
    const XTestScaled = this.featureScaler.transform(XTest)

    // Train model based on algorithm
    const algorithm = options.algorithm || 'random-forest'
    await this.trainModel(algorithm, XTrainScaled, yTrain)

    // Evaluate model
    const metrics = await this.evaluateModel(XTestScaled, yTest)
    this.modelMetrics = metrics

    console.log('Model training completed')
    console.log('Metrics:', metrics)

    return metrics
  }

  /**
   * Train specific model algorithm
   */
  private async trainModel(
    algorithm: string,
    XTrain: any,
    yTrain: any
  ): Promise<void> {
    switch (algorithm) {
      case 'random-forest': {
        const RandomForestClassifier = sklearn.ensemble.RandomForestClassifier
        this.model = new RandomForestClassifier({
          n_estimators: 100,
          max_depth: 10,
          min_samples_split: 5,
          random_state: 42,
          class_weight: 'balanced'
        })
        break
      }

      case 'gradient-boosting': {
        const GradientBoostingClassifier = sklearn.ensemble.GradientBoostingClassifier
        this.model = new GradientBoostingClassifier({
          n_estimators: 100,
          learning_rate: 0.1,
          max_depth: 5,
          random_state: 42
        })
        break
      }

      case 'logistic-regression': {
        const LogisticRegression = sklearn.linear_model.LogisticRegression
        this.model = new LogisticRegression({
          max_iter: 1000,
          random_state: 42,
          class_weight: 'balanced'
        })
        break
      }

      case 'svm': {
        const SVC = sklearn.svm.SVC
        this.model = new SVC({
          kernel: 'rbf',
          probability: true,
          random_state: 42,
          class_weight: 'balanced'
        })
        break
      }

      default:
        throw new Error(`Unknown algorithm: ${algorithm}`)
    }

    // Train the model
    this.model.fit(XTrain, yTrain)
  }

  /**
   * Evaluate model performance
   */
  private async evaluateModel(XTest: any, yTest: any): Promise<MLModelMetrics> {
    const yPred = this.model.predict(XTest)

    // Calculate metrics
    const { accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix } = sklearn.metrics

    const accuracy = accuracy_score(yTest, yPred)
    const precision = precision_score(yTest, yPred, { average: 'weighted' })
    const recall = recall_score(yTest, yPred, { average: 'weighted' })
    const f1 = f1_score(yTest, yPred, { average: 'weighted' })

    // Get probability predictions for AUC
    const yProba = this.model.predict_proba(XTest)
    let auc = 0
    try {
      // For binary classification
      if (this.diagnosisLabels.length === 2) {
        auc = roc_auc_score(yTest, yProba['$'](':, 1'))
      } else {
        // For multi-class
        auc = roc_auc_score(yTest, yProba, { multi_class: 'ovr', average: 'weighted' })
      }
    } catch (e) {
      console.warn('Could not calculate AUC:', e)
    }

    const confMatrix = confusion_matrix(yTest, yPred)
    const tn = confMatrix[0][0] || 0
    const fp = confMatrix[0][1] || 0
    const fn = confMatrix[1][0] || 0
    const tp = confMatrix[1][1] || 0

    const sensitivity = tp / (tp + fn) || 0
    const specificity = tn / (tn + fp) || 0

    return {
      accuracy: parseFloat(accuracy.toFixed(4)),
      precision: parseFloat(precision.toFixed(4)),
      recall: parseFloat(recall.toFixed(4)),
      f1Score: parseFloat(f1.toFixed(4)),
      auc: parseFloat(auc.toFixed(4)),
      sensitivity: parseFloat(sensitivity.toFixed(4)),
      specificity: parseFloat(specificity.toFixed(4))
    }
  }

  // ============================================================================
  // Diagnosis Prediction
  // ============================================================================

  /**
   * Predict diagnosis from patient data
   */
  async predictDiagnosis(request: MLDiagnosisRequest): Promise<MLDiagnosisResponse> {
    if (!this.model) {
      throw new Error('Model not trained. Call train() first.')
    }

    // Extract features from request
    const features = this.extractFeatures(request)

    // Scale features
    const featuresArray = numpy.array([features])
    const featuresScaled = this.featureScaler.transform(featuresArray)

    // Predict
    const prediction = this.model.predict(featuresScaled)[0]
    const probabilities = this.model.predict_proba(featuresScaled)[0]

    // Get diagnosis label
    const diagnosis = this.labelEncoder.inverse_transform([prediction])[0]
    const confidence = Math.max(...probabilities.tolist())

    // Get differential diagnoses (top 5)
    const probabilitiesWithIndex = probabilities.tolist().map((prob: number, idx: number) => ({
      diagnosis: this.diagnosisLabels[idx],
      probability: parseFloat((prob * 100).toFixed(2))
    }))

    const differentialDiagnoses = probabilitiesWithIndex
      .sort((a: any, b: any) => b.probability - a.probability)
      .slice(0, 5)

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      diagnosis,
      confidence,
      request
    )

    // Determine urgency
    const urgency = this.determineUrgency(diagnosis, request, confidence)

    // Suggest additional tests
    const suggestedTests = this.suggestTests(diagnosis, request)

    // Check for warning flags
    const warningFlags = this.checkWarningFlags(request)

    return {
      diagnosis,
      confidence: parseFloat((confidence * 100).toFixed(2)),
      probability: parseFloat((confidence * 100).toFixed(2)),
      differentialDiagnoses,
      recommendations,
      urgency,
      suggestedTests,
      warningFlags: warningFlags.length > 0 ? warningFlags : undefined,
      modelMetadata: {
        modelName: this.model.constructor.name || 'ML Classifier',
        version: '1.0.0',
        trainedOn: new Date().toISOString().split('T')[0],
        accuracy: this.modelMetrics?.accuracy || 0
      }
    }
  }

  /**
   * Extract features from diagnosis request
   */
  private extractFeatures(request: MLDiagnosisRequest): number[] {
    const features: number[] = []

    for (const featureName of this.featureNames) {
      let value = 0

      // Age
      if (featureName === 'age' && request.demographics?.dateOfBirth) {
        const birthDate = new Date(request.demographics.dateOfBirth)
        const today = new Date()
        value = today.getFullYear() - birthDate.getFullYear()
      }

      // Gender (encoded)
      if (featureName === 'gender' && request.demographics?.gender) {
        value = request.demographics.gender === 'male' ? 1 : 0
      }

      // Temperature
      if (featureName === 'temperature' && request.vitals.temperature) {
        value = request.vitals.temperature.value
        if (request.vitals.temperature.unit === 'F') {
          // Convert to Celsius
          value = (value - 32) * 5 / 9
        }
      }

      // Heart rate
      if (featureName === 'heart_rate' && request.vitals.heartRate) {
        value = request.vitals.heartRate.value
      }

      // Blood pressure (systolic)
      if (featureName === 'bp_systolic' && request.vitals.bloodPressure) {
        value = request.vitals.bloodPressure.systolic
      }

      // Blood pressure (diastolic)
      if (featureName === 'bp_diastolic' && request.vitals.bloodPressure) {
        value = request.vitals.bloodPressure.diastolic
      }

      // Respiratory rate
      if (featureName === 'respiratory_rate' && request.vitals.respiratoryRate) {
        value = request.vitals.respiratoryRate.value
      }

      // Oxygen saturation
      if (featureName === 'oxygen_saturation' && request.vitals.oxygenSaturation) {
        value = request.vitals.oxygenSaturation.value
      }

      // Symptoms (binary features)
      if (featureName.startsWith('symptom_')) {
        const symptom = featureName.replace('symptom_', '')
        value = request.symptoms.some(s =>
          s.toLowerCase().includes(symptom.toLowerCase())
        ) ? 1 : 0
      }

      // Lab results
      if (request.labResults && featureName in request.labResults) {
        value = parseFloat(request.labResults[featureName]) || 0
      }

      features.push(value)
    }

    return features
  }

  /**
   * Generate clinical recommendations
   */
  private generateRecommendations(
    diagnosis: string,
    confidence: number,
    request: MLDiagnosisRequest
  ): string[] {
    const recommendations: string[] = []

    // Low confidence warning
    if (confidence < 0.7) {
      recommendations.push('Consider additional diagnostic testing due to low confidence')
      recommendations.push('Consult with specialist for second opinion')
    }

    // Diagnosis-specific recommendations
    const diagnosisLower = diagnosis.toLowerCase()

    if (diagnosisLower.includes('pneumonia')) {
      recommendations.push('Order chest X-ray to confirm diagnosis')
      recommendations.push('Check complete blood count (CBC) and inflammatory markers')
      recommendations.push('Consider empiric antibiotic therapy')
      recommendations.push('Monitor oxygen saturation closely')
    }

    if (diagnosisLower.includes('diabetes')) {
      recommendations.push('Order HbA1c and fasting glucose')
      recommendations.push('Assess for diabetic complications (retinopathy, nephropathy, neuropathy)')
      recommendations.push('Provide diabetes education and lifestyle counseling')
      recommendations.push('Consider starting metformin if appropriate')
    }

    if (diagnosisLower.includes('hypertension')) {
      recommendations.push('Confirm with multiple blood pressure readings')
      recommendations.push('Assess cardiovascular risk factors')
      recommendations.push('Check basic metabolic panel and lipid panel')
      recommendations.push('Consider lifestyle modifications (diet, exercise, weight loss)')
    }

    if (diagnosisLower.includes('heart') || diagnosisLower.includes('cardiac')) {
      recommendations.push('Obtain EKG and cardiac enzymes')
      recommendations.push('Consider cardiology consultation')
      recommendations.push('Monitor vital signs closely')
      recommendations.push('Assess for chest pain characteristics and radiation')
    }

    if (diagnosisLower.includes('infection')) {
      recommendations.push('Obtain cultures before starting antibiotics')
      recommendations.push('Check white blood cell count and inflammatory markers')
      recommendations.push('Consider source of infection and appropriate imaging')
      recommendations.push('Monitor for sepsis criteria')
    }

    // Vital sign-based recommendations
    if (request.vitals.temperature && request.vitals.temperature.value > 38.5) {
      recommendations.push('Administer antipyretics for fever management')
    }

    if (request.vitals.oxygenSaturation && request.vitals.oxygenSaturation.value < 92) {
      recommendations.push('Provide supplemental oxygen to maintain SpO2 > 94%')
    }

    if (request.vitals.heartRate && request.vitals.heartRate.value > 100) {
      recommendations.push('Investigate cause of tachycardia')
    }

    // Default recommendations if none specific
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring patient condition')
      recommendations.push('Follow up in 1-2 weeks or sooner if symptoms worsen')
      recommendations.push('Provide patient education on warning signs')
    }

    return recommendations
  }

  /**
   * Determine clinical urgency
   */
  private determineUrgency(
    diagnosis: string,
    request: MLDiagnosisRequest,
    confidence: number
  ): 'routine' | 'urgent' | 'emergent' {
    // Critical vital signs = emergent
    if (request.vitals.oxygenSaturation && request.vitals.oxygenSaturation.value < 88) {
      return 'emergent'
    }

    if (request.vitals.heartRate && (request.vitals.heartRate.value > 130 || request.vitals.heartRate.value < 50)) {
      return 'emergent'
    }

    if (request.vitals.bloodPressure) {
      const systolic = request.vitals.bloodPressure.systolic
      if (systolic > 180 || systolic < 90) {
        return 'emergent'
      }
    }

    // Diagnosis-based urgency
    const diagnosisLower = diagnosis.toLowerCase()

    const emergentConditions = [
      'myocardial infarction',
      'stroke',
      'sepsis',
      'pneumothorax',
      'pulmonary embolism',
      'acute coronary syndrome'
    ]

    const urgentConditions = [
      'pneumonia',
      'heart failure',
      'acute kidney injury',
      'severe infection',
      'diabetic ketoacidosis'
    ]

    if (emergentConditions.some(c => diagnosisLower.includes(c))) {
      return 'emergent'
    }

    if (urgentConditions.some(c => diagnosisLower.includes(c))) {
      return 'urgent'
    }

    return 'routine'
  }

  /**
   * Suggest diagnostic tests
   */
  private suggestTests(
    diagnosis: string,
    request: MLDiagnosisRequest
  ): string[] {
    const tests: string[] = []
    const diagnosisLower = diagnosis.toLowerCase()

    // Common tests for respiratory conditions
    if (diagnosisLower.includes('pneumonia') || diagnosisLower.includes('respiratory')) {
      tests.push('Chest X-ray (PA and lateral)')
      tests.push('Complete Blood Count (CBC)')
      tests.push('C-Reactive Protein (CRP)')
      tests.push('Blood cultures if febrile')
    }

    // Cardiac conditions
    if (diagnosisLower.includes('heart') || diagnosisLower.includes('cardiac')) {
      tests.push('12-lead EKG')
      tests.push('Troponin I/T')
      tests.push('BNP or NT-proBNP')
      tests.push('Basic Metabolic Panel (BMP)')
      tests.push('Lipid panel')
    }

    // Diabetes
    if (diagnosisLower.includes('diabetes')) {
      tests.push('Hemoglobin A1c (HbA1c)')
      tests.push('Fasting glucose')
      tests.push('Comprehensive Metabolic Panel (CMP)')
      tests.push('Urine microalbumin/creatinine ratio')
    }

    // Infection
    if (diagnosisLower.includes('infection')) {
      tests.push('Complete Blood Count (CBC) with differential')
      tests.push('Erythrocyte Sedimentation Rate (ESR)')
      tests.push('C-Reactive Protein (CRP)')
      tests.push('Blood cultures')
      tests.push('Urinalysis and urine culture')
    }

    // Renal
    if (diagnosisLower.includes('kidney') || diagnosisLower.includes('renal')) {
      tests.push('Basic Metabolic Panel (BMP)')
      tests.push('Urinalysis')
      tests.push('Renal ultrasound')
    }

    // Default baseline tests if none specific
    if (tests.length === 0) {
      tests.push('Complete Blood Count (CBC)')
      tests.push('Comprehensive Metabolic Panel (CMP)')
    }

    return tests
  }

  /**
   * Check for clinical warning flags
   */
  private checkWarningFlags(request: MLDiagnosisRequest): string[] {
    const warnings: string[] = []

    // Vital sign warnings
    if (request.vitals.temperature) {
      const temp = request.vitals.temperature
      const tempC = temp.unit === 'F' ? (temp.value - 32) * 5 / 9 : temp.value

      if (tempC > 40) {
        warnings.push('CRITICAL: Hyperpyrexia (temperature > 40°C)')
      } else if (tempC < 35) {
        warnings.push('CRITICAL: Hypothermia (temperature < 35°C)')
      }
    }

    if (request.vitals.heartRate) {
      const hr = request.vitals.heartRate.value
      if (hr > 130) {
        warnings.push('WARNING: Severe tachycardia')
      } else if (hr < 50) {
        warnings.push('WARNING: Bradycardia')
      }
    }

    if (request.vitals.bloodPressure) {
      const bp = request.vitals.bloodPressure
      if (bp.systolic > 180 || bp.diastolic > 120) {
        warnings.push('CRITICAL: Hypertensive crisis')
      } else if (bp.systolic < 90) {
        warnings.push('WARNING: Hypotension')
      }
    }

    if (request.vitals.oxygenSaturation) {
      const spo2 = request.vitals.oxygenSaturation.value
      if (spo2 < 88) {
        warnings.push('CRITICAL: Severe hypoxemia')
      } else if (spo2 < 92) {
        warnings.push('WARNING: Hypoxemia')
      }
    }

    if (request.vitals.respiratoryRate) {
      const rr = request.vitals.respiratoryRate.value
      if (rr > 30) {
        warnings.push('WARNING: Tachypnea')
      } else if (rr < 10) {
        warnings.push('WARNING: Bradypnea')
      }
    }

    // Lab value warnings
    if (request.labResults) {
      if (request.labResults.glucose && request.labResults.glucose > 400) {
        warnings.push('CRITICAL: Severe hyperglycemia')
      }

      if (request.labResults.creatinine && request.labResults.creatinine > 3) {
        warnings.push('WARNING: Acute kidney injury possible')
      }

      if (request.labResults.potassium) {
        const k = request.labResults.potassium
        if (k > 6.0 || k < 2.5) {
          warnings.push('CRITICAL: Life-threatening potassium abnormality')
        }
      }

      if (request.labResults.troponin && request.labResults.troponin > 0.1) {
        warnings.push('CRITICAL: Elevated troponin - rule out MI')
      }
    }

    return warnings
  }

  // ============================================================================
  // Risk Stratification
  // ============================================================================

  /**
   * Calculate patient risk score
   */
  async calculateRiskScore(patient: {
    age: number
    conditions: string[]
    medications: number
    recentHospitalizations: number
    vitals?: Partial<VitalSigns>
  }): Promise<{
    score: number
    level: 'low' | 'moderate' | 'high'
    factors: string[]
    recommendations: string[]
  }> {
    let score = 0
    const factors: string[] = []

    // Age risk
    if (patient.age > 65) {
      score += 2
      factors.push('Age > 65 years')
    }
    if (patient.age > 80) {
      score += 2
      factors.push('Age > 80 years')
    }

    // Chronic conditions (comorbidities)
    const highRiskConditions = [
      'heart failure',
      'copd',
      'diabetes',
      'chronic kidney disease',
      'cirrhosis',
      'cancer'
    ]

    const patientConditionsLower = patient.conditions.map(c => c.toLowerCase())
    highRiskConditions.forEach(condition => {
      if (patientConditionsLower.some(c => c.includes(condition))) {
        score += 2
        factors.push(`Chronic condition: ${condition}`)
      }
    })

    // Polypharmacy
    if (patient.medications >= 5) {
      score += 1
      factors.push('Polypharmacy (≥5 medications)')
    }
    if (patient.medications >= 10) {
      score += 1
      factors.push('High polypharmacy (≥10 medications)')
    }

    // Recent hospitalizations
    if (patient.recentHospitalizations > 0) {
      score += patient.recentHospitalizations * 2
      factors.push(`${patient.recentHospitalizations} recent hospitalization(s)`)
    }

    // Vital sign abnormalities
    if (patient.vitals?.bloodPressure) {
      const bp = patient.vitals.bloodPressure
      if (bp.systolic > 160 || bp.systolic < 90) {
        score += 1
        factors.push('Abnormal blood pressure')
      }
    }

    // Determine risk level
    let level: 'low' | 'moderate' | 'high'
    if (score <= 3) {
      level = 'low'
    } else if (score <= 7) {
      level = 'moderate'
    } else {
      level = 'high'
    }

    // Generate recommendations
    const recommendations: string[] = []
    if (level === 'high') {
      recommendations.push('Schedule frequent follow-up visits (monthly)')
      recommendations.push('Consider care coordination with specialist')
      recommendations.push('Implement intensive disease management program')
      recommendations.push('Assess for home health services')
    } else if (level === 'moderate') {
      recommendations.push('Schedule regular follow-up visits (quarterly)')
      recommendations.push('Monitor chronic conditions closely')
      recommendations.push('Review medication list for optimization')
    } else {
      recommendations.push('Annual wellness visit')
      recommendations.push('Age-appropriate preventive care')
    }

    return {
      score,
      level,
      factors,
      recommendations
    }
  }

  // ============================================================================
  // Model Management
  // ============================================================================

  /**
   * Save trained model to file
   */
  async saveModel(filepath: string): Promise<void> {
    if (!this.model) {
      throw new Error('No model to save')
    }

    const modelData = {
      model: this.model,
      scaler: this.featureScaler,
      labelEncoder: this.labelEncoder,
      featureNames: this.featureNames,
      diagnosisLabels: this.diagnosisLabels,
      metrics: this.modelMetrics
    }

    // Save using pickle
    const file = open(filepath, 'wb')
    pickle.dump(modelData, file)
    file.close()

    console.log(`Model saved to ${filepath}`)
  }

  /**
   * Load trained model from file
   */
  async loadModel(filepath: string): Promise<void> {
    const file = open(filepath, 'rb')
    const modelData = pickle.load(file)
    file.close()

    this.model = modelData.model
    this.featureScaler = modelData.scaler
    this.labelEncoder = modelData.labelEncoder
    this.featureNames = modelData.featureNames
    this.diagnosisLabels = modelData.diagnosisLabels
    this.modelMetrics = modelData.metrics

    console.log(`Model loaded from ${filepath}`)
  }

  /**
   * Get feature importance
   */
  async getFeatureImportance(): Promise<Array<{ feature: string; importance: number }>> {
    if (!this.model || !this.model.feature_importances_) {
      throw new Error('Model does not support feature importance')
    }

    const importances = this.model.feature_importances_.tolist()

    return this.featureNames.map((name, idx) => ({
      feature: name,
      importance: parseFloat((importances[idx] * 100).toFixed(2))
    })).sort((a, b) => b.importance - a.importance)
  }

  /**
   * Get model metrics
   */
  getModelMetrics(): MLModelMetrics | null {
    return this.modelMetrics
  }

  /**
   * Cross-validate model
   */
  async crossValidate(data: any[], features: string[], target: string, cv: number = 5): Promise<{
    meanAccuracy: number
    stdAccuracy: number
    scores: number[]
  }> {
    const df = pandas.DataFrame(data)
    const X = df[features].values
    const y = df[target].values

    // Encode labels
    const LabelEncoder = sklearn.preprocessing.LabelEncoder
    const encoder = new LabelEncoder()
    const yEncoded = encoder.fit_transform(y)

    // Scale features
    const StandardScaler = sklearn.preprocessing.StandardScaler
    const scaler = new StandardScaler()
    const XScaled = scaler.fit_transform(X)

    // Cross-validation
    const { cross_val_score } = sklearn.model_selection
    const scores = cross_val_score(this.model, XScaled, yEncoded, { cv })

    const scoresArray = scores.tolist()
    const meanAccuracy = numpy.mean(scores)
    const stdAccuracy = numpy.std(scores)

    console.log(`Cross-validation scores: ${scoresArray}`)
    console.log(`Mean accuracy: ${meanAccuracy.toFixed(4)} (+/- ${stdAccuracy.toFixed(4)})`)

    return {
      meanAccuracy: parseFloat(meanAccuracy.toFixed(4)),
      stdAccuracy: parseFloat(stdAccuracy.toFixed(4)),
      scores: scoresArray
    }
  }
}
