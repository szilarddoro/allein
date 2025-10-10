import { Button } from '@/components/ui/button'
import { P } from '@/components/ui/typography'
import { useCurrentFilePath } from '@/lib/files/useCurrentFilePath'
import { useReadFile } from '@/lib/files/useReadFile'
import { useToast } from '@/lib/useToast'
import { cn } from '@/lib/utils'
import { CircleAlert, RefreshCw } from 'lucide-react'
import * as monaco from 'monaco-editor'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useOnClickOutside } from 'usehooks-ts'
import MarkdownPreview from './MarkdownPreview'
import { TextEditor } from './TextEditor'
import { AppLayoutContextProps } from '@/lib/types'
import { useOutletContext, useSearchParams } from 'react-router'
import { useAutoSave } from './useAutoSave'
import { useEditorKeyBindings } from './useEditorKeyBindings'
import { EditorHeader } from './EditorHeader'
import { ImprovementDialog } from './ImprovementDialog'
import { formatMarkdown } from '@/lib/editor/formatMarkdown'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { ActivityTracker } from './completion/ActivityTracker'
import { ContextExtractor } from './completion/ContextExtractor'
import { QualityFilter } from './completion/QualityFilter'
import { CompletionServices } from './completion/types'
import { DebugPanel } from './completion/DebugPanel'

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
  const [searchParams, setSearchParams] = useSearchParams()

  const [currentFilePath, updateCurrentFilePath] = useCurrentFilePath()
  const {
    data: currentFile,
    status: currentFileStatus,
    refetch: refetchCurrentFile,
  } = useReadFile(currentFilePath)

  // Initialize completion services
  const completionServices = useMemo<CompletionServices>(() => {
    const activityTracker = new ActivityTracker(10)
    return {
      activityTracker,
      contextExtractor: new ContextExtractor(activityTracker),
      qualityFilter: new QualityFilter(),
    }
  }, [])

  const { saveContent } = useAutoSave()
  const { handleEditorReady } = useEditorKeyBindings({
    onTogglePreview: () => setShowPreview((prev) => !prev),
    onOpenCommandPopover: () => {
      const editor = monacoEditorRef.current
      if (!editor) return

      const selection = editor.getSelection()
      const text = selection
        ? editor.getModel()?.getValueInRange(selection) || ''
        : ''

      if (!text.trim()) {
        toast.warning('Please select some text to improve')
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
      // Track document switch and load persisted context
      completionServices.activityTracker
        .trackDocumentSwitch(currentFile.name || 'Untitled')
        .catch(() => {
          // Silent fail - continue with empty context
        })
    } else {
      setMarkdownContent('')
    }
  }, [currentFile, completionServices.activityTracker])

  // Store focus intention when focus=true parameter is present
  useEffect(() => {
    if (searchParams.get('focus') === 'true') {
      shouldFocusEditorRef.current = true
      // Remove the focus parameter immediately
      searchParams.delete('focus')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  // Cleanup old context on mount
  useEffect(() => {
    // Clean up context older than 7 days
    completionServices.activityTracker.cleanupOldContext(7).catch(() => {
      // Silent fail
    })

    // Limit total stored sections to 200
    completionServices.activityTracker.limitStoredContext(200).catch(() => {
      // Silent fail
    })
  }, [completionServices.activityTracker])

  const handleEditorChange = (content: string) => {
    setMarkdownContent(content)
    saveContent(currentFile || null, content)
  }

  const handleReplaceText = (improvedText: string) => {
    const editor = monacoEditorRef.current
    if (!editor) return

    const selection = editor.getSelection()
    if (!selection) return

    editor.executeEdits('improve-writing', [
      {
        range: selection,
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

    // Set up activity tracking
    const fileName = currentFile?.name || 'Untitled'
    completionServices.activityTracker.setDocumentTitle(fileName)

    // Track cursor position changes
    editor.onDidChangeCursorPosition((e) => {
      completionServices.activityTracker.trackCursorChange(editor, e.position)
    })

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
          <CircleAlert className="w-4 h-4" />
          Failed to load file. It might have been moved or deleted.
        </P>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchCurrentFile()}
        >
          <RefreshCw className="w-4 h-4" />
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
        showPreview={showPreview}
        sidebarOpen={sidebarOpen}
        onTogglePreview={() => setShowPreview(!showPreview)}
        onFormatDocument={handleFormatDocument}
        onFileRenamed={updateCurrentFilePath}
        ref={previewButtonRef}
      />

      <div className="w-full flex flex-1 min-h-0">
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
            completionServices={completionServices}
            documentTitle={currentFile?.name || 'Untitled'}
          />
        </div>

        {showPreview && (
          <div className="w-1/2 flex flex-col min-w-0 pl-2 pr-4 pb-4 min-h-0">
            <MarkdownPreview content={markdownContent} />
          </div>
        )}
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

      {/* Debug panel for development */}
      <DebugPanel activityTracker={completionServices.activityTracker} />
    </div>
  )
}
