import * as monaco from 'monaco-editor'
import {
  saveContextSection,
  loadAllRecentContextSections,
  cleanupOldContextSections,
  limitTotalContextSections,
} from '@/lib/db/contextSections'
import { MAX_CONTEXT_SECTIONS } from '@/lib/constants'

export interface VisitedSection {
  content: string
  documentTitle: string
  timestamp: number
  lineNumber: number
}

export class ActivityTracker {
  private visitedSections: VisitedSection[] = []
  private maxSections = Math.ceil(MAX_CONTEXT_SECTIONS / 2)
  private currentDocumentTitle = ''
  private lastLineNumber = 0
  private lastChangeTime = 0
  private minTimeBetweenCaptures = 3000 // 3 seconds
  private persistenceEnabled = true

  constructor(maxStoredSections = 10, enablePersistence = true) {
    this.maxSections = maxStoredSections
    this.persistenceEnabled = enablePersistence
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
   * Track document switches and load persisted context
   */
  async trackDocumentSwitch(title: string) {
    this.currentDocumentTitle = title
    this.lastLineNumber = 0
    this.lastChangeTime = 0

    // Load persisted context for this document
    if (this.persistenceEnabled) {
      await this.loadPersistedContext(title)
    }
  }

  /**
   * Load persisted context sections for a document
   * Uses hybrid approach: loads recent sections from all documents,
   * but separates current document sections for higher weighting
   */
  private async loadPersistedContext(documentTitle: string) {
    try {
      // Load recent sections from all documents (not just current one)
      const allSections = await loadAllRecentContextSections(
        this.maxSections * 2, // Load more to ensure good mix
      )

      // Separate current document sections and cross-document sections
      const currentDocSections = allSections
        .filter((s) => s.document_title === documentTitle)
        .slice(0, Math.ceil(this.maxSections * 0.6)) // 60% from current doc

      const crossDocSections = allSections
        .filter((s) => s.document_title !== documentTitle)
        .slice(0, Math.floor(this.maxSections * 0.4)) // 40% from other docs

      // Combine with current document sections first (higher weight)
      const combinedSections = [...currentDocSections, ...crossDocSections]

      // Convert from database format to VisitedSection format
      this.visitedSections = combinedSections.map((section) => ({
        content: section.content,
        documentTitle: section.document_title,
        timestamp: section.timestamp,
        lineNumber: section.line_number,
      }))
    } catch {
      // Silent fail - use empty context if load fails
    }
  }

  /**
   * Capture a section around the current line
   */
  private captureSection(model: monaco.editor.ITextModel, lineNumber: number) {
    const totalLines = model.getLineCount()
    const contextRadius = 2 // Capture 2 lines before and after

    const startLine = Math.max(1, lineNumber - contextRadius)
    const endLine = Math.min(totalLines, lineNumber + contextRadius)

    const lines: string[] = []
    for (let i = startLine; i <= endLine; i++) {
      lines.push(model.getLineContent(i))
    }

    const content = lines.join('\n').trim()

    // Only add if we have meaningful content
    if (content.length > 20) {
      const section: VisitedSection = {
        content,
        documentTitle: this.currentDocumentTitle,
        timestamp: Date.now(),
        lineNumber,
      }

      this.visitedSections.push(section)

      // Persist to database if enabled
      if (this.persistenceEnabled) {
        this.persistSection(section).catch(() => {
          // Silent fail - persistence is not critical
        })
      }

      // Keep only the most recent sections in memory
      if (this.visitedSections.length > this.maxSections) {
        this.visitedSections.shift()
      }
    }
  }

  /**
   * Persist a section to the database
   */
  private async persistSection(section: VisitedSection) {
    try {
      await saveContextSection({
        document_title: section.documentTitle,
        content: section.content,
        line_number: section.lineNumber,
        timestamp: section.timestamp,
      })
    } catch {
      // Silent fail - don't disrupt user experience
    }
  }

  /**
   * Get recently visited sections with hybrid weighting
   * Prioritizes current document but includes cross-document context
   */
  getRecentSections(limit = MAX_CONTEXT_SECTIONS): VisitedSection[] {
    // Separate current document sections and cross-document sections
    const currentDocSections = this.visitedSections
      .filter((s) => s.documentTitle === this.currentDocumentTitle)
      .sort((a, b) => b.timestamp - a.timestamp)

    const crossDocSections = this.visitedSections
      .filter((s) => s.documentTitle !== this.currentDocumentTitle)
      .sort((a, b) => b.timestamp - a.timestamp)

    // Take 60% from current doc, 40% from other docs
    const currentDocLimit = Math.ceil(limit * 0.6)
    const crossDocLimit = Math.floor(limit * 0.4)

    // Combine with current document sections first (higher priority)
    const combined = [
      ...currentDocSections.slice(0, currentDocLimit),
      ...crossDocSections.slice(0, crossDocLimit),
    ]

    // Sort combined results by timestamp descending (most recent first)
    return combined.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Clear all tracked sections (in-memory only)
   */
  clear() {
    this.visitedSections = []
    this.lastLineNumber = 0
    this.lastChangeTime = 0
  }

  /**
   * Cleanup old context sections from database
   */
  async cleanupOldContext(daysToKeep = 7) {
    if (!this.persistenceEnabled) return

    try {
      await cleanupOldContextSections(daysToKeep)
    } catch {
      // Silent fail
    }
  }

  /**
   * Limit total context sections in database
   */
  async limitStoredContext(maxSections = 200) {
    if (!this.persistenceEnabled) return

    try {
      await limitTotalContextSections(maxSections)
    } catch {
      // Silent fail
    }
  }
}
