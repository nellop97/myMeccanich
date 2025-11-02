// src/screens/user/WorkshopSearchScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Star, Phone, Clock, Heart, Navigation, Search, X } from 'lucide-react-native';
import { useStore } from '../../store';
import WorkshopService from '../../services/WorkshopService';
import { Workshop } from '../../types/database.types';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';

interface WorkshopSearchScreenProps {
  navigation: any;
}

export default function WorkshopSearchScreen({ navigation }: WorkshopSearchScreenProps) {
  const { darkMode, user } = useStore();
  const [loading, setLoading] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [allWorkshops, setAllWorkshops] = useState<Workshop[]>([]);
  const [trustedWorkshops, setTrustedWorkshops] = useState<Workshop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'trusted' | 'nearby'>('all');

  const theme = {
    background: darkMode ? '#111827' : '#f3f4f6',
    cardBackground: darkMode ? '#1f2937' : '#ffffff',
    text: darkMode ? '#ffffff' : '#000000',
    textSecondary: darkMode ? '#9ca3af' : '#6b7280',
    border: darkMode ? '#374151' : '#e5e7eb',
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
  };

  useEffect(() => {
    loadWorkshops();
    loadTrustedWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const data = await WorkshopService.searchWorkshops({
        minRating: 0,
      });
      setAllWorkshops(data);
      setWorkshops(data);
    } catch (error) {
      console.error('Errore caricamento officine:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTrustedWorkshops = async () => {
    if (!user?.uid) return;
    try {
      const data = await WorkshopService.getTrustedWorkshops(user.uid);
      setTrustedWorkshops(data);
    } catch (error) {
      console.error('Errore caricamento officine di fiducia:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setWorkshops(allWorkshops);
      return;
    }

    // Filtra per ricerca case-insensitive su città, provincia, nome e indirizzo
    const searchLower = query.toLowerCase().trim();
    const filtered = allWorkshops.filter(workshop =>
      workshop.name?.toLowerCase().includes(searchLower) ||
      workshop.address?.city?.toLowerCase().includes(searchLower) ||
      workshop.address?.province?.toLowerCase().includes(searchLower) ||
      workshop.address?.street?.toLowerCase().includes(searchLower) ||
      workshop.specializations?.some(spec => spec.toLowerCase().includes(searchLower))
    );

    setWorkshops(filtered);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setWorkshops(allWorkshops);
  };

  const toggleTrusted = async (workshopId: string, isTrusted: boolean) => {
    if (!user?.uid) return;

    try {
      if (isTrusted) {
        await WorkshopService.removeFromTrustedWorkshops(user.uid, workshopId);
      } else {
        await WorkshopService.addToTrustedWorkshops(user.uid, workshopId);
      }
      await loadTrustedWorkshops();
      await loadWorkshops();
    } catch (error) {
      console.error('Errore gestione preferiti:', error);
    }
  };

  const getDisplayWorkshops = () => {
    switch (selectedFilter) {
      case 'trusted':
        return trustedWorkshops;
      case 'nearby':
        // Qui si potrebbe implementare il filtraggio per distanza
        return workshops;
      default:
        return workshops;
    }
  };

  const renderWorkshopCard = (workshop: Workshop) => {
    const isTrusted = trustedWorkshops.some(w => w.id === workshop.id);

    return (
      <TouchableOpacity
        key={workshop.id}
        style={[styles.workshopCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
        onPress={() => navigation.navigate('WorkshopDetail', { workshopId: workshop.id })}
      >
        {/* Header con logo e nome */}
        <View style={styles.workshopHeader}>
          <View style={styles.workshopInfo}>
            <Text style={[styles.workshopName, { color: theme.text }]} numberOfLines={1}>
              {workshop.name}
            </Text>
            <View style={styles.ratingContainer}>
              <Star size={16} color="#fbbf24" fill="#fbbf24" />
              <Text style={[styles.rating, { color: theme.text }]}>
                {workshop.rating.toFixed(1)}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.textSecondary }]}>
                ({workshop.reviewCount} recensioni)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => toggleTrusted(workshop.id, isTrusted)}
            style={styles.favoriteButton}
          >
            <Heart
              size={24}
              color={isTrusted ? '#ef4444' : theme.textSecondary}
              fill={isTrusted ? '#ef4444' : 'none'}
            />
          </TouchableOpacity>
        </View>

        {/* Indirizzo */}
        <View style={styles.addressContainer}>
          <MapPin size={16} color={theme.textSecondary} />
          <Text style={[styles.address, { color: theme.textSecondary }]} numberOfLines={1}>
            {workshop.address.street}, {workshop.address.city}
          </Text>
        </View>

        {/* Specializzazioni */}
        {workshop.specializations.length > 0 && (
          <View style={styles.specializationsContainer}>
            {workshop.specializations.slice(0, 3).map((spec, index) => (
              <View key={index} style={[styles.specializationBadge, { backgroundColor: theme.primary + '20' }]}>
                <Text style={[styles.specializationText, { color: theme.primary }]}>
                  {spec}
                </Text>
              </View>
            ))}
            {workshop.specializations.length > 3 && (
              <Text style={[styles.moreText, { color: theme.textSecondary }]}>
                +{workshop.specializations.length - 3}
              </Text>
            )}
          </View>
        )}

        {/* Footer con info */}
        <View style={styles.workshopFooter}>
          <View style={styles.footerItem}>
            <Clock size={14} color={theme.textSecondary} />
            <Text style={[styles.footerText, { color: theme.textSecondary }]}>
              Orario 8:00 - 18:00
            </Text>
          </View>

          <View style={styles.footerItem}>
            <Text style={[styles.bookingsCount, { color: theme.success }]}>
              {workshop.totalBookings} prenotazioni
            </Text>
          </View>
        </View>

        {/* Pulsante prenota */}
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('BookingRequest', { workshopId: workshop.id })}
        >
          <Text style={styles.bookButtonText}>Prenota</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header con gradiente */}
      <LinearGradient
        colors={darkMode ? ['#1f2937', '#111827'] : ['#3b82f6', '#2563eb']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Cerca Officina</Text>
        <Text style={styles.headerSubtitle}>
          Trova l'officina perfetta per le tue esigenze
        </Text>
      </LinearGradient>

      {/* Barra di ricerca */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Search size={20} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Cerca per nome, città, provincia..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Risultati ricerca */}
        {searchQuery.length > 0 && (
          <Text style={[styles.searchResults, { color: theme.textSecondary }]}>
            {workshops.length} {workshops.length === 1 ? 'risultato' : 'risultati'} trovati
          </Text>
        )}
      </View>

      {/* Filtri */}
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: selectedFilter === 'all' ? theme.primary : theme.cardBackground, borderColor: theme.border }
          ]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterText, { color: selectedFilter === 'all' ? '#fff' : theme.text }]}>
            Tutte
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: selectedFilter === 'trusted' ? theme.primary : theme.cardBackground, borderColor: theme.border }
          ]}
          onPress={() => setSelectedFilter('trusted')}
        >
          <Heart size={16} color={selectedFilter === 'trusted' ? '#fff' : theme.text} />
          <Text style={[styles.filterText, { color: selectedFilter === 'trusted' ? '#fff' : theme.text }]}>
            Fiducia ({trustedWorkshops.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.filterButton,
            { backgroundColor: selectedFilter === 'nearby' ? theme.primary : theme.cardBackground, borderColor: theme.border }
          ]}
          onPress={() => setSelectedFilter('nearby')}
        >
          <Navigation size={16} color={selectedFilter === 'nearby' ? '#fff' : theme.text} />
          <Text style={[styles.filterText, { color: selectedFilter === 'nearby' ? '#fff' : theme.text }]}>
            Vicine
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista officine */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Caricamento officine...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {getDisplayWorkshops().length === 0 ? (
            <View style={styles.emptyContainer}>
              <MapPin size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Nessuna officina trovata
              </Text>
              <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>
                Prova a cercare in un'altra città
              </Text>
            </View>
          ) : (
            getDisplayWorkshops().map(renderWorkshopCard)
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e0e7ff',
  },
  searchContainer: {
    padding: 16,
    paddingTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchResults: {
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  workshopCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  workshopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  workshopInfo: {
    flex: 1,
  },
  workshopName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 12,
  },
  favoriteButton: {
    padding: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  address: {
    fontSize: 14,
    flex: 1,
  },
  specializationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  specializationBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  specializationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  moreText: {
    fontSize: 12,
    alignSelf: 'center',
  },
  workshopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
  },
  bookingsCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  bookButton: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 64,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    fontSize: 14,
  },
});
