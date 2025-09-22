import { useState } from 'react'
import { useOutletContext } from 'react-router'
import Editor from '@/components/Editor'
import MarkdownPreview from '@/components/MarkdownPreview'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import * as monaco from 'monaco-editor'

interface OutletContext {
  showPreview: boolean
}

export function EditorPage() {
  const { showPreview } = useOutletContext<OutletContext>()
  const [markdownContent, setMarkdownContent] =
    useState(`# Welcome to allein.app

This is a **markdown editor** with live preview.

## Features
- Write in markdown
- See live preview
- Clean, simple interface

## Getting Started
Check out the [Markdown Guide](https://www.markdownguide.org/basic-syntax/) to learn more about markdown syntax.

Try editing this text!`)

  useHotkeys(
    ['ctrl+i', 'meta+i'],
    () => {
      // TODO: Toggle preview from parent context
      // This will be handled by the AppLayout component
    },
    {
      preventDefault: true,
    },
  )

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
  }

  return (
    <div className="h-full flex overflow-hidden">
      <div className={cn('w-full pl-4 pr-2 pb-4', showPreview && 'w-1/2')}>
        <Editor
          initialValue={markdownContent}
          onChange={handleEditorChange}
          onKeyDown={handleKeyDown}
          placeholder="Start writing your markdown..."
        />
      </div>

      {showPreview && (
        <div className="w-1/2 pl-2 pr-4 pb-4">
          <MarkdownPreview content={markdownContent} />
        </div>
      )}
    </div>
  )
}
