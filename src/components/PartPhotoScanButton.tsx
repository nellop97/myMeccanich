// src/components/PartPhotoScanButton.tsx - Scatta la foto di un ricambio e precompila la scheda
import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Camera } from 'lucide-react-native';
import { AI_PART_ANALYSIS_ENABLED } from '../config/features';
import PartAnalysisService, { PartAnalysisError } from '../services/PartAnalysisService';
import {
    mechanicButton,
    mechanicButtonText,
    mechanicSpacing,
    useMechanicTheme,
} from '../screens/mechanic/mechanicTheme';
import { PartAnalysis } from '../types/inventory.types';
import { showAlert } from '../utils/platformHelpers';

export interface PartPhoto {
    uri: string;
    fileName?: string;
}

export interface PartPhotoScanButtonProps {
    /** Dati letti dalla foto: precompilano il form, il salvataggio resta al meccanico */
    onResult: (analysis: PartAnalysis, photo: PartPhoto) => void;
    /** Analisi fallita: la foto è buona comunque e va tenuta, i dati si compilano a mano */
    onPhotoOnly?: (photo: PartPhoto) => void;
    /** Messaggio già tradotto, mostrato anche sotto il pulsante */
    onError?: (message: string) => void;
    disabled?: boolean;
}

// Su web launchCameraAsync aggiunge capture al campo file: i browser mobili aprono solo
// la fotocamera. Senza capture il browser offre sia la fotocamera sia la galleria
const pickPhoto = () =>
    Platform.OS === 'web'
        ? ExpoImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 })
        : ExpoImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.9 });

const SCAN_LABEL = Platform.OS === 'web' ? 'Scegli una foto e compila' : 'Scatta e compila';

const explainComingSoon = () =>
    showAlert(
        'Compilazione automatica con AI',
        'Fotografi il pezzo o la sua etichetta e l\'AI compila nome, marca, codice, matricola, categoria e provenienza. '
            + 'La foto viene inviata a un servizio AI esterno per la lettura. I dati non leggibili restano vuoti, e tu li controlli prima di salvare.\n\n'
            + 'La funzione non è ancora attiva: per ora puoi inserire i dati a mano.',
        [{ text: 'Ho capito' }]
    );

export const PartPhotoScanButton: React.FC<PartPhotoScanButtonProps> = ({
    onResult,
    onPhotoOnly,
    onError,
    disabled = false,
}) => {
    const theme = useMechanicTheme();
    const [isLoading, setIsLoading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fail = (message: string) => {
        setError(message);
        onError?.(message);
    };

    const scan = async () => {
        setError(null);
        setIsLoading(true);
        let photo: PartPhoto | undefined;
        try {
            if (Platform.OS !== 'web') {
                const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
                if (status !== 'granted') {
                    fail('Consenti l\'accesso alla fotocamera per scattare la foto.');
                    return;
                }
            }

            const result = await pickPhoto();
            const asset = result.canceled ? undefined : result.assets?.[0];
            if (!asset) return;

            photo = { uri: asset.uri, fileName: asset.fileName ?? undefined };
            const analysis = await PartAnalysisService.analyzePhoto(photo.uri);
            onResult(analysis, photo);
        } catch (scanError) {
            const message = scanError instanceof PartAnalysisError
                ? scanError.message
                : 'Analisi non riuscita. Compila i dati a mano.';
            if (photo && onPhotoOnly) {
                onPhotoOnly(photo);
                fail(`${message} La foto resta allegata.`);
            } else {
                fail(message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isDisabled = disabled || isLoading;

    return (
        <View style={styles.container}>
            <Pressable
                accessibilityRole="button"
                accessibilityLabel={isLoading ? 'Analisi in corso' : SCAN_LABEL}
                accessibilityHint={AI_PART_ANALYSIS_ENABLED
                    ? 'Usa una foto del ricambio o della sua etichetta per precompilare i campi'
                    : 'Funzione in arrivo: mostra cosa farà'}
                accessibilityState={{ disabled: isDisabled, busy: isLoading }}
                disabled={isDisabled}
                onPress={AI_PART_ANALYSIS_ENABLED ? scan : explainComingSoon}
                onHoverIn={() => setIsHovered(true)}
                onHoverOut={() => setIsHovered(false)}
                style={({ pressed }) => [
                    mechanicButton.primary,
                    {
                        backgroundColor: disabled
                            ? theme.disabled
                            : pressed || isHovered
                                ? theme.primaryDark
                                : theme.primary,
                    },
                ]}
            >
                {isLoading ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                    <Camera size={20} color={disabled ? theme.textSecondary : theme.onPrimary} />
                )}
                <Text
                    style={[
                        mechanicButtonText.primary,
                        { color: disabled ? theme.textSecondary : theme.onPrimary },
                    ]}
                >
                    {isLoading ? 'Analisi in corso…' : SCAN_LABEL}
                </Text>
            </Pressable>

            <Text style={[styles.hint, { color: theme.textSecondary }]}>
                {AI_PART_ANALYSIS_ENABLED ? 'Controlla i dati prima di salvare.' : 'In arrivo: tocca per sapere di più.'}
            </Text>

            {error && (
                <Text
                    accessibilityRole="alert"
                    accessibilityLiveRegion="polite"
                    style={[styles.error, { color: theme.error }]}
                >
                    {error}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: mechanicSpacing.sm,
    },
    hint: {
        fontSize: 13,
        textAlign: 'center',
    },
    error: {
        fontSize: 14,
        textAlign: 'center',
    },
});

export default PartPhotoScanButton;
