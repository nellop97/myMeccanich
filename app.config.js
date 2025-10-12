// app.config.js
module.exports = {
    expo: {
        name: "MyMechanic",
        slug: "MyMechanic",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "automatic",
        scheme: "mymechanic", // Corretto 'scheme' e spostato qui
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        assetBundlePatterns: ["**/*"],
        ios: {
            supportsTablet: true,
            // IMPORTANTE: Formato reverse-domain corretto
            bundleIdentifier: "com.mymechanic.app",
            buildNumber: "1",
            googleServicesFile: "./GoogleService-Info.plist", // Aggiunto da app.json
            associatedDomains: ["applinks:mymechanic.com"],
            infoPlist: {
                NSCameraUsageDescription: "L'app ha bisogno di accedere alla fotcamera per scattare foto dei veicoli e documenti.",
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
            // IMPORTANTE: Formato reverse-domain corretto e consistente con iOS
            package: "com.mymechanic.app",
            versionCode: 1,
            googleServicesFile: "./google-services.json", // Aggiunto da app.json
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
                    data: [{ scheme: "httpss", host: "mymechanic.com" }], // Schema standard per Universal Links
                    category: ["BROWSABLE", "DEFAULT"],
                },
            ],
        },
        web: {
            favicon: "./assets/favicon.png",
            bundler: "metro",
        },
        plugins: [
            // Plugin per gestire le versioni di build native
            [
                "expo-build-properties",
                {
                    android: {
                        compileSdkVersion: 34, // SDK 34 è lo standard per Expo 51
                        targetSdkVersion: 34,
                        buildToolsVersion: "34.0.0",
                        minSdkVersion: 26,
                    },
                    ios: {
                        deploymentTarget: "15.1", // Target più comune e stabile
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
                    // Aggiunta la permission per la fotocamera che mancava
                    cameraPermission: "L'app ha bisogno di accedere alla fotocamera per scattare foto dei veicoli.",
                },
            ],
            "expo-secure-store", // Aggiunto da app.json
            "expo-dev-client",  // Aggiunto da app.json
        ],
        extra: {
            eas: {
                // Usa l'ID corretto del tuo progetto EAS
                projectId: "c9c73115-5bec-49d5-b7ab-ab89a90252db",
            },
        },
    },
};