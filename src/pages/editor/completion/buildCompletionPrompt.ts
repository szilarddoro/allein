export interface CompletionPromptInput {
  currentSentence: string
  previousSentence?: string
  sentenceBeforeCursor?: string
  sentenceAfterCursor?: string
}

export function buildCompletionPrompt(input: CompletionPromptInput) {
  const {
    currentSentence,
    previousSentence,
    sentenceBeforeCursor,
    sentenceAfterCursor,
  } = input

  const sentenceTerminatorCharacters = ['.', '?', '!']

  // Mid-sentence case 1: blank positioned between before and after cursor parts on same line
  if (
    sentenceBeforeCursor &&
    sentenceAfterCursor &&
    sentenceAfterCursor.trim()
  ) {
    const fullSentenceWithBlank = `${sentenceBeforeCursor} ____ ${sentenceAfterCursor}`
    return {
      prompt: `Fill in the blank in this text with 1-2 words: "${fullSentenceWithBlank}". Output only the completion, nothing else.`,
      modelOptions: {
        stop: ['\n'],
        num_predict: 10,
        temperature: 0.3,
      },
      startedNewSentence: false,
    }
  }

  const combinedSentences = [previousSentence?.trim(), currentSentence.trim()]
    .filter(Boolean)
    .join(' ')

  const isCompleteSentence = sentenceTerminatorCharacters.some((char) =>
    combinedSentences.endsWith(char),
  )

  // Mid-sentence case 2: currentSentence doesn't end with terminator = user is still typing the sentence
  // This is an implicit mid-sentence context where we want to continue, not start new
  if (!isCompleteSentence && currentSentence.trim()) {
    return {
      prompt: `Fill in the blank in the text with 1-2 words: "${combinedSentences} ____". Output only the completion, nothing else.`,
      modelOptions: {
        stop: ['\n'],
        num_predict: 15,
        temperature: 0.3,
      },
      startedNewSentence: false,
    }
  }

  if (isCompleteSentence) {
    return {
      prompt: `Start a new sentence with a couple of words after this sentence: "${combinedSentences} ____"`,
      modelOptions: {
        stop: ['.', '\n'],
        num_predict: 8,
        temperature: 1,
      },
      startedNewSentence: true,
    }
  }

  return {
    prompt: `Fill in the blank in the text with 1-4 words: "${combinedSentences} ____". Output only the completion, nothing else.`,
    modelOptions: {
      stop: ['\n'],
      num_predict: 15,
      temperature: 0.3,
    },
    startedNewSentence: false,
  }
}
