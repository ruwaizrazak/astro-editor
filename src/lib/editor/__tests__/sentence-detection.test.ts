import { describe, test, expect } from 'vitest'
import { EditorState } from '@codemirror/state'
import { 
  detectSentencesInLine, 
  findCurrentSentence, 
  shouldExcludeLineFromFocus 
} from '../sentence-detection'

describe('Sentence Detection', () => {
  describe('detectSentencesInLine', () => {
    test('detects simple sentences', () => {
      const text = 'First sentence. Second sentence!'
      const sentences = detectSentencesInLine(text)
      
      expect(sentences).toEqual([
        { from: 0, to: 16 }, // "First sentence. "
        { from: 16, to: 32 }  // "Second sentence!"
      ])
    })

    test('handles single sentence', () => {
      const text = 'This is a single sentence.'
      const sentences = detectSentencesInLine(text)
      
      expect(sentences).toEqual([
        { from: 0, to: 26 }
      ])
    })

    test('handles text without ending punctuation', () => {
      const text = 'This has no ending punctuation'
      const sentences = detectSentencesInLine(text)
      
      expect(sentences).toEqual([
        { from: 0, to: 30 }
      ])
    })

    test('handles multiple question marks', () => {
      const text = 'What is this??? And this!'
      const sentences = detectSentencesInLine(text)
      
      expect(sentences).toEqual([
        { from: 0, to: 16 }, // "What is this??? "
        { from: 16, to: 26 }  // "And this!"
      ])
    })

    test('handles empty string', () => {
      const text = ''
      const sentences = detectSentencesInLine(text)
      
      expect(sentences).toEqual([])
    })

    test('handles text with only punctuation', () => {
      const text = '...'
      const sentences = detectSentencesInLine(text)
      
      expect(sentences).toEqual([
        { from: 0, to: 3 }
      ])
    })
  })

  describe('findCurrentSentence', () => {
    test('finds sentence containing cursor position', () => {
      const doc = 'First sentence. Second sentence! Third sentence.'
      const state = EditorState.create({ doc })
      
      // Cursor in first sentence
      const sentence1 = findCurrentSentence(state, 5)
      expect(sentence1).toEqual({ from: 0, to: 16 })
      
      // Cursor in second sentence
      const sentence2 = findCurrentSentence(state, 20)
      expect(sentence2).toEqual({ from: 16, to: 33 })
      
      // Cursor in third sentence
      const sentence3 = findCurrentSentence(state, 40)
      expect(sentence3).toEqual({ from: 33, to: 48 })
    })

    test('handles cursor at sentence boundaries', () => {
      const doc = 'First sentence. Second sentence!'
      const state = EditorState.create({ doc })
      
      // Cursor at end of first sentence
      const sentenceAtEnd = findCurrentSentence(state, 15)
      expect(sentenceAtEnd).toEqual({ from: 0, to: 16 })
      
      // Cursor at start of second sentence
      const sentenceAtStart = findCurrentSentence(state, 16)
      expect(sentenceAtStart).toEqual({ from: 16, to: 32 })
    })

    test('returns null for empty document', () => {
      const state = EditorState.create({ doc: '' })
      const sentence = findCurrentSentence(state, 0)
      expect(sentence).toBeNull()
    })

    test('handles multiline documents', () => {
      const doc = 'First line sentence.\nSecond line sentence.'
      const state = EditorState.create({ doc })
      
      // Cursor in first line
      const sentence1 = findCurrentSentence(state, 10)
      expect(sentence1).toEqual({ from: 0, to: 20 })
      
      // Cursor in second line  
      const sentence2 = findCurrentSentence(state, 30)
      expect(sentence2).toEqual({ from: 20, to: 42 })
    })
  })

  describe('shouldExcludeLineFromFocus', () => {
    test('excludes headers', () => {
      expect(shouldExcludeLineFromFocus('# Header')).toBe(true)
      expect(shouldExcludeLineFromFocus('## Sub Header')).toBe(true)
      expect(shouldExcludeLineFromFocus('### Deep Header')).toBe(true)
      expect(shouldExcludeLineFromFocus('#### Very Deep Header')).toBe(true)
    })

    test('excludes headers with whitespace', () => {
      expect(shouldExcludeLineFromFocus('  # Indented Header')).toBe(true) // Leading whitespace before # not typical
      expect(shouldExcludeLineFromFocus('#Header')).toBe(true) // No space after #
    })

    test('excludes code blocks', () => {
      expect(shouldExcludeLineFromFocus('```javascript')).toBe(true)
      expect(shouldExcludeLineFromFocus('```')).toBe(true)
      expect(shouldExcludeLineFromFocus('```python')).toBe(true)
    })

    test('excludes list items', () => {
      expect(shouldExcludeLineFromFocus('- List item')).toBe(true)
      expect(shouldExcludeLineFromFocus('* Another item')).toBe(true)
      expect(shouldExcludeLineFromFocus('+ Plus item')).toBe(true)
      expect(shouldExcludeLineFromFocus('  - Indented list item')).toBe(true)
      expect(shouldExcludeLineFromFocus('   * Indented asterisk item')).toBe(true)
    })

    test('includes regular text', () => {
      expect(shouldExcludeLineFromFocus('Regular text')).toBe(false)
      expect(shouldExcludeLineFromFocus('This is a normal sentence.')).toBe(false)
      expect(shouldExcludeLineFromFocus('Text with # symbol inside')).toBe(false)
      expect(shouldExcludeLineFromFocus('Text with - dash but not at start')).toBe(false)
    })

    test('handles edge cases', () => {
      expect(shouldExcludeLineFromFocus('')).toBe(false)
      expect(shouldExcludeLineFromFocus('   ')).toBe(false) // Only whitespace
      expect(shouldExcludeLineFromFocus('#')).toBe(true) // Just hash
      expect(shouldExcludeLineFromFocus('-')).toBe(false) // Just dash (needs space after)
      expect(shouldExcludeLineFromFocus('- ')).toBe(true) // Dash with space
    })
  })
})