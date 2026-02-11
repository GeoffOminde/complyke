/**
 * KRA PIN Validation Service
 * 
 * This module provides validation for Kenya Revenue Authority (KRA) PIN numbers.
 * 
 * KRA PIN Format:
 * - Starts with 'A' or 'P' (A for individuals, P for businesses)
 * - Followed by 9 digits
 * - Ends with a letter (A-Z)
 * - Example: P051234567X or A001234567B
 * 
 * Future Enhancement: Integrate with KRA API for real-time validation
 */

export interface KRAPINValidationResult {
    valid: boolean
    message: string
    pinType?: 'Individual' | 'Business'
    error?: string
}

/**
 * Validates KRA PIN format
 * 
 * @param pin - The KRA PIN to validate
 * @returns Validation result with status and message
 */
export function validateKRAPINFormat(pin: string): KRAPINValidationResult {
    // Remove whitespace and convert to uppercase
    const cleanPin = pin.trim().toUpperCase()

    // Check if empty
    if (!cleanPin) {
        return {
            valid: false,
            message: 'KRA PIN is required'
        }
    }

    // Check length (should be 11 characters)
    if (cleanPin.length !== 11) {
        return {
            valid: false,
            message: 'KRA PIN must be 11 characters long (e.g., P051234567X)'
        }
    }

    // Check format: Letter + 9 digits + Letter
    const pinRegex = /^[AP]\d{9}[A-Z]$/
    if (!pinRegex.test(cleanPin)) {
        return {
            valid: false,
            message: 'Invalid KRA PIN format. Must be: Letter + 9 digits + Letter (e.g., P051234567X)'
        }
    }

    // Determine PIN type
    const pinType = cleanPin.startsWith('A') ? 'Individual' : 'Business'

    return {
        valid: true,
        message: `Valid ${pinType} KRA PIN`,
        pinType
    }
}

/**
 * Validates KRA PIN against KRA API (Future Implementation)
 * 
 * This function will integrate with KRA's eTIMS or iTax API to validate
 * the PIN in real-time and retrieve taxpayer information.
 * 
 * @param pin - The KRA PIN to validate
 * @returns Promise with validation result and taxpayer info
 */
export async function validateKRAPINWithAPI(pin: string): Promise<{
    valid: boolean
    name?: string
    status?: 'Active' | 'Inactive' | 'Suspended'
    registrationDate?: string
    error?: string
}> {
    // First, validate format
    const formatValidation = validateKRAPINFormat(pin)
    if (!formatValidation.valid) {
        return {
            valid: false,
            error: formatValidation.message
        }
    }

    // TODO: Implement KRA API integration
    // This requires:
    // 1. KRA API credentials
    // 2. Digital certificate
    // 3. API endpoint access
    // 4. Authentication token

    // For now, return format validation only
    console.warn('KRA API integration not yet implemented. Using format validation only.')

    return {
        valid: true,
        name: 'API Integration Pending',
        status: 'Active',
        error: 'Real-time validation not available. Format validation passed.'
    }
}

/**
 * Validates NSSF Number format
 * 
 * NSSF Number Format: 9 digits
 * Example: 123456789
 * 
 * @param number - The NSSF number to validate
 * @returns Validation result
 */
export function validateNSSFNumber(number: string): {
    valid: boolean
    message: string
} {
    const cleanNumber = number.trim()

    if (!cleanNumber) {
        return {
            valid: false,
            message: 'NSSF number is required'
        }
    }

    // NSSF numbers are typically 9 digits
    const nssfRegex = /^\d{9}$/
    if (!nssfRegex.test(cleanNumber)) {
        return {
            valid: false,
            message: 'Invalid NSSF number. Must be 9 digits (e.g., 123456789)'
        }
    }

    return {
        valid: true,
        message: 'Valid NSSF number'
    }
}

/**
 * Validates SHIF/SHA Number format
 * 
 * SHIF Number Format: Varies, typically starts with SHA
 * Example: SHA123456789
 * 
 * @param number - The SHIF/SHA number to validate
 * @returns Validation result
 */
export function validateSHIFNumber(number: string): {
    valid: boolean
    message: string
} {
    const cleanNumber = number.trim().toUpperCase()

    if (!cleanNumber) {
        return {
            valid: false,
            message: 'SHIF/SHA number is required'
        }
    }

    // SHIF numbers typically start with SHA followed by digits
    const shifRegex = /^SHA\d{9,12}$/
    if (!shifRegex.test(cleanNumber)) {
        return {
            valid: false,
            message: 'Invalid SHIF number. Should start with SHA followed by 9-12 digits'
        }
    }

    return {
        valid: true,
        message: 'Valid SHIF/SHA number'
    }
}

/**
 * Batch validate multiple KRA PINs
 * 
 * @param pins - Array of KRA PINs to validate
 * @returns Array of validation results
 */
export function batchValidateKRAPINs(pins: string[]): KRAPINValidationResult[] {
    return pins.map(pin => validateKRAPINFormat(pin))
}

/**
 * Format KRA PIN for display
 * 
 * @param pin - The KRA PIN to format
 * @returns Formatted PIN (e.g., P051234567X)
 */
export function formatKRAPIN(pin: string): string {
    return pin.trim().toUpperCase()
}

/**
 * Check if KRA PIN belongs to an individual or business
 * 
 * @param pin - The KRA PIN to check
 * @returns 'Individual', 'Business', or 'Invalid'
 */
export function getKRAPINType(pin: string): 'Individual' | 'Business' | 'Invalid' {
    const validation = validateKRAPINFormat(pin)
    if (!validation.valid) {
        return 'Invalid'
    }
    return validation.pinType || 'Invalid'
}
