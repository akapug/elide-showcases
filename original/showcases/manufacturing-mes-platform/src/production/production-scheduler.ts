/**
 * Production Scheduler for Manufacturing MES
 *
 * Advanced production scheduling with constraint-based optimization,
 * finite capacity planning, and real-time schedule adjustments.
 */

import type {
  ProductionJob,
  ProductionSchedule,
  Equipment,
  EquipmentAllocation,
  SchedulingConstraint,
  JobStatus,
  JobPriority,
  EquipmentStatus,
  MaterialRequirement,
  MaterialStatus,
  Shift,
  ConstraintType,
  MaintenanceWindow
} from '../types.js';

// ============================================================================
// Scheduling Algorithm Configuration
// ============================================================================

export interface SchedulerConfig {
  algorithm: SchedulingAlgorithm;
  optimizationObjective: OptimizationObjective;
  maxIterations: number;
  convergenceThreshold: number;
  considerSetupTime: boolean;
  allowSplitJobs: boolean;
  bufferTimeMinutes: number;
  maintenanceWindowRespect: boolean;
}

export enum SchedulingAlgorithm {
  FIFO = 'FIFO',                          // First In First Out
  SPT = 'SPT',                            // Shortest Processing Time
  EDD = 'EDD',                            // Earliest Due Date
  CRITICAL_RATIO = 'CRITICAL_RATIO',      // Critical Ratio
  GENETIC_ALGORITHM = 'GENETIC_ALGORITHM', // GA optimization
  SIMULATED_ANNEALING = 'SIMULATED_ANNEALING',
  CONSTRAINT_PROGRAMMING = 'CONSTRAINT_PROGRAMMING'
}

export enum OptimizationObjective {
  MINIMIZE_MAKESPAN = 'MINIMIZE_MAKESPAN',
  MINIMIZE_TARDINESS = 'MINIMIZE_TARDINESS',
  MAXIMIZE_UTILIZATION = 'MAXIMIZE_UTILIZATION',
  MINIMIZE_WIP = 'MINIMIZE_WIP',
  MINIMIZE_CHANGEOVERS = 'MINIMIZE_CHANGEOVERS',
  BALANCED = 'BALANCED'
}

// ============================================================================
// Production Scheduler Class
// ============================================================================

export class ProductionScheduler {
  private config: SchedulerConfig;
  private jobs: ProductionJob[] = [];
  private equipment: Equipment[] = [];
  private constraints: SchedulingConstraint[] = [];
  private currentSchedule?: ProductionSchedule;

  constructor(config: SchedulerConfig) {
    this.config = config;
  }

  /**
   * Generate optimized production schedule
   */
  async generateSchedule(
    jobs: ProductionJob[],
    equipment: Equipment[],
    shift: Shift,
    date: Date,
    constraints: SchedulingConstraint[] = []
  ): Promise<ProductionSchedule> {
    console.log(`Generating schedule for ${jobs.length} jobs on ${date.toISOString()}`);

    this.jobs = jobs.filter(j => j.status === JobStatus.SCHEDULED || j.status === JobStatus.READY);
    this.equipment = equipment.filter(e => e.status !== EquipmentStatus.OFFLINE);
    this.constraints = constraints;

    // Validate inputs
    this.validateSchedulingInputs();

    // Apply scheduling algorithm
    let schedule: ProductionSchedule;
    switch (this.config.algorithm) {
      case SchedulingAlgorithm.FIFO:
        schedule = this.scheduleFIFO(shift, date);
        break;
      case SchedulingAlgorithm.SPT:
        schedule = this.scheduleSPT(shift, date);
        break;
      case SchedulingAlgorithm.EDD:
        schedule = this.scheduleEDD(shift, date);
        break;
      case SchedulingAlgorithm.CRITICAL_RATIO:
        schedule = this.scheduleCriticalRatio(shift, date);
        break;
      case SchedulingAlgorithm.GENETIC_ALGORITHM:
        schedule = await this.scheduleGeneticAlgorithm(shift, date);
        break;
      case SchedulingAlgorithm.SIMULATED_ANNEALING:
        schedule = await this.scheduleSimulatedAnnealing(shift, date);
        break;
      case SchedulingAlgorithm.CONSTRAINT_PROGRAMMING:
        schedule = await this.scheduleConstraintProgramming(shift, date);
        break;
      default:
        schedule = this.scheduleFIFO(shift, date);
    }

    // Calculate optimization score
    schedule.optimizationScore = this.calculateOptimizationScore(schedule);

    this.currentSchedule = schedule;
    return schedule;
  }

  /**
   * FIFO Scheduling - First In First Out
   */
  private scheduleFIFO(shift: Shift, date: Date): ProductionSchedule {
    const allocations: EquipmentAllocation[] = [];
    const scheduledJobs: ProductionJob[] = [];

    // Sort jobs by creation time (assuming workOrderId contains timestamp)
    const sortedJobs = [...this.jobs].sort((a, b) =>
      a.workOrderId.localeCompare(b.workOrderId)
    );

    const equipmentAvailability = new Map<string, Date>();
    this.equipment.forEach(eq => {
      equipmentAvailability.set(eq.id, this.getShiftStartTime(shift, date));
    });

    for (const job of sortedJobs) {
      const allocated = this.allocateJobToEquipment(
        job,
        equipmentAvailability,
        shift,
        date
      );

      if (allocated) {
        scheduledJobs.push(allocated.job);
        allocations.push(allocated.allocation);
      }
    }

    return {
      id: this.generateScheduleId(),
      plantId: 'PLANT-001',
      shift,
      date,
      jobs: scheduledJobs,
      equipmentAllocations: allocations,
      constraints: this.constraints,
      optimizationScore: 0
    };
  }

  /**
   * SPT Scheduling - Shortest Processing Time
   */
  private scheduleSPT(shift: Shift, date: Date): ProductionSchedule {
    const allocations: EquipmentAllocation[] = [];
    const scheduledJobs: ProductionJob[] = [];

    // Sort jobs by processing time (cycleTime * quantity)
    const sortedJobs = [...this.jobs].sort((a, b) =>
      (a.cycleTime * a.quantity) - (b.cycleTime * b.quantity)
    );

    const equipmentAvailability = new Map<string, Date>();
    this.equipment.forEach(eq => {
      equipmentAvailability.set(eq.id, this.getShiftStartTime(shift, date));
    });

    for (const job of sortedJobs) {
      const allocated = this.allocateJobToEquipment(
        job,
        equipmentAvailability,
        shift,
        date
      );

      if (allocated) {
        scheduledJobs.push(allocated.job);
        allocations.push(allocated.allocation);
      }
    }

    return {
      id: this.generateScheduleId(),
      plantId: 'PLANT-001',
      shift,
      date,
      jobs: scheduledJobs,
      equipmentAllocations: allocations,
      constraints: this.constraints,
      optimizationScore: 0
    };
  }

  /**
   * EDD Scheduling - Earliest Due Date
   */
  private scheduleEDD(shift: Shift, date: Date): ProductionSchedule {
    const allocations: EquipmentAllocation[] = [];
    const scheduledJobs: ProductionJob[] = [];

    // Sort jobs by due date (scheduledEnd)
    const sortedJobs = [...this.jobs].sort((a, b) =>
      a.scheduledEnd.getTime() - b.scheduledEnd.getTime()
    );

    const equipmentAvailability = new Map<string, Date>();
    this.equipment.forEach(eq => {
      equipmentAvailability.set(eq.id, this.getShiftStartTime(shift, date));
    });

    for (const job of sortedJobs) {
      const allocated = this.allocateJobToEquipment(
        job,
        equipmentAvailability,
        shift,
        date
      );

      if (allocated) {
        scheduledJobs.push(allocated.job);
        allocations.push(allocated.allocation);
      }
    }

    return {
      id: this.generateScheduleId(),
      plantId: 'PLANT-001',
      shift,
      date,
      jobs: scheduledJobs,
      equipmentAllocations: allocations,
      constraints: this.constraints,
      optimizationScore: 0
    };
  }

  /**
   * Critical Ratio Scheduling
   */
  private scheduleCriticalRatio(shift: Shift, date: Date): ProductionSchedule {
    const allocations: EquipmentAllocation[] = [];
    const scheduledJobs: ProductionJob[] = [];

    const equipmentAvailability = new Map<string, Date>();
    this.equipment.forEach(eq => {
      equipmentAvailability.set(eq.id, this.getShiftStartTime(shift, date));
    });

    // Calculate critical ratios and sort
    const jobsWithCR = this.jobs.map(job => ({
      job,
      criticalRatio: this.calculateCriticalRatio(job, date)
    })).sort((a, b) => a.criticalRatio - b.criticalRatio);

    for (const { job } of jobsWithCR) {
      const allocated = this.allocateJobToEquipment(
        job,
        equipmentAvailability,
        shift,
        date
      );

      if (allocated) {
        scheduledJobs.push(allocated.job);
        allocations.push(allocated.allocation);
      }
    }

    return {
      id: this.generateScheduleId(),
      plantId: 'PLANT-001',
      shift,
      date,
      jobs: scheduledJobs,
      equipmentAllocations: allocations,
      constraints: this.constraints,
      optimizationScore: 0
    };
  }

  /**
   * Genetic Algorithm based scheduling
   */
  private async scheduleGeneticAlgorithm(shift: Shift, date: Date): Promise<ProductionSchedule> {
    const populationSize = 50;
    const generations = this.config.maxIterations;
    const mutationRate = 0.1;
    const crossoverRate = 0.7;

    // Initialize population with random schedules
    let population = this.initializePopulation(populationSize, shift, date);

    for (let gen = 0; gen < generations; gen++) {
      // Evaluate fitness
      const fitness = population.map(schedule =>
        this.calculateFitness(schedule)
      );

      // Selection
      const selected = this.tournamentSelection(population, fitness, populationSize);

      // Crossover
      const offspring: ProductionSchedule[] = [];
      for (let i = 0; i < selected.length; i += 2) {
        if (Math.random() < crossoverRate && i + 1 < selected.length) {
          const [child1, child2] = this.crossover(selected[i], selected[i + 1]);
          offspring.push(child1, child2);
        } else {
          offspring.push(selected[i]);
          if (i + 1 < selected.length) offspring.push(selected[i + 1]);
        }
      }

      // Mutation
      population = offspring.map(schedule =>
        Math.random() < mutationRate ? this.mutate(schedule) : schedule
      );

      // Check convergence
      const bestFitness = Math.max(...fitness);
      if (bestFitness > this.config.convergenceThreshold) {
        break;
      }
    }

    // Return best schedule
    const finalFitness = population.map(s => this.calculateFitness(s));
    const bestIndex = finalFitness.indexOf(Math.max(...finalFitness));
    return population[bestIndex];
  }

  /**
   * Simulated Annealing based scheduling
   */
  private async scheduleSimulatedAnnealing(shift: Shift, date: Date): Promise<ProductionSchedule> {
    let currentSchedule = this.scheduleFIFO(shift, date);
    let currentEnergy = this.calculateEnergy(currentSchedule);
    let bestSchedule = currentSchedule;
    let bestEnergy = currentEnergy;

    let temperature = 1000.0;
    const coolingRate = 0.95;
    const minTemperature = 0.1;

    while (temperature > minTemperature) {
      for (let i = 0; i < 100; i++) {
        // Generate neighbor solution
        const neighborSchedule = this.generateNeighbor(currentSchedule);
        const neighborEnergy = this.calculateEnergy(neighborSchedule);

        // Accept or reject
        const deltaE = neighborEnergy - currentEnergy;
        if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temperature)) {
          currentSchedule = neighborSchedule;
          currentEnergy = neighborEnergy;

          if (currentEnergy < bestEnergy) {
            bestSchedule = currentSchedule;
            bestEnergy = currentEnergy;
          }
        }
      }

      temperature *= coolingRate;
    }

    return bestSchedule;
  }

  /**
   * Constraint Programming based scheduling
   */
  private async scheduleConstraintProgramming(shift: Shift, date: Date): Promise<ProductionSchedule> {
    // Simplified constraint-based scheduling
    const allocations: EquipmentAllocation[] = [];
    const scheduledJobs: ProductionJob[] = [];

    // Build constraint satisfaction problem
    const variables = this.buildVariables();
    const domains = this.buildDomains(shift, date);
    const constraintGraph = this.buildConstraintGraph();

    // Backtracking search with constraint propagation
    const solution = this.backtrackingSearch(variables, domains, constraintGraph);

    if (solution) {
      for (const [jobId, assignment] of solution.entries()) {
        const job = this.jobs.find(j => j.id === jobId);
        if (job) {
          const updatedJob = { ...job };
          updatedJob.scheduledStart = assignment.startTime;
          updatedJob.scheduledEnd = assignment.endTime;
          updatedJob.equipmentId = assignment.equipmentId;

          scheduledJobs.push(updatedJob);
          allocations.push({
            equipmentId: assignment.equipmentId,
            jobId: job.id,
            startTime: assignment.startTime,
            endTime: assignment.endTime,
            utilizationPercentage: this.calculateUtilization(updatedJob)
          });
        }
      }
    }

    return {
      id: this.generateScheduleId(),
      plantId: 'PLANT-001',
      shift,
      date,
      jobs: scheduledJobs,
      equipmentAllocations: allocations,
      constraints: this.constraints,
      optimizationScore: 0
    };
  }

  /**
   * Allocate job to best available equipment
   */
  private allocateJobToEquipment(
    job: ProductionJob,
    equipmentAvailability: Map<string, Date>,
    shift: Shift,
    date: Date
  ): { job: ProductionJob; allocation: EquipmentAllocation } | null {
    // Find compatible equipment
    const compatibleEquipment = this.equipment.filter(eq =>
      this.isEquipmentCompatible(eq, job)
    );

    if (compatibleEquipment.length === 0) {
      console.warn(`No compatible equipment found for job ${job.id}`);
      return null;
    }

    // Select equipment with earliest availability
    let bestEquipment: Equipment | null = null;
    let earliestAvailability = new Date(8640000000000000); // Max date

    for (const eq of compatibleEquipment) {
      const availability = equipmentAvailability.get(eq.id) || this.getShiftStartTime(shift, date);
      if (availability < earliestAvailability) {
        earliestAvailability = availability;
        bestEquipment = eq;
      }
    }

    if (!bestEquipment) return null;

    // Calculate job duration
    const setupTime = job.setupTime || 0;
    const processingTime = (job.quantity * job.cycleTime) / 60; // Convert to minutes
    const totalTime = setupTime + processingTime + this.config.bufferTimeMinutes;

    const startTime = earliestAvailability;
    const endTime = new Date(startTime.getTime() + totalTime * 60000);

    // Update equipment availability
    equipmentAvailability.set(bestEquipment.id, endTime);

    // Create updated job
    const scheduledJob: ProductionJob = {
      ...job,
      equipmentId: bestEquipment.id,
      scheduledStart: startTime,
      scheduledEnd: endTime,
      status: JobStatus.SCHEDULED
    };

    const allocation: EquipmentAllocation = {
      equipmentId: bestEquipment.id,
      jobId: job.id,
      startTime,
      endTime,
      utilizationPercentage: this.calculateUtilization(scheduledJob)
    };

    return { job: scheduledJob, allocation };
  }

  /**
   * Check if equipment is compatible with job
   */
  private isEquipmentCompatible(equipment: Equipment, job: ProductionJob): boolean {
    // Check equipment type matches job requirements
    // Check capacity is sufficient
    // Check equipment is available (not under maintenance)

    if (equipment.status === EquipmentStatus.MAINTENANCE ||
        equipment.status === EquipmentStatus.BREAKDOWN ||
        equipment.status === EquipmentStatus.OFFLINE) {
      return false;
    }

    // Simplified compatibility check
    return true;
  }

  /**
   * Calculate critical ratio for job
   */
  private calculateCriticalRatio(job: ProductionJob, currentDate: Date): number {
    const timeRemaining = (job.scheduledEnd.getTime() - currentDate.getTime()) / 3600000; // hours
    const workRemaining = (job.quantity * job.cycleTime) / 3600; // hours

    if (workRemaining === 0) return Infinity;
    return timeRemaining / workRemaining;
  }

  /**
   * Calculate utilization percentage
   */
  private calculateUtilization(job: ProductionJob): number {
    const setupTime = job.setupTime || 0;
    const processingTime = (job.quantity * job.cycleTime) / 60;
    const totalTime = (job.scheduledEnd.getTime() - job.scheduledStart.getTime()) / 60000;

    if (totalTime === 0) return 0;
    return ((setupTime + processingTime) / totalTime) * 100;
  }

  /**
   * Initialize population for genetic algorithm
   */
  private initializePopulation(size: number, shift: Shift, date: Date): ProductionSchedule[] {
    const population: ProductionSchedule[] = [];

    for (let i = 0; i < size; i++) {
      // Shuffle jobs randomly
      const shuffledJobs = [...this.jobs].sort(() => Math.random() - 0.5);

      // Create schedule with random job order
      const tempJobs = this.jobs;
      this.jobs = shuffledJobs;
      const schedule = this.scheduleFIFO(shift, date);
      this.jobs = tempJobs;

      population.push(schedule);
    }

    return population;
  }

  /**
   * Tournament selection for genetic algorithm
   */
  private tournamentSelection(
    population: ProductionSchedule[],
    fitness: number[],
    size: number
  ): ProductionSchedule[] {
    const selected: ProductionSchedule[] = [];
    const tournamentSize = 3;

    for (let i = 0; i < size; i++) {
      let bestIdx = Math.floor(Math.random() * population.length);
      let bestFitness = fitness[bestIdx];

      for (let j = 1; j < tournamentSize; j++) {
        const idx = Math.floor(Math.random() * population.length);
        if (fitness[idx] > bestFitness) {
          bestIdx = idx;
          bestFitness = fitness[idx];
        }
      }

      selected.push(population[bestIdx]);
    }

    return selected;
  }

  /**
   * Crossover operation for genetic algorithm
   */
  private crossover(parent1: ProductionSchedule, parent2: ProductionSchedule): [ProductionSchedule, ProductionSchedule] {
    // Order crossover (OX)
    const size = parent1.jobs.length;
    const cutPoint1 = Math.floor(Math.random() * size);
    const cutPoint2 = Math.floor(Math.random() * size);
    const start = Math.min(cutPoint1, cutPoint2);
    const end = Math.max(cutPoint1, cutPoint2);

    // Create offspring
    const child1Jobs = this.orderCrossover(parent1.jobs, parent2.jobs, start, end);
    const child2Jobs = this.orderCrossover(parent2.jobs, parent1.jobs, start, end);

    // Rebuild schedules
    const child1 = { ...parent1, jobs: child1Jobs };
    const child2 = { ...parent2, jobs: child2Jobs };

    return [child1, child2];
  }

  /**
   * Order crossover helper
   */
  private orderCrossover(parent1: ProductionJob[], parent2: ProductionJob[], start: number, end: number): ProductionJob[] {
    const size = parent1.length;
    const child = new Array(size).fill(null);

    // Copy segment from parent1
    for (let i = start; i <= end; i++) {
      child[i] = parent1[i];
    }

    // Fill remaining from parent2
    let childIdx = (end + 1) % size;
    let parent2Idx = (end + 1) % size;

    while (child.includes(null)) {
      const job = parent2[parent2Idx];
      if (!child.some(j => j && j.id === job.id)) {
        child[childIdx] = job;
        childIdx = (childIdx + 1) % size;
      }
      parent2Idx = (parent2Idx + 1) % size;
    }

    return child as ProductionJob[];
  }

  /**
   * Mutation operation for genetic algorithm
   */
  private mutate(schedule: ProductionSchedule): ProductionSchedule {
    const jobs = [...schedule.jobs];

    // Swap mutation
    const idx1 = Math.floor(Math.random() * jobs.length);
    const idx2 = Math.floor(Math.random() * jobs.length);
    [jobs[idx1], jobs[idx2]] = [jobs[idx2], jobs[idx1]];

    return { ...schedule, jobs };
  }

  /**
   * Calculate fitness for genetic algorithm
   */
  private calculateFitness(schedule: ProductionSchedule): number {
    let fitness = 0;

    // Minimize makespan
    const makespan = this.calculateMakespan(schedule);
    fitness -= makespan * 0.3;

    // Minimize tardiness
    const tardiness = this.calculateTotalTardiness(schedule);
    fitness -= tardiness * 0.4;

    // Maximize utilization
    const utilization = this.calculateAverageUtilization(schedule);
    fitness += utilization * 0.3;

    return fitness;
  }

  /**
   * Calculate energy for simulated annealing
   */
  private calculateEnergy(schedule: ProductionSchedule): number {
    return -this.calculateFitness(schedule);
  }

  /**
   * Generate neighbor solution for simulated annealing
   */
  private generateNeighbor(schedule: ProductionSchedule): ProductionSchedule {
    return this.mutate(schedule);
  }

  /**
   * Build variables for constraint programming
   */
  private buildVariables(): string[] {
    return this.jobs.map(j => j.id);
  }

  /**
   * Build domains for constraint programming
   */
  private buildDomains(shift: Shift, date: Date): Map<string, TimeSlot[]> {
    const domains = new Map<string, TimeSlot[]>();

    const shiftStart = this.getShiftStartTime(shift, date);
    const shiftEnd = this.getShiftEndTime(shift, date);

    for (const job of this.jobs) {
      const slots: TimeSlot[] = [];
      const duration = ((job.setupTime || 0) + (job.quantity * job.cycleTime) / 60);

      // Generate possible time slots
      let currentTime = new Date(shiftStart);
      while (currentTime.getTime() + duration * 60000 <= shiftEnd.getTime()) {
        slots.push({
          startTime: new Date(currentTime),
          endTime: new Date(currentTime.getTime() + duration * 60000),
          equipmentId: job.equipmentId
        });
        currentTime = new Date(currentTime.getTime() + 30 * 60000); // 30-minute intervals
      }

      domains.set(job.id, slots);
    }

    return domains;
  }

  /**
   * Build constraint graph for constraint programming
   */
  private buildConstraintGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();

    for (const job of this.jobs) {
      const relatedJobs = this.jobs
        .filter(j => j.id !== job.id && j.equipmentId === job.equipmentId)
        .map(j => j.id);
      graph.set(job.id, relatedJobs);
    }

    return graph;
  }

  /**
   * Backtracking search for constraint programming
   */
  private backtrackingSearch(
    variables: string[],
    domains: Map<string, TimeSlot[]>,
    constraints: Map<string, string[]>
  ): Map<string, TimeSlot> | null {
    const assignment = new Map<string, TimeSlot>();
    return this.backtrack(assignment, variables, domains, constraints);
  }

  /**
   * Backtrack helper
   */
  private backtrack(
    assignment: Map<string, TimeSlot>,
    variables: string[],
    domains: Map<string, TimeSlot[]>,
    constraints: Map<string, string[]>
  ): Map<string, TimeSlot> | null {
    if (assignment.size === variables.length) {
      return assignment;
    }

    const variable = variables.find(v => !assignment.has(v));
    if (!variable) return null;

    const domain = domains.get(variable) || [];
    for (const value of domain) {
      if (this.isConsistent(variable, value, assignment, constraints)) {
        assignment.set(variable, value);
        const result = this.backtrack(assignment, variables, domains, constraints);
        if (result) return result;
        assignment.delete(variable);
      }
    }

    return null;
  }

  /**
   * Check consistency for constraint programming
   */
  private isConsistent(
    variable: string,
    value: TimeSlot,
    assignment: Map<string, TimeSlot>,
    constraints: Map<string, string[]>
  ): boolean {
    const relatedVars = constraints.get(variable) || [];

    for (const relatedVar of relatedVars) {
      const relatedValue = assignment.get(relatedVar);
      if (relatedValue && this.timeSlotsOverlap(value, relatedValue)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if time slots overlap
   */
  private timeSlotsOverlap(slot1: TimeSlot, slot2: TimeSlot): boolean {
    if (slot1.equipmentId !== slot2.equipmentId) return false;
    return slot1.startTime < slot2.endTime && slot2.startTime < slot1.endTime;
  }

  /**
   * Calculate makespan (total time to complete all jobs)
   */
  private calculateMakespan(schedule: ProductionSchedule): number {
    if (schedule.jobs.length === 0) return 0;

    const endTimes = schedule.jobs.map(j => j.scheduledEnd.getTime());
    const startTimes = schedule.jobs.map(j => j.scheduledStart.getTime());

    return (Math.max(...endTimes) - Math.min(...startTimes)) / 60000; // minutes
  }

  /**
   * Calculate total tardiness
   */
  private calculateTotalTardiness(schedule: ProductionSchedule): number {
    let totalTardiness = 0;

    for (const job of schedule.jobs) {
      const tardiness = Math.max(0, job.scheduledEnd.getTime() - job.scheduledEnd.getTime());
      totalTardiness += tardiness / 60000; // minutes
    }

    return totalTardiness;
  }

  /**
   * Calculate average equipment utilization
   */
  private calculateAverageUtilization(schedule: ProductionSchedule): number {
    if (schedule.equipmentAllocations.length === 0) return 0;

    const totalUtilization = schedule.equipmentAllocations.reduce(
      (sum, alloc) => sum + alloc.utilizationPercentage,
      0
    );

    return totalUtilization / schedule.equipmentAllocations.length;
  }

  /**
   * Calculate optimization score
   */
  private calculateOptimizationScore(schedule: ProductionSchedule): number {
    let score = 100;

    // Deduct points for low utilization
    const utilization = this.calculateAverageUtilization(schedule);
    score -= (100 - utilization) * 0.3;

    // Deduct points for tardiness
    const tardiness = this.calculateTotalTardiness(schedule);
    score -= Math.min(tardiness * 0.1, 30);

    // Deduct points for long makespan
    const makespan = this.calculateMakespan(schedule);
    const idealMakespan = schedule.jobs.reduce((sum, j) => sum + j.cycleTime * j.quantity / 60, 0);
    const makespanEfficiency = (idealMakespan / makespan) * 100;
    score += (makespanEfficiency - 100) * 0.2;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Validate scheduling inputs
   */
  private validateSchedulingInputs(): void {
    if (this.jobs.length === 0) {
      throw new Error('No jobs to schedule');
    }

    if (this.equipment.length === 0) {
      throw new Error('No equipment available for scheduling');
    }

    // Validate material availability
    for (const job of this.jobs) {
      for (const material of job.materials) {
        if (material.status !== MaterialStatus.AVAILABLE &&
            material.status !== MaterialStatus.RESERVED) {
          console.warn(`Material ${material.materialName} not available for job ${job.id}`);
        }
      }
    }
  }

  /**
   * Get shift start time
   */
  private getShiftStartTime(shift: Shift, date: Date): Date {
    const [hours, minutes] = shift.startTime.split(':').map(Number);
    const startTime = new Date(date);
    startTime.setHours(hours, minutes, 0, 0);
    return startTime;
  }

  /**
   * Get shift end time
   */
  private getShiftEndTime(shift: Shift, date: Date): Date {
    const [hours, minutes] = shift.endTime.split(':').map(Number);
    const endTime = new Date(date);
    endTime.setHours(hours, minutes, 0, 0);

    // Handle overnight shifts
    if (endTime <= this.getShiftStartTime(shift, date)) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return endTime;
  }

  /**
   * Generate unique schedule ID
   */
  private generateScheduleId(): string {
    return `SCHED-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current schedule
   */
  getCurrentSchedule(): ProductionSchedule | undefined {
    return this.currentSchedule;
  }

  /**
   * Update schedule with real-time changes
   */
  async updateSchedule(
    updatedJobs: ProductionJob[],
    updatedEquipment: Equipment[]
  ): Promise<ProductionSchedule> {
    if (!this.currentSchedule) {
      throw new Error('No current schedule to update');
    }

    // Reschedule affected jobs
    return this.generateSchedule(
      updatedJobs,
      updatedEquipment,
      this.currentSchedule.shift,
      this.currentSchedule.date,
      this.currentSchedule.constraints
    );
  }
}

// ============================================================================
// Helper Types
// ============================================================================

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  equipmentId: string;
}

// ============================================================================
// Schedule Optimization Utilities
// ============================================================================

export class ScheduleOptimizer {
  /**
   * Analyze schedule performance
   */
  static analyzeSchedule(schedule: ProductionSchedule): ScheduleAnalysis {
    const totalJobs = schedule.jobs.length;
    const completedOnTime = schedule.jobs.filter(j =>
      j.scheduledEnd <= j.scheduledEnd
    ).length;

    const utilizations = schedule.equipmentAllocations.map(a => a.utilizationPercentage);
    const avgUtilization = utilizations.reduce((a, b) => a + b, 0) / utilizations.length;

    return {
      totalJobs,
      scheduledJobs: totalJobs,
      unscheduledJobs: 0,
      averageUtilization: avgUtilization,
      onTimePercentage: (completedOnTime / totalJobs) * 100,
      makespan: this.calculateScheduleMakespan(schedule),
      bottlenecks: this.identifyBottlenecks(schedule)
    };
  }

  private static calculateScheduleMakespan(schedule: ProductionSchedule): number {
    if (schedule.jobs.length === 0) return 0;

    const endTimes = schedule.jobs.map(j => j.scheduledEnd.getTime());
    const startTimes = schedule.jobs.map(j => j.scheduledStart.getTime());

    return (Math.max(...endTimes) - Math.min(...startTimes)) / 60000;
  }

  private static identifyBottlenecks(schedule: ProductionSchedule): string[] {
    const equipmentLoad = new Map<string, number>();

    for (const allocation of schedule.equipmentAllocations) {
      const duration = (allocation.endTime.getTime() - allocation.startTime.getTime()) / 60000;
      equipmentLoad.set(
        allocation.equipmentId,
        (equipmentLoad.get(allocation.equipmentId) || 0) + duration
      );
    }

    const avgLoad = Array.from(equipmentLoad.values()).reduce((a, b) => a + b, 0) / equipmentLoad.size;
    const bottlenecks: string[] = [];

    for (const [equipmentId, load] of equipmentLoad) {
      if (load > avgLoad * 1.5) {
        bottlenecks.push(equipmentId);
      }
    }

    return bottlenecks;
  }
}

export interface ScheduleAnalysis {
  totalJobs: number;
  scheduledJobs: number;
  unscheduledJobs: number;
  averageUtilization: number;
  onTimePercentage: number;
  makespan: number;
  bottlenecks: string[];
}
