/**
 * Format phone number as 03XX-XXXXXXX (11 digits)
 * Adds dash after 4 digits automatically
 */
export function formatPhoneNumber(value: string): string {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 11 digits
    const limited = digits.slice(0, 11);
    
    // Add dash after 4 digits
    if (limited.length <= 4) {
        return limited;
    }
    return `${limited.slice(0, 4)}-${limited.slice(4)}`;
}

/**
 * Format CNIC as XXXXX-XXXXXXX-X (13 digits)
 * Adds dash after 5 digits and before last digit
 */
export function formatCNIC(value: string): string {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 13 digits
    const limited = digits.slice(0, 13);
    
    if (limited.length <= 5) {
        return limited;
    }
    
    if (limited.length <= 12) {
        return `${limited.slice(0, 5)}-${limited.slice(5)}`;
    }
    
    // Full format: XXXXX-XXXXXXX-X
    return `${limited.slice(0, 5)}-${limited.slice(5, 12)}-${limited.slice(12)}`;
}

/**
 * Remove formatting from phone number (remove dashes)
 */
export function unformatPhoneNumber(value: string): string {
    return value.replace(/\D/g, '');
}

/**
 * Remove formatting from CNIC (remove dashes)
 */
export function unformatCNIC(value: string): string {
    return value.replace(/\D/g, '');
}
