import React, { useCallback, useRef, useEffect, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView, ViewPlugin, ViewUpdate, Decoration, DecorationSet } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { EditorSelection, Prec, StateField, StateEffect } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Tag, styleTags, tags } from '@lezer/highlight'
import { useAppStore } from '../../store'
import { invoke } from '@tauri-apps/api/core'
import { openPath } from '@tauri-apps/plugin-opener'
import './EditorView.css'
import './EditorTheme.css'

// Define comprehensive markdown tags for styling
const markdownTags = {
  // Headings
  heading1: Tag.define(),
  heading2: Tag.define(),
  heading3: Tag.define(),
  heading4: Tag.define(),
  heading5: Tag.define(),
  heading6: Tag.define(),
  headingMark: Tag.define(), // The # symbols

  // Emphasis and Strong
  emphasis: Tag.define(), // *italic*
  emphasisMark: Tag.define(), // The * symbols
  strong: Tag.define(), // **bold**
  strongMark: Tag.define(), // The ** symbols
  strikethrough: Tag.define(), // ~~text~~
  strikethroughMark: Tag.define(), // The ~~ symbols

  // Code
  inlineCode: Tag.define(), // `code`
  inlineCodeMark: Tag.define(), // The ` symbols
  codeBlock: Tag.define(), // ```code```
  codeBlockMark: Tag.define(), // The ``` symbols
  codeFence: Tag.define(), // Language identifier after ```

  // Links and Images
  link: Tag.define(), // [text](url)
  linkMark: Tag.define(), // The [ ] ( ) symbols
  linkText: Tag.define(), // The text part
  linkUrl: Tag.define(), // The URL part
  image: Tag.define(), // ![alt](src)
  imageMark: Tag.define(), // The ! [ ] ( ) symbols
  imageAlt: Tag.define(), // Alt text
  imageUrl: Tag.define(), // Image URL

  // Lists
  listMark: Tag.define(), // - * + for unordered, 1. for ordered
  listItem: Tag.define(), // List item content

  // Blockquotes
  blockquote: Tag.define(), // > quoted text
  blockquoteMark: Tag.define(), // The > symbol

  // Horizontal Rules
  horizontalRule: Tag.define(), // --- or ***

  // Tables
  table: Tag.define(),
  tableHeader: Tag.define(),
  tableSeparator: Tag.define(), // The | symbols
  tableRow: Tag.define(),
  tableCell: Tag.define(),

  // Footnotes
  footnote: Tag.define(),
  footnoteMark: Tag.define(), // [^1] references

  // HTML elements (when mixed with markdown)
  htmlTag: Tag.define(),
  htmlAttribute: Tag.define(),

  // Escape characters
  escape: Tag.define(), // \* \` etc
}

// Create style extension that maps parser tags to our custom tags
const markdownStyleExtension = {
  props: [
    styleTags({
      // Headings
      'ATXHeading1/HeaderMark': markdownTags.headingMark,
      ATXHeading1: markdownTags.heading1,
      'ATXHeading2/HeaderMark': markdownTags.headingMark,
      ATXHeading2: markdownTags.heading2,
      'ATXHeading3/HeaderMark': markdownTags.headingMark,
      ATXHeading3: markdownTags.heading3,
      'ATXHeading4/HeaderMark': markdownTags.headingMark,
      ATXHeading4: markdownTags.heading4,
      'ATXHeading5/HeaderMark': markdownTags.headingMark,
      ATXHeading5: markdownTags.heading5,
      'ATXHeading6/HeaderMark': markdownTags.headingMark,
      ATXHeading6: markdownTags.heading6,

      // Emphasis and Strong
      'Emphasis/EmphasisMark': markdownTags.emphasisMark,
      Emphasis: markdownTags.emphasis,
      'StrongEmphasis/EmphasisMark': markdownTags.strongMark,
      StrongEmphasis: markdownTags.strong,
      'Strikethrough/StrikethroughMark': markdownTags.strikethroughMark,
      Strikethrough: markdownTags.strikethrough,

      // Code
      'InlineCode/CodeMark': markdownTags.inlineCodeMark,
      InlineCode: markdownTags.inlineCode,
      'FencedCode/CodeMark': markdownTags.codeBlockMark,
      FencedCode: markdownTags.codeBlock,
      CodeInfo: markdownTags.codeFence,

      // Links and Images
      'Link/LinkMark': markdownTags.linkMark,
      Link: markdownTags.link,
      LinkText: markdownTags.linkText,
      URL: markdownTags.linkUrl,
      'Image/ImageMark': markdownTags.imageMark,
      Image: markdownTags.image,
      ImageText: markdownTags.imageAlt,

      // Lists
      ListMark: markdownTags.listMark,
      ListItem: markdownTags.listItem,

      // Blockquotes
      'Blockquote/QuoteMark': markdownTags.blockquoteMark,
      Blockquote: markdownTags.blockquote,

      // Horizontal Rules
      HorizontalRule: markdownTags.horizontalRule,

      // Tables
      Table: markdownTags.table,
      TableHeader: markdownTags.tableHeader,
      TableDelimiter: markdownTags.tableSeparator,
      TableRow: markdownTags.tableRow,
      TableCell: markdownTags.tableCell,

      // HTML
      HTMLTag: markdownTags.htmlTag,
      HTMLAttribute: markdownTags.htmlAttribute,

      // Escape
      Escape: markdownTags.escape,

      // Footnotes
      FootnoteReference: markdownTags.footnoteMark,
      FootnoteDefinition: markdownTags.footnote,
    }),
  ],
}

// Create comprehensive highlight style that includes both markdown and standard language tags
const comprehensiveHighlightStyle = HighlightStyle.define([
  // === MARKDOWN-SPECIFIC TAGS ===
  // Headings - inherit base size, just make bold
  {
    tag: markdownTags.heading1,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.heading2,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.heading3,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.heading4,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.heading5,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.heading6,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.headingMark,
    color: 'var(--editor-color-text)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },

  // Emphasis and Strong
  {
    tag: markdownTags.emphasis,
    fontStyle: 'italic',
    fontFamily: 'var(--editor-font-family-italic)',
  },
  {
    tag: markdownTags.emphasisMark,
    color: 'var(--editor-color-text)',
    fontFamily: 'var(--editor-font-family-italic)',
  },
  { tag: markdownTags.strong, fontWeight: 'var(--editor-font-weight-bold)' },
  {
    tag: markdownTags.strongMark,
    color: 'var(--editor-color-text)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: markdownTags.strikethrough,
    textDecoration: 'line-through',
    color: 'var(--editor-color-mdtag)',
  },
  { tag: markdownTags.strikethroughMark, color: 'var(--editor-color-text)' },

  // Code
  {
    tag: markdownTags.inlineCode,
    backgroundColor: 'var(--editor-color-codeblock-background)',
    fontFamily: 'iA Writer Mono Variable, iA Writer Mono, monospace',
    padding: '1px 3px',
    borderRadius: '2px',
  },
  { tag: markdownTags.inlineCodeMark, color: 'var(--editor-color-mdtag)' },
  {
    tag: markdownTags.codeBlock,
    fontFamily: 'iA Writer Mono Variable, iA Writer Mono, monospace',
  },
  { tag: markdownTags.codeBlockMark, color: 'var(--editor-color-mdtag)' },
  { tag: markdownTags.codeFence, color: 'var(--editor-color-mdtag)' },

  // Links and Images
  { tag: markdownTags.link },
  { tag: markdownTags.linkMark, color: 'var(--editor-color-mdtag)' },
  { tag: markdownTags.linkText, color: 'var(--editor-color-mdtag)' },
  {
    tag: markdownTags.linkUrl,
    color: 'var(--editor-color-mdtag)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--editor-color-underline)',
  },
  { tag: markdownTags.image },
  { tag: markdownTags.imageMark, color: 'var(--editor-color-mdtag)' },
  { tag: markdownTags.imageAlt, color: 'var(--editor-color-mdtag)' },
  {
    tag: markdownTags.imageUrl,
    color: 'var(--editor-color-mdtag)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--editor-color-underline)',
  },

  // Lists
  { tag: markdownTags.listMark, color: 'var(--editor-color-mdtag)' },
  { tag: markdownTags.listItem },

  // Blockquotes
  {
    tag: markdownTags.blockquote,
    fontStyle: 'italic',
    fontFamily: 'var(--editor-font-family-italic)',
  },
  { tag: markdownTags.blockquoteMark, color: 'var(--editor-color-mdtag)' },

  // Horizontal Rules
  {
    tag: markdownTags.horizontalRule,
    color: 'var(--editor-color-mdtag)',
  },

  // Tables
  { tag: markdownTags.table },
  {
    tag: markdownTags.tableHeader,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  { tag: markdownTags.tableSeparator, color: 'var(--editor-color-mdtag)' },
  { tag: markdownTags.tableRow },
  { tag: markdownTags.tableCell },

  // HTML - use the red family as specified
  { tag: markdownTags.htmlTag, color: 'var(--editor-color-red)' },
  { tag: markdownTags.htmlAttribute, color: 'var(--editor-color-brown)' },

  // Escape
  { tag: markdownTags.escape, color: 'var(--editor-color-mdtag)' },

  // Footnotes
  { tag: markdownTags.footnote },
  { tag: markdownTags.footnoteMark, color: 'var(--editor-color-mdtag)' },

  // === STANDARD LANGUAGE TAGS (HTML, CSS, JS, etc.) ===
  // HTML Tags - Red/Orange/Green as per spec
  { tag: tags.tagName, color: 'var(--editor-color-red)' },
  { tag: tags.angleBracket, color: 'var(--editor-color-red)' },
  { tag: tags.attributeName, color: 'var(--editor-color-brown)' },
  { tag: tags.attributeValue, color: 'var(--editor-color-green)' },

  // JavaScript/Programming - Use iA Writer colors
  {
    tag: tags.keyword,
    color: 'var(--editor-color-blue)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  { tag: tags.function(tags.variableName), color: 'var(--editor-color-blue)' },
  { tag: tags.variableName, color: 'var(--editor-color-text)' },
  {
    tag: tags.className,
    color: 'var(--editor-color-pink)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  { tag: tags.namespace, color: 'var(--editor-color-pink)' },
  { tag: tags.typeName, color: 'var(--editor-color-pink)' },

  // Literals
  { tag: tags.string, color: 'var(--editor-color-green)' },
  { tag: tags.character, color: 'var(--editor-color-green)' },
  { tag: tags.number, color: 'var(--editor-color-blue)' },
  {
    tag: tags.bool,
    color: 'var(--editor-color-blue)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  { tag: tags.null, color: 'var(--editor-color-blue)', fontStyle: 'italic' },

  // Comments - Use mdtag color
  {
    tag: tags.comment,
    color: 'var(--editor-color-mdtag)',
    fontStyle: 'italic',
  },
  {
    tag: tags.blockComment,
    color: 'var(--editor-color-mdtag)',
    fontStyle: 'italic',
  },
  {
    tag: tags.lineComment,
    color: 'var(--editor-color-mdtag)',
    fontStyle: 'italic',
  },
  {
    tag: tags.docComment,
    color: 'var(--editor-color-mdtag)',
    fontStyle: 'italic',
    fontWeight: 'var(--editor-font-weight-bold)',
  },

  // Operators and Punctuation
  { tag: tags.operator, color: 'var(--editor-color-text)' },
  { tag: tags.punctuation, color: 'var(--editor-color-text)' },
  { tag: tags.bracket, color: 'var(--editor-color-text)' },
  { tag: tags.paren, color: 'var(--editor-color-text)' },
  { tag: tags.squareBracket, color: 'var(--editor-color-text)' },

  // CSS
  {
    tag: tags.propertyName,
    color: 'var(--editor-color-blue)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  { tag: tags.unit, color: 'var(--editor-color-blue)' },
  {
    tag: tags.color,
    color: 'var(--editor-color-pink)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },

  // Special/Meta
  { tag: tags.meta, color: 'var(--editor-color-brown)' },
  { tag: tags.processingInstruction, color: 'var(--editor-color-brown)' },
  {
    tag: tags.definition(tags.variableName),
    color: 'var(--editor-color-text)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.definition(tags.function(tags.variableName)),
    color: 'var(--editor-color-blue)',
    fontWeight: 'var(--editor-font-weight-bold)',
  },

  // Invalid/Error
  {
    tag: tags.invalid,
    color: 'var(--editor-color-red)',
    textDecoration: 'underline wavy',
  },
  {
    tag: tags.deleted,
    color: 'var(--editor-color-red)',
    textDecoration: 'line-through',
  },
  { tag: tags.inserted, color: 'var(--editor-color-green)' },
  { tag: tags.changed, color: 'var(--editor-color-brown)' },

  // URLs and Links
  {
    tag: tags.url,
    color: 'var(--editor-color-mdtag)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--editor-color-underline)',
  },
  {
    tag: tags.link,
    color: 'var(--editor-color-mdtag)',
    textDecoration: 'underline',
    textDecorationColor: 'var(--editor-color-underline)',
  },

  // Headings (for other languages that have them)
  {
    tag: tags.heading,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.heading1,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.heading2,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.heading3,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.heading4,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.heading5,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
  {
    tag: tags.heading6,
    fontWeight: 'var(--editor-font-weight-bold)',
  },
])

// Markdown formatting helper functions
const toggleMarkdown = (view: EditorView, marker: string): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  // Check if selection is already wrapped with this marker
  const beforeStart = Math.max(0, from - marker.length)
  const afterEnd = Math.min(state.doc.length, to + marker.length)
  const beforeText = state.sliceDoc(beforeStart, from)
  const afterText = state.sliceDoc(to, afterEnd)

  if (beforeText.endsWith(marker) && afterText.startsWith(marker)) {
    // Remove existing markers
    view.dispatch({
      changes: [
        { from: beforeStart, to: from, insert: '' },
        { from: to, to: afterEnd, insert: '' },
      ],
      selection: EditorSelection.range(
        beforeStart,
        beforeStart + selectedText.length
      ),
    })
  } else {
    // Add markers
    const newText = `${marker}${selectedText}${marker}`
    view.dispatch({
      changes: { from, to, insert: newText },
      selection: EditorSelection.range(
        from + marker.length,
        to + marker.length
      ),
    })
  }

  return true
}

const createMarkdownLink = (view: EditorView): boolean => {
  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  // Check if cursor is inside an existing markdown link
  const lineText = state.doc.lineAt(from).text
  const lineStart = state.doc.lineAt(from).from
  const posInLine = from - lineStart

  // Find markdown link pattern: [text](url)
  const linkRegex = /\[([^\]]*)\]\(([^)]*)\)/g
  let match
  while ((match = linkRegex.exec(lineText)) !== null) {
    const linkStart = match.index
    const linkEnd = match.index + match[0].length
    const linkText = match[1] || ''
    const urlStart = match.index + linkText.length + 3 // after "]("
    const urlEnd = linkEnd - 1 // before ")"

    // Check if cursor is anywhere within the link
    if (posInLine >= linkStart && posInLine <= linkEnd) {
      // Select the URL portion
      view.dispatch({
        selection: EditorSelection.range(
          lineStart + urlStart,
          lineStart + urlEnd
        ),
      })
      return true
    }
  }

  if (selectedText.trim()) {
    // If text is selected, create link with text as anchor and cursor in URL position
    const linkText = `[${selectedText}]()`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(
        from + selectedText.length + 3,
        from + selectedText.length + 3
      ),
    })
  } else {
    // If no text selected, create empty link template with cursor on text
    const linkText = `[text]()`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(from + 1, from + 5),
    })
  }

  return true
}

// Transform current line to a specific heading level or plain text
const transformLineToHeading = (
  view: EditorView,
  level: 0 | 1 | 2 | 3 | 4
): boolean => {
  const { state } = view
  const { from } = state.selection.main
  const line = state.doc.lineAt(from)
  const lineText = line.text

  // Remove existing heading markers (if any)
  const cleanedText = lineText.replace(/^#+\s*/, '')

  // Create new text based on desired level
  let newLineText: string
  if (level === 0) {
    // Plain text - just the cleaned text
    newLineText = cleanedText
  } else {
    // Add heading markers
    const markers = '#'.repeat(level)
    newLineText = `${markers} ${cleanedText}`
  }

  // Replace the entire line
  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: newLineText,
    },
    selection: EditorSelection.cursor(line.from + newLineText.length),
  })

  return true
}

// URL detection regex
const urlRegex = /^https?:\/\/[^\s]+$/

// Enhanced URL detection for both plain URLs and markdown links
const findUrlsInText = (text: string, offset: number = 0): Array<{url: string, from: number, to: number}> => {
  const urls: Array<{url: string, from: number, to: number}> = []
  
  // Find plain URLs
  const plainUrlRegex = /https?:\/\/[^\s\)]+/g
  let match
  while ((match = plainUrlRegex.exec(text)) !== null) {
    urls.push({
      url: match[0],
      from: offset + match.index,
      to: offset + match.index + match[0].length
    })
  }
  
  // Find markdown link URLs [text](url)
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const linkUrl = match[2]
    if (linkUrl.startsWith('http')) {
      // Position of the URL part within the markdown link
      const urlStart = match.index + match[1].length + 3 // after "]("
      urls.push({
        url: linkUrl,
        from: offset + urlStart,
        to: offset + urlStart + linkUrl.length
      })
    }
  }
  
  return urls
}

// Create a state effect for Alt key changes
const altKeyEffect = StateEffect.define<boolean>()

// State field to track Alt key state
const altKeyState = StateField.define<boolean>({
  create: () => false,
  update: (value, tr) => {
    for (let effect of tr.effects) {
      if (effect.is(altKeyEffect)) {
        return effect.value
      }
    }
    return value
  }
})

// Simple approach: just add the decoration class, let CSS handle the rest
const urlHoverPlugin = ViewPlugin.fromClass(class {
  decorations: DecorationSet

  constructor(view: EditorView) {
    this.decorations = this.buildDecorations(view)
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged || 
        update.state.field(altKeyState) !== update.startState.field(altKeyState)) {
      this.decorations = this.buildDecorations(update.view)
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const isAltPressed = view.state.field(altKeyState)
    if (!isAltPressed) return Decoration.none

    const widgets: Array<{from: number, to: number}> = []
    
    // Scan through visible lines for URLs
    for (let { from, to } of view.visibleRanges) {
      const text = view.state.doc.sliceString(from, to)
      const urls = findUrlsInText(text, from)
      widgets.push(...urls)
    }

    return Decoration.set(
      widgets.map(({ from, to }) =>
        Decoration.mark({
          class: 'url-alt-hover'
        }).range(from, to)
      )
    )
  }
}, {
  decorations: v => v.decorations
})

// Handle Alt+Click on URLs to open them in browser
const handleUrlClick = async (view: EditorView, event: MouseEvent): Promise<boolean> => {
  if (!event.altKey) return false
  
  const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
  if (pos === null) return false
  
  const doc = view.state.doc
  const line = doc.lineAt(pos)
  const urls = findUrlsInText(line.text, line.from)
  
  // Check if click position is within any URL
  const clickedUrl = urls.find(url => pos >= url.from && pos <= url.to)
  if (!clickedUrl) return false
  
  try {
    await openPath(clickedUrl.url)
    return true // Prevent default click behavior
  } catch (error) {
    console.error('Failed to open URL:', error)
    return false
  }
}

const handlePaste = (view: EditorView, event: ClipboardEvent): boolean => {
  const clipboardText = event.clipboardData?.getData('text/plain')
  if (!clipboardText || !urlRegex.test(clipboardText.trim())) {
    return false // Let default paste behavior handle non-URLs
  }

  const { state } = view
  const { from, to } = state.selection.main
  const selectedText = state.sliceDoc(from, to)

  if (selectedText.trim()) {
    // Create markdown link with selected text and pasted URL
    const linkText = `[${selectedText}](${clipboardText.trim()})`
    view.dispatch({
      changes: { from, to, insert: linkText },
    })
    return true // Prevent default paste
  }

  return false // Let default paste behavior handle if no text selected
}

// Global reference to editor functions for menu integration
let globalEditorRef: {
  toggleBold: () => void
  toggleItalic: () => void
  createLink: () => void
  formatHeading: (level: 0 | 1 | 2 | 3 | 4) => void
} | null = null

// Extend window to include editor focus tracking
declare global {
  interface Window {
    isEditorFocused: boolean
  }
}

export const EditorViewComponent: React.FC = () => {
  const { editorContent, setEditorContent, currentFile, saveFile, isDirty } =
    useAppStore()

  const editorRef = useRef<{ view?: EditorView }>(null)
  const [isAltPressed, setIsAltPressed] = useState(false)

  // Initialize global focus flag
  useEffect(() => {
    window.isEditorFocused = false
  }, [])

  // Track Alt key state for URL clicking
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && !isAltPressed) {
        setIsAltPressed(true)
        // Update CodeMirror state
        if (editorRef.current?.view) {
          editorRef.current.view.dispatch({
            effects: altKeyEffect.of(true)
          })
        }
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      if (!e.altKey && isAltPressed) {
        setIsAltPressed(false)
        // Update CodeMirror state
        if (editorRef.current?.view) {
          editorRef.current.view.dispatch({
            effects: altKeyEffect.of(false)
          })
        }
      }
    }

    // Handle window blur to reset Alt state
    const handleBlur = () => {
      setIsAltPressed(false)
      // Update CodeMirror state
      if (editorRef.current?.view) {
        editorRef.current.view.dispatch({
          effects: altKeyEffect.of(false)
        })
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('blur', handleBlur)
    }
  }, [isAltPressed])

  // Store handles auto-save, just update content
  const onChange = useCallback(
    (value: string) => {
      setEditorContent(value)
    },
    [setEditorContent]
  )

  // Manual save on blur for immediate feedback
  const handleBlur = useCallback(() => {
    if (currentFile && isDirty) {
      void saveFile()
    }
  }, [saveFile, currentFile, isDirty])

  // Track editor focus for menu state management
  const handleFocus = useCallback(() => {
    // Set global flag for menu state
    window.isEditorFocused = true
    if (currentFile) {
      void invoke('update_format_menu_state', { enabled: true })
    }
  }, [currentFile])

  const handleBlurFocus = useCallback(() => {
    // Clear global flag for menu state
    window.isEditorFocused = false
    void invoke('update_format_menu_state', { enabled: false })
    // Also call the original blur handler
    handleBlur()
  }, [handleBlur])

  // Callback when CodeMirror is ready
  const onEditorReady = useCallback((editor: { view?: EditorView }) => {
    if (editor?.view && !globalEditorRef) {
      const view = editor.view
      globalEditorRef = {
        toggleBold: () => toggleMarkdown(view, '**'),
        toggleItalic: () => toggleMarkdown(view, '*'),
        createLink: () => createMarkdownLink(view),
        formatHeading: level => transformLineToHeading(view, level),
      }
    }
  }, [])

  // Expose editor functions globally for menu integration
  useEffect(() => {
    // Clean up on unmount
    return () => {
      globalEditorRef = null
    }
  }, [])

  // Enhanced extensions for better writing experience
  const extensions = [
    altKeyState,
    urlHoverPlugin,
    markdown({
      extensions: [markdownStyleExtension],
    }),
    syntaxHighlighting(comprehensiveHighlightStyle),
    history(),
    // High-precedence custom markdown shortcuts
    Prec.high(
      keymap.of([
        {
          key: 'Mod-b',
          run: view => toggleMarkdown(view, '**'),
        },
        {
          key: 'Mod-i',
          run: view => toggleMarkdown(view, '*'),
        },
        {
          key: 'Mod-k',
          run: view => createMarkdownLink(view),
        },
        {
          key: 'Mod-s',
          run: () => {
            // Save shortcut
            if (currentFile && isDirty) {
              void saveFile()
            }
            return true
          },
        },
        // Heading transformation shortcuts
        {
          key: 'Alt-Mod-1',
          run: view => transformLineToHeading(view, 1),
        },
        {
          key: 'Alt-Mod-2',
          run: view => transformLineToHeading(view, 2),
        },
        {
          key: 'Alt-Mod-3',
          run: view => transformLineToHeading(view, 3),
        },
        {
          key: 'Alt-Mod-4',
          run: view => transformLineToHeading(view, 4),
        },
        {
          key: 'Alt-Mod-0',
          run: view => transformLineToHeading(view, 0),
        },
      ])
    ),
    // Default keymaps with lower precedence
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    // Event handlers for URL link creation and Alt+Click
    EditorView.domEventHandlers({
      paste: (event, view) => handlePaste(view, event),
      click: (event, view) => {
        // Handle Alt+Click for URL opening
        if (event.altKey) {
          void handleUrlClick(view, event)
        }
        return false // Let default handling proceed
      },
      keydown: event => {
        // Handle synthetic keyboard events from menu
        if (event.isTrusted === false) {
          // This is a synthetic event from menu, delegate to the editor
          return false // Let the keymap handle it
        }
        return false // Let default handling proceed
      },
    }),
    EditorView.theme({
      '&': {
        fontSize: 'var(--editor-font-size)',
        fontFamily: 'var(--editor-font-family)',
        fontWeight: 'var(--editor-font-weight-normal)',
        fontVariationSettings: 'var(--editor-font-variation-settings)',
        letterSpacing: 'var(--editor-letter-spacing)',
        WebkitFontSmoothing: 'subpixel-antialiased',
        backgroundColor: 'var(--editor-color-background)',
        color: 'var(--editor-color-text)',
        containerType: 'inline-size',
        containerName: 'editor',
      },
      '.cm-editor': {
        backgroundColor: 'var(--editor-color-background)',
        borderRadius: '0',
        outline: 'none',
      },
      '.cm-content': {
        lineHeight: 'var(--editor-line-height)',
        minHeight: '100vh',
        maxWidth: 'var(--editor-content-max-width)',
        margin: '0 auto',
        padding: '40px 0',
      },
      '.cm-scroller': {
        fontVariantLigatures: 'common-ligatures',
        backgroundColor: 'var(--editor-color-background)',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor.cm-focused': {
        outline: 'none !important',
      },
      '.cm-line': {
        padding: '0',
      },
      // Cursor styling
      '.cm-cursor': {
        borderLeftColor: 'var(--editor-color-carat)',
        borderLeftWidth: '3px',
        height: '1.1em',
      },
      // Selection styling - only fix the artifacts without breaking functionality
      '.cm-selectionBackground': {
        backgroundColor: 'var(--editor-color-selectedtext-background) !important',
      },
      '.cm-focused .cm-selectionBackground': {
        backgroundColor: 'var(--editor-color-selectedtext-background) !important',
      },
      // URL Alt+Click hover styling - keep it simple
      '&.alt-pressed .cm-content': {
        cursor: 'default',
      },
    }),
    EditorView.lineWrapping,
  ]

  return (
    <div className="editor-view" style={{ padding: '0 24px' }}>
      <CodeMirror
        className={`editor-codemirror ${isAltPressed ? 'alt-pressed' : ''}`}
        ref={editor => {
          if (editorRef.current !== editor) {
            // @ts-expect-error - ref assignment is necessary for editor access
            editorRef.current = editor
            if (editor) {
              onEditorReady(editor)
            }
          }
        }}
        value={editorContent}
        onChange={onChange}
        onFocus={handleFocus}
        onBlur={handleBlurFocus}
        extensions={extensions}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          highlightSelectionMatches: false,
          highlightActiveLine: false,
        }}
      />
    </div>
  )
}

// Export function to access editor commands from menu
export const getEditorCommands = () => globalEditorRef
