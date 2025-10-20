// src/components/UploadProgressIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ProgressBar } from 'react-native-paper';
import { CheckCircle, AlertCircle, Loader, X } from 'lucide-react-native';
import { useAppThemeManager } from '../hooks/useTheme';

interface Props {
    fileName: string;
    progress: number; // 0-100
    status: 'uploading' | 'success' | 'error';
    errorMessage?: string;
    onCancel?: () => void;
    onRetry?: () => void;
}

export const UploadProgressIndicator: React.FC<Props> = ({
                                                             fileName,
                                                             progress,
                                                             status,
                                                             errorMessage,
                                                             onCancel,
                                                             onRetry,
                                                         }) => {
    const { colors } = useAppThemeManager();

    const getStatusIcon = () => {
        switch (status) {
            case 'uploading':
                return <Loader size={18} color={colors.primary} />;
            case 'success':
                return <CheckCircle size={18} color="#4CAF50" />;
            case 'error':
                return <AlertCircle size={18} color="#F44336" />;
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'uploading':
                return `${Math.round(progress)}%`;
            case 'success':
                return 'Completato';
            case 'error':
                return errorMessage || 'Errore';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'uploading':
                return colors.primary;
            case 'success':
                return '#4CAF50';
            case 'error':
                return '#F44336';
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    {getStatusIcon()}
                </View>

                <View style={styles.infoContainer}>
                    <Text
                        style={[styles.fileName, { color: colors.onSurface }]}
                        numberOfLines={1}
                    >
                        {fileName}
                    </Text>
                    <Text style={[styles.statusText, { color: getStatusColor() }]}>
                        {getStatusText()}
                    </Text>
                </View>

                {status === 'uploading' && onCancel && (
                    <TouchableOpacity
                        onPress={onCancel}
                        style={styles.actionButton}
                    >
                        <X size={18} color={colors.onSurfaceVariant} />
                    </TouchableOpacity>
                )}

                {status === 'error' && onRetry && (
                    <TouchableOpacity
                        onPress={onRetry}
                        style={styles.retryButton}
                    >
                        <Text style={[styles.retryText, { color: colors.primary }]}>
                            Riprova
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {status === 'uploading' && (
                <ProgressBar
                    progress={progress / 100}
                    color={colors.primary}
                    style={styles.progressBar}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 12,
        borderRadius: 8,
        marginVertical: 4,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 12,
    },
    infoContainer: {
        flex: 1,
    },
    fileName: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 2,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButton: {
        padding: 4,
    },
    retryButton: {
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    retryText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBar: {
        height: 4,
        borderRadius: 2,
        marginTop: 8,
    },
});