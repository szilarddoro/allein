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
import { useModelWarmup } from '@/lib/ollama/warmupModel'
import { useOllamaConfig } from '@/lib/ollama/useOllamaConfig'

export interface TextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  onKeyDown?: (event: monaco.IKeyboardEvent) => void
  onEditorReady?: (editor: monaco.editor.IStandaloneCodeEditor) => void
  documentTitle?: string
}

export const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
  (
    {
      value = '',
      onChange,
      placeholder,
      onKeyDown,
      onEditorReady,
      documentTitle = 'Untitled',
    },
    ref,
  ) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const { theme, systemTheme } = useTheme()
    const { aiAssistanceEnabled } = useAIConfig()
    const { ollamaUrl, ollamaModel } = useOllamaConfig()
    const [isInlineCompletionLoading, setIsInlineCompletionLoading] =
      useState(false)

    // Warm up the model when AI assistance is enabled
    useModelWarmup(ollamaUrl, ollamaModel, aiAssistanceEnabled ?? false)

    // Enable inline completion for the Monaco Editor
    useInlineCompletion({
      disabled: !aiAssistanceEnabled,
      editorRef,
      onLoadingChange: setIsInlineCompletionLoading,
      documentTitle,
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

        // Handle Enter key for list continuation
        if (event.keyCode === _monaco.KeyCode.Enter && !event.shiftKey) {
          const model = editor.getModel()
          if (!model) return

          const position = editor.getPosition()
          if (!position) return

          const currentLine = model.getLineContent(position.lineNumber)
          const cursorColumn = position.column

          // Only process if cursor is at end of line
          if (cursorColumn !== currentLine.length + 1) return

          // Check if current line is a bullet list item
          const bulletMatch = currentLine.match(/^(\s*)([-*+])\s+(.*)$/)
          // Check if current line is a numbered list item
          const numberedMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/)

          if (bulletMatch) {
            const [, indent, marker] = bulletMatch
            const listContent = bulletMatch[3]

            // If the list item is empty (just the marker), remove it and exit list
            if (listContent.trim() === '') {
              event.preventDefault()
              editor.executeEdits('', [
                {
                  range: new _monaco.Range(
                    position.lineNumber,
                    1,
                    position.lineNumber,
                    currentLine.length + 1,
                  ),
                  text: '',
                },
              ])
              return
            }

            // Continue the list with same indentation and marker
            event.preventDefault()
            const newListItem = `\n${indent}${marker} `
            editor.executeEdits('', [
              {
                range: new _monaco.Range(
                  position.lineNumber,
                  cursorColumn,
                  position.lineNumber,
                  cursorColumn,
                ),
                text: newListItem,
              },
            ])

            // Move cursor to end of new list item
            editor.setPosition({
              lineNumber: position.lineNumber + 1,
              column: indent.length + marker.length + 2,
            })
          } else if (numberedMatch) {
            const [, indent, numberStr] = numberedMatch
            const listContent = numberedMatch[3]
            const currentNumber = parseInt(numberStr, 10)

            // If the list item is empty (just the number), remove it and exit list
            if (listContent.trim() === '') {
              event.preventDefault()
              editor.executeEdits('', [
                {
                  range: new _monaco.Range(
                    position.lineNumber,
                    1,
                    position.lineNumber,
                    currentLine.length + 1,
                  ),
                  text: '',
                },
              ])
              return
            }

            // Continue the list with incremented number
            event.preventDefault()
            const nextNumber = currentNumber + 1
            const newListItem = `\n${indent}${nextNumber}. `
            editor.executeEdits('', [
              {
                range: new _monaco.Range(
                  position.lineNumber,
                  cursorColumn,
                  position.lineNumber,
                  cursorColumn,
                ),
                text: newListItem,
              },
            ])

            // Move cursor to end of new list item
            // Column calculation: indent + number + ". " (period + space) + 1 (1-indexed)
            const markerText = `${nextNumber}. `
            editor.setPosition({
              lineNumber: position.lineNumber + 1,
              column: indent.length + markerText.length + 1,
            })
          }
        }
      })

      editor.onContextMenu(({ event }: monaco.editor.IEditorMouseEvent) => {
        event.preventDefault()
      })

      // Notify parent that editor is ready
      onEditorReady?.(editor)
    }

    return (
      <div className="relative flex flex-col flex-1 min-h-0" ref={ref}>
        <div
          role="status"
          aria-label="Loading inline completion"
          className={cn(
            'absolute inset-0 rounded-lg overflow-hidden transition-opacity duration-300 opacity-0',
            isInlineCompletionLoading && 'opacity-100',
          )}
        >
          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-r animate-[spin_5s_linear_infinite] scale-200',
              'from-rose-500/50 via-sky-500/50 to-emerald-500/50',
              'dark:from-rose-500/40 dark:via-sky-500/40 dark:to-emerald-500/40',
            )}
          />
        </div>

        <Card
          className={cn(
            'flex flex-col flex-1 min-h-0 p-0 m-0.5 overflow-hidden relative transition-colors duration-300',
            isInlineCompletionLoading && 'border-card dark:border-card',
          )}
        >
          <div className="flex-1 min-h-0">
            <MonacoEditor
              key={theme}
              theme={
                theme === 'dark' ||
                (theme === 'system' && systemTheme === 'dark')
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
                tabSize: 2,
                links: false,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'off',
                stickyScroll: { enabled: false },
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
                fontSize: 14,
                lineHeight: 1.6,
                padding: { top: 12, bottom: 32 },
                placeholder,
                automaticLayout: true,
              }}
            />
          </div>
        </Card>
      </div>
    )
  },
)

TextEditor.displayName = 'TextEditor'
