import React from 'react'
import { useAppStore, type Collection } from '../../store'
import { useCollectionsQuery } from '../../hooks/queries/useCollectionsQuery'
import {
  parseSchemaJson,
  getInputTypeForZodField,
  type ZodField,
  getDefaultValueForField,
} from '../../lib/schema'
import { camelCaseToTitleCase } from '../../lib/utils'
import { Input } from '@/components/ui/input'
import { AutoExpandingTextarea } from '@/components/ui/auto-expanding-textarea'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { TagInput, type Tag } from '@/components/ui/tag-input'
import type { FieldProps } from '../../types/common'
import { useEffectiveSettings } from '../../lib/project-registry/utils-effective'

// Helper function to convert Tag objects back to string arrays
const tagsToStringArray = (tags: Tag[]): string[] => tags.map(tag => tag.text)

// Helper function to safely convert frontmatter values to strings
const valueToString = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.join(',')
  return ''
}

// Individual field components that read/write directly to store
interface StringFieldProps extends FieldProps {
  placeholder?: string
}

const StringField: React.FC<StringFieldProps> = ({
  name,
  label,
  placeholder,
  className,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        type="text"
        name={name}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        className={className}
        value={valueToString(frontmatter[name])}
        onChange={e => updateFrontmatterField(name, e.target.value)}
      />
    </div>
  )
}

interface TextareaFieldProps extends FieldProps {
  placeholder?: string
  minRows?: number
  maxRows?: number
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  name,
  label,
  placeholder,
  className,
  minRows = 2,
  maxRows = 6,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <AutoExpandingTextarea
        id={name === 'title' ? 'frontmatter-title-field' : undefined}
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        className={className}
        minRows={minRows}
        maxRows={maxRows}
        value={valueToString(frontmatter[name])}
        onChange={e => updateFrontmatterField(name, e.target.value)}
      />
    </div>
  )
}

interface NumberFieldProps extends FieldProps {
  placeholder?: string
}

const NumberField: React.FC<NumberFieldProps> = ({
  name,
  label,
  placeholder,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Input
        type="number"
        placeholder={placeholder || `Enter ${label.toLowerCase()}...`}
        value={valueToString(frontmatter[name])}
        onChange={e => {
          const numValue = e.target.value ? Number(e.target.value) : undefined
          updateFrontmatterField(name, numValue)
        }}
      />
    </div>
  )
}

interface BooleanFieldProps extends FieldProps {
  field?: ZodField
}

const BooleanField: React.FC<BooleanFieldProps> = ({ name, label, field }) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  // Helper function to get boolean value considering schema defaults
  const getBooleanValue = (value: unknown) => {
    // If field has a value, use it (handling both boolean and string values)
    if (value !== undefined && value !== null && value !== '') {
      return value === true || value === 'true'
    }

    // If no value, check schema default
    if (field?.default !== undefined) {
      if (field.default === 'true') {
        return true
      }
      if (field.default === 'false') {
        return false
      }
      // For other values, convert to boolean
      return Boolean(field.default)
    }

    // Fallback to false for boolean fields
    return false
  }

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">
        {label}
        {field && !field.optional && (
          <span className="text-destructive ml-1">*</span>
        )}
      </label>
      <Switch
        checked={getBooleanValue(frontmatter[name])}
        onCheckedChange={checked => updateFrontmatterField(name, checked)}
      />
    </div>
  )
}

const DateField: React.FC<FieldProps> = ({ name, label, required }) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <DatePicker
        value={
          frontmatter[name] && typeof frontmatter[name] === 'string'
            ? new Date(frontmatter[name])
            : undefined
        }
        onChange={(date: Date | undefined) => {
          const dateValue =
            date instanceof Date && !isNaN(date.getTime())
              ? date.toISOString().split('T')[0]
              : undefined
          updateFrontmatterField(name, dateValue)
        }}
        placeholder="Select date..."
      />
    </div>
  )
}

interface EnumFieldProps extends FieldProps {
  options: string[]
}

const EnumField: React.FC<EnumFieldProps> = ({
  name,
  label,
  options,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <Select
        value={
          frontmatter[name] && typeof frontmatter[name] === 'string'
            ? frontmatter[name]
            : '__NONE__'
        }
        onValueChange={value => {
          // Special sentinel value means clear the field
          const finalValue = value === '__NONE__' ? undefined : value
          updateFrontmatterField(name, finalValue)
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}...`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__NONE__">
            <span className="text-muted-foreground">(None)</span>
          </SelectItem>
          {options.map(option => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

const ArrayField: React.FC<FieldProps> = ({ name, label, required }) => {
  const { frontmatter, updateFrontmatterField } = useAppStore()

  // Convert frontmatter array to tags
  const currentValue = frontmatter[name]
  const tags =
    Array.isArray(currentValue) &&
    currentValue.every((item): item is string => typeof item === 'string')
      ? currentValue.map((str, index) => ({
          id: `${name}-${str}-${index}`,
          text: str,
        }))
      : []

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <TagInput
        placeholder={`Enter ${label.toLowerCase()}...`}
        tags={tags}
        onTagsChange={(newTags: Tag[]) => {
          const stringArray = tagsToStringArray(newTags)
          updateFrontmatterField(
            name,
            stringArray.length > 0 ? stringArray : undefined
          )
        }}
      />
    </div>
  )
}

// Main field component that delegates to specific field types
interface FrontmatterFieldProps {
  name: string
  label: string
  field?: ZodField
}

const FrontmatterField: React.FC<FrontmatterFieldProps> = ({
  name,
  label,
  field,
}) => {
  const { frontmatter } = useAppStore()
  const { frontmatterMappings } = useEffectiveSettings()
  const inputType = field ? getInputTypeForZodField(field.type) : 'text'
  const required = field ? !field.optional : false

  // Check if this field should be treated as an array based on schema or frontmatter value
  const shouldUseArrayField =
    field?.type === 'Array' ||
    (!field &&
      Array.isArray(frontmatter[name]) &&
      frontmatter[name].every((item: unknown) => typeof item === 'string'))

  if (inputType === 'checkbox' || field?.type === 'Boolean') {
    return <BooleanField name={name} label={label} field={field} />
  }

  if (inputType === 'number' || field?.type === 'Number') {
    return <NumberField name={name} label={label} required={required} />
  }

  if (inputType === 'date' || field?.type === 'Date') {
    return <DateField name={name} label={label} required={required} />
  }

  if (field?.type === 'Enum' && field?.options) {
    return (
      <EnumField
        name={name}
        label={label}
        options={field.options}
        required={required}
      />
    )
  }

  if (shouldUseArrayField) {
    return <ArrayField name={name} label={label} required={required} />
  }

  // Check if this field should get special treatment based on effective settings
  if (name === frontmatterMappings.title) {
    return (
      <TextareaField
        name={name}
        label={label}
        className="text-lg font-bold"
        minRows={1}
        maxRows={3}
        required={required}
      />
    )
  }

  if (name === frontmatterMappings.description) {
    return (
      <TextareaField
        name={name}
        label={label}
        minRows={3}
        maxRows={16}
        required={required}
      />
    )
  }

  // Default to string field
  return <StringField name={name} label={label} required={required} />
}

export const FrontmatterPanel: React.FC = () => {
  const { currentFile, frontmatter, projectPath, currentProjectSettings } =
    useAppStore()

  // Use TanStack Query to fetch collections
  const { data: collections = [] } = useCollectionsQuery(
    projectPath,
    currentProjectSettings?.pathOverrides?.contentDirectory
  )

  // Get schema for current collection
  const currentCollection: Collection | null = currentFile
    ? collections.find(c => c.name === currentFile.collection) || null
    : null

  const schema = currentCollection?.schema
    ? parseSchemaJson(currentCollection.schema)
    : null

  // Get all fields to display
  const allFields = React.useMemo(() => {
    if (schema) {
      // Start with all schema fields
      const schemaFields = schema.fields.map(field => ({
        fieldName: field.name,
        schemaField: field,
        value: frontmatter[field.name] || getDefaultValueForField(field),
      }))

      // Add any extra frontmatter fields that aren't in the schema
      const schemaFieldNames = new Set(schema.fields.map(f => f.name))
      const extraFields = Object.keys(frontmatter)
        .filter(key => !schemaFieldNames.has(key))
        .sort()
        .map(fieldName => ({
          fieldName,
          schemaField: undefined,
          value: frontmatter[fieldName],
        }))

      return [...schemaFields, ...extraFields]
    } else {
      // No schema available, just show existing frontmatter fields
      return Object.keys(frontmatter).map(fieldName => ({
        fieldName,
        schemaField: undefined,
        value: frontmatter[fieldName],
      }))
    }
  }, [frontmatter, schema])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 p-4 overflow-y-auto">
        {currentFile ? (
          allFields.length > 0 ? (
            <div className="space-y-6">
              {allFields.map(({ fieldName, schemaField }) => (
                <FrontmatterField
                  key={fieldName}
                  name={fieldName}
                  label={camelCaseToTitleCase(fieldName)}
                  field={schemaField}
                />
              ))}
            </div>
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
  )
}
