import { describe, it, expect } from 'vitest'
import { extractSentences } from './extractSentences'

describe('extractSentences', () => {
  describe('basic sentence extraction', () => {
    it('extracts current and previous sentences', () => {
      const result = extractSentences('Hello world. This is a test')
      expect(result.currentSentence).toBe('This is a test')
      expect(result.previousSentence).toBe('Hello world.')
    })

    it('handles single sentence without terminator', () => {
      const result = extractSentences('Incomplete sentence at end')
      expect(result.currentSentence).toBe('Incomplete sentence at end')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles single complete sentence', () => {
      const result = extractSentences('Hello world.')
      expect(result.currentSentence).toBe('Hello world.')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles empty string', () => {
      const result = extractSentences('')
      expect(result.currentSentence).toBe('')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles only whitespace', () => {
      const result = extractSentences('   \t  ')
      expect(result.currentSentence).toBe('')
      expect(result.previousSentence).toBeUndefined()
    })
  })

  describe('newline handling', () => {
    it('strips newlines to include previous text block', () => {
      const result = extractSentences('First sentence.\nSecond sentence')
      expect(result.currentSentence).toBe('Second sentence')
      expect(result.previousSentence).toBe('First sentence.')
    })

    it('handles multiple newlines', () => {
      const result = extractSentences('First.\n\nSecond.\n\nThird')
      expect(result.currentSentence).toBe('Third')
      expect(result.previousSentence).toBe('Second.')
    })

    it('handles newline at end', () => {
      const result = extractSentences('First sentence.\n')
      expect(result.currentSentence).toBe('First sentence.')
      expect(result.previousSentence).toBeUndefined()
    })

    it('preserves paragraph context with previous paragraph lookup', () => {
      // Two paragraphs separated by double newline
      // Last paragraph is "This is great!" (the current sentence)
      // Previous paragraph is "What is this?" (the previous sentence)
      const result = extractSentences('What is this?\n\nThis is great!')
      expect(result.currentSentence).toBe('This is great!')
      expect(result.previousSentence).toBe('What is this?')
    })
  })

  describe('different punctuation marks', () => {
    it('handles periods', () => {
      const result = extractSentences('First. Second')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })

    it('handles question marks', () => {
      const result = extractSentences('What? Answer')
      expect(result.currentSentence).toBe('Answer')
      expect(result.previousSentence).toBe('What?')
    })

    it('handles exclamation marks', () => {
      const result = extractSentences('Great! More text')
      expect(result.currentSentence).toBe('More text')
      expect(result.previousSentence).toBe('Great!')
    })

    it('handles mixed punctuation', () => {
      const result = extractSentences('Amazing! What? Sure. Next')
      expect(result.currentSentence).toBe('Next')
      expect(result.previousSentence).toBe('Sure.')
    })
  })

  describe('whitespace handling', () => {
    it('trims leading/trailing whitespace from sentences', () => {
      const result = extractSentences('  First.   Second  ')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })

    it('handles multiple spaces between sentences', () => {
      const result = extractSentences('First.    Second')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })

    it('handles tabs and mixed whitespace', () => {
      const result = extractSentences('First.\t\t  Second')
      expect(result.currentSentence).toBe('Second')
      expect(result.previousSentence).toBe('First.')
    })
  })

  describe('edge cases', () => {
    it('handles incomplete sentence after complete sentence', () => {
      const result = extractSentences('Complete. Incomp')
      expect(result.currentSentence).toBe('Incomp')
      expect(result.previousSentence).toBe('Complete.')
    })

    it('handles three sentences - returns last two', () => {
      const result = extractSentences('First. Second. Third')
      expect(result.currentSentence).toBe('Third')
      expect(result.previousSentence).toBe('Second.')
    })

    it('handles text starting mid-sentence', () => {
      const result = extractSentences('middle of sentence. New sentence')
      expect(result.currentSentence).toBe('New sentence')
      expect(result.previousSentence).toBe('middle of sentence.')
    })

    it('handles punctuation at start', () => {
      const result = extractSentences('. Only incomplete')
      expect(result.currentSentence).toBe('Only incomplete')
      // Text before the period with no second terminator
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles only punctuation', () => {
      const result = extractSentences('.')
      expect(result.currentSentence).toBe('.')
      expect(result.previousSentence).toBeUndefined()
    })

    it('handles multiple terminators - extracts last two properly', () => {
      // "What?! Really. Yes!"
      // Last terminator is final !, so no text after
      // This means the entire thing is currentSentence
      const result = extractSentences('What?! Really. Yes!')
      expect(result.currentSentence).toBe('What?! Really. Yes!')
      expect(result.previousSentence).toBeUndefined()
    })
  })

  describe('full document context (across paragraphs)', () => {
    it('finds context from previous paragraph when current line has none', () => {
      // Simulates: Previous paragraph with context.\n\nCurrent line at start of new paragraph
      const fullDocText =
        'First paragraph. Important context.\n\nNew paragraph start'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('New paragraph start')
      expect(result.previousSentence).toBe('Important context.')
    })

    it('prefers current line context when available', () => {
      // If current line has its own previous sentence, use that instead of looking back
      const fullDocText =
        'Old context. Older.\n\nPrevious sentence. Current sentence'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('Current sentence')
      expect(result.previousSentence).toBe('Previous sentence.')
    })

    it('handles multiple paragraph transitions', () => {
      const fullDocText =
        'Section one. Content.\n\nSection two. More content.\n\nSection three'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('Section three')
      expect(result.previousSentence).toBe('More content.')
    })

    it('gracefully handles paragraphs with complex structure', () => {
      const fullDocText =
        'First part. Second part.\n\nThird part. Fourth part.\n\nFinal'
      const result = extractSentences(fullDocText)

      expect(result.currentSentence).toBe('Final')
      expect(result.previousSentence).toBe('Fourth part.')
    })
  })

  describe('markdown stripping', () => {
    it('strips bold markdown from sentences', () => {
      const result = extractSentences('This is **bold** text. Next sentence')
      expect(result.currentSentence).toBe('Next sentence')
      expect(result.previousSentence).toBe('This is bold text.')
      expect(result.currentSentence).not.toContain('**')
      expect(result.previousSentence).not.toContain('**')
    })

    it('strips italic markdown from sentences', () => {
      const result = extractSentences('This is *italic* text. Next sentence')
      expect(result.currentSentence).toBe('Next sentence')
      expect(result.previousSentence).toBe('This is italic text.')
      expect(result.currentSentence).not.toContain('*')
      expect(result.previousSentence).not.toContain('*italic*')
    })

    it('strips headers from sentences', () => {
      const result = extractSentences('# Main heading here. Some content')
      expect(result.currentSentence).toBe('Some content')
      expect(result.previousSentence).toBe('Main heading here.')
      expect(result.previousSentence).not.toContain('#')
    })

    it('strips code blocks from sentences', () => {
      const result = extractSentences('Use `const x = 5;` here. Next part')
      expect(result.currentSentence).toBe('Next part')
      expect(result.previousSentence).toContain('Use const x = 5; here.')
      expect(result.previousSentence).not.toContain('`')
    })

    it('strips links from sentences', () => {
      const result = extractSentences(
        'Check [this link](https://example.com) here. Next sentence',
      )
      expect(result.currentSentence).toBe('Next sentence')
      expect(result.previousSentence).toBe('Check this link here.')
      expect(result.previousSentence).not.toContain('[')
      expect(result.previousSentence).not.toContain('](')
    })

    it('strips images from sentences', () => {
      const result = extractSentences(
        'Here is ![alt text](image.png) embedded. Next part',
      )
      expect(result.currentSentence).toBe('Next part')
      expect(result.previousSentence).toContain('Here is')
      expect(result.previousSentence).toContain('embedded.')
      expect(result.previousSentence).not.toContain('![')
    })

    it('strips images with long URLs from sentences', () => {
      const result = extractSentences(
        'This is a ![cat image](https://plus.unsplash.com/premium_photo-1667030474693-6d0632f97029?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987).',
      )
      expect(result.currentSentence).toBe('This is a cat image.')
      expect(result.currentSentence).not.toContain('![')
      expect(result.currentSentence).not.toContain('https://')
      expect(result.currentSentence).not.toContain('unsplash')
    })

    it('strips blockquotes from sentences', () => {
      const result = extractSentences('> Quote text here. After quote')
      expect(result.currentSentence).toBe('After quote')
      expect(result.previousSentence).toBe('Quote text here.')
      expect(result.previousSentence).not.toContain('>')
    })

    it('strips list markers from sentences', () => {
      const result = extractSentences('- First item here. - Second item')
      expect(result.currentSentence).toContain('Second item')
      expect(result.previousSentence).toContain('First item here.')
      // List markers should be removed
      expect(result.previousSentence).not.toContain('- ')
    })

    it('handles multiple markdown types in one sentence', () => {
      const result = extractSentences(
        'This has **bold** and *italic* and `code`. Next sentence',
      )
      expect(result.currentSentence).toBe('Next sentence')
      expect(result.previousSentence).toBe('This has bold and italic and code.')
      expect(result.previousSentence).not.toContain('**')
      expect(result.previousSentence).not.toContain('*')
      expect(result.previousSentence).not.toContain('`')
    })

    it('strips markdown across paragraph boundaries', () => {
      const result = extractSentences(
        '# Header. **Bold** text.\n\n*Italic* continuation',
      )
      expect(result.currentSentence).toBe('Italic continuation')
      expect(result.previousSentence).toContain('Bold text.')
      expect(result.currentSentence).not.toContain('*')
      expect(result.previousSentence).not.toContain('**')
    })
  })

  describe('real-world examples', () => {
    it('handles markdown prose example 1', () => {
      const result = extractSentences(
        'The quick brown fox jumps. Over the lazy dog',
      )
      expect(result.currentSentence).toBe('Over the lazy dog')
      expect(result.previousSentence).toBe('The quick brown fox jumps.')
    })

    it('handles markdown prose example 2', () => {
      const result = extractSentences(
        'This is a complex sentence with many words. And this is another one that continues the thought',
      )
      expect(result.currentSentence).toBe(
        'And this is another one that continues the thought',
      )
      expect(result.previousSentence).toBe(
        'This is a complex sentence with many words.',
      )
    })

    it('handles dialogue-like content - exclamation inside quotes', () => {
      // Text: "Hello there!" she said. He nodded
      // Last terminator is the period after "said", not the ! in quotes
      const result = extractSentences('"Hello there!" she said. He nodded')
      expect(result.currentSentence).toBe('He nodded')
      // Previous sentence is everything up to and including the period
      expect(result.previousSentence).toBe('" she said.')
    })

    it('handles list item continuation', () => {
      const result = extractSentences('First item. Still part of first')
      expect(result.currentSentence).toBe('Still part of first')
      expect(result.previousSentence).toBe('First item.')
    })

    it('handles paragraph with markdown that needs cleaning', () => {
      const result = extractSentences(
        'The **important** context. The *current* sentence here',
      )
      expect(result.currentSentence).toBe('The current sentence here')
      expect(result.previousSentence).toBe('The important context.')
      // Verify markdown is stripped
      expect(result.currentSentence).not.toContain('*')
      expect(result.previousSentence).not.toContain('**')
    })

    it('handles complex markdown document structure', () => {
      const complexDoc = `# Main Title

The **first** paragraph. This has *emphasis*.

## Section Two

Another paragraph with \`code\`.`

      const result = extractSentences(complexDoc)
      // Should extract clean sentences without markdown
      expect(result.currentSentence).not.toContain('**')
      expect(result.currentSentence).not.toContain('*')
      expect(result.currentSentence).not.toContain('`')
      expect(result.currentSentence).not.toContain('#')
      if (result.previousSentence) {
        expect(result.previousSentence).not.toContain('**')
        expect(result.previousSentence).not.toContain('*')
        expect(result.previousSentence).not.toContain('`')
      }
    })

    it('handles multiple sections properly', () => {
      const complexDoc = `# Writing Demo Doc

I'll restart this document again to demonstrate how the inline completions work within the text editor. 

This is a ![cat image](https://plus.unsplash.com/premium_photo-1667030474693-6d0632f97029?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=987) which is `

      const result = extractSentences(complexDoc)

      expect(result.currentSentence).toBe('This is a cat image which is')
      expect(result.previousSentence).toBe(
        "I'll restart this document again to demonstrate how the inline completions work within the text editor.",
      )
    })
  })
})
