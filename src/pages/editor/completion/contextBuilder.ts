/**
 * Context extraction and building for completion prompts
 * Inspired by continuedev/continue's multi-source context approach
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 */

import * as monaco from 'monaco-editor'
import { sentences as extractSentences } from 'sbd'

export interface CompletionContext {
  /** Text before cursor */
  prefix: string
  /** Text after cursor (limited to next ~200 chars) */
  suffix: string
  /** Current line before cursor */
  currentLinePrefix: string
  /** Current line after cursor */
  currentLineSuffix: string
  /** Current sentence segments split at cursor [before, after] */
  currentSentenceSegments: string[]
  /** Previous complete sentence for context */
  previousSentence?: string
  /** Recent clipboard content (if applicable) */
  clipboardText?: string
}

const MAX_SUFFIX_CHARS = 200
const MAX_PREFIX_CHARS = 2000

/**
 * Extract comprehensive context from Monaco editor model
 */
export function buildCompletionContext(
  model: monaco.editor.ITextModel,
  position: monaco.Position,
): CompletionContext {
  const fullText = model.getValue()
  const cursorOffset = model.getOffsetAt(position)

  // Extract prefix (limited for token efficiency)
  const fullPrefix = fullText.substring(0, cursorOffset)
  const prefix =
    fullPrefix.length > MAX_PREFIX_CHARS
      ? fullPrefix.substring(fullPrefix.length - MAX_PREFIX_CHARS)
      : fullPrefix

  // Extract suffix (limited to avoid token waste)
  const fullSuffix = fullText.substring(cursorOffset)
  const suffix =
    fullSuffix.length > MAX_SUFFIX_CHARS
      ? fullSuffix.substring(0, MAX_SUFFIX_CHARS)
      : fullSuffix

  // Current line context
  const currentLine = model.getLineContent(position.lineNumber)
  const currentLinePrefix = currentLine.substring(0, position.column - 1)
  const currentLineSuffix = currentLine.substring(position.column - 1)

  // Extract sentence-level context
  const { currentSentenceSegments, previousSentence } = extractSentenceContext(
    model,
    position,
  )

  // Clipboard reading disabled by default to prevent UI interference
  // Can be enabled via options.includeClipboard if needed
  let clipboardText: string | undefined

  return {
    prefix,
    suffix,
    currentLinePrefix,
    currentLineSuffix,
    currentSentenceSegments,
    previousSentence,
    clipboardText,
  }
}

/**
 * Extract sentence-level context (existing logic preserved)
 */
function extractSentenceContext(
  model: monaco.editor.ITextModel,
  cursorPosition: monaco.Position,
): {
  currentSentenceSegments: string[]
  previousSentence?: string
} {
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
