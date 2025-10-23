// src/components/WorkshopSearchInput.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Text,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MapPin, X } from 'lucide-react-native';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAppThemeManager } from '../hooks/useTheme';

interface Workshop {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  city?: string;
}

interface WorkshopSearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSelectWorkshop?: (workshop: Workshop) => void;
  placeholder?: string;
  label?: string;
}

export default function WorkshopSearchInput({
  value,
  onChangeText,
  onSelectWorkshop,
  placeholder = 'Cerca o inserisci officina',
  label = 'Officina',
}: WorkshopSearchInputProps) {
  const { colors, isDark } = useAppThemeManager();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (value.length >= 2) {
      searchWorkshops(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const searchWorkshops = async (searchText: string) => {
    try {
      setLoading(true);

      // Search in users collection for mechanics
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('userType', '==', 'mechanic'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const results: Workshop[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const workshopName = data.workshopName || data.businessName || data.displayName;

        // Filter by search text (client-side filtering)
        if (workshopName && workshopName.toLowerCase().includes(searchText.toLowerCase())) {
          results.push({
            id: doc.id,
            name: workshopName,
            address: data.address || data.workshopAddress,
            phone: data.phone || data.phoneNumber,
            city: data.city,
          });
        }
      });

      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching workshops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWorkshop = (workshop: Workshop) => {
    onChangeText(workshop.name);
    setShowSuggestions(false);
    if (onSelectWorkshop) {
      onSelectWorkshop(workshop);
    }
  };

  const handleClear = () => {
    onChangeText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={[styles.label, { color: colors.onSurface }]}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          { borderColor: isDark ? '#374151' : '#E5E7EB' },
        ]}
      >
        <MapPin size={20} color={colors.onSurfaceVariant} strokeWidth={2} />

        <TextInput
          style={[styles.input, { color: colors.onSurface }]}
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceVariant}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />

        {loading && <ActivityIndicator size="small" color={colors.primary} />}

        {value.length > 0 && !loading && (
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <X size={18} color={colors.onSurfaceVariant} />
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: isDark ? colors.surface : '#FFFFFF',
              borderColor: isDark ? '#374151' : '#E5E7EB',
            },
          ]}
        >
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  { borderBottomColor: isDark ? '#374151' : '#F3F4F6' },
                ]}
                onPress={() => handleSelectWorkshop(item)}
              >
                <View style={styles.suggestionContent}>
                  <Text style={[styles.suggestionName, { color: colors.onSurface }]}>
                    {item.name}
                  </Text>
                  {(item.address || item.city) && (
                    <Text style={[styles.suggestionAddress, { color: colors.onSurfaceVariant }]}>
                      {[item.address, item.city].filter(Boolean).join(', ')}
                    </Text>
                  )}
                  {item.phone && (
                    <Text style={[styles.suggestionPhone, { color: colors.onSurfaceVariant }]}>
                      {item.phone}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
          <View style={[styles.suggestionFooter, { borderTopColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <Text style={[styles.suggestionFooterText, { color: colors.onSurfaceVariant }]}>
              Oppure continua a scrivere per inserire manualmente
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 1000,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderWidth: 1,
    borderRadius: 12,
    maxHeight: 300,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  suggestionsList: {
    maxHeight: 240,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionContent: {
    gap: 4,
  },
  suggestionName: {
    fontSize: 15,
    fontWeight: '500',
  },
  suggestionAddress: {
    fontSize: 13,
  },
  suggestionPhone: {
    fontSize: 12,
  },
  suggestionFooter: {
    padding: 12,
    borderTopWidth: 1,
  },
  suggestionFooterText: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
