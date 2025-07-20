import { EditorState } from '@codemirror/state'

// Simple sentence boundary regex (starting point)
const SENTENCE_BOUNDARY_REGEX = /[.!?]+(?:\s+|$)/g

// Cache for sentence detection results to improve performance
const sentenceCache = new Map<string, Array<{ from: number; to: number }>>()
const MAX_CACHE_SIZE = 1000 // Limit cache size to prevent memory issues

/**
 * Detects sentence boundaries in a text line with caching for performance
 * Returns array of sentence ranges within the line
 */
export function detectSentencesInLine(lineText: string): Array<{ from: number; to: number }> {
  // Check cache first for performance
  if (sentenceCache.has(lineText)) {
    return sentenceCache.get(lineText)!
  }
  
  const sentences: Array<{ from: number; to: number }> = []
  const matches = Array.from(lineText.matchAll(SENTENCE_BOUNDARY_REGEX))
  
  let lastEnd = 0
  
  for (const match of matches) {
    if (match.index !== undefined) {
      const sentenceEnd = match.index + match[0].length
      
      // Create sentence range
      sentences.push({
        from: lastEnd,
        to: sentenceEnd
      })
      
      lastEnd = sentenceEnd
    }
  }
  
  // Handle last sentence if line doesn't end with punctuation
  if (lastEnd < lineText.length) {
    sentences.push({
      from: lastEnd,
      to: lineText.length
    })
  }
  
  // Cache the result with size limit
  if (sentenceCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first in Map)
    const firstKey = sentenceCache.keys().next().value
    if (firstKey !== undefined) {
      sentenceCache.delete(firstKey)
    }
  }
  sentenceCache.set(lineText, sentences)
  
  return sentences
}

/**
 * Find the sentence containing the given cursor position
 */
export function findCurrentSentence(
  state: EditorState, 
  cursorPos: number
): { from: number; to: number } | null {
  const line = state.doc.lineAt(cursorPos)
  const sentences = detectSentencesInLine(line.text)
  const relativeCursorPos = cursorPos - line.from
  
  for (const sentence of sentences) {
    if (relativeCursorPos >= sentence.from && relativeCursorPos <= sentence.to) {
      return {
        from: line.from + sentence.from,
        to: line.from + sentence.to
      }
    }
  }
  
  return null
}

/**
 * Check if a line should be excluded from sentence detection
 * (headers, code blocks, etc.)
 */
export function shouldExcludeLineFromFocus(lineText: string): boolean {
  const trimmed = lineText.trim()
  
  // Skip headers (including indented headers)
  if (trimmed.startsWith('#')) return true
  
  // Skip code blocks (simple detection)
  if (trimmed.startsWith('```')) return true
  
  // Skip list items
  if (/^\s*[-*+]\s/.test(lineText)) return true
  
  return false
}