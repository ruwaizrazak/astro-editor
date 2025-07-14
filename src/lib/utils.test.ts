import { describe, it, expect } from 'vitest'
import { camelCaseToTitleCase } from './utils'

describe('camelCaseToTitleCase', () => {
  it('should convert camelCase to Title Case', () => {
    expect(camelCaseToTitleCase('firstName')).toBe('First Name')
    expect(camelCaseToTitleCase('someVeryLongFieldName')).toBe(
      'Some Very Long Field Name'
    )
  })

  it('should handle acronyms correctly', () => {
    expect(camelCaseToTitleCase('redirectURL')).toBe('Redirect URL')
    expect(camelCaseToTitleCase('SomeHTMLThing')).toBe('Some HTML Thing')
    expect(camelCaseToTitleCase('parseXMLData')).toBe('Parse XML Data')
  })

  it('should handle single words', () => {
    expect(camelCaseToTitleCase('title')).toBe('Title')
  })

  it('should handle edge cases', () => {
    expect(camelCaseToTitleCase('')).toBe('')
    expect(camelCaseToTitleCase('a')).toBe('A')
  })
})
