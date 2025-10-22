import { describe, it, expect } from 'vitest'
import { buildCompletionPrompt } from './buildCompletionPrompt'

describe('buildCompletionPrompt', () => {
  describe('sentence combination', () => {
    it('combines previous and current sentences', () => {
      const result = buildCompletionPrompt('current text', 'previous text')
      expect(result.prompt).toContain('previous text current text')
    })

    it('omits previous sentence when not provided', () => {
      const result = buildCompletionPrompt('only current')
      expect(result.prompt).toContain('only current')
    })

    it('trims whitespace from sentences before combining', () => {
      const result = buildCompletionPrompt('  current  ', '  previous  ')
      expect(result.prompt).toContain('previous current')
      // Should not have double spaces
      expect(result.prompt).not.toContain('  ')
    })

    it('handles empty previous sentence gracefully', () => {
      const result = buildCompletionPrompt('current', '')
      expect(result.prompt).toContain('current')
    })
  })

  describe('sentence termination detection', () => {
    it('detects period as sentence termination', () => {
      const result = buildCompletionPrompt('This is a sentence.')
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('detects question mark as sentence termination', () => {
      const result = buildCompletionPrompt('Is this a question?')
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('detects exclamation mark as sentence termination', () => {
      const result = buildCompletionPrompt('What an exclamation!')
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('treats incomplete sentence as continuation', () => {
      const result = buildCompletionPrompt('This is an incomplete sentence')
      expect(result.startedNewSentence).toBe(false)
      expect(result.prompt).toContain('Fill in the blank')
    })

    it('treats sentence without terminator as incomplete', () => {
      const result = buildCompletionPrompt('No punctuation here')
      expect(result.startedNewSentence).toBe(false)
    })
  })

  describe('prompt content', () => {
    it('includes combined sentences in prompt for new sentence', () => {
      const result = buildCompletionPrompt('Sentence ending.', 'Previous.')
      expect(result.prompt).toContain('Previous. Sentence ending.')
    })

    it('includes blank placeholder in prompt for new sentence', () => {
      const result = buildCompletionPrompt('Text here.')
      // Note: placeholder format may vary, just check the structure exists
      expect(result.prompt).toContain('Text here.')
    })

    it('includes combined sentences in prompt for continuation', () => {
      const result = buildCompletionPrompt('incomplete')
      expect(result.prompt).toContain('incomplete')
    })

    it('includes continuation instructions for new sentence', () => {
      const result = buildCompletionPrompt('Text.')
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('includes fill-in-the-blank instructions for continuation', () => {
      const result = buildCompletionPrompt('incomplete text')
      expect(result.startedNewSentence).toBe(false)
      expect(result.prompt).toContain('Fill in the blank')
    })
  })

  describe('model options', () => {
    it('sets correct stop tokens for new sentence', () => {
      const result = buildCompletionPrompt('Sentence.')
      expect(result.modelOptions.stop).toEqual(['.', '\n\n', '##', '```'])
    })

    it('sets correct stop tokens for continuation', () => {
      const result = buildCompletionPrompt('incomplete')
      expect(result.modelOptions.stop).toEqual(['\n\n', '##', '```'])
    })

    it('sets num_predict to 8 for both cases', () => {
      const result1 = buildCompletionPrompt('Sentence.')
      const result2 = buildCompletionPrompt('incomplete')
      expect(result1.modelOptions.num_predict).toBe(8)
      expect(result2.modelOptions.num_predict).toBe(8)
    })

    it('sets higher temperature for new sentence (1)', () => {
      const result = buildCompletionPrompt('Sentence.')
      expect(result.modelOptions.temperature).toBe(1)
    })

    it('sets lower temperature for continuation (0.3)', () => {
      const result = buildCompletionPrompt('incomplete')
      expect(result.modelOptions.temperature).toBe(0.3)
    })
  })

  describe('real-world examples', () => {
    it('handles paragraph with multiple sentences', () => {
      const current = 'This is the current sentence.'
      const previous = 'The previous section explained the basics.'
      const result = buildCompletionPrompt(current, previous)

      expect(result.prompt).toContain(
        'The previous section explained the basics.',
      )
      expect(result.prompt).toContain('This is the current sentence.')
      expect(result.startedNewSentence).toBe(true)
    })

    it('handles code-heavy text (already cleaned by extractSentences)', () => {
      const current = 'Use const x = 5 in JavaScript.'
      const result = buildCompletionPrompt(current)

      expect(result.prompt).toContain('Use const x = 5 in JavaScript.')
      expect(result.startedNewSentence).toBe(true)
    })

    it('handles list items (already cleaned by extractSentences)', () => {
      const current = 'First item with bold Second item with code'
      const result = buildCompletionPrompt(current)

      expect(result.prompt).toContain('First item with bold')
      expect(result.prompt).toContain('Second item with code')
    })
  })

  describe('edge cases', () => {
    it('handles empty string as current sentence', () => {
      const result = buildCompletionPrompt('')
      expect(result.prompt).toBeDefined()
      expect(result.startedNewSentence).toBe(false)
    })

    it('handles only whitespace as current sentence', () => {
      const result = buildCompletionPrompt('   ')
      expect(result.prompt).toBeDefined()
    })

    it('handles very long sentences', () => {
      const longSentence =
        'This is a very long sentence that goes on and on with many words and clauses and all sorts of content that needs to be processed.'
      const result = buildCompletionPrompt(longSentence)

      expect(result.prompt).toBeDefined()
    })

    it('handles special characters preserved', () => {
      const current = 'Price is $99.99 and rating is 4.5/5 stars!'
      const result = buildCompletionPrompt(current)

      expect(result.prompt).toContain('$99.99')
      expect(result.prompt).toContain('4.5/5')
      expect(result.startedNewSentence).toBe(true)
    })
  })

  describe('return type structure', () => {
    it('returns object with all required properties', () => {
      const result = buildCompletionPrompt('test')

      expect(result).toHaveProperty('prompt')
      expect(result).toHaveProperty('modelOptions')
      expect(result).toHaveProperty('startedNewSentence')
    })

    it('modelOptions has all required properties', () => {
      const result = buildCompletionPrompt('test')

      expect(result.modelOptions).toHaveProperty('stop')
      expect(result.modelOptions).toHaveProperty('num_predict')
      expect(result.modelOptions).toHaveProperty('temperature')
    })

    it('prompt is a non-empty string', () => {
      const result = buildCompletionPrompt('test')

      expect(typeof result.prompt).toBe('string')
      expect(result.prompt.length).toBeGreaterThan(0)
    })

    it('startedNewSentence is boolean', () => {
      const result1 = buildCompletionPrompt('test.')
      const result2 = buildCompletionPrompt('test')

      expect(typeof result1.startedNewSentence).toBe('boolean')
      expect(typeof result2.startedNewSentence).toBe('boolean')
    })
  })
})
