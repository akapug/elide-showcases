/**
 * Example Controller for MyApp Custom Resource
 *
 * This controller manages MyApp resources and creates
 * corresponding Deployments and Services.
 */

import {
  Controller,
  CustomResource,
  ReconcileResult,
  KubernetesClient,
  EventRecorder,
} from '../operator';

interface MyAppSpec {
  replicas: number;
  image: string;
  port: number;
  resources?: {
    limits?: {
      cpu?: string;
      memory?: string;
    };
    requests?: {
      cpu?: string;
      memory?: string;
    };
  };
}

interface MyAppStatus {
  phase: 'Pending' | 'Running' | 'Failed';
  conditions: Array<{
    type: string;
    status: 'True' | 'False' | 'Unknown';
    lastTransitionTime: Date;
    reason?: string;
    message?: string;
  }>;
  observedGeneration?: number;
  replicas?: number;
  readyReplicas?: number;
}

class MyAppController extends Controller<MyAppSpec, MyAppStatus> {
  private recorder: EventRecorder;

  constructor() {
    super({
      group: 'example.com',
      version: 'v1',
      kind: 'MyApp',
      maxConcurrentReconciles: 5,
    });

    this.recorder = new EventRecorder(this.client);
    this.finalizer = 'example.com/myapp-finalizer';
  }

  async reconcile(
    resource: CustomResource<MyAppSpec, MyAppStatus>
  ): Promise<ReconcileResult> {
    console.log(`Reconciling MyApp: ${resource.metadata.namespace}/${resource.metadata.name}`);

    try {
      // Validate spec
      if (!this.validateSpec(resource.spec)) {
        await this.recorder.event(resource, {
          type: 'Warning',
          reason: 'InvalidSpec',
          message: 'Invalid resource specification',
        });

        await this.updateCondition(resource, {
          type: 'Ready',
          status: 'False',
          reason: 'InvalidSpec',
          message: 'Invalid resource specification',
          lastTransitionTime: new Date(),
        });

        return { requeue: false };
      }

      // Reconcile Deployment
      const deployment = await this.reconcileDeployment(resource);

      // Reconcile Service
      await this.reconcileService(resource);

      // Update status
      const status: MyAppStatus = {
        phase: 'Running',
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastTransitionTime: new Date(),
            reason: 'DeploymentReady',
            message: 'Deployment is ready',
          },
        ],
        observedGeneration: resource.metadata.generation,
        replicas: deployment.status?.replicas || 0,
        readyReplicas: deployment.status?.readyReplicas || 0,
      };

      await this.updateStatus(resource, status);

      await this.recorder.event(resource, {
        type: 'Normal',
        reason: 'Reconciled',
        message: 'Successfully reconciled MyApp',
      });

      return { requeue: false };
    } catch (error) {
      console.error('Reconciliation failed:', error);

      await this.recorder.event(resource, {
        type: 'Warning',
        reason: 'ReconciliationFailed',
        message: `Failed to reconcile: ${error}`,
      });

      await this.updateCondition(resource, {
        type: 'Ready',
        status: 'False',
        reason: 'ReconciliationFailed',
        message: String(error),
        lastTransitionTime: new Date(),
      });

      return { requeue: true, requeueAfter: 30000 };
    }
  }

  async finalize(resource: CustomResource<MyAppSpec, MyAppStatus>): Promise<void> {
    console.log(`Finalizing MyApp: ${resource.metadata.namespace}/${resource.metadata.name}`);

    try {
      // Clean up external resources if any
      await this.recorder.event(resource, {
        type: 'Normal',
        reason: 'Finalized',
        message: 'Successfully finalized MyApp',
      });
    } catch (error) {
      console.error('Finalization failed:', error);
      throw error;
    }
  }

  private validateSpec(spec: MyAppSpec): boolean {
    if (spec.replicas < 1) {
      return false;
    }

    if (!spec.image) {
      return false;
    }

    if (spec.port < 1 || spec.port > 65535) {
      return false;
    }

    return true;
  }

  private async reconcileDeployment(
    resource: CustomResource<MyAppSpec, MyAppStatus>
  ): Promise<any> {
    const deploymentName = resource.metadata.name;
    const namespace = resource.metadata.namespace!;

    const desiredDeployment = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: deploymentName,
        namespace,
        labels: {
          app: deploymentName,
          'managed-by': 'myapp-operator',
        },
        ownerReferences: [this.createOwnerReference(resource)],
      },
      spec: {
        replicas: resource.spec.replicas,
        selector: {
          matchLabels: {
            app: deploymentName,
          },
        },
        template: {
          metadata: {
            labels: {
              app: deploymentName,
            },
          },
          spec: {
            containers: [
              {
                name: 'app',
                image: resource.spec.image,
                ports: [
                  {
                    name: 'http',
                    containerPort: resource.spec.port,
                    protocol: 'TCP',
                  },
                ],
                resources: resource.spec.resources || {},
              },
            ],
          },
        },
      },
    };

    try {
      // Try to get existing deployment
      const existing = await this.client.get('apps/v1', 'Deployment', deploymentName, namespace);

      // Update if needed
      if (this.deploymentNeedsUpdate(existing, desiredDeployment)) {
        console.log(`Updating Deployment ${deploymentName}`);
        await this.client.update('apps/v1', 'Deployment', desiredDeployment);
      }

      return existing;
    } catch (error) {
      // Create if doesn't exist
      console.log(`Creating Deployment ${deploymentName}`);
      return await this.client.create('apps/v1', 'Deployment', desiredDeployment);
    }
  }

  private async reconcileService(resource: CustomResource<MyAppSpec, MyAppStatus>): Promise<void> {
    const serviceName = resource.metadata.name;
    const namespace = resource.metadata.namespace!;

    const desiredService = {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: {
        name: serviceName,
        namespace,
        labels: {
          app: serviceName,
          'managed-by': 'myapp-operator',
        },
        ownerReferences: [this.createOwnerReference(resource)],
      },
      spec: {
        type: 'ClusterIP',
        selector: {
          app: serviceName,
        },
        ports: [
          {
            name: 'http',
            port: 80,
            targetPort: resource.spec.port,
            protocol: 'TCP',
          },
        ],
      },
    };

    try {
      await this.client.get('v1', 'Service', serviceName, namespace);
      console.log(`Service ${serviceName} already exists`);
    } catch (error) {
      console.log(`Creating Service ${serviceName}`);
      await this.client.create('v1', 'Service', desiredService);
    }
  }

  private deploymentNeedsUpdate(existing: any, desired: any): boolean {
    return (
      existing.spec.replicas !== desired.spec.replicas ||
      existing.spec.template.spec.containers[0].image !==
        desired.spec.template.spec.containers[0].image
    );
  }
}

export default MyAppController;
