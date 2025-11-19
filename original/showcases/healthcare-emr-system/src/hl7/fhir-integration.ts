/**
 * HL7 FHIR Integration
 *
 * Integration with HL7 FHIR (Fast Healthcare Interoperability Resources)
 * for healthcare data exchange and interoperability.
 */

import { randomUUID } from 'crypto'
import type {
  Patient,
  FHIRPatient,
  FHIRResource,
  Encounter,
  VitalSigns,
  Medication,
  LabResult,
  ImagingStudy,
  Condition,
  Allergy,
  FHIRIdentifier,
  FHIRHumanName,
  FHIRContactPoint,
  FHIRAddress,
  FHIRCodeableConcept,
  FHIRCoding
} from '../types'

// @ts-ignore - Python FHIR library via Elide
import fhir from 'python:fhir.resources'

/**
 * FHIR Integration Service
 *
 * Provides bidirectional conversion between EMR data models and HL7 FHIR resources
 */
export class FHIRIntegration {
  private readonly fhirVersion = 'R4'

  constructor() {
    console.log(`FHIR Integration initialized (version: ${this.fhirVersion})`)
  }

  // ============================================================================
  // Patient Resources
  // ============================================================================

  /**
   * Convert EMR Patient to FHIR Patient resource
   */
  async patientToFHIR(patient: Patient): Promise<FHIRPatient> {
    const fhirPatient: FHIRPatient = {
      resourceType: 'Patient',
      id: patient.id,
      meta: {
        lastUpdated: patient.updatedAt
      },
      identifier: [
        {
          use: 'official',
          system: 'http://hospital.org/mrn',
          value: patient.mrn
        }
      ],
      active: !patient.demographics.deceased,
      name: [
        {
          use: 'official',
          family: patient.demographics.lastName,
          given: [patient.demographics.firstName],
          prefix: patient.demographics.middleName ? [patient.demographics.middleName] : undefined
        }
      ],
      telecom: [
        {
          system: 'phone',
          value: patient.demographics.contact.primaryPhone,
          use: 'home'
        }
      ],
      gender: patient.demographics.gender,
      birthDate: patient.demographics.dateOfBirth.toISOString().split('T')[0],
      deceased: patient.demographics.deceased || false,
      address: [
        {
          use: patient.demographics.address.use,
          line: [patient.demographics.address.line1, patient.demographics.address.line2].filter(Boolean) as string[],
          city: patient.demographics.address.city,
          state: patient.demographics.address.state,
          postalCode: patient.demographics.address.postalCode,
          country: patient.demographics.address.country
        }
      ]
    }

    // Add email if available
    if (patient.demographics.contact.email) {
      fhirPatient.telecom?.push({
        system: 'email',
        value: patient.demographics.contact.email,
        use: 'home'
      })
    }

    return fhirPatient
  }

  /**
   * Convert FHIR Patient resource to EMR Patient
   */
  async fhirToPatient(fhirPatient: FHIRPatient): Promise<Partial<Patient>> {
    const name = fhirPatient.name?.[0]
    const address = fhirPatient.address?.[0]
    const phone = fhirPatient.telecom?.find(t => t.system === 'phone')
    const email = fhirPatient.telecom?.find(t => t.system === 'email')

    return {
      id: fhirPatient.id,
      mrn: fhirPatient.identifier?.[0]?.value || '',
      demographics: {
        firstName: name?.given?.[0] || '',
        middleName: name?.given?.[1],
        lastName: name?.family || '',
        dateOfBirth: new Date(fhirPatient.birthDate || ''),
        gender: fhirPatient.gender || 'unknown',
        deceased: typeof fhirPatient.deceased === 'boolean' ? fhirPatient.deceased : false,
        preferredLanguage: 'en',
        address: {
          use: (address?.use as any) || 'home',
          line1: address?.line?.[0] || '',
          line2: address?.line?.[1],
          city: address?.city || '',
          state: address?.state || '',
          postalCode: address?.postalCode || '',
          country: address?.country || 'US'
        },
        contact: {
          primaryPhone: phone?.value || '',
          email: email?.value,
          preferredContactMethod: 'phone'
        }
      }
    }
  }

  // ============================================================================
  // Observation Resources (Vital Signs, Lab Results)
  // ============================================================================

  /**
   * Convert vital signs to FHIR Observation
   */
  async vitalSignsToFHIR(vitals: VitalSigns, patientId: string): Promise<any> {
    const observations: any[] = []

    // Blood Pressure
    if (vitals.bloodPressure) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs',
            display: 'Vital Signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '85354-9',
            display: 'Blood pressure panel'
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: vitals.recordedAt.toISOString(),
        component: [
          {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8480-6',
                display: 'Systolic blood pressure'
              }]
            },
            valueQuantity: {
              value: vitals.bloodPressure.systolic,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          },
          {
            code: {
              coding: [{
                system: 'http://loinc.org',
                code: '8462-4',
                display: 'Diastolic blood pressure'
              }]
            },
            valueQuantity: {
              value: vitals.bloodPressure.diastolic,
              unit: 'mmHg',
              system: 'http://unitsofmeasure.org',
              code: 'mm[Hg]'
            }
          }
        ]
      })
    }

    // Temperature
    if (vitals.temperature) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8310-5',
            display: 'Body temperature'
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: vitals.recordedAt.toISOString(),
        valueQuantity: {
          value: vitals.temperature.value,
          unit: vitals.temperature.unit === 'F' ? 'degF' : 'degC',
          system: 'http://unitsofmeasure.org',
          code: vitals.temperature.unit === 'F' ? '[degF]' : 'Cel'
        }
      })
    }

    // Heart Rate
    if (vitals.heartRate) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '8867-4',
            display: 'Heart rate'
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: vitals.recordedAt.toISOString(),
        valueQuantity: {
          value: vitals.heartRate.value,
          unit: 'beats/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        }
      })
    }

    // Respiratory Rate
    if (vitals.respiratoryRate) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '9279-1',
            display: 'Respiratory rate'
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: vitals.recordedAt.toISOString(),
        valueQuantity: {
          value: vitals.respiratoryRate.value,
          unit: 'breaths/minute',
          system: 'http://unitsofmeasure.org',
          code: '/min'
        }
      })
    }

    // Oxygen Saturation
    if (vitals.oxygenSaturation) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '59408-5',
            display: 'Oxygen saturation'
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: vitals.recordedAt.toISOString(),
        valueQuantity: {
          value: vitals.oxygenSaturation.value,
          unit: '%',
          system: 'http://unitsofmeasure.org',
          code: '%'
        }
      })
    }

    // BMI
    if (vitals.bmi) {
      observations.push({
        resourceType: 'Observation',
        id: randomUUID(),
        status: 'final',
        category: [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/observation-category',
            code: 'vital-signs'
          }]
        }],
        code: {
          coding: [{
            system: 'http://loinc.org',
            code: '39156-5',
            display: 'Body mass index (BMI)'
          }]
        },
        subject: {
          reference: `Patient/${patientId}`
        },
        effectiveDateTime: vitals.recordedAt.toISOString(),
        valueQuantity: {
          value: vitals.bmi,
          unit: 'kg/m2',
          system: 'http://unitsofmeasure.org',
          code: 'kg/m2'
        }
      })
    }

    return observations
  }

  /**
   * Convert lab result to FHIR Observation
   */
  async labResultToFHIR(labResult: LabResult, patientId: string): Promise<any> {
    const observation: any = {
      resourceType: 'Observation',
      id: labResult.id,
      status: labResult.status,
      category: [{
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/observation-category',
          code: 'laboratory',
          display: 'Laboratory'
        }]
      }],
      code: {
        coding: [{
          system: labResult.test.code.system === 'LOINC' ? 'http://loinc.org' : 'http://www.ama-assn.org/go/cpt',
          code: labResult.test.code.code,
          display: labResult.test.code.display
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      effectiveDateTime: labResult.performedDate.toISOString(),
      issued: labResult.reportedDate.toISOString()
    }

    // Add value based on type
    if (labResult.value.type === 'numeric' && labResult.value.numeric !== undefined) {
      observation.valueQuantity = {
        value: labResult.value.numeric,
        unit: labResult.unit,
        system: 'http://unitsofmeasure.org'
      }
    } else if (labResult.value.type === 'text') {
      observation.valueString = labResult.value.text
    } else if (labResult.value.type === 'coded' && labResult.value.code) {
      observation.valueCodeableConcept = {
        coding: [{
          system: labResult.value.code.system,
          code: labResult.value.code.code,
          display: labResult.value.code.display
        }]
      }
    }

    // Add reference range
    if (labResult.referenceRange) {
      observation.referenceRange = [{
        low: labResult.referenceRange.low ? {
          value: labResult.referenceRange.low,
          unit: labResult.unit
        } : undefined,
        high: labResult.referenceRange.high ? {
          value: labResult.referenceRange.high,
          unit: labResult.unit
        } : undefined,
        text: labResult.referenceRange.text
      }]
    }

    // Add interpretation
    if (labResult.interpretation) {
      const interpretationCode = {
        'normal': 'N',
        'high': 'H',
        'low': 'L',
        'critical-high': 'HH',
        'critical-low': 'LL',
        'abnormal': 'A'
      }[labResult.interpretation]

      if (interpretationCode) {
        observation.interpretation = [{
          coding: [{
            system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
            code: interpretationCode
          }]
        }]
      }
    }

    return observation
  }

  // ============================================================================
  // Condition Resources
  // ============================================================================

  /**
   * Convert condition to FHIR Condition resource
   */
  async conditionToFHIR(condition: Condition, patientId: string): Promise<any> {
    return {
      resourceType: 'Condition',
      id: condition.id,
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
          code: condition.clinicalStatus
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
          code: condition.verificationStatus
        }]
      },
      category: condition.category.map(cat => ({
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/condition-category',
          code: cat
        }]
      })),
      severity: condition.severity ? {
        coding: [{
          system: 'http://snomed.info/sct',
          code: condition.severity === 'mild' ? '255604002' :
                condition.severity === 'moderate' ? '6736007' : '24484000',
          display: condition.severity
        }]
      } : undefined,
      code: {
        coding: [{
          system: condition.code.system === 'ICD-10' ? 'http://hl7.org/fhir/sid/icd-10' : 'http://snomed.info/sct',
          code: condition.code.code,
          display: condition.code.display
        }]
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      onsetDateTime: condition.onsetDate?.toISOString(),
      abatementDateTime: condition.abatementDate?.toISOString(),
      recordedDate: condition.recordedDate.toISOString()
    }
  }

  // ============================================================================
  // Medication Resources
  // ============================================================================

  /**
   * Convert medication to FHIR MedicationRequest
   */
  async medicationToFHIR(medication: Medication, patientId: string): Promise<any> {
    return {
      resourceType: 'MedicationRequest',
      id: medication.id,
      status: medication.status,
      intent: medication.intent,
      medicationCodeableConcept: {
        coding: [{
          system: medication.medication.code.system === 'RxNorm' ?
            'http://www.nlm.nih.gov/research/umls/rxnorm' :
            'http://hl7.org/fhir/sid/ndc',
          code: medication.medication.code.code,
          display: medication.medication.code.display
        }],
        text: medication.medication.code.display
      },
      subject: {
        reference: `Patient/${patientId}`
      },
      authoredOn: medication.prescribedDate.toISOString(),
      requester: {
        reference: `Practitioner/${medication.prescriber.id}`,
        display: medication.prescriber.name
      },
      dosageInstruction: medication.dosageInstruction.map(dosage => ({
        sequence: dosage.sequence,
        text: dosage.text,
        patientInstruction: dosage.patientInstruction,
        timing: {
          repeat: {
            frequency: dosage.timing.repeat.frequency,
            period: dosage.timing.repeat.period,
            periodUnit: dosage.timing.repeat.periodUnit
          }
        },
        asNeededBoolean: dosage.asNeeded,
        route: {
          coding: [{
            system: 'http://snomed.info/sct',
            display: dosage.route
          }]
        },
        doseAndRate: dosage.doseAndRate.map(dr => ({
          doseQuantity: dr.dose ? {
            value: dr.dose.value,
            unit: dr.dose.unit,
            system: 'http://unitsofmeasure.org'
          } : undefined
        }))
      })),
      dispenseRequest: medication.dispense ? {
        validityPeriod: {
          start: medication.dispense.validityPeriod.start.toISOString(),
          end: medication.dispense.validityPeriod.end.toISOString()
        },
        numberOfRepeatsAllowed: medication.dispense.numberOfRepeatsAllowed,
        quantity: {
          value: medication.dispense.quantity.value,
          unit: medication.dispense.quantity.unit
        },
        expectedSupplyDuration: {
          value: medication.dispense.daysSupply,
          unit: 'days',
          system: 'http://unitsofmeasure.org',
          code: 'd'
        }
      } : undefined,
      substitution: medication.substitution ? {
        allowedBoolean: medication.substitution.allowed
      } : undefined
    }
  }

  // ============================================================================
  // AllergyIntolerance Resources
  // ============================================================================

  /**
   * Convert allergy to FHIR AllergyIntolerance
   */
  async allergyToFHIR(allergy: Allergy, patientId: string): Promise<any> {
    return {
      resourceType: 'AllergyIntolerance',
      id: allergy.id,
      clinicalStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
          code: allergy.clinicalStatus
        }]
      },
      verificationStatus: {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: allergy.verificationStatus
        }]
      },
      type: allergy.type,
      category: [allergy.category],
      criticality: allergy.criticality,
      code: {
        coding: [{
          system: allergy.substance.code.system === 'RxNorm' ?
            'http://www.nlm.nih.gov/research/umls/rxnorm' : 'http://snomed.info/sct',
          code: allergy.substance.code.code,
          display: allergy.substance.code.display
        }]
      },
      patient: {
        reference: `Patient/${patientId}`
      },
      onsetDateTime: allergy.onsetDate?.toISOString(),
      recordedDate: allergy.recordedDate.toISOString(),
      reaction: allergy.reactions?.map(reaction => ({
        manifestation: reaction.manifestation.map(m => ({
          coding: [{
            system: 'http://snomed.info/sct',
            display: m
          }]
        })),
        severity: reaction.severity
      }))
    }
  }

  // ============================================================================
  // Encounter Resources
  // ============================================================================

  /**
   * Convert encounter to FHIR Encounter
   */
  async encounterToFHIR(encounter: Encounter, patientId: string): Promise<any> {
    return {
      resourceType: 'Encounter',
      id: encounter.id,
      status: encounter.status,
      class: {
        system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        code: encounter.class
      },
      type: [{
        coding: [{
          system: 'http://snomed.info/sct',
          display: encounter.type
        }]
      }],
      priority: encounter.priority ? {
        coding: [{
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActPriority',
          code: encounter.priority
        }]
      } : undefined,
      subject: {
        reference: `Patient/${patientId}`
      },
      participant: [{
        individual: {
          reference: `Practitioner/${encounter.provider.id}`,
          display: encounter.provider.name
        }
      }],
      period: {
        start: encounter.date.toISOString(),
        end: encounter.endDate?.toISOString()
      },
      reasonCode: [{
        text: encounter.chiefComplaint
      }],
      location: [{
        location: {
          display: `${encounter.location.facility} - ${encounter.location.department}`
        }
      }]
    }
  }

  // ============================================================================
  // Imaging Study Resources
  // ============================================================================

  /**
   * Convert imaging study to FHIR ImagingStudy
   */
  async imagingStudyToFHIR(study: ImagingStudy, patientId: string): Promise<any> {
    return {
      resourceType: 'ImagingStudy',
      id: study.id,
      identifier: [{
        system: 'urn:dicom:uid',
        value: `urn:oid:${study.studyInstanceUID}`
      }],
      status: study.status,
      modality: [{
        system: 'http://dicom.nema.org/resources/ontology/DCM',
        code: study.modality
      }],
      subject: {
        reference: `Patient/${patientId}`
      },
      started: study.started?.toISOString(),
      numberOfSeries: study.numberOfSeries,
      numberOfInstances: study.numberOfInstances,
      procedureCode: study.procedureCode ? [{
        coding: [{
          system: study.procedureCode.system === 'CPT' ?
            'http://www.ama-assn.org/go/cpt' : 'http://snomed.info/sct',
          code: study.procedureCode.code,
          display: study.procedureCode.display
        }]
      }] : undefined,
      reasonCode: study.reason ? [{
        text: study.reason
      }] : undefined,
      series: study.series.map(series => ({
        uid: series.seriesInstanceUID,
        number: series.number,
        modality: {
          system: 'http://dicom.nema.org/resources/ontology/DCM',
          code: series.modality
        },
        description: series.description,
        numberOfInstances: series.numberOfInstances,
        bodySite: series.bodyPart ? {
          system: 'http://snomed.info/sct',
          display: series.bodyPart
        } : undefined,
        laterality: series.laterality ? {
          system: 'http://snomed.info/sct',
          code: series.laterality === 'left' ? 'L' : series.laterality === 'right' ? 'R' : 'B'
        } : undefined,
        started: series.started?.toISOString(),
        instance: series.instances.map(instance => ({
          uid: instance.sopInstanceUID,
          sopClass: {
            system: 'urn:ietf:rfc:3986',
            code: `urn:oid:${instance.sopClassUID}`
          },
          number: instance.number,
          title: instance.title
        }))
      }))
    }
  }

  // ============================================================================
  // Bundle Operations
  // ============================================================================

  /**
   * Create FHIR Bundle for batch operations
   */
  async createBundle(resources: FHIRResource[], type: 'collection' | 'transaction' | 'batch' = 'collection'): Promise<any> {
    return {
      resourceType: 'Bundle',
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      total: resources.length,
      entry: resources.map(resource => ({
        fullUrl: `${resource.resourceType}/${resource.id}`,
        resource
      }))
    }
  }

  /**
   * Create patient summary bundle (IPS - International Patient Summary)
   */
  async createPatientSummary(
    patient: Patient,
    options?: {
      includeAllergies?: boolean
      includeConditions?: boolean
      includeMedications?: boolean
      includeVitals?: boolean
      includeLabs?: boolean
      includeImaging?: boolean
    }
  ): Promise<any> {
    const resources: FHIRResource[] = []

    // Patient resource
    const fhirPatient = await this.patientToFHIR(patient)
    resources.push(fhirPatient)

    // Allergies
    if (options?.includeAllergies !== false && patient.allergies.length > 0) {
      for (const allergy of patient.allergies) {
        const fhirAllergy = await this.allergyToFHIR(allergy, patient.id)
        resources.push(fhirAllergy)
      }
    }

    // Conditions
    if (options?.includeConditions !== false && patient.conditions.length > 0) {
      for (const condition of patient.conditions) {
        if (condition.clinicalStatus === 'active') {
          const fhirCondition = await this.conditionToFHIR(condition, patient.id)
          resources.push(fhirCondition)
        }
      }
    }

    // Medications
    if (options?.includeMedications !== false && patient.medications.length > 0) {
      for (const medication of patient.medications) {
        if (medication.status === 'active') {
          const fhirMedication = await this.medicationToFHIR(medication, patient.id)
          resources.push(fhirMedication)
        }
      }
    }

    // Vital Signs
    if (options?.includeVitals !== false && patient.vitalSigns.length > 0) {
      const latestVitals = patient.vitalSigns[patient.vitalSigns.length - 1]
      const vitalObservations = await this.vitalSignsToFHIR(latestVitals, patient.id)
      resources.push(...vitalObservations)
    }

    // Lab Results
    if (options?.includeLabs !== false && patient.labResults.length > 0) {
      const recentLabs = patient.labResults.slice(-10) // Last 10 lab results
      for (const lab of recentLabs) {
        const labObservation = await this.labResultToFHIR(lab, patient.id)
        resources.push(labObservation)
      }
    }

    // Imaging Studies
    if (options?.includeImaging !== false && patient.imagingStudies.length > 0) {
      for (const study of patient.imagingStudies) {
        const imagingStudy = await this.imagingStudyToFHIR(study, patient.id)
        resources.push(imagingStudy)
      }
    }

    return this.createBundle(resources, 'collection')
  }

  /**
   * Validate FHIR resource
   */
  async validateResource(resource: FHIRResource): Promise<{
    valid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Basic validation
    if (!resource.resourceType) {
      errors.push('Missing resourceType')
    }

    // Resource-specific validation
    if (resource.resourceType === 'Patient') {
      const patient = resource as FHIRPatient
      if (!patient.name || patient.name.length === 0) {
        errors.push('Patient must have at least one name')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Get FHIR version
   */
  getFHIRVersion(): string {
    return this.fhirVersion
  }
}
