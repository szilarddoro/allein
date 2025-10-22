export function buildCompletionPrompt(
  currentSentence: string,
  previousSentence?: string,
) {
  const combinedSentences = [previousSentence?.trim(), currentSentence.trim()]
    .filter(Boolean)
    .join(' ')
  const sentenceTerminatorCharacters = ['.', '?', '!']

  if (
    sentenceTerminatorCharacters.some((char) =>
      combinedSentences.endsWith(char),
    )
  ) {
    return {
      prompt: `Start a new sentence with 3-8 words after this sentence: "${combinedSentences} ____". Only respond with the continuation text.`,
      modelOptions: {
        stop: ['.', '\n\n', '##', '```'],
        num_predict: 30,
      },
      startedNewSentence: true,
    }
  }

  return {
    prompt: `Fill in the blank with 1-4 words: "${combinedSentences} ____". Only respond with the continuation text.`,
    modelOptions: {
      stop: ['\n\n', '##', '```'],
      num_predict: 8,
    },
    startedNewSentence: false,
  }
}
