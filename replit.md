# MyMechanic App

## Overview

MyMechanic is a comprehensive cross-platform React Native application built with Expo that serves both vehicle owners and mechanics. The app provides vehicle management, maintenance tracking, expense monitoring, and workshop management capabilities. It features a dual-user interface with specialized dashboards for car owners and mechanics, enabling complete automotive lifecycle management from purchase to maintenance and repairs.

## Recent Changes (October 2025)

### Complete UI Redesign
The app underwent a complete redesign following minimal, clean design mockups:

**Navigation Architecture:**
- Removed tab navigator and drawer navigation
- Implemented pure stack navigation architecture
- Streamlined navigation flow: Login → Vehicle List → Vehicle Detail → Add Maintenance/Reminders → Profile

**Redesigned Screens:**
1. **VehicleListScreen** - Minimal vehicle cards with images, "Prossime scadenze" section, "Attività Recenti" section
2. **CarDetailScreen** - Clean header, vehicle info card, maintenance history, reminders with expiry highlighting
3. **AddMaintenanceScreen** - Simplified form with inline date picker, type selector, description, cost, and attachment placeholder

**Design System:**
- Color scheme: White/light gray base (#F8F9FA) with blue accents (#3B82F6)
- Cards: rounded-2xl (20px) with soft shadows
- Typography: Clean, readable fonts with proper hierarchy
- Icons: Lucide React Native with strokeWidth 2
- Theme: Full light/dark mode support via useAppThemeManager

**Data Management:**
- Uses useUserData hook to avoid Firestore composite index issues
- Pre-fetched data filtering instead of complex queries
- Real Firebase data throughout (zero mock data)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- Cross-platform mobile application (iOS, Android, Web)
- Navigation: React Navigation 7 with nested stack and tab navigators
- UI Framework: React Native Paper with Material Design 3
- State Management: Zustand with persistent storage via AsyncStorage
- Theme System: Dynamic light/dark mode with auto-detection

**Component Structure**:
- Universal picker components for cross-platform file, image, and date selection
- Modular screen architecture with separate directories for user and mechanic interfaces
- Custom hooks for authentication, data fetching, and theme management
- Context providers for theme and authentication state

### Backend Architecture

**Authentication**: Firebase Authentication with multi-provider support
- Email/password authentication
- Google OAuth integration (cross-platform)
- Apple Sign-In support (iOS)
- Platform-specific authentication handling (web vs mobile)

**Database**: Cloud Firestore with real-time synchronization
- Document-based NoSQL database structure
- Collections: users, vehicles, workshops, maintenance_records, invoices, expenses, fuel_records, documents, reminders, reviews
- Real-time listeners for live data updates
- Optimistic updates with offline support

**File Storage**: Firebase Storage
- Image upload and compression
- Document storage with preview capabilities
- Automatic file organization by user and vehicle

### Data Architecture

**Vehicle Management**:
- Complete vehicle profiles with technical specifications
- Maintenance history tracking with parts and costs
- Expense categorization and reporting
- Document management with expiry notifications

**Workshop Management**:
- Customer relationship management
- Appointment scheduling and calendar integration
- Invoicing system with PDF generation
- Parts inventory tracking
- Real-time repair status updates

**Security Model**:
- Role-based access control (vehicle owners vs mechanics)
- Data privacy controls with sharing permissions
- Firestore security rules for data protection
- Screen capture prevention on sensitive data

### External Dependencies

**Firebase Services**:
- Firebase Authentication (multi-provider)
- Cloud Firestore (real-time database)
- Firebase Storage (file hosting)
- Firebase Admin SDK for server-side operations

**Expo Services**:
- Expo Image Picker (camera and gallery access)
- Expo Document Picker (file selection)
- Expo Notifications (push notifications)
- Expo Auth Session (OAuth flows)
- Expo Linear Gradient (UI enhancements)

**Third-Party APIs**:
- EmailJS for email communication
- Car database APIs for vehicle specifications
- Google OAuth for authentication

**Development Tools**:
- EAS Build for native compilation
- Metro bundler with custom resolver configuration
- TypeScript for type safety
- ESLint with Expo configuration

**Platform-Specific Integrations**:
- Android: Google Services, camera/storage permissions
- iOS: Apple Sign-In, photo library access
- Web: Progressive Web App capabilities with offline support

The application uses a service-oriented architecture with dedicated services for authentication, vehicle management, maintenance tracking, file uploads, and notifications. The codebase implements comprehensive error handling, loading states, and fallback mechanisms for cross-platform compatibility.