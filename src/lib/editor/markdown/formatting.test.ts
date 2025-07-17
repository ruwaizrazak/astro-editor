import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EditorView } from '@codemirror/view'
import { EditorState, EditorSelection } from '@codemirror/state'
import {
  toggleMarkdown,
  createMarkdownLink,
  parseMarkdownLinks,
} from './formatting'

// Mock dispatch function
const mockDispatch = vi.fn()

const createMockView = (
  content: string,
  selection?: { from: number; to: number }
) => {
  const state = EditorState.create({
    doc: content,
    selection: selection
      ? EditorSelection.range(selection.from, selection.to)
      : undefined,
  })

  return {
    state,
    dispatch: mockDispatch,
  } as unknown as EditorView
}

describe('Markdown Formatting', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('toggleMarkdown', () => {
    it('should add bold markers to selected text', () => {
      const view = createMockView('Hello world', { from: 0, to: 5 })

      const result = toggleMarkdown(view, '**')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 0, to: 5, insert: '**Hello**' },
        selection: EditorSelection.range(2, 7),
      })
    })

    it('should add italic markers to selected text', () => {
      const view = createMockView('Hello world', { from: 6, to: 11 })

      const result = toggleMarkdown(view, '*')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 6, to: 11, insert: '*world*' },
        selection: EditorSelection.range(7, 12),
      })
    })

    it('should remove existing bold markers', () => {
      const view = createMockView('Hello **world** test', { from: 8, to: 13 })

      const result = toggleMarkdown(view, '**')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: [
          { from: 6, to: 8, insert: '' },
          { from: 13, to: 15, insert: '' },
        ],
        selection: EditorSelection.range(6, 11),
      })
    })

    it('should remove existing italic markers', () => {
      const view = createMockView('Hello *world* test', { from: 7, to: 12 })

      const result = toggleMarkdown(view, '*')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: [
          { from: 6, to: 7, insert: '' },
          { from: 12, to: 13, insert: '' },
        ],
        selection: EditorSelection.range(6, 11),
      })
    })

    it('should handle empty selection', () => {
      const view = createMockView('Hello world', { from: 5, to: 5 })

      const result = toggleMarkdown(view, '**')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 5, to: 5, insert: '****' },
        selection: EditorSelection.range(7, 7),
      })
    })

    it('should handle code markers', () => {
      const view = createMockView('Hello world', { from: 0, to: 5 })

      const result = toggleMarkdown(view, '`')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 0, to: 5, insert: '`Hello`' },
        selection: EditorSelection.range(1, 6),
      })
    })

    it('should handle markers at document boundaries', () => {
      const view = createMockView('**Hello**', { from: 2, to: 7 })

      const result = toggleMarkdown(view, '**')

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: [
          { from: 0, to: 2, insert: '' },
          { from: 7, to: 9, insert: '' },
        ],
        selection: EditorSelection.range(0, 5),
      })
    })
  })

  describe('parseMarkdownLinks', () => {
    it('should parse a single markdown link', () => {
      const lineText = 'Check out [Google](https://google.com) for search'
      const matches = parseMarkdownLinks(lineText)

      expect(matches).toHaveLength(1)
      expect(matches[0]).toEqual({
        linkText: 'Google',
        linkUrl: 'https://google.com',
        linkStart: 10,
        linkEnd: 38,
        urlStart: 19,
        urlEnd: 37,
      })
    })

    it('should parse multiple markdown links', () => {
      const lineText =
        'Visit [Google](https://google.com) and [GitHub](https://github.com)'
      const matches = parseMarkdownLinks(lineText)

      expect(matches).toHaveLength(2)
      expect(matches[0]).toEqual({
        linkText: 'Google',
        linkUrl: 'https://google.com',
        linkStart: 6,
        linkEnd: 34,
        urlStart: 15,
        urlEnd: 33,
      })
      expect(matches[1]).toEqual({
        linkText: 'GitHub',
        linkUrl: 'https://github.com',
        linkStart: 39,
        linkEnd: 67,
        urlStart: 47,
        urlEnd: 66,
      })
    })

    it('should handle empty link text', () => {
      const lineText = 'Visit [](https://google.com)'
      const matches = parseMarkdownLinks(lineText)

      expect(matches).toHaveLength(1)
      expect(matches[0]).toEqual({
        linkText: '',
        linkUrl: 'https://google.com',
        linkStart: 6,
        linkEnd: 28,
        urlStart: 9,
        urlEnd: 27,
      })
    })

    it('should handle empty link URL', () => {
      const lineText = 'Visit [Google]()'
      const matches = parseMarkdownLinks(lineText)

      expect(matches).toHaveLength(1)
      expect(matches[0]).toEqual({
        linkText: 'Google',
        linkUrl: '',
        linkStart: 6,
        linkEnd: 16,
        urlStart: 15,
        urlEnd: 15,
      })
    })

    it('should return empty array for no links', () => {
      const lineText = 'Just some regular text without links'
      const matches = parseMarkdownLinks(lineText)

      expect(matches).toHaveLength(0)
    })

    it('should handle malformed markdown syntax', () => {
      const lineText = 'Incomplete [link or (url) syntax'
      const matches = parseMarkdownLinks(lineText)

      expect(matches).toHaveLength(0)
    })
  })

  describe('createMarkdownLink', () => {
    it('should create link with selected text', () => {
      const view = createMockView('Hello world', { from: 0, to: 5 })

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 0, to: 5, insert: '[Hello]()' },
        selection: EditorSelection.range(8, 8),
      })
    })

    it('should create link template with no selection', () => {
      const view = createMockView('Hello world', { from: 5, to: 5 })

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 5, to: 5, insert: '[text]()' },
        selection: EditorSelection.range(6, 10),
      })
    })

    it('should select URL in existing link when cursor is inside', () => {
      const lineText = 'Visit [Google](https://google.com) today'
      const view = createMockView(lineText, { from: 20, to: 20 }) // cursor inside URL

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        selection: EditorSelection.range(15, 33),
      })
    })

    it('should select URL in existing link when cursor is on link text', () => {
      const lineText = 'Visit [Google](https://google.com) today'
      const view = createMockView(lineText, { from: 8, to: 8 }) // cursor on 'o' in Google

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        selection: EditorSelection.range(15, 33),
      })
    })

    it('should handle cursor at start of link', () => {
      const lineText = 'Visit [Google](https://google.com) today'
      const view = createMockView(lineText, { from: 6, to: 6 }) // cursor at '['

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        selection: EditorSelection.range(15, 33),
      })
    })

    it('should handle cursor at end of link', () => {
      const lineText = 'Visit [Google](https://google.com) today'
      const view = createMockView(lineText, { from: 34, to: 34 }) // cursor at ']'

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        selection: EditorSelection.range(15, 33),
      })
    })

    it('should handle multiple links on same line', () => {
      const lineText =
        'Visit [Google](https://google.com) and [GitHub](https://github.com)'
      const view = createMockView(lineText, { from: 50, to: 50 }) // cursor in second link

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        selection: EditorSelection.range(48, 66),
      })
    })

    it('should handle whitespace in selected text', () => {
      const view = createMockView('Hello   world', { from: 0, to: 13 })

      const result = createMarkdownLink(view)

      expect(result).toBe(true)
      expect(mockDispatch).toHaveBeenCalledWith({
        changes: { from: 0, to: 13, insert: '[Hello   world]()' },
        selection: EditorSelection.range(16, 16),
      })
    })
  })
})
