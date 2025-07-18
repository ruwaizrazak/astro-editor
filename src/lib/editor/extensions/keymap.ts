import { keymap } from '@codemirror/view'
import {
  defaultKeymap,
  historyKeymap,
  toggleComment,
} from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import {
  nextSnippetField,
  prevSnippetField,
  clearSnippet,
} from '@codemirror/autocomplete'
import { Prec } from '@codemirror/state'
import { toggleMarkdown, createMarkdownLink } from '../markdown/formatting'
import { transformLineToHeading } from '../markdown/headings'
import { useComponentBuilderStore } from '../../../store/componentBuilderStore'
import { useAppStore } from '../../../store'

/**
 * Create custom markdown shortcuts with high precedence
 */
export const createMarkdownKeymap = () => {
  return Prec.high(
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
      // This is the new keybinding for the component inserter.
      {
        key: 'Mod-/',
        run: view => {
          const { currentFile } = useAppStore.getState()
          if (currentFile?.extension === 'mdx') {
            useComponentBuilderStore.getState().open(view)
            return true
          }
          // For non-mdx files, run the default comment toggling.
          return toggleComment(view)
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
  )
}

/**
 * Create default keymaps with lower precedence, but filter out the default
 * comment toggling so we can use it for our component inserter.
 */
export const createDefaultKeymap = () => {
  // Filter out the default Mod-/ keybinding for comment toggling
  const filteredDefaultKeymap = defaultKeymap.filter(
    k => k.run !== toggleComment
  )

  return keymap.of([
    ...filteredDefaultKeymap,
    ...historyKeymap,
    ...searchKeymap,
  ])
}

/**
 * Create snippet navigation keymap
 */
export const createSnippetKeymap = () => {
  return keymap.of([
    {
      key: 'Tab',
      run: nextSnippetField,
    },
    {
      key: 'Shift-Tab',
      run: prevSnippetField,
    },
    {
      key: 'Escape',
      run: clearSnippet,
    },
  ])
}

/**
 * Create all keymap extensions
 */
export const createKeymapExtensions = () => {
  return [
    createMarkdownKeymap(),
    createDefaultKeymap(),
    // Add snippet navigation keymap to enable Tab/Shift-Tab navigation
    createSnippetKeymap(),
  ]
}
