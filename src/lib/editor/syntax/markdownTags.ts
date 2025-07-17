import { Tag } from '@lezer/highlight'

/**
 * Comprehensive markdown tags for custom syntax highlighting
 * These tags provide complete control over markdown element styling
 */
export const markdownTags = {
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
