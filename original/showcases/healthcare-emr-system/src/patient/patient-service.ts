/**
 * Patient Service
 *
 * Comprehensive patient management system with demographics,
 * encounters, medical history, and FHIR integration.
 */

import { randomUUID } from 'crypto'
import type {
  Patient,
  PatientDemographics,
  Encounter,
  VitalSigns,
  Allergy,
  Condition,
  Medication,
  Immunization,
  FamilyHistory,
  SocialHistory,
  AdvanceDirective,
  ImagingStudy,
  LabResult,
  EmergencyContact,
  InsuranceInfo,
  ClinicalDocument,
  Diagnosis,
  Procedure,
  Order
} from '../types'

// @ts-ignore
import pandas from 'python:pandas'
// @ts-ignore
import numpy from 'python:numpy'

/**
 * Patient Service
 *
 * Manages patient lifecycle, demographics, and medical records
 */
export class PatientService {
  private patients: Map<string, Patient> = new Map()
  private patientsByMRN: Map<string, string> = new Map()

  constructor() {
    this.initializeService()
  }

  private initializeService(): void {
    console.log('Patient Service initialized')
  }

  // ============================================================================
  // Patient CRUD Operations
  // ============================================================================

  /**
   * Create a new patient record
   */
  async createPatient(demographics: PatientDemographics): Promise<Patient> {
    const patient: Patient = {
      id: randomUUID(),
      mrn: this.generateMRN(),
      demographics,
      insurance: [],
      emergencyContacts: [],
      allergies: [],
      conditions: [],
      medications: [],
      encounters: [],
      vitalSigns: [],
      labResults: [],
      imagingStudies: [],
      immunizations: [],
      familyHistory: [],
      socialHistory: {} as SocialHistory,
      advanceDirectives: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.patients.set(patient.id, patient)
    this.patientsByMRN.set(patient.mrn, patient.id)

    console.log(`Patient created: ${patient.id} (MRN: ${patient.mrn})`)
    return patient
  }

  /**
   * Get patient by ID
   */
  async getPatient(id: string): Promise<Patient | null> {
    return this.patients.get(id) || null
  }

  /**
   * Get patient by Medical Record Number (MRN)
   */
  async getPatientByMRN(mrn: string): Promise<Patient | null> {
    const id = this.patientsByMRN.get(mrn)
    if (!id) return null
    return this.getPatient(id)
  }

  /**
   * Update patient demographics
   */
  async updatePatient(
    id: string,
    updates: Partial<PatientDemographics>
  ): Promise<Patient | null> {
    const patient = await this.getPatient(id)
    if (!patient) return null

    patient.demographics = {
      ...patient.demographics,
      ...updates
    }
    patient.updatedAt = new Date()

    this.patients.set(id, patient)
    console.log(`Patient updated: ${id}`)
    return patient
  }

  /**
   * Delete patient (soft delete - mark as inactive)
   */
  async deletePatient(id: string): Promise<boolean> {
    const patient = await this.getPatient(id)
    if (!patient) return false

    // In production, this would be a soft delete
    patient.demographics.deceased = true
    patient.updatedAt = new Date()

    console.log(`Patient marked deceased: ${id}`)
    return true
  }

  /**
   * Search patients by various criteria
   */
  async searchPatients(criteria: {
    firstName?: string
    lastName?: string
    dateOfBirth?: Date
    mrn?: string
    ssn?: string
    phone?: string
  }): Promise<Patient[]> {
    const results: Patient[] = []

    for (const patient of this.patients.values()) {
      let match = true

      if (criteria.mrn && patient.mrn !== criteria.mrn) {
        match = false
      }
      if (criteria.firstName && !patient.demographics.firstName.toLowerCase().includes(criteria.firstName.toLowerCase())) {
        match = false
      }
      if (criteria.lastName && !patient.demographics.lastName.toLowerCase().includes(criteria.lastName.toLowerCase())) {
        match = false
      }
      if (criteria.dateOfBirth && patient.demographics.dateOfBirth.getTime() !== criteria.dateOfBirth.getTime()) {
        match = false
      }
      if (criteria.ssn && patient.demographics.ssn !== criteria.ssn) {
        match = false
      }
      if (criteria.phone && patient.demographics.contact.primaryPhone !== criteria.phone) {
        match = false
      }

      if (match) {
        results.push(patient)
      }
    }

    return results
  }

  // ============================================================================
  // Encounters
  // ============================================================================

  /**
   * Add a new encounter (visit) for a patient
   */
  async addEncounter(patientId: string, encounter: Omit<Encounter, 'id'>): Promise<Encounter | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newEncounter: Encounter = {
      id: randomUUID(),
      ...encounter
    }

    patient.encounters.push(newEncounter)
    patient.updatedAt = new Date()

    console.log(`Encounter added for patient ${patientId}: ${newEncounter.id}`)
    return newEncounter
  }

  /**
   * Get all encounters for a patient
   */
  async getEncounters(patientId: string): Promise<Encounter[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.encounters
  }

  /**
   * Get a specific encounter
   */
  async getEncounter(patientId: string, encounterId: string): Promise<Encounter | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    return patient.encounters.find(e => e.id === encounterId) || null
  }

  /**
   * Update encounter
   */
  async updateEncounter(
    patientId: string,
    encounterId: string,
    updates: Partial<Encounter>
  ): Promise<Encounter | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const encounterIndex = patient.encounters.findIndex(e => e.id === encounterId)
    if (encounterIndex === -1) return null

    patient.encounters[encounterIndex] = {
      ...patient.encounters[encounterIndex],
      ...updates
    }
    patient.updatedAt = new Date()

    return patient.encounters[encounterIndex]
  }

  // ============================================================================
  // Vital Signs
  // ============================================================================

  /**
   * Record vital signs for a patient
   */
  async recordVitalSigns(
    patientId: string,
    vitals: Omit<VitalSigns, 'id' | 'patientId'>
  ): Promise<VitalSigns | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const vitalSigns: VitalSigns = {
      id: randomUUID(),
      patientId,
      ...vitals
    }

    // Calculate BMI if height and weight are present
    if (vitalSigns.height && vitalSigns.weight) {
      const heightM = vitalSigns.height.unit === 'cm'
        ? vitalSigns.height.value / 100
        : vitalSigns.height.value * 0.0254

      const weightKg = vitalSigns.weight.unit === 'kg'
        ? vitalSigns.weight.value
        : vitalSigns.weight.value * 0.453592

      vitalSigns.bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1))
    }

    patient.vitalSigns.push(vitalSigns)
    patient.updatedAt = new Date()

    console.log(`Vital signs recorded for patient ${patientId}`)
    return vitalSigns
  }

  /**
   * Get latest vital signs for a patient
   */
  async getLatestVitalSigns(patientId: string): Promise<VitalSigns | null> {
    const patient = await this.getPatient(patientId)
    if (!patient || patient.vitalSigns.length === 0) return null

    return patient.vitalSigns[patient.vitalSigns.length - 1]
  }

  /**
   * Get vital signs history
   */
  async getVitalSignsHistory(
    patientId: string,
    options?: {
      startDate?: Date
      endDate?: Date
      limit?: number
    }
  ): Promise<VitalSigns[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []

    let vitals = patient.vitalSigns

    if (options?.startDate) {
      vitals = vitals.filter(v => v.recordedAt >= options.startDate!)
    }

    if (options?.endDate) {
      vitals = vitals.filter(v => v.recordedAt <= options.endDate!)
    }

    if (options?.limit) {
      vitals = vitals.slice(-options.limit)
    }

    return vitals
  }

  // ============================================================================
  // Allergies
  // ============================================================================

  /**
   * Add allergy to patient record
   */
  async addAllergy(
    patientId: string,
    allergy: Omit<Allergy, 'id' | 'patientId'>
  ): Promise<Allergy | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newAllergy: Allergy = {
      id: randomUUID(),
      patientId,
      ...allergy
    }

    patient.allergies.push(newAllergy)
    patient.updatedAt = new Date()

    console.log(`Allergy added for patient ${patientId}: ${newAllergy.substance.code.display}`)
    return newAllergy
  }

  /**
   * Get all allergies for a patient
   */
  async getAllergies(patientId: string): Promise<Allergy[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.allergies.filter(a => a.clinicalStatus === 'active')
  }

  /**
   * Update allergy
   */
  async updateAllergy(
    patientId: string,
    allergyId: string,
    updates: Partial<Allergy>
  ): Promise<Allergy | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const allergyIndex = patient.allergies.findIndex(a => a.id === allergyId)
    if (allergyIndex === -1) return null

    patient.allergies[allergyIndex] = {
      ...patient.allergies[allergyIndex],
      ...updates
    }
    patient.updatedAt = new Date()

    return patient.allergies[allergyIndex]
  }

  // ============================================================================
  // Conditions
  // ============================================================================

  /**
   * Add condition to patient record
   */
  async addCondition(
    patientId: string,
    condition: Omit<Condition, 'id' | 'patientId'>
  ): Promise<Condition | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newCondition: Condition = {
      id: randomUUID(),
      patientId,
      ...condition
    }

    patient.conditions.push(newCondition)
    patient.updatedAt = new Date()

    console.log(`Condition added for patient ${patientId}: ${newCondition.code.display}`)
    return newCondition
  }

  /**
   * Get active conditions (problem list)
   */
  async getActiveConditions(patientId: string): Promise<Condition[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.conditions.filter(c => c.clinicalStatus === 'active')
  }

  /**
   * Get all conditions including resolved
   */
  async getAllConditions(patientId: string): Promise<Condition[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.conditions
  }

  /**
   * Update condition status
   */
  async updateCondition(
    patientId: string,
    conditionId: string,
    updates: Partial<Condition>
  ): Promise<Condition | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const conditionIndex = patient.conditions.findIndex(c => c.id === conditionId)
    if (conditionIndex === -1) return null

    patient.conditions[conditionIndex] = {
      ...patient.conditions[conditionIndex],
      ...updates
    }
    patient.updatedAt = new Date()

    return patient.conditions[conditionIndex]
  }

  // ============================================================================
  // Medications
  // ============================================================================

  /**
   * Add medication to patient record
   */
  async addMedication(
    patientId: string,
    medication: Omit<Medication, 'id' | 'patientId'>
  ): Promise<Medication | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newMedication: Medication = {
      id: randomUUID(),
      patientId,
      ...medication
    }

    patient.medications.push(newMedication)
    patient.updatedAt = new Date()

    console.log(`Medication added for patient ${patientId}: ${newMedication.medication.code.display}`)
    return newMedication
  }

  /**
   * Get active medications
   */
  async getActiveMedications(patientId: string): Promise<Medication[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.medications.filter(m => m.status === 'active')
  }

  /**
   * Get medication history
   */
  async getMedicationHistory(patientId: string): Promise<Medication[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.medications
  }

  /**
   * Discontinue medication
   */
  async discontinueMedication(
    patientId: string,
    medicationId: string,
    reason: string
  ): Promise<Medication | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const medicationIndex = patient.medications.findIndex(m => m.id === medicationId)
    if (medicationIndex === -1) return null

    patient.medications[medicationIndex].status = 'stopped'
    patient.medications[medicationIndex].discontinuedDate = new Date()
    patient.medications[medicationIndex].discontinuedReason = reason
    patient.updatedAt = new Date()

    console.log(`Medication discontinued: ${medicationId}`)
    return patient.medications[medicationIndex]
  }

  // ============================================================================
  // Immunizations
  // ============================================================================

  /**
   * Add immunization record
   */
  async addImmunization(
    patientId: string,
    immunization: Omit<Immunization, 'id' | 'patientId'>
  ): Promise<Immunization | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newImmunization: Immunization = {
      id: randomUUID(),
      patientId,
      ...immunization
    }

    patient.immunizations.push(newImmunization)
    patient.updatedAt = new Date()

    console.log(`Immunization recorded for patient ${patientId}: ${newImmunization.vaccineCode.display}`)
    return newImmunization
  }

  /**
   * Get immunization history
   */
  async getImmunizations(patientId: string): Promise<Immunization[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.immunizations
  }

  // ============================================================================
  // Family & Social History
  // ============================================================================

  /**
   * Add family history
   */
  async addFamilyHistory(
    patientId: string,
    history: Omit<FamilyHistory, 'id' | 'patientId'>
  ): Promise<FamilyHistory | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newHistory: FamilyHistory = {
      id: randomUUID(),
      patientId,
      ...history
    }

    patient.familyHistory.push(newHistory)
    patient.updatedAt = new Date()

    return newHistory
  }

  /**
   * Get family history
   */
  async getFamilyHistory(patientId: string): Promise<FamilyHistory[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.familyHistory
  }

  /**
   * Update social history
   */
  async updateSocialHistory(
    patientId: string,
    socialHistory: Partial<SocialHistory>
  ): Promise<SocialHistory | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    patient.socialHistory = {
      ...patient.socialHistory,
      ...socialHistory
    }
    patient.updatedAt = new Date()

    return patient.socialHistory
  }

  /**
   * Get social history
   */
  async getSocialHistory(patientId: string): Promise<SocialHistory | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null
    return patient.socialHistory
  }

  // ============================================================================
  // Emergency Contacts & Insurance
  // ============================================================================

  /**
   * Add emergency contact
   */
  async addEmergencyContact(
    patientId: string,
    contact: Omit<EmergencyContact, 'id'>
  ): Promise<EmergencyContact | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newContact: EmergencyContact = {
      id: randomUUID(),
      ...contact
    }

    patient.emergencyContacts.push(newContact)
    patient.updatedAt = new Date()

    return newContact
  }

  /**
   * Add insurance information
   */
  async addInsurance(
    patientId: string,
    insurance: Omit<InsuranceInfo, 'id' | 'patientId'>
  ): Promise<InsuranceInfo | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const newInsurance: InsuranceInfo = {
      id: randomUUID(),
      patientId,
      ...insurance
    }

    patient.insurance.push(newInsurance)
    patient.updatedAt = new Date()

    return newInsurance
  }

  /**
   * Get active insurance
   */
  async getActiveInsurance(patientId: string): Promise<InsuranceInfo[]> {
    const patient = await this.getPatient(patientId)
    if (!patient) return []
    return patient.insurance
      .filter(i => i.status === 'active')
      .sort((a, b) => {
        const priority: Record<string, number> = {
          primary: 1,
          secondary: 2,
          tertiary: 3
        }
        return priority[a.priority] - priority[b.priority]
      })
  }

  // ============================================================================
  // Clinical Documents
  // ============================================================================

  /**
   * Add clinical document to encounter
   */
  async addClinicalDocument(
    patientId: string,
    encounterId: string,
    document: Omit<ClinicalDocument, 'id' | 'patientId' | 'encounterId'>
  ): Promise<ClinicalDocument | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const encounterIndex = patient.encounters.findIndex(e => e.id === encounterId)
    if (encounterIndex === -1) return null

    const newDocument: ClinicalDocument = {
      id: randomUUID(),
      patientId,
      encounterId,
      ...document
    }

    patient.encounters[encounterIndex].documents.push(newDocument)
    patient.updatedAt = new Date()

    return newDocument
  }

  // ============================================================================
  // Analytics & Reporting
  // ============================================================================

  /**
   * Get patient summary for dashboard
   */
  async getPatientSummary(patientId: string): Promise<{
    demographics: PatientDemographics
    activeConditions: Condition[]
    activeMedications: Medication[]
    allergies: Allergy[]
    latestVitals?: VitalSigns
    upcomingAppointments: Encounter[]
    recentEncounters: Encounter[]
    pendingOrders: Order[]
  } | null> {
    const patient = await this.getPatient(patientId)
    if (!patient) return null

    const activeConditions = patient.conditions.filter(c => c.clinicalStatus === 'active')
    const activeMedications = patient.medications.filter(m => m.status === 'active')
    const allergies = patient.allergies.filter(a => a.clinicalStatus === 'active')
    const latestVitals = patient.vitalSigns[patient.vitalSigns.length - 1]

    const upcomingAppointments = patient.encounters
      .filter(e => e.status === 'planned' && e.date > new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime())

    const recentEncounters = patient.encounters
      .filter(e => e.status === 'finished')
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)

    // Extract pending orders from recent encounters
    const pendingOrders = patient.encounters
      .flatMap(e => e.orders)
      .filter(o => o && (o.status === 'active' || o.status === 'draft'))

    return {
      demographics: patient.demographics,
      activeConditions,
      activeMedications,
      allergies,
      latestVitals,
      upcomingAppointments,
      recentEncounters,
      pendingOrders
    }
  }

  /**
   * Calculate patient age
   */
  calculateAge(dateOfBirth: Date): number {
    const today = new Date()
    let age = today.getFullYear() - dateOfBirth.getFullYear()
    const monthDiff = today.getMonth() - dateOfBirth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--
    }

    return age
  }

  /**
   * Analyze patient cohort using pandas
   */
  async analyzePatientCohort(patientIds: string[]): Promise<{
    totalPatients: number
    avgAge: number
    genderDistribution: Record<string, number>
    commonConditions: Array<{ condition: string; count: number }>
    avgMedicationCount: number
    avgEncountersPerYear: number
  }> {
    const patients = await Promise.all(
      patientIds.map(id => this.getPatient(id))
    )
    const validPatients = patients.filter(p => p !== null) as Patient[]

    if (validPatients.length === 0) {
      throw new Error('No valid patients found')
    }

    // Calculate ages
    const ages = validPatients.map(p => this.calculateAge(p.demographics.dateOfBirth))
    const avgAge = ages.reduce((sum, age) => sum + age, 0) / ages.length

    // Gender distribution
    const genderDistribution: Record<string, number> = {}
    validPatients.forEach(p => {
      const gender = p.demographics.gender
      genderDistribution[gender] = (genderDistribution[gender] || 0) + 1
    })

    // Common conditions
    const conditionCounts: Record<string, number> = {}
    validPatients.forEach(p => {
      p.conditions
        .filter(c => c.clinicalStatus === 'active')
        .forEach(c => {
          const condition = c.code.display
          conditionCounts[condition] = (conditionCounts[condition] || 0) + 1
        })
    })

    const commonConditions = Object.entries(conditionCounts)
      .map(([condition, count]) => ({ condition, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Average medication count
    const avgMedicationCount = validPatients.reduce(
      (sum, p) => sum + p.medications.filter(m => m.status === 'active').length,
      0
    ) / validPatients.length

    // Average encounters per year
    const avgEncountersPerYear = validPatients.reduce(
      (sum, p) => sum + p.encounters.length,
      0
    ) / validPatients.length

    return {
      totalPatients: validPatients.length,
      avgAge: Math.round(avgAge * 10) / 10,
      genderDistribution,
      commonConditions,
      avgMedicationCount: Math.round(avgMedicationCount * 10) / 10,
      avgEncountersPerYear: Math.round(avgEncountersPerYear * 10) / 10
    }
  }

  /**
   * Export patient data to pandas DataFrame
   */
  async exportToPandas(patientIds: string[]): Promise<any> {
    const patients = await Promise.all(
      patientIds.map(id => this.getPatient(id))
    )
    const validPatients = patients.filter(p => p !== null) as Patient[]

    const data = validPatients.map(p => ({
      patient_id: p.id,
      mrn: p.mrn,
      first_name: p.demographics.firstName,
      last_name: p.demographics.lastName,
      date_of_birth: p.demographics.dateOfBirth.toISOString(),
      age: this.calculateAge(p.demographics.dateOfBirth),
      gender: p.demographics.gender,
      active_conditions: p.conditions.filter(c => c.clinicalStatus === 'active').length,
      active_medications: p.medications.filter(m => m.status === 'active').length,
      total_encounters: p.encounters.length,
      allergies: p.allergies.length
    }))

    // Create pandas DataFrame
    const df = pandas.DataFrame(data)
    return df
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Generate unique Medical Record Number (MRN)
   */
  private generateMRN(): string {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `MRN-${timestamp}${random}`
  }

  /**
   * Validate patient data
   */
  validatePatient(patient: Partial<PatientDemographics>): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!patient.firstName || patient.firstName.trim() === '') {
      errors.push('First name is required')
    }

    if (!patient.lastName || patient.lastName.trim() === '') {
      errors.push('Last name is required')
    }

    if (!patient.dateOfBirth) {
      errors.push('Date of birth is required')
    } else {
      const age = this.calculateAge(patient.dateOfBirth)
      if (age < 0 || age > 150) {
        errors.push('Invalid date of birth')
      }
    }

    if (!patient.gender) {
      errors.push('Gender is required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get all patients (admin function)
   */
  async getAllPatients(): Promise<Patient[]> {
    return Array.from(this.patients.values())
  }

  /**
   * Get patient count
   */
  async getPatientCount(): Promise<number> {
    return this.patients.size
  }
}
