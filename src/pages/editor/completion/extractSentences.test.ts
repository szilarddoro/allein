import { describe, it, expect } from 'vitest'
import { extractSentences } from './extractSentences'

describe('extractSentences', () => {
  describe('basic sentence extraction', () => {
    it('extracts current and previous sentences', () => {
      const result = extractSentences('Hello world. This is a test')
      expect(result.currentSentence).toBe('This is a test')
      expect(result.previousSentence).toBe('Hello world.')
    })

    it('handles single sentence without terminator', () => {
      const result = extractSentences('Incomplete sentence at end')
      expect(result.currentSentence).toBe('Incomplete sentence at end')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles single complete sentence', () => {
      const result = extractSentences('Hello world.')
      expect(result.currentSentence).toBe('Hello world.')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles empty string', () => {
      const result = extractSentences('')
      expect(result.currentSentence).toBe('')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles only whitespace', () => {
      const result = extractSentences('   \t  ')
      expect(result.currentSentence).toBe('')
      expect(result.previousSentence).toBeUndefined()
    })
  })

  describe('newline handling', () => {
    it('strips newlines to include previous text block', () => {
      const result = extractSentences('First sentence.\nSecond sentence')
      expect(result.currentSentence).toBe('Second sentence')
      expect(result.previousSentence).toBe('First sentence.')
    })

    it('handles multiple newlines', () => {
      const result = extractSentences('First.\n\nSecond.\n\nThird')
      expect(result.currentSentence).toBe('Third')
      expect(result.previousSentence).toBe('Second.')
    })

    it('handles newline at end', () => {
      const result = extractSentences('First sentence.\n')
      expect(result.currentSentence).toBe('First sentence.')
      expect(result.previousSentence).toBeUndefined()
    })

    it('strips newlines to preserve context across blocks', () => {
      // When stripped: "What is this?  This is great!"
      // Last terminator is ! at the end with no text after, so entire text is current
      const result = extractSentences('What is this?\n\nThis is great!')
      expect(result.currentSentence).toBe('What is this?  This is great!')
      expect(result.previousSentence).toBeUndefined()
    })
  })

  describe('different punctuation marks', () => {
    it('handles periods', () => {
      const result = extractSentences('First. Second')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })

    it('handles question marks', () => {
      const result = extractSentences('What? Answer')
      expect(result.currentSentence).toBe('Answer')
      expect(result.previousSentence).toBe('What?')
    })

    it('handles exclamation marks', () => {
      const result = extractSentences('Great! More text')
      expect(result.currentSentence).toBe('More text')
      expect(result.previousSentence).toBe('Great!')
    })

    it('handles mixed punctuation', () => {
      const result = extractSentences('Amazing! What? Sure. Next')
      expect(result.currentSentence).toBe('Next')
      expect(result.previousSentence).toBe('Sure.')
    })
  })

  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace from sentences', () => {
      const result = extractSentences('  First.   Second  ')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })

    it('handles multiple spaces between sentences', () => {
      const result = extractSentences('First.    Second')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })

    it('handles tabs and mixed whitespace', () => {
      const result = extractSentences('First.\t\t  Second')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })
  })

  describe('edge cases', () => {
    it('handles incomplete sentence after complete sentence', () => {
      const result = extractSentences('Complete. Incomp')
      expect(result.currentSentence).toBe('Incomp')
      expect(result.previousSentence).toBe('Complete.')
    })

    it('handles three sentences - returns last two', () => {
      const result = extractSentences('First. Second. Third')
      expect(result.currentSentence).toBe('Third')
      expect(result.previousSentence).toBe('Second.')
    })

    it('handles text starting mid-sentence', () => {
      const result = extractSentences('middle of sentence. New sentence')
      expect(result.currentSentence).toBe('New sentence')
      expect(result.previousSentence).toBe('middle of sentence.')
    })

    it('handles punctuation at start', () => {
      const result = extractSentences('. Only incomplete')
      expect(result.currentSentence).toBe('Only incomplete')
      // Text before the period with no second terminator
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles only punctuation', () => {
      const result = extractSentences('.')
      expect(result.currentSentence).toBe('.')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles multiple terminators - extracts last two properly', () => {
      // "What?! Really. Yes!"
      // Last terminator is final !, so no text after
      // This means the entire thing is currentSentence
      const result = extractSentences('What?! Really. Yes!')
      expect(result.currentSentence).toBe('What?! Really. Yes!')
      expect(result.previousSentence).toBeUndefined()
    })
  })

  describe('full document context (across paragraphs)', () => {
    it('finds context from previous paragraph when current line has none', () => {
      // Simulates: Previous paragraph with context.\n\nCurrent line at start of new paragraph
      const fullDocText =
        'First paragraph. Important context.\n\nNew paragraph start'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('New paragraph start')
      expect(result.previousSentence).toBe('Important context.')
    })

    it('prefers current line context when available', () => {
      // If current line has its own previous sentence, use that instead of looking back
      const fullDocText =
        'Old context. Older.\n\nPrevious sentence. Current sentence'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('Current sentence')
      expect(result.previousSentence).toBe('Previous sentence.')
    })

    it('handles multiple paragraph transitions', () => {
      const fullDocText =
        'Section one. Content.\n\nSection two. More content.\n\nSection three'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('Section three')
      expect(result.previousSentence).toBe('More content.')
    })

    it('gracefully handles paragraphs with complex structure', () => {
      const fullDocText =
        'First part. Second part.\n\nThird part. Fourth part.\n\nFinal'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('Final')
      expect(result.previousSentence).toBe('Fourth part.')
    })
  })

  describe('real-world examples', () => {
    it('handles markdown prose example 1', () => {
      const result = extractSentences(
        'The quick brown fox jumps. Over the lazy dog',
      )
      expect(result.currentSentence).toBe('Over the lazy dog')
      expect(result.previousSentence).toBe('The quick brown fox jumps.')
    })

    it('handles markdown prose example 2', () => {
      const result = extractSentences(
        'This is a complex sentence with many words. And this is another one that continues the thought',
      )
      expect(result.currentSentence).toBe(
        'And this is another one that continues the thought',
      )
      expect(result.previousSentence).toBe(
        'This is a complex sentence with many words.',
      )
    })

    it('handles dialogue-like content - exclamation inside quotes', () => {
      // Text: "Hello there!" she said. He nodded
      // Last terminator is the period after "said", not the ! in quotes
      const result = extractSentences('"Hello there!" she said. He nodded')
      expect(result.currentSentence).toBe('He nodded')
      // Previous sentence is everything up to and including the period
      expect(result.previousSentence).toBe('" she said.')
    })

    it('handles list item continuation', () => {
      const result = extractSentences('First item. Still part of first')
      expect(result.currentSentence).toBe('Still part of first')
      expect(result.previousSentence).toBe('First item.')
    })
  })
})
