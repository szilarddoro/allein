import { Button } from '@/components/ui/button'
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
import { X } from 'lucide-react'
import { useTheme } from 'next-themes'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import { useMarkdownPreviewContextMenu } from './useMarkdownPreviewContextMenu'

interface MarkdownPreviewProps {
  content: string
  placeholder?: string
  className?: string
  cardClassName?: string
  previewClassName?: string
  renderType?: 'embedded' | 'standalone'
  'aria-hidden'?: 'true' | 'false'
  onClose?: () => void
}

export const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  placeholder,
  className,
  cardClassName,
  previewClassName,
  renderType = 'standalone',
  onClose,
  ...props
}) => {
  const { theme, systemTheme } = useTheme()
  const currentTheme = theme === 'system' ? systemTheme : theme
  const isDark = currentTheme === 'dark'
  const { showContextMenu } = useMarkdownPreviewContextMenu()

  return (
    <div {...props} className={cn('flex flex-col h-full', className)}>
      <Card
        className={cn(
          'relative flex-1 overflow-auto pt-0 pb-24',
          renderType === 'embedded' && 'border-0 p-0',
          cardClassName,
        )}
      >
        {renderType !== 'embedded' && onClose && (
          <div className="sticky top-0 w-full flex justify-end pt-2 pr-2 transform-gpu">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Close Preview"
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
        )}

        <div
          onContextMenu={showContextMenu}
          className={cn(
            '-mt-12 px-4 prose prose-sm max-w-none prose-headings:text-neutral-900 prose-p:text-neutral-700 prose-strong:text-neutral-900 prose-blockquote:border-l-4 prose-blockquote:border-neutral-300 prose-blockquote:text-neutral-600 [&_ul_ul]:ml-4 [&_ol_ol]:ml-4 [&_ul_ol]:ml-4 [&_ol_ul]:ml-4 [&_li_ul]:ml-4 [&_li_ol]:ml-4 select-auto cursor-auto',
            renderType === 'embedded' && 'mt-0 px-0 overflow-hidden w-full',
            previewClassName,
          )}
        >
          {!content && placeholder ? (
            <span className="text-sm text-muted-foreground">{placeholder}</span>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              disallowedElements={['pre']}
              unwrapDisallowed
              components={{
                h1: ({ children }) => (
                  <H1
                    className={cn(
                      renderType === 'embedded' &&
                        'break-words text-xl [&_code]:text-xl my-2',
                    )}
                  >
                    {children}
                  </H1>
                ),
                h2: ({ children }) => (
                  <H2
                    className={cn(
                      renderType === 'embedded'
                        ? 'break-words text-lg [&_code]:text-lg my-2'
                        : 'my-4',
                    )}
                  >
                    {children}
                  </H2>
                ),
                h3: ({ children }) => (
                  <H3
                    className={cn(
                      renderType === 'embedded'
                        ? 'break-words text-base [&_code]:text-base'
                        : 'my-3',
                    )}
                  >
                    {children}
                  </H3>
                ),
                h4: ({ children }) => (
                  <H4
                    className={cn(
                      renderType === 'embedded'
                        ? 'break-words text-sm [&_code]:text-sm'
                        : 'my-1',
                    )}
                  >
                    {children}
                  </H4>
                ),
                p: ({ children }) => (
                  <P
                    className={cn(
                      renderType === 'embedded' && 'text-sm',
                      'first-of-type:mt-0',
                    )}
                  >
                    {children}
                  </P>
                ),
                del: ({ children }) => (
                  <del className="text-foreground/50">{children}</del>
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
                        'text-sm !my-4 rounded-lg !bg-neutral-50 dark:!bg-neutral-800/30 border border-neutral-200 dark:border-neutral-800 !font-mono [&_code]:!bg-transparent',
                        renderType === 'embedded' &&
                          '[&_code]:!text-sm [&_code]:!whitespace-pre-wrap',
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
                    <span className="text-blue-500 break-words">
                      {children}
                    </span>
                  ) : (
                    <a
                      draggable={false}
                      href={href}
                      onClick={(event) => {
                        event.preventDefault()
                        if (!href) return
                        openUrl(href)
                      }}
                      className="break-words text-blue-500 hover:text-blue-600 hover:underline"
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
                td: ({ children }) => (
                  <TableCell
                    className={cn(renderType === 'embedded' && 'text-sm')}
                  >
                    {children}
                  </TableCell>
                ),
              }}
            >
              {content || placeholder}
            </ReactMarkdown>
          )}
        </div>
      </Card>
    </div>
  )
}
