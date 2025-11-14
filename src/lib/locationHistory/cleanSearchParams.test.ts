import { describe, it, expect } from 'vitest'
import {
  FOCUS_NAME_INPUT_SEARCH_PARAM,
  LINE_NUMBER_SEARCH_PARAM,
} from '@/lib/constants'
import { cleanSearchParams } from './cleanSearchParams'

describe('cleanSearchParams', () => {
  describe('with string input', () => {
    it('should remove LINE_NUMBER_SEARCH_PARAM from search string', () => {
      const result = cleanSearchParams(
        `?${LINE_NUMBER_SEARCH_PARAM}=42&file=test.md`,
      )
      expect(result).toBe('file=test.md')
    })

    it('should remove FOCUS_NAME_INPUT_SEARCH_PARAM from search string', () => {
      const result = cleanSearchParams(
        `?${FOCUS_NAME_INPUT_SEARCH_PARAM}=true&file=test.md`,
      )
      expect(result).toBe('file=test.md')
    })

    it('should remove both temporary params from search string', () => {
      const result = cleanSearchParams(
        `?${LINE_NUMBER_SEARCH_PARAM}=10&${FOCUS_NAME_INPUT_SEARCH_PARAM}=true&file=test.md`,
      )
      expect(result).not.toContain(LINE_NUMBER_SEARCH_PARAM)
      expect(result).not.toContain(FOCUS_NAME_INPUT_SEARCH_PARAM)
      expect(result).toContain('file=test.md')
    })

    it('should preserve other search params', () => {
      const result = cleanSearchParams('?file=test.md&scroll=100&theme=dark')
      expect(result).toContain('file=test.md')
      expect(result).toContain('scroll=100')
      expect(result).toContain('theme=dark')
    })

    it('should handle empty search string', () => {
      const result = cleanSearchParams('?')
      expect(result).toBe('')
    })

    it('should handle only temporary params', () => {
      const result = cleanSearchParams(
        `?${LINE_NUMBER_SEARCH_PARAM}=5&${FOCUS_NAME_INPUT_SEARCH_PARAM}=true`,
      )
      expect(result).toBe('')
    })

    it('should handle params with no question mark prefix', () => {
      const result = cleanSearchParams(
        `file=test.md&${LINE_NUMBER_SEARCH_PARAM}=10`,
      )
      expect(result).toBe('file=test.md')
    })

    it('should preserve URL encoded values', () => {
      const result = cleanSearchParams(
        `?file=test%20file.md&${LINE_NUMBER_SEARCH_PARAM}=10`,
      )
      // URLSearchParams normalizes %20 to +, both represent spaces in URL encoding
      expect(result).toMatch(/file=test[+%20]file\.md/)
    })
  })

  describe('with URLSearchParams input', () => {
    it('should remove LINE_NUMBER_SEARCH_PARAM from URLSearchParams', () => {
      const params = new URLSearchParams(
        `${LINE_NUMBER_SEARCH_PARAM}=42&file=test.md`,
      )
      const result = cleanSearchParams(params)
      expect(result).toBe('file=test.md')
      expect(result).not.toContain(LINE_NUMBER_SEARCH_PARAM)
    })

    it('should remove FOCUS_NAME_INPUT_SEARCH_PARAM from URLSearchParams', () => {
      const params = new URLSearchParams(
        `${FOCUS_NAME_INPUT_SEARCH_PARAM}=true&file=test.md`,
      )
      const result = cleanSearchParams(params)
      expect(result).toBe('file=test.md')
      expect(result).not.toContain(FOCUS_NAME_INPUT_SEARCH_PARAM)
    })

    it('should remove both temporary params from URLSearchParams', () => {
      const params = new URLSearchParams(
        `${LINE_NUMBER_SEARCH_PARAM}=10&${FOCUS_NAME_INPUT_SEARCH_PARAM}=true&file=test.md`,
      )
      const result = cleanSearchParams(params)
      expect(result).not.toContain(LINE_NUMBER_SEARCH_PARAM)
      expect(result).not.toContain(FOCUS_NAME_INPUT_SEARCH_PARAM)
      expect(result).toContain('file=test.md')
    })

    it('should preserve other params in URLSearchParams', () => {
      const params = new URLSearchParams('file=test.md&scroll=100&theme=dark')
      const result = cleanSearchParams(params)
      expect(result).toContain('file=test.md')
      expect(result).toContain('scroll=100')
      expect(result).toContain('theme=dark')
    })

    it('should handle empty URLSearchParams', () => {
      const params = new URLSearchParams()
      const result = cleanSearchParams(params)
      expect(result).toBe('')
    })

    it('should handle only temporary params in URLSearchParams', () => {
      const params = new URLSearchParams(
        `${LINE_NUMBER_SEARCH_PARAM}=5&${FOCUS_NAME_INPUT_SEARCH_PARAM}=true`,
      )
      const result = cleanSearchParams(params)
      expect(result).toBe('')
    })

    it('should return string without question mark for URLSearchParams', () => {
      const params = new URLSearchParams('file=test.md')
      const result = cleanSearchParams(params)
      expect(result).toBe('file=test.md')
      expect(result).not.toContain('?')
    })
  })

  describe('edge cases', () => {
    it('should handle params with empty values', () => {
      const result = cleanSearchParams(`?file=&${LINE_NUMBER_SEARCH_PARAM}=`)
      expect(result).toBe('file=')
    })

    it('should handle multiple values for same param', () => {
      const params = new URLSearchParams(
        `file=a.md&file=b.md&${LINE_NUMBER_SEARCH_PARAM}=10`,
      )
      const result = cleanSearchParams(params)
      expect(result).toContain('file=')
      expect(result).not.toContain(LINE_NUMBER_SEARCH_PARAM)
    })

    it('should handle special characters in param values', () => {
      const result = cleanSearchParams(
        `?file=test%26special.md&${LINE_NUMBER_SEARCH_PARAM}=10`,
      )
      expect(result).toContain('file=test%26special.md')
      expect(result).not.toContain(LINE_NUMBER_SEARCH_PARAM)
    })

    it('should be case sensitive for param names', () => {
      const result = cleanSearchParams('Line=10&file=test.md')
      // Different case should not be removed
      expect(result).toContain('Line=10')
      expect(result).toContain('file=test.md')
    })

    it('should handle URL without temporary params', () => {
      const result = cleanSearchParams('file=example.md&folder=documents')
      expect(result).toContain('file=example.md')
      expect(result).toContain('folder=documents')
    })
  })
})
