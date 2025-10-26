import { describe, it, expect } from 'vitest'
import { buildCompletionPrompt } from './buildCompletionPrompt'

describe('buildCompletionPrompt', () => {
  describe('empty or invalid input', () => {
    it('returns an object signaling that the completion should stop', () => {
      const result = buildCompletionPrompt({
        previousSentence: '',
        currentSentenceSegments: [],
      })

      expect(result).toMatchObject({
        prompt: '',
        modelOptions: {},
        startedNewSentence: false,
        preventCompletion: true,
      })
    })

    it('returns an object signaling that the completion should stop', () => {
      const result = buildCompletionPrompt({
        previousSentence: '',
        currentSentenceSegments: ['Sec', 'ond'],
      })

      expect(result).toMatchObject({
        prompt: '',
        modelOptions: {},
        startedNewSentence: false,
        preventCompletion: true,
      })
    })
  })

  describe('sentence combination', () => {
    it('combines previous and current sentences', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['previous text ', ' current text'],
        previousSentence: 'previous',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "previous. previous text ____ current text". Output only the completion, nothing else."`,
      )
    })

    it('omits previous sentence when not provided', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['only'],
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "only ____". Output only the completion, nothing else."`,
      )
    })

    it('trims whitespace from sentences before combining', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['  current  ', '  '],
        previousSentence: '  previous  ',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "previous.  current  ____ ". Output only the completion, nothing else."`,
      )
    })

    it('handles empty previous sentence gracefully', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['current'],
        previousSentence: '',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "current ____". Output only the completion, nothing else."`,
      )
    })
  })

  describe('sentence termination detection', () => {
    it('detects empty segments as starting new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'This is a sentence.',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "This is a sentence. ____""`,
      )
      expect(result.startedNewSentence).toBe(true)
    })

    it('detects empty segments with question mark in previous', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Is this a question?',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "Is this a question? ____""`,
      )
      expect(result.startedNewSentence).toBe(true)
    })

    it('detects empty segments with exclamation in previous', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'What an exclamation!',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "What an exclamation! ____""`,
      )
      expect(result.startedNewSentence).toBe(true)
    })

    it('treats segments as continuation', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['This is an incomplete ', ' sentence'],
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "This is an incomplete ____ sentence". Output only the completion, nothing else."`,
      )
      expect(result.startedNewSentence).toBe(false)
    })

    it('treats single segment as incomplete', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['No punctuation here'],
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "No punctuation here ____". Output only the completion, nothing else."`,
      )
      expect(result.startedNewSentence).toBe(false)
    })
  })

  describe('prompt content', () => {
    it('includes combined sentences in prompt for new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Previous.',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "Previous. ____""`,
      )
    })

    it('includes blank placeholder in prompt for new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Text here.',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "Text here. ____""`,
      )
    })

    it('includes combined sentences in prompt for continuation', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['incomplete'],
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "incomplete ____". Output only the completion, nothing else."`,
      )
    })

    it('includes new sentence instructions for empty segments', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Text.',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "Text. ____""`,
      )
    })

    it('includes continuation instructions for partial sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['incomplete ', ' text'],
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "incomplete ____ text". Output only the completion, nothing else."`,
      )
    })
  })

  describe('model options', () => {
    it('sets correct stop tokens for new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Sentence.',
      })
      expect(result.modelOptions.stop).toEqual(['.', '\n'])
    })

    it('sets correct stop tokens for continuation', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['incomplete'],
      })
      expect(result.modelOptions.stop).toEqual(['\n'])
    })

    it('sets num_predict to 8 for new sentence', () => {
      const result1 = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Sentence.',
      })
      expect(result1.modelOptions.num_predict).toBe(8)
    })

    it('sets num_predict to 15 for continuation', () => {
      const result2 = buildCompletionPrompt({
        currentSentenceSegments: ['incomplete'],
      })
      expect(result2.modelOptions.num_predict).toBe(15)
    })

    it('sets higher temperature for new sentence (1)', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Sentence.',
      })
      expect(result.modelOptions.temperature).toBe(1)
    })

    it('sets lower temperature for continuation (0.3)', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['incomplete'],
      })
      expect(result.modelOptions.temperature).toBe(0.3)
    })
  })

  describe('real-world examples', () => {
    it('handles paragraph with multiple sentences - starting new one', () => {
      const previous = 'The previous section explained the basics.'
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: previous,
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "The previous section explained the basics. ____""`,
      )
      expect(result.startedNewSentence).toBe(true)
    })

    it('handles code-heavy text (already cleaned by extractSentences)', () => {
      const current = ['Use const x = 5 in JavaScript']
      const result = buildCompletionPrompt({
        currentSentenceSegments: current,
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "Use const x = 5 in JavaScript ____". Output only the completion, nothing else."`,
      )
      expect(result.startedNewSentence).toBe(false)
    })

    it('handles list items (already cleaned by extractSentences)', () => {
      const current = ['First item with bold ', ' Second item with code']
      const result = buildCompletionPrompt({
        currentSentenceSegments: current,
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "First item with bold ____ Second item with code". Output only the completion, nothing else."`,
      )
    })

    it('removes markdown formatting from previous sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'This is **bold** and *italic* text.',
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "This is bold and italic text. ____""`,
      )
    })

    it('removes markdown formatting from current sentence segments', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['Text with [link](url) ', ' and `code`.'],
        previousSentence: 'Previous.',
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "Previous. Text with link ____ and code.". Output only the completion, nothing else."`,
      )
    })
  })

  describe('edge cases', () => {
    it('handles empty segments as current sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'Previous',
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Start a new sentence with a couple of words after this sentence: "Previous. ____""`,
      )
      expect(result.startedNewSentence).toBe(true)
    })

    it('handles whitespace-only segments', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['   '],
      })
      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: " ____". Output only the completion, nothing else."`,
      )
    })

    it('handles very long sentences', () => {
      const longSentence =
        'This is a very long sentence that goes on and on with many words and clauses and all sorts of content that needs to be processed.'
      const result = buildCompletionPrompt({
        currentSentenceSegments: [longSentence],
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "This is a very long sentence that goes on and on with many words and clauses and all sorts of content that needs to be processed. ____". Output only the completion, nothing else."`,
      )
    })

    it('handles special characters preserved', () => {
      const current = ['Price is $99.99 and rating is 4.5/5 ', ' stars!']
      const result = buildCompletionPrompt({
        currentSentenceSegments: current,
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "Price is $99.99 and rating is 4.5/5 ____ stars!". Output only the completion, nothing else."`,
      )
      expect(result.startedNewSentence).toBe(false)
    })
  })

  describe('return type structure', () => {
    it('returns object with all required properties', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['test'],
      })

      expect(result).toHaveProperty('prompt')
      expect(result).toHaveProperty('modelOptions')
      expect(result).toHaveProperty('startedNewSentence')
    })

    it('modelOptions has all required properties for continuation', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['test'],
      })

      expect(result.modelOptions).toHaveProperty('stop')
      expect(result.modelOptions).toHaveProperty('num_predict')
      expect(result.modelOptions).toHaveProperty('temperature')
    })

    it('modelOptions has all required properties for new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'test',
      })

      expect(result.modelOptions).toHaveProperty('stop')
      expect(result.modelOptions).toHaveProperty('num_predict')
      expect(result.modelOptions).toHaveProperty('temperature')
    })

    it('prompt is a non-empty string for continuation', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['test'],
      })

      expect(typeof result.prompt).toBe('string')
      expect(result.prompt.length).toBeGreaterThan(0)
    })

    it('startedNewSentence is true for new sentences', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: [],
        previousSentence: 'test',
      })

      expect(result.startedNewSentence).toBe(true)
    })

    it('startedNewSentence is false for continuations', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['test'],
      })

      expect(result.startedNewSentence).toBe(false)
    })
  })

  describe('mid-sentence completion', () => {
    it('uses mid-sentence prompt when both segments exist', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['This is ', ' a sentence'],
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "This is ____ a sentence". Output only the completion, nothing else."`,
      )
    })

    it('treats two-segment array as mid-sentence, not new sentence', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['This is ', ' a sentence.'],
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-2 words: "This is ____ a sentence.". Output only the completion, nothing else."`,
      )
      expect(result.prompt).not.toContain('Start a new sentence')
    })

    it('treats single segment as incomplete continuation', () => {
      const result = buildCompletionPrompt({
        currentSentenceSegments: ['This is a complete sentence.'],
      })

      expect(result.prompt).toMatchInlineSnapshot(
        `"Fill in the blank in this text with 1-4 words: "This is a complete sentence. ____". Output only the completion, nothing else."`,
      )
      expect(result.startedNewSentence).toBe(false)
    })
  })
})
