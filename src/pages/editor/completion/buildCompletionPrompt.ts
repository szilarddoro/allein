export function buildCompletionPrompt(currentSentence: string) {
  const sentenceTerminatorCharacters = ['.', '?', '!']

  if (
    sentenceTerminatorCharacters.some((char) =>
      currentSentence.trim().endsWith(char),
    )
  ) {
    return {
      prompt: `Start a new sentence after this sentence: "${currentSentence.trim()}". Only respond with the completion text without formatting. Aim for 3-8 words.`,
      stop: ['.', '\n\n', '##', '```'],
      isNewSentence: true,
    }
  }

  return {
    prompt: `Continue this sentence naturally: "${currentSentence.trim()} ". Only respond with the completion text without formatting. Aim for 1-4 words.`,
    stop: ['\n\n', '##', '```'],
    isNewSentence: false,
  }
}
