import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { useEffectiveSettings } from '../../../lib/project-registry/effective-settings'
import { getInputTypeForZodField, type ZodField } from '../../../lib/schema'
import { StringField } from './StringField'
import { TextareaField } from './TextareaField'
import { NumberField } from './NumberField'
import { BooleanField } from './BooleanField'
import { DateField } from './DateField'
import { EnumField } from './EnumField'
import { ArrayField } from './ArrayField'

interface FrontmatterFieldProps {
  name: string
  label: string
  field?: ZodField
}

export const FrontmatterField: React.FC<FrontmatterFieldProps> = ({
  name,
  label,
  field,
}) => {
  const { frontmatter } = useEditorStore()
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
        className="text-lg font-bold text-gray-900 dark:text-white"
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
