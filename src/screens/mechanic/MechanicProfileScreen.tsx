// src/screens/mechanic/MechanicProfileScreen.tsx
// Schermata profilo meccanico con gestione officina - Design Liquid Glass

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Save,
  Edit3,
  Building2,
  Navigation,
  Clock,
  Star,
  Shield,
  Award,
  LogOut,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

// Glass Card Component
const GlassCard = ({ children, style }: any) => {
  const { darkMode } = useStore();

  return Platform.OS === 'web' || Platform.OS === 'ios' ? (
    <BlurView
      intensity={Platform.OS === 'web' ? 40 : darkMode ? 30 : 60}
      tint={darkMode ? 'dark' : 'light'}
      style={[
        {
          backgroundColor: darkMode
            ? 'rgba(30, 30, 30, 0.7)'
            : 'rgba(255, 255, 255, 0.7)',
          borderColor: darkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </BlurView>
  ) : (
    <View
      style={[
        {
          backgroundColor: darkMode
            ? 'rgba(30, 30, 30, 0.95)'
            : 'rgba(255, 255, 255, 0.95)',
          borderColor: darkMode
            ? 'rgba(255, 255, 255, 0.1)'
            : 'rgba(0, 0, 0, 0.05)',
          borderWidth: 1,
          borderRadius: 16,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

interface MechanicProfile {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  workshopName?: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  vatNumber?: string;
  mechanicLicense?: string;
  rating?: number;
  reviewsCount?: number;
  verified?: boolean;
  openingHours?: string;
}

const MechanicProfileScreen = () => {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { user, logout } = useAuth();
  const { darkMode } = useStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [workshopName, setWorkshopName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [vatNumber, setVatNumber] = useState('');
  const [mechanicLicense, setMechanicLicense] = useState('');
  const [openingHours, setOpeningHours] = useState('');

  // Responsive
  const isWeb = Platform.OS === 'web';
  const isLargeScreen = width >= 768;

  const theme = {
    background: darkMode ? '#0f172a' : '#f8fafc',
    surface: darkMode ? '#1e293b' : '#ffffff',
    card: darkMode ? '#334155' : '#ffffff',
    primary: '#3b82f6',
    primaryDark: '#1d4ed8',
    text: darkMode ? '#f1f5f9' : '#0f172a',
    textSecondary: darkMode ? '#94a3b8' : '#64748b',
    border: darkMode ? '#334155' : '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data() as MechanicProfile;
        setProfile(data);

        // Popola i campi del form
        setFirstName(data.firstName || '');
        setLastName(data.lastName || '');
        setPhone(data.phone || '');
        setWorkshopName(data.workshopName || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setProvince(data.province || '');
        setPostalCode(data.postalCode || '');
        setVatNumber(data.vatNumber || '');
        setMechanicLicense(data.mechanicLicense || '');
        setOpeningHours(data.openingHours || 'Lun-Ven 8:00-18:00');
      }
    } catch (error) {
      console.error('Errore caricamento profilo:', error);
      Alert.alert('Errore', 'Impossibile caricare il profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    if (!workshopName.trim()) {
      Alert.alert('Errore', 'Inserisci il nome dell\'officina');
      return;
    }

    if (!address.trim() || !city.trim()) {
      Alert.alert('Errore', 'Inserisci indirizzo e città dell\'officina');
      return;
    }

    try {
      setSaving(true);

      const userDocRef = doc(db, 'users', user.uid);
      const updateData: any = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        workshopName: workshopName.trim(),
        address: address.trim(),
        city: city.trim(),
        province: province.trim(),
        postalCode: postalCode.trim(),
        vatNumber: vatNumber.trim(),
        mechanicLicense: mechanicLicense.trim(),
        openingHours: openingHours.trim(),
        updatedAt: serverTimestamp(),
      };

      // Aggiorna displayName se nome e cognome sono presenti
      if (firstName.trim() && lastName.trim()) {
        updateData.displayName = `${firstName.trim()} ${lastName.trim()}`;
      }

      await updateDoc(userDocRef, updateData);

      // Aggiorna anche il documento workshop se esiste
      try {
        const workshopQuery = await getDoc(doc(db, 'workshops', user.uid));
        if (workshopQuery.exists()) {
          const workshopRef = doc(db, 'workshops', user.uid);
          await updateDoc(workshopRef, {
            name: workshopName.trim(),
            'address.street': address.trim(),
            'address.city': city.trim(),
            'address.province': province.trim(),
            'address.postalCode': postalCode.trim(),
            openingHours: openingHours.trim(),
            updatedAt: serverTimestamp(),
          });
        }
      } catch (workshopError) {
        console.log('Workshop non trovato o errore aggiornamento:', workshopError);
      }

      Alert.alert('Successo', 'Profilo aggiornato con successo');
      setEditMode(false);
      await loadProfile();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      Alert.alert('Errore', 'Impossibile salvare le modifiche');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Disconnetti',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Disconnetti',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Errore logout:', error);
              Alert.alert('Errore', 'Impossibile disconnettersi');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={darkMode ? ['#1a1a1a', '#0a0a0a'] : ['#f8f9fa', '#e9ecef']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={[styles.header, isWeb && styles.headerWeb]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              Profilo Meccanico
            </Text>
          </View>

          {!editMode ? (
            <TouchableOpacity
              onPress={() => setEditMode(true)}
              style={[styles.editButton, { backgroundColor: `${theme.primary}20` }]}
            >
              <Edit3 size={20} color={theme.primary} />
              <Text style={[styles.editButtonText, { color: theme.primary }]}>
                Modifica
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveButton, { backgroundColor: theme.success }]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Save size={20} color="white" />
                  <Text style={styles.saveButtonText}>Salva</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isWeb && isLargeScreen && styles.scrollContentWeb,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Stats Card */}
            {!editMode && (
              <GlassCard style={styles.statsCard}>
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: `${theme.warning}20` }]}>
                      <Star size={24} color={theme.warning} fill={theme.warning} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {profile?.rating?.toFixed(1) || '0.0'}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Rating
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: `${theme.primary}20` }]}>
                      <Award size={24} color={theme.primary} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {profile?.reviewsCount || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Recensioni
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: `${theme.success}20` }]}>
                      <Shield size={24} color={theme.success} />
                    </View>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                      {profile?.verified ? 'SÌ' : 'NO'}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                      Verificato
                    </Text>
                  </View>
                </View>
              </GlassCard>
            )}

            {/* Dati Personali */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <User size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Dati Personali
                </Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.inputRow}>
                  <User size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Nome"
                    placeholderTextColor={theme.textSecondary}
                    value={firstName}
                    onChangeText={setFirstName}
                    editable={editMode}
                  />
                </View>

                <View style={styles.inputRow}>
                  <User size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Cognome"
                    placeholderTextColor={theme.textSecondary}
                    value={lastName}
                    onChangeText={setLastName}
                    editable={editMode}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Mail size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.textSecondary }]}
                    value={profile?.email || ''}
                    editable={false}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Phone size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Telefono"
                    placeholderTextColor={theme.textSecondary}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    editable={editMode}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Dati Officina */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Building2 size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Dati Officina
                </Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.inputRow}>
                  <Briefcase size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Nome Officina"
                    placeholderTextColor={theme.textSecondary}
                    value={workshopName}
                    onChangeText={setWorkshopName}
                    editable={editMode}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Clock size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Orari (es. Lun-Ven 8:00-18:00)"
                    placeholderTextColor={theme.textSecondary}
                    value={openingHours}
                    onChangeText={setOpeningHours}
                    editable={editMode}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Posizione Officina */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <MapPin size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Posizione Officina
                </Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.inputRow}>
                  <Navigation size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Indirizzo"
                    placeholderTextColor={theme.textSecondary}
                    value={address}
                    onChangeText={setAddress}
                    editable={editMode}
                  />
                </View>

                <View style={styles.inputRow}>
                  <MapPin size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Città"
                    placeholderTextColor={theme.textSecondary}
                    value={city}
                    onChangeText={setCity}
                    editable={editMode}
                  />
                </View>

                <View style={styles.twoColumns}>
                  <View style={[styles.inputRow, styles.inputHalf]}>
                    <TextInput
                      style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                      placeholder="Provincia"
                      placeholderTextColor={theme.textSecondary}
                      value={province}
                      onChangeText={setProvince}
                      editable={editMode}
                      maxLength={2}
                    />
                  </View>

                  <View style={[styles.inputRow, styles.inputHalf]}>
                    <TextInput
                      style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                      placeholder="CAP"
                      placeholderTextColor={theme.textSecondary}
                      value={postalCode}
                      onChangeText={setPostalCode}
                      keyboardType="numeric"
                      editable={editMode}
                      maxLength={5}
                    />
                  </View>
                </View>
              </View>
            </GlassCard>

            {/* Dati Professionali */}
            <GlassCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Award size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Dati Professionali
                </Text>
              </View>

              <View style={styles.cardContent}>
                <View style={styles.inputRow}>
                  <Briefcase size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="P.IVA"
                    placeholderTextColor={theme.textSecondary}
                    value={vatNumber}
                    onChangeText={setVatNumber}
                    editable={editMode}
                  />
                </View>

                <View style={styles.inputRow}>
                  <Shield size={20} color={theme.primary} />
                  <TextInput
                    style={[styles.input, { color: theme.text, backgroundColor: editMode ? theme.border : 'transparent' }]}
                    placeholder="Numero Patentino"
                    placeholderTextColor={theme.textSecondary}
                    value={mechanicLicense}
                    onChangeText={setMechanicLicense}
                    editable={editMode}
                  />
                </View>
              </View>
            </GlassCard>

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.danger }]}
              onPress={handleLogout}
            >
              <LogOut size={20} color="white" />
              <Text style={styles.logoutButtonText}>Disconnetti</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerWeb: {
    paddingHorizontal: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  scrollContentWeb: {
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  statsCard: {
    marginBottom: 16,
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  cardContent: {
    gap: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default MechanicProfileScreen;
