/**
 * Type definitions for sbd (Sentence Boundary Detection)
 * https://github.com/Tessmore/sbd
 *
 * This module provides sentence boundary detection for splitting text into sentences.
 */

/**
 * Options for sentence boundary detection
 */
export interface SbdOptions {
  /**
   * Force sentence split at newlines
   * @default false
   */
  newline_boundaries?: boolean

  /**
   * Force sentence split at specific HTML tags (br, /p, /div, /ul, /ol)
   * @default false
   */
  html_boundaries?: boolean

  /**
   * Array of HTML tags to use as sentence boundaries when html_boundaries is true
   * @default ["p", "div", "ul", "ol"]
   */
  html_boundaries_tags?: string[]

  /**
   * Sanitize HTML content in the text
   * @default false
   */
  sanitize?: boolean

  /**
   * List of HTML tags to allow when sanitizing (requires sanitize-html package)
   * @default false (no tags allowed)
   */
  allowed_tags?: string[] | false

  /**
   * Preserve the literal whitespace between words and sentences
   * Otherwise, internal spaces are normalized to a single space and inter-sentence whitespace is omitted
   * Has no effect if either newline_boundaries or html_boundaries is specified
   * @default false
   */
  preserve_whitespace?: boolean

  /**
   * List of custom abbreviations to override the default ones for use with other languages
   * Don't include dots in custom abbreviations
   * @default null
   */
  abbreviations?: string[] | null
}

/**
 * Sentence tokenizer using rule-based Sentence Boundary Detection
 * Works approximately 95% of the time
 *
 * Features:
 * - Splits text based on period, question marks, and exclamation marks
 * - Skips most abbreviations (Mr., Mrs., PhD., etc.)
 * - Handles numbers and currency
 * - Skips URLs, websites, email addresses, and phone numbers
 * - Handles ellipsis and combined punctuation (?!)
 */
declare const tokenizer: {
  /**
   * Split text into sentences
   *
   * @param text - The text to split into sentences
   * @param options - Optional configuration for sentence detection
   * @returns Array of detected sentences
   *
   * @example
   * ```javascript
   * const tokenizer = require('sbd');
   *
   * const text = "On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S. Millions attended the Inauguration.";
   * const sentences = tokenizer.sentences(text);
   *
   * // [
   * //   'On Jan. 20, former Sen. Barack Obama became the 44th President of the U.S.',
   * //   'Millions attended the Inauguration.',
   * // ]
   * ```
   *
   * @example
   * ```javascript
   * const options = {
   *   newline_boundaries: true,
   *   preserve_whitespace: true
   * };
   * const sentences = tokenizer.sentences(text, options);
   * ```
   */
  sentences(
    text: string | null | undefined,
    options?: SbdOptions | boolean,
  ): string[]
}

export default tokenizer
