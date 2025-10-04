import * as monaco from 'monaco-editor'

/**
 * Apply bold formatting (**text**) to the current selection in Monaco Editor
 */
export function applyBoldFormatting(
  editor: monaco.editor.IStandaloneCodeEditor,
): void {
  const model = editor.getModel()
  if (!model) return

  const selection = editor.getSelection()
  if (!selection) return

  const selectedText = model.getValueInRange(selection)

  // Check if selection is already bold
  const isBold =
    selectedText.startsWith('**') && selectedText.endsWith('**')

  let newText: string
  let newSelection: monaco.Selection

  if (isBold) {
    // Remove bold markers
    newText = selectedText.slice(2, -2)
    newSelection = new monaco.Selection(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn - 4, // Account for removed **
    )
  } else if (selectedText.length === 0) {
    // No selection - insert bold markers and position cursor between them
    newText = '****'
    editor.executeEdits('bold-formatting', [
      {
        range: selection,
        text: newText,
      },
    ])

    // Move cursor between the asterisks
    const newPosition = new monaco.Position(
      selection.startLineNumber,
      selection.startColumn + 2,
    )
    editor.setPosition(newPosition)
    editor.focus()
    return
  } else {
    // Wrap selection with bold markers
    newText = `**${selectedText}**`
    newSelection = new monaco.Selection(
      selection.startLineNumber,
      selection.startColumn,
      selection.endLineNumber,
      selection.endColumn + 4, // Account for added **
    )
  }

  // Apply the formatting
  editor.executeEdits('bold-formatting', [
    {
      range: selection,
      text: newText,
    },
  ])

  // Restore selection (for toggling off or wrapping)
  editor.setSelection(newSelection)
  editor.focus()
}
