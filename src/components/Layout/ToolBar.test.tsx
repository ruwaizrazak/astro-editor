import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToolBar } from './ToolBar'
import { useAppStore } from '../../store'

describe('ToolBar Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      projectPath: null,
      currentFile: null,
      isDirty: false,
      frontmatterPanelVisible: true,
    })
    globalThis.mockTauri.reset()
  })

  it('should render with project path when available', () => {
    useAppStore.setState({
      projectPath: '/Users/test/my-blog',
    })

    render(<ToolBar />)

    expect(screen.getByText('/Users/test/my-blog')).toBeInTheDocument()
  })

  it('should not show project path when none is set', () => {
    render(<ToolBar />)

    // Should not have any path text
    expect(screen.queryByText(/Users/)).not.toBeInTheDocument()
  })

  describe('Save Button', () => {
    it('should be disabled when no file is open', () => {
      render(<ToolBar />)

      const saveButton = screen.getByTitle(/Save/)
      expect(saveButton).toBeDisabled()
    })

    it('should be disabled when file is clean', () => {
      useAppStore.setState({
        currentFile: {
          id: 'posts/test',
          path: '/project/posts/test.md',
          name: 'test',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        isDirty: false,
      })

      render(<ToolBar />)

      const saveButton = screen.getByTitle('Save')
      expect(saveButton).toBeDisabled()
    })

    it('should be enabled and styled differently when file is dirty', () => {
      useAppStore.setState({
        currentFile: {
          id: 'posts/test',
          path: '/project/posts/test.md',
          name: 'test',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        isDirty: true,
      })

      render(<ToolBar />)

      const saveButton = screen.getByTitle('Save (unsaved changes)')
      expect(saveButton).toBeEnabled()
      expect(saveButton).toHaveClass('bg-primary') // default variant for dirty state
    })

    it('should call saveFile when clicked', async () => {
      const user = userEvent.setup()
      const mockSaveFile = vi.fn()

      // Mock the saveFile function
      useAppStore.setState({
        currentFile: {
          id: 'posts/test',
          path: '/project/posts/test.md',
          name: 'test',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        isDirty: true,
      })

      // Override the saveFile method in the store
      const originalStore = useAppStore.getState()
      useAppStore.setState({
        ...originalStore,
        saveFile: mockSaveFile,
      })

      render(<ToolBar />)

      const saveButton = screen.getByTitle('Save (unsaved changes)')
      await user.click(saveButton)

      expect(mockSaveFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('Frontmatter Panel Toggle', () => {
    it('should show frontmatter toggle when panel is closed', () => {
      useAppStore.setState({
        frontmatterPanelVisible: false,
      })

      render(<ToolBar />)

      const toggleButton = screen.getByTitle('Open Frontmatter Panel')
      expect(toggleButton).toBeInTheDocument()
    })

    it('should not show frontmatter toggle when panel is open', () => {
      useAppStore.setState({
        frontmatterPanelVisible: true,
      })

      render(<ToolBar />)

      const toggleButton = screen.queryByTitle('Open Frontmatter Panel')
      expect(toggleButton).not.toBeInTheDocument()
    })

    it('should call toggleFrontmatterPanel when clicked', async () => {
      const user = userEvent.setup()
      const mockToggle = vi.fn()

      useAppStore.setState({
        frontmatterPanelVisible: false,
      })

      // Override the toggle method in the store
      const originalStore = useAppStore.getState()
      useAppStore.setState({
        ...originalStore,
        toggleFrontmatterPanel: mockToggle,
      })

      render(<ToolBar />)

      const toggleButton = screen.getByTitle('Open Frontmatter Panel')
      await user.click(toggleButton)

      expect(mockToggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('Button Layout', () => {
    it('should have save button before frontmatter toggle (when visible)', () => {
      useAppStore.setState({
        currentFile: {
          id: 'posts/test',
          path: '/project/posts/test.md',
          name: 'test',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        isDirty: true,
        frontmatterPanelVisible: false,
      })

      render(<ToolBar />)

      const buttons = screen.getAllByRole('button')
      const saveButton = screen.getByTitle('Save (unsaved changes)')
      const frontmatterButton = screen.getByTitle('Open Frontmatter Panel')

      // Save button should come before frontmatter toggle in DOM order
      const saveIndex = buttons.indexOf(saveButton)
      const frontmatterIndex = buttons.indexOf(frontmatterButton)

      expect(saveIndex).toBeLessThan(frontmatterIndex)
    })
  })

  describe('Integration with Store State', () => {
    it('should update button states when store state changes', () => {
      const { rerender } = render(<ToolBar />)

      // Initially no file, save should be disabled
      expect(screen.getByTitle(/Save/).closest('button')).toBeDisabled()

      // Add a dirty file
      useAppStore.setState({
        currentFile: {
          id: 'posts/test',
          path: '/project/posts/test.md',
          name: 'test',
          extension: 'md',
          is_draft: false,
          collection: 'posts',
        },
        isDirty: true,
      })

      rerender(<ToolBar />)

      // Now save should be enabled
      expect(
        screen.getByTitle('Save (unsaved changes)').closest('button')
      ).toBeEnabled()
    })
  })
})
