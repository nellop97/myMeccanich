// src/services/PartAnalysisService.ts - Lettura dei dati di un ricambio da una foto
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';
import { PartAnalysis } from '../types/inventory.types';

const MAX_LONG_SIDE = 1568;
const JPEG_QUALITY = 0.8;

// Poco oltre il timeout della funzione (120 s): il valore predefinito è 70 s
const CALL_TIMEOUT_MS = 125_000;

export type PartAnalysisErrorKind =
    | 'unavailable' // funzione non pubblicata o non raggiungibile
    | 'daily_limit'
    | 'invalid_photo'
    | 'not_allowed'
    | 'failed';

export class PartAnalysisError extends Error {
    constructor(public readonly kind: PartAnalysisErrorKind, message: string) {
        super(message);
        this.name = 'PartAnalysisError';
    }
}

interface AnalyzePartPhotoRequest {
    imageBase64: string;
    mediaType: 'image/jpeg';
}

// Stesso risultato su iOS, Android e web: JPEG ridotto, senza dipendere dal formato di origine (HEIC incluso)
const prepareImage = async (uri: string): Promise<string> => {
    try {
        const image = await ImageManipulator.manipulate(uri).renderAsync();
        const longSide = Math.max(image.width, image.height);
        const scale = MAX_LONG_SIDE / longSide;

        const resized = scale < 1
            ? await ImageManipulator.manipulate(image)
                .resize({
                    width: Math.round(image.width * scale),
                    height: Math.round(image.height * scale),
                })
                .renderAsync()
            : image;

        const { base64 } = await resized.saveAsync({
            base64: true,
            compress: JPEG_QUALITY,
            format: SaveFormat.JPEG,
        });
        if (!base64) throw new Error('Base64 mancante');

        return base64;
    } catch (error) {
        console.error('Errore preparazione foto:', error);
        throw new PartAnalysisError('invalid_photo', 'Non riesco a leggere questa foto. Provane un\'altra.');
    }
};

const translateError = (error: any): PartAnalysisError => {
    const code = String(error?.code ?? '').replace('functions/', '');
    const message = String(error?.message ?? '');

    // Senza un messaggio della funzione l'SDK ripete il codice ("internal", "not-found")
    const serverMessage = message.toLowerCase() === code ? '' : message;

    switch (code) {
        case 'resource-exhausted':
            return new PartAnalysisError('daily_limit', serverMessage || 'Limite giornaliero di analisi raggiunto.');
        case 'invalid-argument':
            return new PartAnalysisError('invalid_photo', serverMessage || 'La foto non è valida.');
        case 'unauthenticated':
        case 'permission-denied':
            return new PartAnalysisError('not_allowed', serverMessage || 'Analisi riservata alle officine.');
        case 'not-found':
            return new PartAnalysisError('unavailable', 'Analisi foto non ancora attiva. Compila i dati a mano.');
        case 'unavailable':
        case 'deadline-exceeded':
            return new PartAnalysisError('unavailable', serverMessage || 'Servizio di analisi non raggiungibile. Riprova o compila i dati a mano.');
        case 'internal':
            // È anche l'errore del browser quando la funzione non è pubblicata o la rete non risponde
            return serverMessage
                ? new PartAnalysisError('failed', serverMessage)
                : new PartAnalysisError('unavailable', 'Analisi foto non raggiungibile. Compila i dati a mano.');
        default:
            return new PartAnalysisError('failed', serverMessage || 'Analisi non riuscita. Compila i dati a mano.');
    }
};

class PartAnalysisService {
    private static instance: PartAnalysisService;

    static getInstance(): PartAnalysisService {
        if (!PartAnalysisService.instance) {
            PartAnalysisService.instance = new PartAnalysisService();
        }
        return PartAnalysisService.instance;
    }

    async analyzePhoto(uri: string): Promise<PartAnalysis> {
        const imageBase64 = await prepareImage(uri);

        const analyzePartPhoto = httpsCallable<AnalyzePartPhotoRequest, PartAnalysis>(
            functions,
            'analyzePartPhoto',
            { timeout: CALL_TIMEOUT_MS },
        );

        try {
            const { data } = await analyzePartPhoto({ imageBase64, mediaType: 'image/jpeg' });
            return data;
        } catch (error) {
            console.error('Errore analisi foto:', error);
            throw translateError(error);
        }
    }
}

export default PartAnalysisService.getInstance();
