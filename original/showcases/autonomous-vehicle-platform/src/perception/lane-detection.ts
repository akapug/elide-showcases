/**
 * Lane Detection Module
 *
 * Lane line detection, fitting, and tracking
 * Supports Hough transform, polynomial fitting, and CNN-based methods
 * Provides lane curvature, heading, and drivable area estimation
 */

// @ts-ignore
import cv2 from 'python:cv2'
// @ts-ignore
import numpy from 'python:numpy'

import type {
  Lane,
  LaneDetection,
  DrivableArea,
  Vector2D,
  LaneDetectorConfig
} from '../types'

export interface LaneDetectionResult {
  lanes: LaneDetection
  drivableArea?: DrivableArea
  processingTime: number
}

export interface LaneLine {
  points: Vector2D[]
  polynomial: number[]
  curvature: number
  heading: number
  confidence: number
}

export class LaneDetector {
  private config: LaneDetectorConfig
  private previousLanes?: LaneDetection
  private laneHistory: LaneDetection[] = []

  constructor(config: LaneDetectorConfig) {
    this.config = {
      method: 'polyfit',
      degree: 2,
      roi: { top: 0.4, bottom: 1.0 },
      minLineLength: 50,
      maxLineGap: 10,
      ...config
    }
  }

  /**
   * Detect lanes in image
   */
  async detect(image: any): Promise<LaneDetectionResult> {
    const startTime = Date.now()

    let lanes: LaneDetection

    if (this.config.method === 'hough') {
      lanes = await this.detectWithHough(image)
    } else if (this.config.method === 'polyfit') {
      lanes = await this.detectWithPolyfit(image)
    } else if (this.config.method === 'sliding_window') {
      lanes = await this.detectWithSlidingWindow(image)
    } else if (this.config.method === 'cnn') {
      lanes = await this.detectWithCNN(image)
    } else {
      throw new Error(`Unknown lane detection method: ${this.config.method}`)
    }

    // Temporal filtering
    lanes = this.temporalFilter(lanes)

    // Estimate drivable area
    const drivableArea = this.estimateDrivableArea(lanes, image)

    const processingTime = Date.now() - startTime

    return { lanes, drivableArea, processingTime }
  }

  /**
   * Detect lanes using Hough transform
   */
  private async detectWithHough(image: any): Promise<LaneDetection> {
    // Convert to grayscale
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    // Apply Gaussian blur
    const blurred = cv2.GaussianBlur(gray, [5, 5], 1.5)

    // Edge detection
    const edges = cv2.Canny(blurred, 50, 150)

    // Apply ROI mask
    const masked = this.applyROI(edges, image.shape)

    // Hough line detection
    const lines = cv2.HoughLinesP(
      masked,
      1,                                    // rho
      numpy.pi / 180,                       // theta
      50,                                   // threshold
      null,
      this.config.minLineLength || 50,
      this.config.maxLineGap || 10
    )

    // Classify lines as left or right
    const { leftLines, rightLines } = this.classifyLines(lines, image.shape)

    // Fit lanes
    const left = leftLines.length > 0 ? this.fitLane(leftLines, 'left') : undefined
    const right = rightLines.length > 0 ? this.fitLane(rightLines, 'right') : undefined

    // Estimate lane width
    const laneWidth = this.estimateLaneWidth(left, right, image.shape[0])

    return {
      left,
      right,
      additional: [],
      laneWidth,
      confidence: this.computeConfidence(left, right),
      timestamp: Date.now()
    }
  }

  /**
   * Detect lanes using polynomial fitting
   */
  private async detectWithPolyfit(image: any): Promise<LaneDetection> {
    // Convert to grayscale
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    // Apply Gaussian blur
    const blurred = cv2.GaussianBlur(gray, [5, 5], 1.5)

    // Edge detection
    const edges = cv2.Canny(blurred, 50, 150)

    // Apply ROI mask
    const masked = this.applyROI(edges, image.shape)

    // Find lane pixels
    const { leftPixels, rightPixels } = this.findLanePixels(masked)

    // Fit polynomials
    const left = leftPixels.length > 0 ? this.fitPolynomial(leftPixels, 'left') : undefined
    const right = rightPixels.length > 0 ? this.fitPolynomial(rightPixels, 'right') : undefined

    // Estimate lane width
    const laneWidth = this.estimateLaneWidth(left, right, image.shape[0])

    return {
      left,
      right,
      additional: [],
      laneWidth,
      confidence: this.computeConfidence(left, right),
      timestamp: Date.now()
    }
  }

  /**
   * Detect lanes using sliding window
   */
  private async detectWithSlidingWindow(image: any): Promise<LaneDetection> {
    // Convert to grayscale
    const gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    // Apply Gaussian blur
    const blurred = cv2.GaussianBlur(gray, [5, 5], 1.5)

    // Edge detection
    const edges = cv2.Canny(blurred, 50, 150)

    // Apply ROI mask
    const masked = this.applyROI(edges, image.shape)

    // Histogram-based lane base detection
    const histogram = this.computeHistogram(masked)
    const { leftBase, rightBase } = this.findLaneBases(histogram)

    // Sliding window search
    const leftPixels = this.slidingWindowSearch(masked, leftBase, 'left')
    const rightPixels = this.slidingWindowSearch(masked, rightBase, 'right')

    // Fit polynomials
    const left = leftPixels.length > 0 ? this.fitPolynomial(leftPixels, 'left') : undefined
    const right = rightPixels.length > 0 ? this.fitPolynomial(rightPixels, 'right') : undefined

    // Estimate lane width
    const laneWidth = this.estimateLaneWidth(left, right, image.shape[0])

    return {
      left,
      right,
      additional: [],
      laneWidth,
      confidence: this.computeConfidence(left, right),
      timestamp: Date.now()
    }
  }

  /**
   * Detect lanes using CNN
   */
  private async detectWithCNN(image: any): Promise<LaneDetection> {
    // This would use a pre-trained CNN model for lane detection
    // For this showcase, we'll use a simplified approach
    return this.detectWithPolyfit(image)
  }

  /**
   * Apply region of interest mask
   */
  private applyROI(image: any, shape: number[]): any {
    const height = shape[0]
    const width = shape[1]

    const roi = this.config.roi || { top: 0.4, bottom: 1.0 }

    // Create mask
    const mask = numpy.zeros_like(image)

    // Define ROI polygon
    const vertices = [
      [
        [roi.left || 0, height * roi.bottom],
        [width * 0.45, height * roi.top],
        [width * 0.55, height * roi.top],
        [roi.right || width, height * roi.bottom]
      ]
    ]

    // Fill polygon
    cv2.fillPoly(mask, vertices, 255)

    // Apply mask
    const masked = cv2.bitwise_and(image, mask)

    return masked
  }

  /**
   * Classify lines as left or right lanes
   */
  private classifyLines(lines: any, shape: number[]): {
    leftLines: number[][]
    rightLines: number[][]
  } {
    const leftLines: number[][] = []
    const rightLines: number[][] = []

    if (!lines) return { leftLines, rightLines }

    const width = shape[1]
    const centerX = width / 2

    for (const line of lines) {
      const [x1, y1, x2, y2] = line[0]

      // Calculate slope
      const slope = (y2 - y1) / (x2 - x1)

      // Filter by slope (ignore horizontal lines)
      if (Math.abs(slope) < 0.5) continue

      // Classify by position and slope
      if (slope < 0 && x1 < centerX && x2 < centerX) {
        leftLines.push([x1, y1, x2, y2])
      } else if (slope > 0 && x1 > centerX && x2 > centerX) {
        rightLines.push([x1, y1, x2, y2])
      }
    }

    return { leftLines, rightLines }
  }

  /**
   * Fit lane from line segments
   */
  private fitLane(lines: number[][], side: 'left' | 'right'): Lane {
    // Extract points from lines
    const points: Vector2D[] = []

    for (const line of lines) {
      const [x1, y1, x2, y2] = line
      points.push({ x: x1, y: y1 })
      points.push({ x: x2, y: y2 })
    }

    // Fit polynomial
    return this.fitPolynomial(points, side)
  }

  /**
   * Find lane pixels in image
   */
  private findLanePixels(edges: any): {
    leftPixels: Vector2D[]
    rightPixels: Vector2D[]
  } {
    const leftPixels: Vector2D[] = []
    const rightPixels: Vector2D[] = []

    const height = edges.shape[0]
    const width = edges.shape[1]
    const centerX = width / 2

    // Find white pixels
    const pixels = cv2.findNonZero(edges)

    if (!pixels) return { leftPixels, rightPixels }

    for (const pixel of pixels) {
      const x = pixel[0][0]
      const y = pixel[0][1]

      if (x < centerX) {
        leftPixels.push({ x, y })
      } else {
        rightPixels.push({ x, y })
      }
    }

    return { leftPixels, rightPixels }
  }

  /**
   * Fit polynomial to lane points
   */
  private fitPolynomial(points: Vector2D[], side: 'left' | 'right'): Lane {
    const degree = this.config.degree || 2

    // Extract x and y coordinates
    const x = points.map(p => p.x)
    const y = points.map(p => p.y)

    // Fit polynomial: x = a*y^2 + b*y + c
    const coeffs = numpy.polyfit(y, x, degree)

    // Generate fitted points
    const fittedPoints: Vector2D[] = []
    const minY = Math.min(...y)
    const maxY = Math.max(...y)

    for (let py = minY; py <= maxY; py += 10) {
      let px = 0
      for (let i = 0; i < coeffs.length; i++) {
        px += coeffs[i] * Math.pow(py, degree - i)
      }
      fittedPoints.push({ x: px, y: py })
    }

    // Calculate curvature at bottom of image
    const y_eval = maxY
    const curvature = this.calculateCurvature(coeffs, y_eval)

    // Calculate heading
    const heading = this.calculateHeading(coeffs, y_eval)

    return {
      id: side === 'left' ? 0 : 1,
      type: 'dashed',
      color: 'white',
      confidence: Math.min(points.length / 100, 1.0),
      points: fittedPoints,
      polynomial: Array.from(coeffs),
      curvature,
      heading
    }
  }

  /**
   * Compute histogram for lane base detection
   */
  private computeHistogram(image: any): number[] {
    const height = image.shape[0]
    const width = image.shape[1]

    // Use bottom half of image
    const bottomHalf = image.slice([Math.floor(height / 2), height], [0, width])

    // Sum columns
    const histogram: number[] = []
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let y = 0; y < bottomHalf.shape[0]; y++) {
        sum += bottomHalf.at(y, x)
      }
      histogram.push(sum)
    }

    return histogram
  }

  /**
   * Find lane bases from histogram
   */
  private findLaneBases(histogram: number[]): { leftBase: number; rightBase: number } {
    const midpoint = Math.floor(histogram.length / 2)

    // Find peak in left half
    let leftBase = 0
    let leftMax = 0
    for (let x = 0; x < midpoint; x++) {
      if (histogram[x] > leftMax) {
        leftMax = histogram[x]
        leftBase = x
      }
    }

    // Find peak in right half
    let rightBase = midpoint
    let rightMax = 0
    for (let x = midpoint; x < histogram.length; x++) {
      if (histogram[x] > rightMax) {
        rightMax = histogram[x]
        rightBase = x
      }
    }

    return { leftBase, rightBase }
  }

  /**
   * Sliding window search for lane pixels
   */
  private slidingWindowSearch(
    image: any,
    base: number,
    side: 'left' | 'right'
  ): Vector2D[] {
    const pixels: Vector2D[] = []

    const nwindows = 9
    const margin = 100
    const minpix = 50

    const height = image.shape[0]
    const windowHeight = Math.floor(height / nwindows)

    // Get nonzero pixels
    const nonzero = cv2.findNonZero(image)
    if (!nonzero) return pixels

    let currentX = base

    // Step through windows
    for (let window = 0; window < nwindows; window++) {
      const winYLow = height - (window + 1) * windowHeight
      const winYHigh = height - window * windowHeight
      const winXLow = currentX - margin
      const winXHigh = currentX + margin

      // Find pixels within window
      const goodPixels: Vector2D[] = []

      for (const pixel of nonzero) {
        const x = pixel[0][0]
        const y = pixel[0][1]

        if (y >= winYLow && y < winYHigh && x >= winXLow && x < winXHigh) {
          goodPixels.push({ x, y })
        }
      }

      pixels.push(...goodPixels)

      // Recenter window if enough pixels found
      if (goodPixels.length > minpix) {
        const meanX = goodPixels.reduce((sum, p) => sum + p.x, 0) / goodPixels.length
        currentX = Math.floor(meanX)
      }
    }

    return pixels
  }

  /**
   * Calculate curvature from polynomial coefficients
   */
  private calculateCurvature(coeffs: any, y: number): number {
    const degree = coeffs.length - 1

    if (degree === 2) {
      const [a, b, c] = coeffs

      // Curvature formula: R = (1 + (2*a*y + b)^2)^(3/2) / |2*a|
      const dydx = 2 * a * y + b
      const d2ydx2 = 2 * a

      const curvature = Math.pow(1 + dydc ** 2, 1.5) / Math.abs(d2ydx2)

      return curvature
    }

    return Infinity
  }

  /**
   * Calculate heading from polynomial coefficients
   */
  private calculateHeading(coeffs: any, y: number): number {
    const degree = coeffs.length - 1

    if (degree === 2) {
      const [a, b, c] = coeffs

      // Heading is the angle of the tangent
      const dxdy = 2 * a * y + b
      const heading = Math.atan(dxdy)

      return heading
    }

    return 0
  }

  /**
   * Estimate lane width
   */
  private estimateLaneWidth(
    left: Lane | undefined,
    right: Lane | undefined,
    imageHeight: number
  ): number {
    if (!left || !right) return 3.7 // Default lane width in meters

    // Calculate width at bottom of image
    const y = imageHeight - 1

    let leftX = 0
    let rightX = 0

    if (left.polynomial.length === 3) {
      const [a, b, c] = left.polynomial
      leftX = a * y * y + b * y + c
    }

    if (right.polynomial.length === 3) {
      const [a, b, c] = right.polynomial
      rightX = a * y * y + b * y + c
    }

    // Convert pixel width to meters (assume 3.7m standard lane)
    const pixelWidth = rightX - leftX
    const metersPerPixel = 3.7 / pixelWidth

    return 3.7 // Return standard width for now
  }

  /**
   * Compute detection confidence
   */
  private computeConfidence(left: Lane | undefined, right: Lane | undefined): number {
    let confidence = 0

    if (left) confidence += left.confidence * 0.5
    if (right) confidence += right.confidence * 0.5

    return confidence
  }

  /**
   * Temporal filtering using previous detections
   */
  private temporalFilter(lanes: LaneDetection): LaneDetection {
    if (!this.previousLanes) {
      this.previousLanes = lanes
      return lanes
    }

    // Smooth lane positions
    const alpha = 0.7 // Smoothing factor

    if (lanes.left && this.previousLanes.left) {
      lanes.left.polynomial = this.smoothPolynomial(
        lanes.left.polynomial,
        this.previousLanes.left.polynomial,
        alpha
      )
    }

    if (lanes.right && this.previousLanes.right) {
      lanes.right.polynomial = this.smoothPolynomial(
        lanes.right.polynomial,
        this.previousLanes.right.polynomial,
        alpha
      )
    }

    this.previousLanes = lanes

    // Add to history
    this.laneHistory.push(lanes)
    if (this.laneHistory.length > 10) {
      this.laneHistory.shift()
    }

    return lanes
  }

  /**
   * Smooth polynomial coefficients
   */
  private smoothPolynomial(current: number[], previous: number[], alpha: number): number[] {
    const smoothed: number[] = []

    for (let i = 0; i < current.length; i++) {
      smoothed.push(alpha * current[i] + (1 - alpha) * previous[i])
    }

    return smoothed
  }

  /**
   * Estimate drivable area
   */
  private estimateDrivableArea(lanes: LaneDetection, image: any): DrivableArea | undefined {
    if (!lanes.left || !lanes.right) return undefined

    const polygon: Vector2D[] = []

    // Add left lane points (top to bottom)
    polygon.push(...lanes.left.points)

    // Add right lane points (bottom to top)
    polygon.push(...[...lanes.right.points].reverse())

    return {
      polygon,
      confidence: lanes.confidence,
      timestamp: Date.now()
    }
  }

  /**
   * Visualize lanes on image
   */
  async visualize(image: any, lanes: LaneDetection): Promise<any> {
    const output = image.copy()

    // Draw left lane
    if (lanes.left) {
      this.drawLane(output, lanes.left, [255, 0, 0])
    }

    // Draw right lane
    if (lanes.right) {
      this.drawLane(output, lanes.right, [0, 0, 255])
    }

    // Draw drivable area
    const drivableArea = this.estimateDrivableArea(lanes, image)
    if (drivableArea) {
      this.drawDrivableArea(output, drivableArea)
    }

    // Draw lane info
    const info = [
      `Lane Width: ${lanes.laneWidth.toFixed(2)}m`,
      `Confidence: ${(lanes.confidence * 100).toFixed(0)}%`
    ]

    if (lanes.left) {
      info.push(`Left Curvature: ${lanes.left.curvature.toFixed(0)}m`)
    }

    if (lanes.right) {
      info.push(`Right Curvature: ${lanes.right.curvature.toFixed(0)}m`)
    }

    for (let i = 0; i < info.length; i++) {
      cv2.putText(
        output,
        info[i],
        [10, 30 + i * 30],
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        [255, 255, 255],
        2
      )
    }

    return output
  }

  /**
   * Draw lane on image
   */
  private drawLane(image: any, lane: Lane, color: [number, number, number]): void {
    const points = lane.points.map(p => [Math.floor(p.x), Math.floor(p.y)])

    for (let i = 0; i < points.length - 1; i++) {
      cv2.line(image, points[i], points[i + 1], color, 3)
    }
  }

  /**
   * Draw drivable area
   */
  private drawDrivableArea(image: any, area: DrivableArea): void {
    const points = area.polygon.map(p => [Math.floor(p.x), Math.floor(p.y)])

    // Create overlay
    const overlay = image.copy()
    cv2.fillPoly(overlay, [points], [0, 255, 0])

    // Blend with original
    cv2.addWeighted(image, 0.7, overlay, 0.3, 0, image)
  }

  /**
   * Get lane departure warning
   */
  getDepartureWarning(lanes: LaneDetection, vehiclePosition: Vector2D): {
    warning: boolean
    side: 'left' | 'right' | null
    distance: number
  } {
    if (!lanes.left || !lanes.right) {
      return { warning: false, side: null, distance: 0 }
    }

    const laneCenter = lanes.laneWidth / 2
    const offsetFromCenter = vehiclePosition.x - laneCenter

    const threshold = lanes.laneWidth * 0.3

    if (offsetFromCenter < -threshold) {
      return {
        warning: true,
        side: 'left',
        distance: Math.abs(offsetFromCenter)
      }
    } else if (offsetFromCenter > threshold) {
      return {
        warning: true,
        side: 'right',
        distance: Math.abs(offsetFromCenter)
      }
    }

    return { warning: false, side: null, distance: Math.abs(offsetFromCenter) }
  }

  /**
   * Reset detector state
   */
  reset(): void {
    this.previousLanes = undefined
    this.laneHistory = []
  }
}

export default LaneDetector
