// src/components/shared/StepIndicator.tsx
// Indicatore di progresso per wizard multipiattaforma

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Platform,
    useWindowDimensions,
} from 'react-native';
import { AddVehicleStep } from '../../types/addVehicle.types';

interface StepIndicatorProps {
    steps: AddVehicleStep[];
    currentStep: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ steps, currentStep }) => {
    const { width } = useWindowDimensions();
    const isMobile = width < 768;
    const isDesktop = width >= 1024;

    return (
        <View
            style={[
                styles.container,
                isDesktop && styles.containerDesktop,
            ]}
        >
            {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                    {/* Step Item */}
                    <View style={styles.stepItem}>
                        {/* Circle */}
                        <View
                            style={[
                                styles.stepCircle,
                                currentStep === step.id && styles.stepCircleActive,
                                step.isCompleted && styles.stepCircleCompleted,
                                currentStep > step.id &&
                                !step.isCompleted &&
                                styles.stepCirclePassed,
                            ]}
                        >
                            {step.isCompleted ? (
                                <Text style={styles.stepCheckmark}>✓</Text>
                            ) : (
                                <Text
                                    style={[
                                        styles.stepNumber,
                                        currentStep === step.id && styles.stepNumberActive,
                                        currentStep > step.id && styles.stepNumberPassed,
                                    ]}
                                >
                                    {step.id}
                                </Text>
                            )}
                        </View>

                        {/* Label - Show only on tablet/desktop or for current step on mobile */}
                        {(!isMobile || currentStep === step.id) && (
                            <Text
                                style={[
                                    styles.stepLabel,
                                    currentStep === step.id && styles.stepLabelActive,
                                    step.isCompleted && styles.stepLabelCompleted,
                                ]}
                            >
                                {step.title}
                            </Text>
                        )}
                    </View>

                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                        <View
                            style={[
                                styles.stepConnector,
                                step.isCompleted && styles.stepConnectorCompleted,
                                currentStep > step.id && styles.stepConnectorPassed,
                            ]}
                        />
                    )}
                </React.Fragment>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        paddingVertical: 24,
        paddingHorizontal: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 2,
            },
            web: {
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            },
        }),
    },
    containerDesktop: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
    },

    // Step Item
    stepItem: {
        alignItems: 'center',
        gap: 8,
    },

    // Circle
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    stepCircleActive: {
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        ...Platform.select({
            ios: {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
            web: {
                boxShadow: '0 2px 4px rgba(59,130,246,0.3)',
            },
        }),
    },
    stepCircleCompleted: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    stepCirclePassed: {
        backgroundColor: '#cbd5e1',
        borderColor: '#cbd5e1',
    },

    // Number/Checkmark
    stepNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: '#64748b',
    },
    stepNumberActive: {
        color: '#fff',
        fontWeight: '700',
    },
    stepNumberPassed: {
        color: '#94a3b8',
    },
    stepCheckmark: {
        fontSize: 18,
        color: '#fff',
        fontWeight: '700',
    },

    // Label
    stepLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
        textAlign: 'center',
    },
    stepLabelActive: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    stepLabelCompleted: {
        color: '#10b981',
        fontWeight: '600',
    },

    // Connector
    stepConnector: {
        flex: 1,
        height: 2,
        backgroundColor: '#e2e8f0',
        marginHorizontal: 8,
        minWidth: 24,
    },
    stepConnectorCompleted: {
        backgroundColor: '#10b981',
    },
    stepConnectorPassed: {
        backgroundColor: '#cbd5e1',
    },
});

export default StepIndicator;