// app.config.js (Versione unificata e completa)

module.exports = ({ config }) => {
    return {
        ...config,
        "name": "MyMechanic",
        "slug": "MyMechanic",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "automatic",
        "splash": {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#ffffff"
        },
        "assetBundlePatterns": [
            "**/*"
        ],
        "ios": {
            "supportsTablet": true,
            "bundleIdentifier": "MyMechanic.com",
            "buildNumber": "1",
            "infoPlist": {
                "NSCameraUsageDescription": "L'app ha bisogno di accedere alla fotocamera per scattare foto dei veicoli e documenti.",
                "NSPhotoLibraryUsageDescription": "L'app ha bisogno di accedere alla libreria foto per selezionare immagini dei veicoli.",
                "NSPhotoLibraryAddUsageDescription": "L'app ha bisogno di salvare le foto nella libreria.",
                "NSCalendarsUsageDescription": "L'app ha bisogno di accedere al calendario per ricordarti le scadenze.",
                "NSLocationWhenInUseUsageDescription": "L'app ha bisogno della tua posizione per trovare officine vicine.",
                "CFBundleURLTypes": [
                    {
                        "CFBundleURLSchemes": ["MyMechanic"]
                    }
                ]
            },
            "config": {
                "usesNonExemptEncryption": false
            },
            "googleServicesFile": "./ios/GoogleService-Info.plist",
            "associatedDomains": [
                "applinks:MyMechanic.com"
            ],
            "deploymentTarget": "15.1"
        },
        "android": {
            "adaptiveIcon": {
                "foregroundImage": "./assets/adaptive-icon.png",
                "backgroundColor": "#FFFFFF"
            },
            "package": "MyMechanic.com",
            "versionCode": 1,
            "permissions": [
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "ACCESS_FINE_LOCATION",
                "ACCESS_COARSE_LOCATION",
                "VIBRATE",
                "RECEIVE_BOOT_COMPLETED"
            ],
            "googleServicesFile": "./android/app/google-services.json",
            "intentFilters": [
                {
                    "action": "VIEW",
                    "autoVerify": true,
                    "data": [
                        {
                            "scheme": "MyMechanic",
                            "host": "*"
                        }
                    ],
                    "category": ["BROWSABLE", "DEFAULT"]
                }
            ],
            "compileSdkVersion": 35, // Spostato qui da expo-build-properties
            "targetSdkVersion": 35, // Spostato qui da expo-build-properties
            "buildToolsVersion": "35.0.0", // Spostato qui da expo-build-properties
            "minSdkVersion": 26 // Spostato qui da expo-build-properties
        },
        "web": {
            "favicon": "./assets/favicon.png",
            "bundler": "metro"
        },
        "plugins": [
            "expo-font", // expo-build-properties è stato eliminato e le sue impostazioni spostate sopra
            [
                "expo-notifications",
                {
                    "icon": "./assets/notification-icon.png",
                    "color": "#ffffff"
                }
            ],
            "expo-apple-authentication",
            [
                "expo-image-picker",
                {
                    "photosPermission": "L'app ha bisogno di accedere alle tue foto per permetterti di caricare immagini dei veicoli.",
                    "cameraPermission": "L'app ha bisogno di accedere alla fotocamera per scattare foto dei veicoli."
                }
            ],
            "expo-secure-store",
            "expo-dev-client"
        ],
        "experiments": {
            "tsconfigPaths": true
        },
        "scheme": "MyMechanic"
    };
};