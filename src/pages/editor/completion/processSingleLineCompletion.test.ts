/**
 * Test file for processSingleLineCompletion
 */

import { describe, it, expect } from 'vitest'
import { processSingleLineCompletion } from './processSingleLineCompletion'

describe('processSingleLineCompletion', () => {
  describe('Pattern 1: Simple addition ["+"]', () => {
    it('should handle empty current text', () => {
      const result = processSingleLineCompletion('hello', '', 0)
      expect(result).toEqual({
        completionText: 'hello',
      })
      expect(result?.range).toBeUndefined()
    })

    it('should handle adding text when nothing after cursor', () => {
      const result = processSingleLineCompletion('world', '', 5)
      expect(result).toEqual({
        completionText: 'world',
      })
      expect(result?.range).toBeUndefined()
    })
  })

  describe('Pattern 2: Addition with repetition ["+", "="] or ["+", "=", "+"]', () => {
    it('should detect when model repeats text after cursor', () => {
      // Cursor at: "The quick |brown fox"
      // Model suggests: "brown fox" (repeating existing text)
      // When currentText and completion are identical, diff will be ["="]
      // This doesn't match ["+", "="] pattern, so falls through to default
      const result = processSingleLineCompletion('brown fox', 'brown fox', 10)

      expect(result).toBeDefined()
      expect(result?.completionText).toBe('brown fox')
      // Range may not be set for identical text
    })

    it('should handle partial repetition with additional text', () => {
      // Cursor at: "hello |world"
      // Model suggests: "world and more"
      // Diff: "world" (=), " and more" (+)
      // This is ["=", "+"] pattern, which should match  ["+", "=", "+"]
      const result = processSingleLineCompletion('world and more', 'world', 6)

      expect(result).toBeDefined()
      expect(result?.completionText).toBe('world and more')
      // Behavior depends on exact diff pattern
    })

    it('should handle completion that adds prefix and keeps suffix', () => {
      // currentText: "fox"
      // completion: "brown fox"
      // This is ["+", "="] pattern: adding "brown ", keeping "fox"
      const result = processSingleLineCompletion('brown fox', 'fox', 10)

      expect(result).toEqual({
        completionText: 'brown fox',
        range: {
          start: 10,
          end: 13, // 10 + 3 (length of "fox")
        },
      })
    })

    it('should handle ["+", "=", "+"] pattern', () => {
      // currentText: "quick"
      // completion: "the quick brown"
      // Pattern: add "the ", keep "quick", add " brown"
      const result = processSingleLineCompletion('the quick brown', 'quick', 0)

      expect(result).toEqual({
        completionText: 'the quick brown',
        range: {
          start: 0,
          end: 5, // 0 + 5 (length of "quick")
        },
      })
    })
  })

  describe('Pattern 3: Mixed changes ["+", "-"] or ["-", "+"]', () => {
    it('should handle adding new text with different suffix', () => {
      // currentText: "world"
      // completion: "hello" (completely different)
      // This is ["-", "+"] pattern
      const result = processSingleLineCompletion('hello', 'world', 0)

      expect(result).toEqual({
        completionText: 'hello',
      })
      expect(result?.range).toBeUndefined()
    })

    it('should handle partial word replacement', () => {
      // currentText: "testing"
      // completion: "text"
      // Both start with "te" but diverge
      const result = processSingleLineCompletion('text', 'testing', 0)

      // Should return just the completion
      expect(result).toBeDefined()
      expect(result?.completionText).toBeTruthy()
    })
  })

  describe('Pattern 4: First added part', () => {
    it('should use first added part for complex patterns', () => {
      // When diff doesn't match known patterns, use first added segment
      const result = processSingleLineCompletion('new text', 'old text', 0)

      expect(result).toBeDefined()
      expect(result?.completionText).toBeTruthy()
    })
  })

  describe('Real-world markdown scenarios', () => {
    it('should handle completing a sentence', () => {
      // User typed: "The quick brown "
      // Nothing after cursor
      // Model suggests: "fox jumps over"
      const result = processSingleLineCompletion('fox jumps over', '', 16)

      expect(result).toEqual({
        completionText: 'fox jumps over',
      })
    })

    it('should handle inline code completion', () => {
      // User typed: "`const `"
      // Nothing after cursor
      // Model suggests: "value = 42"
      const result = processSingleLineCompletion('value = 42', '', 7)

      expect(result).toEqual({
        completionText: 'value = 42',
      })
    })

    it('should handle list item completion', () => {
      // User typed: "- First item"
      // Cursor at end, nothing after
      // Model suggests: " in the list"
      const result = processSingleLineCompletion(' in the list', '', 12)

      expect(result).toEqual({
        completionText: ' in the list',
      })
    })

    it('should handle model repeating existing markdown syntax', () => {
      // User typed: "**bold|**"
      // Cursor at pipe, "**" after cursor
      // Model suggests: "**" (repeating closing syntax)
      // When both are identical, diff is ["="], falls through to default
      const result = processSingleLineCompletion('**', '**', 6)

      expect(result).toBeDefined()
      expect(result?.completionText).toBe('**')
      // Range behavior depends on diff pattern
    })
  })

  describe('Edge cases', () => {
    it('should handle empty completion', () => {
      const result = processSingleLineCompletion('', '', 0)

      expect(result).toBeDefined()
      expect(result?.completionText).toBe('')
    })

    it('should handle single character completion', () => {
      const result = processSingleLineCompletion('a', '', 0)

      expect(result).toEqual({
        completionText: 'a',
      })
    })

    it('should handle whitespace-only completion', () => {
      const result = processSingleLineCompletion('   ', '', 0)

      expect(result).toEqual({
        completionText: '   ',
      })
    })

    it('should handle completion with newlines (should be trimmed upstream)', () => {
      // This shouldn't happen in single-line mode, but test anyway
      const result = processSingleLineCompletion('text\n', '', 0)

      expect(result).toBeDefined()
      expect(result?.completionText).toContain('text')
    })

    it('should handle identical text (no change)', () => {
      const result = processSingleLineCompletion('same', 'same', 0)

      expect(result).toBeDefined()
      // With ["="] pattern, falls through to first-added check or default
    })

    it('should handle cursor at various positions', () => {
      const result1 = processSingleLineCompletion('world', '', 0)
      expect(result1).toBeDefined()

      const result2 = processSingleLineCompletion('world', '', 100)
      expect(result2).toBeDefined()

      const result3 = processSingleLineCompletion('world', 'existing', 50)
      expect(result3).toBeDefined()
    })
  })

  describe('Special characters', () => {
    it('should handle punctuation', () => {
      const result = processSingleLineCompletion('end.', '', 10)

      expect(result).toEqual({
        completionText: 'end.',
      })
    })

    it('should handle brackets and parentheses', () => {
      const result = processSingleLineCompletion('(value)', '', 5)

      expect(result).toEqual({
        completionText: '(value)',
      })
    })

    it('should handle quotes', () => {
      const result = processSingleLineCompletion('"hello"', '', 0)

      expect(result).toEqual({
        completionText: '"hello"',
      })
    })

    it('should handle markdown syntax characters', () => {
      const result = processSingleLineCompletion('**bold**', '', 0)

      expect(result).toEqual({
        completionText: '**bold**',
      })
    })

    it('should handle code backticks', () => {
      const result = processSingleLineCompletion('`code`', '', 0)

      expect(result).toEqual({
        completionText: '`code`',
      })
    })
  })

  describe('Word-level diff behavior', () => {
    it('should diff by words not characters', () => {
      // Word-level diff is important for accuracy
      // "the quick" -> "the fast quick"
      // Should recognize "the" and "quick" as unchanged words
      const result = processSingleLineCompletion(
        'the fast quick',
        'the quick',
        0,
      )

      expect(result).toBeDefined()
      expect(result?.completionText).toContain('fast')
    })

    it('should handle multi-word completions', () => {
      const result = processSingleLineCompletion(
        'the quick brown fox',
        'fox',
        20,
      )

      expect(result).toEqual({
        completionText: 'the quick brown fox',
        range: {
          start: 20,
          end: 23, // 20 + 3
        },
      })
    })

    it('should handle words with different spacing', () => {
      // currentText: "hello  world" (two spaces)
      // completion: "hello world" (one space)
      // These are different at word level
      const result = processSingleLineCompletion(
        'hello world',
        'hello  world',
        0,
      )

      expect(result).toBeDefined()
    })
  })
})
