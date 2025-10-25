import { extractPreviousAndCurrentSentence } from '@/pages/editor/completion/extractContent'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockPosition, createMockTextModel } from '@/test/editorMocks'
import * as monaco from 'monaco-editor'

const documentLines = [
  '# First line with two sentences. Sentence 2',
  '',
  '## Heading 1',
  '',
  '- First sentence in this row. Second sentence in this row. Third sentence in this row.',
  '- Second list item with two sentences. This is the second sentence.',
  '- Third list item with a single, unfinished sentence',
  '- Fourth list item with a finished sentence. Plus an unfinished sentence',
  '- Fifth list item with a finished sentence, and a trailing whitespace. ',
  'Sentence ending with exclamation! ',
  'Sentence ending with question? ',
  'Sentence ending without trailing space.',
  'Multiple sentences. Second one. Third one. ',
]

describe('extractContent', () => {
  describe('extracts sentences based on cursor position', () => {
    let mockTextModel: monaco.editor.ITextModel

    beforeEach(() => {
      mockTextModel = createMockTextModel({
        getValue: vi.fn().mockImplementation(() => documentLines.join('\n')),
        getLineContent: vi
          .fn()
          .mockImplementation(
            (lineNumber) => documentLines[Math.max(lineNumber - 1, 0)],
          ),
      })
    })

    it('should find multiple sentences on the same line', () => {
      const mockCursorPosition = createMockPosition(5, 46)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('- First sentence in this row.')
      expect(currentSentenceSegments).toMatchObject([
        'Second sentence',
        ' in this row.',
      ])
    })

    it('should find sentences on previous lines when the first sentence is edited', () => {
      const mockCursorPosition = createMockPosition(5, 9)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('## Heading 1')
      expect(currentSentenceSegments).toMatchObject([
        '- First ',
        'sentence in this row.',
      ])
    })

    it('should extract the first sentence and the last sentence of the previous line', () => {
      const mockCursorPosition = createMockPosition(6, 19)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('Third sentence in this row.')
      expect(currentSentenceSegments).toMatchObject([
        '- Second list item',
        ' with two sentences.',
      ])
    })

    it('should extract the unfinished sentence as the current sentence', () => {
      const mockCursorPosition = createMockPosition(7, 6)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('This is the second sentence.')
      expect(currentSentenceSegments).toMatchObject([
        '- Thi',
        'rd list item with a single, unfinished sentence',
      ])
    })

    it('should extract an unfinished sentence as the previous sentence if on a new line', () => {
      const mockCursorPosition = createMockPosition(8, 12)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe(
        '- Third list item with a single, unfinished sentence',
      )
      expect(currentSentenceSegments).toMatchObject([
        '- Fourth li',
        'st item with a finished sentence.',
      ])
    })

    it('should return an empty array if the current sentence is empty', () => {
      const mockCursorPosition = createMockPosition(9, 72)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe(
        '- Fifth list item with a finished sentence, and a trailing whitespace.',
      )
      expect(currentSentenceSegments).toMatchObject([])
    })

    it('should handle cursor after sentence ending with exclamation mark and trailing space', () => {
      const mockCursorPosition = createMockPosition(10, 35)
      // Line 10: "Sentence ending with exclamation! " (length 34)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('Sentence ending with exclamation!')
      expect(currentSentenceSegments).toMatchObject([])
    })

    it('should handle cursor after sentence ending with question mark and trailing space', () => {
      const mockCursorPosition = createMockPosition(11, 32)
      // Line 11: "Sentence ending with question? " (length 31)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('Sentence ending with question?')
      expect(currentSentenceSegments).toMatchObject([])
    })

    it('should handle cursor right after period without trailing space', () => {
      const mockCursorPosition = createMockPosition(12, 40)
      // Line 12: "Sentence ending without trailing space." (length 39)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('Sentence ending without trailing space.')
      expect(currentSentenceSegments).toMatchObject([])
    })

    it('should return the last sentence when cursor is at end of line with multiple sentences', () => {
      const mockCursorPosition = createMockPosition(13, 44)
      // Line 13: "Multiple sentences. Second one. Third one. " (length 43)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('Third one.')
      expect(currentSentenceSegments).toMatchObject([])
    })

    it('should return the very first sentence when cursor is at the beginning of the document', () => {
      const mockCursorPosition = createMockPosition(0, 0)
      // Line 13: "Multiple sentences. Second one. Third one. "
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('')
      expect(currentSentenceSegments).toMatchObject([
        '',
        '# First line with two sentences.',
      ])
    })
  })
})
