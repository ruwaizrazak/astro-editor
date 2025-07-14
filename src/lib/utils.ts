import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to convert camelCase to Title Case
export function camelCaseToTitleCase(str: string): string {
  return (
    str
      // Split on boundaries between lowercase and uppercase (normal camelCase)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Split on boundaries between uppercase and uppercase+lowercase (end of acronym)
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      // Capitalize first letter and trim
      .replace(/^./, char => char.toUpperCase())
      .trim()
  )
}
