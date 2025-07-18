import React, { useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePreferences } from '../../../hooks/usePreferences'
import { useCollectionsQuery } from '../../../hooks/queries/useCollectionsQuery'
import { parseSchemaJson } from '../../../lib/schema'
import type { ZodField } from '../../../lib/schema'

const SettingsField: React.FC<{
  label: string
  children: React.ReactNode
  description?: string
}> = ({ label, children, description }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}</Label>
    {children}
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
)

const SettingsSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium">{title}</h3>
      <Separator className="mt-2" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

export const FrontmatterMappingsPane: React.FC = () => {
  const { currentProjectSettings, updateProject, projectPath, projectName } =
    usePreferences()

  // Get collections from TanStack Query
  const { data: collections = [] } = useCollectionsQuery(
    projectPath,
    currentProjectSettings?.pathOverrides?.contentDirectory
  )

  // Get all schema fields from all collections
  const allFields = useMemo(() => {
    const fieldMap = new Map<string, ZodField>()

    collections.forEach((collection) => {
      if (collection.schema) {
        try {
          const schema = parseSchemaJson(collection.schema)
          if (schema) {
            schema.fields.forEach(field => {
              fieldMap.set(field.name, field)
            })
          }
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn(`Failed to parse schema for ${collection.name}:`, error)
        }
      }
    })

    return fieldMap
  }, [collections])

  // Filter fields by type
  const dateFields = useMemo(
    () => Array.from(allFields.values()).filter(field => field.type === 'Date'),
    [allFields]
  )

  const textFields = useMemo(
    () =>
      Array.from(allFields.values()).filter(field => field.type === 'String'),
    [allFields]
  )

  const booleanFields = useMemo(
    () =>
      Array.from(allFields.values()).filter(field => field.type === 'Boolean'),
    [allFields]
  )

  const handleMappingChange = (
    key: 'publishedDate' | 'title' | 'description' | 'draft',
    value: string
  ) => {
    void updateProject({
      frontmatterMappings: {
        ...currentProjectSettings?.frontmatterMappings,
        [key]: value || undefined, // Remove empty strings
      },
    })
  }

  const renderFieldSelect = (
    value: string | undefined,
    onChange: (value: string) => void,
    fields: ZodField[],
    placeholder: string
  ) => (
    <Select
      value={value || 'none'}
      onValueChange={val => onChange(val === 'none' ? '' : val)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Use default</span>
        </SelectItem>
        {fields.map(field => (
          <SelectItem key={field.name} value={field.name}>
            {field.name}
            {field.optional && (
              <span className="text-muted-foreground ml-1">(optional)</span>
            )}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <SettingsSection title="Frontmatter Field Mappings">
        <p className="text-sm text-muted-foreground">
          Map special frontmatter fields used by the app to your{' '}
          <span className="font-medium">{projectName}</span> schema field names.
          Only fields that exist in your collection schemas are shown.
        </p>

        <SettingsField
          label="Published Date Field"
          description="Field used for ordering files in the list (default: date, pubDate, or publishedDate)"
        >
          {renderFieldSelect(
            currentProjectSettings?.frontmatterMappings?.publishedDate,
            value => handleMappingChange('publishedDate', value),
            dateFields,
            'Select date field'
          )}
        </SettingsField>

        <SettingsField
          label="Title Field"
          description="Field that gets special treatment in the frontmatter panel (default: title)"
        >
          {renderFieldSelect(
            currentProjectSettings?.frontmatterMappings?.title,
            value => handleMappingChange('title', value),
            textFields,
            'Select text field'
          )}
        </SettingsField>

        <SettingsField
          label="Description Field"
          description="Field that gets special treatment in the frontmatter panel (default: description)"
        >
          {renderFieldSelect(
            currentProjectSettings?.frontmatterMappings?.description,
            value => handleMappingChange('description', value),
            textFields,
            'Select text field'
          )}
        </SettingsField>

        <SettingsField
          label="Draft Field"
          description="Field that shows a draft marker in the file list (default: draft)"
        >
          {renderFieldSelect(
            currentProjectSettings?.frontmatterMappings?.draft,
            value => handleMappingChange('draft', value),
            booleanFields,
            'Select boolean field'
          )}
        </SettingsField>

        {collections.length === 0 && (
          <div className="text-sm text-muted-foreground p-4 border rounded-lg">
            No collections found. Field options will appear when a project with
            collections is loaded.
          </div>
        )}
      </SettingsSection>
    </div>
  )
}
