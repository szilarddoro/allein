/**
 * Helper function to check for control characters
 */
function hasControlCharacters(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i)
    if (charCode < 32 || charCode === 127) {
      return true
    }
  }
  return false
}

/**
 * Validates a file name according to common file system rules
 */
export function validateFileName(fileName: string) {
  // Check if empty
  if (!fileName || fileName.trim().length === 0) {
    return {
      isValid: false,
      error: 'empty',
    } as const
  }

  // Check length (most file systems have limits)
  if (fileName.length > 255) {
    return {
      isValid: false,
      error: 'too-long',
    } as const
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*.]/
  if (invalidChars.test(fileName)) {
    return {
      isValid: false,
      error: 'invalid',
    } as const
  }

  // Check for reserved names (Windows)
  const reservedNames = [
    'CON',
    'PRN',
    'AUX',
    'NUL',
    'COM1',
    'COM2',
    'COM3',
    'COM4',
    'COM5',
    'COM6',
    'COM7',
    'COM8',
    'COM9',
    'LPT1',
    'LPT2',
    'LPT3',
    'LPT4',
    'LPT5',
    'LPT6',
    'LPT7',
    'LPT8',
    'LPT9',
  ]

  const nameWithoutExtension = fileName.split('.')[0].toUpperCase()
  if (reservedNames.includes(nameWithoutExtension)) {
    return {
      isValid: false,
      error: 'reserved',
    } as const
  }

  // Check for leading/trailing spaces or dots
  if (
    fileName.startsWith(' ') ||
    fileName.endsWith(' ') ||
    fileName.startsWith('.') ||
    fileName.endsWith('.')
  ) {
    return {
      isValid: false,
      error: 'invalid-leading-trailing',
    } as const
  }

  // Check for consecutive dots
  if (fileName.includes('..')) {
    return {
      isValid: false,
      error: 'consecutive-dots',
    } as const
  }

  // Check for control characters
  if (hasControlCharacters(fileName)) {
    return {
      isValid: false,
      error: 'control-characters',
    } as const
  }

  return {
    isValid: true,
    error: null,
  } as const
}

/**
 * Extract directory path from a full file path
 */
export function getFileDirectory(filePath: string): string {
  return filePath.substring(0, filePath.lastIndexOf('/'))
}

/**
 * Check if a file name already exists in the same directory
 * When itemType is provided, only checks against items of the same type
 */
export function checkDuplicateFileName(
  newFileName: string,
  currentFilePath: string,
  existingFiles: Array<{
    name: string
    path: string
    type?: 'file' | 'folder'
  }>,
  itemType?: 'file' | 'folder',
): { isDuplicate: boolean; conflictPath?: string } {
  const currentDir = getFileDirectory(currentFilePath)
  const nameWithoutExt = newFileName.replace(/\.md$/, '')

  const duplicate = existingFiles.find((file) => {
    // If itemType is provided and the file has type info, only match same type
    if (itemType && file.type !== undefined && file.type !== itemType) {
      return false
    }

    const fileNameWithoutExt = file.name.replace(/\.md$/, '')
    const fileDir = getFileDirectory(file.path)

    return (
      fileNameWithoutExt === nameWithoutExt &&
      fileDir === currentDir &&
      file.path !== currentFilePath
    )
  })

  return {
    isDuplicate: !!duplicate,
    conflictPath: duplicate?.path,
  }
}
