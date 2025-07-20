import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select'
import type { FieldProps } from '../../../types/common'

interface EnumFieldProps extends FieldProps {
  options: string[]
}

export const EnumField: React.FC<EnumFieldProps> = ({
  name,
  label,
  options,
  required,
}) => {
  const { frontmatter, updateFrontmatterField } = useEditorStore()

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
