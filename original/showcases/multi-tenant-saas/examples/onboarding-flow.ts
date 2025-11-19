/**
 * Tenant Onboarding Flow - Comprehensive onboarding system
 *
 * Features:
 * - Multi-step onboarding wizard
 * - Progressive profile completion
 * - Interactive tutorials
 * - Team invitation and setup
 * - Integration configuration
 * - Initial data import
 * - Success metrics tracking
 * - Personalized recommendations
 * - Time-to-value optimization
 */

import { EventEmitter } from 'events';

// ============================================================================
// Types and Interfaces
// ============================================================================

export enum OnboardingStep {
  REGISTRATION = 'registration',
  EMAIL_VERIFICATION = 'email_verification',
  PROFILE_SETUP = 'profile_setup',
  COMPANY_INFO = 'company_info',
  PLAN_SELECTION = 'plan_selection',
  PAYMENT_SETUP = 'payment_setup',
  TEAM_INVITATION = 'team_invitation',
  INTEGRATION_SETUP = 'integration_setup',
  DATA_IMPORT = 'data_import',
  TUTORIAL = 'tutorial',
  FIRST_PROJECT = 'first_project',
  COMPLETED = 'completed'
}

export enum OnboardingStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  ABANDONED = 'abandoned'
}

export interface OnboardingState {
  tenantId: string;
  userId: string;
  status: OnboardingStatus;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  progress: number;
  data: {
    profile?: UserProfile;
    company?: CompanyInfo;
    plan?: PlanSelection;
    payment?: PaymentInfo;
    team?: TeamSetup;
    integrations?: IntegrationConfig[];
    preferences?: UserPreferences;
  };
  metrics: {
    startedAt: Date;
    completedAt?: Date;
    timeToComplete?: number;
    stepsCompleted: number;
    totalSteps: number;
    dropOffStep?: OnboardingStep;
  };
  checkpoints: Array<{
    step: OnboardingStep;
    timestamp: Date;
    duration: number;
  }>;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  jobTitle: string;
  role: string;
  avatar?: string;
  timezone: string;
  language: string;
}

export interface CompanyInfo {
  name: string;
  industry: string;
  size: string;
  website?: string;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
}

export interface PlanSelection {
  planId: string;
  billingInterval: 'monthly' | 'annual';
  seats: number;
  addons: string[];
  estimatedCost: number;
}

export interface PaymentInfo {
  method: 'card' | 'bank_account' | 'invoice';
  paymentMethodId?: string;
  billingEmail: string;
  setupComplete: boolean;
}

export interface TeamSetup {
  members: Array<{
    email: string;
    role: string;
    name?: string;
    invitedAt: Date;
    accepted: boolean;
  }>;
  departments: string[];
  teamSize: number;
}

export interface IntegrationConfig {
  id: string;
  name: string;
  category: string;
  configured: boolean;
  credentials?: Record<string, string>;
  settings?: Record<string, any>;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    slack: boolean;
  };
  dashboard: {
    layout: string;
    widgets: string[];
  };
  features: {
    beta: boolean;
    experimental: boolean;
  };
}

export interface OnboardingRecommendation {
  step: OnboardingStep;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number;
  benefits: string[];
}

// ============================================================================
// Onboarding Manager
// ============================================================================

export class OnboardingManager extends EventEmitter {
  private onboardingStates: Map<string, OnboardingState> = new Map();
  private readonly stepOrder: OnboardingStep[] = [
    OnboardingStep.REGISTRATION,
    OnboardingStep.EMAIL_VERIFICATION,
    OnboardingStep.PROFILE_SETUP,
    OnboardingStep.COMPANY_INFO,
    OnboardingStep.PLAN_SELECTION,
    OnboardingStep.PAYMENT_SETUP,
    OnboardingStep.TEAM_INVITATION,
    OnboardingStep.INTEGRATION_SETUP,
    OnboardingStep.DATA_IMPORT,
    OnboardingStep.TUTORIAL,
    OnboardingStep.FIRST_PROJECT,
    OnboardingStep.COMPLETED
  ];

  constructor() {
    super();
    this.startAbandonmentDetection();
  }

  /**
   * Initialize onboarding for a new tenant
   */
  async initializeOnboarding(tenantId: string, userId: string): Promise<OnboardingState> {
    const state: OnboardingState = {
      tenantId,
      userId,
      status: OnboardingStatus.IN_PROGRESS,
      currentStep: OnboardingStep.REGISTRATION,
      completedSteps: [],
      progress: 0,
      data: {},
      metrics: {
        startedAt: new Date(),
        stepsCompleted: 0,
        totalSteps: this.stepOrder.length
      },
      checkpoints: []
    };

    this.onboardingStates.set(tenantId, state);

    this.emit('onboarding:started', {
      tenantId,
      userId,
      timestamp: new Date()
    });

    return state;
  }

  /**
   * Complete a step in the onboarding process
   */
  async completeStep(
    tenantId: string,
    step: OnboardingStep,
    data?: any
  ): Promise<OnboardingState> {
    const state = this.onboardingStates.get(tenantId);
    if (!state) {
      throw new Error(`Onboarding state not found for tenant ${tenantId}`);
    }

    const stepStartTime = state.checkpoints.find(c => c.step === step)?.timestamp || new Date();
    const duration = Date.now() - stepStartTime.getTime();

    // Mark step as completed
    if (!state.completedSteps.includes(step)) {
      state.completedSteps.push(step);
      state.checkpoints.push({
        step,
        timestamp: new Date(),
        duration
      });
    }

    // Store step data
    this.storeStepData(state, step, data);

    // Update progress
    state.metrics.stepsCompleted = state.completedSteps.length;
    state.progress = (state.completedSteps.length / state.metrics.totalSteps) * 100;

    // Move to next step
    const nextStep = this.getNextStep(step);
    if (nextStep) {
      state.currentStep = nextStep;
    }

    // Check if onboarding is complete
    if (step === OnboardingStep.COMPLETED || state.completedSteps.length === state.metrics.totalSteps) {
      await this.completeOnboarding(tenantId);
    }

    this.emit('step:completed', {
      tenantId,
      step,
      duration,
      progress: state.progress,
      timestamp: new Date()
    });

    return state;
  }

  /**
   * Store data collected during a step
   */
  private storeStepData(state: OnboardingState, step: OnboardingStep, data: any): void {
    switch (step) {
      case OnboardingStep.PROFILE_SETUP:
        state.data.profile = data as UserProfile;
        break;
      case OnboardingStep.COMPANY_INFO:
        state.data.company = data as CompanyInfo;
        break;
      case OnboardingStep.PLAN_SELECTION:
        state.data.plan = data as PlanSelection;
        break;
      case OnboardingStep.PAYMENT_SETUP:
        state.data.payment = data as PaymentInfo;
        break;
      case OnboardingStep.TEAM_INVITATION:
        state.data.team = data as TeamSetup;
        break;
      case OnboardingStep.INTEGRATION_SETUP:
        state.data.integrations = data as IntegrationConfig[];
        break;
    }
  }

  /**
   * Get the next step in the onboarding flow
   */
  private getNextStep(currentStep: OnboardingStep): OnboardingStep | null {
    const currentIndex = this.stepOrder.indexOf(currentStep);
    if (currentIndex === -1 || currentIndex === this.stepOrder.length - 1) {
      return null;
    }
    return this.stepOrder[currentIndex + 1];
  }

  /**
   * Complete the entire onboarding process
   */
  private async completeOnboarding(tenantId: string): Promise<void> {
    const state = this.onboardingStates.get(tenantId);
    if (!state) return;

    state.status = OnboardingStatus.COMPLETED;
    state.currentStep = OnboardingStep.COMPLETED;
    state.metrics.completedAt = new Date();
    state.metrics.timeToComplete = state.metrics.completedAt.getTime() - state.metrics.startedAt.getTime();

    this.emit('onboarding:completed', {
      tenantId,
      userId: state.userId,
      timeToComplete: state.metrics.timeToComplete,
      timestamp: new Date()
    });

    // Trigger post-onboarding actions
    await this.triggerPostOnboardingActions(state);
  }

  /**
   * Skip a step (if optional)
   */
  async skipStep(tenantId: string, step: OnboardingStep): Promise<OnboardingState> {
    const state = this.onboardingStates.get(tenantId);
    if (!state) {
      throw new Error(`Onboarding state not found for tenant ${tenantId}`);
    }

    // Some steps are required and cannot be skipped
    const requiredSteps = [
      OnboardingStep.REGISTRATION,
      OnboardingStep.EMAIL_VERIFICATION,
      OnboardingStep.PROFILE_SETUP,
      OnboardingStep.PLAN_SELECTION
    ];

    if (requiredSteps.includes(step)) {
      throw new Error(`Cannot skip required step: ${step}`);
    }

    // Move to next step without completing current
    const nextStep = this.getNextStep(step);
    if (nextStep) {
      state.currentStep = nextStep;
    }

    this.emit('step:skipped', {
      tenantId,
      step,
      timestamp: new Date()
    });

    return state;
  }

  /**
   * Get personalized recommendations for next steps
   */
  async getRecommendations(tenantId: string): Promise<OnboardingRecommendation[]> {
    const state = this.onboardingStates.get(tenantId);
    if (!state) {
      throw new Error(`Onboarding state not found for tenant ${tenantId}`);
    }

    const recommendations: OnboardingRecommendation[] = [];

    // Recommend based on current progress
    if (!state.completedSteps.includes(OnboardingStep.TEAM_INVITATION)) {
      recommendations.push({
        step: OnboardingStep.TEAM_INVITATION,
        title: 'Invite Your Team',
        description: 'Collaborate better by inviting team members',
        priority: 'high',
        estimatedTime: 5,
        benefits: [
          'Faster project completion',
          'Better collaboration',
          'Shared workspaces'
        ]
      });
    }

    if (!state.completedSteps.includes(OnboardingStep.INTEGRATION_SETUP)) {
      recommendations.push({
        step: OnboardingStep.INTEGRATION_SETUP,
        title: 'Connect Your Tools',
        description: 'Integrate with tools you already use',
        priority: 'medium',
        estimatedTime: 10,
        benefits: [
          'Seamless workflow',
          'Automatic data sync',
          'Reduced manual work'
        ]
      });
    }

    if (!state.completedSteps.includes(OnboardingStep.TUTORIAL)) {
      recommendations.push({
        step: OnboardingStep.TUTORIAL,
        title: 'Take the Product Tour',
        description: 'Learn key features in 5 minutes',
        priority: 'medium',
        estimatedTime: 5,
        benefits: [
          'Faster time to value',
          'Discover hidden features',
          'Best practices'
        ]
      });
    }

    return recommendations;
  }

  /**
   * Pause onboarding (user can resume later)
   */
  async pauseOnboarding(tenantId: string): Promise<void> {
    const state = this.onboardingStates.get(tenantId);
    if (!state) return;

    state.status = OnboardingStatus.PAUSED;

    this.emit('onboarding:paused', {
      tenantId,
      currentStep: state.currentStep,
      timestamp: new Date()
    });
  }

  /**
   * Resume paused onboarding
   */
  async resumeOnboarding(tenantId: string): Promise<OnboardingState> {
    const state = this.onboardingStates.get(tenantId);
    if (!state) {
      throw new Error(`Onboarding state not found for tenant ${tenantId}`);
    }

    state.status = OnboardingStatus.IN_PROGRESS;

    this.emit('onboarding:resumed', {
      tenantId,
      currentStep: state.currentStep,
      timestamp: new Date()
    });

    return state;
  }

  /**
   * Detect and handle abandoned onboarding
   */
  private startAbandonmentDetection(): void {
    setInterval(() => {
      const now = Date.now();
      const abandonmentThreshold = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const [tenantId, state] of this.onboardingStates) {
        if (state.status !== OnboardingStatus.IN_PROGRESS) continue;

        const lastActivity = state.checkpoints.length > 0
          ? state.checkpoints[state.checkpoints.length - 1].timestamp.getTime()
          : state.metrics.startedAt.getTime();

        if (now - lastActivity > abandonmentThreshold) {
          state.status = OnboardingStatus.ABANDONED;
          state.metrics.dropOffStep = state.currentStep;

          this.emit('onboarding:abandoned', {
            tenantId,
            dropOffStep: state.currentStep,
            progress: state.progress,
            timestamp: new Date()
          });
        }
      }
    }, 24 * 60 * 60 * 1000); // Check daily
  }

  /**
   * Trigger post-onboarding actions
   */
  private async triggerPostOnboardingActions(state: OnboardingState): Promise<void> {
    // Send welcome email
    this.emit('action:send_welcome_email', {
      tenantId: state.tenantId,
      profile: state.data.profile
    });

    // Create first project template
    if (state.data.company?.industry) {
      this.emit('action:create_template_project', {
        tenantId: state.tenantId,
        industry: state.data.company.industry
      });
    }

    // Schedule onboarding call for enterprise customers
    if (state.data.plan?.planId.includes('enterprise')) {
      this.emit('action:schedule_onboarding_call', {
        tenantId: state.tenantId,
        company: state.data.company
      });
    }

    // Start trial countdown
    this.emit('action:start_trial', {
      tenantId: state.tenantId,
      plan: state.data.plan
    });
  }

  /**
   * Get analytics for onboarding performance
   */
  getOnboardingAnalytics(): {
    completionRate: number;
    averageTimeToComplete: number;
    dropOffByStep: Map<OnboardingStep, number>;
    mostSkippedSteps: Array<{ step: OnboardingStep; count: number }>;
  } {
    const states = Array.from(this.onboardingStates.values());

    // Completion rate
    const completed = states.filter(s => s.status === OnboardingStatus.COMPLETED).length;
    const completionRate = states.length > 0 ? (completed / states.length) * 100 : 0;

    // Average time to complete
    const completedStates = states.filter(s => s.metrics.timeToComplete);
    const averageTimeToComplete = completedStates.length > 0
      ? completedStates.reduce((sum, s) => sum + (s.metrics.timeToComplete || 0), 0) / completedStates.length
      : 0;

    // Drop-off by step
    const dropOffByStep = new Map<OnboardingStep, number>();
    states.filter(s => s.status === OnboardingStatus.ABANDONED).forEach(s => {
      if (s.metrics.dropOffStep) {
        const count = dropOffByStep.get(s.metrics.dropOffStep) || 0;
        dropOffByStep.set(s.metrics.dropOffStep, count + 1);
      }
    });

    // Most skipped steps (would need skip tracking)
    const mostSkippedSteps: Array<{ step: OnboardingStep; count: number }> = [];

    return {
      completionRate,
      averageTimeToComplete,
      dropOffByStep,
      mostSkippedSteps
    };
  }

  // Getter methods
  getOnboardingState(tenantId: string): OnboardingState | undefined {
    return this.onboardingStates.get(tenantId);
  }

  getAllStates(): OnboardingState[] {
    return Array.from(this.onboardingStates.values());
  }
}

// ============================================================================
// Example Usage
// ============================================================================

async function exampleOnboardingFlow() {
  const manager = new OnboardingManager();

  // Initialize onboarding
  const state = await manager.initializeOnboarding('tenant_123', 'user_456');
  console.log('Onboarding initialized:', state.tenantId);

  // Complete registration
  await manager.completeStep(state.tenantId, OnboardingStep.REGISTRATION, {
    email: 'user@example.com',
    password: 'hashed_password'
  });

  // Complete email verification
  await manager.completeStep(state.tenantId, OnboardingStep.EMAIL_VERIFICATION);

  // Complete profile setup
  await manager.completeStep(state.tenantId, OnboardingStep.PROFILE_SETUP, {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    jobTitle: 'Engineering Manager',
    role: 'admin',
    timezone: 'America/Los_Angeles',
    language: 'en'
  } as UserProfile);

  // Complete company info
  await manager.completeStep(state.tenantId, OnboardingStep.COMPANY_INFO, {
    name: 'Acme Corp',
    industry: 'Technology',
    size: '51-200',
    website: 'https://acme.com'
  } as CompanyInfo);

  // Get recommendations
  const recommendations = await manager.getRecommendations(state.tenantId);
  console.log('Recommendations:', recommendations);

  // Get analytics
  const analytics = manager.getOnboardingAnalytics();
  console.log('Onboarding Analytics:', analytics);
}

export default OnboardingManager;
