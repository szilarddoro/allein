import { useCallback } from 'react'
import * as monaco from 'monaco-editor'
import {
  applyBoldFormatting,
  applyItalicFormatting,
  applyStrikethroughFormatting,
  applyInlineCodeFormatting,
  applyHeadingFormatting,
} from '@/lib/editor/editorFormatting'
import { formatMarkdown } from '@/lib/editor/formatMarkdown'
import { toast } from 'sonner'

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

      // Override CMD+R to open command popover
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, () => {
        onOpenCommandPopover()
      })

      // Override CMD+Shift+Minus for strikethrough formatting
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Minus,
        () => {
          applyStrikethroughFormatting(editor)
        },
      )

      // Override CMD+Shift+C for inline code formatting
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC,
        () => {
          applyInlineCodeFormatting(editor)
        },
      )

      // Override CMD+0 for removing the heading level
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Digit0, () => {
        applyHeadingFormatting(editor, 0)
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

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Slash, () => {
        // Note: Disable comments for now.
      })

      // Override CMD+Shift+F for formatting markdown
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF,
        async () => {
          const model = editor.getModel()

          if (!model) {
            return
          }

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
          } catch {
            toast.error('Failed to format text')
          }
        },
      )

      return editor
    },
    [onTogglePreview, onOpenCommandPopover],
  )

  return { handleEditorReady }
}
