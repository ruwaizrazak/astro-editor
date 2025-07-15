import React, { useCallback } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { keymap } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { EditorSelection, Prec } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { Tag, styleTags, tags } from '@lezer/highlight'
import { useAppStore } from '../../store'
import './EditorView.css'

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
    }),
  ],
}

// Create comprehensive highlight style that includes both markdown and standard language tags
const comprehensiveHighlightStyle = HighlightStyle.define([
  // === MARKDOWN-SPECIFIC TAGS ===
  // Headings - Purple family
  {
    tag: markdownTags.heading1,
    fontSize: '1.8em',
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  {
    tag: markdownTags.heading2,
    fontSize: '1.6em',
    fontWeight: 'bold',
    color: '#A855F7',
  },
  {
    tag: markdownTags.heading3,
    fontSize: '1.4em',
    fontWeight: 'bold',
    color: '#C084FC',
  },
  {
    tag: markdownTags.heading4,
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#D8B4FE',
  },
  {
    tag: markdownTags.heading5,
    fontSize: '1.1em',
    fontWeight: 'bold',
    color: '#E9D5FF',
  },
  {
    tag: markdownTags.heading6,
    fontSize: '1.05em',
    fontWeight: 'bold',
    color: '#F3E8FF',
  },
  { tag: markdownTags.headingMark, color: '#6B7280', opacity: '0.6' },

  // Emphasis and Strong - Orange/Red family
  { tag: markdownTags.emphasis, fontStyle: 'italic', color: '#F97316' },
  { tag: markdownTags.emphasisMark, color: '#FB923C', opacity: '0.7' },
  { tag: markdownTags.strong, fontWeight: 'bold', color: '#DC2626' },
  { tag: markdownTags.strongMark, color: '#EF4444', opacity: '0.7' },
  {
    tag: markdownTags.strikethrough,
    textDecoration: 'line-through',
    color: '#9CA3AF',
  },
  { tag: markdownTags.strikethroughMark, color: '#D1D5DB', opacity: '0.7' },

  // Code - Green family
  {
    tag: markdownTags.inlineCode,
    backgroundColor: '#F0FDF4',
    color: '#15803D',
    fontFamily: 'monospace',
    padding: '2px 4px',
    borderRadius: '3px',
  },
  { tag: markdownTags.inlineCodeMark, color: '#22C55E', opacity: '0.6' },
  {
    tag: markdownTags.codeBlock,
    backgroundColor: '#F0FDF4',
    color: '#059669',
    fontFamily: 'monospace',
  },
  { tag: markdownTags.codeBlockMark, color: '#10B981', opacity: '0.6' },
  { tag: markdownTags.codeFence, color: '#6EE7B7', fontWeight: 'bold' },

  // Links and Images - Blue family
  { tag: markdownTags.link, color: '#2563EB' },
  { tag: markdownTags.linkMark, color: '#3B82F6', opacity: '0.7' },
  { tag: markdownTags.linkText, color: '#1D4ED8', textDecoration: 'underline' },
  { tag: markdownTags.linkUrl, color: '#1E40AF', opacity: '0.8' },
  { tag: markdownTags.image, color: '#7C3AED' },
  { tag: markdownTags.imageMark, color: '#8B5CF6', opacity: '0.7' },
  { tag: markdownTags.imageAlt, color: '#A855F7', fontStyle: 'italic' },
  { tag: markdownTags.imageUrl, color: '#9333EA', opacity: '0.8' },

  // Lists - Teal family
  { tag: markdownTags.listMark, color: '#0D9488', fontWeight: 'bold' },
  { tag: markdownTags.listItem, color: '#14B8A6' },

  // Blockquotes - Yellow family
  {
    tag: markdownTags.blockquote,
    color: '#D97706',
    fontStyle: 'italic',
    borderLeft: '4px solid #FBBF24',
    paddingLeft: '1em',
  },
  { tag: markdownTags.blockquoteMark, color: '#F59E0B', opacity: '0.7' },

  // Horizontal Rules - Gray family
  {
    tag: markdownTags.horizontalRule,
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    height: '2px',
  },

  // Tables - Indigo family
  { tag: markdownTags.table, color: '#4F46E5' },
  { tag: markdownTags.tableHeader, color: '#6366F1', fontWeight: 'bold' },
  { tag: markdownTags.tableSeparator, color: '#818CF8', opacity: '0.7' },
  { tag: markdownTags.tableRow, color: '#A5B4FC' },
  { tag: markdownTags.tableCell, color: '#C7D2FE' },

  // HTML - Pink family (for markdown-specific HTML tags)
  { tag: markdownTags.htmlTag, color: '#EC4899' },
  { tag: markdownTags.htmlAttribute, color: '#F472B6' },

  // Escape - Gray
  { tag: markdownTags.escape, color: '#9CA3AF', opacity: '0.8' },

  // === STANDARD LANGUAGE TAGS (HTML, CSS, JS, etc.) ===
  // HTML Tags - Red/Pink family
  { tag: tags.tagName, color: '#E11D48', fontWeight: 'bold' },
  { tag: tags.angleBracket, color: '#F43F5E', opacity: '0.8' },
  { tag: tags.attributeName, color: '#EC4899', fontStyle: 'italic' },
  { tag: tags.attributeValue, color: '#BE185D' },

  // JavaScript/Programming - Blue family
  { tag: tags.keyword, color: '#2563EB', fontWeight: 'bold' },
  { tag: tags.function(tags.variableName), color: '#1D4ED8' },
  { tag: tags.variableName, color: '#1E40AF' },
  { tag: tags.className, color: '#3B82F6', fontWeight: 'bold' },
  { tag: tags.namespace, color: '#60A5FA' },
  { tag: tags.typeName, color: '#93C5FD' },

  // Literals - Green family
  { tag: tags.string, color: '#059669' },
  { tag: tags.character, color: '#10B981' },
  { tag: tags.number, color: '#059669' },
  { tag: tags.bool, color: '#16A34A', fontWeight: 'bold' },
  { tag: tags.null, color: '#15803D', fontStyle: 'italic' },

  // Comments - Gray family
  { tag: tags.comment, color: '#6B7280', fontStyle: 'italic' },
  { tag: tags.blockComment, color: '#9CA3AF', fontStyle: 'italic' },
  { tag: tags.lineComment, color: '#9CA3AF', fontStyle: 'italic' },
  {
    tag: tags.docComment,
    color: '#6B7280',
    fontStyle: 'italic',
    fontWeight: 'bold',
  },

  // Operators and Punctuation - Purple family
  { tag: tags.operator, color: '#7C3AED' },
  { tag: tags.punctuation, color: '#8B5CF6' },
  { tag: tags.bracket, color: '#A855F7' },
  { tag: tags.paren, color: '#C084FC' },
  { tag: tags.squareBracket, color: '#DDD6FE' },

  // CSS - Cyan family
  { tag: tags.propertyName, color: '#0891B2', fontWeight: 'bold' },
  { tag: tags.unit, color: '#06B6D4' },
  { tag: tags.color, color: '#67E8F9', fontWeight: 'bold' },

  // Special/Meta - Orange family
  { tag: tags.meta, color: '#EA580C' },
  { tag: tags.processingInstruction, color: '#F97316' },
  {
    tag: tags.definition(tags.variableName),
    color: '#FB923C',
    fontWeight: 'bold',
  },
  {
    tag: tags.definition(tags.function(tags.variableName)),
    color: '#FDBA74',
    fontWeight: 'bold',
  },

  // Invalid/Error - Red family
  { tag: tags.invalid, color: '#DC2626', textDecoration: 'underline wavy' },
  { tag: tags.deleted, color: '#EF4444', textDecoration: 'line-through' },
  { tag: tags.inserted, color: '#10B981', backgroundColor: '#DCFCE7' },
  { tag: tags.changed, color: '#F59E0B', backgroundColor: '#FEF3C7' },

  // URLs and Links - Blue variations
  { tag: tags.url, color: '#1E40AF', textDecoration: 'underline' },
  { tag: tags.link, color: '#2563EB', textDecoration: 'underline' },

  // Headings (for other languages that have them) - Purple variations
  {
    tag: tags.heading,
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  {
    tag: tags.heading1,
    fontSize: '1.8em',
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  {
    tag: tags.heading2,
    fontSize: '1.6em',
    fontWeight: 'bold',
    color: '#A855F7',
  },
  {
    tag: tags.heading3,
    fontSize: '1.4em',
    fontWeight: 'bold',
    color: '#C084FC',
  },
  {
    tag: tags.heading4,
    fontSize: '1.2em',
    fontWeight: 'bold',
    color: '#D8B4FE',
  },
  {
    tag: tags.heading5,
    fontSize: '1.1em',
    fontWeight: 'bold',
    color: '#E9D5FF',
  },
  {
    tag: tags.heading6,
    fontSize: '1.05em',
    fontWeight: 'bold',
    color: '#F3E8FF',
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

const createMarkdownLink = async (view: EditorView): Promise<boolean> => {
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

  // Try to get clipboard content
  let clipboardUrl = ''
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      clipboardUrl = await navigator.clipboard.readText()
    }
  } catch {
    // Clipboard access failed, continue with normal behavior
  }

  // Check if clipboard contains a URL
  const isClipboardUrl = clipboardUrl && urlRegex.test(clipboardUrl.trim())

  if (selectedText.trim()) {
    // If text is selected, create link with text as anchor
    const url = isClipboardUrl ? clipboardUrl.trim() : 'url'
    const linkText = `[${selectedText}](${url})`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: isClipboardUrl
        ? EditorSelection.range(from + linkText.length, from + linkText.length)
        : EditorSelection.range(
            from + selectedText.length + 3,
            from + selectedText.length + 6
          ),
    })
  } else {
    // If no text selected, create empty link template
    const url = isClipboardUrl ? clipboardUrl.trim() : 'url'
    const linkText = `[text](${url})`
    view.dispatch({
      changes: { from, to, insert: linkText },
      selection: EditorSelection.range(from + 1, from + 5),
    })
  }

  return true
}

// URL detection regex
const urlRegex = /^https?:\/\/[^\s]+$/

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

export const EditorViewComponent: React.FC = () => {
  const { editorContent, setEditorContent, currentFile, saveFile, isDirty } =
    useAppStore()

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

  // Enhanced extensions for better writing experience
  const extensions = [
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
          run: view => {
            void createMarkdownLink(view)
            return true
          },
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
      ])
    ),
    // Default keymaps with lower precedence
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    // Paste event handler for URL link creation
    EditorView.domEventHandlers({
      paste: (event, view) => handlePaste(view, event),
    }),
    EditorView.theme({
      '&': {
        fontSize: '16px',
        fontFamily:
          "'iA Writer Duo', -apple-system, 'Segoe UI', 'Roboto', sans-serif;",
        padding: '20px 40px',
      },
      '.cm-content': {
        lineHeight: '1.7',
        minHeight: '100vh',
        maxWidth: '65ch',
        margin: '0 auto',
      },
      '.cm-focused': {
        outline: 'none',
      },
      '.cm-editor': {
        borderRadius: '0',
      },
      '.cm-scroller': {
        fontVariantLigatures: 'common-ligatures',
      },
      '.cm-line': {},
    }),
    EditorView.lineWrapping,
  ]

  return (
    <div className="editor-view">
      <CodeMirror
        value={editorContent}
        onChange={onChange}
        onBlur={handleBlur}
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
        className="editor-codemirror"
      />
    </div>
  )
}
