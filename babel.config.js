// babel.config.js - Configurazione Babel Semplificata
module.exports = function(api) {
    api.cache(true);

    return {
        presets: [
            'babel-preset-expo'
        ],
        plugins: [
            // Plugin per module resolver (alias @/)
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './',
                    },
                    extensions: [
                        '.ios.ts',
                        '.android.ts',
                        '.ts',
                        '.ios.tsx',
                        '.android.tsx',
                        '.tsx',
                        '.jsx',
                        '.js',
                        '.json',
                    ],
                },
            ],
        ],
    };
};