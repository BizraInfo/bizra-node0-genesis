/**
 * Alpha-100 Invitation Code Validation
 * Validates invitation codes with format: BZ-XXXX-XXXX
 */

// Valid invitation codes (first 30 for client-side validation)
// Remaining 70 codes validated server-side via API
export const VALID_INVITATION_CODES = new Set([
  'BZ-N26R-GMDA',
  'BZ-58NC-KHFY',
  'BZ-KG4E-UZA9',
  'BZ-U2Q3-2XSP',
  'BZ-HSB7-JYTW',
  'BZ-TN86-ZA7X',
  'BZ-MCYD-TDQK',
  'BZ-DXRE-VEUN',
  'BZ-BK2V-G9GP',
  'BZ-SNX7-YJCU',
  'BZ-7HBJ-PNKQ',
  'BZ-XFKB-WGZS',
  'BZ-PRMH-YWUF',
  'BZ-GX42-KTEC',
  'BZ-WRQA-9DTM',
  'BZ-A8V6-NDHZ',
  'BZ-ZU3N-FMJS',
  'BZ-QWYP-5ESR',
  'BZ-M9KT-HJDC',
  'BZ-4VE2-BXNW',
  'BZ-RZGF-8YPK',
  'BZ-JDSC-3UQM',
  'BZ-TNAH-6WKB',
  'BZ-VPXF-Z9EY',
  'BZ-FK7S-MPDU',
  'BZ-B2QW-RETC',
  'BZ-X5HG-AJNV',
  'BZ-ND8M-4UKZ',
  'BZ-YPRW-QGJS',
  'BZ-39CE-VHTB',
])

export const INVITATION_CODE_PATTERN = /^BZ-[A-Z0-9]{4}-[A-Z0-9]{4}$/

/**
 * Format invitation code as user types
 * Auto-formats to BZ-XXXX-XXXX pattern
 */
export function formatInvitationCode(value: string): string {
  let formatted = value.toUpperCase().replace(/[^A-Z0-9-]/g, '')

  // Auto-format as user types: BZ-XXXX-XXXX
  if (formatted.length >= 2 && !formatted.startsWith('BZ-')) {
    if (formatted.startsWith('BZ')) {
      formatted = formatted.slice(0, 2) + '-' + formatted.slice(2)
    }
  }

  if (formatted.length > 2 && formatted.charAt(2) !== '-') {
    formatted = formatted.slice(0, 2) + '-' + formatted.slice(2)
  }

  if (formatted.length > 7 && formatted.charAt(7) !== '-') {
    const parts = formatted.split('-')
    if (parts.length === 2 && parts[1].length > 4) {
      formatted = parts[0] + '-' + parts[1].slice(0, 4) + '-' + parts[1].slice(4)
    }
  }

  // Limit to pattern length
  if (formatted.length > 13) {
    formatted = formatted.slice(0, 13)
  }

  return formatted
}

/**
 * Validate invitation code format
 */
export function isValidFormat(code: string): boolean {
  return INVITATION_CODE_PATTERN.test(code)
}

/**
 * Check if code is in the pre-defined valid codes list
 */
export function isValidCode(code: string): boolean {
  return VALID_INVITATION_CODES.has(code.toUpperCase())
}

/**
 * Validate invitation code (client-side)
 * Returns validation result with message
 */
export function validateInvitationCode(code: string): {
  valid: boolean
  message: string
  formatted: string
} {
  const formatted = formatInvitationCode(code)

  if (formatted.length === 0) {
    return {
      valid: false,
      message: '',
      formatted: '',
    }
  }

  if (formatted.length < 13) {
    return {
      valid: false,
      message: 'Format: BZ-XXXX-XXXX',
      formatted,
    }
  }

  if (!isValidFormat(formatted)) {
    return {
      valid: false,
      message: 'Invalid format',
      formatted,
    }
  }

  if (isValidCode(formatted)) {
    return {
      valid: true,
      message: '✅ Valid invitation code - Now fill all fields to continue',
      formatted,
    }
  }

  return {
    valid: false,
    message: '❌ Invalid invitation code',
    formatted,
  }
}

