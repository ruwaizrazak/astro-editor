import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { DatePicker } from '../../ui/date-picker'
import type { FieldProps } from '../../../types/common'

export const DateField: React.FC<FieldProps> = ({ name, label, required }) => {
  const { frontmatter, updateFrontmatterField } = useEditorStore()

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
