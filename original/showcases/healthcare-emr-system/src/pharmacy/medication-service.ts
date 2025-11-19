/**
 * Medication Service
 *
 * Pharmacy and medication management system including
 * e-prescribing, drug interaction checking, and medication reconciliation.
 */

import { randomUUID } from 'crypto'
import type {
  Medication,
  DrugInteraction,
  DosageInstruction,
  Provider
} from '../types'

// @ts-ignore - Python libraries via Elide
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'

/**
 * Medication Service
 *
 * Manages pharmacy operations:
 * - E-prescribing
 * - Drug interaction checking
 * - Medication reconciliation
 * - Formulary management
 * - Adherence monitoring
 */
export class MedicationService {
  private medications: Map<string, Medication> = new Map()
  private drugInteractionsDB: DrugInteraction[] = []
  private formulary: Set<string> = new Set()

  constructor() {
    this.initializeService()
  }

  private initializeService(): void {
    this.loadDrugInteractionsDatabase()
    this.loadFormulary()
    console.log('Medication Service initialized')
  }

  // ============================================================================
  // E-Prescribing
  // ============================================================================

  /**
   * Prescribe medication (e-prescribing)
   */
  async prescribeMedication(options: {
    patientId: string
    medication: {
      name: string
      rxnormCode?: string
      form?: string
      strength?: string
      dose: string
      frequency: string
      route: string
      duration: number
      quantity?: number
      refills?: number
    }
    providerId: string
    providerName: string
    indication?: string
    instructions?: string
    substitutionAllowed?: boolean
  }): Promise<Medication> {
    console.log(`Prescribing ${options.medication.name} for patient ${options.patientId}`)

    // Check formulary
    const onFormulary = await this.checkFormulary(options.medication.name)
    if (!onFormulary) {
      console.warn(`Medication ${options.medication.name} is not on formulary`)
    }

    // Check drug interactions
    const interactions = await this.checkInteractions({
      patientId: options.patientId,
      newMedication: options.medication.name
    })

    if (interactions.some(i => i.severity === 'contraindicated')) {
      throw new Error('CONTRAINDICATED: Cannot prescribe due to severe drug interactions')
    }

    // Create medication prescription
    const prescription: Medication = {
      id: randomUUID(),
      prescriptionId: this.generatePrescriptionNumber(),
      patientId: options.patientId,
      medication: {
        code: {
          system: 'RxNorm',
          code: options.medication.rxnormCode || this.lookupRxNorm(options.medication.name),
          display: options.medication.name
        },
        form: options.medication.form,
        strength: options.medication.strength
      },
      status: 'active',
      intent: 'order',
      dosageInstruction: [{
        sequence: 1,
        text: `Take ${options.medication.dose} ${options.medication.route} ${options.medication.frequency}`,
        patientInstruction: options.instructions,
        timing: {
          repeat: this.parseFrequency(options.medication.frequency)
        },
        route: options.medication.route,
        doseAndRate: [{
          doseQuantity: {
            value: parseFloat(options.medication.dose),
            unit: this.extractUnit(options.medication.dose)
          }
        }]
      }],
      prescribedDate: new Date(),
      prescriber: {
        id: options.providerId,
        npi: '',
        name: options.providerName,
        credentials: 'MD',
        specialty: ''
      },
      dispense: {
        validityPeriod: {
          start: new Date(),
          end: this.calculateEndDate(options.medication.duration)
        },
        numberOfRepeatsAllowed: options.medication.refills || 0,
        quantity: {
          value: options.medication.quantity || this.calculateQuantity(
            options.medication.frequency,
            options.medication.duration
          ),
          unit: 'tablet'
        },
        daysSupply: options.medication.duration
      },
      substitution: {
        allowed: options.substitutionAllowed !== false
      }
    }

    this.medications.set(prescription.id, prescription)

    console.log(`Prescription created: ${prescription.prescriptionId}`)
    return prescription
  }

  /**
   * Renew prescription
   */
  async renewPrescription(
    medicationId: string,
    refills: number
  ): Promise<Medication> {
    const medication = this.medications.get(medicationId)
    if (!medication) {
      throw new Error('Medication not found')
    }

    if (!medication.dispense) {
      throw new Error('Cannot renew medication without dispense information')
    }

    medication.dispense.numberOfRepeatsAllowed += refills
    medication.dispense.validityPeriod.end = this.calculateEndDate(
      medication.dispense.daysSupply * refills
    )

    console.log(`Prescription renewed: ${medicationId}`)
    return medication
  }

  /**
   * Discontinue medication
   */
  async discontinueMedication(
    medicationId: string,
    reason: string,
    providerId: string
  ): Promise<Medication> {
    const medication = this.medications.get(medicationId)
    if (!medication) {
      throw new Error('Medication not found')
    }

    medication.status = 'stopped'
    medication.discontinuedDate = new Date()
    medication.discontinuedReason = reason

    console.log(`Medication discontinued: ${medicationId} - ${reason}`)
    return medication
  }

  // ============================================================================
  // Drug Interaction Checking
  // ============================================================================

  /**
   * Check drug interactions for patient's medications
   */
  async checkInteractions(options: {
    patientId: string
    newMedication?: string
    medications?: string[]
  }): Promise<DrugInteraction[]> {
    // Get patient's current medications
    const currentMeds = Array.from(this.medications.values())
      .filter(m => m.patientId === options.patientId && m.status === 'active')
      .map(m => m.medication.code.display)

    // Add new medication if checking before prescribing
    const medsToCheck = options.newMedication
      ? [...currentMeds, options.newMedication]
      : options.medications || currentMeds

    const interactions: DrugInteraction[] = []

    // Check each pair of medications
    for (let i = 0; i < medsToCheck.length; i++) {
      for (let j = i + 1; j < medsToCheck.length; j++) {
        const interaction = this.findInteraction(medsToCheck[i], medsToCheck[j])
        if (interaction) {
          interactions.push(interaction)
        }
      }
    }

    // Sort by severity
    interactions.sort((a, b) => {
      const severityOrder = { 'contraindicated': 4, 'major': 3, 'moderate': 2, 'minor': 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })

    if (interactions.length > 0) {
      console.warn(`Found ${interactions.length} drug interactions`)
    }

    return interactions
  }

  /**
   * Find interaction between two drugs
   */
  private findInteraction(drug1: string, drug2: string): DrugInteraction | null {
    const drug1Lower = drug1.toLowerCase()
    const drug2Lower = drug2.toLowerCase()

    return this.drugInteractionsDB.find(interaction => {
      const int1 = interaction.drug1.toLowerCase()
      const int2 = interaction.drug2.toLowerCase()

      return (
        (int1.includes(drug1Lower) && int2.includes(drug2Lower)) ||
        (int1.includes(drug2Lower) && int2.includes(drug1Lower))
      )
    }) || null
  }

  /**
   * Load drug interactions database
   */
  private loadDrugInteractionsDatabase(): void {
    // Sample drug interactions (in production, this would be a comprehensive database)
    this.drugInteractionsDB = [
      {
        severity: 'contraindicated',
        drug1: 'Warfarin',
        drug2: 'Aspirin',
        description: 'Increased risk of bleeding',
        clinicalEffect: 'Concurrent use may significantly increase bleeding risk',
        managementStrategy: 'Avoid combination. Consider alternative anticoagulation strategy.',
        references: ['DrugBank', 'FDA']
      },
      {
        severity: 'major',
        drug1: 'Lisinopril',
        drug2: 'Potassium',
        description: 'Risk of hyperkalemia',
        clinicalEffect: 'ACE inhibitors can increase potassium levels',
        managementStrategy: 'Monitor potassium levels closely. Consider alternative.',
        references: ['UpToDate']
      },
      {
        severity: 'major',
        drug1: 'Metformin',
        drug2: 'Contrast',
        description: 'Risk of lactic acidosis',
        clinicalEffect: 'Contrast dye may precipitate lactic acidosis in patients on metformin',
        managementStrategy: 'Hold metformin before and 48 hours after contrast administration',
        references: ['FDA']
      },
      {
        severity: 'moderate',
        drug1: 'Simvastatin',
        drug2: 'Amlodipine',
        description: 'Increased statin levels',
        clinicalEffect: 'Amlodipine inhibits CYP3A4, increasing simvastatin levels',
        managementStrategy: 'Limit simvastatin to 20mg daily or use alternative statin',
        references: ['FDA']
      },
      {
        severity: 'moderate',
        drug1: 'Levothyroxine',
        drug2: 'Calcium',
        description: 'Decreased thyroid hormone absorption',
        clinicalEffect: 'Calcium can bind to levothyroxine and reduce absorption',
        managementStrategy: 'Separate administration by at least 4 hours',
        references: ['Micromedex']
      },
      {
        severity: 'minor',
        drug1: 'Ibuprofen',
        drug2: 'Caffeine',
        description: 'Enhanced analgesic effect',
        clinicalEffect: 'Caffeine may enhance the pain-relieving effects of ibuprofen',
        managementStrategy: 'No special precautions needed',
        references: ['Cochrane']
      }
    ]
  }

  // ============================================================================
  // Medication Reconciliation
  // ============================================================================

  /**
   * Perform medication reconciliation (compare patient's medication lists)
   */
  async reconcileMedications(options: {
    patientId: string
    admissionMeds: string[]
    homeMeds: string[]
  }): Promise<{
    matched: Array<{ medication: string; source: 'both' }>
    addedOnAdmission: string[]
    discontinuedOnAdmission: string[]
    discrepancies: Array<{
      medication: string
      issue: string
      recommendation: string
    }>
  }> {
    const matched: Array<{ medication: string; source: 'both' }> = []
    const addedOnAdmission: string[] = []
    const discontinuedOnAdmission: string[] = []
    const discrepancies: Array<{
      medication: string
      issue: string
      recommendation: string
    }> = []

    // Find matched medications
    for (const homeMed of options.homeMeds) {
      if (options.admissionMeds.includes(homeMed)) {
        matched.push({ medication: homeMed, source: 'both' })
      } else {
        discontinuedOnAdmission.push(homeMed)
        discrepancies.push({
          medication: homeMed,
          issue: 'Home medication not continued on admission',
          recommendation: 'Verify if medication should be continued or if it was intentionally discontinued'
        })
      }
    }

    // Find added medications
    for (const admissionMed of options.admissionMeds) {
      if (!options.homeMeds.includes(admissionMed)) {
        addedOnAdmission.push(admissionMed)
        discrepancies.push({
          medication: admissionMed,
          issue: 'New medication added on admission',
          recommendation: 'Ensure patient is educated about new medication before discharge'
        })
      }
    }

    console.log(`Medication reconciliation completed: ${matched.length} matched, ${discrepancies.length} discrepancies`)

    return {
      matched,
      addedOnAdmission,
      discontinuedOnAdmission,
      discrepancies
    }
  }

  // ============================================================================
  // Formulary Management
  // ============================================================================

  /**
   * Check if medication is on formulary
   */
  async checkFormulary(medication: string): Promise<boolean> {
    return this.formulary.has(medication.toLowerCase())
  }

  /**
   * Get formulary alternatives
   */
  async getFormularyAlternatives(medication: string): Promise<string[]> {
    // In production, this would query a drug database for therapeutic equivalents
    const alternatives: Record<string, string[]> = {
      'lipitor': ['Atorvastatin', 'Simvastatin', 'Rosuvastatin'],
      'plavix': ['Clopidogrel', 'Aspirin + Dipyridamole'],
      'nexium': ['Omeprazole', 'Pantoprazole', 'Lansoprazole'],
      'advair': ['Fluticasone/Salmeterol', 'Budesonide/Formoterol'],
      'lantus': ['Insulin Glargine', 'Insulin Detemir', 'Insulin Degludec']
    }

    const medicationLower = medication.toLowerCase()
    for (const [brand, generics] of Object.entries(alternatives)) {
      if (medicationLower.includes(brand)) {
        return generics
      }
    }

    return []
  }

  /**
   * Load formulary
   */
  private loadFormulary(): void {
    const commonMedications = [
      'Lisinopril', 'Metformin', 'Atorvastatin', 'Amlodipine', 'Omeprazole',
      'Metoprolol', 'Losartan', 'Albuterol', 'Gabapentin', 'Hydrochlorothiazide',
      'Levothyroxine', 'Sertraline', 'Ibuprofen', 'Acetaminophen', 'Aspirin',
      'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Cephalexin',
      'Prednisone', 'Insulin', 'Warfarin', 'Clopidogrel', 'Furosemide'
    ]

    commonMedications.forEach(med => this.formulary.add(med.toLowerCase()))
  }

  // ============================================================================
  // Medication Adherence
  // ============================================================================

  /**
   * Calculate medication adherence (Medication Possession Ratio)
   */
  async calculateAdherence(options: {
    patientId: string
    medicationId: string
    startDate: Date
    endDate: Date
    daysSupplied: number
  }): Promise<{
    mpr: number // Medication Possession Ratio
    adherent: boolean
    daysWithMedication: number
    totalDays: number
  }> {
    const totalDays = Math.ceil(
      (options.endDate.getTime() - options.startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const daysWithMedication = Math.min(options.daysSupplied, totalDays)
    const mpr = (daysWithMedication / totalDays) * 100

    return {
      mpr: parseFloat(mpr.toFixed(2)),
      adherent: mpr >= 80, // 80% adherence threshold
      daysWithMedication,
      totalDays
    }
  }

  /**
   * Identify non-adherent patients
   */
  async identifyNonAdherentPatients(threshold: number = 80): Promise<Array<{
    patientId: string
    medicationId: string
    adherence: number
  }>> {
    const nonAdherent: Array<{
      patientId: string
      medicationId: string
      adherence: number
    }> = []

    // In production, this would query actual refill data
    // Placeholder implementation
    return nonAdherent
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate prescription number
   */
  private generatePrescriptionNumber(): string {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `RX-${timestamp}-${random}`
  }

  /**
   * Parse frequency string to timing object
   */
  private parseFrequency(frequency: string): any {
    const frequencyMap: Record<string, any> = {
      'once daily': { frequency: 1, period: 1, periodUnit: 'd' },
      'twice daily': { frequency: 2, period: 1, periodUnit: 'd' },
      'three times daily': { frequency: 3, period: 1, periodUnit: 'd' },
      'four times daily': { frequency: 4, period: 1, periodUnit: 'd' },
      'every 6 hours': { frequency: 4, period: 1, periodUnit: 'd' },
      'every 8 hours': { frequency: 3, period: 1, periodUnit: 'd' },
      'every 12 hours': { frequency: 2, period: 1, periodUnit: 'd' },
      'at bedtime': { frequency: 1, period: 1, periodUnit: 'd', when: ['HS'] },
      'as needed': { frequency: 1, period: 1, periodUnit: 'd' }
    }

    return frequencyMap[frequency.toLowerCase()] || { frequency: 1, period: 1, periodUnit: 'd' }
  }

  /**
   * Calculate end date based on duration
   */
  private calculateEndDate(durationDays: number): Date {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)
    return endDate
  }

  /**
   * Calculate quantity based on frequency and duration
   */
  private calculateQuantity(frequency: string, duration: number): number {
    const timing = this.parseFrequency(frequency)
    return timing.frequency * duration
  }

  /**
   * Extract unit from dose string
   */
  private extractUnit(dose: string): string {
    const units = ['mg', 'g', 'mcg', 'ml', 'units', 'tablet', 'capsule']
    for (const unit of units) {
      if (dose.toLowerCase().includes(unit)) {
        return unit
      }
    }
    return 'tablet'
  }

  /**
   * Lookup RxNorm code (simplified)
   */
  private lookupRxNorm(medicationName: string): string {
    const rxnormCodes: Record<string, string> = {
      'Lisinopril': '104383',
      'Metformin': '6809',
      'Atorvastatin': '83367',
      'Amlodipine': '17767',
      'Omeprazole': '7646',
      'Aspirin': '1191'
    }

    return rxnormCodes[medicationName] || '000000'
  }

  /**
   * Get medication by ID
   */
  async getMedication(id: string): Promise<Medication | null> {
    return this.medications.get(id) || null
  }

  /**
   * Get patient's medications
   */
  async getPatientMedications(patientId: string): Promise<Medication[]> {
    return Array.from(this.medications.values())
      .filter(m => m.patientId === patientId && m.status === 'active')
  }

  /**
   * Get medication history
   */
  async getMedicationHistory(patientId: string): Promise<Medication[]> {
    return Array.from(this.medications.values())
      .filter(m => m.patientId === patientId)
      .sort((a, b) => b.prescribedDate.getTime() - a.prescribedDate.getTime())
  }

  /**
   * Search medications
   */
  async searchMedications(query: string): Promise<string[]> {
    const medications = Array.from(this.formulary)
    return medications.filter(med =>
      med.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10)
  }
}
