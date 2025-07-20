import type { Tag } from '../ui/tag-input'

/**
 * Helper function to convert Tag objects back to string arrays
 */
export const tagsToStringArray = (tags: Tag[]): string[] =>
  tags.map(tag => tag.text)

/**
 * Helper function to safely convert frontmatter values to strings
 */
export const valueToString = (value: unknown): string => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  if (typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.join(',')
  return ''
}
