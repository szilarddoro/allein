import { DelayedActivityIndicator } from '@/components/DelayedActivityIndicator'
import { Button } from '@/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { P } from '@/components/ui/typography'
import {
  FORMAT_DOCUMENT_EVENT,
  IMPROVE_WRITING_EVENT,
  TOGGLE_PREVIEW_EVENT,
} from '@/lib/constants'
import { formatMarkdown } from '@/lib/editor/formatMarkdown'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useReadFile } from '@/lib/files/useReadFile'
import { useLocationHistory } from '@/lib/locationHistory/useLocationHistory'
import { AppLayoutContextProps } from '@/lib/types'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { FloatingActionToolbar } from '@/pages/editor/FloatingActionToolbar'
import { CircleAlert, RefreshCw } from 'lucide-react'
import * as monaco from 'monaco-editor'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  ImperativePanelGroupHandle,
  ImperativePanelHandle,
} from 'react-resizable-panels'
import { useLocation, useOutletContext } from 'react-router'
import { useOnClickOutside } from 'usehooks-ts'
import { EditorHeader } from './EditorHeader'
import { ImprovementDialog } from './ImprovementDialog'
import { MarkdownPreview } from './MarkdownPreview'
import { TextEditor } from './TextEditor'
import { useAutoSave } from './useAutoSave'
import { useHighlightLine } from './useHighlightLine'
import { useSetupEditorKeyBindings } from './useSetupEditorKeyBindings'
import { cleanSearchParams } from '@/lib/locationHistory/cleanSearchParams'

export function EditorPage() {
  const { sidebarOpen, setSearchOpen } =
    useOutletContext<AppLayoutContextProps>()
  const { toast } = useToast()
  const { removeEntriesForFile } = useLocationHistory()
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(
    null,
  )
  const previewButtonRef = useRef<HTMLButtonElement>(null)
  const [editorReady, setEditorReady] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [markdownContent, setMarkdownContent] = useState('')
  const [showImprovementDialog, setShowImprovementDialog] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [inlineCompletionLoading, setInlineCompletionLoading] = useState(false)
  const panelGroupRef = useRef<ImperativePanelGroupHandle | null>(null)
  const previewPanelRef = useRef<ImperativePanelHandle | null>(null)
  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const { saveContent } = useAutoSave()
  const { pathname, search } = useLocation()
  const cleanedSearchParams = cleanSearchParams(search)
  const currentLocation = `${pathname}?${cleanedSearchParams}`

  useEffect(() => {
    function handleTogglePreviewEvent() {
      setShowPreview((show) => !show)
    }

    window.addEventListener(TOGGLE_PREVIEW_EVENT, handleTogglePreviewEvent)
    return () =>
      window.removeEventListener(TOGGLE_PREVIEW_EVENT, handleTogglePreviewEvent)
  }, [])

  const handleOpenImproveWritingModal = useCallback(() => {
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
  }, [toast])

  useEffect(() => {
    function handleImproveWritingEvent() {
      handleOpenImproveWritingModal()
    }

    window.addEventListener(IMPROVE_WRITING_EVENT, handleImproveWritingEvent)
    return () =>
      window.removeEventListener(
        IMPROVE_WRITING_EVENT,
        handleImproveWritingEvent,
      )
  }, [handleOpenImproveWritingModal])

  const handleFormatDocument = useCallback(async () => {
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
  }, [toast])

  useEffect(() => {
    function handleFormatDocumentEvent() {
      handleFormatDocument()
    }

    window.addEventListener(FORMAT_DOCUMENT_EVENT, handleFormatDocumentEvent)
    return () =>
      window.removeEventListener(
        FORMAT_DOCUMENT_EVENT,
        handleFormatDocumentEvent,
      )
  }, [handleFormatDocument])

  const handleFileRenamed = (newPath: string, oldPath: string) => {
    // Clean up old file path from location history
    if (oldPath) {
      removeEntriesForFile(oldPath)
    }
    // Update to the new file path
    updateCurrentFilePath(newPath)
  }

  useEffect(() => {
    monacoEditorRef.current = null
    setEditorReady(false)
  }, [currentLocation])

  const {
    data: currentFile,
    status: currentFileStatus,
    refetch: refetchCurrentFile,
  } = useReadFile(currentFilePath)

  const handleTogglePreview = useCallback(
    () => setShowPreview((show) => !show),
    [],
  )

  // Events don't escape Monaco editor, so we need to handle these here too
  const { handleEditorReady } = useSetupEditorKeyBindings({
    onImproveWriting: handleOpenImproveWritingModal,
    onTogglePreview: handleTogglePreview,
    onFormatDocument: handleFormatDocument,
  })

  useHighlightLine({
    editorRef: monacoEditorRef,
    editorReady,
  })

  useEffect(() => {
    if (!showPreview) {
      previewPanelRef.current?.collapse()
    } else {
      previewPanelRef.current?.expand(50)
    }
  }, [showPreview])

  // Sync content when current file changes
  useEffect(() => {
    if (!editorReady) {
      return
    }

    if (currentFile) {
      monacoEditorRef.current?.setValue(currentFile.content)
      setMarkdownContent(currentFile.content)
    } else {
      monacoEditorRef.current?.setValue('')
      setMarkdownContent('')
    }
  }, [currentFile, editorReady])

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
    setEditorReady(true)
  }

  const handleKeyDown = (event: monaco.IKeyboardEvent) => {
    if (
      (event.ctrlKey || event.metaKey) &&
      event.keyCode === monaco.KeyCode.KeyS
    ) {
      event.preventDefault()
      toast.success('The file is being saved automatically.')
    }

    // Allow CMD/Ctrl+K to escape and trigger global search
    if (
      (event.ctrlKey || event.metaKey) &&
      event.keyCode === monaco.KeyCode.KeyK
    ) {
      event.preventDefault()
      setSearchOpen(true)
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
          <h2 className="text-2xl font-semibold text-neutral-600 mb-2">
            No file selected
          </h2>
          <p className="text-neutral-500 mb-4">
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
        onFileRenamed={handleFileRenamed}
        inlineCompletionLoading={inlineCompletionLoading}
        editorReady={editorReady}
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
                'flex flex-col h-full pb-2.5',
                !sidebarOpen && 'pl-0',
              )}
            >
              <TextEditor
                key={currentFilePath}
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
            className={cn('px-[5px]', !showPreview && 'hidden')}
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
            <div className="flex flex-col h-full pb-2.5 min-h-0">
              <MarkdownPreview
                content={markdownContent}
                cardClassName="bg-background dark:bg-zinc-900/80"
                placeholder="Nothing to show yet."
                onClose={() => setShowPreview(false)}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>

        <FloatingActionToolbar
          previewButtonRef={previewButtonRef}
          showPreview={showPreview}
          className="absolute bottom-5.5 right-3"
          onFormatDocument={handleFormatDocument}
          onImproveWriting={handleOpenImproveWritingModal}
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
