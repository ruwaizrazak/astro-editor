import React from 'react';
import { useAppStore } from '../../store';
import {
  parseSchemaJson,
  getInputTypeForZodField,
  validateFieldValue,
  ZodField,
} from '../../lib/schema';

// Helper component for rendering different input types
const FrontmatterField: React.FC<{
  key: string;
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  field?: ZodField;
}> = ({ label, value, onChange, field }) => {
  const validationError = field ? validateFieldValue(field, value) : null;

  const renderInput = () => {
    // Use schema information if available
    const inputType = field ? getInputTypeForZodField(field.type) : 'text';

    if (inputType === 'checkbox' || typeof value === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={e => onChange(e.target.checked)}
            className="rounded border-border"
          />
          <span className="text-xs text-muted-foreground">
            {value ? 'True' : 'False'}
          </span>
        </label>
      );
    }

    if (inputType === 'number' || typeof value === 'number') {
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={
            field?.optional
              ? `${label} (optional)`
              : `Enter ${label.toLowerCase()}...`
          }
          className="px-2 py-2 border border-border rounded text-xs bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    if (inputType === 'date') {
      return (
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={e => onChange(e.target.value)}
          className="px-2 py-2 border border-border rounded text-xs bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    // Handle arrays as comma-separated strings
    if (field?.type === 'Array' || Array.isArray(value)) {
      return (
        <input
          type="text"
          value={
            Array.isArray(value)
              ? value.join(',')
              : typeof value === 'string'
                ? value
                : ''
          }
          onChange={e => {
            const arrayValue = e.target.value
              .split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);
            onChange(arrayValue);
          }}
          placeholder={`Enter ${label.toLowerCase()} (comma-separated)${field?.optional ? ' - optional' : ''}...`}
          className="px-2 py-2 border border-border rounded text-xs bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    }

    // Default to string input
    return (
      <input
        type="text"
        value={
          typeof value === 'string'
            ? value
            : typeof value === 'number'
              ? String(value)
              : ''
        }
        onChange={e => onChange(e.target.value)}
        placeholder={
          field?.optional
            ? `${label} (optional)`
            : `Enter ${label.toLowerCase()}...`
        }
        className="px-2 py-2 border border-border rounded text-xs bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    );
  };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-foreground capitalize">
        {label}
        {field?.optional ? (
          <span className="text-muted-foreground ml-1">(optional)</span>
        ) : field ? (
          <span className="text-red-500 ml-1">*</span>
        ) : null}
      </label>
      {renderInput()}
      {validationError && (
        <span className="text-xs text-red-500">{validationError}</span>
      )}
    </div>
  );
};

export const FrontmatterPanel: React.FC = () => {
  const { currentFile, frontmatter, updateFrontmatter, collections } =
    useAppStore();

  // Get schema for current collection
  const currentCollection = currentFile
    ? collections.find(c => c.name === currentFile.collection)
    : null;

  const schema = currentCollection?.schema
    ? parseSchemaJson(currentCollection.schema)
    : null;

  // Debug frontmatter panel state
  React.useEffect(() => {
    if (currentFile) {
      console.log('=== FRONTMATTER PANEL STATE ===');
      console.log('Current file:', currentFile);
      console.log('Current collection:', currentCollection);
      console.log('Raw schema string:', currentCollection?.schema);
      console.log('Parsed schema:', schema);
      console.log('Current frontmatter:', frontmatter);
      
      if (schema) {
        console.log('Schema fields:', schema.fields.map(f => ({
          name: f.name,
          type: f.type,
          optional: f.optional
        })));
      }
    }
  }, [currentFile, currentCollection, schema, frontmatter]);

  const handleFieldChange = (key: string, value: unknown) => {
    const newFrontmatter = { ...frontmatter };

    // Remove field if value is empty (null, undefined, empty string, or empty array)
    const isEmpty =
      value === null ||
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      delete newFrontmatter[key];
    } else {
      newFrontmatter[key] = value;
    }

    updateFrontmatter(newFrontmatter);
  };

  // Show all schema fields first, then any additional frontmatter fields not in schema
  const allFields = React.useMemo(() => {
    if (schema) {
      // Start with all schema fields
      const schemaFields = schema.fields.map(field => ({
        fieldName: field.name,
        schemaField: field,
        value: frontmatter[field.name], // Will be undefined if not in frontmatter
      }));

      // Add any extra frontmatter fields that aren't in the schema (sorted alphabetically)
      const schemaFieldNames = new Set(schema.fields.map(f => f.name));
      const extraFields = Object.keys(frontmatter)
        .filter(key => !schemaFieldNames.has(key))
        .sort()
        .map(fieldName => ({
          fieldName,
          schemaField: undefined,
          value: frontmatter[fieldName],
        }));

      return [...schemaFields, ...extraFields];
    } else {
      // No schema available, just show existing frontmatter fields
      return Object.keys(frontmatter).map(fieldName => ({
        fieldName,
        schemaField: undefined,
        value: frontmatter[fieldName],
      }));
    }
  }, [frontmatter, schema]);

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground m-0">
          Frontmatter
        </h3>
        {schema && (
          <p className="text-xs text-muted-foreground mt-1">
            Using {currentCollection?.name} schema
          </p>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {currentFile ? (
          <div className="flex flex-col gap-4">
            {allFields.length > 0 ? (
              allFields.map(({ fieldName, schemaField, value }) => (
                <FrontmatterField
                  key={fieldName}
                  label={fieldName}
                  value={value}
                  field={schemaField}
                  onChange={newValue => handleFieldChange(fieldName, newValue)}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground text-xs">
                No frontmatter fields found.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-muted-foreground text-xs mt-10">
            Select a file to edit its frontmatter.
          </div>
        )}
      </div>
    </div>
  );
};
