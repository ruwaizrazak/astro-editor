import { keymap } from '@codemirror/view'
import { defaultKeymap, historyKeymap } from '@codemirror/commands'
import { searchKeymap } from '@codemirror/search'
import { Prec } from '@codemirror/state'
import { toggleMarkdown, createMarkdownLink } from '../markdown/formatting'
import { transformLineToHeading } from '../markdown/headings'

/**
 * Create custom markdown shortcuts with high precedence
 */
export const createMarkdownKeymap = (onSave: () => void) => {
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
      {
        key: 'Mod-s',
        run: () => {
          onSave()
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
  )
}

/**
 * Create default keymaps with lower precedence
 */
export const createDefaultKeymap = () => {
  return keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap])
}

/**
 * Create all keymap extensions
 */
export const createKeymapExtensions = (onSave: () => void) => {
  return [createMarkdownKeymap(onSave), createDefaultKeymap()]
}
