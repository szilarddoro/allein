import removeMd from 'remove-markdown'

export interface CompletionPromptInput {
  currentSentenceSegments: string[]
  previousSentence?: string
}

const BLANK_PRE_CLEANUP_MARKER = '$$BLANK$$'
const BLANK_POST_CLEANUP_MARKER = '____'

const sentenceMarkerRegExp = /[.!?]\s*$/

function joinSentences(previousSentenceRaw?: string, currentSentence?: string) {
  let previousSentence = previousSentenceRaw?.trim() || ''

  const isPreviousSentenceFinished = sentenceMarkerRegExp.test(previousSentence)

  if (previousSentence !== '' && !isPreviousSentenceFinished) {
    previousSentence = `${previousSentence}.`
  }

  const rv = [previousSentence, currentSentence]
    .filter(Boolean)
    .map((text) => removeMd(text!))
    .join(' ')
    .replace(BLANK_PRE_CLEANUP_MARKER, BLANK_POST_CLEANUP_MARKER)

  return rv
}

export function buildCompletionPrompt(input: CompletionPromptInput) {
  const { currentSentenceSegments, previousSentence } = input
  const [firstSegment, secondSegment] = currentSentenceSegments

  if (!previousSentence && !firstSegment && !secondSegment) {
    return {
      prompt: '',
      modelOptions: {},
      startedNewSentence: false,
      preventCompletion: true,
    }
  }

  // Scenario: Create new sentence (empty segments with previous sentence)
  if (!firstSegment && !secondSegment) {
    return {
      prompt: `Start a new sentence with a couple of words after this sentence: "${removeMd(previousSentence!)} ${BLANK_POST_CLEANUP_MARKER}"`,
      modelOptions: {
        stop: ['.', '\n'],
        num_predict: 8,
        temperature: 1,
      },
      startedNewSentence: true,
    }
  }

  // Scenario: Complete in middle of the sentence (cursor between text)
  if (
    firstSegment &&
    secondSegment &&
    firstSegment.length > 0 &&
    secondSegment.length > 0
  ) {
    const fullSentenceWithBlank = `${firstSegment.trim()} ${BLANK_PRE_CLEANUP_MARKER} ${secondSegment.trim()}`
    const combinedSentences = joinSentences(
      previousSentence,
      fullSentenceWithBlank,
    )

    return {
      prompt: `Fill in the blank in this text with 1-2 words: "${combinedSentences}". Output only the completion, nothing else.`,
      modelOptions: {
        stop: ['\n'],
        num_predict: 10,
        temperature: 0.3,
      },
      startedNewSentence: false,
    }
  }

  // Scenario: Complete existing sentence
  const currentSentence = currentSentenceSegments.join('')
  const combinedSentences = joinSentences(previousSentence, currentSentence)

  return {
    prompt: `Fill in the blank in this text with 1-4 words: "${combinedSentences} ${BLANK_POST_CLEANUP_MARKER}". Output only the completion, nothing else.`,
    modelOptions: {
      stop: ['\n'],
      num_predict: 15,
      temperature: 0.3,
    },
    startedNewSentence: false,
  }
}
