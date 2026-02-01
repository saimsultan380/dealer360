// Default vehicle models organized by make
export const DEFAULT_VEHICLE_MODELS: Record<string, string[]> = {
    'Toyota': [
        'Corolla', 'Camry', 'Prius', 'RAV4', 'Highlander', 'Land Cruiser', 'Hilux', 'Fortuner', 'Yaris', 'Vitz', 'Passo', 'Aqua'
    ],
    'Honda': [
        'Civic', 'City', 'Accord', 'CR-V', 'HR-V', 'Pilot', 'Ridgeline', 'Fit', 'BR-V', 'Vezel'
    ],
    'Suzuki': [
        'Alto', 'Mehran', 'Cultus', 'Swift', 'Wagon R', 'Jimny', 'Vitara', 'Baleno', 'Ciaz', 'Dzire', 'APV'
    ],
    'Hyundai': [
        'Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Accent', 'i10', 'i20', 'Grand i10', 'Creta', 'Kona'
    ],
    'Kia': [
        'Sportage', 'Sorento', 'Picanto', 'Rio', 'Cerato', 'Optima', 'Stonic', 'Seltos', 'Telluride'
    ],
    'Changan': [
        'Alsvin', 'Karvaan', 'M9', 'Oshan X7', 'Alsvin Plus'
    ],
    'MG': [
        'HS', 'ZS', '5', '6', 'RX8'
    ],
    'Proton': [
        'Saga', 'Persona', 'Iriz', 'X50', 'X70', 'Exora'
    ],
    'Haval': [
        'H6', 'Jolion', 'H2', 'H9'
    ],
    'Nissan': [
        'Sunny', 'Sentra', 'Altima', 'Rogue', 'Pathfinder', 'X-Trail', 'Navara'
    ],
    'Daihatsu': [
        'Mira', 'Cuore', 'Charade', 'Terios'
    ],
    'Mitsubishi': [
        'Lancer', 'Outlander', 'Pajero', 'Montero', 'Mirage'
    ],
    'Audi': [
        'A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7', 'Q8'
    ],
    'BMW': [
        '3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7'
    ],
    'Mercedes': [
        'A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'GLS'
    ],
};

// Helper function to get models for a make
export function getDefaultModelsForMake(make: string): string[] {
    return DEFAULT_VEHICLE_MODELS[make] || [];
}

function signature(list: string[]): string {
    return [...list].sort().join('|');
}

// Helper function to initialize models in localStorage for a make
export function initializeModelsForMake(make: string): string[] {
    if (typeof window === 'undefined') return [];
    
    if (!make || make.trim() === '') return [];
    
    const storageKey = `vehicle-models-${make}`;
    const existing = localStorage.getItem(storageKey);
    
    if (existing) {
        try {
            const parsed = JSON.parse(existing);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Auto-repair common corruption case:
                // If the stored list exactly matches the default list of a *different* make
                // (e.g., Toyota models copied into Honda key), replace with correct defaults.
                const parsedSig = signature(parsed);
                for (const [otherMake, otherDefaults] of Object.entries(DEFAULT_VEHICLE_MODELS)) {
                    if (otherMake !== make && signature(otherDefaults) === parsedSig) {
                        const correctDefaults = getDefaultModelsForMake(make);
                        if (correctDefaults.length > 0) {
                            localStorage.setItem(storageKey, JSON.stringify(correctDefaults));
                            return correctDefaults;
                        }
                        break;
                    }
                }

                return parsed;
            }
        } catch {
            // If parse fails, continue to initialize defaults
        }
    }
    
    // Initialize with default models if none exist
    const defaultModels = getDefaultModelsForMake(make);
    if (defaultModels.length > 0) {
        localStorage.setItem(storageKey, JSON.stringify(defaultModels));
        return defaultModels;
    }
    
    return [];
}
