/**
 * Input Validators
 *
 * Validation functions for API requests
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate code generation request
 */
export function validateGenerateRequest(data: any): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!data.prompt || typeof data.prompt !== 'string') {
    errors.push('Field "prompt" is required and must be a string');
  } else if (data.prompt.length < 3) {
    errors.push('Field "prompt" must be at least 3 characters');
  } else if (data.prompt.length > 10000) {
    errors.push('Field "prompt" must be at most 10,000 characters');
  }

  // Check optional fields
  if (data.language && typeof data.language !== 'string') {
    errors.push('Field "language" must be a string');
  }

  if (data.framework && typeof data.framework !== 'string') {
    errors.push('Field "framework" must be a string');
  }

  // Validate language if provided
  const validLanguages = [
    'typescript', 'javascript', 'python', 'ruby', 'java',
    'html', 'css', 'jsx', 'tsx', 'vue', 'go', 'rust',
  ];
  if (data.language && !validLanguages.includes(data.language.toLowerCase())) {
    errors.push(`Language must be one of: ${validLanguages.join(', ')}`);
  }

  // Validate framework if provided
  const validFrameworks = ['react', 'vue', 'angular', 'svelte', 'vanilla', 'none'];
  if (data.framework && !validFrameworks.includes(data.framework.toLowerCase())) {
    errors.push(`Framework must be one of: ${validFrameworks.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate preview request
 */
export function validatePreviewRequest(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.code || typeof data.code !== 'string') {
    errors.push('Field "code" is required and must be a string');
  } else if (data.code.length > 1000000) {
    errors.push('Code size must be less than 1MB');
  }

  if (data.files && !Array.isArray(data.files)) {
    errors.push('Field "files" must be an array');
  }

  if (data.language && typeof data.language !== 'string') {
    errors.push('Field "language" must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate transpile request
 */
export function validateTranspileRequest(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.code || typeof data.code !== 'string') {
    errors.push('Field "code" is required and must be a string');
  } else if (data.code.length > 1000000) {
    errors.push('Code size must be less than 1MB');
  }

  if (!data.from || typeof data.from !== 'string') {
    errors.push('Field "from" is required and must be a string');
  }

  if (!data.to || typeof data.to !== 'string') {
    errors.push('Field "to" is required and must be a string');
  }

  const validLanguages = ['typescript', 'javascript', 'jsx', 'tsx', 'vue'];
  if (data.from && !validLanguages.includes(data.from.toLowerCase())) {
    errors.push(`Source language must be one of: ${validLanguages.join(', ')}`);
  }

  if (data.to && !validLanguages.includes(data.to.toLowerCase())) {
    errors.push(`Target language must be one of: ${validLanguages.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate export request
 */
export function validateExportRequest(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data.files || !Array.isArray(data.files)) {
    errors.push('Field "files" is required and must be an array');
  } else if (data.files.length === 0) {
    errors.push('At least one file is required');
  } else if (data.files.length > 100) {
    errors.push('Maximum 100 files allowed');
  }

  // Validate each file
  if (Array.isArray(data.files)) {
    for (let i = 0; i < data.files.length; i++) {
      const file = data.files[i];
      if (!file.path || typeof file.path !== 'string') {
        errors.push(`File ${i}: "path" is required and must be a string`);
      }
      if (!file.content || typeof file.content !== 'string') {
        errors.push(`File ${i}: "content" is required and must be a string`);
      }
      if (file.content && file.content.length > 1000000) {
        errors.push(`File ${i}: Content size must be less than 1MB`);
      }
    }
  }

  const validFormats = ['zip', 'tar', 'tar.gz'];
  if (data.format && !validFormats.includes(data.format)) {
    errors.push(`Format must be one of: ${validFormats.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize filename to prevent path traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/^\/+/, '')  // Remove leading slashes
    .replace(/\/+/g, '/') // Normalize slashes
    .trim();
}

/**
 * Validate file path
 */
export function validateFilePath(path: string): boolean {
  // Must not contain ..
  if (path.includes('..')) {
    return false;
  }

  // Must not start with /
  if (path.startsWith('/')) {
    return false;
  }

  // Must not contain null bytes
  if (path.includes('\0')) {
    return false;
  }

  return true;
}

/**
 * Sanitize code to prevent XSS
 */
export function sanitizeCode(code: string): string {
  // Remove potential script tags
  return code
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}
