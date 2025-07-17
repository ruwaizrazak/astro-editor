import { styleTags } from '@lezer/highlight'
import { markdownTags } from './markdownTags'

/**
 * Style extension that maps Lezer parser nodes to our custom markdown tags
 * This is where we connect the markdown parser output to our styling system
 */
export const markdownStyleExtension = {
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
      'Image/URL': markdownTags.imageUrl,

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
