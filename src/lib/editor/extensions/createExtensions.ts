import { EditorView, dropCursor } from '@codemirror/view'
import { markdown } from '@codemirror/lang-markdown'
import { syntaxHighlighting } from '@codemirror/language'
import { history } from '@codemirror/commands'
import { autocompletion } from '@codemirror/autocomplete'
import { markdownStyleExtension, comprehensiveHighlightStyle } from '../syntax'
import { altKeyState, urlHoverPlugin, handleUrlClick } from '../urls'
import { handlePaste } from '../paste'
import { createKeymapExtensions } from './keymap'
import { createEditorTheme } from './theme'

/**
 * Configuration for creating editor extensions
 */
export interface ExtensionConfig {
  onFocus: () => void
  onBlur: () => void
}

/**
 * Create all editor extensions
 */
export const createExtensions = (config: ExtensionConfig) => {
  const { onFocus, onBlur } = config

  const extensions = [
    // Core functionality
    altKeyState,
    urlHoverPlugin,
    dropCursor(),
    autocompletion(), // Required for snippet functionality

    // Language support
    markdown({
      extensions: [markdownStyleExtension],
    }),
    syntaxHighlighting(comprehensiveHighlightStyle),
    history(),

    // Keymaps
    ...createKeymapExtensions(),

    // Event handlers
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
      focus: () => {
        onFocus()
        return false
      },
      blur: () => {
        onBlur()
        return false
      },
    }),

    // Theme and styling
    createEditorTheme(),
    EditorView.lineWrapping,
  ]

  return extensions
}
