/**
 * Healthcare EMR System - Comprehensive Demo
 *
 * Demonstrates the full capabilities of the EMR system including:
 * - Patient management
 * - ML-powered diagnosis
 * - DICOM imaging
 * - HL7 FHIR integration
 * - Pharmacy management
 * - Lab results
 * - Population health analytics
 * - HIPAA compliance
 */

import { PatientService } from '../src/patient/patient-service'
import { DiagnosisAssistant } from '../src/clinical/diagnosis-assistant'
import { DICOMService } from '../src/imaging/dicom-service'
import { RadiologyAI } from '../src/imaging/radiology-ai'
import { FHIRIntegration } from '../src/hl7/fhir-integration'
import { MedicationService } from '../src/pharmacy/medication-service'
import { LabResultsService } from '../src/lab/lab-results-service'
import { PopulationHealth } from '../src/analytics/population-health'
import { HIPAACompliance } from '../src/security/hipaa-compliance'

import type {
  Patient,
  PatientDemographics,
  VitalSigns,
  Provider
} from '../src/types'

/**
 * Demo Runner
 */
class EMRDemo {
  private patientService: PatientService
  private diagnosisAssistant: DiagnosisAssistant
  private dicomService: DICOMService
  private radiologyAI: RadiologyAI
  private fhirIntegration: FHIRIntegration
  private medicationService: MedicationService
  private labService: LabResultsService
  private populationHealth: PopulationHealth
  private hipaa: HIPAACompliance

  constructor() {
    console.log('🏥 Initializing Healthcare EMR System Demo...\n')

    this.patientService = new PatientService()
    this.diagnosisAssistant = new DiagnosisAssistant()
    this.dicomService = new DICOMService()
    this.radiologyAI = new RadiologyAI()
    this.fhirIntegration = new FHIRIntegration()
    this.medicationService = new MedicationService()
    this.labService = new LabResultsService()
    this.populationHealth = new PopulationHealth()
    this.hipaa = new HIPAACompliance()

    console.log('✓ All services initialized\n')
  }

  /**
   * Run complete EMR demonstration
   */
  async run(): Promise<void> {
    console.log('=' .repeat(80))
    console.log('HEALTHCARE EMR SYSTEM - COMPREHENSIVE DEMONSTRATION')
    console.log('=' + '='.repeat(79))
    console.log()

    try {
      // 1. Patient Management
      await this.demoPatientManagement()

      // 2. ML-Powered Clinical Decision Support
      await this.demoMLDiagnosis()

      // 3. Medical Imaging & DICOM
      await this.demoDICOMImaging()

      // 4. HL7 FHIR Integration
      await this.demoFHIRIntegration()

      // 5. Pharmacy & Medications
      await this.demoPharmacy()

      // 6. Laboratory Results
      await this.demoLabResults()

      // 7. Population Health Analytics
      await this.demoPopulationHealth()

      // 8. HIPAA Compliance & Security
      await this.demoHIPAACompliance()

      console.log('\n' + '='.repeat(80))
      console.log('✅ DEMO COMPLETED SUCCESSFULLY')
      console.log('='.repeat(80))

    } catch (error) {
      console.error('\n❌ Demo failed:', error)
      throw error
    }
  }

  // ============================================================================
  // 1. Patient Management
  // ============================================================================

  private async demoPatientManagement(): Promise<Patient> {
    console.log('\n📋 1. PATIENT MANAGEMENT')
    console.log('-'.repeat(80))

    // Create new patient
    console.log('\n→ Creating new patient...')

    const demographics: PatientDemographics = {
      firstName: 'John',
      middleName: 'Robert',
      lastName: 'Smith',
      dateOfBirth: new Date('1970-05-15'),
      gender: 'male',
      preferredLanguage: 'en',
      maritalStatus: 'married',
      address: {
        use: 'home',
        line1: '123 Main Street',
        line2: 'Apt 4B',
        city: 'Boston',
        state: 'MA',
        postalCode: '02101',
        country: 'US'
      },
      contact: {
        primaryPhone: '617-555-0123',
        mobilePhone: '617-555-0124',
        email: 'john.smith@example.com',
        preferredContactMethod: 'phone'
      }
    }

    const patient = await this.patientService.createPatient(demographics)
    console.log(`  ✓ Patient created: ${patient.mrn}`)
    console.log(`    Name: ${patient.demographics.firstName} ${patient.demographics.lastName}`)
    console.log(`    DOB: ${patient.demographics.dateOfBirth.toLocaleDateString()}`)
    console.log(`    Age: ${this.calculateAge(patient.demographics.dateOfBirth)}`)

    // Record vital signs
    console.log('\n→ Recording vital signs...')

    const vitals: Omit<VitalSigns, 'id' | 'patientId'> = {
      recordedAt: new Date(),
      recordedBy: 'NURSE-001',
      temperature: {
        value: 98.6,
        unit: 'F',
        site: 'oral'
      },
      bloodPressure: {
        systolic: 128,
        diastolic: 82,
        unit: 'mmHg',
        position: 'sitting',
        arm: 'left'
      },
      heartRate: {
        value: 72,
        unit: 'bpm',
        rhythm: 'regular'
      },
      respiratoryRate: {
        value: 16,
        unit: 'breaths/min'
      },
      oxygenSaturation: {
        value: 98,
        unit: '%',
        oxygenDelivery: 'room-air'
      },
      height: {
        value: 180,
        unit: 'cm'
      },
      weight: {
        value: 85,
        unit: 'kg'
      }
    }

    const recordedVitals = await this.patientService.recordVitalSigns(patient.id, vitals)
    console.log('  ✓ Vital signs recorded:')
    console.log(`    BP: ${recordedVitals.bloodPressure?.systolic}/${recordedVitals.bloodPressure?.diastolic} mmHg`)
    console.log(`    HR: ${recordedVitals.heartRate?.value} bpm`)
    console.log(`    Temp: ${recordedVitals.temperature?.value}°${recordedVitals.temperature?.unit}`)
    console.log(`    SpO2: ${recordedVitals.oxygenSaturation?.value}%`)
    console.log(`    BMI: ${recordedVitals.bmi}`)

    // Add allergies
    console.log('\n→ Adding allergies...')

    await this.patientService.addAllergy(patient.id, {
      substance: {
        code: {
          system: 'RxNorm',
          code: '7980',
          display: 'Penicillin'
        }
      },
      type: 'allergy',
      category: 'medication',
      criticality: 'high',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      recordedDate: new Date(),
      recordedBy: 'DR-001',
      reactions: [{
        manifestation: ['Hives', 'Itching', 'Swelling'],
        severity: 'moderate'
      }]
    })

    console.log('  ✓ Allergy added: Penicillin (High criticality)')

    // Add medical conditions
    console.log('\n→ Adding medical conditions...')

    await this.patientService.addCondition(patient.id, {
      code: {
        system: 'ICD-10',
        code: 'I10',
        display: 'Essential hypertension'
      },
      category: ['problem-list-item'],
      severity: 'moderate',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      onsetDate: new Date('2018-03-01'),
      recordedDate: new Date(),
      recordedBy: 'DR-001'
    })

    await this.patientService.addCondition(patient.id, {
      code: {
        system: 'ICD-10',
        code: 'E11',
        display: 'Type 2 diabetes mellitus'
      },
      category: ['problem-list-item'],
      severity: 'moderate',
      clinicalStatus: 'active',
      verificationStatus: 'confirmed',
      onsetDate: new Date('2020-06-15'),
      recordedDate: new Date(),
      recordedBy: 'DR-001'
    })

    console.log('  ✓ Conditions added: Hypertension, Type 2 Diabetes')

    return patient
  }

  // ============================================================================
  // 2. ML-Powered Clinical Decision Support
  // ============================================================================

  private async demoMLDiagnosis(): Promise<void> {
    console.log('\n🤖 2. ML-POWERED CLINICAL DECISION SUPPORT')
    console.log('-'.repeat(80))

    console.log('\n→ Training diagnosis prediction model...')

    // Simulated training data
    const trainingData = this.generateTrainingData()

    try {
      const metrics = await this.diagnosisAssistant.train({
        data: trainingData,
        features: ['age', 'temperature', 'heart_rate', 'bp_systolic', 'symptom_fever', 'symptom_cough'],
        target: 'diagnosis',
        algorithm: 'random-forest',
        testSize: 0.2
      })

      console.log('  ✓ Model trained successfully:')
      console.log(`    Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`)
      console.log(`    Precision: ${(metrics.precision * 100).toFixed(2)}%`)
      console.log(`    Recall: ${(metrics.recall * 100).toFixed(2)}%`)
      console.log(`    F1 Score: ${(metrics.f1Score * 100).toFixed(2)}%`)

      // Predict diagnosis for patient with symptoms
      console.log('\n→ Predicting diagnosis for patient with symptoms...')

      const diagnosisRequest = {
        patientId: 'P-12345',
        symptoms: ['fever', 'cough', 'fatigue', 'shortness of breath'],
        vitals: {
          temperature: {
            value: 38.5,
            unit: 'C' as const
          },
          heartRate: {
            value: 95,
            unit: 'bpm' as const
          },
          bloodPressure: {
            systolic: 125,
            diastolic: 80,
            unit: 'mmHg' as const
          },
          respiratoryRate: {
            value: 22,
            unit: 'breaths/min' as const
          },
          oxygenSaturation: {
            value: 94,
            unit: '%' as const
          }
        } as any,
        demographics: {
          dateOfBirth: new Date('1970-05-15')
        } as any
      }

      const diagnosis = await this.diagnosisAssistant.predictDiagnosis(diagnosisRequest)

      console.log('  ✓ Diagnosis prediction:')
      console.log(`    Primary: ${diagnosis.diagnosis} (${diagnosis.confidence}% confidence)`)
      console.log('    Differential diagnoses:')
      diagnosis.differentialDiagnoses.slice(0, 3).forEach((dd, i) => {
        console.log(`      ${i + 1}. ${dd.diagnosis} (${dd.probability}%)`)
      })
      console.log(`    Urgency: ${diagnosis.urgency.toUpperCase()}`)

      if (diagnosis.warningFlags && diagnosis.warningFlags.length > 0) {
        console.log('    ⚠️  Warning flags:')
        diagnosis.warningFlags.forEach(flag => {
          console.log(`      - ${flag}`)
        })
      }

      console.log('    Recommendations:')
      diagnosis.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`      ${i + 1}. ${rec}`)
      })

    } catch (error) {
      console.log('  ⚠️  ML training skipped (Python libraries not available)')
    }
  }

  // ============================================================================
  // 3. Medical Imaging & DICOM
  // ============================================================================

  private async demoDICOMImaging(): Promise<void> {
    console.log('\n🩻 3. MEDICAL IMAGING & DICOM')
    console.log('-'.repeat(80))

    console.log('\n→ Creating imaging study...')

    const study = await this.dicomService.createStudy({
      studyInstanceUID: '1.2.840.113619.2.5.1762583153.215519.978957063.78',
      patientId: 'P-12345',
      status: 'available',
      modality: 'CT',
      description: 'CT Chest with contrast',
      numberOfSeries: 2,
      numberOfInstances: 120,
      started: new Date(),
      series: []
    })

    console.log('  ✓ Imaging study created:')
    console.log(`    Study UID: ${study.studyInstanceUID}`)
    console.log(`    Modality: ${study.modality}`)
    console.log(`    Description: ${study.description}`)
    console.log(`    Series: ${study.numberOfSeries}`)
    console.log(`    Images: ${study.numberOfInstances}`)

    // Load Radiology AI model
    console.log('\n→ Loading radiology AI model...')

    try {
      await this.radiologyAI.loadModel('resnet50')

      console.log('  ✓ AI model loaded: ResNet50')

      // Simulate AI analysis
      console.log('\n→ AI analysis of chest CT...')

      const modelInfo = this.radiologyAI.getModelInfo()
      console.log('  ✓ Model information:')
      console.log(`    Architecture: ${modelInfo.architecture}`)
      console.log(`    Device: ${modelInfo.device}`)
      console.log(`    Classes: ${modelInfo.classes.length} pathologies`)

    } catch (error) {
      console.log('  ⚠️  AI analysis skipped (Python libraries not available)')
    }
  }

  // ============================================================================
  // 4. HL7 FHIR Integration
  // ============================================================================

  private async demoFHIRIntegration(): Promise<void> {
    console.log('\n🔗 4. HL7 FHIR INTEGRATION')
    console.log('-'.repeat(80))

    const patient = await this.patientService.getPatient((await this.patientService.getAllPatients())[0]?.id || '')

    if (patient) {
      console.log('\n→ Converting patient to FHIR format...')

      const fhirPatient = await this.fhirIntegration.patientToFHIR(patient)

      console.log('  ✓ FHIR Patient resource created:')
      console.log(`    Resource Type: ${fhirPatient.resourceType}`)
      console.log(`    ID: ${fhirPatient.id}`)
      console.log(`    Name: ${fhirPatient.name?.[0]?.given?.[0]} ${fhirPatient.name?.[0]?.family}`)
      console.log(`    Gender: ${fhirPatient.gender}`)
      console.log(`    Birth Date: ${fhirPatient.birthDate}`)

      // Create patient summary bundle (IPS)
      console.log('\n→ Creating International Patient Summary bundle...')

      const bundle = await this.fhirIntegration.createPatientSummary(patient, {
        includeAllergies: true,
        includeConditions: true,
        includeMedications: true,
        includeVitals: true
      })

      console.log('  ✓ FHIR Bundle created:')
      console.log(`    Type: ${bundle.type}`)
      console.log(`    Resources: ${bundle.total}`)
      console.log(`    FHIR Version: ${this.fhirIntegration.getFHIRVersion()}`)
    }
  }

  // ============================================================================
  // 5. Pharmacy & Medications
  // ============================================================================

  private async demoPharmacy(): Promise<void> {
    console.log('\n💊 5. PHARMACY & MEDICATIONS')
    console.log('-'.repeat(80))

    console.log('\n→ Prescribing medications...')

    const prescription1 = await this.medicationService.prescribeMedication({
      patientId: 'P-12345',
      medication: {
        name: 'Lisinopril',
        rxnormCode: '104383',
        dose: '10mg',
        frequency: 'once daily',
        route: 'oral',
        duration: 90,
        quantity: 90,
        refills: 3
      },
      providerId: 'DR-001',
      providerName: 'Dr. Sarah Johnson',
      indication: 'Hypertension',
      substitutionAllowed: true
    })

    console.log(`  ✓ Prescription ${prescription1.prescriptionId} created:`)
    console.log(`    Medication: ${prescription1.medication.code.display}`)
    console.log(`    Dosage: ${prescription1.dosageInstruction[0]?.text}`)
    console.log(`    Days Supply: ${prescription1.dispense?.daysSupply}`)
    console.log(`    Refills: ${prescription1.dispense?.numberOfRepeatsAllowed}`)

    const prescription2 = await this.medicationService.prescribeMedication({
      patientId: 'P-12345',
      medication: {
        name: 'Metformin',
        rxnormCode: '6809',
        dose: '500mg',
        frequency: 'twice daily',
        route: 'oral',
        duration: 90,
        quantity: 180,
        refills: 3
      },
      providerId: 'DR-001',
      providerName: 'Dr. Sarah Johnson',
      indication: 'Type 2 diabetes',
      substitutionAllowed: true
    })

    console.log(`  ✓ Prescription ${prescription2.prescriptionId} created:`)
    console.log(`    Medication: ${prescription2.medication.code.display}`)
    console.log(`    Dosage: ${prescription2.dosageInstruction[0]?.text}`)

    // Check drug interactions
    console.log('\n→ Checking drug interactions...')

    const interactions = await this.medicationService.checkInteractions({
      patientId: 'P-12345'
    })

    if (interactions.length > 0) {
      console.log(`  ⚠️  Found ${interactions.length} potential drug interaction(s):`)
      interactions.forEach((interaction, i) => {
        console.log(`    ${i + 1}. ${interaction.drug1} + ${interaction.drug2}`)
        console.log(`       Severity: ${interaction.severity.toUpperCase()}`)
        console.log(`       Effect: ${interaction.description}`)
      })
    } else {
      console.log('  ✓ No drug interactions detected')
    }
  }

  // ============================================================================
  // 6. Laboratory Results
  // ============================================================================

  private async demoLabResults(): Promise<void> {
    console.log('\n🧪 6. LABORATORY RESULTS')
    console.log('-'.repeat(80))

    const provider: Provider = {
      id: 'DR-001',
      npi: '1234567890',
      name: 'Dr. Sarah Johnson',
      credentials: 'MD',
      specialty: 'Internal Medicine'
    }

    console.log('\n→ Creating lab order...')

    const order = await this.labService.createOrder({
      patientId: 'P-12345',
      tests: ['CBC', 'CMP', 'HbA1c', 'Lipid Panel'],
      priority: 'routine',
      orderedBy: provider,
      clinicalInfo: 'Routine diabetes and hypertension follow-up',
      diagnosis: ['Type 2 diabetes', 'Hypertension']
    })

    console.log(`  ✓ Lab order created: ${order.id}`)
    console.log(`    Tests: ${order.tests.map(t => t.code.display).join(', ')}`)
    console.log(`    Priority: ${order.priority}`)

    // Receive results
    console.log('\n→ Receiving lab results...')

    const results = await this.labService.receiveResults({
      orderId: order.id,
      results: {
        'Glucose': { value: 125, unit: 'mg/dL' },
        'HbA1c': { value: 6.8, unit: '%' },
        'Hemoglobin': { value: 14.2, unit: 'g/dL' },
        'WBC': { value: 7.5, unit: '10^9/L' },
        'Creatinine': { value: 1.0, unit: 'mg/dL' },
        'Potassium': { value: 4.2, unit: 'mmol/L' },
        'Total Cholesterol': { value: 195, unit: 'mg/dL' },
        'LDL': { value: 115, unit: 'mg/dL' },
        'HDL': { value: 55, unit: 'mg/dL' }
      }
    })

    console.log(`  ✓ ${results.resultIds.length} results received`)

    if (results.criticalValues.length > 0) {
      console.log(`    🚨 Critical values: ${results.criticalValues.length}`)
    }

    if (results.abnormalResults.length > 0) {
      console.log(`    ⚠️  Abnormal results: ${results.abnormalResults.length}`)
      results.abnormalResults.forEach(result => {
        console.log(`       - ${result.test.code.display}: ${result.value.numeric} ${result.unit} (${result.interpretation})`)
      })
    } else {
      console.log('    ✓ All results within normal range')
    }

    // Get interpretation
    console.log('\n→ Interpreting results...')

    for (const resultId of results.resultIds.slice(0, 3)) {
      const interpretation = await this.labService.interpretResults(resultId)
      console.log(`  • ${interpretation.result.test.code.display}:`)
      console.log(`    Value: ${interpretation.result.value.numeric} ${interpretation.result.unit}`)
      console.log(`    Interpretation: ${interpretation.interpretation}`)
      if (interpretation.recommendations.length > 0) {
        console.log(`    Recommendation: ${interpretation.recommendations[0]}`)
      }
    }
  }

  // ============================================================================
  // 7. Population Health Analytics
  // ============================================================================

  private async demoPopulationHealth(): Promise<void> {
    console.log('\n📊 7. POPULATION HEALTH ANALYTICS')
    console.log('-'.repeat(80))

    // Generate sample patient population
    console.log('\n→ Generating sample patient population...')

    const patients: Patient[] = []
    for (let i = 0; i < 100; i++) {
      const age = 30 + Math.floor(Math.random() * 50)
      const patient = await this.patientService.createPatient({
        firstName: `Patient${i}`,
        lastName: `Test${i}`,
        dateOfBirth: new Date(new Date().getFullYear() - age, 0, 1),
        gender: Math.random() > 0.5 ? 'male' : 'female',
        preferredLanguage: 'en',
        address: {
          use: 'home',
          line1: '123 Main St',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US'
        },
        contact: {
          primaryPhone: '617-555-0000',
          preferredContactMethod: 'phone'
        }
      })

      patients.push(patient)
    }

    console.log(`  ✓ Generated ${patients.length} sample patients`)

    // Calculate population metrics
    console.log('\n→ Calculating population health metrics...')

    const metrics = await this.populationHealth.calculatePopulationMetrics(patients)

    console.log('  ✓ Population metrics:')
    console.log(`    Total Patients: ${metrics.totalPatients}`)
    console.log('    Age Distribution:')
    metrics.demographics.ageDistribution.forEach(group => {
      console.log(`      ${group.range}: ${group.count} patients`)
    })
    console.log('    Gender Distribution:')
    Object.entries(metrics.demographics.genderDistribution).forEach(([gender, count]) => {
      console.log(`      ${gender}: ${count} patients`)
    })
    console.log('    Risk Stratification:')
    console.log(`      Low Risk: ${metrics.riskStratification.low}`)
    console.log(`      Moderate Risk: ${metrics.riskStratification.moderate}`)
    console.log(`      High Risk: ${metrics.riskStratification.high}`)

    // Quality metrics
    console.log('\n→ Calculating quality metrics...')

    console.log('  ✓ HEDIS Quality Measures:')
    metrics.qualityMetrics.slice(0, 3).forEach(metric => {
      console.log(`    ${metric.measure}: ${metric.percentage}%`)
      console.log(`      ${metric.description}`)
      console.log(`      Benchmark: ${metric.benchmark}%, Target: ${metric.target}%`)
    })
  }

  // ============================================================================
  // 8. HIPAA Compliance & Security
  // ============================================================================

  private async demoHIPAACompliance(): Promise<void> {
    console.log('\n🔒 8. HIPAA COMPLIANCE & SECURITY')
    console.log('-'.repeat(80))

    // PHI Encryption
    console.log('\n→ Encrypting Protected Health Information...')

    const phi = {
      patientId: 'P-12345',
      data: {
        ssn: '123-45-6789',
        diagnosis: 'Hypertension, Type 2 Diabetes',
        medications: ['Lisinopril 10mg', 'Metformin 500mg']
      }
    }

    const encrypted = await this.hipaa.encryptPHI(phi)

    console.log('  ✓ PHI encrypted:')
    console.log(`    Algorithm: ${encrypted.algorithm}`)
    console.log(`    Encrypted At: ${encrypted.encryptedAt.toISOString()}`)
    console.log(`    Data Length: ${encrypted.encryptedData.length} bytes`)

    // Decrypt PHI
    console.log('\n→ Decrypting PHI (authorized access)...')

    const decrypted = await this.hipaa.decryptPHI(encrypted, {
      userId: 'DR-001',
      purpose: 'treatment',
      patientId: 'P-12345'
    })

    console.log('  ✓ PHI decrypted successfully')
    console.log(`    SSN: ${decrypted.data.ssn}`)

    // Audit logging
    console.log('\n→ Querying audit logs...')

    const auditLogs = await this.hipaa.getAuditLog({
      limit: 10
    })

    console.log(`  ✓ Retrieved ${auditLogs.length} audit log entries`)
    if (auditLogs.length > 0) {
      console.log('    Recent activity:')
      auditLogs.slice(0, 5).forEach(log => {
        console.log(`      ${log.timestamp.toISOString()}: ${log.action} on ${log.resourceType} by ${log.userId}`)
      })
    }

    // Security risk assessment
    console.log('\n→ Performing security risk assessment...')

    const riskAssessment = await this.hipaa.performRiskAssessment()

    console.log(`  ✓ Risk assessment completed:`)
    console.log(`    Overall Risk: ${riskAssessment.overallRisk.toUpperCase()}`)
    if (riskAssessment.risks.length > 0) {
      console.log(`    Identified Risks: ${riskAssessment.risks.length}`)
      riskAssessment.risks.forEach(risk => {
        console.log(`      • ${risk.risk} (${risk.severity})`)
        console.log(`        Mitigation: ${risk.mitigation}`)
      })
    } else {
      console.log('    No significant risks identified')
    }

    // Compliance report
    console.log('\n→ Generating compliance report...')

    const complianceReport = await this.hipaa.generateComplianceReport({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    })

    console.log('  ✓ Compliance report:')
    console.log(`    Period: ${complianceReport.period.start.toLocaleDateString()} - ${complianceReport.period.end.toLocaleDateString()}`)
    console.log(`    Total Accesses: ${complianceReport.totalAccesses}`)
    console.log(`    Failed Accesses: ${complianceReport.failedAccesses}`)
    console.log(`    Unique Users: ${complianceReport.uniqueUsers}`)
    console.log(`    Compliance Score: ${complianceReport.complianceScore}/100`)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--
    }

    return age
  }

  private generateTrainingData(): any[] {
    const data = []
    const diagnoses = ['pneumonia', 'influenza', 'bronchitis', 'normal']

    for (let i = 0; i < 200; i++) {
      const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)]
      const hasFever = diagnosis !== 'normal' ? 1 : Math.random() > 0.8 ? 1 : 0
      const hasCough = diagnosis !== 'normal' ? 1 : Math.random() > 0.7 ? 1 : 0

      data.push({
        age: 30 + Math.floor(Math.random() * 50),
        temperature: hasFever ? 37.5 + Math.random() * 2 : 36.5 + Math.random(),
        heart_rate: 60 + Math.floor(Math.random() * 40),
        bp_systolic: 110 + Math.floor(Math.random() * 30),
        symptom_fever: hasFever,
        symptom_cough: hasCough,
        diagnosis
      })
    }

    return data
  }
}

// Run the demo
const demo = new EMRDemo()
demo.run().catch(console.error)
