/**
 * CRD Manager - Custom Resource Definition Management
 *
 * Handles CRD lifecycle, validation, versioning, and schema management.
 * Supports multiple API versions with conversion strategies.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface CRDVersion {
  name: string;
  served: boolean;
  storage: boolean;
  deprecated?: boolean;
  deprecationWarning?: string;
  schema: OpenAPIV3Schema;
  subresources?: {
    status?: Record<string, unknown>;
    scale?: {
      specReplicasPath: string;
      statusReplicasPath: string;
      labelSelectorPath?: string;
    };
  };
  additionalPrinterColumns?: PrinterColumn[];
}

export interface PrinterColumn {
  name: string;
  type: string;
  description?: string;
  jsonPath: string;
  priority?: number;
}

export interface OpenAPIV3Schema {
  type: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | SchemaProperty;
}

export interface SchemaProperty {
  type: string;
  description?: string;
  format?: string;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  enum?: string[];
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
  default?: unknown;
  additionalProperties?: boolean | SchemaProperty;
}

export interface CustomResourceDefinition {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: {
    group: string;
    names: {
      plural: string;
      singular: string;
      kind: string;
      shortNames?: string[];
      listKind?: string;
      categories?: string[];
    };
    scope: "Namespaced" | "Cluster";
    versions: CRDVersion[];
    conversion?: {
      strategy: "None" | "Webhook";
      webhook?: {
        clientConfig: {
          service: {
            namespace: string;
            name: string;
            path: string;
          };
        };
        conversionReviewVersions: string[];
      };
    };
  };
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ============================================================================
// CRD Manager
// ============================================================================

export class CRDManager {
  private crds = new Map<string, CustomResourceDefinition>();

  /**
   * Register a new CRD
   */
  register(crd: CustomResourceDefinition): void {
    const crdName = this.getCRDName(crd.spec.group, crd.spec.names.plural);

    // Validate CRD structure
    this.validateCRD(crd);

    // Ensure at least one version is marked as storage
    const storageVersions = crd.spec.versions.filter(v => v.storage);
    if (storageVersions.length !== 1) {
      throw new Error(`CRD must have exactly one storage version, found ${storageVersions.length}`);
    }

    this.crds.set(crdName, crd);
    console.log(`[CRD] Registered ${crdName} with versions: ${crd.spec.versions.map(v => v.name).join(", ")}`);
  }

  /**
   * Get a registered CRD
   */
  get(group: string, plural: string): CustomResourceDefinition | undefined {
    return this.crds.get(this.getCRDName(group, plural));
  }

  /**
   * List all registered CRDs
   */
  list(): CustomResourceDefinition[] {
    return Array.from(this.crds.values());
  }

  /**
   * Get the schema for a specific version
   */
  getVersionSchema(group: string, plural: string, version: string): OpenAPIV3Schema | undefined {
    const crd = this.get(group, plural);
    if (!crd) return undefined;

    const versionSpec = crd.spec.versions.find(v => v.name === version);
    return versionSpec?.schema;
  }

  /**
   * Validate a resource against the CRD schema
   */
  validateResource(resource: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Extract API group and version
    const [group, version] = this.parseAPIVersion(resource.apiVersion);
    const kind = resource.kind;

    // Find matching CRD
    const crd = Array.from(this.crds.values()).find(c =>
      c.spec.group === group && c.spec.names.kind === kind
    );

    if (!crd) {
      errors.push({
        field: "apiVersion",
        message: `No CRD registered for ${group}/${kind}`,
      });
      return errors;
    }

    // Find version schema
    const versionSpec = crd.spec.versions.find(v => v.name === version);
    if (!versionSpec) {
      errors.push({
        field: "apiVersion",
        message: `Version ${version} not found in CRD`,
      });
      return errors;
    }

    if (!versionSpec.served) {
      errors.push({
        field: "apiVersion",
        message: `Version ${version} is not served`,
      });
    }

    // Validate metadata
    if (!resource.metadata?.name) {
      errors.push({
        field: "metadata.name",
        message: "Resource name is required",
      });
    }

    if (crd.spec.scope === "Namespaced" && !resource.metadata?.namespace) {
      errors.push({
        field: "metadata.namespace",
        message: "Namespace is required for namespaced resources",
      });
    }

    // Validate spec against schema
    if (versionSpec.schema.properties?.spec) {
      const specErrors = this.validateAgainstSchema(
        resource.spec,
        versionSpec.schema.properties.spec,
        "spec"
      );
      errors.push(...specErrors);
    }

    return errors;
  }

  /**
   * Validate a value against a schema
   */
  private validateAgainstSchema(
    value: any,
    schema: SchemaProperty,
    path: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    // Type validation
    if (schema.type === "object" && typeof value !== "object") {
      errors.push({
        field: path,
        message: `Expected object, got ${typeof value}`,
        value,
      });
      return errors;
    }

    if (schema.type === "string" && typeof value !== "string") {
      errors.push({
        field: path,
        message: `Expected string, got ${typeof value}`,
        value,
      });
      return errors;
    }

    if (schema.type === "integer" && !Number.isInteger(value)) {
      errors.push({
        field: path,
        message: `Expected integer, got ${typeof value}`,
        value,
      });
      return errors;
    }

    if (schema.type === "number" && typeof value !== "number") {
      errors.push({
        field: path,
        message: `Expected number, got ${typeof value}`,
        value,
      });
      return errors;
    }

    if (schema.type === "boolean" && typeof value !== "boolean") {
      errors.push({
        field: path,
        message: `Expected boolean, got ${typeof value}`,
        value,
      });
      return errors;
    }

    // String validations
    if (schema.type === "string" && typeof value === "string") {
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push({
          field: path,
          message: `Value does not match pattern ${schema.pattern}`,
          value,
        });
      }

      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({
          field: path,
          message: `String length must be at least ${schema.minLength}`,
          value,
        });
      }

      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({
          field: path,
          message: `String length must be at most ${schema.maxLength}`,
          value,
        });
      }

      if (schema.enum && !schema.enum.includes(value)) {
        errors.push({
          field: path,
          message: `Value must be one of: ${schema.enum.join(", ")}`,
          value,
        });
      }
    }

    // Number validations
    if ((schema.type === "integer" || schema.type === "number") && typeof value === "number") {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({
          field: path,
          message: `Value must be at least ${schema.minimum}`,
          value,
        });
      }

      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({
          field: path,
          message: `Value must be at most ${schema.maximum}`,
          value,
        });
      }
    }

    // Object validations
    if (schema.type === "object" && typeof value === "object" && value !== null) {
      // Required fields
      if (schema.required) {
        for (const requiredField of schema.required) {
          if (!(requiredField in value)) {
            errors.push({
              field: `${path}.${requiredField}`,
              message: `Required field is missing`,
            });
          }
        }
      }

      // Validate nested properties
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in value) {
            const nestedErrors = this.validateAgainstSchema(
              value[key],
              propSchema,
              `${path}.${key}`
            );
            errors.push(...nestedErrors);
          }
        }
      }
    }

    // Array validations
    if (schema.type === "array" && Array.isArray(value)) {
      if (schema.items) {
        for (let i = 0; i < value.length; i++) {
          const itemErrors = this.validateAgainstSchema(
            value[i],
            schema.items,
            `${path}[${i}]`
          );
          errors.push(...itemErrors);
        }
      }
    }

    return errors;
  }

  /**
   * Validate CRD structure
   */
  private validateCRD(crd: CustomResourceDefinition): void {
    if (!crd.spec.group) {
      throw new Error("CRD group is required");
    }

    if (!crd.spec.names.kind) {
      throw new Error("CRD kind is required");
    }

    if (!crd.spec.names.plural) {
      throw new Error("CRD plural name is required");
    }

    if (!crd.spec.versions || crd.spec.versions.length === 0) {
      throw new Error("CRD must have at least one version");
    }
  }

  /**
   * Get CRD name from group and plural
   */
  private getCRDName(group: string, plural: string): string {
    return `${plural}.${group}`;
  }

  /**
   * Parse API version into group and version
   */
  private parseAPIVersion(apiVersion: string): [string, string] {
    const parts = apiVersion.split("/");
    if (parts.length === 2) {
      return [parts[0], parts[1]];
    }
    return ["", parts[0]];
  }

  /**
   * Create default Application CRD
   */
  static createApplicationCRD(): CustomResourceDefinition {
    return {
      apiVersion: "apiextensions.k8s.io/v1",
      kind: "CustomResourceDefinition",
      metadata: {
        name: "applications.cloudnative.elide.dev",
        labels: {
          "app.kubernetes.io/managed-by": "elide-operator",
        },
      },
      spec: {
        group: "cloudnative.elide.dev",
        scope: "Namespaced",
        names: {
          plural: "applications",
          singular: "application",
          kind: "Application",
          shortNames: ["app", "apps"],
          listKind: "ApplicationList",
          categories: ["all"],
        },
        versions: [
          {
            name: "v1",
            served: true,
            storage: true,
            schema: {
              type: "object",
              properties: {
                spec: {
                  type: "object",
                  required: ["replicas", "image"],
                  properties: {
                    replicas: {
                      type: "integer",
                      minimum: 0,
                      maximum: 100,
                      description: "Number of desired replicas",
                    },
                    image: {
                      type: "string",
                      minLength: 1,
                      description: "Container image to deploy",
                    },
                    strategy: {
                      type: "string",
                      enum: ["RollingUpdate", "Recreate"],
                      default: "RollingUpdate",
                      description: "Deployment strategy",
                    },
                    config: {
                      type: "object",
                      description: "Configuration key-value pairs",
                      additionalProperties: { type: "string" },
                    },
                    resources: {
                      type: "object",
                      description: "Resource requirements",
                      properties: {
                        requests: {
                          type: "object",
                          properties: {
                            cpu: { type: "string" },
                            memory: { type: "string" },
                          },
                        },
                        limits: {
                          type: "object",
                          properties: {
                            cpu: { type: "string" },
                            memory: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
                status: {
                  type: "object",
                  properties: {
                    observedGeneration: {
                      type: "integer",
                      description: "Last observed generation",
                    },
                    replicas: {
                      type: "integer",
                      description: "Total number of replicas",
                    },
                    readyReplicas: {
                      type: "integer",
                      description: "Number of ready replicas",
                    },
                    phase: {
                      type: "string",
                      enum: ["Pending", "Running", "Failed", "Succeeded"],
                      description: "Current phase",
                    },
                    conditions: {
                      type: "array",
                      description: "Status conditions",
                      items: {
                        type: "object",
                        required: ["type", "status"],
                        properties: {
                          type: { type: "string" },
                          status: { type: "string", enum: ["True", "False", "Unknown"] },
                          lastTransitionTime: { type: "string", format: "date-time" },
                          reason: { type: "string" },
                          message: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
            subresources: {
              status: {},
              scale: {
                specReplicasPath: ".spec.replicas",
                statusReplicasPath: ".status.replicas",
                labelSelectorPath: ".status.labelSelector",
              },
            },
            additionalPrinterColumns: [
              {
                name: "Replicas",
                type: "integer",
                jsonPath: ".spec.replicas",
              },
              {
                name: "Ready",
                type: "integer",
                jsonPath: ".status.readyReplicas",
              },
              {
                name: "Phase",
                type: "string",
                jsonPath: ".status.phase",
              },
              {
                name: "Age",
                type: "date",
                jsonPath: ".metadata.creationTimestamp",
              },
            ],
          },
        ],
      },
    };
  }
}
