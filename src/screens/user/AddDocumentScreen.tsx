// src/screens/user/AddDocumentScreen.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Alert,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Save,
  Camera,
  Upload,
  Shield,
  Car,
  CheckCircle,
  CreditCard,
  Image,
  Film,
  Clipboard,
  Info
} from 'lucide-react-native';

import { useStore } from '../../store';
import { useUserCarsStore } from '@/src/store/useCarsStore';

const { width: screenWidth } = Dimensions.get('window');

interface RouteParams {
  carId: string;
}

interface DocumentFormData {
  name: string;
  type: 'insurance' | 'registration' | 'inspection' | 'warranty' | 'other';
  issueDate: string;
  expiryDate: string;
  documentNumber: string;
  issuer: string;
  notes: string;
}

const AddDocumentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { carId } = route.params as RouteParams;
  const { darkMode } = useStore();
  const { addDocument, getCarById } = useUserCarsStore();

  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [issueDate, setIssueDate] = useState<Date | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  const car = getCarById(carId);

  const fallbackTheme = {
    background: darkMode ? '#121212' : '#f5f5f5',
    cardBackground: darkMode ? '#1e1e1e' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#a0a0a0' : '#666666',
    primary: '#007AFF',
    border: darkMode ? '#333333' : '#e0e0e0',
    error: '#FF3B30',
    success: '#34C759',
    warning: '#FF9500',
    info: '#5AC8FA'
  };

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<DocumentFormData>({
    defaultValues: {
      name: '',
      type: 'other',
      issueDate: '',
      expiryDate: '',
      documentNumber: '',
      issuer: '',
      notes: ''
    }
  });

  const watchType = watch('type');

  if (!car) {
    Alert.alert('Errore', 'Auto non trovata', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
    return null;
  }

  const documentTypes = [
    { value: 'insurance', label: 'Assicurazione', icon: Shield, color: fallbackTheme.success },
    { value: 'registration', label: 'Documenti Auto', icon: Car, color: fallbackTheme.primary },
    { value: 'inspection', label: 'Revisione', icon: CheckCircle, color: fallbackTheme.info },
    { value: 'warranty', label: 'Garanzia', icon: CreditCard, color: '#9B59B6' },
    { value: 'other', label: 'Altro', icon: FileText, color: fallbackTheme.textSecondary }
  ];

  const onSubmit = async (data: DocumentFormData) => {
    try {
      setIsUploading(true);

      // Simula l'upload del file (in una vera app, qui faresti l'upload su un server o storage cloud)
      let fileUrl = '';
      if (selectedFile) {
        // Simula l'upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        fileUrl = `local://documents/${Date.now()}_${selectedFile.name}`;
      }

      const documentData = {
        name: data.name,
        type: data.type,
        issueDate: data.issueDate,
        expiryDate: data.expiryDate || undefined,
        documentNumber: data.documentNumber || undefined,
        issuer: data.issuer || undefined,
        fileUrl: fileUrl || undefined,
        notes: data.notes || undefined
      };

      const documentId = addDocument(carId, documentData);

      Alert.alert(
        'Successo',
        'Documento aggiunto con successo!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Errore', 'Si è verificato un errore durante il salvataggio');
    } finally {
      setIsUploading(false);
    }
  };

  const handleIssueDateChange = (event: any, date?: Date) => {
    setShowIssueDatePicker(false);
    if (date) {
      setIssueDate(date);
      setValue('issueDate', date.toISOString().split('T')[0]);
    }
  };

  const handleExpiryDateChange = (event: any, date?: Date) => {
    setShowExpiryDatePicker(false);
    if (date) {
      setExpiryDate(date);
      setValue('expiryDate', date.toISOString().split('T')[0]);
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante la selezione del documento');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          name: `image_${Date.now()}.jpg`,
          size: result.assets[0].fileSize || 0,
          uri: result.assets[0].uri,
          mimeType: 'image/jpeg'
        });
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante la selezione dell\'immagine');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permesso necessario', 'È necessario il permesso della fotocamera per scattare foto');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile({
          name: `photo_${Date.now()}.jpg`,
          size: result.assets[0].fileSize || 0,
          uri: result.assets[0].uri,
          mimeType: 'image/jpeg'
        });
      }
    } catch (error) {
      Alert.alert('Errore', 'Errore durante lo scatto della foto');
    }
  };

  const showFilePicker = () => {
    Alert.alert(
      'Aggiungi File',
      'Scegli come aggiungere il documento',
      [
        { text: 'Scatta Foto', onPress: takePhoto },
        { text: 'Scegli Immagine', onPress: pickImage },
        { text: 'Scegli Documento', onPress: pickDocument },
        { text: 'Annulla', style: 'cancel' }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Seleziona data';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const DocumentTypeSelector = () => (
    <View style={styles.typeSelector}>
      <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>Tipo Documento</Text>
      <View style={styles.typeGrid}>
        {documentTypes.map(type => {
          const IconComponent = type.icon;
          const isSelected = watchType === type.value;
          
          return (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.typeOption,
                { 
                  backgroundColor: isSelected ? type.color + '20' : fallbackTheme.cardBackground,
                  borderColor: isSelected ? type.color : fallbackTheme.border
                }
              ]}
              onPress={() => setValue('type', type.value as any)}
            >
              <IconComponent 
                size={24} 
                color={isSelected ? type.color : fallbackTheme.textSecondary} 
              />
              <Text style={[
                styles.typeOptionText,
                { color: isSelected ? type.color : fallbackTheme.textSecondary }
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const FormInput = ({ label, error, children }: any) => (
    <View style={styles.inputContainer}>
      <Text style={[styles.inputLabel, { color: fallbackTheme.text }]}>{label}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: fallbackTheme.error }]}>{error.message}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: fallbackTheme.background }]}>
      <StatusBar barStyle={darkMode ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: fallbackTheme.cardBackground, borderBottomColor: fallbackTheme.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color={fallbackTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: fallbackTheme.text }]}>
            Aggiungi Documento
          </Text>
          <Text style={[styles.headerSubtitle, { color: fallbackTheme.textSecondary }]}>
            {car.make} {car.model}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: fallbackTheme.info + '10' }]}>
            <View style={styles.infoHeader}>
              <Info size={20} color={fallbackTheme.info} />
              <Text style={[styles.infoTitle, { color: fallbackTheme.info }]}>
                Documenti del Veicolo
              </Text>
            </View>
            <Text style={[styles.infoText, { color: fallbackTheme.text }]}>
              Carica e organizza tutti i documenti importanti del tuo veicolo come assicurazione, 
              libretto di circolazione, certificati di revisione e altro ancora.
            </Text>
          </View>

          {/* Document Type */}
          <View style={[styles.formCard, { backgroundColor: fallbackTheme.cardBackground }]}>
            <DocumentTypeSelector />
          </View>

          {/* Basic Information */}
          <View style={[styles.formCard, { backgroundColor: fallbackTheme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>
              Informazioni Documento
            </Text>

            <FormInput label="Nome Documento *" error={errors.name}>
              <Controller
                control={control}
                name="name"
                rules={{ required: 'Il nome del documento è obbligatorio' }}
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.textInput, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
                    <FileText size={20} color={fallbackTheme.textSecondary} />
                    <Text
                      style={[styles.textInputField, { color: fallbackTheme.text }]}
                      placeholder="Es: Assicurazione RCA 2024"
                      placeholderTextColor={fallbackTheme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
            </FormInput>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <FormInput label="Data Emissione *" error={errors.issueDate}>
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}
                    onPress={() => setShowIssueDatePicker(true)}
                  >
                    <Calendar size={20} color={fallbackTheme.textSecondary} />
                    <Text style={[styles.dateButtonText, { color: fallbackTheme.text }]}>
                      {formatDate(watch('issueDate'))}
                    </Text>
                  </TouchableOpacity>
                </FormInput>
              </View>

              <View style={styles.halfWidth}>
                <FormInput label="Data Scadenza">
                  <TouchableOpacity
                    style={[styles.dateButton, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}
                    onPress={() => setShowExpiryDatePicker(true)}
                  >
                    <Calendar size={20} color={fallbackTheme.textSecondary} />
                    <Text style={[styles.dateButtonText, { color: fallbackTheme.text }]}>
                      {formatDate(watch('expiryDate'))}
                    </Text>
                  </TouchableOpacity>
                </FormInput>
              </View>
            </View>

            <FormInput label="Numero Documento">
              <Controller
                control={control}
                name="documentNumber"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.textInput, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
                    <Clipboard size={20} color={fallbackTheme.textSecondary} />
                    <Text
                      style={[styles.textInputField, { color: fallbackTheme.text }]}
                      placeholder="Es: POL123456789"
                      placeholderTextColor={fallbackTheme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
            </FormInput>

            <FormInput label="Ente Emittente">
              <Controller
                control={control}
                name="issuer"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.textInput, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
                    <Shield size={20} color={fallbackTheme.textSecondary} />
                    <Text
                      style={[styles.textInputField, { color: fallbackTheme.text }]}
                      placeholder="Es: Generali Assicurazioni"
                      placeholderTextColor={fallbackTheme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                    />
                  </View>
                )}
              />
            </FormInput>
          </View>

          {/* File Upload */}
          <View style={[styles.formCard, { backgroundColor: fallbackTheme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: fallbackTheme.text }]}>
              Allegato
            </Text>

            {selectedFile ? (
              <View style={[styles.selectedFile, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
                <View style={styles.fileInfo}>
                  {selectedFile.mimeType?.startsWith('image/') ? (
                    <Image size={24} color={fallbackTheme.success} />
                  ) : (
                    <FileText size={24} color={fallbackTheme.primary} />
                  )}
                  <View style={styles.fileDetails}>
                    <Text style={[styles.fileName, { color: fallbackTheme.text }]}>
                      {selectedFile.name}
                    </Text>
                    <Text style={[styles.fileSize, { color: fallbackTheme.textSecondary }]}>
                      {formatFileSize(selectedFile.size || 0)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.removeFileButton, { backgroundColor: fallbackTheme.error + '20' }]}
                  onPress={() => setSelectedFile(null)}
                >
                  <Text style={[styles.removeFileText, { color: fallbackTheme.error }]}>
                    Rimuovi
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.uploadButton, { backgroundColor: fallbackTheme.primary + '10', borderColor: fallbackTheme.primary }]}
                onPress={showFilePicker}
              >
                <Upload size={24} color={fallbackTheme.primary} />
                <Text style={[styles.uploadButtonText, { color: fallbackTheme.primary }]}>
                  Aggiungi File
                </Text>
                <Text style={[styles.uploadButtonSubtext, { color: fallbackTheme.textSecondary }]}>
                  Tocca per scegliere foto, documento o scattare una foto
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Notes */}
          <View style={[styles.formCard, { backgroundColor: fallbackTheme.cardBackground }]}>
            <FormInput label="Note">
              <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                  <View style={[styles.textArea, { backgroundColor: fallbackTheme.background, borderColor: fallbackTheme.border }]}>
                    <Text
                      style={[styles.textAreaField, { color: fallbackTheme.text }]}
                      placeholder="Note aggiuntive sul documento..."
                      placeholderTextColor={fallbackTheme.textSecondary}
                      value={value}
                      onChangeText={onChange}
                      multiline
                      numberOfLines={4}
                    />
                  </View>
                )}
              />
            </FormInput>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: fallbackTheme.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.cancelButtonText, { color: fallbackTheme.textSecondary }]}>
                Annulla
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: fallbackTheme.primary }]}
              onPress={handleSubmit(onSubmit)}
              disabled={isUploading}
            >
              <Save size={20} color="#ffffff" />
              <Text style={styles.saveButtonText}>
                {isUploading ? 'Salvataggio...' : 'Salva Documento'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Pickers */}
      {showIssueDatePicker && (
        <DateTimePicker
          value={issueDate || new Date()}
          mode="date"
          display="default"
          onChange={handleIssueDateChange}
        />
      )}

      {showExpiryDatePicker && (
        <DateTimePicker
          value={expiryDate || new Date()}
          mode="date"
          display="default"
          onChange={handleExpiryDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  textInputField: {
    flex: 1,
    fontSize: 16,
  },
  textArea: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
  },
  textAreaField: {
    fontSize: 16,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderRadius: 12,
    gap: 8,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderWidth: 2,
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  uploadButtonSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  selectedFile: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 14,
  },
  removeFileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeFileText: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
});

export default AddDocumentScreen;