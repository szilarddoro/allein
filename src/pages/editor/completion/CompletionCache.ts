/**
 * Simple in-memory LRU cache for completion results
 * Inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
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
   * Uses exact string matching to ensure completions are only returned
   * when the context exactly matches (whitespace and case-sensitive)
   */
  get(prefix: string): string | undefined {
    const entry = this.cache.get(prefix)
    if (entry) {
      // Update timestamp and sequence (LRU)
      entry.timestamp = Date.now()
      entry.sequence = ++this.sequenceCounter
      return entry.value
    }

    return undefined
  }

  /**
   * Get completion with prefix match capability
   * Alias for get() - kept for backward compatibility
   */
  getByPrefixMatch(prefix: string): string | undefined {
    return this.get(prefix)
  }

  /**
   * Store a completion in the cache
   */
  put(prefix: string, completion: string): void {
    // Check if we need to evict (LRU)
    if (this.cache.size >= this.capacity && !this.cache.has(prefix)) {
      this.evictOldest()
    }

    // Add or update entry
    this.cache.set(prefix, {
      key: prefix,
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
