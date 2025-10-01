// app.config.js
module.exports = {
    expo: {
        name: "MyMechanic",
        slug: "mymechanic",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
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
            bundleIdentifier: "com.mymechanic.app"
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#FFFFFF"
            },
            package: "com.mymechanic.app"
        },
        web: {
            favicon: "./assets/favicon.png",
            bundler: "metro",
            // Aggiungi configurazione per evitare problemi con import.meta
            build: {
                babel: {
                    include: [
                        "@firebase/auth",
                        "@firebase/firestore",
                        "@firebase/storage",
                        "@firebase/app",
                        "firebase"
                    ]
                }
            }
        },
        plugins: [
            "expo-router"
        ],
        experiments: {
            typedRoutes: true,
            // Abilita il supporto web ottimizzato
            tsconfigPaths: true
        }
    }
};