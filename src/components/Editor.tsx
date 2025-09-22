import React, { useRef } from 'react'
import MonacoEditor, { Monaco } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { Card } from '@/components/ui/card'

interface EditorProps {
  initialValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  onKeyDown?: (event: monaco.IKeyboardEvent) => void
}

const Editor: React.FC<EditorProps> = ({
  initialValue = '',
  onChange,
  placeholder = 'Start writing your markdown...',
  onKeyDown,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  const handleEditorChange = (value: string | undefined) => {
    onChange?.(value || '')
  }

  const handleEditorDidMount = (
    editor: monaco.editor.IStandaloneCodeEditor,
    _monaco: Monaco,
  ) => {
    editorRef.current = editor

    // Add keydown event listener
    editor.onKeyDown((event: monaco.IKeyboardEvent) => {
      onKeyDown?.(event)
    })
  }

  return (
    <Card className="flex flex-col h-full p-0 overflow-hidden">
      <div className="flex-1">
        <MonacoEditor
          className="pl-2"
          theme="monaco-editor"
          height="100%"
          defaultLanguage="markdown"
          value={initialValue}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            useShadowDOM: true,
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
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
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
}

export default Editor
