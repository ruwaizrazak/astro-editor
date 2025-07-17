/**
 * URL detection utilities for the editor
 */

export interface UrlMatch {
  url: string
  from: number
  to: number
}

// URL detection regex
export const urlRegex = /^https?:\/\/[^\s]+$/

/**
 * Enhanced URL detection for both plain URLs and markdown links
 * @param text - Text to search for URLs
 * @param offset - Offset to add to positions (for line-based searching)
 * @returns Array of URL matches with positions
 */
export const findUrlsInText = (
  text: string,
  offset: number = 0
): UrlMatch[] => {
  const urls: UrlMatch[] = []

  // Find plain URLs
  const plainUrlRegex = /https?:\/\/[^\s)]+/g
  let match
  while ((match = plainUrlRegex.exec(text)) !== null) {
    urls.push({
      url: match[0],
      from: offset + match.index,
      to: offset + match.index + match[0].length,
    })
  }

  // Find markdown link URLs [text](url)
  const markdownLinkRegex = /\[([^\]]*)\]\(([^)]+)\)/g
  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const linkUrl = match[2]
    const linkText = match[1]
    if (
      linkUrl &&
      linkText &&
      linkUrl.startsWith('http') &&
      match.index !== undefined
    ) {
      // Position of the URL part within the markdown link
      const urlStart = match.index + linkText.length + 3 // after "]("
      urls.push({
        url: linkUrl,
        from: offset + urlStart,
        to: offset + urlStart + linkUrl.length,
      })
    }
  }

  return urls
}

/**
 * Check if a string is a valid URL
 * @param text - Text to check
 * @returns true if text is a valid URL
 */
export const isValidUrl = (text: string): boolean => {
  return urlRegex.test(text.trim())
}
