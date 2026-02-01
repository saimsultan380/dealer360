import { useState, useCallback, useEffect } from 'react';
import { formatPhoneNumber, formatCNIC, unformatPhoneNumber, unformatCNIC } from '@/lib/utils/format-input';

type InputType = 'phone' | 'cnic';

interface UseFormattedInputOptions {
    type: InputType;
    initialValue?: string;
    onChange?: (value: string) => void;
}

/**
 * Hook for handling formatted phone and CNIC inputs
 * Automatically formats as user types
 */
export function useFormattedInput({ type, initialValue = '', onChange }: UseFormattedInputOptions) {
    const [displayValue, setDisplayValue] = useState(() => {
        if (!initialValue) return '';
        return type === 'phone' ? formatPhoneNumber(initialValue) : formatCNIC(initialValue);
    });

    // Sync with initialValue changes
    useEffect(() => {
        if (initialValue) {
            const formatted = type === 'phone' ? formatPhoneNumber(initialValue) : formatCNIC(initialValue);
            const currentUnformatted = type === 'phone' 
                ? unformatPhoneNumber(displayValue) 
                : unformatCNIC(displayValue);
            if (initialValue !== currentUnformatted) {
                setDisplayValue(formatted);
            }
        } else if (displayValue) {
            setDisplayValue('');
        }
    }, [initialValue, type]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const formatted = type === 'phone' ? formatPhoneNumber(inputValue) : formatCNIC(inputValue);
        
        setDisplayValue(formatted);
        
        // Call onChange with unformatted value (digits only)
        if (onChange) {
            const unformatted = type === 'phone' 
                ? unformatPhoneNumber(formatted) 
                : unformatCNIC(formatted);
            onChange(unformatted);
        }
    }, [type, onChange]);

    const setValue = useCallback((value: string) => {
        const formatted = type === 'phone' ? formatPhoneNumber(value) : formatCNIC(value);
        setDisplayValue(formatted);
        if (onChange) {
            const unformatted = type === 'phone' 
                ? unformatPhoneNumber(formatted) 
                : unformatCNIC(formatted);
            onChange(unformatted);
        }
    }, [type, onChange]);

    return {
        value: displayValue,
        onChange: handleChange,
        setValue,
    };
}
