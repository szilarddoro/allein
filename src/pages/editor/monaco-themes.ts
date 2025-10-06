import { Monaco } from '@monaco-editor/react'

export const defineCustomThemes = (monaco: Monaco) => {
  // Light theme
  monaco.editor.defineTheme('allein-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '09090b' },
      { token: 'keyword', foreground: '1447e6', fontStyle: 'bold' },
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
      { token: 'comment', foreground: 'fafafa' },
      { token: 'keyword', foreground: '51a2ff', fontStyle: 'bold' },
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
      'editorCursor.foreground': '#8ec5ff',
      'editor.selectionBackground': '#1a368c',
      'editorLineNumber.foreground': '#858585',
    },
  })
}
