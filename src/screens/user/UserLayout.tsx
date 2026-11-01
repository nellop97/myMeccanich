// src/screens/user/UserLayout.tsx - Navigazione principale del proprietario
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useStore } from '../../store';
import { Bell, Calendar, Car, Home, LucideIcon, User } from 'lucide-react-native';
import {
  MECHANIC_MIN_TOUCH,
  mechanicRadius,
  useMechanicBreakpoints,
  useMechanicTheme,
} from '../mechanic/mechanicTheme';

export type UserSection = 'home' | 'bookings' | 'reminders' | 'vehicles' | 'profile';

interface UserLayoutProps {
  active: UserSection;
  badges?: Partial<Record<UserSection, number>>;
  // Le schermate con un'intestazione propria gestiscono già l'area superiore
  screenHandlesTopInset?: boolean;
  children: React.ReactNode;
}

const SECTIONS: { key: UserSection; label: string; route: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', route: 'Home', icon: Home },
  { key: 'bookings', label: 'Prenotazioni', route: 'BookingsDashboard', icon: Calendar },
  { key: 'vehicles', label: 'Veicoli', route: 'VehicleList', icon: Car },
  { key: 'reminders', label: 'Scadenze', route: 'Reminders', icon: Bell },
  { key: 'profile', label: 'Profilo', route: 'Profile', icon: User },
];

const UserLayout: React.FC<UserLayoutProps> = ({ active, badges, screenHandlesTopInset, children }) => {
  const navigation = useNavigation<any>();
  const theme = useMechanicTheme();
  const { isDesktop } = useMechanicBreakpoints();
  const insets = useSafeAreaInsets();

  const openSection = (route: string, key: UserSection) => {
    if (key !== active) {
      navigation.navigate(route);
    }
  };

  if (isDesktop) {
    return (
      <View style={[styles.desktop, { backgroundColor: theme.background }]}>
        <View style={[styles.rail, { backgroundColor: theme.surface, borderRightColor: theme.border }]}>
          <Text style={[styles.brand, { color: theme.text }]}>MyMechanic</Text>
          <ScrollView contentContainerStyle={styles.railList}>
            {SECTIONS.map(({ key, label, route, icon: Icon }) => {
              const isActive = key === active;
              const badge = badges?.[key] ?? 0;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.railItem, isActive && { backgroundColor: theme.primaryLight }]}
                  onPress={() => openSection(route, key)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                  accessibilityLabel={label}
                >
                  <Icon size={20} color={isActive ? theme.onPrimaryLight : theme.textSecondary} strokeWidth={2} />
                  <Text style={[styles.railLabel, { color: isActive ? theme.onPrimaryLight : theme.text }]}>
                    {label}
                  </Text>
                  {badge > 0 && (
                    <View style={[styles.railBadge, { backgroundColor: theme.error }]}>
                      <Text style={[styles.badgeText, { color: theme.onPrimary }]}>{badge}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.main}>{children}</View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={screenHandlesTopInset ? ['left', 'right'] : ['top', 'left', 'right']} style={[styles.mobile, { backgroundColor: theme.background }]}>
      <View style={styles.main}>{children}</View>
      <View
        style={[
          styles.tabBar,
          { backgroundColor: theme.surface, borderTopColor: theme.border, paddingBottom: insets.bottom },
        ]}
      >
        {SECTIONS.map(({ key, label, route, icon: Icon }) => {
          const isActive = key === active;
          const badge = badges?.[key] ?? 0;
          const color = isActive ? theme.primary : theme.textSecondary;
          return (
            <TouchableOpacity
              key={key}
              style={styles.tab}
              onPress={() => openSection(route, key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={label}
            >
              <View>
                <Icon size={22} color={color} strokeWidth={2} />
                {badge > 0 && (
                  <View style={[styles.tabBadge, { backgroundColor: theme.error }]}>
                    <Text style={[styles.badgeText, { color: theme.onPrimary }]}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, { color }]} numberOfLines={1}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  desktop: {
    flex: 1,
    flexDirection: 'row',
  },
  rail: {
    width: 248,
    borderRightWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 24,
  },
  brand: {
    fontSize: 20,
    fontWeight: '700',
    paddingHorizontal: 12,
  },
  railList: {
    gap: 4,
  },
  railItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: MECHANIC_MIN_TOUCH,
    paddingHorizontal: 12,
    borderRadius: mechanicRadius.md,
  },
  railLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  railBadge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  main: {
    flex: 1,
  },
  mobile: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  tab: {
    flex: 1,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
});

// Veicoli, Scadenze e Profilo si aprono dal menu: senza di esso non avrebbero un'uscita
export const withUserLayout = (Screen: React.ComponentType<any>, active: UserSection) => {
  const ScreenWithLayout = (props: any) => {
    const { user } = useStore();

    if (user?.isMechanic) {
      return <Screen {...props} />;
    }

    return (
      <UserLayout active={active} screenHandlesTopInset>
        <Screen {...props} />
      </UserLayout>
    );
  };

  return ScreenWithLayout;
};

export default UserLayout;
