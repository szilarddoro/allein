import { useRef, useState } from 'react'
import Editor from '@/components/Editor'
import MarkdownPreview from '@/components/MarkdownPreview'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import * as monaco from 'monaco-editor'
import { Eye, EyeOff } from 'lucide-react'
import { IS_TAURI } from '@/lib/constants'

export function App() {
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [markdownContent, setMarkdownContent] =
    useState(`# Welcome to allein.app

This is a **markdown editor** with live preview.

## Features
- Write in markdown
- See live preview
- Clean, simple interface

Try editing this text!`)

  useHotkeys(['ctrl+i', 'meta+i'], () => setShowPreview(!showPreview), {
    preventDefault: true,
  })

  const handleEditorChange = (content: string) => {
    setMarkdownContent(content)
  }

  const handleKeyDown = (event: monaco.IKeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.keyCode === monaco.KeyCode.KeyS
    ) {
      event.preventDefault()
    }

    if (event.keyCode === monaco.KeyCode.Escape) {
      previewButtonRef.current?.focus()
    }
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="relative px-4 py-3 flex justify-end border-b border-gray-200">
        {IS_TAURI() && (
          <div
            className="absolute left-0 top-0 size-full z-10"
            data-tauri-drag-region
          />
        )}

        <Button
          variant="outline"
          size="icon"
          onClick={() => {
            setShowPreview(!showPreview)
            previewButtonRef.current?.focus()
          }}
          aria-label={showPreview ? 'Hide preview' : 'Show preview'}
          className="relative z-20"
          ref={previewButtonRef}
        >
          {showPreview ? (
            <EyeOff className="w-4 h-4" />
          ) : (
            <Eye className="w-4 h-4" />
          )}
        </Button>
      </header>
      <div className="flex-1 flex overflow-hidden">
        <div
          className={cn(
            'w-full border-r border-gray-200',
            showPreview && 'w-1/2',
          )}
        >
          <Editor
            initialValue={markdownContent}
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your markdown..."
          />
        </div>
        {showPreview && (
          <div className="w-1/2">
            <MarkdownPreview content={markdownContent} />
          </div>
        )}
      </div>
    </div>
  )
}
