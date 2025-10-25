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
