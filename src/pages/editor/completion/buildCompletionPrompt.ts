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
  let joinWithWhitespace = true

  const isPreviousSentenceFinished = sentenceMarkerRegExp.test(previousSentence)

  if (previousSentence !== '' && !isPreviousSentenceFinished) {
    previousSentence = `${previousSentence}\n`
    joinWithWhitespace = false
  }

  return [previousSentence, currentSentence]
    .filter(Boolean)
    .map((text) => removeMd(text!))
    .join(joinWithWhitespace ? ' ' : '')
    .replace(BLANK_PRE_CLEANUP_MARKER, BLANK_POST_CLEANUP_MARKER)
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
    const combinedSentences = joinSentences(
      previousSentence,
      BLANK_PRE_CLEANUP_MARKER,
    )

    return {
      prompt: `Start a new sentence with a couple of words after this sentence: "${combinedSentences}"`,
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
    if (!firstSegment.endsWith(' ') && !secondSegment.startsWith(' ')) {
      return {
        prompt: '',
        modelOptions: {},
        startedNewSentence: false,
        preventCompletion: true,
      }
    }

    const fullSentenceWithBlank = `${firstSegment.replace(/\s+/, ' ')}${BLANK_PRE_CLEANUP_MARKER}${secondSegment.replace(/\s+/, ' ')}`
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
  const combinedSentences = joinSentences(
    previousSentence,
    `${currentSentence.trim()} ${BLANK_PRE_CLEANUP_MARKER}`,
  )

  return {
    prompt: `Fill in the blank in this text with 1-4 words: "${combinedSentences}". Output only the completion, nothing else.`,
    modelOptions: {
      stop: ['\n'],
      num_predict: 15,
      temperature: 0.3,
    },
    startedNewSentence: false,
  }
}
