import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { Switch } from '../../ui/switch'
import type { FieldProps } from '../../../types/common'
import type { ZodField } from '../../../lib/schema'

interface BooleanFieldProps extends FieldProps {
  field?: ZodField
}

export const BooleanField: React.FC<BooleanFieldProps> = ({
  name,
  label,
  field,
}) => {
  const { frontmatter, updateFrontmatterField } = useEditorStore()

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
      <label className="text-sm font-medium text-foreground">
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
