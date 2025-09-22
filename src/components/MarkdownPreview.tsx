import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Card } from '@/components/ui/card'
import { openUrl } from '@tauri-apps/plugin-opener'

interface MarkdownPreviewProps {
  content: string
  placeholder?: string
}

const MarkdownPreview: React.FC<MarkdownPreviewProps> = ({
  content,
  placeholder,
}) => {
  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 overflow-auto p-4">
        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-strong:text-gray-900 prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-l-gray-300 prose-blockquote:text-gray-600 [&_ul_ul]:ml-4 [&_ol_ol]:ml-4 [&_ul_ol]:ml-4 [&_ol_ul]:ml-4 [&_li_ul]:ml-4 [&_li_ol]:ml-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={{
              h1: ({ children }) => (
                <h1 className="scroll-m-20 text-4xl/tight font-bold mb-4">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="scroll-m-20 border-b border-gray-200 pb-2 text-3xl/tight font-semibold mb-2">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {children}
                </h3>
              ),
              h4: ({ children }) => (
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                  {children}
                </h4>
              ),
              p: ({ children }) => (
                <p className="leading-relaxed mb-4">{children}</p>
              ),
              code: ({ children }) => (
                <code className="bg-gray-100 text-gray-700 text-sm/tight px-1 py-0.5 rounded">
                  {children}
                </code>
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
              li: ({ children }) => <li className="my-1">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-gray-300 pl-4 mb-4">
                  {children}
                </blockquote>
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
