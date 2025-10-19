/**
 * Test file for multilineClassification
 */

import { describe, it, expect } from 'vitest'
import {
  shouldCompleteMultiline,
  type MultilineContext,
} from './multilineClassification'

describe('multilineClassification', () => {
  describe('shouldCompleteMultiline', () => {
    describe('Midline completions (should be single-line)', () => {
      it('should not allow multiline when cursor mid-sentence', () => {
        const context: MultilineContext = {
          currentLine: 'The quick brown fox',
          fullPrefix: 'The quick ',
          fullSuffix: 'brown fox',
          cursorPosition: { lineNumber: 1, column: 11 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should not allow multiline when text after cursor on same line', () => {
        const context: MultilineContext = {
          currentLine: 'Hello world',
          fullPrefix: 'Hello ',
          fullSuffix: 'world',
          cursorPosition: { lineNumber: 1, column: 7 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should allow multiline when at end of line', () => {
        const context: MultilineContext = {
          currentLine: 'This is a paragraph',
          fullPrefix: 'This is a paragraph',
          fullSuffix: '\nNext line',
          cursorPosition: { lineNumber: 1, column: 20 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline when no suffix', () => {
        const context: MultilineContext = {
          currentLine: 'End of document',
          fullPrefix: 'End of document',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 16 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })
    })

    describe('Markdown headings (should be single-line)', () => {
      it('should not allow multiline for H1 heading', () => {
        const context: MultilineContext = {
          currentLine: '# My Heading',
          fullPrefix: '# My Heading',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 13 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should not allow multiline for H2 heading', () => {
        const context: MultilineContext = {
          currentLine: '## Section Title',
          fullPrefix: '## Section Title',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 17 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should not allow multiline for H6 heading', () => {
        const context: MultilineContext = {
          currentLine: '###### Small heading',
          fullPrefix: '###### Small heading',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 21 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should handle heading with leading whitespace', () => {
        const context: MultilineContext = {
          currentLine: '   # Indented Heading',
          fullPrefix: '   # Indented Heading',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 22 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })
    })

    describe('Markdown blockquotes (should be single-line)', () => {
      it('should not allow multiline for blockquote', () => {
        const context: MultilineContext = {
          currentLine: '> This is a quote',
          fullPrefix: '> This is a quote',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 18 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should handle blockquote with leading whitespace', () => {
        const context: MultilineContext = {
          currentLine: '  > Indented quote',
          fullPrefix: '  > Indented quote',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 19 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })
    })

    describe('Horizontal rules (should be single-line)', () => {
      it('should not allow multiline for dash rule', () => {
        const context: MultilineContext = {
          currentLine: '---',
          fullPrefix: '---',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 4 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should not allow multiline for asterisk rule', () => {
        const context: MultilineContext = {
          currentLine: '***',
          fullPrefix: '***',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 4 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should not allow multiline for underscore rule', () => {
        const context: MultilineContext = {
          currentLine: '___',
          fullPrefix: '___',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 4 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should not allow multiline for longer rule', () => {
        const context: MultilineContext = {
          currentLine: '------',
          fullPrefix: '------',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 7 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })
    })

    describe('Inline markdown (should be single-line)', () => {
      it('should not allow multiline inside inline code', () => {
        const context: MultilineContext = {
          currentLine: 'The `code',
          fullPrefix: 'The `code',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 10 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should allow multiline outside inline code', () => {
        const context: MultilineContext = {
          currentLine: 'The `code` is here',
          fullPrefix: 'The `code` is here',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 19 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should not allow multiline inside link brackets', () => {
        const context: MultilineContext = {
          currentLine: 'Visit [my website',
          fullPrefix: 'Visit [my website',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 18 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should allow multiline after complete link', () => {
        const context: MultilineContext = {
          currentLine: 'Visit [my website](https://example.com)',
          fullPrefix: 'Visit [my website](https://example.com)',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 40 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should handle multiple backticks correctly', () => {
        // First backtick opens, second closes, third opens
        const context: MultilineContext = {
          currentLine: 'Code `x` and `y',
          fullPrefix: 'Code `x` and `y',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 16 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })
    })

    describe('List items (should allow multiline)', () => {
      it('should allow multiline for bullet list with dash', () => {
        const context: MultilineContext = {
          currentLine: '- First item',
          fullPrefix: '- First item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 13 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for bullet list with asterisk', () => {
        const context: MultilineContext = {
          currentLine: '* Second item',
          fullPrefix: '* Second item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 14 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for bullet list with plus', () => {
        const context: MultilineContext = {
          currentLine: '+ Third item',
          fullPrefix: '+ Third item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 13 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for numbered list', () => {
        const context: MultilineContext = {
          currentLine: '1. First item',
          fullPrefix: '1. First item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 14 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for double-digit numbered list', () => {
        const context: MultilineContext = {
          currentLine: '42. Item forty-two',
          fullPrefix: '42. Item forty-two',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 19 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for task list (unchecked)', () => {
        const context: MultilineContext = {
          currentLine: '- [ ] Todo item',
          fullPrefix: '- [ ] Todo item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 16 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for task list (checked)', () => {
        const context: MultilineContext = {
          currentLine: '- [x] Done item',
          fullPrefix: '- [x] Done item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 16 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should handle indented list items', () => {
        const context: MultilineContext = {
          currentLine: '  - Nested item',
          fullPrefix: '  - Nested item',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 16 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })
    })

    describe('Paragraphs (should allow multiline)', () => {
      it('should allow multiline for regular paragraph', () => {
        const context: MultilineContext = {
          currentLine: 'This is a regular paragraph with some text',
          fullPrefix: 'This is a regular paragraph with some text',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 43 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for sentence ending', () => {
        const context: MultilineContext = {
          currentLine: 'This is the end of a sentence.',
          fullPrefix: 'This is the end of a sentence.',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 31 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for short lines (default behavior)', () => {
        const context: MultilineContext = {
          currentLine: 'Hi',
          fullPrefix: 'Hi',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 3 },
        }
        // Even short lines default to multiline if not caught by other rules
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for 4+ character lines', () => {
        const context: MultilineContext = {
          currentLine: 'Test',
          fullPrefix: 'Test',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 5 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })
    })

    describe('Edge cases', () => {
      it('should allow multiline for empty line (default behavior)', () => {
        const context: MultilineContext = {
          currentLine: '',
          fullPrefix: '',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 1 },
        }
        // Empty line defaults to multiline (not caught by special rules)
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should allow multiline for line with only whitespace (default behavior)', () => {
        const context: MultilineContext = {
          currentLine: '    ',
          fullPrefix: '    ',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 5 },
        }
        // Whitespace defaults to multiline
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should handle code fence start', () => {
        const context: MultilineContext = {
          currentLine: '```javascript',
          fullPrefix: '```javascript',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 14 },
        }
        // Code fence is not a paragraph
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should prioritize mid-line check over other rules', () => {
        // Even in a list, mid-line should be single-line
        const context: MultilineContext = {
          currentLine: '- First item with more text',
          fullPrefix: '- First ',
          fullSuffix: 'item with more text',
          cursorPosition: { lineNumber: 1, column: 9 },
        }
        expect(shouldCompleteMultiline(context)).toBe(false)
      })

      it('should handle cursor at beginning of line', () => {
        const context: MultilineContext = {
          currentLine: 'Regular paragraph',
          fullPrefix: '',
          fullSuffix: 'Regular paragraph',
          cursorPosition: { lineNumber: 1, column: 1 },
        }
        // Mid-line (text after cursor)
        expect(shouldCompleteMultiline(context)).toBe(false)
      })
    })

    describe('Complex markdown scenarios', () => {
      it('should handle bold text in paragraph', () => {
        const context: MultilineContext = {
          currentLine: 'This is **bold** text in a paragraph',
          fullPrefix: 'This is **bold** text in a paragraph',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 38 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should handle italic text in paragraph', () => {
        const context: MultilineContext = {
          currentLine: 'This is *italic* text',
          fullPrefix: 'This is *italic* text',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 22 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should handle nested list items', () => {
        const context: MultilineContext = {
          currentLine: '    - Nested level 2',
          fullPrefix: '    - Nested level 2',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 21 },
        }
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should handle list with inline code', () => {
        const context: MultilineContext = {
          currentLine: '- Item with `code`',
          fullPrefix: '- Item with `code`',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 19 },
        }
        // After the inline code closes, it's still a list
        expect(shouldCompleteMultiline(context)).toBe(true)
      })

      it('should not allow multiline inside link in paragraph', () => {
        const context: MultilineContext = {
          currentLine: 'Visit [link',
          fullPrefix: 'Visit [link',
          fullSuffix: '',
          cursorPosition: { lineNumber: 1, column: 12 },
        }
        // Inside link brackets
        expect(shouldCompleteMultiline(context)).toBe(false)
      })
    })
  })
})
