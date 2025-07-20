import { describe, it, expect, beforeEach, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { BooleanField } from './BooleanField'
import { useEditorStore } from '../../../store/editorStore'
import { renderWithProviders } from '../../../test/test-utils'
import type { ZodField } from '../../../lib/schema'

describe('BooleanField Component', () => {
  beforeEach(() => {
    useEditorStore.setState({
      frontmatter: {},
      updateFrontmatterField: vi.fn((key: string, value: unknown) => {
        const { frontmatter } = useEditorStore.getState()
        const newFrontmatter = { ...frontmatter }

        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        ) {
          delete newFrontmatter[key]
        } else {
          newFrontmatter[key] = value
        }

        useEditorStore.setState({ frontmatter: newFrontmatter })
      }),
    })
  })

  describe('Boolean Value Resolution Logic', () => {
    it('should handle explicit boolean true value', () => {
      useEditorStore.setState({
        frontmatter: { draft: true },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked()
    })

    it('should handle explicit boolean false value', () => {
      useEditorStore.setState({
        frontmatter: { draft: false },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked()
    })

    it('should handle string "true" value', () => {
      useEditorStore.setState({
        frontmatter: { draft: 'true' },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked()
    })

    it('should handle string "false" value', () => {
      useEditorStore.setState({
        frontmatter: { draft: 'false' },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked()
    })

    it('should handle undefined value without schema default', () => {
      useEditorStore.setState({
        frontmatter: { draft: undefined },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Default to false
    })

    it('should handle null value without schema default', () => {
      useEditorStore.setState({
        frontmatter: { draft: null },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Default to false
    })

    it('should handle empty string value without schema default', () => {
      useEditorStore.setState({
        frontmatter: { draft: '' },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Default to false
    })
  })

  describe('Schema Default Value Handling', () => {
    it('should use schema default when value is undefined', () => {
      const fieldWithDefault: ZodField = {
        name: 'published',
        type: 'Boolean',
        optional: true,
        default: 'true',
      }

      useEditorStore.setState({
        frontmatter: { published: undefined },
      })

      renderWithProviders(
        <BooleanField
          name="published"
          label="Published"
          field={fieldWithDefault}
        />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked() // Should use schema default
    })

    it('should use schema default when value is empty string', () => {
      const fieldWithDefault: ZodField = {
        name: 'featured',
        type: 'Boolean',
        optional: true,
        default: 'true',
      }

      useEditorStore.setState({
        frontmatter: { featured: '' },
      })

      renderWithProviders(
        <BooleanField
          name="featured"
          label="Featured"
          field={fieldWithDefault}
        />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked() // Should use schema default
    })

    it('should handle schema default "false" string', () => {
      const fieldWithFalseDefault: ZodField = {
        name: 'private',
        type: 'Boolean',
        optional: true,
        default: 'false',
      }

      useEditorStore.setState({
        frontmatter: { private: undefined },
      })

      renderWithProviders(
        <BooleanField
          name="private"
          label="Private"
          field={fieldWithFalseDefault}
        />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Should use schema default
    })

    it('should handle schema default boolean true', () => {
      const fieldWithBooleanDefault: ZodField = {
        name: 'visible',
        type: 'Boolean',
        optional: true,
        default: 'true', // String default for consistent testing
      }

      useEditorStore.setState({
        frontmatter: { visible: null },
      })

      renderWithProviders(
        <BooleanField
          name="visible"
          label="Visible"
          field={fieldWithBooleanDefault}
        />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked() // Should convert default to boolean
    })

    it('should handle schema default boolean false', () => {
      const fieldWithBooleanDefault: ZodField = {
        name: 'archived',
        type: 'Boolean',
        optional: true,
        default: 'false', // String default for consistent testing
      }

      useEditorStore.setState({
        frontmatter: { archived: undefined },
      })

      renderWithProviders(
        <BooleanField
          name="archived"
          label="Archived"
          field={fieldWithBooleanDefault}
        />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked()
    })

    it('should handle non-boolean schema default values', () => {
      const fieldWithStringDefault: ZodField = {
        name: 'status',
        type: 'Boolean',
        optional: true,
        default: 'active', // Non-boolean default
      }

      useEditorStore.setState({
        frontmatter: { status: undefined },
      })

      renderWithProviders(
        <BooleanField
          name="status"
          label="Status"
          field={fieldWithStringDefault}
        />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked() // Should convert truthy string to true
    })

    it('should handle empty string schema default', () => {
      const fieldWithEmptyDefault: ZodField = {
        name: 'flag',
        type: 'Boolean',
        optional: true,
        default: '', // Empty string default
      }

      useEditorStore.setState({
        frontmatter: { flag: undefined },
      })

      renderWithProviders(
        <BooleanField name="flag" label="Flag" field={fieldWithEmptyDefault} />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Empty string should be falsy
    })

    it('should prioritize actual value over schema default', () => {
      const fieldWithDefault: ZodField = {
        name: 'enabled',
        type: 'Boolean',
        optional: true,
        default: 'true', // Schema says default true
      }

      useEditorStore.setState({
        frontmatter: { enabled: false }, // But actual value is false
      })

      renderWithProviders(
        <BooleanField name="enabled" label="Enabled" field={fieldWithDefault} />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Should use actual value, not default
    })
  })

  describe('User Interactions', () => {
    it('should toggle value when clicked', () => {
      useEditorStore.setState({
        frontmatter: { draft: false },
      })

      renderWithProviders(<BooleanField name="draft" label="Draft" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked()

      fireEvent.click(switchElement)

      const { frontmatter } = useEditorStore.getState()
      expect(frontmatter.draft).toBe(true)
    })

    it('should toggle from true to false', () => {
      useEditorStore.setState({
        frontmatter: { published: true },
      })

      renderWithProviders(<BooleanField name="published" label="Published" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).toBeChecked()

      fireEvent.click(switchElement)

      const { frontmatter } = useEditorStore.getState()
      expect(frontmatter.published).toBe(false)
    })

    it('should set initial value when toggling from undefined', () => {
      useEditorStore.setState({
        frontmatter: {},
      })

      renderWithProviders(<BooleanField name="newField" label="New Field" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked()

      fireEvent.click(switchElement)

      const { frontmatter } = useEditorStore.getState()
      expect(frontmatter.newField).toBe(true)
    })
  })

  describe('Required Field Indicator', () => {
    it('should show required indicator for non-optional field', () => {
      const requiredField: ZodField = {
        name: 'required',
        type: 'Boolean',
        optional: false,
      }

      renderWithProviders(
        <BooleanField name="required" label="Required" field={requiredField} />
      )

      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should not show required indicator for optional field', () => {
      const optionalField: ZodField = {
        name: 'optional',
        type: 'Boolean',
        optional: true,
      }

      renderWithProviders(
        <BooleanField name="optional" label="Optional" field={optionalField} />
      )

      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    it('should not show required indicator when no field schema', () => {
      renderWithProviders(<BooleanField name="noSchema" label="No Schema" />)

      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle numeric values', () => {
      useEditorStore.setState({
        frontmatter: { numeric: 1 },
      })

      renderWithProviders(<BooleanField name="numeric" label="Numeric" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Only explicit boolean true or 'true' string are truthy
    })

    it('should handle zero value', () => {
      useEditorStore.setState({
        frontmatter: { zero: 0 },
      })

      renderWithProviders(<BooleanField name="zero" label="Zero" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Zero should be falsy
    })

    it('should handle object values', () => {
      useEditorStore.setState({
        frontmatter: { object: { foo: 'bar' } },
      })

      renderWithProviders(<BooleanField name="object" label="Object" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Only explicit boolean true or 'true' string are truthy
    })

    it('should handle array values', () => {
      useEditorStore.setState({
        frontmatter: { array: ['item'] },
      })

      renderWithProviders(<BooleanField name="array" label="Array" />)

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Only explicit boolean true or 'true' string are truthy
    })

    it('should handle empty array values', () => {
      useEditorStore.setState({
        frontmatter: { emptyArray: [] },
      })

      renderWithProviders(
        <BooleanField name="emptyArray" label="Empty Array" />
      )

      const switchElement = screen.getByRole('switch')
      expect(switchElement).not.toBeChecked() // Only explicit boolean true or 'true' string are truthy
    })
  })
})
