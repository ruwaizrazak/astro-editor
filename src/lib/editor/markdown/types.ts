/**
 * Types for markdown editing utilities
 */

export type HeadingLevel = 0 | 1 | 2 | 3 | 4

export interface MarkdownLinkMatch {
  linkText: string
  linkUrl: string
  linkStart: number
  linkEnd: number
  urlStart: number
  urlEnd: number
}
