import { vi } from 'vitest'
import * as monaco from 'monaco-editor'

export function createMockTextModel(
  modelOptions: Partial<monaco.editor.ITextModel>,
) {
  return vi.mockObject({
    ...modelOptions,
  }) as monaco.editor.ITextModel
}

export function createMockPosition(lineNumber: number, column: number) {
  return vi.mockObject({
    lineNumber,
    column,
  }) as monaco.Position
}
