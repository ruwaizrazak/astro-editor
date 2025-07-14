export interface ZodField {
  name: string;
  type: ZodFieldType;
  optional: boolean;
  default?: string;
}

export type ZodFieldType = 
  | 'String'
  | 'Number' 
  | 'Boolean'
  | 'Date'
  | 'Array'
  | 'Enum'
  | 'Unknown';

export interface ParsedSchema {
  type: 'zod';
  fields: ZodField[];
}

/**
 * Parse the schema JSON string from the backend into typed schema information
 */
export function parseSchemaJson(schemaJson: string): ParsedSchema | null {
  try {
    const parsed = JSON.parse(schemaJson);
    
    if (parsed.type !== 'zod' || !Array.isArray(parsed.fields)) {
      return null;
    }

    const fields: ZodField[] = parsed.fields.map((field: any) => ({
      name: field.name,
      type: field.type as ZodFieldType,
      optional: field.optional || false,
      default: field.default,
    }));

    return {
      type: 'zod',
      fields,
    };
  } catch (error) {
    console.error('Failed to parse schema JSON:', error);
    return null;
  }
}

/**
 * Get the appropriate input type for a form field based on Zod type
 */
export function getInputTypeForZodField(fieldType: ZodFieldType): string {
  switch (fieldType) {
    case 'String':
      return 'text';
    case 'Number':
      return 'number';
    case 'Boolean':
      return 'checkbox';
    case 'Date':
      return 'date';
    case 'Array':
      return 'text'; // Will handle as comma-separated values
    case 'Enum':
      return 'select';
    default:
      return 'text';
  }
}

/**
 * Create a default value for a field based on its type and schema
 */
export function getDefaultValueForField(field: ZodField): any {
  if (field.default !== undefined) {
    return field.default;
  }

  switch (field.type) {
    case 'String':
      return '';
    case 'Number':
      return 0;
    case 'Boolean':
      return false;
    case 'Date':
      return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    case 'Array':
      return [];
    default:
      return '';
  }
}

/**
 * Validate a field value against its schema
 */
export function validateFieldValue(field: ZodField, value: any): string | null {
  // If field is optional and value is empty, it's valid
  if (field.optional && (value === '' || value === null || value === undefined)) {
    return null;
  }

  // Required field validation
  if (!field.optional && (value === '' || value === null || value === undefined)) {
    return `${field.name} is required`;
  }

  // Type-specific validation
  switch (field.type) {
    case 'Number':
      if (isNaN(Number(value))) {
        return `${field.name} must be a number`;
      }
      break;
    case 'Boolean':
      if (typeof value !== 'boolean') {
        return `${field.name} must be a boolean`;
      }
      break;
    case 'Date':
      if (value && isNaN(Date.parse(value))) {
        return `${field.name} must be a valid date`;
      }
      break;
  }

  return null;
}