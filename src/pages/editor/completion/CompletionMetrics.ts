/**
 * Tracks metrics for completion requests including latency and cache hit rates
 */

type RequestType = 'cached' | 'rejected' | 'resolved' | 'canceled'

interface RequestMetric {
  duration: number // milliseconds
  type: RequestType
  timestamp: number
}

/**
 * Singleton metrics tracker using circular buffer
 * Keeps the last 50 requests to calculate median and statistics
 */
class CompletionMetrics {
  private static instance: CompletionMetrics | null = null
  private metrics: RequestMetric[] = []
  private readonly maxSize = 50

  private constructor() {}

  static getInstance(): CompletionMetrics {
    if (!CompletionMetrics.instance) {
      CompletionMetrics.instance = new CompletionMetrics()
    }
    return CompletionMetrics.instance
  }

  /**
   * Record a completion request
   */
  recordRequest(durationMs: number, { type }: { type: RequestType }): void {
    this.metrics.push({
      duration: durationMs,
      type,
      timestamp: Date.now(),
    })

    // Keep only the last 50 requests (circular buffer)
    if (this.metrics.length > this.maxSize) {
      this.metrics.shift()
    }
  }

  /**
   * Get the median request duration in milliseconds
   *
   * @param {boolean} includeAll - Whether to include canceled and cached requests.
   */
  getMedianDuration(includeAll: boolean = false): number | null {
    if (this.metrics.length === 0) {
      return null
    }

    const sorted = [...this.metrics]
      .filter((m) =>
        includeAll ? true : m.type === 'resolved' || m.type === 'rejected',
      )
      .map((m) => m.duration)
      .sort((a, b) => a - b)

    const mid = Math.floor(sorted.length / 2)

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2
    }

    return sorted[mid]
  }

  /**
   * Get the average request duration in milliseconds
   *
   * @param {boolean} includeAll - Whether to include canceled and cached requests.
   */
  getAverageDuration(includeAll: boolean = false): number | null {
    if (this.metrics.length === 0) {
      return null
    }

    const sum = this.metrics.reduce((acc, m) => {
      if (!includeAll && (m.type === 'cached' || m.type === 'canceled')) {
        return acc
      }

      return acc + m.duration
    }, 0)
    return sum / this.metrics.length
  }

  /**
   * Get the total number of requests recorded
   */
  getRequestCount(): number {
    return this.metrics.length
  }

  /**
   * Get cache hit count
   */
  getCacheHitCount(): number {
    return this.metrics.filter((m) => m.type === 'cached').length
  }

  /**
   * Get cache hit rate as a percentage (0-100)
   */
  getCacheHitRate(): number | null {
    if (this.metrics.length === 0) {
      return null
    }

    const hitCount = this.getCacheHitCount()
    return (hitCount / this.metrics.length) * 100
  }

  /**
   * Get min request duration
   */
  getMinDuration(): number | null {
    if (this.metrics.length === 0) {
      return null
    }

    return Math.min(...this.metrics.map((m) => m.duration))
  }

  /**
   * Get max request duration
   */
  getMaxDuration(): number | null {
    if (this.metrics.length === 0) {
      return null
    }

    return Math.max(...this.metrics.map((m) => m.duration))
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
  }

  /**
   * Get all metrics (for debugging)
   */
  getAllMetrics(): RequestMetric[] {
    return [...this.metrics]
  }
}

/**
 * Get the singleton instance
 */
export function getCompletionMetrics(): CompletionMetrics {
  return CompletionMetrics.getInstance()
}

/**
 * Export the class for type checking
 */
export { CompletionMetrics }
