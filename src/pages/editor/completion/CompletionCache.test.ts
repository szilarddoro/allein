/**
 * Test file for CompletionCache
 * Run this with: pnpm vitest src/pages/editor/completion/CompletionCache.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CompletionCache } from './CompletionCache'

describe('CompletionCache', () => {
  let cache: CompletionCache

  beforeEach(() => {
    cache = new CompletionCache(3) // Small capacity for testing
  })

  describe('Basic operations', () => {
    it('should store and retrieve exact matches', () => {
      cache.put('hello', 'world')
      expect(cache.get('hello')).toBe('world')
    })

    it('should return undefined for cache miss', () => {
      expect(cache.get('nonexistent')).toBeUndefined()
    })

    it('should be case-insensitive', () => {
      cache.put('Hello World', 'test completion')
      expect(cache.get('hello world')).toBe('test completion')
      expect(cache.get('HELLO WORLD')).toBe('test completion')
    })

    it('should trim whitespace', () => {
      cache.put('  hello  ', 'world')
      expect(cache.get('hello')).toBe('world')
    })
  })

  describe('Prefix matching', () => {
    it('should match prefixes and return remainder', () => {
      // Store "c" -> "ontinue"
      cache.put('c', 'ontinue')

      // When we query "co", it should find "c" and return "ntinue"
      // (because "ontinue" with "o" already typed = "ntinue" remaining)
      expect(cache.get('co')).toBe('ntinue')
    })

    it('should handle multiple word completions', () => {
      cache.put('the quick', 'brown fox')

      // Exact match
      expect(cache.get('the quick')).toBe('brown fox')

      // Prefix match - if user types more
      expect(cache.get('the quick b')).toBe('rown fox')
      expect(cache.get('the quick br')).toBe('own fox')
    })

    it('should not match if completion does not start with remainder', () => {
      cache.put('hello', 'world')

      // "hellox" should not match because "world" doesn't start with "x"
      expect(cache.get('hellox')).toBeUndefined()
    })
  })

  describe('LRU eviction', () => {
    it('should evict oldest entry when capacity is reached', () => {
      // Capacity is 3
      cache.put('first', 'entry1')
      cache.put('second', 'entry2')
      cache.put('third', 'entry3')

      // All should be present
      expect(cache.get('first')).toBe('entry1')
      expect(cache.get('second')).toBe('entry2')
      expect(cache.get('third')).toBe('entry3')

      // Add 4th entry - should evict 'first' (oldest)
      cache.put('fourth', 'entry4')

      expect(cache.get('first')).toBeUndefined()
      expect(cache.get('second')).toBe('entry2')
      expect(cache.get('third')).toBe('entry3')
      expect(cache.get('fourth')).toBe('entry4')
    })

    it('should update timestamp on get (LRU behavior)', () => {
      cache.put('first', 'entry1')
      cache.put('second', 'entry2')
      cache.put('third', 'entry3')

      // Access 'first' to update its timestamp
      cache.get('first')

      // Add 4th entry - should evict 'second' (now oldest)
      cache.put('fourth', 'entry4')

      expect(cache.get('first')).toBe('entry1') // Still present
      expect(cache.get('second')).toBeUndefined() // Evicted
      expect(cache.get('third')).toBe('entry3')
      expect(cache.get('fourth')).toBe('entry4')
    })
  })

  describe('Cache management', () => {
    it('should clear all entries', () => {
      cache.put('first', 'entry1')
      cache.put('second', 'entry2')

      expect(cache.size()).toBe(2)

      cache.clear()

      expect(cache.size()).toBe(0)
      expect(cache.get('first')).toBeUndefined()
      expect(cache.get('second')).toBeUndefined()
    })

    it('should report correct size', () => {
      expect(cache.size()).toBe(0)

      cache.put('first', 'entry1')
      expect(cache.size()).toBe(1)

      cache.put('second', 'entry2')
      expect(cache.size()).toBe(2)

      cache.clear()
      expect(cache.size()).toBe(0)
    })
  })

  describe('Real-world scenarios', () => {
    it('should cache markdown sentence completions', () => {
      const prefix = 'The quick brown fox'
      const completion = 'jumps over the lazy dog'

      cache.put(prefix, completion)

      // User types the exact prefix again
      expect(cache.get(prefix)).toBe(completion)

      // User types more of the prefix
      expect(cache.get(prefix + ' j')).toBe('umps over the lazy dog')
    })

    it('should handle typing incrementally', () => {
      // User types "hello w" and gets completion "orld"
      cache.put('hello w', 'orld')

      // User deletes and retypes
      expect(cache.get('hello w')).toBe('orld')

      // User types more
      expect(cache.get('hello wo')).toBe('rld')
      expect(cache.get('hello wor')).toBe('ld')
      expect(cache.get('hello worl')).toBe('d')
    })
  })
})
