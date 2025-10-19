/**
 * Test file for prefiltering logic
 */

import { describe, it, expect } from 'vitest'
import {
  shouldPrefilter,
  isFileDisabled,
  type PrefilterContext,
  type DisablePatterns,
} from './prefiltering'

describe('prefiltering', () => {
  describe('shouldPrefilter', () => {
    describe('Empty untitled files', () => {
      it('should prefilter empty untitled file', () => {
        const context: PrefilterContext = {
          filepath: 'Untitled-1.md',
          fileContents: '',
          currentLine: '',
          cursorPosition: { lineNumber: 1, column: 1 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should prefilter empty file with no path', () => {
        const context: PrefilterContext = {
          filepath: '',
          fileContents: '   \n  ',
          currentLine: '',
          cursorPosition: { lineNumber: 1, column: 1 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should not prefilter untitled file with content', () => {
        const context: PrefilterContext = {
          filepath: 'Untitled-1.md',
          fileContents: 'Some content here',
          currentLine: 'Some content here',
          cursorPosition: { lineNumber: 1, column: 18 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })
    })

    describe('Document start position', () => {
      it('should prefilter at very start of empty document', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: '',
          currentLine: '',
          cursorPosition: { lineNumber: 1, column: 1 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should prefilter at start if line too short', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Content',
          currentLine: 'Content',
          cursorPosition: { lineNumber: 1, column: 1 }, // At position 1, before cursor is empty
        }
        // At column 1, text before cursor is empty (length 0 < 3)
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should prefilter on line 2 if line too short', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: '\n',
          currentLine: '',
          cursorPosition: { lineNumber: 2, column: 1 },
        }
        // Empty line means text before cursor is too short
        expect(shouldPrefilter(context)).toBe(true)
      })
    })

    describe('Line length checks', () => {
      it('should prefilter when line too short (0 chars)', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Previous line\n',
          currentLine: '',
          cursorPosition: { lineNumber: 2, column: 1 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should prefilter when line too short (1 char)', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Previous line\nA',
          currentLine: 'A',
          cursorPosition: { lineNumber: 2, column: 2 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should prefilter when line too short (2 chars)', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Previous line\nAB',
          currentLine: 'AB',
          cursorPosition: { lineNumber: 2, column: 3 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should not prefilter when line has 3+ chars', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Previous line\nThe',
          currentLine: 'The',
          cursorPosition: { lineNumber: 2, column: 4 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })

      it('should prefilter when line has only whitespace before cursor', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Previous line\n   ',
          currentLine: '   ',
          cursorPosition: { lineNumber: 2, column: 4 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })
    })

    describe('Mid-word detection', () => {
      it('should prefilter when cursor in middle of word', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'The quick',
          currentLine: 'The quick',
          cursorPosition: { lineNumber: 1, column: 7 }, // qui|ck
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should not prefilter at end of word', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'The quick ',
          currentLine: 'The quick ',
          cursorPosition: { lineNumber: 1, column: 11 }, // "quick |"
        }
        expect(shouldPrefilter(context)).toBe(false)
      })

      it('should not prefilter after space', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'The ',
          currentLine: 'The ',
          cursorPosition: { lineNumber: 1, column: 5 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })

      it('should not prefilter after punctuation', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'Hello.',
          currentLine: 'Hello.',
          cursorPosition: { lineNumber: 1, column: 7 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })

      it('should prefilter in middle of alphanumeric sequence', () => {
        const context: PrefilterContext = {
          filepath: 'document.md',
          fileContents: 'test123',
          currentLine: 'test123',
          cursorPosition: { lineNumber: 1, column: 5 }, // test|123
        }
        expect(shouldPrefilter(context)).toBe(true)
      })
    })

    describe('Real-world markdown scenarios', () => {
      it('should not prefilter for markdown heading', () => {
        const context: PrefilterContext = {
          filepath: 'notes.md',
          fileContents: '# My Heading',
          currentLine: '# My Heading',
          cursorPosition: { lineNumber: 1, column: 13 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })

      it('should not prefilter for markdown list item', () => {
        const context: PrefilterContext = {
          filepath: 'notes.md',
          fileContents: '- First item',
          currentLine: '- First item',
          cursorPosition: { lineNumber: 1, column: 13 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })

      it('should prefilter for very start of list marker', () => {
        const context: PrefilterContext = {
          filepath: 'notes.md',
          fileContents: 'Previous\n- ',
          currentLine: '- ',
          cursorPosition: { lineNumber: 2, column: 3 },
        }
        expect(shouldPrefilter(context)).toBe(true)
      })

      it('should not prefilter mid-sentence', () => {
        const context: PrefilterContext = {
          filepath: 'notes.md',
          fileContents: 'This is a test ',
          currentLine: 'This is a test ',
          cursorPosition: { lineNumber: 1, column: 16 },
        }
        expect(shouldPrefilter(context)).toBe(false)
      })
    })
  })

  describe('isFileDisabled', () => {
    describe('Extension matching', () => {
      it('should disable file with matching extension', () => {
        const patterns: DisablePatterns = {
          extensions: ['.json', '.xml'],
        }
        expect(isFileDisabled('config.json', patterns)).toBe(true)
        expect(isFileDisabled('data.xml', patterns)).toBe(true)
      })

      it('should not disable file with non-matching extension', () => {
        const patterns: DisablePatterns = {
          extensions: ['.json', '.xml'],
        }
        expect(isFileDisabled('notes.md', patterns)).toBe(false)
        expect(isFileDisabled('script.ts', patterns)).toBe(false)
      })

      it('should be case-insensitive for extensions', () => {
        const patterns: DisablePatterns = {
          extensions: ['.json'],
        }
        expect(isFileDisabled('config.JSON', patterns)).toBe(true)
        expect(isFileDisabled('Config.Json', patterns)).toBe(true)
      })

      it('should handle paths with directories', () => {
        const patterns: DisablePatterns = {
          extensions: ['.json'],
        }
        expect(isFileDisabled('/path/to/config.json', patterns)).toBe(true)
        expect(isFileDisabled('src/data/file.json', patterns)).toBe(true)
      })
    })

    describe('Pattern matching', () => {
      it('should disable file matching exact pattern', () => {
        const patterns: DisablePatterns = {
          patterns: ['package.json', 'package-lock.json'],
        }
        expect(isFileDisabled('package.json', patterns)).toBe(true)
        expect(isFileDisabled('package-lock.json', patterns)).toBe(true)
      })

      it('should support wildcard patterns', () => {
        const patterns: DisablePatterns = {
          patterns: ['*.lock', 'test-*'],
        }
        expect(isFileDisabled('yarn.lock', patterns)).toBe(true)
        // package-lock.json ends with .json, not .lock
        expect(isFileDisabled('package.lock', patterns)).toBe(true)
        expect(isFileDisabled('test-file.md', patterns)).toBe(true)
      })

      it('should support question mark pattern', () => {
        const patterns: DisablePatterns = {
          patterns: ['test?.md'],
        }
        expect(isFileDisabled('test1.md', patterns)).toBe(true)
        expect(isFileDisabled('testa.md', patterns)).toBe(true)
        expect(isFileDisabled('test12.md', patterns)).toBe(false)
      })

      it('should be case-insensitive for patterns', () => {
        const patterns: DisablePatterns = {
          patterns: ['README.md'],
        }
        expect(isFileDisabled('readme.md', patterns)).toBe(true)
        expect(isFileDisabled('ReadMe.MD', patterns)).toBe(true)
      })

      it('should handle path with directories', () => {
        const patterns: DisablePatterns = {
          patterns: ['package.json'],
        }
        expect(isFileDisabled('/project/package.json', patterns)).toBe(true)
        expect(isFileDisabled('src/nested/package.json', patterns)).toBe(true)
      })
    })

    describe('Combined patterns', () => {
      it('should match either extension or pattern', () => {
        const patterns: DisablePatterns = {
          extensions: ['.json'],
          patterns: ['*.lock'],
        }
        expect(isFileDisabled('config.json', patterns)).toBe(true)
        expect(isFileDisabled('yarn.lock', patterns)).toBe(true)
        expect(isFileDisabled('notes.md', patterns)).toBe(false)
      })
    })

    describe('No patterns', () => {
      it('should not disable when no patterns provided', () => {
        expect(isFileDisabled('any-file.md', undefined)).toBe(false)
        expect(isFileDisabled('any-file.json', undefined)).toBe(false)
      })

      it('should not disable when empty patterns provided', () => {
        const patterns: DisablePatterns = {}
        expect(isFileDisabled('any-file.md', patterns)).toBe(false)
      })
    })
  })
})
