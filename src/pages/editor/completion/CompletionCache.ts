/**
 * Simple in-memory LRU cache for completion results
 * Inspired by Continue.dev but simplified for browser environment
 */

interface CacheEntry {
  key: string
  value: string
  timestamp: number
  sequence: number // For tie-breaking when timestamps are equal
}

export class CompletionCache {
  private cache: Map<string, CacheEntry> = new Map()
  private readonly capacity: number
  private sequenceCounter: number = 0

  constructor(capacity: number = 500) {
    this.capacity = capacity
  }

  /**
   * Get a cached completion for the given prefix
   * Returns the completion text if found, undefined otherwise
   */
  get(prefix: string): string | undefined {
    // Normalize prefix (trim and lowercase for matching)
    const normalizedPrefix = this.normalizePrefix(prefix)

    // Try exact match first
    const entry = this.cache.get(normalizedPrefix)
    if (entry) {
      // Update timestamp and sequence (LRU)
      entry.timestamp = Date.now()
      entry.sequence = ++this.sequenceCounter
      return entry.value
    }

    // Try to find a cached key that matches as a prefix
    // If query is "the quick b" and we have "the quick" -> "brown fox",
    // we should return "rown fox" (because user typed "b" already)
    for (const [cachedKey, cachedEntry] of this.cache.entries()) {
      // Check if the cached key is a prefix of the query
      if (normalizedPrefix.startsWith(cachedKey)) {
        // Update timestamp and sequence (LRU)
        cachedEntry.timestamp = Date.now()
        cachedEntry.sequence = ++this.sequenceCounter

        // Calculate what the user has typed beyond the cached prefix
        const extraTyped = normalizedPrefix.slice(cachedKey.length).trim()
        const completion = cachedEntry.value

        // If nothing extra typed, return full completion (exact match handled above)
        if (extraTyped.length === 0) {
          return completion
        }

        // Check if the completion starts with what the user typed extra
        if (completion.toLowerCase().startsWith(extraTyped)) {
          // Return the remaining part (what user hasn't typed yet)
          return completion.slice(extraTyped.length)
        }
      }
    }

    return undefined
  }

  /**
   * Store a completion in the cache
   */
  put(prefix: string, completion: string): void {
    const normalizedPrefix = this.normalizePrefix(prefix)

    // Check if we need to evict (LRU)
    if (this.cache.size >= this.capacity && !this.cache.has(normalizedPrefix)) {
      this.evictOldest()
    }

    // Add or update entry
    this.cache.set(normalizedPrefix, {
      key: normalizedPrefix,
      value: completion,
      timestamp: Date.now(),
      sequence: ++this.sequenceCounter,
    })
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size
  }

  /**
   * Evict the least recently used entry
   * Uses timestamp first, then sequence number for tie-breaking
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTimestamp = Infinity
    let oldestSequence = Infinity

    for (const [key, entry] of this.cache.entries()) {
      // Compare timestamp first, then sequence for tie-breaking
      if (
        entry.timestamp < oldestTimestamp ||
        (entry.timestamp === oldestTimestamp && entry.sequence < oldestSequence)
      ) {
        oldestTimestamp = entry.timestamp
        oldestSequence = entry.sequence
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Normalize prefix for consistent caching
   */
  private normalizePrefix(prefix: string): string {
    // Trim whitespace and convert to lowercase for case-insensitive matching
    return prefix.trim().toLowerCase()
  }
}

// Singleton instance
let instance: CompletionCache | null = null

/**
 * Get the singleton CompletionCache instance
 */
export function getCompletionCache(): CompletionCache {
  if (!instance) {
    instance = new CompletionCache()
  }
  return instance
}
