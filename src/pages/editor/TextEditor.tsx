import { forwardRef, useRef, useState } from 'react'
import MonacoEditor, { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { Card } from '@/components/ui/card'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { useInlineCompletion } from './completion/useInlineCompletion'
import { useTheme } from 'next-themes'
import { useAIConfig } from '@/lib/ai/useAIConfig'
import { cn } from '@/lib/utils'
import { defineCustomThemes } from './monaco-themes'

export interface TextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  onKeyDown?: (event: monaco.IKeyboardEvent) => void
  onEditorReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void
}

export const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
  ({ value = '', onChange, placeholder, onKeyDown, onEditorReady }, ref) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const { theme, systemTheme } = useTheme()
    const { aiAssistanceEnabled } = useAIConfig()
    const [isInlineCompletionLoading, setIsInlineCompletionLoading] =
      useState(false)

    // Enable inline completion for the Monaco Editor
    useInlineCompletion({
      disabled: !aiAssistanceEnabled,
      editorRef,
      onLoadingChange: setIsInlineCompletionLoading,
    })

    function handleEditorChange(value: string | undefined) {
      onChange?.(value || '')
    }

    function handleBeforeMount(monacoInstance: Monaco) {
      defineCustomThemes(monacoInstance)
    }

    function handleEditorDidMount(
      editor: monaco.editor.IStandaloneCodeEditor,
      _monaco: Monaco,
    ) {
      editorRef.current = editor

      editor.onKeyDown((event: monaco.IKeyboardEvent) => {
        onKeyDown?.(event)
      })

      editor.onContextMenu(({ event }: monaco.editor.IEditorMouseEvent) => {
        event.preventDefault()
      })

      // Notify parent that editor is ready
      onEditorReady?.(editor)
    }

    return (
      <Card
        className="flex flex-col h-full p-0 overflow-hidden relative"
        ref={ref}
      >
        <div
          role="progressbar"
          className={cn(
            'size-2 rounded-full bg-purple-300 absolute top-2 right-2 z-10 pointer-events-none opacity-0 transition-opacity',
            'after:size-full after:rounded-full after:bg-purple-300 after:absolute after:top-0 after:left-0 after:animate-ping',
            isInlineCompletionLoading && 'opacity-100',
          )}
          aria-label="Loading inline completion"
        />

        <div className="flex-1">
          <MonacoEditor
            key={theme}
            className="h-full"
            theme={
              theme === 'dark' || (theme === 'system' && systemTheme === 'dark')
                ? 'allein-dark'
                : 'allein-light'
            }
            defaultLanguage="markdown"
            value={value}
            onChange={handleEditorChange}
            beforeMount={handleBeforeMount}
            onMount={handleEditorDidMount}
            loading={<ActivityIndicator>Loading editor...</ActivityIndicator>}
            options={{
              links: false,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              lineNumbers: 'off',
              glyphMargin: false,
              folding: false,
              renderWhitespace: 'none',
              guides: { indentation: false },
              occurrencesHighlight: 'off',
              foldingHighlight: false,
              selectionHighlight: false,
              renderLineHighlight: 'none',
              hideCursorInOverviewRuler: true,
              overviewRulerBorder: false,
              scrollbar: {
                useShadows: false,
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 4,
                horizontalScrollbarSize: 8,
              },
              smoothScrolling: true,
              tabCompletion: 'off',
              codeLens: false,
              contextmenu: false,
              suggest: {
                selectionMode: 'never',
                showKeywords: false,
                showSnippets: false,
                showFunctions: false,
                showConstructors: false,
                showFields: false,
                showVariables: false,
                showClasses: false,
                showStructs: false,
                showInterfaces: false,
                showModules: false,
                showProperties: false,
                showEvents: false,
                showOperators: false,
                showUnits: false,
                showValues: false,
                showConstants: false,
                showEnums: false,
                showEnumMembers: false,
                showColors: false,
                showFiles: false,
                showReferences: false,
                showFolders: false,
                showTypeParameters: false,
                showIssues: false,
                showUsers: false,
                showWords: false,
              },
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnEnter: 'off',
              wordBasedSuggestions: 'off',
              inlineSuggest: { enabled: true },
              unicodeHighlight: {
                ambiguousCharacters: false,
                invisibleCharacters: false,
                nonBasicASCII: false,
              },
              fontFamily: 'var(--font-mono)',
              fontSize: 14,
              lineHeight: 1.6,
              padding: { top: 12, bottom: 32 },
              placeholder,
              automaticLayout: true,
            }}
          />
        </div>
      </Card>
    )
  },
)

TextEditor.displayName = 'TextEditor'
