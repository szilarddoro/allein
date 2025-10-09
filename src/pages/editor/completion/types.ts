import { ActivityTracker } from './ActivityTracker'
import { ContextExtractor } from './ContextExtractor'
import { QualityFilter } from './QualityFilter'

export interface CompletionServices {
  activityTracker: ActivityTracker
  contextExtractor: ContextExtractor
  qualityFilter: QualityFilter
}
