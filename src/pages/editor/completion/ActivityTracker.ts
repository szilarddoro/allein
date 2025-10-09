import * as monaco from 'monaco-editor'

export interface VisitedSection {
  content: string
  documentTitle: string
  timestamp: number
  lineNumber: number
}

export class ActivityTracker {
  private visitedSections: VisitedSection[] = []
  private maxSections = 10
  private currentDocumentTitle = ''
  private lastLineNumber = 0
  private lastChangeTime = 0
  private minTimeBetweenCaptures = 3000 // 3 seconds

  constructor(maxStoredSections = 10) {
    this.maxSections = maxStoredSections
  }

  /**
   * Set the current document title for context tracking
   */
  setDocumentTitle(title: string) {
    this.currentDocumentTitle = title
  }

  /**
   * Track cursor position changes and capture context
   */
  trackCursorChange(
    editor: monaco.editor.IStandaloneCodeEditor,
    position: monaco.Position,
  ) {
    const model = editor.getModel()
    if (!model) return

    const currentTime = Date.now()
    const lineNumber = position.lineNumber

    // Only capture if we've moved to a different paragraph and enough time has passed
    const isSignificantMove = Math.abs(lineNumber - this.lastLineNumber) > 3
    const hasEnoughTimePassed =
      currentTime - this.lastChangeTime > this.minTimeBetweenCaptures

    if (isSignificantMove && hasEnoughTimePassed) {
      this.captureSection(model, lineNumber)
      this.lastLineNumber = lineNumber
      this.lastChangeTime = currentTime
    }
  }

  /**
   * Track document switches
   */
  trackDocumentSwitch(title: string) {
    this.currentDocumentTitle = title
    this.lastLineNumber = 0
    this.lastChangeTime = 0
  }

  /**
   * Capture a section around the current line
   */
  private captureSection(
    model: monaco.editor.ITextModel,
    lineNumber: number,
  ) {
    const totalLines = model.getLineCount()
    const contextRadius = 5 // Capture 5 lines before and after

    const startLine = Math.max(1, lineNumber - contextRadius)
    const endLine = Math.min(totalLines, lineNumber + contextRadius)

    const lines: string[] = []
    for (let i = startLine; i <= endLine; i++) {
      lines.push(model.getLineContent(i))
    }

    const content = lines.join('\n').trim()

    // Only add if we have meaningful content
    if (content.length > 20) {
      this.visitedSections.push({
        content,
        documentTitle: this.currentDocumentTitle,
        timestamp: Date.now(),
        lineNumber,
      })

      // Keep only the most recent sections
      if (this.visitedSections.length > this.maxSections) {
        this.visitedSections.shift()
      }
    }
  }

  /**
   * Get recently visited sections sorted by recency
   */
  getRecentSections(limit = 5): VisitedSection[] {
    return this.visitedSections
      .slice(-limit)
      .sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Clear all tracked sections
   */
  clear() {
    this.visitedSections = []
    this.lastLineNumber = 0
    this.lastChangeTime = 0
  }
}
