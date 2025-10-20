// src/screens/user/VehicleListScreen.tsx - REDESIGN COMPLETO
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Image,
  Dimensions,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  Car,
  Plus,
  User,
  Calendar,
  Wrench,
  Euro,
  ChevronRight,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import { useUserData } from "../../hooks/useUserData";
import { useAppThemeManager } from "../../hooks/useTheme";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web";

const VehicleListScreen = () => {
  const navigation = useNavigation();
  const { colors, isDark } = useAppThemeManager();
  const {
    vehicles,
    upcomingReminders,
    recentMaintenance,
    refreshData,
    loading,
  } = useUserData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    vehicles.length > 0 ? vehicles[0].id : null
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  // Get selected vehicle
  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  // Get upcoming reminders (max 3)
  const displayReminders = upcomingReminders.slice(0, 3);

  // Get recent maintenance (max 3)
  const displayMaintenance = recentMaintenance.slice(0, 3);

  const formatDate = (date: any) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatCurrency = (amount: number) => {
    return `€ ${amount.toFixed(0)}`;
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        {
          backgroundColor: isDark ? colors.background : "#F8F9FA",
        },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDark ? colors.surface : "#FFFFFF" },
        ]}
      >
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.navigate("AddVehicle" as never)}
        >
          <Plus size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>
          I miei veicoli
        </Text>

        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => (navigation as any).navigate("Profile")}
        >
          <User size={24} color={colors.onSurface} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {vehicles.length === 0 ? (
          // Empty State
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconContainer,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Car size={48} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Nessun veicolo registrato
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
            >
              Aggiungi il tuo primo veicolo per iniziare a tracciare manutenzioni e spese
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => (navigation as any).navigate("AddVehicle")}
            >
              <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.emptyButtonText}>Aggiungi veicolo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Vehicle Card */}
            {selectedVehicle && (
              <View
                style={[
                  styles.vehicleCard,
                  {
                    backgroundColor: isDark ? colors.surface : "#FFFFFF",
                  },
                ]}
              >
                {/* Vehicle Image Placeholder */}
                <View style={styles.vehicleImageContainer}>
                  <View
                    style={[
                      styles.vehicleImagePlaceholder,
                      { backgroundColor: `${colors.primary}15` },
                    ]}
                  >
                    <Car size={64} color={colors.primary} strokeWidth={1.5} />
                  </View>
                </View>

                {/* Vehicle Info */}
                <View style={styles.vehicleInfo}>
                  <Text style={[styles.vehicleName, { color: colors.onSurface }]}>
                    {selectedVehicle.make} {selectedVehicle.model}
                  </Text>
                  <Text
                    style={[
                      styles.vehiclePlate,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    VIN: {selectedVehicle.vin || "Non disponibile"}
                  </Text>
                </View>

                {/* Selected Button */}
                <TouchableOpacity
                  style={[
                    styles.selectedButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() =>
                    (navigation as any).navigate("CarDetail", {
                      carId: selectedVehicle.id,
                    })
                  }
                >
                  <Text style={styles.selectedButtonText}>Selezionata</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Prossime Scadenze Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.onSurface }]}
                >
                  Prossime scadenze
                </Text>
                <TouchableOpacity
                  onPress={() => (navigation as any).navigate("RemindersList")}
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    Vedi tutto
                  </Text>
                </TouchableOpacity>
              </View>

              {displayReminders.length === 0 ? (
                <View
                  style={[
                    styles.emptySection,
                    {
                      backgroundColor: isDark ? colors.surface : "#FFFFFF",
                    },
                  ]}
                >
                  <Calendar
                    size={32}
                    color={colors.onSurfaceVariant}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={[
                      styles.emptySectionText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Nessuna scadenza programmata
                  </Text>
                </View>
              ) : (
                displayReminders.map((reminder) => (
                  <TouchableOpacity
                    key={reminder.id}
                    style={[
                      styles.reminderCard,
                      {
                        backgroundColor: isDark ? colors.surface : "#FFFFFF",
                      },
                    ]}
                    onPress={() =>
                      (navigation as any).navigate("RemindersList")
                    }
                  >
                    <View
                      style={[
                        styles.reminderIcon,
                        {
                          backgroundColor:
                            reminder.type === "maintenance"
                              ? "#3B82F620"
                              : reminder.type === "insurance"
                              ? "#F59E0B20"
                              : "#8B5CF620",
                        },
                      ]}
                    >
                      {reminder.type === "maintenance" ? (
                        <Wrench size={20} color="#3B82F6" strokeWidth={2} />
                      ) : reminder.type === "insurance" ? (
                        <AlertCircle size={20} color="#F59E0B" strokeWidth={2} />
                      ) : (
                        <Calendar size={20} color="#8B5CF6" strokeWidth={2} />
                      )}
                    </View>

                    <View style={styles.reminderInfo}>
                      <Text
                        style={[
                          styles.reminderTitle,
                          { color: colors.onSurface },
                        ]}
                      >
                        {reminder.title}
                      </Text>
                      <Text
                        style={[
                          styles.reminderDate,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        Scadenza: {formatDate(reminder.dueDate)}
                      </Text>
                    </View>

                    <View style={styles.reminderRight}>
                      <Text
                        style={[
                          styles.reminderCost,
                          { color: colors.onSurface },
                        ]}
                      >
                        {reminder.priority === "high" ? "Urgente" : "Previsto"}
                      </Text>
                      <ChevronRight
                        size={20}
                        color={colors.onSurfaceVariant}
                        strokeWidth={2}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Attività Recenti Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text
                  style={[styles.sectionTitle, { color: colors.onSurface }]}
                >
                  Attività Recenti
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    selectedVehicle &&
                    (navigation as any).navigate("CarDetail", {
                      carId: selectedVehicle.id,
                    })
                  }
                >
                  <Text style={[styles.seeAllText, { color: colors.primary }]}>
                    Vedi tutto
                  </Text>
                </TouchableOpacity>
              </View>

              {displayMaintenance.length === 0 ? (
                <View
                  style={[
                    styles.emptySection,
                    {
                      backgroundColor: isDark ? colors.surface : "#FFFFFF",
                    },
                  ]}
                >
                  <Clock
                    size={32}
                    color={colors.onSurfaceVariant}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={[
                      styles.emptySectionText,
                      { color: colors.onSurfaceVariant },
                    ]}
                  >
                    Nessuna attività recente
                  </Text>
                </View>
              ) : (
                displayMaintenance.map((maintenance) => (
                  <TouchableOpacity
                    key={maintenance.id}
                    style={[
                      styles.activityCard,
                      {
                        backgroundColor: isDark ? colors.surface : "#FFFFFF",
                      },
                    ]}
                    onPress={() =>
                      selectedVehicle &&
                      (navigation as any).navigate("CarDetail", {
                        carId: selectedVehicle.id,
                      })
                    }
                  >
                    <View
                      style={[
                        styles.activityIcon,
                        { backgroundColor: "#3B82F620" },
                      ]}
                    >
                      <Wrench size={20} color="#3B82F6" strokeWidth={2} />
                    </View>

                    <View style={styles.activityInfo}>
                      <Text
                        style={[
                          styles.activityTitle,
                          { color: colors.onSurface },
                        ]}
                      >
                        {maintenance.type}
                      </Text>
                      <Text
                        style={[
                          styles.activityDate,
                          { color: colors.onSurfaceVariant },
                        ]}
                      >
                        {formatDate(maintenance.completedDate)}
                      </Text>
                    </View>

                    <View style={styles.activityRight}>
                      <Text
                        style={[styles.activityCost, { color: colors.onSurface }]}
                      >
                        {formatCurrency(maintenance.cost || 0)}
                      </Text>
                      <ChevronRight
                        size={20}
                        color={colors.onSurfaceVariant}
                        strokeWidth={2}
                      />
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Vehicle Card
  vehicleCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      },
    }),
  },
  vehicleImageContainer: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  vehicleImage: {
    width: "100%",
    height: "100%",
  },
  vehicleImagePlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    marginBottom: 16,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  vehiclePlate: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  selectedButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  selectedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Empty Section
  emptySection: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptySectionText: {
    fontSize: 14,
  },

  // Reminder Card
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      },
    }),
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  reminderDate: {
    fontSize: 13,
  },
  reminderRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  reminderCost: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Activity Card
  activityCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
      },
    }),
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 13,
  },
  activityRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  activityCost: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default VehicleListScreen;
