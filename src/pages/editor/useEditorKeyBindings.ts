import { useCallback } from 'react'
import * as monaco from 'monaco-editor'
import { applyBoldFormatting, applyItalicFormatting, applyStrikethroughFormatting, applyHeadingFormatting } from '@/lib/editor/formatting'

interface UseEditorKeyBindingsProps {
  onTogglePreview: () => void
  onOpenCommandPopover: () => void
}

/**
 * Hook that sets up Monaco Editor keyboard shortcuts.
 * Registers all custom keybindings when the editor is ready.
 */
export function useEditorKeyBindings({
  onTogglePreview,
  onOpenCommandPopover,
}: UseEditorKeyBindingsProps) {
  const handleEditorReady = useCallback(
    (editor: monaco.editor.IStandaloneCodeEditor) => {
      // Override CMD+P to toggle preview
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP, () => {
        onTogglePreview()
      })

      // Override CMD+I for italic formatting
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI, () => {
        applyItalicFormatting(editor)
      })

      // Override CMD+B for bold formatting
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyB, () => {
        applyBoldFormatting(editor)
      })

      // Override CMD+K to open command popover
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
        onOpenCommandPopover()
      })

      // Override CMD+Shift+Minus for strikethrough formatting
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Minus, () => {
        applyStrikethroughFormatting(editor)
      })

      // Override CMD+1 for heading level 1
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit1, () => {
        applyHeadingFormatting(editor, 1)
      })

      // Override CMD+2 for heading level 2
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit2, () => {
        applyHeadingFormatting(editor, 2)
      })

      // Override CMD+3 for heading level 3
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit3, () => {
        applyHeadingFormatting(editor, 3)
      })

      // Override CMD+4 for heading level 4
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit4, () => {
        applyHeadingFormatting(editor, 4)
      })

      return editor
    },
    [onTogglePreview, onOpenCommandPopover],
  )

  return { handleEditorReady }
}
