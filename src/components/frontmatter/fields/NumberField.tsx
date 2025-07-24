import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { Input } from '../../ui/input'
import { valueToString } from '../utils'
import type { FieldProps } from '../../../types/common'

interface NumberFieldProps extends FieldProps {
  placeholder?: string
}

export const NumberField: React.FC<NumberFieldProps> = ({
  name,
  label,
  placeholder,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useEditorStore()

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">
        {label}
        {required && (
          <span className="text-[var(--color-required)] ml-1">*</span>
        )}
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
