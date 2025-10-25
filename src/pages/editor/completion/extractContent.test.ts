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
      const mockCursorPosition = createMockPosition(5, 8)
      const { previousSentence, currentSentenceSegments } =
        extractPreviousAndCurrentSentence(mockTextModel, mockCursorPosition)

      expect(previousSentence).toBe('## Heading 1')
      expect(currentSentenceSegments).toMatchObject([
        '- First',
        ' sentence in this row.',
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
  })
})
