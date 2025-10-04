import { forwardRef, useRef } from 'react'
import MonacoEditor, { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { Card } from '@/components/ui/card'
import { ActivityIndicator } from '@/components/ActivityIndicator'
import { useInlineCompletion } from './completion/useInlineCompletion'
import { useTheme } from 'next-themes'
import { useAIConfig } from '@/lib/ai/useAIConfig'

export interface TextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  onKeyDown?: (event: monaco.IKeyboardEvent) => void
}

export const TextEditor = forwardRef<HTMLDivElement, TextEditorProps>(
  ({ value = '', onChange, placeholder, onKeyDown }, ref) => {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
    const { theme, systemTheme } = useTheme()
    const { aiAssistanceEnabled } = useAIConfig()

    // Enable inline completion for the Monaco Editor
    useInlineCompletion({ disabled: !aiAssistanceEnabled, editorRef })

    function handleEditorChange(value: string | undefined) {
      onChange?.(value || '')
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
    }

    return (
      <Card className="flex flex-col h-full p-0 overflow-hidden" ref={ref}>
        <div className="flex-1">
          <MonacoEditor
            className="h-full"
            theme={
              theme === 'dark' || systemTheme === 'dark' ? 'vs-dark' : 'vs'
            }
            defaultLanguage="markdown"
            value={value}
            onChange={handleEditorChange}
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
              placeholder: placeholder,
              automaticLayout: true,
            }}
          />
        </div>
      </Card>
    )
  },
)

TextEditor.displayName = 'TextEditor'
