import { describe, it, expect } from 'vitest'
import { wrapCompletion } from './wrapCompletion'

describe('wrapCompletion', () => {
  it('should not wrap text that fits on current line', () => {
    const completion = 'This is a short completion'
    const result = wrapCompletion(completion, {
      currentColumn: 10,
      wrapColumn: 80,
    })

    expect(result).toBe(completion)
    expect(result.includes('\n')).toBe(false)
  })

  it('should wrap long text at word boundaries', () => {
    const completion =
      'This is a very long completion that definitely exceeds the wrap column and should be wrapped at word boundaries'
    const result = wrapCompletion(completion, {
      currentColumn: 60,
      wrapColumn: 80,
    })

    expect(result.includes('\n')).toBe(true)
    const lines = result.split('\n')
    expect(lines.length).toBeGreaterThan(1)

    // Verify no line exceeds wrap column (accounting for cursor position on first line)
    lines.forEach((line, index) => {
      const effectiveLength = index === 0 ? 60 + line.length : line.length
      expect(effectiveLength).toBeLessThanOrEqual(80)
    })
  })

  it('should handle wrapping near the end of line', () => {
    const completion = 'and the reason why they are not used in production'
    const result = wrapCompletion(completion, {
      currentColumn: 70,
      wrapColumn: 80,
    })

    expect(result.includes('\n')).toBe(true)
    const lines = result.split('\n')
    expect(lines[0]).toBe('and the')
    expect(lines[1].trim()).toBe('reason why they are not used in production')
  })

  it('should preserve single words longer than wrap column', () => {
    const completion =
      'https://www.verylongurlthatexceedswrapcolumn.com/path/to/resource'
    const result = wrapCompletion(completion, {
      currentColumn: 5,
      wrapColumn: 30,
    })

    // Should still include the URL even if it's longer than wrap column
    expect(result).toContain('https://www.verylongurlthatexceedswrapcolumn.com')
  })

  it('should handle completions starting with spaces', () => {
    const completion = '  some text with leading spaces'
    const result = wrapCompletion(completion, {
      currentColumn: 60,
      wrapColumn: 80,
    })

    // Leading spaces are stripped during split, result will be wrapped
    expect(result.includes('\n')).toBe(true)
    // But should still contain all the words
    expect(result.replace(/\n/g, ' ')).toContain('some text with')
    expect(result.replace(/\n/g, ' ')).toContain('leading spaces')
  })

  it('should handle empty string', () => {
    const completion = ''
    const result = wrapCompletion(completion, {
      currentColumn: 10,
      wrapColumn: 80,
    })

    expect(result).toBe('')
  })

  it('should use default wrap column of 80 when not specified', () => {
    const completion =
      'This is a completion that should use the default wrap column'
    const result = wrapCompletion(completion, {
      currentColumn: 60,
    })

    // Should wrap because 60 + completion length > 80
    expect(result.includes('\n')).toBe(true)
  })
})
