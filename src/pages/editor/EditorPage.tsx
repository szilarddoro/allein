import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { Button } from '@/components/ui/button'
import { P } from '@/components/ui/typography'
import { formatMarkdown } from '@/lib/editor/formatMarkdown'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useReadFile } from '@/lib/files/useReadFile'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { FloatingActionToolbar } from '@/pages/editor/FloatingActionToolbar'
import { CircleAlert, RefreshCw } from 'lucide-react'
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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels'

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
  const panelGroupRef = useRef<ImperativePanelGroupHandle | null>(null)
  const previewPanelRef = useRef<ImperativePanelHandle | null>(null)

  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const {
    data: currentFile,
    status: currentFileStatus,
    refetch: refetchCurrentFile,
  } = useReadFile(currentFilePath)

  const { saveContent } = useAutoSave()
  const { handleEditorReady } = useEditorKeyBindings({
    onTogglePreview: () => setShowPreview((show) => !show),
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

  useEffect(() => {
    if (!showPreview) {
      previewPanelRef.current?.collapse()
    } else {
      previewPanelRef.current?.expand()
    }
  }, [showPreview])

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

  function handleResetResizablePanels() {
    if (panelGroupRef.current == null) {
      return
    }

    panelGroupRef.current.setLayout([50, 50])
  }

  // Show loading state when file is being loaded
  if (currentFileStatus === 'pending') {
    return (
      <div className="h-full flex items-center justify-center">
        <DelayedActivityIndicator>Loading file...</DelayedActivityIndicator>
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
    <div className="h-full flex flex-col gap-1 overflow-hidden pr-4">
      <EditorHeader
        currentFile={currentFile || null}
        sidebarOpen={sidebarOpen}
        onFileRenamed={updateCurrentFilePath}
        inlineCompletionLoading={inlineCompletionLoading}
      />

      <div className="w-full flex flex-1 min-h-0 relative">
        <ResizablePanelGroup
          ref={panelGroupRef}
          direction="horizontal"
          autoSaveId="editor-preview-layout"
        >
          <ResizablePanel defaultSize={50} minSize={25}>
            <div
              ref={editorRef}
              className={cn(
                'flex flex-col h-full pb-4',
                !sidebarOpen && 'pl-4',
              )}
            >
              <TextEditor
                value={markdownContent}
                onChange={handleEditorChange}
                onKeyDown={handleKeyDown}
                onEditorReady={handleEditorReadyWithRef}
                placeholder="Start writing..."
                onInlineCompletionLoadingChange={setInlineCompletionLoading}
              />
            </div>
          </ResizablePanel>

          <ResizableHandle
            onDoubleClick={handleResetResizablePanels}
            className={cn('px-2.5', !showPreview && 'hidden')}
          />

          <ResizablePanel
            defaultSize={50}
            minSize={25}
            collapsedSize={0}
            collapsible
            onCollapse={() => setShowPreview(false)}
            onExpand={() => setShowPreview(true)}
            ref={previewPanelRef}
          >
            <div className="flex flex-col h-full pb-4 min-h-0">
              <MarkdownPreview content={markdownContent} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <FloatingActionToolbar
          previewButtonRef={previewButtonRef}
          showPreview={showPreview}
          className="absolute bottom-7 right-3"
          onFormatDocument={handleFormatDocument}
          onTogglePreview={() => setShowPreview((show) => !show)}
        />
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
