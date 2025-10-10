import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Blockquote,
  H1,
  H2,
  H3,
  H4,
  InlineCode,
  P,
} from '@/components/ui/typography'
import { cn } from '@/lib/utils'
import { openUrl } from '@tauri-apps/plugin-opener'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

interface MarkdownPreviewProps {
  content: string
  placeholder?: string
  className?: string
  renderType?: 'embedded' | 'standalone'
  'aria-hidden'?: 'true' | 'false'
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  placeholder,
  className,
  renderType = 'standalone',
  ...props
}) => {
  return (
    <div {...props} className={cn('flex flex-col h-full', className)}>
      <Card
        className={cn(
          'flex-1 overflow-auto p-4 pb-24',
          renderType === 'embedded' && 'border-0 p-0',
        )}
      >
        <div
          className={cn(
            'prose prose-sm max-w-none prose-headings:text-zinc-900 prose-p:text-zinc-700 prose-strong:text-zinc-900 prose-code:text-zinc-800 prose-code:bg-zinc-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-50 prose-pre:border prose-pre:border-zinc-200 prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 prose-blockquote:text-zinc-600 [&_ul_ul]:ml-4 [&_ol_ol]:ml-4 [&_ul_ol]:ml-4 [&_ol_ul]:ml-4 [&_li_ul]:ml-4 [&_li_ol]:ml-4',
            renderType === 'embedded' && 'overflow-hidden w-full',
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ children }) => (
                <H1
                  className={cn(
                    renderType === 'embedded' && 'break-all text-xl',
                  )}
                >
                  {children}
                </H1>
              ),
              h2: ({ children }) => (
                <H2
                  className={cn(
                    renderType === 'embedded' && 'break-all text-lg',
                  )}
                >
                  {children}
                </H2>
              ),
              h3: ({ children }) => (
                <H3
                  className={cn(
                    renderType === 'embedded' && 'break-all text-base',
                  )}
                >
                  {children}
                </H3>
              ),
              h4: ({ children }) => (
                <H4
                  className={cn(
                    renderType === 'embedded' && 'break-all text-sm',
                  )}
                >
                  {children}
                </H4>
              ),
              p: ({ children }) => (
                <P className={cn(renderType === 'embedded' && 'text-sm')}>
                  {children}
                </P>
              ),
              hr: () => <Separator className="my-4" />,
              code: ({ children }) => (
                <InlineCode
                  className={cn(
                    renderType === 'embedded' && 'text-sm break-all',
                  )}
                >
                  {children}
                </InlineCode>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-outside my-2 ml-4 space-y-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-outside my-2 ml-4 space-y-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li
                  className={cn(
                    'my-1 ml-4',
                    renderType === 'embedded' && 'text-sm',
                  )}
                >
                  {children}
                </li>
              ),
              blockquote: ({ children }) => (
                <Blockquote
                  className={cn(renderType === 'embedded' && 'text-sm')}
                >
                  {children}
                </Blockquote>
              ),
              a: ({ children, href }) => (
                <a
                  href={href}
                  onClick={(event) => {
                    event.preventDefault()
                    if (!href) return
                    openUrl(href)
                  }}
                  className="text-blue-500 hover:text-blue-600 hover:underline"
                >
                  {children}
                </a>
              ),
            }}
          >
            {content || placeholder}
          </ReactMarkdown>
        </div>
      </Card>
    </div>
  )
}

export default MarkdownPreview
