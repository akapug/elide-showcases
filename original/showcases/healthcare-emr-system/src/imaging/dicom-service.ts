/**
 * DICOM Service
 *
 * Medical imaging service using pydicom for DICOM file processing,
 * metadata extraction, and PACS integration.
 */

import { randomUUID } from 'crypto'
import type {
  ImagingStudy,
  DICOMSeries,
  DICOMInstance,
  DICOMMetadata,
  ImagingModality,
  ImagingReport,
  Provider
} from '../types'

// @ts-ignore - Python DICOM library via Elide
import pydicom from 'python:pydicom'
// @ts-ignore
import numpy from 'python:numpy'
// @ts-ignore
import PIL from 'python:PIL'
// @ts-ignore
import os from 'python:os'

/**
 * DICOM Service
 *
 * Handles medical imaging workflows:
 * - DICOM file reading and writing
 * - Metadata extraction
 * - Image processing
 * - Study/Series/Instance management
 * - PACS integration
 */
export class DICOMService {
  private studies: Map<string, ImagingStudy> = new Map()
  private studiesByUID: Map<string, string> = new Map()

  constructor() {
    this.initializeService()
  }

  private initializeService(): void {
    console.log('DICOM Service initialized')
  }

  // ============================================================================
  // DICOM File Operations
  // ============================================================================

  /**
   * Read DICOM file and extract metadata
   */
  async readDICOM(filepath: string): Promise<{
    dataset: any
    metadata: DICOMMetadata
    pixelArray?: any
  }> {
    try {
      // Read DICOM file
      const dataset = pydicom.dcmread(filepath)

      // Extract metadata
      const metadata = this.extractMetadata(dataset)

      // Get pixel data if available
      let pixelArray
      try {
        if (dataset.pixel_array) {
          pixelArray = dataset.pixel_array
        }
      } catch (e) {
        console.warn('Could not load pixel data:', e)
      }

      console.log(`DICOM file read: ${filepath}`)
      return { dataset, metadata, pixelArray }
    } catch (error) {
      throw new Error(`Failed to read DICOM file: ${error}`)
    }
  }

  /**
   * Write DICOM file
   */
  async writeDICOM(dataset: any, filepath: string): Promise<void> {
    try {
      pydicom.dcmwrite(filepath, dataset)
      console.log(`DICOM file written: ${filepath}`)
    } catch (error) {
      throw new Error(`Failed to write DICOM file: ${error}`)
    }
  }

  /**
   * Extract comprehensive metadata from DICOM dataset
   */
  extractMetadata(dataset: any): DICOMMetadata {
    const metadata: DICOMMetadata = {}

    // Patient information
    try {
      if (dataset.PatientName) metadata.patientName = String(dataset.PatientName)
      if (dataset.PatientID) metadata.patientID = String(dataset.PatientID)
      if (dataset.PatientBirthDate) metadata.patientBirthDate = String(dataset.PatientBirthDate)
      if (dataset.PatientSex) metadata.patientSex = String(dataset.PatientSex)
    } catch (e) {
      console.warn('Error extracting patient info:', e)
    }

    // Study information
    try {
      if (dataset.StudyDate) metadata.studyDate = String(dataset.StudyDate)
      if (dataset.StudyTime) metadata.studyTime = String(dataset.StudyTime)
      if (dataset.StudyDescription) metadata.studyDescription = String(dataset.StudyDescription)
    } catch (e) {
      console.warn('Error extracting study info:', e)
    }

    // Series information
    try {
      if (dataset.SeriesDescription) metadata.seriesDescription = String(dataset.SeriesDescription)
      if (dataset.Modality) metadata.modality = String(dataset.Modality)
    } catch (e) {
      console.warn('Error extracting series info:', e)
    }

    // Equipment information
    try {
      if (dataset.Manufacturer) metadata.manufacturer = String(dataset.Manufacturer)
      if (dataset.ManufacturerModelName) metadata.manufacturerModelName = String(dataset.ManufacturerModelName)
      if (dataset.InstitutionName) metadata.institutionName = String(dataset.InstitutionName)
    } catch (e) {
      console.warn('Error extracting equipment info:', e)
    }

    // Image parameters
    try {
      if (dataset.Rows) metadata.rows = parseInt(dataset.Rows)
      if (dataset.Columns) metadata.columns = parseInt(dataset.Columns)
      if (dataset.BitsAllocated) metadata.bitsAllocated = parseInt(dataset.BitsAllocated)
      if (dataset.BitsStored) metadata.bitsStored = parseInt(dataset.BitsStored)
      if (dataset.SamplesPerPixel) metadata.samplesPerPixel = parseInt(dataset.SamplesPerPixel)
      if (dataset.PhotometricInterpretation) {
        metadata.photometricInterpretation = String(dataset.PhotometricInterpretation)
      }
    } catch (e) {
      console.warn('Error extracting image parameters:', e)
    }

    // Spatial information
    try {
      if (dataset.PixelSpacing) {
        metadata.pixelSpacing = [parseFloat(dataset.PixelSpacing[0]), parseFloat(dataset.PixelSpacing[1])]
      }
      if (dataset.SliceThickness) metadata.sliceThickness = parseFloat(dataset.SliceThickness)
      if (dataset.SliceLocation) metadata.sliceLocation = parseFloat(dataset.SliceLocation)
      if (dataset.ImagePositionPatient) {
        metadata.imagePositionPatient = [
          parseFloat(dataset.ImagePositionPatient[0]),
          parseFloat(dataset.ImagePositionPatient[1]),
          parseFloat(dataset.ImagePositionPatient[2])
        ]
      }
      if (dataset.ImageOrientationPatient) {
        metadata.imageOrientationPatient = Array.from({ length: 6 }, (_, i) =>
          parseFloat(dataset.ImageOrientationPatient[i])
        )
      }
    } catch (e) {
      console.warn('Error extracting spatial info:', e)
    }

    // Windowing
    try {
      if (dataset.WindowCenter) {
        metadata.windowCenter = parseFloat(
          Array.isArray(dataset.WindowCenter) ? dataset.WindowCenter[0] : dataset.WindowCenter
        )
      }
      if (dataset.WindowWidth) {
        metadata.windowWidth = parseFloat(
          Array.isArray(dataset.WindowWidth) ? dataset.WindowWidth[0] : dataset.WindowWidth
        )
      }
    } catch (e) {
      console.warn('Error extracting windowing info:', e)
    }

    return metadata
  }

  // ============================================================================
  // Study Management
  // ============================================================================

  /**
   * Create a new imaging study
   */
  async createStudy(study: Omit<ImagingStudy, 'id'>): Promise<ImagingStudy> {
    const newStudy: ImagingStudy = {
      id: randomUUID(),
      ...study
    }

    this.studies.set(newStudy.id, newStudy)
    this.studiesByUID.set(newStudy.studyInstanceUID, newStudy.id)

    console.log(`Imaging study created: ${newStudy.id}`)
    return newStudy
  }

  /**
   * Get study by ID
   */
  async getStudy(id: string): Promise<ImagingStudy | null> {
    return this.studies.get(id) || null
  }

  /**
   * Get study by Study Instance UID
   */
  async getStudyByUID(studyInstanceUID: string): Promise<ImagingStudy | null> {
    const id = this.studiesByUID.get(studyInstanceUID)
    if (!id) return null
    return this.getStudy(id)
  }

  /**
   * Get all studies for a patient
   */
  async getPatientStudies(patientId: string): Promise<ImagingStudy[]> {
    return Array.from(this.studies.values())
      .filter(study => study.patientId === patientId)
      .sort((a, b) => {
        const dateA = a.started?.getTime() || 0
        const dateB = b.started?.getTime() || 0
        return dateB - dateA
      })
  }

  /**
   * Update study
   */
  async updateStudy(
    id: string,
    updates: Partial<ImagingStudy>
  ): Promise<ImagingStudy | null> {
    const study = await this.getStudy(id)
    if (!study) return null

    const updatedStudy = {
      ...study,
      ...updates
    }

    this.studies.set(id, updatedStudy)
    return updatedStudy
  }

  /**
   * Load study from DICOM directory
   */
  async loadStudyFromDirectory(
    directoryPath: string,
    patientId: string
  ): Promise<ImagingStudy> {
    const files: string[] = []

    // Get all DICOM files in directory
    for (const item of os.listdir(directoryPath)) {
      const filepath = os.path.join(directoryPath, item)
      if (os.path.isfile(filepath) && (item.endsWith('.dcm') || item.endsWith('.dicom'))) {
        files.push(filepath)
      }
    }

    if (files.length === 0) {
      throw new Error('No DICOM files found in directory')
    }

    // Read first file to get study information
    const firstFile = pydicom.dcmread(files[0])

    const studyInstanceUID = String(firstFile.StudyInstanceUID)
    const studyDescription = firstFile.StudyDescription ? String(firstFile.StudyDescription) : ''
    const modality = String(firstFile.Modality) as ImagingModality

    // Organize files by series
    const seriesMap: Map<string, any[]> = new Map()

    for (const filepath of files) {
      try {
        const dataset = pydicom.dcmread(filepath)
        const seriesInstanceUID = String(dataset.SeriesInstanceUID)

        if (!seriesMap.has(seriesInstanceUID)) {
          seriesMap.set(seriesInstanceUID, [])
        }

        seriesMap.get(seriesInstanceUID)!.push({ dataset, filepath })
      } catch (e) {
        console.warn(`Failed to read ${filepath}:`, e)
      }
    }

    // Create series
    const series: DICOMSeries[] = []
    for (const [seriesInstanceUID, seriesFiles] of seriesMap.entries()) {
      const firstDataset = seriesFiles[0].dataset

      const instances: DICOMInstance[] = seriesFiles.map((item, index) => {
        const dataset = item.dataset
        const filepath = item.filepath

        return {
          id: randomUUID(),
          sopInstanceUID: String(dataset.SOPInstanceUID),
          sopClassUID: String(dataset.SOPClassUID),
          number: dataset.InstanceNumber ? parseInt(dataset.InstanceNumber) : index + 1,
          title: dataset.ImageComments ? String(dataset.ImageComments) : undefined,
          filePath: filepath,
          fileSize: os.path.getsize(filepath),
          transferSyntaxUID: String(dataset.file_meta.TransferSyntaxUID),
          metadata: this.extractMetadata(dataset)
        }
      })

      series.push({
        id: randomUUID(),
        seriesInstanceUID,
        number: firstDataset.SeriesNumber ? parseInt(firstDataset.SeriesNumber) : series.length + 1,
        modality: String(firstDataset.Modality) as ImagingModality,
        description: firstDataset.SeriesDescription ? String(firstDataset.SeriesDescription) : '',
        numberOfInstances: instances.length,
        bodyPart: firstDataset.BodyPartExamined ? String(firstDataset.BodyPartExamined) : '',
        laterality: firstDataset.Laterality ? String(firstDataset.Laterality).toLowerCase() as any : undefined,
        started: firstDataset.SeriesDate ? new Date(String(firstDataset.SeriesDate)) : undefined,
        instances
      })
    }

    // Create study
    const study = await this.createStudy({
      studyInstanceUID,
      patientId,
      status: 'available',
      modality,
      description: studyDescription,
      numberOfSeries: series.length,
      numberOfInstances: files.length,
      started: firstFile.StudyDate ? new Date(String(firstFile.StudyDate)) : undefined,
      series
    })

    console.log(`Study loaded from directory: ${series.length} series, ${files.length} instances`)
    return study
  }

  // ============================================================================
  // Series Management
  // ============================================================================

  /**
   * Get series from study
   */
  async getSeries(studyId: string, seriesId: string): Promise<DICOMSeries | null> {
    const study = await this.getStudy(studyId)
    if (!study) return null

    return study.series.find(s => s.id === seriesId) || null
  }

  /**
   * Get all series in study
   */
  async getAllSeries(studyId: string): Promise<DICOMSeries[]> {
    const study = await this.getStudy(studyId)
    if (!study) return []
    return study.series
  }

  // ============================================================================
  // Instance Management
  // ============================================================================

  /**
   * Get instance
   */
  async getInstance(
    studyId: string,
    seriesId: string,
    instanceId: string
  ): Promise<DICOMInstance | null> {
    const series = await this.getSeries(studyId, seriesId)
    if (!series) return null

    return series.instances.find(i => i.id === instanceId) || null
  }

  /**
   * Get all instances in series
   */
  async getInstances(studyId: string, seriesId: string): Promise<DICOMInstance[]> {
    const series = await this.getSeries(studyId, seriesId)
    if (!series) return []
    return series.instances
  }

  /**
   * Get instance pixel data
   */
  async getPixelData(instance: DICOMInstance): Promise<any> {
    const dataset = pydicom.dcmread(instance.filePath)
    return dataset.pixel_array
  }

  // ============================================================================
  // Image Processing
  // ============================================================================

  /**
   * Apply windowing to image
   */
  async applyWindowing(
    pixelArray: any,
    windowCenter: number,
    windowWidth: number
  ): Promise<any> {
    const windowMin = windowCenter - windowWidth / 2
    const windowMax = windowCenter + windowWidth / 2

    // Clip values to window range
    const clipped = numpy.clip(pixelArray, windowMin, windowMax)

    // Normalize to 0-255 range
    const normalized = ((clipped - windowMin) / windowWidth * 255).astype(numpy.uint8)

    return normalized
  }

  /**
   * Convert DICOM image to PNG
   */
  async convertToPNG(
    instance: DICOMInstance,
    outputPath: string,
    windowCenter?: number,
    windowWidth?: number
  ): Promise<void> {
    const dataset = pydicom.dcmread(instance.filePath)
    let pixelArray = dataset.pixel_array

    // Apply windowing if specified
    if (windowCenter !== undefined && windowWidth !== undefined) {
      pixelArray = await this.applyWindowing(pixelArray, windowCenter, windowWidth)
    } else if (instance.metadata?.windowCenter && instance.metadata?.windowWidth) {
      // Use default windowing from metadata
      pixelArray = await this.applyWindowing(
        pixelArray,
        instance.metadata.windowCenter,
        instance.metadata.windowWidth
      )
    } else {
      // Auto-scale to 8-bit
      const pixelMin = numpy.min(pixelArray)
      const pixelMax = numpy.max(pixelArray)
      pixelArray = ((pixelArray - pixelMin) / (pixelMax - pixelMin) * 255).astype(numpy.uint8)
    }

    // Convert to PIL Image and save
    const Image = PIL.Image
    const image = Image.fromarray(pixelArray)
    image.save(outputPath)

    console.log(`Image converted to PNG: ${outputPath}`)
  }

  /**
   * Resize DICOM image
   */
  async resizeImage(
    pixelArray: any,
    width: number,
    height: number
  ): Promise<any> {
    const Image = PIL.Image

    // Convert to PIL Image
    const image = Image.fromarray(pixelArray)

    // Resize
    const resized = image.resize([width, height], Image.LANCZOS)

    // Convert back to array
    return numpy.array(resized)
  }

  /**
   * Calculate image statistics
   */
  async getImageStatistics(pixelArray: any): Promise<{
    min: number
    max: number
    mean: number
    std: number
    median: number
  }> {
    return {
      min: parseFloat(numpy.min(pixelArray)),
      max: parseFloat(numpy.max(pixelArray)),
      mean: parseFloat(numpy.mean(pixelArray)),
      std: parseFloat(numpy.std(pixelArray)),
      median: parseFloat(numpy.median(pixelArray))
    }
  }

  // ============================================================================
  // Radiology Reports
  // ============================================================================

  /**
   * Add radiology report to study
   */
  async addReport(
    studyId: string,
    report: Omit<ImagingReport, 'id' | 'studyId'>
  ): Promise<ImagingReport | null> {
    const study = await this.getStudy(studyId)
    if (!study) return null

    const newReport: ImagingReport = {
      id: randomUUID(),
      studyId,
      ...report
    }

    study.report = newReport

    console.log(`Report added to study ${studyId}`)
    return newReport
  }

  /**
   * Get report for study
   */
  async getReport(studyId: string): Promise<ImagingReport | null> {
    const study = await this.getStudy(studyId)
    if (!study) return null
    return study.report || null
  }

  /**
   * Update report
   */
  async updateReport(
    studyId: string,
    updates: Partial<ImagingReport>
  ): Promise<ImagingReport | null> {
    const study = await this.getStudy(studyId)
    if (!study || !study.report) return null

    study.report = {
      ...study.report,
      ...updates
    }

    return study.report
  }

  // ============================================================================
  // PACS Integration
  // ============================================================================

  /**
   * Query PACS for studies (simulated)
   */
  async queryPACS(criteria: {
    patientId?: string
    studyDate?: string
    modality?: ImagingModality
    accessionNumber?: string
  }): Promise<ImagingStudy[]> {
    // In production, this would use DICOM C-FIND
    const results = Array.from(this.studies.values()).filter(study => {
      if (criteria.patientId && study.patientId !== criteria.patientId) return false
      if (criteria.modality && study.modality !== criteria.modality) return false
      if (criteria.accessionNumber && study.accessionNumber !== criteria.accessionNumber) return false
      return true
    })

    console.log(`PACS query returned ${results.length} studies`)
    return results
  }

  /**
   * Send study to PACS (simulated)
   */
  async sendToPACS(studyId: string, pacsUrl: string): Promise<boolean> {
    const study = await this.getStudy(studyId)
    if (!study) return false

    // In production, this would use DICOM C-STORE
    console.log(`Study ${studyId} would be sent to PACS: ${pacsUrl}`)
    return true
  }

  /**
   * Retrieve study from PACS (simulated)
   */
  async retrieveFromPACS(
    studyInstanceUID: string,
    pacsUrl: string
  ): Promise<ImagingStudy | null> {
    // In production, this would use DICOM C-MOVE or WADO-RS
    const study = await this.getStudyByUID(studyInstanceUID)
    if (study) {
      console.log(`Study retrieved from PACS: ${pacsUrl}`)
      return study
    }
    return null
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Anonymize DICOM file (remove patient identifiers)
   */
  async anonymizeDICOM(inputPath: string, outputPath: string): Promise<void> {
    const dataset = pydicom.dcmread(inputPath)

    // Remove patient identifiers
    const identifierTags = [
      'PatientName',
      'PatientID',
      'PatientBirthDate',
      'PatientSex',
      'PatientAge',
      'PatientAddress',
      'PatientTelephoneNumbers',
      'InstitutionName',
      'InstitutionAddress',
      'ReferringPhysicianName',
      'PerformingPhysicianName'
    ]

    identifierTags.forEach(tag => {
      try {
        if (dataset[tag]) {
          delete dataset[tag]
        }
      } catch (e) {
        // Tag doesn't exist, continue
      }
    })

    // Replace with anonymous values
    dataset.PatientName = 'ANONYMOUS'
    dataset.PatientID = 'ANON' + randomUUID().substring(0, 8)

    // Write anonymized file
    pydicom.dcmwrite(outputPath, dataset)
    console.log(`DICOM file anonymized: ${outputPath}`)
  }

  /**
   * Validate DICOM file
   */
  async validateDICOM(filepath: string): Promise<{
    valid: boolean
    errors: string[]
    warnings: string[]
  }> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const dataset = pydicom.dcmread(filepath)

      // Check required tags
      const requiredTags = [
        'SOPClassUID',
        'SOPInstanceUID',
        'StudyInstanceUID',
        'SeriesInstanceUID',
        'Modality'
      ]

      requiredTags.forEach(tag => {
        if (!dataset[tag]) {
          errors.push(`Missing required tag: ${tag}`)
        }
      })

      // Check recommended tags
      const recommendedTags = [
        'PatientName',
        'PatientID',
        'StudyDate',
        'SeriesNumber',
        'InstanceNumber'
      ]

      recommendedTags.forEach(tag => {
        if (!dataset[tag]) {
          warnings.push(`Missing recommended tag: ${tag}`)
        }
      })

      // Check pixel data
      try {
        if (dataset.pixel_array) {
          const pixelArray = dataset.pixel_array
          const shape = pixelArray.shape

          if (dataset.Rows && shape[0] !== parseInt(dataset.Rows)) {
            warnings.push('Pixel array rows do not match Rows tag')
          }
          if (dataset.Columns && shape[1] !== parseInt(dataset.Columns)) {
            warnings.push('Pixel array columns do not match Columns tag')
          }
        }
      } catch (e) {
        warnings.push('Could not validate pixel data')
      }

    } catch (error) {
      errors.push(`Failed to read DICOM file: ${error}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<{
    totalStudies: number
    totalSeries: number
    totalInstances: number
    modalityDistribution: Record<string, number>
    avgInstancesPerStudy: number
  }> {
    const studies = Array.from(this.studies.values())

    const totalStudies = studies.length
    const totalSeries = studies.reduce((sum, s) => sum + s.numberOfSeries, 0)
    const totalInstances = studies.reduce((sum, s) => sum + s.numberOfInstances, 0)

    const modalityDistribution: Record<string, number> = {}
    studies.forEach(study => {
      modalityDistribution[study.modality] = (modalityDistribution[study.modality] || 0) + 1
    })

    const avgInstancesPerStudy = totalStudies > 0 ? totalInstances / totalStudies : 0

    return {
      totalStudies,
      totalSeries,
      totalInstances,
      modalityDistribution,
      avgInstancesPerStudy: Math.round(avgInstancesPerStudy * 10) / 10
    }
  }
}
