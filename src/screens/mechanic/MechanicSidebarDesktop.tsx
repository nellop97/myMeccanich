// src/screens/mechanic/MechanicSidebarDesktop.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { Portal, Dialog, Button } from "react-native-paper";
import { useAppThemeManager } from "../../hooks/useTheme";

interface MechanicSidebarDesktopProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

// Menu items configuration
const menuSections = [
  {
    id: "main",
    title: "Dashboard",
    items: [{ id: "dashboard", label: "Dashboard", icon: "view-dashboard" }],
  },
  {
    id: "workshop",
    title: "Officina",
    items: [
      {
        id: "AllCarsInWorkshop",
        label: "Auto in Officina",
        icon: "car-multiple",
      },
      { id: "MechanicCalendar", label: "Calendario", icon: "calendar-month" },
      {
        id: "NewAppointment",
        label: "Nuovo Appuntamento",
        icon: "calendar-plus",
      },
    ],
  },
  {
    id: "invoicing",
    title: "Fatturazione",
    items: [
      {
        id: "InvoicingDashboard",
        label: "Dashboard Fatture",
        icon: "file-document-multiple",
      },
      {
        id: "CreateInvoice",
        label: "Nuova Fattura",
        icon: "file-document-edit",
      },
      { id: "CustomersList", label: "Clienti", icon: "account-group" },
    ],
  },
  {
    id: "reports",
    title: "Report",
    items: [
      { id: "statistics", label: "Statistiche", icon: "chart-bar" },
      { id: "revenue", label: "Ricavi", icon: "cash-multiple" },
    ],
  },
];

const MechanicSidebarDesktop: React.FC<MechanicSidebarDesktopProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { colors, isDark, toggleTheme } = useAppThemeManager();
  const { user, signOut } = useAuth();
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "main",
    "workshop",
    "invoicing",
  ]);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Tema dinamico
  const theme = {
    background: colors.background,
    surface: colors.surface,
    text: colors.onSurface,
    textSecondary: colors.onSurfaceVariant,
    border: colors.outline,
    primary: colors.primary,
    danger: colors.error,
    hover: colors.surfaceVariant,
    activeBackground: colors.primaryContainer,
    activeText: colors.primary,
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId],
    );
  };

  const handleMenuNavigation = (itemId: string) => {
    switch (itemId) {
      case "dashboard":
        break;
      case "AllCarsInWorkshop":
        onTabChange("cars");
        break;
      case "MechanicCalendar":
        onTabChange("calendar");
        break;
      case "NewAppointment":
        break;
      case "InvoicingDashboard":
        onTabChange("invoices");
        break;
      case "CustomersList":
        onTabChange("customers");
        break;
      case "Profile":
        break;
      default:
        console.log("Navigation not implemented for:", itemId);
    }
  };

  const handleLogout = async () => {
    try {
      console.log("🚪 Desktop Sidebar: Iniziando logout...");

      if (!signOut || typeof signOut !== "function") {
        throw new Error("Logout function not available");
      }

      await signOut();
      console.log("✅ Desktop Sidebar: Logout completato con successo");
      setShowLogoutDialog(false);
    } catch (error) {
      console.error("❌ Desktop Sidebar: Errore durante il logout:", error);

      if (typeof window !== "undefined" && window.location) {
        console.log("🔄 Forcing page reload as fallback...");
        window.location.reload();
      }
    }
  };

  const getUserInitials = () => {
    if (user?.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <>
      <View
        style={[
          styles.sidebar,
          { backgroundColor: theme.background, borderRightColor: theme.border },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <View style={styles.logoContainer}>
            <MaterialCommunityIcons
              name="wrench"
              size={28}
              color={theme.primary}
            />
            <Text style={[styles.logoText, { color: theme.text }]}>
              MyMechanic
            </Text>
          </View>
        </View>

        {/* User Profile Section */}
        <TouchableOpacity
          style={[styles.profileSection, { backgroundColor: theme.surface }]}
          onPress={() => handleMenuNavigation("Profile")}
        >
          <View style={[styles.userAvatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.userAvatarText}>{getUserInitials()}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.text }]}>
              {user?.displayName || "Meccanico"}
            </Text>
            <Text style={[styles.userRole, { color: theme.textSecondary }]}>
              Amministratore
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {/* Menu Items */}
        <ScrollView
          style={styles.menuContainer}
          showsVerticalScrollIndicator={false}
        >
          {menuSections.map((section) => (
            <View key={section.id} style={styles.menuSection}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(section.id)}
              >
                <Text
                  style={[styles.sectionTitle, { color: theme.textSecondary }]}
                >
                  {section.title}
                </Text>
                <MaterialCommunityIcons
                  name={
                    expandedSections.includes(section.id)
                      ? "chevron-up"
                      : "chevron-down"
                  }
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>

              {expandedSections.includes(section.id) && (
                <View style={styles.sectionItems}>
                  {section.items.map((item) => {
                    const isActive = activeTab === item.id;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.menuItem,
                          isActive && [
                            styles.menuItemActive,
                            { backgroundColor: theme.activeBackground },
                          ],
                        ]}
                        onPress={() => handleMenuNavigation(item.id)}
                      >
                        <MaterialCommunityIcons
                          name={item.icon as any}
                          size={20}
                          color={
                            isActive ? theme.activeText : theme.textSecondary
                          }
                        />
                        <Text
                          style={[
                            styles.menuItemText,
                            { color: isActive ? theme.activeText : theme.text },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={toggleTheme}
          >
            <MaterialCommunityIcons
              name={isDark ? "weather-sunny" : "weather-night"}
              size={20}
              color={theme.textSecondary}
            />
            <Text
              style={[styles.footerButtonText, { color: theme.textSecondary }]}
            >
              {isDark ? "Tema Chiaro" : "Tema Scuro"}
            </Text>
          </TouchableOpacity>

          {/* Pulsante Logout con Pressable per web */}
          <Pressable
            style={({ pressed }) => [
              styles.footerButton,
              pressed && { opacity: 0.7 },
            ]}
            onPress={() => setShowLogoutDialog(true)}
          >
            <MaterialCommunityIcons
              name="logout"
              size={20}
              color={theme.danger}
            />
            <Text style={[styles.footerButtonText, { color: theme.danger }]}>
              Esci
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Dialog di conferma logout con Portal */}
      <Portal>
        <Dialog
          visible={showLogoutDialog}
          onDismiss={() => setShowLogoutDialog(false)}
          style={styles.dialogContainer}
        >
          <Dialog.Title>Conferma Logout</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.text }}>
              Sei sicuro di voler uscire dall'applicazione?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setShowLogoutDialog(false)}
              textColor={theme.textSecondary}
            >
              Annulla
            </Button>
            <Button onPress={handleLogout} textColor={theme.danger}>
              Esci
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    borderRightWidth: 1,
    zIndex: 100,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },

  // Profile Section
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    borderRadius: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
  },
  userRole: {
    fontSize: 12,
    marginTop: 2,
  },

  // Menu
  menuContainer: {
    flex: 1,
    paddingVertical: 8,
  },
  menuSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionItems: {
    paddingHorizontal: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 2,
  },
  menuItemActive: {
    marginHorizontal: 0,
  },
  menuItemText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },

  // Footer
  footer: {
    borderTopWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  footerButtonText: {
    fontSize: 14,
    marginLeft: 12,
  },

  // Dialog
  dialogContainer: {
    maxWidth: 400,
    alignSelf: "center",
  },
});

export default MechanicSidebarDesktop;
