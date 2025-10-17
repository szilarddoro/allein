import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useTheme } from 'next-themes'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
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
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'

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
            'prose prose-sm max-w-none prose-headings:text-zinc-900 prose-p:text-zinc-700 prose-strong:text-zinc-900 prose-blockquote:border-l-4 prose-blockquote:border-zinc-300 prose-blockquote:text-zinc-600 [&_ul_ul]:ml-4 [&_ol_ol]:ml-4 [&_ul_ol]:ml-4 [&_ol_ul]:ml-4 [&_li_ul]:ml-4 [&_li_ol]:ml-4',
            renderType === 'embedded' && 'overflow-hidden w-full',
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
              code: ({ children, className }) => {
                // Check if this is a code block or inline code
                // Code blocks have className starting with "language-" or no className at all but are in <pre>
                // We can detect code blocks by checking if className exists or if content has newlines
                const isCodeBlock =
                  className?.startsWith('language-') ||
                  (!className && String(children).includes('\n'))

                // Inline code
                if (!isCodeBlock) {
                  return (
                    <InlineCode
                      className={cn(
                        renderType === 'embedded' && 'text-sm break-all',
                      )}
                    >
                      {children}
                    </InlineCode>
                  )
                }

                // Extract language from className (e.g., "language-javascript")
                const match = /language-(\w+)/.exec(className || '')
                const language = match ? match[1] : 'text'

                // Code block with syntax highlighting
                return (
                  <SyntaxHighlighter
                    style={isDark ? oneDark : oneLight}
                    language={language}
                    PreTag="div"
                    className={cn(
                      'rounded-lg my-24 !bg-zinc-50 dark:!bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 !font-mono [&_code]:!bg-transparent',
                      renderType === 'embedded' && 'text-sm',
                    )}
                    customStyle={{
                      margin: 0,
                      padding: '1rem',
                      background: 'transparent',
                    }}
                  >
                    {children ? String(children).replace(/\n$/, '') : ''}
                  </SyntaxHighlighter>
                )
              },
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
              a: ({ children, href }) =>
                renderType === 'embedded' ? (
                  <span className="text-blue-500">{children}</span>
                ) : (
                  <a
                    draggable={false}
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
              table: ({ children }) => (
                <div className="my-4 overflow-x-auto">
                  <Table>{children}</Table>
                </div>
              ),
              thead: ({ children }) => <TableHeader>{children}</TableHeader>,
              tbody: ({ children }) => <TableBody>{children}</TableBody>,
              tr: ({ children }) => <TableRow>{children}</TableRow>,
              th: ({ children }) => (
                <TableHead className="font-semibold">{children}</TableHead>
              ),
              td: ({ children }) => <TableCell>{children}</TableCell>,
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
