import { EditorView } from '@codemirror/view'

/**
 * Create the editor theme extension
 */
export const createEditorTheme = () => {
  return EditorView.theme({
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
  })
}

/**
 * Basic setup configuration for CodeMirror
 */
export const EDITOR_BASIC_SETUP = {
  lineNumbers: false,
  foldGutter: false,
  dropCursor: false, // We're adding our own custom dropCursor
  allowMultipleSelections: false,
  indentOnInput: true,
  bracketMatching: true,
  closeBrackets: true,
  autocompletion: false,
  highlightSelectionMatches: false,
  highlightActiveLine: false,
} as const
