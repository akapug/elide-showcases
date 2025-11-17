/**
 * Content Type Validator
 * Validates content type definitions
 */

export function validateContentType(definition) {
  const errors = [];

  // Required fields
  if (!definition.singularName) {
    errors.push('singularName is required');
  }

  if (!definition.pluralName) {
    errors.push('pluralName is required');
  }

  if (!definition.displayName) {
    errors.push('displayName is required');
  }

  if (!definition.attributes || typeof definition.attributes !== 'object') {
    errors.push('attributes must be an object');
  }

  // Validate singular/plural names
  if (definition.singularName && !/^[a-z][a-zA-Z0-9]*$/.test(definition.singularName)) {
    errors.push('singularName must start with lowercase letter and contain only alphanumeric characters');
  }

  if (definition.pluralName && !/^[a-z][a-zA-Z0-9]*$/.test(definition.pluralName)) {
    errors.push('pluralName must start with lowercase letter and contain only alphanumeric characters');
  }

  // Validate kind
  if (definition.kind && !['collectionType', 'singleType', 'component'].includes(definition.kind)) {
    errors.push('kind must be one of: collectionType, singleType, component');
  }

  // Validate attributes
  if (definition.attributes) {
    for (const [name, attribute] of Object.entries(definition.attributes)) {
      const attrErrors = validateAttribute(name, attribute);
      errors.push(...attrErrors);
    }
  }

  if (errors.length > 0) {
    throw new ValidationError('Content type validation failed', errors);
  }

  return true;
}

export function validateAttribute(name, attribute) {
  const errors = [];

  if (!attribute.type) {
    errors.push(`Attribute ${name}: type is required`);
    return errors;
  }

  // Validate field name
  if (!/^[a-z][a-zA-Z0-9_]*$/.test(name)) {
    errors.push(`Attribute ${name}: name must start with lowercase letter and contain only alphanumeric characters and underscores`);
  }

  // Reserved names
  const reserved = ['id', 'createdAt', 'updatedAt', 'publishedAt', 'createdBy', 'updatedBy'];
  if (reserved.includes(name)) {
    errors.push(`Attribute ${name}: name is reserved`);
  }

  // Validate by type
  switch (attribute.type) {
    case 'string':
    case 'text':
    case 'richtext':
      validateStringAttribute(name, attribute, errors);
      break;

    case 'email':
    case 'password':
    case 'uid':
      validateStringAttribute(name, attribute, errors);
      break;

    case 'integer':
    case 'biginteger':
    case 'float':
    case 'decimal':
      validateNumberAttribute(name, attribute, errors);
      break;

    case 'date':
    case 'time':
    case 'datetime':
    case 'timestamp':
      validateDateAttribute(name, attribute, errors);
      break;

    case 'boolean':
      validateBooleanAttribute(name, attribute, errors);
      break;

    case 'enumeration':
      validateEnumerationAttribute(name, attribute, errors);
      break;

    case 'json':
      validateJSONAttribute(name, attribute, errors);
      break;

    case 'media':
      validateMediaAttribute(name, attribute, errors);
      break;

    case 'relation':
      validateRelationAttribute(name, attribute, errors);
      break;

    case 'component':
      validateComponentAttribute(name, attribute, errors);
      break;

    case 'dynamiczone':
      validateDynamicZoneAttribute(name, attribute, errors);
      break;

    default:
      errors.push(`Attribute ${name}: unknown type ${attribute.type}`);
  }

  return errors;
}

function validateStringAttribute(name, attribute, errors) {
  if (attribute.minLength !== undefined && typeof attribute.minLength !== 'number') {
    errors.push(`Attribute ${name}: minLength must be a number`);
  }

  if (attribute.maxLength !== undefined && typeof attribute.maxLength !== 'number') {
    errors.push(`Attribute ${name}: maxLength must be a number`);
  }

  if (attribute.regex !== undefined && typeof attribute.regex !== 'string') {
    errors.push(`Attribute ${name}: regex must be a string`);
  }
}

function validateNumberAttribute(name, attribute, errors) {
  if (attribute.min !== undefined && typeof attribute.min !== 'number') {
    errors.push(`Attribute ${name}: min must be a number`);
  }

  if (attribute.max !== undefined && typeof attribute.max !== 'number') {
    errors.push(`Attribute ${name}: max must be a number`);
  }
}

function validateDateAttribute(name, attribute, errors) {
  // Date attributes are generally simple
  if (attribute.default && typeof attribute.default !== 'string') {
    errors.push(`Attribute ${name}: default must be a string`);
  }
}

function validateBooleanAttribute(name, attribute, errors) {
  if (attribute.default !== undefined && typeof attribute.default !== 'boolean') {
    errors.push(`Attribute ${name}: default must be a boolean`);
  }
}

function validateEnumerationAttribute(name, attribute, errors) {
  if (!attribute.enum || !Array.isArray(attribute.enum)) {
    errors.push(`Attribute ${name}: enum must be an array`);
  } else if (attribute.enum.length === 0) {
    errors.push(`Attribute ${name}: enum must have at least one value`);
  }
}

function validateJSONAttribute(name, attribute, errors) {
  // JSON attributes are flexible
}

function validateMediaAttribute(name, attribute, errors) {
  if (attribute.allowedTypes && !Array.isArray(attribute.allowedTypes)) {
    errors.push(`Attribute ${name}: allowedTypes must be an array`);
  }

  if (attribute.multiple !== undefined && typeof attribute.multiple !== 'boolean') {
    errors.push(`Attribute ${name}: multiple must be a boolean`);
  }
}

function validateRelationAttribute(name, attribute, errors) {
  if (!attribute.relation) {
    errors.push(`Attribute ${name}: relation type is required`);
  }

  const validRelations = ['oneToOne', 'oneToMany', 'manyToOne', 'manyToMany'];
  if (attribute.relation && !validRelations.includes(attribute.relation)) {
    errors.push(`Attribute ${name}: relation must be one of ${validRelations.join(', ')}`);
  }

  if (!attribute.target) {
    errors.push(`Attribute ${name}: target content type is required`);
  }
}

function validateComponentAttribute(name, attribute, errors) {
  if (!attribute.component) {
    errors.push(`Attribute ${name}: component reference is required`);
  }

  if (attribute.repeatable !== undefined && typeof attribute.repeatable !== 'boolean') {
    errors.push(`Attribute ${name}: repeatable must be a boolean`);
  }
}

function validateDynamicZoneAttribute(name, attribute, errors) {
  if (!attribute.components || !Array.isArray(attribute.components)) {
    errors.push(`Attribute ${name}: components must be an array`);
  } else if (attribute.components.length === 0) {
    errors.push(`Attribute ${name}: components must have at least one component`);
  }
}

export class ValidationError extends Error {
  constructor(message, errors) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}
