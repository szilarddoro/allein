import { ActivityIndicator } from '@/components/ActivityIndicator'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { P } from '@/components/ui/typography'
import { formatMarkdown } from '@/lib/editor/formatMarkdown'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useReadFile } from '@/lib/files/useReadFile'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { CircleAlert, Eye, EyeOff, RefreshCw, WandSparkles } from 'lucide-react'
import * as monaco from 'monaco-editor'
import React, { useEffect, useRef, useState } from 'react'
import { useOutletContext, useSearchParams } from 'react-router'
import { useOnClickOutside } from 'usehooks-ts'
import { EditorHeader } from './EditorHeader'
import { ImprovementDialog } from './ImprovementDialog'
import MarkdownPreview from './MarkdownPreview'
import { TextEditor } from './TextEditor'
import { useAutoSave } from './useAutoSave'
import { useEditorKeyBindings } from './useEditorKeyBindings'

export function EditorPage() {
  const { sidebarOpen } = useOutletContext<AppLayoutContextProps>()
  const { toast } = useToast()
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  )
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const shouldFocusEditorRef = useRef(false)
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [showImprovementDialog, setShowImprovementDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [inlineCompletionLoading, setInlineCompletionLoading] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()

  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const {
    data: currentFile,
    status: currentFileStatus,
    refetch: refetchCurrentFile,
  } = useReadFile(currentFilePath)

  const { saveContent } = useAutoSave()
  const { handleEditorReady } = useEditorKeyBindings({
    onTogglePreview: () => setShowPreview((prev) => !prev),
    onOpenCommandPopover: () => {
      const editor = monacoEditorRef.current
      if (!editor) return

      const model = editor.getModel()

      if (!model) return

      const selection = editor.getSelection()

      // Check if selection is empty (cursor position only, not actual text selected)
      const isSelectionEmpty = selection?.isEmpty() ?? true
      const text =
        !isSelectionEmpty && selection
          ? model?.getValueInRange(selection) || ''
          : model?.getValue() || ''

      if (!text.trim()) {
        toast.warning('Text not available for improvement')
        return
      }

      setSelectedText(text)
      setShowImprovementDialog(true)
    },
  })

  // Sync content when current file changes
  useEffect(() => {
    if (currentFile) {
      setMarkdownContent(currentFile.content)
    } else {
      setMarkdownContent('')
    }
  }, [currentFile])

  // Store focus intention when focus=true parameter is present
  useEffect(() => {
    if (searchParams.get('focus') === 'true') {
      shouldFocusEditorRef.current = true
      // Remove the focus parameter immediately
      searchParams.delete('focus')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const handleEditorChange = (content: string) => {
    setMarkdownContent(content)
    saveContent(currentFile || null, content)
  }

  const handleReplaceText = (improvedText: string) => {
    const editor = monacoEditorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model) return

    const selection = editor.getSelection()

    // If no selection or selection is empty (cursor only), replace the entire document
    const isSelectionEmpty = selection?.isEmpty() ?? true
    const range =
      !isSelectionEmpty && selection ? selection : model.getFullModelRange()

    editor.executeEdits('improve-writing', [
      {
        range,
        text: improvedText,
      },
    ])

    // Update state and trigger auto-save
    const newContent = editor.getValue()
    setMarkdownContent(newContent)
    saveContent(currentFile || null, newContent)
  }

  const handleEditorReadyWithRef = (
    editor: monaco.editor.IStandaloneCodeEditor,
  ) => {
    monacoEditorRef.current = editor
    handleEditorReady(editor)

    // Focus editor if focus was requested
    if (shouldFocusEditorRef.current) {
      requestAnimationFrame(() => {
        editor.focus()
      })
      shouldFocusEditorRef.current = false
    }
  }

  const handleFormatDocument = async () => {
    const editor = monacoEditorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model) return

    const position = editor.getPosition()
    const content = model.getValue()

    try {
      const formatted = await formatMarkdown(content)
      const fullRange = model.getFullModelRange()
      editor.executeEdits('format-markdown', [
        {
          range: fullRange,
          text: formatted,
        },
      ])
      if (position) {
        editor.setPosition(position)
        editor.revealPositionInCenter(position)
      }
      requestAnimationFrame(() => {
        editor.focus()
      })
    } catch {
      toast.error('Failed to format document')
    }
  }

  const handleKeyDown = (event: monaco.IKeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.keyCode === monaco.KeyCode.KeyS
    ) {
      event.preventDefault()
      toast.success('The file is being saved automatically.')
    }

    if (event.ctrlKey && event.keyCode === monaco.KeyCode.Escape) {
      previewButtonRef.current?.focus()
    }
  }

  useOnClickOutside(editorRef as React.RefObject<HTMLElement>, () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  })

  // Show loading state when file is being loaded
  if (currentFileStatus === 'pending') {
    return (
      <div className="h-full flex items-center justify-center">
        <ActivityIndicator>Loading file...</ActivityIndicator>
      </div>
    )
  }

  if (currentFileStatus === 'error') {
    return (
      <div className="h-full flex flex-col gap-2 items-center justify-center">
        <P className="flex flex-row gap-1 items-center text-destructive text-sm">
          <CircleAlert className="size-4" />
          Failed to load file. It might have been moved or deleted.
        </P>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchCurrentFile()}
        >
          <RefreshCw className="size-4" />
          Reload file
        </Button>
      </div>
    )
  }

  // Show empty state when no file is selected
  if (!currentFilePath) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-zinc-600 mb-2">
            No file selected
          </h2>
          <p className="text-zinc-500 mb-4">
            Create a new file or select an existing one from the sidebar
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-1 overflow-hidden">
      <EditorHeader
        currentFile={currentFile || null}
        sidebarOpen={sidebarOpen}
        onFileRenamed={updateCurrentFilePath}
        inlineCompletionLoading={inlineCompletionLoading}
      />

      <div className="w-full flex flex-1 min-h-0 relative">
        <div
          ref={editorRef}
          className={cn(
            'flex flex-col flex-1 min-w-0 pl-2 pr-4 pb-4',
            showPreview && 'w-1/2 pr-2',
            !sidebarOpen && 'pl-4',
          )}
        >
          <TextEditor
            value={markdownContent}
            onChange={handleEditorChange}
            onKeyDown={handleKeyDown}
            onEditorReady={handleEditorReadyWithRef}
            placeholder="Start writing..."
            documentTitle={currentFile?.name || 'Untitled'}
            onInlineCompletionLoadingChange={setInlineCompletionLoading}
          />
        </div>

        {showPreview && (
          <div className="w-1/2 flex flex-col min-w-0 pl-2 pr-4 pb-4 min-h-0">
            <MarkdownPreview content={markdownContent} />
          </div>
        )}

        <div className="absolute bottom-8 right-8 group">
          <div
            className={cn(
              'flex flex-row gap-1',
              'bg-secondary border-1 border-input/60 dark:border-0 rounded-lg p-1 motion-safe:transition-opacity opacity-0',
              'group-hover:opacity-100 group-focus:opacity-100 focus-within:opacity-100',
            )}
          >
            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleFormatDocument}
                >
                  <WandSparkles className="size-4" />
                </Button>
              </TooltipTrigger>

              <TooltipContent align="center" side="top" sideOffset={10}>
                Format document
              </TooltipContent>
            </Tooltip>

            <Tooltip delayDuration={500}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPreview((show) => !show)}
                  ref={previewButtonRef}
                >
                  {showPreview ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </TooltipTrigger>

              <TooltipContent align="center" side="top" sideOffset={10}>
                <span className="sr-only">
                  {showPreview
                    ? 'Preview visible. Click to hide.'
                    : 'Preview hidden. Click to show.'}
                </span>
                <span aria-hidden="true">
                  {showPreview ? 'Hide preview' : 'Show preview'}
                </span>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      <ImprovementDialog
        open={showImprovementDialog}
        onOpenChange={setShowImprovementDialog}
        originalText={selectedText}
        onReplace={handleReplaceText}
        onClose={() => {
          requestAnimationFrame(() => {
            monacoEditorRef.current?.focus()
          })
        }}
      />
    </div>
  )
}
