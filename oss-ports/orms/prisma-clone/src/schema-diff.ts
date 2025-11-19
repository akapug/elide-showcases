/**
 * Schema diffing utilities
 */

import { Schema } from './types';

export function diffSchemas(current: Schema, target: Schema): any {
  return {
    addedModels: [],
    removedModels: [],
    modifiedModels: []
  };
}
