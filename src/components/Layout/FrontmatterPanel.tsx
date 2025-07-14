import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAppStore } from '../../store';
import {
  parseSchemaJson,
  getInputTypeForZodField,
  ZodField,
  getDefaultValueForField,
} from '../../lib/schema';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/ui/date-picker';

// Create a flexible form schema that accepts any field as optional string
const createFormSchema = (fields: ZodField[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {};

  fields.forEach(field => {
    switch (field.type) {
      case 'Boolean':
        schemaObject[field.name] = z.boolean().optional();
        break;
      case 'Number':
        schemaObject[field.name] = z.coerce.number().optional();
        break;
      default:
        schemaObject[field.name] = z.string().optional();
    }
  });

  return z.object(schemaObject);
};

// Helper component for rendering different input types
const FrontmatterField: React.FC<{
  name: string;
  label: string;
  field?: ZodField;
  control: ReturnType<typeof useForm>['control'];
  onFieldChange: (name: string, value: unknown) => void;
}> = ({ name, label, field, control, onFieldChange }) => {
  const inputType = field ? getInputTypeForZodField(field.type) : 'text';

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: formField }) => (
        <FormItem className="space-y-2">
          <FormLabel
            className={`text-sm font-medium ${
              label.toLowerCase() === 'title' ? 'text-base' : ''
            }`}
          >
            {label}
            {field && !field.optional && (
              <span className="text-destructive ml-1">*</span>
            )}
          </FormLabel>
          <FormControl>
            {inputType === 'checkbox' || field?.type === 'Boolean' ? (
              <div className="flex items-center justify-end">
                <Switch
                  checked={Boolean(formField.value)}
                  onCheckedChange={checked => {
                    formField.onChange(checked);
                    onFieldChange(name, checked);
                  }}
                />
              </div>
            ) : inputType === 'number' || field?.type === 'Number' ? (
              <Input
                type="number"
                placeholder={`Enter ${label.toLowerCase()}...`}
                value={String(formField.value || '')}
                onChange={e => {
                  const numValue = e.target.value ? Number(e.target.value) : '';
                  formField.onChange(numValue);
                  onFieldChange(name, numValue);
                }}
              />
            ) : inputType === 'date' || field?.type === 'Date' ? (
              <DatePicker
                {...(formField.value && {
                  value: new Date(String(formField.value)),
                })}
                onChange={(date: Date | undefined) => {
                  const dateValue =
                    date instanceof Date && !isNaN(date.getTime())
                      ? date.toISOString().split('T')[0]
                      : '';
                  formField.onChange(dateValue);
                  onFieldChange(name, dateValue);
                }}
                placeholder="Select date..."
              />
            ) : label.toLowerCase() === 'title' ? (
              <Textarea
                placeholder={`Enter ${label.toLowerCase()}...`}
                className="min-h-[2.5rem] resize-none"
                value={String(formField.value || '')}
                onChange={e => {
                  formField.onChange(e.target.value);
                  onFieldChange(name, e.target.value);
                }}
              />
            ) : label.toLowerCase() === 'description' ? (
              <Textarea
                placeholder={`Enter ${label.toLowerCase()}...`}
                className="min-h-[4rem]"
                value={String(formField.value || '')}
                onChange={e => {
                  formField.onChange(e.target.value);
                  onFieldChange(name, e.target.value);
                }}
              />
            ) : (
              <Input
                type="text"
                placeholder={`Enter ${label.toLowerCase()}...`}
                value={String(formField.value || '')}
                onChange={e => {
                  formField.onChange(e.target.value);
                  onFieldChange(name, e.target.value);
                }}
              />
            )}
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
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

  // Get all fields to display
  const allFields = React.useMemo(() => {
    if (schema) {
      // Start with all schema fields
      const schemaFields = schema.fields.map(field => ({
        fieldName: field.name,
        schemaField: field,
        value: frontmatter[field.name] || getDefaultValueForField(field),
      }));

      // Add any extra frontmatter fields that aren't in the schema
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

  // Create form schema and default values
  const formSchema = React.useMemo(() => {
    const fields = schema?.fields || [];
    return createFormSchema(fields);
  }, [schema]);

  const defaultValues = React.useMemo(() => {
    const values: Record<string, unknown> = {};
    allFields.forEach(({ fieldName, value, schemaField }) => {
      if (value !== undefined && value !== null && value !== '') {
        values[fieldName] = value;
      } else if (schemaField) {
        const defaultVal = getDefaultValueForField(schemaField);
        if (defaultVal !== '' && defaultVal !== 0 && defaultVal !== false) {
          values[fieldName] = defaultVal;
        }
      }
    });
    return values;
  }, [allFields]);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Update form when frontmatter changes (but only when currentFile changes)
  React.useEffect(() => {
    form.reset(defaultValues);
  }, [currentFile?.path]); // Only reset when file changes, not when frontmatter changes

  // Handle individual field changes
  const handleFieldChange = React.useCallback(
    (key: string, value: unknown) => {
      const newFrontmatter = { ...frontmatter };

      // Remove field if value is empty
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
    },
    [frontmatter, updateFrontmatter]
  );

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Frontmatter</h3>
        {schema && (
          <p className="text-sm text-muted-foreground mt-1">
            Using {currentCollection?.name} schema
          </p>
        )}
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {currentFile ? (
          allFields.length > 0 ? (
            <Form {...form}>
              <form className="space-y-6">
                {allFields.map(({ fieldName, schemaField }) => (
                  <FrontmatterField
                    key={fieldName}
                    name={fieldName}
                    label={fieldName}
                    field={schemaField}
                    control={form.control}
                    onFieldChange={handleFieldChange}
                  />
                ))}
              </form>
            </Form>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">
                No frontmatter fields found.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              Select a file to edit its frontmatter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
