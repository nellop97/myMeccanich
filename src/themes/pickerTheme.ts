// src/themes/pickerTheme.ts
export const pickerTheme = {
    // Colori per Drag & Drop
    dropZone: {
        idle: {
            backgroundColor: '#F5F5F5',
            borderColor: '#E0E0E0',
        },
        active: {
            backgroundColor: '#E3F2FD',
            borderColor: '#2196F3',
        },
    },

    // Stili preview
    preview: {
        image: {
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
        },
        document: {
            backgroundColor: '#FAFAFA',
            borderColor: '#E0E0E0',
            borderWidth: 1,
            borderRadius: 8,
        },
    },

    // Animazioni
    animations: {
        fadeIn: {
            duration: 300,
            useNativeDriver: true,
        },
        slideIn: {
            duration: 250,
            useNativeDriver: true,
        },
    },
};