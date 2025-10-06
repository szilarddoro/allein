import { format } from 'prettier/standalone'
import markdownParser from 'prettier/plugins/markdown'

export function formatMarkdown(input: string) {
  return format(input, {
    parser: 'markdown',
    plugins: [markdownParser],
  })
}
