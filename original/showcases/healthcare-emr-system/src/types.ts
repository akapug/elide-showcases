/**
 * Healthcare EMR System - Core Type Definitions
 *
 * Comprehensive type system for Electronic Medical Records,
 * HL7 FHIR resources, DICOM imaging, and clinical workflows.
 */

// ============================================================================
// Patient Demographics & Identity
// ============================================================================

export interface Patient {
  id: string
  mrn: string // Medical Record Number
  demographics: PatientDemographics
  insurance: InsuranceInfo[]
  emergencyContacts: EmergencyContact[]
  allergies: Allergy[]
  conditions: Condition[]
  medications: Medication[]
  encounters: Encounter[]
  vitalSigns: VitalSigns[]
  labResults: LabResult[]
  imagingStudies: ImagingStudy[]
  immunizations: Immunization[]
  familyHistory: FamilyHistory[]
  socialHistory: SocialHistory
  advanceDirectives?: AdvanceDirective[]
  createdAt: Date
  updatedAt: Date
}

export interface PatientDemographics {
  firstName: string
  middleName?: string
  lastName: string
  suffix?: string
  preferredName?: string
  dateOfBirth: Date
  gender: Gender
  biologicalSex?: BiologicalSex
  genderIdentity?: string
  sexualOrientation?: string
  race?: string[]
  ethnicity?: string
  preferredLanguage: string
  maritalStatus?: MaritalStatus
  ssn?: string // Encrypted
  address: Address
  contact: ContactInfo
  deceased?: boolean
  dateOfDeath?: Date
}

export type Gender = 'male' | 'female' | 'other' | 'unknown'
export type BiologicalSex = 'male' | 'female' | 'intersex' | 'unknown'
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'domestic-partner'

export interface Address {
  use: 'home' | 'work' | 'temporary' | 'billing'
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  district?: string
}

export interface ContactInfo {
  primaryPhone: string
  mobilePhone?: string
  workPhone?: string
  email?: string
  preferredContactMethod: 'phone' | 'email' | 'text' | 'mail'
}

export interface EmergencyContact {
  id: string
  name: string
  relationship: string
  phone: string
  alternatePhone?: string
  email?: string
  address?: Address
  isPrimary: boolean
}

// ============================================================================
// Insurance & Billing
// ============================================================================

export interface InsuranceInfo {
  id: string
  patientId: string
  priority: 'primary' | 'secondary' | 'tertiary'
  subscriberId: string
  groupNumber?: string
  payer: {
    id: string
    name: string
    phone: string
    address: Address
  }
  subscriber: {
    name: string
    relationship: 'self' | 'spouse' | 'child' | 'other'
    dateOfBirth: Date
  }
  effectiveDate: Date
  expirationDate?: Date
  copay?: number
  deductible?: number
  outOfPocketMax?: number
  status: 'active' | 'inactive' | 'pending' | 'cancelled'
}

// ============================================================================
// Clinical Data
// ============================================================================

export interface Encounter {
  id: string
  patientId: string
  type: EncounterType
  status: EncounterStatus
  class: EncounterClass
  priority?: 'routine' | 'urgent' | 'asap' | 'stat'
  date: Date
  endDate?: Date
  duration?: number // minutes
  location: {
    facility: string
    department: string
    room?: string
  }
  provider: Provider
  participatingProviders?: Provider[]
  chiefComplaint: string
  historyOfPresentIllness: string
  reviewOfSystems?: ReviewOfSystems
  physicalExam?: PhysicalExam
  assessment: string
  plan: string
  diagnoses: Diagnosis[]
  procedures: Procedure[]
  orders: Order[]
  documents: ClinicalDocument[]
  billing: {
    cptCodes: string[]
    icdCodes: string[]
    chargeAmount?: number
    insuranceClaims?: string[]
  }
}

export type EncounterType =
  | 'inpatient'
  | 'outpatient'
  | 'emergency'
  | 'ambulatory'
  | 'home-health'
  | 'virtual'
  | 'observation'

export type EncounterStatus =
  | 'planned'
  | 'arrived'
  | 'in-progress'
  | 'finished'
  | 'cancelled'
  | 'entered-in-error'

export type EncounterClass =
  | 'AMB'  // Ambulatory
  | 'EMER' // Emergency
  | 'FLD'  // Field
  | 'HH'   // Home Health
  | 'IMP'  // Inpatient
  | 'OBSENC' // Observation
  | 'VR'   // Virtual

export interface Provider {
  id: string
  npi: string // National Provider Identifier
  name: string
  credentials: string
  specialty: string
  department?: string
  phone?: string
  email?: string
}

export interface ReviewOfSystems {
  constitutional?: string
  eyes?: string
  entHeadNeck?: string
  cardiovascular?: string
  respiratory?: string
  gastrointestinal?: string
  genitourinary?: string
  musculoskeletal?: string
  integumentary?: string
  neurological?: string
  psychiatric?: string
  endocrine?: string
  hematologic?: string
  allergicImmunologic?: string
}

export interface PhysicalExam {
  general?: string
  vital_signs: VitalSigns
  heent?: string // Head, Eyes, Ears, Nose, Throat
  cardiovascular?: string
  respiratory?: string
  abdomen?: string
  extremities?: string
  neurological?: string
  skin?: string
  psychiatric?: string
}

export interface VitalSigns {
  id: string
  patientId: string
  encounterId?: string
  recordedAt: Date
  recordedBy: string
  temperature?: {
    value: number
    unit: 'F' | 'C'
    site?: 'oral' | 'axillary' | 'tympanic' | 'rectal'
  }
  bloodPressure?: {
    systolic: number
    diastolic: number
    unit: 'mmHg'
    position?: 'sitting' | 'standing' | 'lying'
    arm?: 'left' | 'right'
  }
  heartRate?: {
    value: number
    unit: 'bpm'
    rhythm?: 'regular' | 'irregular'
  }
  respiratoryRate?: {
    value: number
    unit: 'breaths/min'
  }
  oxygenSaturation?: {
    value: number // percentage
    unit: '%'
    oxygenDelivery?: 'room-air' | 'supplemental'
    flowRate?: number
  }
  height?: {
    value: number
    unit: 'cm' | 'in'
  }
  weight?: {
    value: number
    unit: 'kg' | 'lb'
  }
  bmi?: number
  painScore?: {
    value: number // 0-10 scale
    scale: 'numeric' | 'wong-baker' | 'faces'
  }
}

// ============================================================================
// Diagnoses & Conditions
// ============================================================================

export interface Diagnosis {
  id: string
  encounterId: string
  code: {
    system: 'ICD-10' | 'ICD-11' | 'SNOMED-CT'
    code: string
    display: string
  }
  category: 'problem-list-item' | 'encounter-diagnosis'
  severity?: 'mild' | 'moderate' | 'severe'
  verificationStatus: 'provisional' | 'differential' | 'confirmed' | 'refuted' | 'entered-in-error'
  clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved'
  onsetDate?: Date
  abatementDate?: Date
  diagnosedBy: string
  notes?: string
}

export interface Condition {
  id: string
  patientId: string
  code: {
    system: 'ICD-10' | 'ICD-11' | 'SNOMED-CT'
    code: string
    display: string
  }
  category: string[]
  severity?: 'mild' | 'moderate' | 'severe'
  clinicalStatus: 'active' | 'recurrence' | 'relapse' | 'inactive' | 'remission' | 'resolved'
  verificationStatus: 'unconfirmed' | 'provisional' | 'differential' | 'confirmed' | 'refuted'
  onsetDate?: Date
  abatementDate?: Date
  recordedDate: Date
  recordedBy: string
  notes?: string
  stage?: {
    summary: string
    assessment?: string
  }
}

// ============================================================================
// Medications & Pharmacy
// ============================================================================

export interface Medication {
  id: string
  patientId: string
  prescriptionId?: string
  medication: {
    code: {
      system: 'RxNorm' | 'NDC'
      code: string
      display: string
    }
    form?: string
    strength?: string
    manufacturer?: string
  }
  status: MedicationStatus
  intent: 'proposal' | 'plan' | 'order' | 'original-order' | 'reflex-order' | 'instance-order'
  dosageInstruction: DosageInstruction[]
  prescribedDate: Date
  prescriber: Provider
  dispense?: {
    validityPeriod: {
      start: Date
      end: Date
    }
    numberOfRepeatsAllowed: number
    quantity: {
      value: number
      unit: string
    }
    daysSupply: number
  }
  substitution?: {
    allowed: boolean
    reason?: string
  }
  pharmacy?: {
    name: string
    phone: string
    address: Address
  }
  discontinuedDate?: Date
  discontinuedReason?: string
}

export type MedicationStatus =
  | 'active'
  | 'completed'
  | 'entered-in-error'
  | 'intended'
  | 'stopped'
  | 'on-hold'
  | 'unknown'

export interface DosageInstruction {
  sequence?: number
  text: string
  patientInstruction?: string
  timing: {
    repeat: {
      frequency: number
      period: number
      periodUnit: 's' | 'min' | 'h' | 'd' | 'wk' | 'mo' | 'a'
      when?: string[]
    }
  }
  asNeeded?: boolean
  asNeededFor?: string
  site?: string
  route: string
  method?: string
  doseAndRate: {
    type?: string
    dose?: {
      value: number
      unit: string
    }
    rate?: {
      value: number
      unit: string
    }
  }[]
  maxDosePerPeriod?: {
    numerator: { value: number; unit: string }
    denominator: { value: number; unit: string }
  }
}

export interface DrugInteraction {
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated'
  drug1: string
  drug2: string
  description: string
  clinicalEffect: string
  managementStrategy: string
  references?: string[]
}

// ============================================================================
// Laboratory & Diagnostics
// ============================================================================

export interface LabOrder {
  id: string
  patientId: string
  encounterId?: string
  status: OrderStatus
  priority: 'routine' | 'urgent' | 'stat' | 'asap'
  orderedDate: Date
  orderedBy: Provider
  tests: LabTest[]
  specimenCollection?: {
    collectedDate?: Date
    collectedBy?: string
    specimenType: string
    bodySite?: string
    method?: string
  }
  performingLab?: {
    id: string
    name: string
    clia: string // Clinical Laboratory Improvement Amendments ID
  }
  clinicalInfo?: string
  diagnosis?: string[]
}

export interface LabTest {
  code: {
    system: 'LOINC' | 'CPT'
    code: string
    display: string
  }
  category: string
  panel?: boolean
}

export interface LabResult {
  id: string
  orderId: string
  patientId: string
  test: LabTest
  status: 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled'
  value: {
    type: 'numeric' | 'text' | 'coded'
    numeric?: number
    text?: string
    code?: {
      system: string
      code: string
      display: string
    }
  }
  unit?: string
  referenceRange?: {
    low?: number
    high?: number
    text?: string
  }
  interpretation?: 'normal' | 'high' | 'low' | 'critical-high' | 'critical-low' | 'abnormal'
  flags?: ('critical' | 'abnormal' | 'high' | 'low')[]
  performedDate: Date
  reportedDate: Date
  performedBy?: string
  verifiedBy?: string
  specimenId?: string
  method?: string
  notes?: string
}

export type OrderStatus =
  | 'draft'
  | 'active'
  | 'on-hold'
  | 'revoked'
  | 'completed'
  | 'entered-in-error'
  | 'unknown'

// ============================================================================
// Medical Imaging & DICOM
// ============================================================================

export interface ImagingStudy {
  id: string
  studyInstanceUID: string
  patientId: string
  encounterId?: string
  orderId?: string
  status: 'registered' | 'available' | 'cancelled' | 'entered-in-error'
  modality: ImagingModality
  description: string
  numberOfSeries: number
  numberOfInstances: number
  started?: Date
  ended?: Date
  referrer?: Provider
  interpreter?: Provider
  location?: string
  procedureCode?: {
    system: 'CPT' | 'SNOMED-CT'
    code: string
    display: string
  }
  reason?: string
  series: DICOMSeries[]
  report?: ImagingReport
}

export type ImagingModality =
  | 'CT'    // Computed Tomography
  | 'MRI'   // Magnetic Resonance Imaging
  | 'XR'    // X-Ray
  | 'US'    // Ultrasound
  | 'PT'    // PET Scan
  | 'NM'    // Nuclear Medicine
  | 'MG'    // Mammography
  | 'DX'    // Digital Radiography
  | 'CR'    // Computed Radiography

export interface DICOMSeries {
  id: string
  seriesInstanceUID: string
  number: number
  modality: ImagingModality
  description: string
  numberOfInstances: number
  bodyPart: string
  laterality?: 'left' | 'right' | 'bilateral'
  started?: Date
  instances: DICOMInstance[]
}

export interface DICOMInstance {
  id: string
  sopInstanceUID: string
  sopClassUID: string
  number: number
  title?: string
  filePath: string
  fileSize: number
  transferSyntaxUID?: string
  metadata?: DICOMMetadata
}

export interface DICOMMetadata {
  patientName?: string
  patientID?: string
  patientBirthDate?: string
  patientSex?: string
  studyDate?: string
  studyTime?: string
  studyDescription?: string
  seriesDescription?: string
  modality?: string
  manufacturer?: string
  manufacturerModelName?: string
  institutionName?: string
  rows?: number
  columns?: number
  bitsAllocated?: number
  bitsStored?: number
  samplesPerPixel?: number
  photometricInterpretation?: string
  pixelSpacing?: number[]
  sliceThickness?: number
  sliceLocation?: number
  imagePositionPatient?: number[]
  imageOrientationPatient?: number[]
  windowCenter?: number
  windowWidth?: number
}

export interface ImagingReport {
  id: string
  studyId: string
  status: 'preliminary' | 'final' | 'amended' | 'cancelled'
  createdDate: Date
  verifiedDate?: Date
  radiologist: Provider
  findings: string
  impression: string
  recommendations?: string
  criticalResults?: string[]
  comparisonStudies?: string[]
  technique?: string
  aiFindings?: RadiologyAIFindings
}

export interface RadiologyAIFindings {
  model: string
  version: string
  confidence: number
  abnormalitiesDetected: boolean
  findings: {
    type: string
    location: string
    size?: { x: number; y: number; z?: number }
    confidence: number
    boundingBox?: { x: number; y: number; width: number; height: number }
  }[]
  urgency: 'routine' | 'urgent' | 'stat'
  suggestedFollowUp?: string
}

// ============================================================================
// Procedures & Interventions
// ============================================================================

export interface Procedure {
  id: string
  patientId: string
  encounterId?: string
  status: 'preparation' | 'in-progress' | 'completed' | 'entered-in-error' | 'unknown'
  code: {
    system: 'CPT' | 'ICD-10-PCS' | 'SNOMED-CT'
    code: string
    display: string
  }
  category?: string
  performedDate: Date
  performedBy: Provider
  assistants?: Provider[]
  location?: string
  bodySite?: string[]
  outcome?: string
  complication?: string[]
  followUp?: string
  notes?: string
  report?: string
}

export interface Order {
  id: string
  patientId: string
  encounterId?: string
  type: 'medication' | 'lab' | 'imaging' | 'procedure' | 'referral' | 'other'
  status: OrderStatus
  priority: 'routine' | 'urgent' | 'stat' | 'asap'
  orderedDate: Date
  orderedBy: Provider
  details: any
  reason?: string
  clinicalInfo?: string
  scheduledDate?: Date
  completedDate?: Date
  notes?: string
}

// ============================================================================
// Allergies & Immunizations
// ============================================================================

export interface Allergy {
  id: string
  patientId: string
  substance: {
    code: {
      system: 'RxNorm' | 'SNOMED-CT' | 'UNII'
      code: string
      display: string
    }
  }
  type: 'allergy' | 'intolerance'
  category: 'food' | 'medication' | 'environment' | 'biologic'
  criticality: 'low' | 'high' | 'unable-to-assess'
  clinicalStatus: 'active' | 'inactive' | 'resolved'
  verificationStatus: 'unconfirmed' | 'confirmed' | 'refuted' | 'entered-in-error'
  onsetDate?: Date
  recordedDate: Date
  recordedBy: string
  reactions?: {
    manifestation: string[]
    severity: 'mild' | 'moderate' | 'severe'
    exposureRoute?: string
    note?: string
  }[]
  notes?: string
}

export interface Immunization {
  id: string
  patientId: string
  vaccineCode: {
    system: 'CVX' | 'RxNorm'
    code: string
    display: string
  }
  status: 'completed' | 'entered-in-error' | 'not-done'
  statusReason?: string
  occurrenceDate: Date
  recorded: Date
  primarySource: boolean
  manufacturer?: string
  lotNumber?: string
  expirationDate?: Date
  site?: string
  route?: string
  doseQuantity?: {
    value: number
    unit: string
  }
  performer?: Provider
  note?: string
  reaction?: {
    date: Date
    detail: string
  }[]
  protocolApplied?: {
    series?: string
    doseNumber: number
    seriesDoses?: number
  }[]
}

// ============================================================================
// Social & Family History
// ============================================================================

export interface FamilyHistory {
  id: string
  patientId: string
  relationship: string
  condition: {
    code: {
      system: 'ICD-10' | 'SNOMED-CT'
      code: string
      display: string
    }
  }
  onsetAge?: number
  deceasedAge?: number
  note?: string
}

export interface SocialHistory {
  smokingStatus?: 'current-smoker' | 'former-smoker' | 'never-smoked' | 'unknown'
  smokingQuantity?: {
    packsPerDay?: number
    years?: number
  }
  alcoholUse?: 'current' | 'former' | 'never' | 'unknown'
  alcoholQuantity?: {
    drinksPerWeek?: number
  }
  drugUse?: {
    type: string
    status: 'current' | 'former' | 'never'
    notes?: string
  }[]
  occupation?: string
  employmentStatus?: string
  education?: string
  livingArrangement?: string
  maritalStatus?: MaritalStatus
  sexuallyActive?: boolean
  pregnancyStatus?: {
    pregnant: boolean
    estimatedDueDate?: Date
    numberOfPreviousPregnancies?: number
  }
}

export interface AdvanceDirective {
  id: string
  patientId: string
  type: 'living-will' | 'healthcare-proxy' | 'dnr' | 'polst' | 'organ-donation' | 'other'
  status: 'active' | 'inactive'
  effectiveDate: Date
  documentReference?: string
  agent?: {
    name: string
    relationship: string
    contact: ContactInfo
  }
  notes?: string
}

// ============================================================================
// Clinical Documents
// ============================================================================

export interface ClinicalDocument {
  id: string
  type: 'progress-note' | 'discharge-summary' | 'operative-note' | 'consult' | 'other'
  status: 'preliminary' | 'final' | 'amended' | 'entered-in-error'
  category: string
  date: Date
  author: Provider
  subject: string
  content: string
  encounterId?: string
  patientId: string
  authenticatedBy?: string
  authenticatedDate?: Date
}

// ============================================================================
// ML & AI Models
// ============================================================================

export interface MLDiagnosisRequest {
  patientId: string
  symptoms: string[]
  vitals: Partial<VitalSigns>
  labResults?: Record<string, any>
  medicalHistory?: string[]
  demographics?: Partial<PatientDemographics>
}

export interface MLDiagnosisResponse {
  diagnosis: string
  confidence: number
  probability: number
  differentialDiagnoses: {
    diagnosis: string
    probability: number
  }[]
  recommendations: string[]
  urgency: 'routine' | 'urgent' | 'emergent'
  suggestedTests?: string[]
  warningFlags?: string[]
  modelMetadata: {
    modelName: string
    version: string
    trainedOn: string
    accuracy: number
  }
}

export interface MLModelMetrics {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  auc: number
  sensitivity: number
  specificity: number
}

// ============================================================================
// Population Health & Analytics
// ============================================================================

export interface PopulationHealthMetrics {
  totalPatients: number
  demographics: {
    ageDistribution: { range: string; count: number }[]
    genderDistribution: Record<Gender, number>
    raceDistribution: Record<string, number>
  }
  prevalence: {
    condition: string
    count: number
    percentage: number
  }[]
  qualityMetrics: QualityMetric[]
  riskStratification: {
    low: number
    moderate: number
    high: number
  }
  costMetrics?: {
    totalCost: number
    avgCostPerPatient: number
    highCostPatients: number
  }
}

export interface QualityMetric {
  measure: string
  description: string
  numerator: number
  denominator: number
  percentage: number
  benchmark?: number
  target?: number
  category: 'HEDIS' | 'STAR' | 'MIPS' | 'custom'
}

// ============================================================================
// Security & Compliance
// ============================================================================

export interface AuditLog {
  id: string
  timestamp: Date
  userId: string
  userName: string
  action: AuditAction
  resourceType: string
  resourceId: string
  patientId?: string
  ipAddress: string
  userAgent?: string
  success: boolean
  reason?: string
  changes?: {
    field: string
    oldValue: any
    newValue: any
  }[]
  metadata?: Record<string, any>
}

export type AuditAction =
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'export'
  | 'print'
  | 'login'
  | 'logout'
  | 'access-denied'

export interface EncryptedPHI {
  encryptedData: string
  algorithm: 'AES-256-GCM'
  iv: string
  authTag: string
  encryptedAt: Date
  encryptedBy: string
}

export interface AccessControl {
  userId: string
  role: UserRole
  permissions: Permission[]
  departmentRestrictions?: string[]
  patientRestrictions?: string[]
}

export type UserRole =
  | 'physician'
  | 'nurse'
  | 'administrator'
  | 'pharmacist'
  | 'lab-tech'
  | 'radiologist'
  | 'billing'
  | 'patient'

export type Permission =
  | 'view-patients'
  | 'edit-patients'
  | 'view-medications'
  | 'prescribe-medications'
  | 'view-labs'
  | 'order-labs'
  | 'view-imaging'
  | 'order-imaging'
  | 'view-billing'
  | 'admin'

// ============================================================================
// HL7 FHIR Resource Types
// ============================================================================

export interface FHIRResource {
  resourceType: string
  id?: string
  meta?: {
    versionId?: string
    lastUpdated?: Date
    profile?: string[]
  }
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient'
  identifier: FHIRIdentifier[]
  active?: boolean
  name: FHIRHumanName[]
  telecom?: FHIRContactPoint[]
  gender?: 'male' | 'female' | 'other' | 'unknown'
  birthDate?: string
  deceased?: boolean | string
  address?: FHIRAddress[]
  maritalStatus?: FHIRCodeableConcept
  multipleBirth?: boolean | number
  contact?: FHIRPatientContact[]
  communication?: FHIRPatientCommunication[]
}

export interface FHIRIdentifier {
  use?: 'usual' | 'official' | 'temp' | 'secondary'
  system?: string
  value?: string
  type?: FHIRCodeableConcept
}

export interface FHIRHumanName {
  use?: 'usual' | 'official' | 'temp' | 'nickname' | 'maiden'
  family?: string
  given?: string[]
  prefix?: string[]
  suffix?: string[]
}

export interface FHIRContactPoint {
  system?: 'phone' | 'fax' | 'email' | 'pager' | 'url' | 'sms' | 'other'
  value?: string
  use?: 'home' | 'work' | 'temp' | 'old' | 'mobile'
}

export interface FHIRAddress {
  use?: 'home' | 'work' | 'temp' | 'old' | 'billing'
  type?: 'postal' | 'physical' | 'both'
  line?: string[]
  city?: string
  state?: string
  postalCode?: string
  country?: string
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[]
  text?: string
}

export interface FHIRCoding {
  system?: string
  code?: string
  display?: string
  version?: string
}

export interface FHIRPatientContact {
  relationship?: FHIRCodeableConcept[]
  name?: FHIRHumanName
  telecom?: FHIRContactPoint[]
  address?: FHIRAddress
}

export interface FHIRPatientCommunication {
  language: FHIRCodeableConcept
  preferred?: boolean
}

// ============================================================================
// Configuration & Settings
// ============================================================================

export interface EMRConfig {
  facilityId: string
  facilityName: string
  timezone: string
  locale: string
  features: {
    ePrescribing: boolean
    labIntegration: boolean
    imagingIntegration: boolean
    aiDiagnosis: boolean
    populationHealth: boolean
    patientPortal: boolean
  }
  integrations: {
    fhir: {
      enabled: boolean
      baseUrl?: string
      version: 'R4' | 'R5'
    }
    dicom: {
      enabled: boolean
      pacsUrl?: string
    }
    hl7: {
      enabled: boolean
      version: '2.3' | '2.5' | '2.7'
    }
  }
  security: {
    hipaaCompliance: boolean
    encryptionAtRest: boolean
    encryptionInTransit: boolean
    auditLogging: boolean
    sessionTimeout: number
    mfaRequired: boolean
  }
}

export interface EMRError {
  code: string
  message: string
  details?: any
  timestamp: Date
  userId?: string
  resourceType?: string
  resourceId?: string
}

// ============================================================================
// Utility Types
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> =
  Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>
  }[Keys]

export type Nullable<T> = T | null
export type Optional<T> = T | undefined
