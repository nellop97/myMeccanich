// app.config.js
// IMPORTANTE: Usa SOLO percorsi relativi per assets in Expo Config

module.exports = ({ config }) => {
    return {
        name: "MyMechanic",
        slug: "MyMechanic",
        version: "1.0.0",
        orientation: "portrait",
        // PERCORSI RELATIVI - NON usare path.resolve()
        icon: "./assets/icon.png",
        userInterfaceStyle: "automatic",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true,
            // IMPORTANTE: Usa formato reverse-domain corretto
            bundleIdentifier: "com.mymechanic.app",
            buildNumber: "1",
            infoPlist: {
                NSCameraUsageDescription: "L'app ha bisogno di accedere alla fotocamera per scattare foto dei veicoli e documenti.",
                NSPhotoLibraryUsageDescription: "L'app ha bisogno di accedere alla libreria foto per selezionare immagini dei veicoli.",
                NSPhotoLibraryAddUsageDescription: "L'app ha bisogno di salvare le foto nella libreria.",
                NSCalendarsUsageDescription: "L'app ha bisogno di accedere al calendario per ricordarti le scadenze.",
                NSLocationWhenInUseUsageDescription: "L'app ha bisogno della tua posizione per trovare officine vicine.",
                CFBundleURLTypes: [
                    {
                        CFBundleURLSchemes: ["mymechanic"]
                    }
                ]
            },
            config: {
                usesNonExemptEncryption: false
            },
            associatedDomains: [
                "applinks:mymechanic.com"
            ],
            deploymentTarget: "15.1"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#FFFFFF"
            },
            package: "com.mymechanic.app",
            versionCode: 1,
            permissions: [
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "VIBRATE",
                "RECEIVE_BOOT_COMPLETED"
            ],
            intentFilters: [
                {
                    action: "VIEW",
                    autoVerify: true,
                    data: [
                        {
                            scheme: "mymechanic",
                            host: "*"
                        }
                    ],
                    category: ["BROWSABLE", "DEFAULT"]
                }
            ],
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            minSdkVersion: 26
        },
        web: {
            favicon: "./assets/favicon.png",
            bundler: "metro"
        },
        plugins: [
            "expo-font",
            [
                "expo-notifications",
                {
                    icon: "./assets/notification-icon.png",
                    color: "#ffffff"
                }
            ],
            "expo-apple-authentication",
            [
                "expo-image-picker",
                {
                    photosPermission: "L'app ha bisogno di accedere alle tue foto per permetterti di caricare immagini dei veicoli."
                }
            ],
            [
                "expo-location",
                {
                    locationWhenInUsePermission: "L'app usa la tua posizione per trovare officine vicine."
                }
            ]
        ],
        "extra": {
            "eas": {
                "projectId": "3fbefffe-67b0-43d9-90e9-df0b8c853b14"
            }
        },
        "scheme": "MyMechanic"
    };
};