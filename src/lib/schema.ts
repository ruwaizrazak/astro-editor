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

interface ParsedSchemaJson {
  type: 'zod';
  fields: Array<{
    name: string;
    type: string;
    optional: boolean;
    default?: string;
  }>;
}

/**
 * Parse the schema JSON string from the backend into typed schema information
 */
export function parseSchemaJson(schemaJson: string): ParsedSchema | null {
  try {
    const parsed: unknown = JSON.parse(schemaJson);

    // Type guard to check if parsed object has expected structure
    if (!isValidParsedSchema(parsed)) {
      return null;
    }

    const fields: ZodField[] = parsed.fields.map(field => ({
      name: field.name,
      type: field.type as ZodFieldType,
      optional: field.optional || false,
      ...(field.default !== undefined && { default: field.default }),
    }));

    return {
      type: 'zod',
      fields,
    };
  } catch (error) {
    // Use a more specific error handling approach for production
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('Failed to parse schema JSON:', error);
    }
    return null;
  }
}

function isValidParsedSchema(obj: unknown): obj is ParsedSchemaJson {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'type' in obj &&
    obj.type === 'zod' &&
    'fields' in obj &&
    Array.isArray(obj.fields) &&
    obj.fields.every(
      (field: unknown) =>
        typeof field === 'object' &&
        field !== null &&
        'name' in field &&
        typeof field.name === 'string' &&
        'type' in field &&
        typeof field.type === 'string' &&
        'optional' in field &&
        typeof field.optional === 'boolean'
    )
  );
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
export function getDefaultValueForField(
  field: ZodField
): string | number | boolean | string[] {
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
      return new Date().toISOString().split('T')[0] || ''; // YYYY-MM-DD format
    case 'Array':
      return [];
    default:
      return '';
  }
}

/**
 * Validate a field value against its schema
 */
export function validateFieldValue(
  field: ZodField,
  value: unknown
): string | null {
  // If field is optional and value is empty, it's valid
  if (
    field.optional &&
    (value === '' || value === null || value === undefined)
  ) {
    return null;
  }

  // Required field validation
  if (
    !field.optional &&
    (value === '' || value === null || value === undefined)
  ) {
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
      if (value && typeof value === 'string' && isNaN(Date.parse(value))) {
        return `${field.name} must be a valid date`;
      }
      break;
  }

  return null;
}
