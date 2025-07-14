import React from 'react'
import { useForm, Control, FieldValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppStore } from '../../store'
import {
  parseSchemaJson,
  getInputTypeForZodField,
  ZodField,
  getDefaultValueForField,
} from '../../lib/schema'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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

// Helper function to convert Tag objects back to string arrays
const tagsToStringArray = (tags: Tag[]): string[] => tags.map(tag => tag.text)

// Auto-expanding textarea component
const AutoExpandingTextarea: React.FC<
  React.ComponentProps<typeof Textarea>
> = ({ className, ...props }) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [])

  React.useEffect(() => {
    adjustHeight()
  }, [props.value, adjustHeight])

  return (
    <Textarea
      ref={textareaRef}
      className={className}
      onInput={adjustHeight}
      {...props}
    />
  )
}

// Create a flexible form schema that accepts any field as optional string
const createFormSchema = (fields: ZodField[]) => {
  const schemaObject: Record<string, z.ZodTypeAny> = {}

  fields.forEach(field => {
    switch (field.type) {
      case 'Boolean':
        schemaObject[field.name] = z.boolean().optional()
        break
      case 'Number':
        schemaObject[field.name] = z.coerce.number().optional()
        break
      default:
        schemaObject[field.name] = z.string().optional()
    }
  })

  return z.object(schemaObject)
}

// Helper component for rendering different input types
const FrontmatterField: React.FC<{
  name: string
  label: string
  field?: ZodField | undefined
  control: Control<FieldValues>
  onFieldChange: (name: string, value: unknown) => void
  frontmatter: Record<string, unknown>
}> = ({ name, label, field, control, onFieldChange, frontmatter }) => {
  const inputType = field ? getInputTypeForZodField(field.type) : 'text'

  // Helper function to get boolean value considering schema defaults
  const getBooleanValue = React.useCallback(
    (value: unknown) => {
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
    },
    [field?.default]
  )

  return (
    <FormField
      control={control}
      name={name}
      render={({ field: formField }) => (
        <FormItem className="space-y-2">
          {inputType === 'checkbox' || field?.type === 'Boolean' ? (
            // For boolean fields, put label and switch on same line
            <div className="flex items-center justify-between">
              <FormLabel className="text-sm font-medium">
                {label}
                {field && !field.optional && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                <Switch
                  checked={getBooleanValue(formField.value)}
                  onCheckedChange={checked => {
                    formField.onChange(checked)
                    onFieldChange(name, checked)
                  }}
                />
              </FormControl>
            </div>
          ) : (
            <>
              <FormLabel className="text-sm font-medium">
                {label}
                {field && !field.optional && (
                  <span className="text-destructive ml-1">*</span>
                )}
              </FormLabel>
              <FormControl>
                {inputType === 'number' || field?.type === 'Number' ? (
                  <Input
                    type="number"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    value={String(formField.value || '')}
                    onChange={e => {
                      const numValue = e.target.value
                        ? Number(e.target.value)
                        : ''
                      formField.onChange(numValue)
                      onFieldChange(name, numValue)
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
                          : ''
                      formField.onChange(dateValue)
                      onFieldChange(name, dateValue)
                    }}
                    placeholder="Select date..."
                  />
                ) : field?.type === 'Enum' && field?.options ? (
                  <Select
                    value={
                      formField.value ? String(formField.value) : '__NONE__'
                    }
                    onValueChange={value => {
                      // Special sentinel value means clear the field
                      const finalValue =
                        value === '__NONE__' ? undefined : value
                      formField.onChange(finalValue)
                      onFieldChange(name, finalValue)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={`Select ${label.toLowerCase()}...`}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__NONE__">
                        <span className="text-muted-foreground">(None)</span>
                      </SelectItem>
                      {field.options.map(option => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : label.toLowerCase() === 'title' ? (
                  <AutoExpandingTextarea
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    className="min-h-[2.5rem] text-lg resize-none overflow-hidden"
                    value={String(formField.value || '')}
                    onChange={e => {
                      formField.onChange(e.target.value)
                      onFieldChange(name, e.target.value)
                    }}
                  />
                ) : label.toLowerCase() === 'description' ? (
                  <AutoExpandingTextarea
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    className="min-h-[4rem] resize-none overflow-hidden"
                    value={String(formField.value || '')}
                    onChange={e => {
                      formField.onChange(e.target.value)
                      onFieldChange(name, e.target.value)
                    }}
                  />
                ) : field?.type === 'Array' ? (
                  <TagInput
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    tags={React.useMemo(() => {
                      // Get value directly from frontmatter instead of form
                      const currentValue = frontmatter[name]
                      if (
                        Array.isArray(currentValue) &&
                        currentValue.every(
                          (item): item is string => typeof item === 'string'
                        )
                      ) {
                        return currentValue.map((str, index) => ({
                          id: `${name}-${str}-${index}`,
                          text: str,
                        }))
                      }
                      return []
                    }, [frontmatter, name])}
                    onTagsChange={React.useCallback(
                      (tags: Tag[]) => {
                        const stringArray = tagsToStringArray(tags)
                        onFieldChange(name, stringArray)
                      },
                      [onFieldChange, name]
                    )}
                  />
                ) : (
                  <Input
                    type="text"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                    value={String(formField.value || '')}
                    onChange={e => {
                      formField.onChange(e.target.value)
                      onFieldChange(name, e.target.value)
                    }}
                  />
                )}
              </FormControl>
              <FormMessage />
            </>
          )}
        </FormItem>
      )}
    />
  )
}

export const FrontmatterPanel: React.FC = () => {
  const { currentFile, frontmatter, collections, updateFrontmatter } =
    useAppStore()

  // Get schema for current collection
  const currentCollection = currentFile
    ? collections.find(c => c.name === currentFile.collection)
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

  // Create form schema and default values
  const formSchema = React.useMemo(() => {
    const fields = schema?.fields || []
    return createFormSchema(fields)
  }, [schema])

  const defaultValues = React.useMemo(() => {
    const values: Record<string, unknown> = {}
    allFields.forEach(({ fieldName, value, schemaField }) => {
      if (value !== undefined && value !== null && value !== '') {
        values[fieldName] = value
      } else if (schemaField) {
        const defaultVal = getDefaultValueForField(schemaField)
        if (defaultVal !== '' && defaultVal !== 0 && defaultVal !== false) {
          values[fieldName] = defaultVal
        }
      }
    })
    return values
  }, [allFields])

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: 'onChange',
  })

  // Update form when file changes (but not when defaultValues change due to frontmatter updates)
  React.useEffect(() => {
    form.reset(defaultValues)
  }, [currentFile?.path, form])

  // Handle individual field changes - update store directly
  const handleFieldChange = React.useCallback(
    (key: string, value: unknown) => {
      const newFrontmatter = { ...frontmatter }

      // Remove field if value is empty
      const isEmpty =
        value === null ||
        value === undefined ||
        value === '' ||
        (Array.isArray(value) && value.length === 0)

      if (isEmpty) {
        delete newFrontmatter[key]
      } else {
        newFrontmatter[key] = value
      }

      updateFrontmatter(newFrontmatter)
    },
    [frontmatter, updateFrontmatter]
  )

  return (
    <div className="h-full flex flex-col">
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
                    frontmatter={frontmatter}
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
  )
}
