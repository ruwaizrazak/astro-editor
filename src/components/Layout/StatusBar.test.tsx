import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import { useAppStore } from '../../store'

describe('StatusBar Component', () => {
  beforeEach(() => {
    useAppStore.setState({
      currentFile: null,
      editorContent: '',
      isDirty: false,
    })
  })

  it('should render empty when no file is selected', () => {
    render(<StatusBar />)

    // Should not show file info or stats when no file
    expect(screen.queryByText(/words/)).not.toBeInTheDocument()
    expect(screen.queryByText(/characters/)).not.toBeInTheDocument()
  })

  it('should display file name and extension when file is selected', () => {
    useAppStore.setState({
      currentFile: {
        id: 'test/example',
        path: '/test/example.md',
        name: 'example',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      },
      editorContent: 'Hello world',
      isDirty: false,
    })

    render(<StatusBar />)

    expect(screen.getByText('example.md')).toBeInTheDocument()
  })

  it('should show dirty indicator when file has unsaved changes', () => {
    useAppStore.setState({
      currentFile: {
        id: 'test/example',
        path: '/test/example.md',
        name: 'example',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      },
      editorContent: 'Hello world',
      isDirty: true,
    })

    render(<StatusBar />)

    expect(screen.getByText('•')).toBeInTheDocument()
  })

  it('should display correct word and character counts', () => {
    useAppStore.setState({
      currentFile: {
        id: 'test/example',
        path: '/test/example.md',
        name: 'example',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      },
      editorContent: 'Hello world this is a test',
      isDirty: false,
    })

    render(<StatusBar />)

    expect(screen.getByText('6 words')).toBeInTheDocument()
    expect(screen.getByText('26 characters')).toBeInTheDocument()
  })

  it('should handle empty content correctly', () => {
    useAppStore.setState({
      currentFile: {
        id: 'test/example',
        path: '/test/example.md',
        name: 'example',
        extension: 'md',
        is_draft: false,
        collection: 'posts',
      },
      editorContent: '',
      isDirty: false,
    })

    render(<StatusBar />)

    expect(screen.getByText('0 words')).toBeInTheDocument()
    expect(screen.getByText('0 characters')).toBeInTheDocument()
  })
})
