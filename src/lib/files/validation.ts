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
export function validateFileName(fileName: string): {
  isValid: boolean
  error?: string
} {
  // Check if empty
  if (!fileName || fileName.trim().length === 0) {
    return {
      isValid: false,
      error: 'File name cannot be empty',
    }
  }

  // Check length (most file systems have limits)
  if (fileName.length > 255) {
    return {
      isValid: false,
      error: 'File name is too long (maximum 255 characters)',
    }
  }

  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/
  if (invalidChars.test(fileName)) {
    return {
      isValid: false,
      error: 'File name contains invalid characters: < > : " / \\ | ? *',
    }
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
      error: 'File name is reserved by the operating system',
    }
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
      error: 'File name cannot start or end with spaces or dots',
    }
  }

  // Check for consecutive dots
  if (fileName.includes('..')) {
    return {
      isValid: false,
      error: 'File name cannot contain consecutive dots',
    }
  }

  // Check for control characters
  if (hasControlCharacters(fileName)) {
    return {
      isValid: false,
      error: 'File name contains control characters',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Validates a file name and returns a sanitized version if possible
 */
export function sanitizeFileName(fileName: string): {
  sanitized: string
  isValid: boolean
  error?: string
} {
  const validation = validateFileName(fileName)

  if (validation.isValid) {
    return {
      sanitized: fileName,
      isValid: true,
    }
  }

  // Try to sanitize the file name
  let sanitized = fileName

  // Remove invalid characters
  sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_')

  // Remove control characters
  sanitized = sanitized
    .split('')
    .filter((char) => {
      const charCode = char.charCodeAt(0)
      return charCode >= 32 && charCode !== 127
    })
    .join('')

  // Trim spaces and dots from start/end
  sanitized = sanitized.replace(/^[\s.]+|[\s.]+$/g, '')

  // Replace consecutive dots with single dot
  sanitized = sanitized.replace(/\.{2,}/g, '.')

  // Truncate if too long
  if (sanitized.length > 255) {
    const extension = sanitized.split('.').pop()
    const nameWithoutExt = sanitized.substring(0, sanitized.lastIndexOf('.'))
    const maxNameLength = 255 - (extension ? extension.length + 1 : 0)
    sanitized =
      nameWithoutExt.substring(0, maxNameLength) +
      (extension ? '.' + extension : '')
  }

  // Check if sanitized name is valid
  const sanitizedValidation = validateFileName(sanitized)

  if (sanitizedValidation.isValid && sanitized.length > 0) {
    return {
      sanitized,
      isValid: true,
    }
  }

  return {
    sanitized: '',
    isValid: false,
    error: 'File name cannot be sanitized to a valid format',
  }
}
