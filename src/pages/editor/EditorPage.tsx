import React, { useRef, useState } from 'react'
import { useOutletContext } from 'react-router'
import { TextEditor } from './TextEditor'
import MarkdownPreview from './MarkdownPreview'
import { cn } from '@/lib/utils'
import { useHotkeys } from 'react-hotkeys-hook'
import * as monaco from 'monaco-editor'
import { useOnClickOutside } from 'usehooks-ts'

interface OutletContext {
  showPreview: boolean
  setShowPreview: (showPreview: boolean) => void
  previewButtonRef: React.RefObject<HTMLButtonElement>
}

export function EditorPage() {
  const editorRef = useRef<HTMLDivElement>(null)
  const { showPreview, setShowPreview, previewButtonRef } =
    useOutletContext<OutletContext>()
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
      setShowPreview(!showPreview)
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

    if (event.keyCode === monaco.KeyCode.Escape) {
      previewButtonRef.current?.focus()
    }
  }

  useOnClickOutside(editorRef as React.RefObject<HTMLElement>, () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  return (
    <div className="h-full flex overflow-hidden">
      <div
        ref={editorRef}
        className={cn('w-full pl-4 pr-4 pb-4', showPreview && 'w-1/2 pr-2')}
      >
        <TextEditor
          value={markdownContent}
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
