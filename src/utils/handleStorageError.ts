// src/utils/handleStorageError.ts - Gestione errori Firebase Storage
export function handleStorageError(error: any): string {
    const errorMessages: { [key: string]: string } = {
        'storage/unauthorized': 'Non hai i permessi per caricare questo file',
        'storage/canceled': 'Upload annullato',
        'storage/unknown': 'Errore sconosciuto durante upload',
        'storage/object-not-found': 'File non trovato',
        'storage/bucket-not-found': 'Storage bucket non configurato. Contatta il supporto.',
        'storage/project-not-found': 'Progetto Firebase non trovato',
        'storage/quota-exceeded': 'Quota storage superata',
        'storage/unauthenticated': 'Devi effettuare il login per caricare file',
        'storage/retry-limit-exceeded': 'Troppi tentativi, riprova più tardi',
        'storage/invalid-checksum': 'File corrotto, riprova',
        'storage/server-file-wrong-size': 'Dimensione file non valida',
        'storage/invalid-format': 'Formato file non supportato',
    };

    const code = error?.code;
    const message = errorMessages[code] || error?.message || 'Errore caricamento file';

    console.error('🔥 Storage Error:', {
        code,
        message: error?.message,
        details: error,
    });

    return message;
}

export function isStorageError(error: any): boolean {
    return error?.code?.startsWith('storage/') || false;
}

export function getStorageErrorCode(error: any): string | null {
    return error?.code || null;
}