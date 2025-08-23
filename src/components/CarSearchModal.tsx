
// src/components/CarSearchModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { carDataService } from '../services/CarDataService';

interface CarData {
  brand: string;
  model: string;
  year: string;
}

interface CarSearchModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (carData: CarData) => void;
  initialData?: Partial<CarData>;
  isDark?: boolean;
}

const CarSearchModal: React.FC<CarSearchModalProps> = ({
  visible,
  onClose,
  onSelect,
  initialData,
  isDark = false,
}) => {
  const [step, setStep] = useState(1); // 1: brand, 2: model, 3: year
  const [selectedBrand, setSelectedBrand] = useState(initialData?.brand || '');
  const [selectedModel, setSelectedModel] = useState(initialData?.model || '');
  const [selectedYear, setSelectedYear] = useState(initialData?.year || '');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  const theme = {
    background: isDark ? '#1f2937' : '#ffffff',
    surface: isDark ? '#374151' : '#f8fafc',
    text: isDark ? '#ffffff' : '#000000',
    textSecondary: isDark ? '#9ca3af' : '#6b7280',
    border: isDark ? '#4b5563' : '#e5e7eb',
    primary: '#3b82f6',
    primaryLight: isDark ? '#1e40af' : '#dbeafe',
  };

  // Reset quando il modal si apre
  useEffect(() => {
    if (visible) {
      setStep(1);
      setSearchQuery('');
      setSelectedBrand(initialData?.brand || '');
      setSelectedModel(initialData?.model || '');
      setSelectedYear(initialData?.year || '');
      loadBrands();
    }
  }, [visible]);

  // Carica marche
  const loadBrands = useCallback(async () => {
    setLoadingBrands(true);
    try {
      const brandsList = await carDataService.getBrands();
      setBrands(brandsList);
    } catch (error) {
      console.error('Errore caricamento marche:', error);
      Alert.alert('Errore', 'Impossibile caricare le marche auto');
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  // Carica modelli per la marca selezionata
  const loadModels = useCallback(async (brand: string) => {
    setLoadingModels(true);
    try {
      const modelsList = await carDataService.getModelsForBrand(brand);
      setModels(modelsList);
    } catch (error) {
      console.error('Errore caricamento modelli:', error);
      Alert.alert('Errore', 'Impossibile caricare i modelli');
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Carica anni per il modello selezionato
  const loadYears = useCallback(async (brand: string, model: string) => {
    setLoadingYears(true);
    try {
      const yearsList = await carDataService.getYearsForModel(brand, model);
      setYears(yearsList);
    } catch (error) {
      console.error('Errore caricamento anni:', error);
      Alert.alert('Errore', 'Impossibile caricare gli anni');
    } finally {
      setLoadingYears(false);
    }
  }, []);

  // Filtra risultati in base alla ricerca
  const getFilteredResults = () => {
    const query = searchQuery.toLowerCase().trim();
    
    switch (step) {
      case 1:
        return query ? 
          brands.filter(brand => brand.toLowerCase().includes(query)) :
          brands;
      case 2:
        return query ? 
          models.filter(model => model.toLowerCase().includes(query)) :
          models;
      case 3:
        return query ? 
          years.filter(year => year.toString().includes(query)) :
          years;
      default:
        return [];
    }
  };

  // Gestisce selezione marca
  const handleBrandSelect = async (brand: string) => {
    setSelectedBrand(brand);
    setSearchQuery('');
    setStep(2);
    await loadModels(brand);
  };

  // Gestisce selezione modello
  const handleModelSelect = async (model: string) => {
    setSelectedModel(model);
    setSearchQuery('');
    setStep(3);
    await loadYears(selectedBrand, model);
  };

  // Gestisce selezione anno
  const handleYearSelect = (year: number) => {
    setSelectedYear(year.toString());
    
    // Conferma selezione
    onSelect({
      brand: selectedBrand,
      model: selectedModel,
      year: year.toString(),
    });
    
    onClose();
  };

  // Torna al passaggio precedente
  const goBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setSearchQuery('');
    } else {
      onClose();
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return 'Seleziona Marca';
      case 2: return `Seleziona Modello per ${selectedBrand}`;
      case 3: return `Seleziona Anno per ${selectedBrand} ${selectedModel}`;
      default: return 'Seleziona Auto';
    }
  };

  const getStepIcon = () => {
    switch (step) {
      case 1: return 'car';
      case 2: return 'car-side';
      case 3: return 'calendar';
      default: return 'car';
    }
  };

  const isLoading = loadingBrands || loadingModels || loadingYears;
  const filteredResults = getFilteredResults();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goBack}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={theme.text}
            />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialCommunityIcons
              name={getStepIcon() as any}
              size={24}
              color={theme.primary}
              style={styles.headerIcon}
            />
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {getStepTitle()}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <MaterialCommunityIcons
              name="close"
              size={24}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {[1, 2, 3].map((stepNumber) => (
            <View
              key={stepNumber}
              style={[
                styles.progressStep,
                {
                  backgroundColor: stepNumber <= step ? theme.primary : theme.border,
                }
              ]}
            />
          ))}
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons
            name="magnify"
            size={20}
            color={theme.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder={`Cerca ${step === 1 ? 'marca' : step === 2 ? 'modello' : 'anno'}...`}
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color={theme.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Results */}
        <ScrollView
          style={styles.resultsContainer}
          contentContainerStyle={styles.resultsContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
                Caricamento...
              </Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="car-off"
                size={48}
                color={theme.textSecondary}
              />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nessun risultato trovato
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Prova con un termine di ricerca diverso
              </Text>
            </View>
          ) : (
            filteredResults.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.resultItem, { borderBottomColor: theme.border }]}
                onPress={() => {
                  if (step === 1) {
                    handleBrandSelect(item as string);
                  } else if (step === 2) {
                    handleModelSelect(item as string);
                  } else if (step === 3) {
                    handleYearSelect(item as number);
                  }
                }}
                activeOpacity={0.7}
              >
                <View style={styles.resultContent}>
                  <MaterialCommunityIcons
                    name={step === 1 ? 'car' : step === 2 ? 'car-side' : 'calendar'}
                    size={20}
                    color={theme.primary}
                    style={styles.resultIcon}
                  />
                  <Text style={[styles.resultText, { color: theme.text }]}>
                    {item}
                  </Text>
                </View>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={20}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultIcon: {
    marginRight: 12,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CarSearchModal;
