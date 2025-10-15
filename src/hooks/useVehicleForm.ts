// src/hooks/useVehicleForm.ts
// Hook personalizzato per gestire lo stato del form di aggiunta veicolo

import { useState, useCallback, useMemo } from 'react';
import { VehicleFormData, AddVehicleStep } from '../types/addVehicle.types';
import {
    validateStep1,
    validateStep2,
    validateStep3,
    validateCompleteForm,
    ValidationResult,
} from '../utils/validationUtils';

interface UseVehicleFormOptions {
    initialData?: Partial<VehicleFormData>;
    onSubmit?: (data: VehicleFormData) => Promise<void>;
}

export const useVehicleForm = (options: UseVehicleFormOptions = {}) => {
    const { initialData, onSubmit } = options;

    // Form data state
    const [formData, setFormData] = useState<VehicleFormData>({
        make: '',
        model: '',
        year: new Date().getFullYear(),
        licensePlate: '',
        fuelType: '',
        transmission: '',
        ...initialData,
    });

    // Current step state
    const [currentStep, setCurrentStep] = useState(1);

    // Steps state
    const [steps, setSteps] = useState<AddVehicleStep[]>([
        { id: 1, title: 'Dati Base', isValid: false, isCompleted: false },
        { id: 2, title: 'Dettagli Tecnici', isValid: false, isCompleted: false },
        { id: 3, title: 'Scadenze', isValid: true, isCompleted: false },
        { id: 4, title: 'Riepilogo', isValid: true, isCompleted: false },
    ]);

    // Validation errors state
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Submitting state
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ============================================
    // FORM DATA UPDATES
    // ============================================

    const updateFormData = useCallback((data: Partial<VehicleFormData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
        // Pulisci errori relativi ai campi aggiornati
        setErrors((prev) => {
            const newErrors = { ...prev };
            Object.keys(data).forEach((key) => {
                delete newErrors[key];
            });
            return newErrors;
        });
    }, []);

    const resetForm = useCallback(() => {
        setFormData({
            make: '',
            model: '',
            year: new Date().getFullYear(),
            licensePlate: '',
            fuelType: '',
            transmission: '',
        });
        setCurrentStep(1);
        setErrors({});
        setSteps([
            { id: 1, title: 'Dati Base', isValid: false, isCompleted: false },
            { id: 2, title: 'Dettagli Tecnici', isValid: false, isCompleted: false },
            { id: 3, title: 'Scadenze', isValid: true, isCompleted: false },
            { id: 4, title: 'Riepilogo', isValid: true, isCompleted: false },
        ]);
    }, []);

    // ============================================
    // VALIDATION
    // ============================================

    const validateCurrentStep = useCallback((): ValidationResult => {
        let result: ValidationResult;

        switch (currentStep) {
            case 1:
                result = validateStep1(formData);
                break;
            case 2:
                result = validateStep2(formData);
                break;
            case 3:
                result = validateStep3(formData);
                break;
            case 4:
                result = validateCompleteForm(formData);
                break;
            default:
                result = { isValid: false, errors: {} };
        }

        setErrors(result.errors);
        return result;
    }, [currentStep, formData]);

    // Computed: is current step valid
    const isCurrentStepValid = useMemo(() => {
        const result = validateCurrentStep();
        return result.isValid;
    }, [validateCurrentStep]);

    // ============================================
    // NAVIGATION
    // ============================================

    const goToNextStep = useCallback(() => {
        const validation = validateCurrentStep();

        if (!validation.isValid) {
            return false; // Validation failed
        }

        // Mark current step as completed
        setSteps((prevSteps) =>
            prevSteps.map((step) =>
                step.id === currentStep
                    ? { ...step, isValid: true, isCompleted: true }
                    : step
            )
        );

        // Move to next step
        if (currentStep < 4) {
            setCurrentStep(currentStep + 1);
        }

        return true;
    }, [currentStep, validateCurrentStep]);

    const goToPreviousStep = useCallback(() => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    }, [currentStep]);

    const goToStep = useCallback((stepNumber: number) => {
        if (stepNumber >= 1 && stepNumber <= 4) {
            setCurrentStep(stepNumber);
        }
    }, []);

    // ============================================
    // SUBMISSION
    // ============================================

    const handleSubmit = useCallback(async () => {
        // Final validation
        const validation = validateCompleteForm(formData);

        if (!validation.isValid) {
            setErrors(validation.errors);
            return false;
        }

        if (!onSubmit) {
            console.warn('No onSubmit handler provided');
            return false;
        }

        setIsSubmitting(true);

        try {
            await onSubmit(formData);
            return true;
        } catch (error) {
            console.error('Error submitting form:', error);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, onSubmit]);

    // ============================================
    // UTILITIES
    // ============================================

    const getFieldError = useCallback(
        (fieldName: string): string | undefined => {
            return errors[fieldName];
        },
        [errors]
    );

    const hasErrors = useMemo(() => {
        return Object.keys(errors).length > 0;
    }, [errors]);

    const completionPercentage = useMemo(() => {
        const completedSteps = steps.filter((s) => s.isCompleted).length;
        return Math.round((completedSteps / steps.length) * 100);
    }, [steps]);

    // ============================================
    // RETURN
    // ============================================

    return {
        // Form data
        formData,
        updateFormData,
        resetForm,

        // Steps
        currentStep,
        steps,
        goToNextStep,
        goToPreviousStep,
        goToStep,

        // Validation
        errors,
        getFieldError,
        hasErrors,
        isCurrentStepValid,
        validateCurrentStep,

        // Submission
        isSubmitting,
        handleSubmit,

        // Utilities
        completionPercentage,
    };
};

// ============================================
// EXAMPLE USAGE
// ============================================

/*
// In AddVehicleScreen.tsx

import { useVehicleForm } from '../../hooks/useVehicleForm';

const AddVehicleScreen = () => {
  const {
    formData,
    updateFormData,
    currentStep,
    steps,
    goToNextStep,
    goToPreviousStep,
    isSubmitting,
    handleSubmit,
    errors,
    getFieldError,
  } = useVehicleForm({
    onSubmit: async (data) => {
      // Save to Firestore
      const docRef = await addDoc(collection(db, 'vehicles'), data);
      console.log('Vehicle saved:', docRef.id);
    },
  });

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <VehicleBasicInfoStep
            formData={formData}
            updateFormData={updateFormData}
            onNext={goToNextStep}
            errors={errors}
            getFieldError={getFieldError}
          />
        );
      // ... other steps
    }
  };

  return (
    <View>
      <StepIndicator steps={steps} currentStep={currentStep} />
      {renderStep()}
    </View>
  );
};
*/