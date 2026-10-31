// src/screens/mechanic/MechanicProfileScreen.tsx
// Schermata profilo meccanico con gestione officina - Design Liquid Glass

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
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
import { refreshAuthUser, useAuth } from '../../hooks/useAuth';
import { useStore } from '../../store';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';

import { useMechanicTheme, mechanicButton, mechanicRadius, useMechanicBreakpoints } from './mechanicTheme';
import MechanicTextInput from './MechanicTextInput';
import { MechanicLoadingState } from './MechanicStates';
import MechanicHeader from './MechanicHeader';
import { showAlert } from '../../utils/platformHelpers';
const ProfileCard = ({ children, style }: any) => {
  const theme = useMechanicTheme();

  return (
    <View
      style={[
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
          borderRadius: mechanicRadius.xl,
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
  const { isMobile } = useMechanicBreakpoints();
  const { user, signOut } = useAuth();
  const theme = useMechanicTheme();

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
  const isLargeScreen = !isMobile;


  useEffect(() => {
    loadProfile();
  }, [user?.uid]);

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
      showAlert('Errore', 'Impossibile caricare il profilo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.uid) return;

    if (!workshopName.trim()) {
      showAlert('Errore', 'Inserisci il nome dell\'officina');
      return;
    }

    if (!address.trim() || !city.trim()) {
      showAlert('Errore', 'Inserisci indirizzo e città dell\'officina');
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
        // name ha la precedenza su displayName in buildUserDisplayName
        updateData.name = updateData.displayName;
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

      // Sidebar e dashboard leggono da useAuth, non da questa schermata
      await refreshAuthUser();

      showAlert('Successo', 'Profilo aggiornato con successo');
      setEditMode(false);
      await loadProfile();
    } catch (error) {
      console.error('Errore salvataggio:', error);
      showAlert('Errore', 'Impossibile salvare le modifiche');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    showAlert(
      'Disconnetti',
      'Sei sicuro di voler uscire?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Disconnetti',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Errore logout:', error);
              showAlert('Errore', 'Impossibile disconnettersi');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <MechanicHeader title="Profilo Meccanico" onBack={() => navigation.goBack()} />
        <MechanicLoadingState text="Caricamento profilo..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.gradient}>
        <MechanicHeader
          title="Profilo Meccanico"
          onBack={() => navigation.goBack()}
          right={
            !editMode ? (
              <TouchableOpacity
                onPress={() => setEditMode(true)}
                style={[styles.editButton, { backgroundColor: theme.primaryLight }]}
                accessibilityRole="button"
                accessibilityLabel="Modifica profilo"
              >
                <Edit3 size={20} color={theme.onPrimaryLight} />
                <Text style={[styles.editButtonText, { color: theme.onPrimaryLight }]}>
                  Modifica
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={handleSave}
                style={[styles.saveButton, { backgroundColor: theme.primary }]}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Salva profilo"
              >
                {saving ? (
                  <ActivityIndicator size="small" color={theme.onPrimary} />
                ) : (
                  <>
                    <Save size={20} color={theme.onPrimary} />
                    <Text style={styles.saveButtonText}>Salva</Text>
                  </>
                )}
              </TouchableOpacity>
            )
          }
        />

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
              <ProfileCard style={styles.statsCard}>
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
              </ProfileCard>
            )}

            {/* Dati Personali */}
            <ProfileCard style={styles.card}>
              <View style={styles.cardHeader}>
                <User size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Dati Personali
                </Text>
              </View>

              <View style={styles.cardContent}>
                <MechanicTextInput
                  left={<User size={20} color={theme.primary} />}
                  placeholder="Nome"
                  value={firstName}
                  onChangeText={setFirstName}
                  editable={editMode}
                />

                <MechanicTextInput
                  left={<User size={20} color={theme.primary} />}
                  placeholder="Cognome"
                  value={lastName}
                  onChangeText={setLastName}
                  editable={editMode}
                />

                <MechanicTextInput
                  left={<Mail size={20} color={theme.primary} />}
                  style={{ color: theme.textSecondary }}
                  value={profile?.email || ''}
                  editable={false}
                />

                <MechanicTextInput
                  left={<Phone size={20} color={theme.primary} />}
                  placeholder="Telefono"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={editMode}
                />
              </View>
            </ProfileCard>

            {/* Dati Officina */}
            <ProfileCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Building2 size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Dati Officina
                </Text>
              </View>

              <View style={styles.cardContent}>
                <MechanicTextInput
                  left={<Briefcase size={20} color={theme.primary} />}
                  placeholder="Nome Officina"
                  value={workshopName}
                  onChangeText={setWorkshopName}
                  editable={editMode}
                />

                <MechanicTextInput
                  left={<Clock size={20} color={theme.primary} />}
                  placeholder="Orari (es. Lun-Ven 8:00-18:00)"
                  value={openingHours}
                  onChangeText={setOpeningHours}
                  editable={editMode}
                />
              </View>
            </ProfileCard>

            {/* Posizione Officina */}
            <ProfileCard style={styles.card}>
              <View style={styles.cardHeader}>
                <MapPin size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Posizione Officina
                </Text>
              </View>

              <View style={styles.cardContent}>
                <MechanicTextInput
                  left={<Navigation size={20} color={theme.primary} />}
                  placeholder="Indirizzo"
                  value={address}
                  onChangeText={setAddress}
                  editable={editMode}
                />

                <MechanicTextInput
                  left={<MapPin size={20} color={theme.primary} />}
                  placeholder="Città"
                  value={city}
                  onChangeText={setCity}
                  editable={editMode}
                />

                <View style={styles.twoColumns}>
                  <MechanicTextInput
                    containerStyle={styles.inputHalf}
                    placeholder="Provincia"
                    value={province}
                    onChangeText={setProvince}
                    editable={editMode}
                    maxLength={2}
                  />

                  <MechanicTextInput
                    containerStyle={styles.inputHalf}
                    placeholder="CAP"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="numeric"
                    editable={editMode}
                    maxLength={5}
                  />
                </View>
              </View>
            </ProfileCard>

            {/* Dati Professionali */}
            <ProfileCard style={styles.card}>
              <View style={styles.cardHeader}>
                <Award size={20} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Dati Professionali
                </Text>
              </View>

              <View style={styles.cardContent}>
                <MechanicTextInput
                  left={<Briefcase size={20} color={theme.primary} />}
                  placeholder="P.IVA"
                  value={vatNumber}
                  onChangeText={setVatNumber}
                  editable={editMode}
                />

                <MechanicTextInput
                  left={<Shield size={20} color={theme.primary} />}
                  placeholder="Numero Patentino"
                  value={mechanicLicense}
                  onChangeText={setMechanicLicense}
                  editable={editMode}
                />
              </View>
            </ProfileCard>

            {/* Logout Button */}
            <TouchableOpacity
              style={[styles.logoutButton, { backgroundColor: theme.error }]}
              onPress={handleLogout}
            >
              <LogOut size={20} color={theme.onPrimary} />
              <Text style={styles.logoutButtonText}>Disconnetti</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
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
  editButton: mechanicButton.header,
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: mechanicButton.header,
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
  twoColumns: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  logoutButton: {
    ...mechanicButton.primary,
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
