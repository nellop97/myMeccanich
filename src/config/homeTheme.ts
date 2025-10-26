// src/config/homeTheme.ts
// Configurazione Temi e Colori per HomeScreen Moderna

export const HomeThemeConfig = {
  // ========================================
  // GRADIENTS VEICOLI
  // ========================================
  vehicleGradients: {
    default: {
      light: ['#667EEA', '#764BA2'],
      dark: ['#1C1C1E', '#2C2C2E'],
    },
    blue: ['#4A90E2', '#357ABD'],
    green: ['#34C759', '#28A745'],
    red: ['#FF3B30', '#DC3545'],
    orange: ['#FF9500', '#FD7E14'],
    purple: ['#AF52DE', '#9B59B6'],
    pink: ['#FF2D55', '#E91E63'],
    teal: ['#5AC8FA', '#00BCD4'],
  },

  // ========================================
  // COLORI STATISTICHE (STATS CARDS)
  // ========================================
  statsColors: {
    expenses: '#FF3B30',
    fuel: '#34C759',
    maintenance: '#667EEA',
    kilometers: '#FF9500',
  },

  // ========================================
  // COLORI SCADENZE (DEADLINES)
  // ========================================
  deadlineColors: {
    high: '#FF3B30',
    medium: '#FF9500',
    low: '#34C759',
  },

  deadlineTypeColors: {
    insurance: '#FF3B30',
    revision: '#667EEA',
    roadTax: '#FF9500',
    maintenance: '#34C759',
  },

  // ========================================
  // COLORI ATTIVITÀ (ACTIVITIES)
  // ========================================
  activityColors: {
    maintenance: '#667EEA',
    fuel: '#34C759',
    expense: '#FF9500',
  },

  // ========================================
  // DIMENSIONI E SPACING
  // ========================================
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  // ========================================
  // BREAKPOINTS RESPONSIVE
  // ========================================
  breakpoints: {
    mobile: 0,
    mobileLarge: 480,
    tablet: 768,
    laptop: 1024,
    desktop: 1280,
    desktopLarge: 1920,
  },

  // ========================================
  // ANIMAZIONI
  // ========================================
  animations: {
    duration: {
      fast: 200,
      normal: 300,
      slow: 500,
    },
    easing: {
      default: 'ease-in-out',
      spring: 'spring',
    },
  },

  // ========================================
  // SHADOWS
  // ========================================
  shadows: {
    small: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    },
    medium: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    },
    large: {
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    },
  },

  // ========================================
  // TIPOGRAFIA
  // ========================================
  typography: {
    sizes: {
      xs: 11,
      sm: 13,
      base: 15,
      md: 16,
      lg: 17,
      xl: 20,
      xxl: 22,
      xxxl: 24,
      huge: 28,
    },
    weights: {
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // ========================================
  // ICONE
  // ========================================
  iconSizes: {
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 28,
    xxl: 32,
  },

  // ========================================
  // CARD DIMENSIONS
  // ========================================
  cardDimensions: {
    vehicle: {
      width: 300,
      height: 160,
    },
    stat: {
      minWidth: {
        mobile: '47%',
        tablet: 180,
        desktop: 200,
      },
    },
  },
};

// Get gradient colors based on vehicle color or theme
export const getVehicleGradient = (
  vehicleColor?: string,
  isDark?: boolean
): string[] => {
  if (vehicleColor) {
    return [vehicleColor, `${vehicleColor}CC`];
  }
  
  return isDark
    ? HomeThemeConfig.vehicleGradients.default.dark
    : HomeThemeConfig.vehicleGradients.default.light;
};

// Get deadline color based on priority
export const getDeadlineColor = (
  priority: 'low' | 'medium' | 'high'
): string => {
  return HomeThemeConfig.deadlineColors[priority];
};

// Get deadline type color
export const getDeadlineTypeColor = (
  type: 'insurance' | 'revision' | 'roadTax' | 'maintenance'
): string => {
  return HomeThemeConfig.deadlineTypeColors[type];
};

// Get activity color
export const getActivityColor = (
  type: 'maintenance' | 'fuel' | 'expense'
): string => {
  return HomeThemeConfig.activityColors[type];
};

// Get stat color
export const getStatColor = (
  type: 'expenses' | 'fuel' | 'maintenance' | 'kilometers'
): string => {
  return HomeThemeConfig.statsColors[type];
};

// Check if device is mobile
export const isMobile = (width: number): boolean => {
  return width < HomeThemeConfig.breakpoints.tablet;
};

// Check if device is tablet
export const isTablet = (width: number): boolean => {
  return width >= HomeThemeConfig.breakpoints.tablet && 
         width < HomeThemeConfig.breakpoints.laptop;
};

// Check if device is desktop
export const isDesktop = (width: number): boolean => {
  return width >= HomeThemeConfig.breakpoints.laptop;
};

// Get responsive spacing
export const getResponsiveSpacing = (
  width: number,
  mobile: number,
  tablet: number,
  desktop: number
): number => {
  if (isMobile(width)) return mobile;
  if (isTablet(width)) return tablet;
  return desktop;
};

export default HomeThemeConfig;
