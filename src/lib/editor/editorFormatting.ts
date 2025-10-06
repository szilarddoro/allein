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

/**
 * Apply heading formatting to the current line
 */
export function applyHeadingFormatting(
  editor: monaco.editor.IStandaloneCodeEditor,
  level: number,
): void {
  const model = editor.getModel()
  if (!model) return

  const selection = editor.getSelection()
  if (!selection) return

  const lineNumber = selection.startLineNumber
  const lineContent = model.getLineContent(lineNumber)
  const headingMarker = '#'.repeat(level) + ' '

  // Check if line already has this heading level
  const currentHeadingMatch = lineContent.match(/^(#{1,6})\s/)
  const currentLevel = currentHeadingMatch ? currentHeadingMatch[1].length : 0

  let newText: string
  let newPosition: monaco.Position

  if (level === 0) {
    newText = lineContent.replace(/^#{1,6}\s/, '')
    newPosition = new monaco.Position(
      lineNumber,
      Math.max(1, selection.positionColumn),
    )
  } else if (currentLevel === level) {
    // Remove heading
    newText = lineContent.replace(/^#{1,6}\s/, '')
    newPosition = new monaco.Position(
      lineNumber,
      Math.max(1, selection.positionColumn - headingMarker.length),
    )
  } else if (currentLevel > 0) {
    // Replace with new heading level
    newText = lineContent.replace(/^#{1,6}\s/, headingMarker)
    const columnDiff = headingMarker.length - currentHeadingMatch![0].length
    newPosition = new monaco.Position(
      lineNumber,
      Math.max(1, selection.positionColumn + columnDiff),
    )
  } else {
    // Add heading
    newText = headingMarker + lineContent
    newPosition = new monaco.Position(
      lineNumber,
      selection.positionColumn + headingMarker.length,
    )
  }

  // Apply the formatting to the entire line
  editor.executeEdits('heading-formatting', [
    {
      range: new monaco.Range(
        lineNumber,
        1,
        lineNumber,
        lineContent.length + 1,
      ),
      text: newText,
    },
  ])

  // Restore cursor position
  editor.setPosition(newPosition)
  editor.focus()
}
