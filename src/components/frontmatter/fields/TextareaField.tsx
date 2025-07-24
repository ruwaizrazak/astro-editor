import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { AutoExpandingTextarea } from '../../ui/auto-expanding-textarea'
import { valueToString } from '../utils'
import type { FieldProps } from '../../../types/common'

interface TextareaFieldProps extends FieldProps {
  placeholder?: string
  minRows?: number
  maxRows?: number
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  name,
  label,
  placeholder,
  className,
  minRows = 2,
  maxRows = 6,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useEditorStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && (
          <span className="text-[var(--color-required)] ml-1">*</span>
        )}
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
