// MaintenanceListScreen.tsx
import React, { useState } from 'react';
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  LayoutAnimation 
} from 'react-native';

const MaintenanceListScreen = () => {
  const [expandedSections, setExpandedSections] = useState({
    maintenance: true,
    expenses: false,
    documents: false
  });

  const toggleSection = (section) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Sezione Manutenzioni */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={() => toggleSection('maintenance')}
            style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Manutenzioni</Text>
            <Text style={styles.sectionToggle}>
              {expandedSections.maintenance ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.maintenance && (
            <View style={styles.sectionContent}>
              {/* Contenuto esistente delle manutenzioni */}
            </View>
          )}
        </View>

        {/* Sezione Spese */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={() => toggleSection('expenses')}
            style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spese</Text>
            <Text style={styles.sectionToggle}>
              {expandedSections.expenses ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.expenses && (
            <View style={styles.sectionContent}>
              {/* Contenuto esistente delle spese */}
            </View>
          )}
        </View>

        {/* Sezione Documenti */}
        <View style={styles.section}>
          <TouchableOpacity 
            onPress={() => toggleSection('documents')}
            style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Documenti</Text>
            <Text style={styles.sectionToggle}>
              {expandedSections.documents ? '▼' : '▶'}
            </Text>
          </TouchableOpacity>
          
          {expandedSections.documents && (
            <View style={styles.sectionContent}>
              {/* Contenuto esistente dei documenti */}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  scrollContainer: {
    padding: 16
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#e9ecef',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529'
  },
  sectionToggle: {
    fontSize: 14,
    color: '#6c757d'
  },
  sectionContent: {
    padding: 16
  }
});

export default MaintenanceListScreen;
