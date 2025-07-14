import { describe, it, expect } from 'vitest';
import {
  parseSchemaJson,
  getInputTypeForZodField,
  getDefaultValueForField,
  validateFieldValue,
  type ZodField,
  type ZodFieldType,
} from './schema';

describe('Schema Utilities', () => {
  describe('parseSchemaJson', () => {
    it('should parse valid schema JSON', () => {
      const schemaJson = JSON.stringify({
        type: 'zod',
        fields: [
          { name: 'title', type: 'String', optional: false },
          {
            name: 'description',
            type: 'String',
            optional: true,
            default: 'Default description',
          },
          { name: 'count', type: 'Number', optional: false },
          { name: 'published', type: 'Boolean', optional: true },
        ],
      });

      const result = parseSchemaJson(schemaJson);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('zod');
      expect(result?.fields).toHaveLength(4);
      expect(result?.fields[0].name).toBe('title');
      expect(result?.fields[0].type).toBe('String');
      expect(result?.fields[0].optional).toBe(false);
      expect(result?.fields[1].default).toBe('Default description');
    });

    it('should return null for invalid JSON', () => {
      const result = parseSchemaJson('invalid json');
      expect(result).toBeNull();
    });

    it('should return null for non-zod schema', () => {
      const schemaJson = JSON.stringify({
        type: 'other',
        fields: [],
      });

      const result = parseSchemaJson(schemaJson);
      expect(result).toBeNull();
    });

    it('should return null for schema without fields array', () => {
      const schemaJson = JSON.stringify({
        type: 'zod',
        fields: 'not an array',
      });

      const result = parseSchemaJson(schemaJson);
      expect(result).toBeNull();
    });
  });

  describe('getInputTypeForZodField', () => {
    it('should return correct input types', () => {
      expect(getInputTypeForZodField('String' as ZodFieldType)).toBe('text');
      expect(getInputTypeForZodField('Number' as ZodFieldType)).toBe('number');
      expect(getInputTypeForZodField('Boolean' as ZodFieldType)).toBe(
        'checkbox'
      );
      expect(getInputTypeForZodField('Date' as ZodFieldType)).toBe('date');
      expect(getInputTypeForZodField('Array' as ZodFieldType)).toBe('text');
      expect(getInputTypeForZodField('Enum' as ZodFieldType)).toBe('select');
      expect(getInputTypeForZodField('Unknown' as ZodFieldType)).toBe('text');
    });
  });

  describe('getDefaultValueForField', () => {
    it('should return field default if specified', () => {
      const field: ZodField = {
        name: 'title',
        type: 'String',
        optional: false,
        default: 'Custom default',
      };

      expect(getDefaultValueForField(field)).toBe('Custom default');
    });

    it('should return type-appropriate defaults', () => {
      const stringField: ZodField = {
        name: 'title',
        type: 'String',
        optional: false,
      };
      const numberField: ZodField = {
        name: 'count',
        type: 'Number',
        optional: false,
      };
      const booleanField: ZodField = {
        name: 'published',
        type: 'Boolean',
        optional: false,
      };
      const dateField: ZodField = {
        name: 'date',
        type: 'Date',
        optional: false,
      };
      const arrayField: ZodField = {
        name: 'tags',
        type: 'Array',
        optional: false,
      };

      expect(getDefaultValueForField(stringField)).toBe('');
      expect(getDefaultValueForField(numberField)).toBe(0);
      expect(getDefaultValueForField(booleanField)).toBe(false);
      expect(typeof getDefaultValueForField(dateField)).toBe('string');
      expect(getDefaultValueForField(arrayField)).toEqual([]);
    });
  });

  describe('validateFieldValue', () => {
    it('should validate required fields', () => {
      const requiredField: ZodField = {
        name: 'title',
        type: 'String',
        optional: false,
      };

      expect(validateFieldValue(requiredField, '')).toBe('title is required');
      expect(validateFieldValue(requiredField, null)).toBe('title is required');
      expect(validateFieldValue(requiredField, undefined)).toBe(
        'title is required'
      );
      expect(validateFieldValue(requiredField, 'Valid title')).toBeNull();
    });

    it('should allow empty values for optional fields', () => {
      const optionalField: ZodField = {
        name: 'description',
        type: 'String',
        optional: true,
      };

      expect(validateFieldValue(optionalField, '')).toBeNull();
      expect(validateFieldValue(optionalField, null)).toBeNull();
      expect(validateFieldValue(optionalField, undefined)).toBeNull();
    });

    it('should validate number fields', () => {
      const numberField: ZodField = {
        name: 'count',
        type: 'Number',
        optional: false,
      };

      expect(validateFieldValue(numberField, 'not a number')).toBe(
        'count must be a number'
      );
      expect(validateFieldValue(numberField, '42')).toBeNull();
      expect(validateFieldValue(numberField, 42)).toBeNull();
    });

    it('should validate boolean fields', () => {
      const booleanField: ZodField = {
        name: 'published',
        type: 'Boolean',
        optional: false,
      };

      expect(validateFieldValue(booleanField, 'true')).toBe(
        'published must be a boolean'
      );
      expect(validateFieldValue(booleanField, true)).toBeNull();
      expect(validateFieldValue(booleanField, false)).toBeNull();
    });

    it('should validate date fields', () => {
      const dateField: ZodField = {
        name: 'publishDate',
        type: 'Date',
        optional: false,
      };

      expect(validateFieldValue(dateField, 'invalid date')).toBe(
        'publishDate must be a valid date'
      );
      expect(validateFieldValue(dateField, '2023-12-01')).toBeNull();
      expect(validateFieldValue(dateField, '2023-12-01T10:00:00Z')).toBeNull();
    });
  });
});
