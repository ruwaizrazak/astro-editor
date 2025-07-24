import React from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { TagInput, type Tag } from '../../ui/tag-input'
import { tagsToStringArray } from '../utils'
import type { FieldProps } from '../../../types/common'

export const ArrayField: React.FC<FieldProps> = ({ name, label, required }) => {
  const { frontmatter, updateFrontmatterField } = useEditorStore()

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
      <label className="text-sm font-medium text-gray-900 dark:text-white">
        {label}
        {required && (
          <span className="text-[var(--color-required)] ml-1">*</span>
        )}
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
