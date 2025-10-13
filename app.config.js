// app.config.js - CONFIGURAZIONE CORRETTA
module.exports = {
    expo: {
        name: "MyMechanic",
        slug: "MyMechanic",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "automatic",
        scheme: "mymechanic",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        assetBundlePatterns: ["**/*"],
        ios: {
            supportsTablet: true,
            // IMPORTANTE: Deve coincidere con GoogleService-Info.plist
            bundleIdentifier: "com.mymeccanich.com", // CAMBIATO per matching Firebase
            buildNumber: "1",
            googleServicesFile: "./GoogleService-Info.plist",
            associatedDomains: ["applinks:mymechanic.com"],
            infoPlist: {
                NSCameraUsageDescription: "L'app ha bisogno di accedere alla fotocamera per scattare foto dei veicoli e documenti.",
                NSPhotoLibraryUsageDescription: "L'app ha bisogno di accedere alla libreria foto per selezionare immagini dei veicoli.",
                NSPhotoLibraryAddUsageDescription: "L'app ha bisogno di salvare le foto nella libreria.",
                NSCalendarsUsageDescription: "L'app ha bisogno di accedere al calendario per ricordarti le scadenze.",
                NSLocationWhenInUseUsageDescription: "L'app ha bisogno della tua posizione per trovare officine vicine.",
            },
            config: {
                usesNonExemptEncryption: false,
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#FFFFFF",
            },
            // Mantieni consistency tra le piattaforme
            package: "com.mymechanic.app",
            versionCode: 1,
            googleServicesFile: "./google-services.json",
            permissions: [
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "VIBRATE",
                "RECEIVE_BOOT_COMPLETED",
            ],
            intentFilters: [
                {
                    action: "VIEW",
                    autoVerify: true,
                    data: [{ scheme: "https", host: "mymechanic.com" }],
                    category: ["BROWSABLE", "DEFAULT"],
                },
            ],
        },
        web: {
            favicon: "./assets/favicon.png",
            bundler: "metro",
        },
        plugins: [
            [
                "expo-build-properties",
                {
                    android: {
                        compileSdkVersion: 34,
                        targetSdkVersion: 34,
                        buildToolsVersion: "34.0.0",
                        minSdkVersion: 26,
                        // Disabilita New Architecture su Android
                        newArchEnabled: false,
                    },
                    ios: {
                        deploymentTarget: "15.1",
                        // Disabilita New Architecture su iOS
                        newArchEnabled: false,
                    },
                },
            ],
            "expo-font",
            [
                "expo-notifications",
                {
                    icon: "./assets/notification-icon.png",
                    color: "#ffffff",
                },
            ],
            "expo-apple-authentication",
            [
                "expo-image-picker",
                {
                    photosPermission: "L'app ha bisogno di accedere alle tue foto per permetterti di caricare immagini dei veicoli.",
                    cameraPermission: "L'app ha bisogno di accedere alla fotocamera per scattare foto dei veicoli.",
                },
            ],
            "expo-location",
            "expo-document-picker",
            [
                "expo-dev-client",
                {
                    // Aggiungi configurazione per dev client
                    addGeneratedScheme: false,
                },
            ],
        ],
        extra: {
            eas: {
                // Usa l'ID corretto del tuo progetto EAS
                projectId: "c9c73115-5bec-49d5-b7ab-ab89a90252db",
            },
        },
    },
};