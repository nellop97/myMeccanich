// src/screens/user/VehicleListScreen.tsx
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Car, Plus, ChevronRight } from "lucide-react-native";
import { FAB } from "react-native-paper";
import { useUserData } from "../../hooks/useUserData";
import { useAppThemeManager } from "../../hooks/useTheme";

const VehicleListScreen = () => {
  const navigation = useNavigation();
  const { colors } = useAppThemeManager();
  const { vehicles, refreshData } = useUserData();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {vehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Car size={64} color={colors.onSurfaceVariant} />
            <Text style={[styles.emptyTitle, { color: colors.onSurface }]}>
              Nessun veicolo registrato
            </Text>
            <Text
              style={[styles.emptyText, { color: colors.onSurfaceVariant }]}
            >
              Aggiungi il tuo primo veicolo per iniziare
            </Text>
          </View>
        ) : (
          vehicles.map((vehicle) => (
            <TouchableOpacity
              key={vehicle.id}
              style={[styles.vehicleCard, { backgroundColor: colors.surface }]}
              onPress={() =>
                navigation.navigate("CarDetail", { carId: vehicle.id })
              }
            >
              <View style={styles.vehicleInfo}>
                <Text style={[styles.vehicleName, { color: colors.onSurface }]}>
                  {vehicle.make} {vehicle.model}
                </Text>
                <Text
                  style={[
                    styles.vehicleDetails,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {vehicle.year} • {vehicle.licensePlate}
                </Text>
                <Text
                  style={[
                    styles.vehicleMileage,
                    { color: colors.onSurfaceVariant },
                  ]}
                >
                  {vehicle.currentMileage?.toLocaleString()} km
                </Text>
              </View>
              <ChevronRight size={24} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => navigation.navigate("AddVehicle")}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  vehicleDetails: {
    fontSize: 14,
    marginBottom: 2,
  },
  vehicleMileage: {
    fontSize: 12,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default VehicleListScreen;