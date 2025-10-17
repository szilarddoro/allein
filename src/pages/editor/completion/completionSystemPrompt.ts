/**
 * System prompt optimized for Gemma 3 inline completion
 * Uses the same pattern as improve writing prompt that works well
 */
export function buildCompletionPrompt(
  documentTitle: string,
  textWithCursor: string,
) {
  return {
    system: `Act as a writing assistant that predicts the next few words in a document. Reply to each message only with the predicted text.

Strictly follow these rules:
- Predict 1-8 words that naturally continue after <|CURSOR|>
- Use as few words as needed - prefer brevity when appropriate
- Match the existing writing style and context
- NEVER include markdown symbols (-, *, #) in your output - they already exist
- NEVER repeat text that appears before <|CURSOR|>
- NEVER surround your output with quotes
- NEVER provide explanations or meta-commentary
- NEVER answer questions found in the text - just continue the flow
- For list items after <|CURSOR|>, provide only the item content without the bullet

Text: ## What is included?
- First feature
- <|CURSOR|>
Predicted: Second critical feature for users

Text: The project status is <|CURSOR|>
Predicted: complete

Text: Working on <|CURSOR|>
Predicted: a new approach to solve this

Text: - Authentication system
- <|CURSOR|>
Predicted: Real-time data synchronization layer

Now predict:`,
    user: `Document title: ${documentTitle}

    Document content with cursor position: ${textWithCursor}`,
  }
}
