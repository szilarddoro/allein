import * as monaco from 'monaco-editor'
import { ActivityTracker } from './ActivityTracker'

export interface CompletionContext {
  fullText: string
  currentLineText: string
  documentTitle: string
  recentSections: string[]
}

export class ContextExtractor {
  constructor(private activityTracker: ActivityTracker) {}

  /**
   * Extract context for AI completion request
   */
  extract(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    documentTitle: string,
  ): CompletionContext {
    // Get full document text up to cursor position
    const textBeforeCursor = model
      .getValue()
      .substring(0, model.getOffsetAt(position))

    // Insert cursor marker
    const fullTextWithCursor = textBeforeCursor + '<|cursor|>'

    // Get current line text
    const currentLine = model.getLineContent(position.lineNumber)
    const currentLineText = currentLine.substring(0, position.column - 1)

    // Get recently visited sections
    const recentSections = this.activityTracker
      .getRecentSections(5)
      .map(
        (section) =>
          `[From: ${section.documentTitle}]\n${section.content}`,
      )

    return {
      fullText: fullTextWithCursor,
      currentLineText,
      documentTitle,
      recentSections,
    }
  }

  /**
   * Format context into a message for the AI model
   */
  formatContextMessage(context: CompletionContext): string {
    const parts: string[] = []

    // Add document title
    parts.push(`# Current Document: ${context.documentTitle}\n`)

    // Add recently visited sections if any
    if (context.recentSections.length > 0) {
      parts.push('## Recently Visited Sections:\n')
      parts.push(context.recentSections.join('\n\n'))
      parts.push('\n')
    }

    // Add current document with cursor marker
    parts.push('## Current Document Text:\n')
    parts.push(context.fullText)

    return parts.join('\n')
  }
}
