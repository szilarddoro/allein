import {
  FOCUS_NAME_INPUT_SEARCH_PARAM,
  LINE_NUMBER_SEARCH_PARAM,
} from '@/lib/constants'

/**
 * Removes temporary search params from the input string or search param list.
 */
export function cleanSearchParams(search: string | URLSearchParams) {
  if (typeof search === 'string') {
    const searchParams = new URLSearchParams(search)

    searchParams.delete(LINE_NUMBER_SEARCH_PARAM)
    searchParams.delete(FOCUS_NAME_INPUT_SEARCH_PARAM)

    return `${searchParams.toString()}`
  }

  const updatedSearchParams = new URLSearchParams([...search])

  updatedSearchParams.delete(LINE_NUMBER_SEARCH_PARAM)
  updatedSearchParams.delete(FOCUS_NAME_INPUT_SEARCH_PARAM)

  return updatedSearchParams.toString()
}
