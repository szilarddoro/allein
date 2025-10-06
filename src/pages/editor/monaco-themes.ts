import { Monaco } from '@monaco-editor/react'

export const defineCustomThemes = (monaco: Monaco) => {
  // Light theme
  monaco.editor.defineTheme('allein-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7f22fe', fontStyle: 'bold' },
      { token: 'string', foreground: '22863a' },
      { token: 'number', foreground: '005cc5' },
      { token: 'type', foreground: '6f42c1' },
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#09090b',
      'editor.lineHighlightBackground': '#f6f8fa',
      'editorCursor.foreground': '#0366d6',
      'editor.selectionBackground': '#c8e1ff',
      'editorLineNumber.foreground': '#959da5',
    },
  })

  // Dark theme
  monaco.editor.defineTheme('allein-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'a684ff', fontStyle: 'bold' },
      { token: 'string', foreground: 'ce9178' },
      { token: 'number', foreground: 'b5cea8' },
      { token: 'type', foreground: '4ec9b0' },
      { token: 'emphasis', fontStyle: 'italic' },
      { token: 'strong', fontStyle: 'bold' },
    ],
    colors: {
      'editor.background': '#171717',
      'editor.foreground': '#fafafa',
      'editor.lineHighlightBackground': '#282828',
      'editorCursor.foreground': '#00a63e',
      'editor.selectionBackground': '#264f78',
      'editorLineNumber.foreground': '#858585',
    },
  })
}
