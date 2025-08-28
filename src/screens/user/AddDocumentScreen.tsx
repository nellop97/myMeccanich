import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Controller, useForm } from 'react-hook-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DocumentPicker } from '../../components/DocumentPicker';
import { ImagePicker } from '../../components/ImagePicker';

// Icone locali come componenti di testo
const ArrowLeftIcon = () => (
  <Text style={styles.iconText}>←</Text>
);

const CalendarIcon = () => (
  <Text style={styles.iconText}>📅</Text>
);

const CameraIcon = () => (
  <Text style={styles.iconText}>📷</Text>
);

const UploadIcon = () => (
  <Text style={styles.iconText}>📤</Text>
);

const FileIcon = () => (
  <Text style={styles.iconText}>📄</Text>
);

const ImageIcon = () => (
  <Text style={styles.iconText}>🖼️</Text>
);

const TrashIcon = () => (
  <Text style={styles.iconText}>🗑️</Text>
);

const SaveIcon = () => (
  <Text style={styles.iconText}>💾</Text>
);

// Componenti locali
const ModernButton = ({ 
  title, 
  onPress, 
  type = 'primary', 
  icon = null, 
  disabled = false,
  fullWidth = false
}) => (
  <TouchableOpacity
    style={[
      styles.modernButton,
      type === 'secondary' && styles.secondaryButton,
      type === 'danger' && styles.dangerButton,
      fullWidth && styles.fullWidthButton,
      disabled && styles.disabledButton
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    {icon && <View style={styles.buttonIcon}>{icon}</View>}
    <Text style={[
      styles.modernButtonText,
      type === 'secondary' && styles.secondaryButtonText,
      type === 'danger' && styles.dangerButtonText,
      disabled && styles.disabledButtonText
    ]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const ModernCard = ({ children, title }) => (
  <View style={styles.modernCard}>
    {title && <Text style={styles.cardTitle}>{title}</Text>}
    {children}
  </View>
);

const ModernInput = ({ 
  label, 
  placeholder, 
  value, 
  onChangeText, 
  error, 
  required = false,
  multiline = false,
  keyboardType = 'default'
}) => (
  <View style={styles.inputContainer}>
    <Text style={styles.inputLabel}>
      {label}
      {required && <Text style={styles.requiredStar}> *</Text>}
    </Text>
    <TextInput
      style={[
        styles.modernInput,
        multiline && styles.multilineInput,
        error && styles.inputError
      ]}
      placeholder={placeholder}
      placeholderTextColor="#A0A0A0"
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// Tipi documento
const documentTypes = [
  { value: 'insurance', label: 'Assicurazione', color: '#34C759' },
  { value: 'registration', label: 'Documenti Auto', color: '#007AFF' },
  { value: 'inspection', label: 'Revisione', color: '#5AC8FA' },
  { value: 'warranty', label: 'Garanzia', color: '#9B59B6' },
  { value: 'other', label: 'Altro', color: '#6B7280' }
];

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
  
  const [showIssueDatePicker, setShowIssueDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Normalmente otterresti questi dati dal tuo store
  const car = { make: 'Toyota', model: 'Yaris' }; // Placeholder
  
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
  
  const onSubmit = async (data: DocumentFormData) => {
    try {
      setIsUploading(true);
      
      // Simula l'upload del file
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simula il successo
      Alert.alert(
        'Successo',
        'Documento aggiunto con successo!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
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
      setValue('issueDate', date.toISOString().split('T')[0]);
    }
  };
  
  const handleExpiryDateChange = (event: any, date?: Date) => {
    setShowExpiryDatePicker(false);
    if (date) {
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header moderno */}
      <View style={styles.modernHeader}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeftIcon />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Aggiungi Documento</Text>
          <Text style={styles.headerSubtitle}>{car.make} {car.model}</Text>
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>📄 Documenti del Veicolo</Text>
          <Text style={styles.infoText}>
            Carica e organizza tutti i documenti importanti del tuo veicolo come assicurazione,
            libretto di circolazione, certificati di revisione e altro ancora.
          </Text>
        </View>
        
        {/* Tipo Documento */}
        <ModernCard title="Tipo Documento">
          <View style={styles.documentTypeGrid}>
            {documentTypes.map(type => {
              const isSelected = watchType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.documentTypeOption,
                    isSelected && styles.documentTypeSelected,
                    isSelected && { borderColor: type.color }
                  ]}
                  onPress={() => setValue('type', type.value as any)}
                >
                  <View style={[styles.documentTypeIcon, { backgroundColor: type.color }]}>
                    <Text style={styles.documentTypeEmoji}>
                      {type.value === 'insurance' ? '🛡️' : 
                       type.value === 'registration' ? '🚗' : 
                       type.value === 'inspection' ? '✅' : 
                       type.value === 'warranty' ? '💳' : '📄'}
                    </Text>
                  </View>
                  <Text style={styles.documentTypeLabel}>{type.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ModernCard>
        
        {/* Informazioni Documento */}
        <ModernCard title="Informazioni Documento">
          <Controller
            control={control}
            rules={{ required: 'Campo obbligatorio' }}
            render={({ field: { onChange, value } }) => (
              <ModernInput
                label="Nome Documento"
                placeholder="es. Assicurazione 2024"
                value={value}
                onChangeText={onChange}
                error={errors.name?.message}
                required
              />
            )}
            name="name"
          />
          
          <View style={styles.rowContainer}>
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                render={({ field: { value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Data Emissione</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowIssueDatePicker(true)}
                    >
                      <CalendarIcon />
                      <Text style={styles.dateButtonText}>
                        {formatDate(value)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                name="issueDate"
              />
            </View>
            
            <View style={styles.halfWidth}>
              <Controller
                control={control}
                render={({ field: { value } }) => (
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Data Scadenza</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowExpiryDatePicker(true)}
                    >
                      <CalendarIcon />
                      <Text style={styles.dateButtonText}>
                        {formatDate(value)}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                name="expiryDate"
              />
            </View>
          </View>
          
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <ModernInput
                label="Numero Documento"
                placeholder="es. 12345678"
                value={value}
                onChangeText={onChange}
                keyboardType="default"
              />
            )}
            name="documentNumber"
          />
          
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <ModernInput
                label="Ente Emittente"
                placeholder="es. ACI, Comune di..."
                value={value}
                onChangeText={onChange}
              />
            )}
            name="issuer"
          />
        </ModernCard>
        
        {/* File Upload */}
        <ModernCard title="Allegato">
          {selectedFile ? (
            <View style={styles.selectedFileContainer}>
              <View style={styles.fileInfo}>
                {selectedFile.mimeType?.startsWith('image/') ? (
                  <ImageIcon />
                ) : (
                  <FileIcon />
                )}
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {selectedFile.name}
                  </Text>
                  <Text style={styles.fileSize}>
                    {formatFileSize(selectedFile.size || 0)}
                  </Text>
                </View>
              </View>
              <ModernButton
                title="Rimuovi"
                type="danger"
                icon={<TrashIcon />}
                onPress={() => setSelectedFile(null)}
              />
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.uploadButton}
              onPress={showFilePicker}
            >
              <UploadIcon />
              <Text style={styles.uploadButtonTitle}>Aggiungi File</Text>
              <Text style={styles.uploadButtonSubtitle}>
                Tocca per scegliere foto, documento o scattare una foto
              </Text>
            </TouchableOpacity>
          )}
        </ModernCard>
        
        {/* Note */}
        <ModernCard title="Note">
          <Controller
            control={control}
            render={({ field: { onChange, value } }) => (
              <ModernInput
                label="Note Aggiuntive"
                placeholder="Inserisci eventuali note..."
                value={value}
                onChangeText={onChange}
                multiline
              />
            )}
            name="notes"
          />
        </ModernCard>
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <ModernButton
          title="Annulla"
          type="secondary"
          onPress={() => navigation.goBack()}
        />
        <ModernButton
          title={isUploading ? 'Salvataggio...' : 'Salva Documento'}
          icon={<SaveIcon />}
          onPress={handleSubmit(onSubmit)}
          disabled={isUploading}
        />
      </View>
      
      {/* Date Pickers */}
      {showIssueDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleIssueDateChange}
        />
      )}
      
      {showExpiryDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleExpiryDateChange}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Layout principale
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  
  // Header moderno
  modernHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  
  // Card moderna
  modernCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
  },
  
  // Input moderni
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  requiredStar: {
    color: '#EF4444',
  },
  modernInput: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 6,
  },
  
  // Layout
  rowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  halfWidth: {
    flex: 1,
  },
  
  // Tipo documento
  documentTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  documentTypeOption: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  documentTypeSelected: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
  },
  documentTypeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  documentTypeEmoji: {
    fontSize: 24,
  },
  documentTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  
  // Date button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  
  // Upload file
  uploadButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#EFF6FF',
  },
  uploadButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadButtonSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  fileDetails: {
    marginLeft: 12,
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Info card
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 15,
    color: '#3B82F6',
    lineHeight: 22,
  },
  
  // Bottoni moderni
  modernButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.1,
  },
  dangerButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  fullWidthButton: {
    flex: 1,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  modernButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#374151',
  },
  dangerButtonText: {
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#FFFFFF',
  },
  buttonIcon: {
    marginRight: 8,
  },
  
  // Action buttons
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  
  // Icone
  iconText: {
    fontSize: 20,
  },
});

export default AddDocumentScreen;