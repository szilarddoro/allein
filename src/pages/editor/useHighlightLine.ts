import { LINE_NUMBER_SEARCH_PARAM } from '@/lib/constants'
import * as monaco from 'monaco-editor'
import { RefObject, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router'

interface UseHighlightLineParams {
  editorRef: RefObject<monaco.editor.IStandaloneCodeEditor | null>
  editorReady: boolean
}

export function useHighlightLine({
  editorRef,
  editorReady,
}: UseHighlightLineParams) {
  const [searchParams] = useSearchParams()

  const highlightLine = useCallback(
    (lineNumber: number) => {
      const editor = editorRef.current
      if (!editor) return

      requestAnimationFrame(() => {
        // Scroll to line and center it
        editor.revealLineInCenter(lineNumber, monaco.editor.ScrollType.Smooth)

        // Set cursor position to the line
        editor.setPosition({ lineNumber, column: 1 })

        // Add highlight decoration to the line (using newer API)
        const decorationsCollection = editor.createDecorationsCollection([
          {
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
              isWholeLine: true,
              className: 'highlighted-search-line',
            },
          },
        ])

        // Remove highlight after 3 seconds (CSS animation handles fade)
        setTimeout(() => {
          decorationsCollection.clear()
        }, 3000)

        // Focus the editor
        editor.focus()
      })
    },
    [editorRef],
  )

  // Highlight line when line parameter changes
  useEffect(() => {
    if (editorRef.current == null || !editorReady) {
      return
    }

    const lineParam = searchParams.get(LINE_NUMBER_SEARCH_PARAM)

    if (!lineParam) return

    const lineNumber = parseInt(lineParam, 10)
    if (isNaN(lineNumber)) return

    // Highlight the line if editor is ready
    highlightLine(lineNumber)
  }, [searchParams, highlightLine, editorReady, editorRef])

  return { highlightLine }
}
