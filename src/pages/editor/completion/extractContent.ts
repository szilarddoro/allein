import * as monaco from 'monaco-editor'
import { sentences as extractSentences } from 'sbd'

export function extractPreviousAndCurrentSentence(
  model: monaco.editor.ITextModel,
  cursorPosition: monaco.Position,
) {
  const currentLineContent = model.getLineContent(cursorPosition.lineNumber)
  const currentLineBeforeCursor = currentLineContent.substring(
    0,
    cursorPosition.column - 1,
  )

  const currentLineAfterCursor = currentLineContent.substring(
    cursorPosition.column - 1,
  )

  // Check if cursor is positioned after a complete sentence with nothing (or only whitespace) after it
  const afterCursorIsEmpty = currentLineAfterCursor.trim() === ''
  const beforeCursorEndsWithSentence = /[.!?]\s*$/.test(currentLineBeforeCursor)

  if (afterCursorIsEmpty && beforeCursorEndsWithSentence) {
    // Cursor is at the end after a completed sentence
    // Treat the sentence as the previous sentence with empty current segments
    const currentLineSentences = extractSentences(currentLineContent)
    const previousSentence =
      currentLineSentences[currentLineSentences.length - 1] || ''

    return {
      previousSentence,
      currentSentenceSegments: [],
    }
  }

  // Note: 'sbd' removes trailing/leading whitespaces
  // We may want to restore all the whitespaces for all the segments
  const beforeCursorEndsWithWhitespace = currentLineBeforeCursor.endsWith(' ')
  const afterCursorStartsWithWhitespace = currentLineAfterCursor.startsWith(' ')

  const currentSentenceStartSegment =
    extractSentences(currentLineBeforeCursor).pop() || ''

  const currentSentenceEndSegment =
    extractSentences(currentLineAfterCursor).shift() || ''

  const currentSentenceSegments = [
    beforeCursorEndsWithWhitespace
      ? `${currentSentenceStartSegment} `
      : currentSentenceStartSegment,
    afterCursorStartsWithWhitespace
      ? ` ${currentSentenceEndSegment}`
      : currentSentenceEndSegment,
  ]

  const currentLineSentences = extractSentences(currentLineContent)
  const currentSentence = currentSentenceSegments.join('')
  const currentSentenceIndex = currentLineSentences.findIndex(
    (v) => v === currentSentence,
  )

  if (currentSentenceIndex > 0) {
    return {
      previousSentence: currentLineSentences[currentSentenceIndex - 1],
      currentSentenceSegments,
    }
  }

  let previousSentence = ''

  for (
    let lineNumber = cursorPosition.lineNumber - 1;
    lineNumber >= 1;
    lineNumber--
  ) {
    const lineContent = model.getLineContent(lineNumber)
    const lineSentences = extractSentences(lineContent)

    if (lineSentences.length === 0) {
      continue
    }

    previousSentence = lineSentences[lineSentences.length - 1]
    break
  }

  return {
    previousSentence,
    currentSentenceSegments,
  }
}
