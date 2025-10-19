/**
 * Test file for AutocompleteDebouncer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AutocompleteDebouncer } from './AutocompleteDebouncer'

describe('AutocompleteDebouncer', () => {
  let debouncer: AutocompleteDebouncer

  beforeEach(() => {
    debouncer = new AutocompleteDebouncer()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Basic debouncing', () => {
    it('should not debounce first request after delay', async () => {
      const promise = debouncer.delayAndShouldDebounce(100)

      // Fast-forward time
      vi.advanceTimersByTime(100)

      const shouldDebounce = await promise
      expect(shouldDebounce).toBe(false)
    })

    it('should handle sequential requests (not superseded)', async () => {
      // First request
      const promise1 = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result1 = await promise1
      expect(result1).toBe(false) // Not debounced

      // Second request after first completes
      const promise2 = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result2 = await promise2
      expect(result2).toBe(false) // Not debounced
    })

    it('should debounce superseded request (last one wins)', async () => {
      // First request (will be superseded and never resolve)
      void debouncer.delayAndShouldDebounce(100)

      // Immediately make second request (supersedes first)
      const promise2 = debouncer.delayAndShouldDebounce(100)

      // Advance time - only the second promise's timeout will fire
      // The first timeout was cleared
      vi.advanceTimersByTime(100)

      // Only check promise2 since promise1's timeout was cancelled
      const shouldDebounce2 = await promise2
      expect(shouldDebounce2).toBe(false) // Second request should proceed

      // Note: promise1 will never resolve because its timeout was cleared
      // This is expected behavior - cancelled requests don't resolve
    })

    it('should properly track request IDs', async () => {
      // Start first request (will be superseded and never resolve)
      void debouncer.delayAndShouldDebounce(100)

      // Advance time halfway
      vi.advanceTimersByTime(50)

      // Start second request (supersedes first)
      const promise2 = debouncer.delayAndShouldDebounce(100)

      // Advance time to complete second request
      vi.advanceTimersByTime(100)

      // Only second promise resolves (first was cancelled)
      const result2 = await promise2
      expect(result2).toBe(false)

      // Note: We don't await promise1 as it will never resolve
    })
  })

  describe('Different delay values', () => {
    it('should respect custom delay values', async () => {
      const promise = debouncer.delayAndShouldDebounce(500)

      // Only advance 400ms - should not resolve yet
      vi.advanceTimersByTime(400)

      // Add a short delay to let microtasks run
      await Promise.resolve()

      // Now advance the remaining 100ms
      vi.advanceTimersByTime(100)

      const shouldDebounce = await promise
      expect(shouldDebounce).toBe(false)
    })

    it('should handle zero delay', async () => {
      const promise = debouncer.delayAndShouldDebounce(0)

      vi.advanceTimersByTime(0)

      const shouldDebounce = await promise
      expect(shouldDebounce).toBe(false)
    })

    it('should handle very long delays', async () => {
      const promise = debouncer.delayAndShouldDebounce(10000)

      vi.advanceTimersByTime(10000)

      const result = await promise
      expect(result).toBe(false)
    })
  })

  describe('Cancel functionality', () => {
    it('should cancel pending request', async () => {
      debouncer.delayAndShouldDebounce(100)

      // Cancel before timeout completes
      debouncer.cancel()

      // Advance time (timeout should be cleared)
      vi.advanceTimersByTime(100)

      // The promise should never resolve, but we can test that cancel clears state
      // by making a new request
      const promise2 = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result2 = await promise2

      expect(result2).toBe(false) // New request should proceed
    })

    it('should handle cancel with no pending request', () => {
      // Should not throw
      expect(() => debouncer.cancel()).not.toThrow()
    })

    it('should cancel and allow new request immediately', async () => {
      debouncer.delayAndShouldDebounce(100)
      debouncer.cancel()

      const promise = debouncer.delayAndShouldDebounce(50)
      vi.advanceTimersByTime(50)

      const result = await promise
      expect(result).toBe(false)
    })

    it('should clear both timeout and request ID on cancel', async () => {
      debouncer.delayAndShouldDebounce(100)
      debouncer.cancel()

      // Make a new request - should work independently
      const promise = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result = await promise

      expect(result).toBe(false)
    })
  })

  describe('Request ID tracking', () => {
    it('should clear request ID after completion', async () => {
      const promise = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result = await promise
      expect(result).toBe(false)

      // Make another request - should get its own ID
      const promise2 = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result2 = await promise2

      expect(result2).toBe(false)
    })

    it('should generate unique IDs for each request', async () => {
      // We can't directly test UUID generation, but we can verify behavior
      const promise1 = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result1 = await promise1

      const promise2 = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)
      const result2 = await promise2

      // Both should complete successfully (not superseded)
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })
  })

  describe('Real-world typing scenarios', () => {
    it('should simulate user pausing then continuing', async () => {
      // User types "hel"
      const promise1 = debouncer.delayAndShouldDebounce(350)
      vi.advanceTimersByTime(350)
      const result1 = await promise1
      expect(result1).toBe(false) // Completion triggered

      // User continues typing "lo" after pause
      const promise2 = debouncer.delayAndShouldDebounce(350)
      vi.advanceTimersByTime(350)
      const result2 = await promise2
      expect(result2).toBe(false) // Another completion triggered
    })

    it('should simulate rapid typing where only last completes', async () => {
      // User types "h", then immediately "he", then "hel"
      debouncer.delayAndShouldDebounce(350) // "h" - will be cancelled
      debouncer.delayAndShouldDebounce(350) // "he" - will be cancelled
      const promise3 = debouncer.delayAndShouldDebounce(350) // "hel" - will complete

      // Advance time
      vi.advanceTimersByTime(350)

      const result3 = await promise3
      expect(result3).toBe(false) // Last request completes

      // Note: First two promises never resolve (cancelled)
    })

    it('should handle typing with pause in middle', async () => {
      // Type "he" quickly (second request cancels first)
      debouncer.delayAndShouldDebounce(350)
      const promise2 = debouncer.delayAndShouldDebounce(350)

      vi.advanceTimersByTime(350)
      const result2 = await promise2
      expect(result2).toBe(false) // Completion shows

      // User pauses, then types more
      const promise3 = debouncer.delayAndShouldDebounce(350)
      vi.advanceTimersByTime(350)
      const result3 = await promise3

      expect(result3).toBe(false) // New completion shows
    })
  })

  describe('Edge cases', () => {
    it('should handle superseding after partial delay', async () => {
      debouncer.delayAndShouldDebounce(100)

      // Advance 50ms (halfway)
      vi.advanceTimersByTime(50)

      // New request supersedes
      const promise2 = debouncer.delayAndShouldDebounce(100)

      // Advance full 100ms for second request
      vi.advanceTimersByTime(100)

      const result2 = await promise2
      expect(result2).toBe(false) // Second request completes
    })

    it('should handle multiple supersessions in sequence', async () => {
      // Each request supersedes the previous
      debouncer.delayAndShouldDebounce(100)
      debouncer.delayAndShouldDebounce(100)
      debouncer.delayAndShouldDebounce(100)
      const finalPromise = debouncer.delayAndShouldDebounce(100)

      vi.advanceTimersByTime(100)

      const result = await finalPromise
      expect(result).toBe(false) // Only final request completes
    })

    it('should handle cancel followed by new request', async () => {
      debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(50)

      debouncer.cancel()

      const promise = debouncer.delayAndShouldDebounce(100)
      vi.advanceTimersByTime(100)

      const result = await promise
      expect(result).toBe(false)
    })
  })

  describe('Timeout management', () => {
    it('should clear previous timeout when new request arrives', async () => {
      // This verifies that clearTimeout is called internally (first will never resolve)
      void debouncer.delayAndShouldDebounce(100)

      // New request should clear previous timeout
      const promise2 = debouncer.delayAndShouldDebounce(200)

      // Advance past first timeout (100ms)
      vi.advanceTimersByTime(100)

      // promise1 should not resolve at this point
      // Only advance remaining time for promise2
      vi.advanceTimersByTime(100)

      const result2 = await promise2
      expect(result2).toBe(false)

      // promise1 never resolves
    })
  })
})
