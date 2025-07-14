import React from 'react';
import { useAppStore } from '../../store';
import {
  parseSchemaJson,
  getInputTypeForZodField,
  validateFieldValue,
  ZodField,
} from '../../lib/schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';
import { AutoGrowingInput } from '@/components/ui/auto-growing-input';
import { TagsInput } from '@/components/ui/tags-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

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
        <div className="flex items-center space-x-2">
          <Switch
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
          <span className="text-sm text-muted-foreground">
            {value ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      );
    }

    if (inputType === 'number' || typeof value === 'number') {
      return (
        <Input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={e => onChange(Number(e.target.value))}
          placeholder={
            field?.optional
              ? `${label} (optional)`
              : `Enter ${label.toLowerCase()}...`
          }
        />
      );
    }

    if (inputType === 'date') {
      const dateValue = typeof value === 'string' && value ? new Date(value) : undefined;
      return (
        <DatePicker
          date={dateValue}
          onDateChange={(date) => onChange(date ? date.toISOString().split('T')[0] : '')}
          placeholder="Select date..."
        />
      );
    }

    // Handle arrays as tags
    if (field?.type === 'Array' || Array.isArray(value)) {
      const arrayValue = Array.isArray(value) ? value : [];
      return (
        <TagsInput
          value={arrayValue}
          onChange={onChange as (tags: string[]) => void}
          placeholder={`Add ${label.toLowerCase()}...`}
        />
      );
    }

    // Special handling for title field - use auto-growing input
    if (label.toLowerCase() === 'title') {
      return (
        <AutoGrowingInput
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
          className="text-base font-medium"
        />
      );
    }

    // Special handling for description field - use textarea
    if (label.toLowerCase() === 'description') {
      return (
        <Textarea
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
          className="min-h-[80px] resize-none"
        />
      );
    }

    // Default to string input
    return (
      <Input
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
      />
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <Label className={`text-sm font-medium capitalize ${
        label.toLowerCase() === 'title' ? 'text-base' : ''
      }`}>
        {label}
        {field?.optional ? (
          <span className="text-muted-foreground ml-1 font-normal">(optional)</span>
        ) : field ? (
          <span className="text-destructive ml-1">*</span>
        ) : null}
      </Label>
      {renderInput()}
      {validationError && (
        <span className="text-sm text-destructive">{validationError}</span>
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
      <div className="p-4 border-b bg-muted/30">
        <h3 className="text-base font-semibold text-foreground m-0">
          Frontmatter
        </h3>
        {schema && (
          <p className="text-sm text-muted-foreground mt-1">
            Using {currentCollection?.name} schema
          </p>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {currentFile ? (
          <div className="flex flex-col gap-6">
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
              <Card>
                <CardContent className="flex items-center justify-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No frontmatter fields found.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground text-center">
                Select a file to edit its frontmatter.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
