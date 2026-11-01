// src/screens/mechanic/MechanicIcon.tsx - Icone Lucide dell'area meccanico, richiamabili per nome
import React from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  Bell,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Car,
  CarFront,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  FilePen,
  Files,
  FileText,
  LayoutDashboard,
  Loader,
  LogOut,
  LucideIcon,
  Menu,
  Minus,
  Moon,
  Package,
  Receipt,
  RefreshCw,
  Settings,
  ShoppingCart,
  Star,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  UserPlus,
  Users,
  Wrench,
} from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
  account: User,
  'account-group': Users,
  'account-plus': UserPlus,
  'alert-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  bell: Bell,
  calendar: Calendar,
  'calendar-check': CalendarCheck,
  'calendar-clock': CalendarClock,
  'calendar-month': CalendarDays,
  'calendar-plus': CalendarPlus,
  'calendar-today': CalendarDays,
  car: Car,
  cart: ShoppingCart,
  'car-multiple': CarFront,
  'car-plus': Car,
  'car-wrench': Wrench,
  'cash-multiple': Banknote,
  'chart-bar': BarChart3,
  'check-decagram': BadgeCheck,
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  'chevron-up': ChevronUp,
  cog: Settings,
  'file-document-edit': FilePen,
  'file-document-multiple': Files,
  'file-document-outline': FileText,
  loading: Loader,
  logout: LogOut,
  menu: Menu,
  minus: Minus,
  package: Package,
  receipt: Receipt,
  refresh: RefreshCw,
  star: Star,
  'trending-down': TrendingDown,
  'trending-up': TrendingUp,
  'view-dashboard': LayoutDashboard,
  'weather-night': Moon,
  'weather-sunny': Sun,
  wrench: Wrench,
};

interface MechanicIconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

const MechanicIcon: React.FC<MechanicIconProps> = ({ name, size = 24, color, style }) => {
  const Icon = ICONS[name] ?? Circle;
  return <Icon size={size} color={color} strokeWidth={2} style={style} />;
};

export default MechanicIcon;
