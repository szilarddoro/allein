import { getDatabase } from './database'

export interface ContextSection {
  id?: number
  document_title: string
  content: string
  line_number: number
  timestamp: number
  created_at?: number
}

/**
 * Save a context section to the database
 */
export async function saveContextSection(
  section: Omit<ContextSection, 'id' | 'created_at'>,
) {
  const db = await getDatabase()
  await db.execute(
    `INSERT INTO context_sections (document_title, content, line_number, timestamp)
     VALUES (?, ?, ?, ?)`,
    [
      section.document_title,
      section.content,
      section.line_number,
      section.timestamp,
    ],
  )
}

/**
 * Load recent context sections for a specific document
 */
export async function loadContextSections(
  documentTitle: string,
  limit = 10,
): Promise<ContextSection[]> {
  const db = await getDatabase()
  const result = await db.select<ContextSection[]>(
    `SELECT * FROM context_sections
     WHERE document_title = ?
     ORDER BY timestamp DESC
     LIMIT ?`,
    [documentTitle, limit],
  )
  return result
}

/**
 * Load recent context sections across all documents
 */
export async function loadAllRecentContextSections(
  limit = 10,
): Promise<ContextSection[]> {
  const db = await getDatabase()
  const result = await db.select<ContextSection[]>(
    `SELECT * FROM context_sections
     ORDER BY timestamp DESC
     LIMIT ?`,
    [limit],
  )
  return result
}

/**
 * Delete old context sections (older than specified days)
 */
export async function cleanupOldContextSections(daysToKeep = 7) {
  const db = await getDatabase()
  const cutoffTimestamp = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
  await db.execute(`DELETE FROM context_sections WHERE timestamp < ?`, [
    cutoffTimestamp,
  ])
}

/**
 * Delete all context sections for a specific document
 */
export async function deleteContextSectionsForDocument(documentTitle: string) {
  const db = await getDatabase()
  await db.execute(`DELETE FROM context_sections WHERE document_title = ?`, [
    documentTitle,
  ])
}

/**
 * Get total count of stored context sections
 */
export async function getContextSectionsCount(): Promise<number> {
  const db = await getDatabase()
  const result = await db.select<[{ count: number }]>(
    `SELECT COUNT(*) as count FROM context_sections`,
  )
  return result[0]?.count ?? 0
}

/**
 * Limit total context sections by removing oldest entries
 */
export async function limitTotalContextSections(maxSections = 200) {
  const db = await getDatabase()
  await db.execute(
    `DELETE FROM context_sections
     WHERE id NOT IN (
       SELECT id FROM context_sections
       ORDER BY timestamp DESC
       LIMIT ?
     )`,
    [maxSections],
  )
}
