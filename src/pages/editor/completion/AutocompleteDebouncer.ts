import { v4 as uuidv4 } from 'uuid'

/**
 * Debouncer for autocomplete requests
 * Inspired by continuedev/continue
 * https://github.com/continuedev/continue
 * Licensed under Apache License 2.0
 *
 * Ensures only the most recent request is processed after a delay period.
 */
export class AutocompleteDebouncer {
  private debounceTimeout: ReturnType<typeof setTimeout> | undefined = undefined
  private currentRequestId: string | undefined = undefined

  /**
   * Waits for the debounce delay and determines if this request should be debounced.
   * @param debounceDelay Delay in milliseconds before processing the request
   * @returns Promise that resolves to true if request should be debounced (cancelled), false otherwise
   */
  async delayAndShouldDebounce(debounceDelay: number): Promise<boolean> {
    // Generate a unique ID for this request
    const requestId = uuidv4()
    this.currentRequestId = requestId

    // Clear any existing timeout
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
    }

    // Create a new promise that resolves after the debounce delay
    return new Promise<boolean>((resolve) => {
      this.debounceTimeout = setTimeout(() => {
        // When the timeout completes, check if this is still the most recent request
        const shouldDebounce = this.currentRequestId !== requestId

        // If this is the most recent request, it shouldn't be debounced
        if (!shouldDebounce) {
          this.currentRequestId = undefined
        }

        resolve(shouldDebounce)
      }, debounceDelay)
    })
  }

  /**
   * Cancels any pending debounce timeout
   */
  cancel() {
    if (this.debounceTimeout) {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = undefined
    }
    this.currentRequestId = undefined
  }
}
