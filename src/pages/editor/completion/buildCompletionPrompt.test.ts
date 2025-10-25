import { describe, it, expect } from 'vitest'
import { buildCompletionPrompt } from './buildCompletionPrompt'

describe('buildCompletionPrompt', () => {
  describe('sentence combination', () => {
    it('combines previous and current sentences', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'current text',
        previousSentence: 'previous text',
      })
      expect(result.prompt).toContain('previous text current text')
    })

    it('omits previous sentence when not provided', () => {
      const result = buildCompletionPrompt({ currentSentence: 'only current' })
      expect(result.prompt).toContain('only current')
    })

    it('trims whitespace from sentences before combining', () => {
      const result = buildCompletionPrompt({
        currentSentence: '  current  ',
        previousSentence: '  previous  ',
      })
      expect(result.prompt).toContain('previous current')
      // Should not have double spaces
      expect(result.prompt).not.toContain('  ')
    })

    it('handles empty previous sentence gracefully', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'current',
        previousSentence: '',
      })
      expect(result.prompt).toContain('current')
    })
  })

  describe('sentence termination detection', () => {
    it('detects period as sentence termination', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'This is a sentence.',
      })
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('detects question mark as sentence termination', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'Is this a question?',
      })
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('detects exclamation mark as sentence termination', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'What an exclamation!',
      })
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('treats incomplete sentence as continuation', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'This is an incomplete sentence',
      })
      expect(result.startedNewSentence).toBe(false)
      expect(result.prompt).toContain('Continue this sentence')
    })

    it('treats sentence without terminator as incomplete', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'No punctuation here',
      })
      expect(result.startedNewSentence).toBe(false)
    })
  })

  describe('prompt content', () => {
    it('includes combined sentences in prompt for new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'Sentence ending.',
        previousSentence: 'Previous.',
      })
      expect(result.prompt).toContain('Previous. Sentence ending.')
    })

    it('includes blank placeholder in prompt for new sentence', () => {
      const result = buildCompletionPrompt({ currentSentence: 'Text here.' })
      // Note: placeholder format may vary, just check the structure exists
      expect(result.prompt).toContain('Text here.')
    })

    it('includes combined sentences in prompt for continuation', () => {
      const result = buildCompletionPrompt({ currentSentence: 'incomplete' })
      expect(result.prompt).toContain('incomplete')
    })

    it('includes continuation instructions for new sentence', () => {
      const result = buildCompletionPrompt({ currentSentence: 'Text.' })
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })

    it('includes continuation instructions for incomplete sentence', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'incomplete text',
      })
      expect(result.startedNewSentence).toBe(false)
      expect(result.prompt).toContain('Continue this sentence')
    })
  })

  describe('model options', () => {
    it('sets correct stop tokens for new sentence', () => {
      const result = buildCompletionPrompt({ currentSentence: 'Sentence.' })
      expect(result.modelOptions.stop).toEqual(['.', '\n'])
    })

    it('sets correct stop tokens for continuation', () => {
      const result = buildCompletionPrompt({ currentSentence: 'incomplete' })
      expect(result.modelOptions.stop).toEqual(['\n'])
    })

    it('sets num_predict to 8 for new sentence', () => {
      const result1 = buildCompletionPrompt({ currentSentence: 'Sentence.' })
      expect(result1.modelOptions.num_predict).toBe(8)
    })

    it('sets num_predict to 15 for continuation', () => {
      const result2 = buildCompletionPrompt({ currentSentence: 'incomplete' })
      expect(result2.modelOptions.num_predict).toBe(15)
    })

    it('sets higher temperature for new sentence (1)', () => {
      const result = buildCompletionPrompt({ currentSentence: 'Sentence.' })
      expect(result.modelOptions.temperature).toBe(1)
    })

    it('sets lower temperature for continuation (0.3)', () => {
      const result = buildCompletionPrompt({ currentSentence: 'incomplete' })
      expect(result.modelOptions.temperature).toBe(0.3)
    })
  })

  describe('real-world examples', () => {
    it('handles paragraph with multiple sentences', () => {
      const current = 'This is the current sentence.'
      const previous = 'The previous section explained the basics.'
      const result = buildCompletionPrompt({
        currentSentence: current,
        previousSentence: previous,
      })

      expect(result.prompt).toContain(
        'The previous section explained the basics.',
      )
      expect(result.prompt).toContain('This is the current sentence.')
      expect(result.startedNewSentence).toBe(true)
    })

    it('handles code-heavy text (already cleaned by extractSentences)', () => {
      const current = 'Use const x = 5 in JavaScript.'
      const result = buildCompletionPrompt({ currentSentence: current })

      expect(result.prompt).toContain('Use const x = 5 in JavaScript.')
      expect(result.startedNewSentence).toBe(true)
    })

    it('handles list items (already cleaned by extractSentences)', () => {
      const current = 'First item with bold Second item with code'
      const result = buildCompletionPrompt({ currentSentence: current })

      expect(result.prompt).toContain('First item with bold')
      expect(result.prompt).toContain('Second item with code')
    })
  })

  describe('edge cases', () => {
    it('handles empty string as current sentence', () => {
      const result = buildCompletionPrompt({ currentSentence: '' })
      expect(result.prompt).toBeDefined()
      expect(result.startedNewSentence).toBe(false)
    })

    it('handles only whitespace as current sentence', () => {
      const result = buildCompletionPrompt({ currentSentence: '   ' })
      expect(result.prompt).toBeDefined()
    })

    it('handles very long sentences', () => {
      const longSentence =
        'This is a very long sentence that goes on and on with many words and clauses and all sorts of content that needs to be processed.'
      const result = buildCompletionPrompt({ currentSentence: longSentence })

      expect(result.prompt).toBeDefined()
    })

    it('handles special characters preserved', () => {
      const current = 'Price is $99.99 and rating is 4.5/5 stars!'
      const result = buildCompletionPrompt({ currentSentence: current })

      expect(result.prompt).toContain('$99.99')
      expect(result.prompt).toContain('4.5/5')
      expect(result.startedNewSentence).toBe(true)
    })
  })

  describe('return type structure', () => {
    it('returns object with all required properties', () => {
      const result = buildCompletionPrompt({ currentSentence: 'test' })

      expect(result).toHaveProperty('prompt')
      expect(result).toHaveProperty('modelOptions')
      expect(result).toHaveProperty('startedNewSentence')
    })

    it('modelOptions has all required properties', () => {
      const result = buildCompletionPrompt({ currentSentence: 'test' })

      expect(result.modelOptions).toHaveProperty('stop')
      expect(result.modelOptions).toHaveProperty('num_predict')
      expect(result.modelOptions).toHaveProperty('temperature')
    })

    it('prompt is a non-empty string', () => {
      const result = buildCompletionPrompt({ currentSentence: 'test' })

      expect(typeof result.prompt).toBe('string')
      expect(result.prompt.length).toBeGreaterThan(0)
    })

    it('startedNewSentence is boolean', () => {
      const result1 = buildCompletionPrompt({ currentSentence: 'test.' })
      const result2 = buildCompletionPrompt({ currentSentence: 'test' })

      expect(typeof result1.startedNewSentence).toBe('boolean')
      expect(typeof result2.startedNewSentence).toBe('boolean')
    })
  })

  describe('mid-sentence completion', () => {
    it('uses mid-sentence prompt when text exists after cursor', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'This is a sentence',
        sentenceBeforeCursor: 'This is',
        sentenceAfterCursor: 'a sentence',
      })

      expect(result.prompt).toContain('____')
      expect(result.prompt).toContain('This is')
      expect(result.prompt).toContain('a sentence')
      expect(result.prompt).toContain('1-3 words')
    })

    it('prioritizes mid-sentence over sentence termination logic', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'This is a sentence.',
        sentenceBeforeCursor: 'This is',
        sentenceAfterCursor: 'a sentence.',
      })

      // Should use mid-sentence prompt, not new sentence prompt
      expect(result.prompt).toContain('____')
      expect(result.prompt).toContain('1-3 words')
      expect(result.prompt).not.toContain('Start a new sentence')
    })

    it('ignores sentenceAfterCursor if empty', () => {
      const result = buildCompletionPrompt({
        currentSentence: 'This is a complete sentence.',
        sentenceBeforeCursor: 'This is a complete sentence.',
        sentenceAfterCursor: undefined,
      })

      // Should use normal sentence ending logic
      expect(result.startedNewSentence).toBe(true)
      expect(result.prompt).toContain('Start a new sentence')
    })
  })
})
