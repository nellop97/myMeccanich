// app.config.js - CORRETTO (senza expo-router)
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
        assetBundlePatterns: ["**/*"],
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
            bundler: "metro"
        },
        // ❌ RIMOSSO: plugins: ["expo-router"]
        // ❌ RIMOSSO: experiments con typedRoutes

        // ✅ Usa solo le experiments necessarie
        experiments: {
            tsconfigPaths: true
        }
    }
};