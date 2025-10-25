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
      prompt: `Fill in the blank in this sentence with 1-3 words: "${fullSentenceWithBlank}". Respond ONLY with the answer.`,
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
      prompt: `Continue this sentence with 1-4 words: "${combinedSentences} ____". Respond only with the answer.`,
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
      prompt: `Start a new sentence with a couple of words after this sentence: "${combinedSentences}" ____`,
      modelOptions: {
        stop: ['.', '\n'],
        num_predict: 8,
        temperature: 1,
      },
      startedNewSentence: true,
    }
  }

  return {
    prompt: `Fill in the blank with 1-4 words: "${combinedSentences} ____". Respond only with the answer.`,
    modelOptions: {
      stop: ['\n'],
      num_predict: 15,
      temperature: 0.3,
    },
    startedNewSentence: false,
  }
}
