/**
 * Markdown editing utilities
 *
 * This module provides utilities for editing markdown content in CodeMirror 6:
 *
 * - Text formatting (bold, italic, strikethrough)
 * - Link creation and editing
 * - Heading level transformation
 * - Markdown parsing utilities
 *
 * All functions are pure and testable, taking a CodeMirror EditorView
 * and returning boolean to indicate if the command was handled.
 */

export {
  toggleMarkdown,
  createMarkdownLink,
  parseMarkdownLinks,
} from './formatting'
export { transformLineToHeading, getHeadingLevel, isHeading } from './headings'
export type { HeadingLevel, MarkdownLinkMatch } from './types'
