/**
 * OpenTelemetry Resources
 */

import type { Resource, ResourceAttributes } from './types';

export class ResourceImpl implements Resource {
  constructor(public readonly attributes: ResourceAttributes) {}

  merge(other: Resource | null): Resource {
    if (!other) return this;

    return new ResourceImpl({
      ...this.attributes,
      ...other.attributes,
    });
  }
}

export const Resource = {
  default(): Resource {
    return new ResourceImpl({
      'service.name': 'unknown-service',
    });
  },

  create(attributes: ResourceAttributes): Resource {
    return new ResourceImpl(attributes);
  },
};
