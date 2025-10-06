import * as monaco from 'monaco-editor'

/**
 * Generic function to apply markdown formatting to the current selection
 */
function applyFormatting(
  editor: monaco.editor.IStandaloneCodeEditor,
  marker: string,
  formatType: string,
): void {
  const model = editor.getModel()
  if (!model) return

  const selection = editor.getSelection()
  if (!selection) return

  const selectedText = model.getValueInRange(selection)
  const markerLength = marker.length

  // Check if selection is already formatted
  const isFormatted =
    selectedText.startsWith(marker) && selectedText.endsWith(marker)

  let newText: string
  let newSelection: monaco.Selection

  if (isFormatted) {
    // Remove formatting markers
    newText = selectedText.slice(markerLength, -markerLength)
    newSelection = new monaco.Selection(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn - markerLength * 2,
    )
  } else if (selectedText.length === 0) {
    // No selection - insert markers and position cursor between them
    newText = marker + marker
    editor.executeEdits(formatType, [
      {
        range: selection,
        text: newText,
      },
    ])

    // Move cursor between the markers
    const newPosition = new monaco.Position(
      selection.startLineNumber,
      selection.startColumn + markerLength,
    )
    editor.setPosition(newPosition)
    editor.focus()
    return
  } else {
    // Wrap selection with markers
    newText = `${marker}${selectedText}${marker}`
    newSelection = new monaco.Selection(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn + markerLength * 2,
    )
  }

  // Apply the formatting
  editor.executeEdits(formatType, [
    {
      range: selection,
      text: newText,
    },
  ])

  // Restore selection (for toggling off or wrapping)
  editor.setSelection(newSelection)
  editor.focus()
}

/**
 * Apply bold formatting (**text**) to the current selection in Monaco Editor
 */
export function applyBoldFormatting(
  editor: monaco.editor.IStandaloneCodeEditor,
): void {
  applyFormatting(editor, '**', 'bold-formatting')
}

/**
 * Apply italic formatting (*text*) to the current selection in Monaco Editor
 */
export function applyItalicFormatting(
  editor: monaco.editor.IStandaloneCodeEditor,
): void {
  applyFormatting(editor, '*', 'italic-formatting')
}

/**
 * Apply strikethrough formatting (~~text~~) to the current selection in Monaco Editor
 */
export function applyStrikethroughFormatting(
  editor: monaco.editor.IStandaloneCodeEditor,
): void {
  applyFormatting(editor, '~~', 'strikethrough-formatting')
}
