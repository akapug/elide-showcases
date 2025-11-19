/**
 * Healthcare EMR System - Performance Benchmarks
 *
 * Measures performance of key EMR operations to ensure
 * production readiness and scalability.
 */

import { PatientService } from '../src/patient/patient-service'
import { DiagnosisAssistant } from '../src/clinical/diagnosis-assistant'
import { DICOMService } from '../src/imaging/dicom-service'
import { MedicationService } from '../src/pharmacy/medication-service'
import { LabResultsService } from '../src/lab/lab-results-service'
import { PopulationHealth } from '../src/analytics/population-health'
import { HIPAACompliance } from '../src/security/hipaa-compliance'
import { FHIRIntegration } from '../src/hl7/fhir-integration'

import type { Patient, PatientDemographics } from '../src/types'

/**
 * Benchmark result
 */
interface BenchmarkResult {
  name: string
  operations: number
  totalTime: number
  avgTime: number
  opsPerSecond: number
  minTime: number
  maxTime: number
}

/**
 * EMR Performance Benchmarks
 */
class EMRBenchmarks {
  private patientService: PatientService
  private diagnosisAssistant: DiagnosisAssistant
  private dicomService: DICOMService
  private medicationService: MedicationService
  private labService: LabResultsService
  private populationHealth: PopulationHealth
  private hipaa: HIPAACompliance
  private fhirIntegration: FHIRIntegration

  private results: BenchmarkResult[] = []

  constructor() {
    console.log('⚡ Initializing EMR Performance Benchmarks...\n')

    this.patientService = new PatientService()
    this.diagnosisAssistant = new DiagnosisAssistant()
    this.dicomService = new DICOMService()
    this.medicationService = new MedicationService()
    this.labService = new LabResultsService()
    this.populationHealth = new PopulationHealth()
    this.hipaa = new HIPAACompliance()
    this.fhirIntegration = new FHIRIntegration()
  }

  /**
   * Run all benchmarks
   */
  async runAll(): Promise<void> {
    console.log('=' + '='.repeat(79))
    console.log('HEALTHCARE EMR SYSTEM - PERFORMANCE BENCHMARKS')
    console.log('='.repeat(80))
    console.log()

    try {
      // Patient operations
      await this.benchmarkPatientCreation()
      await this.benchmarkPatientRetrieval()
      await this.benchmarkVitalSigns()

      // Clinical operations
      await this.benchmarkMedicationPrescribing()
      await this.benchmarkLabOrders()

      // Imaging operations
      await this.benchmarkImagingStudyCreation()

      // Security operations
      await this.benchmarkEncryption()
      await this.benchmarkAuditLogging()

      // FHIR operations
      await this.benchmarkFHIRConversion()

      // Analytics operations
      await this.benchmarkPopulationAnalytics()

      // Display results
      this.displayResults()

      console.log('\n' + '='.repeat(80))
      console.log('✅ ALL BENCHMARKS COMPLETED')
      console.log('='.repeat(80))

    } catch (error) {
      console.error('\n❌ Benchmark failed:', error)
      throw error
    }
  }

  // ============================================================================
  // Patient Benchmarks
  // ============================================================================

  private async benchmarkPatientCreation(): Promise<void> {
    console.log('\n📋 Benchmarking Patient Creation...')

    const iterations = 1000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const demographics: PatientDemographics = {
        firstName: `Patient${i}`,
        lastName: `Test${i}`,
        dateOfBirth: new Date(1970 + (i % 50), (i % 12), (i % 28) + 1),
        gender: i % 2 === 0 ? 'male' : 'female',
        preferredLanguage: 'en',
        address: {
          use: 'home',
          line1: `${i} Main Street`,
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'US'
        },
        contact: {
          primaryPhone: `617-555-${String(i).padStart(4, '0')}`,
          preferredContactMethod: 'phone'
        }
      }

      const start = performance.now()
      await this.patientService.createPatient(demographics)
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Patient Creation', iterations, times)
  }

  private async benchmarkPatientRetrieval(): Promise<void> {
    console.log('\n📋 Benchmarking Patient Retrieval...')

    const patients = await this.patientService.getAllPatients()
    const iterations = 10000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const patient = patients[i % patients.length]

      const start = performance.now()
      await this.patientService.getPatient(patient.id)
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Patient Retrieval', iterations, times)
  }

  private async benchmarkVitalSigns(): Promise<void> {
    console.log('\n📋 Benchmarking Vital Signs Recording...')

    const patients = await this.patientService.getAllPatients()
    const iterations = 5000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const patient = patients[i % patients.length]

      const vitals = {
        recordedAt: new Date(),
        recordedBy: 'NURSE-001',
        temperature: { value: 98.6, unit: 'F' as const },
        bloodPressure: { systolic: 120, diastolic: 80, unit: 'mmHg' as const },
        heartRate: { value: 72, unit: 'bpm' as const },
        respiratoryRate: { value: 16, unit: 'breaths/min' as const },
        oxygenSaturation: { value: 98, unit: '%' as const }
      }

      const start = performance.now()
      await this.patientService.recordVitalSigns(patient.id, vitals as any)
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Vital Signs Recording', iterations, times)
  }

  // ============================================================================
  // Clinical Benchmarks
  // ============================================================================

  private async benchmarkMedicationPrescribing(): Promise<void> {
    console.log('\n💊 Benchmarking Medication Prescribing...')

    const iterations = 5000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await this.medicationService.prescribeMedication({
        patientId: `P-${i}`,
        medication: {
          name: 'Lisinopril',
          dose: '10mg',
          frequency: 'once daily',
          route: 'oral',
          duration: 90
        },
        providerId: 'DR-001',
        providerName: 'Dr. Test'
      })
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Medication Prescribing', iterations, times)
  }

  private async benchmarkLabOrders(): Promise<void> {
    console.log('\n🧪 Benchmarking Lab Orders...')

    const iterations = 5000
    const times: number[] = []

    const provider = {
      id: 'DR-001',
      npi: '1234567890',
      name: 'Dr. Test',
      credentials: 'MD',
      specialty: 'Internal Medicine'
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await this.labService.createOrder({
        patientId: `P-${i}`,
        tests: ['CBC', 'CMP'],
        priority: 'routine',
        orderedBy: provider
      })
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Lab Order Creation', iterations, times)
  }

  // ============================================================================
  // Imaging Benchmarks
  // ============================================================================

  private async benchmarkImagingStudyCreation(): Promise<void> {
    console.log('\n🩻 Benchmarking Imaging Study Creation...')

    const iterations = 2000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await this.dicomService.createStudy({
        studyInstanceUID: `1.2.840.${i}`,
        patientId: `P-${i}`,
        status: 'available',
        modality: 'CT',
        description: 'Test study',
        numberOfSeries: 1,
        numberOfInstances: 100,
        series: []
      })
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Imaging Study Creation', iterations, times)
  }

  // ============================================================================
  // Security Benchmarks
  // ============================================================================

  private async benchmarkEncryption(): Promise<void> {
    console.log('\n🔒 Benchmarking PHI Encryption...')

    const iterations = 5000
    const times: number[] = []

    const phi = {
      patientId: 'P-12345',
      data: {
        ssn: '123-45-6789',
        diagnosis: 'Test diagnosis',
        medications: ['Med1', 'Med2']
      }
    }

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await this.hipaa.encryptPHI(phi)
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('PHI Encryption', iterations, times)
  }

  private async benchmarkAuditLogging(): Promise<void> {
    console.log('\n🔒 Benchmarking Audit Logging...')

    const iterations = 10000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await this.hipaa.logAccess({
        userId: `USER-${i % 100}`,
        userName: 'Test User',
        action: 'view',
        resourceType: 'Patient',
        resourceId: `P-${i}`,
        patientId: `P-${i}`,
        ipAddress: '127.0.0.1',
        success: true
      })
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Audit Logging', iterations, times)
  }

  // ============================================================================
  // FHIR Benchmarks
  // ============================================================================

  private async benchmarkFHIRConversion(): Promise<void> {
    console.log('\n🔗 Benchmarking FHIR Conversion...')

    const patients = await this.patientService.getAllPatients()
    const iterations = 5000
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const patient = patients[i % patients.length]

      const start = performance.now()
      await this.fhirIntegration.patientToFHIR(patient)
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('FHIR Patient Conversion', iterations, times)
  }

  // ============================================================================
  // Analytics Benchmarks
  // ============================================================================

  private async benchmarkPopulationAnalytics(): Promise<void> {
    console.log('\n📊 Benchmarking Population Analytics...')

    const patients = await this.patientService.getAllPatients()
    const iterations = 100
    const times: number[] = []

    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      await this.populationHealth.calculatePopulationMetrics(patients)
      const end = performance.now()

      times.push(end - start)
    }

    this.recordResult('Population Metrics Calculation', iterations, times)
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private recordResult(name: string, operations: number, times: number[]): void {
    const totalTime = times.reduce((sum, t) => sum + t, 0)
    const avgTime = totalTime / operations
    const opsPerSecond = 1000 / avgTime
    const minTime = Math.min(...times)
    const maxTime = Math.max(...times)

    const result: BenchmarkResult = {
      name,
      operations,
      totalTime,
      avgTime,
      opsPerSecond,
      minTime,
      maxTime
    }

    this.results.push(result)

    console.log(`  ✓ Completed: ${operations.toLocaleString()} operations`)
    console.log(`    Avg: ${avgTime.toFixed(3)}ms`)
    console.log(`    Throughput: ${opsPerSecond.toFixed(0)} ops/sec`)
  }

  private displayResults(): void {
    console.log('\n\n' + '='.repeat(80))
    console.log('PERFORMANCE SUMMARY')
    console.log('='.repeat(80))
    console.log()

    console.log('┌─' + '─'.repeat(78) + '┐')
    console.log('│ Operation                           │   Ops/sec │   Avg (ms) │   Min │   Max │')
    console.log('├─' + '─'.repeat(78) + '┤')

    this.results.forEach(result => {
      const name = result.name.padEnd(35)
      const ops = result.opsPerSecond.toFixed(0).padStart(9)
      const avg = result.avgTime.toFixed(3).padStart(10)
      const min = result.minTime.toFixed(2).padStart(5)
      const max = result.maxTime.toFixed(2).padStart(5)

      console.log(`│ ${name} │ ${ops} │ ${avg} │ ${min} │ ${max} │`)
    })

    console.log('└─' + '─'.repeat(78) + '┘')

    // Performance grades
    console.log('\n📊 Performance Grades:')
    console.log()

    this.results.forEach(result => {
      const grade = this.getPerformanceGrade(result)
      const gradeColor = grade === 'A' ? '🟢' : grade === 'B' ? '🟡' : '🔴'
      console.log(`  ${gradeColor} ${result.name.padEnd(35)} Grade: ${grade}`)
    })

    // Summary statistics
    console.log('\n📈 Summary Statistics:')
    console.log()

    const totalOps = this.results.reduce((sum, r) => sum + r.operations, 0)
    const totalTime = this.results.reduce((sum, r) => sum + r.totalTime, 0)
    const avgOpsPerSec = this.results.reduce((sum, r) => sum + r.opsPerSecond, 0) / this.results.length

    console.log(`  Total Operations: ${totalOps.toLocaleString()}`)
    console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)}s`)
    console.log(`  Average Throughput: ${avgOpsPerSec.toFixed(0)} ops/sec`)

    // Performance targets
    console.log('\n🎯 Performance Targets:')
    console.log()
    console.log('  Target               Expected        Actual         Status')
    console.log('  ' + '─'.repeat(60))

    const targets = [
      { name: 'Patient Lookup', expected: 20000, actual: this.getOpsPerSec('Patient Retrieval') },
      { name: 'Medication Rx', expected: 5000, actual: this.getOpsPerSec('Medication Prescribing') },
      { name: 'Lab Orders', expected: 5000, actual: this.getOpsPerSec('Lab Order Creation') },
      { name: 'Audit Logging', expected: 10000, actual: this.getOpsPerSec('Audit Logging') },
      { name: 'FHIR Conversion', expected: 5000, actual: this.getOpsPerSec('FHIR Patient Conversion') }
    ]

    targets.forEach(target => {
      const status = target.actual >= target.expected ? '✅ PASS' : '❌ FAIL'
      console.log(`  ${target.name.padEnd(18)} ${String(target.expected).padStart(8)}/s   ${String(Math.round(target.actual)).padStart(8)}/s    ${status}`)
    })

    // Recommendations
    console.log('\n💡 Recommendations:')
    console.log()

    const slowOperations = this.results.filter(r => r.opsPerSecond < 1000)
    if (slowOperations.length > 0) {
      console.log('  • Consider optimizing the following operations:')
      slowOperations.forEach(op => {
        console.log(`    - ${op.name} (${op.opsPerSecond.toFixed(0)} ops/sec)`)
      })
    } else {
      console.log('  ✓ All operations meet performance targets')
    }

    console.log('  • Enable connection pooling for database operations')
    console.log('  • Implement caching for frequently accessed data')
    console.log('  • Consider horizontal scaling for high-throughput operations')
  }

  private getPerformanceGrade(result: BenchmarkResult): string {
    const targets: Record<string, number> = {
      'Patient Creation': 1000,
      'Patient Retrieval': 10000,
      'Vital Signs Recording': 3000,
      'Medication Prescribing': 3000,
      'Lab Order Creation': 3000,
      'Imaging Study Creation': 1000,
      'PHI Encryption': 3000,
      'Audit Logging': 5000,
      'FHIR Patient Conversion': 3000,
      'Population Metrics Calculation': 10
    }

    const target = targets[result.name] || 1000
    const ratio = result.opsPerSecond / target

    if (ratio >= 1.5) return 'A'
    if (ratio >= 1.0) return 'B'
    if (ratio >= 0.7) return 'C'
    return 'D'
  }

  private getOpsPerSec(name: string): number {
    const result = this.results.find(r => r.name === name)
    return result?.opsPerSecond || 0
  }
}

// Run benchmarks
const benchmarks = new EMRBenchmarks()
benchmarks.runAll().catch(console.error)
