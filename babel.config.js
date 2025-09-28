module.exports = function (api) {
    api.cache(true);

    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // ECMAScript proposals (in ordine raccomandato)
            '@babel/plugin-transform-flow-strip-types',
            '@babel/plugin-proposal-export-namespace-from',

            // Path alias (Module Resolver)
            [
                'module-resolver',
                {
                    root: ['./'],
                    extensions: [
                        '.ios.ts',
                        '.android.ts',
                        '.ts',
                        '.ios.tsx',
                        '.android.tsx',
                        '.tsx',
                        '.jsx',
                        '.js',
                        '.json'
                    ],
                    alias: {
                        '@': './src',
                        '@components': './src/components',
                        '@screens': './src/screens',
                        '@services': './src/services',
                        '@navigation': './src/navigation',
                        '@hooks': './src/hooks',
                        '@utils': './src/utils',
                        '@assets': './assets',
                        '@store': './src/store',
                        '@types': './src/types'
                    }
                }
            ],

            // React Native Reanimated deve SEMPRE essere l'ultimo plugin
            'react-native-reanimated/plugin'
        ],
        env: {
            production: {
                plugins: [
                    'transform-remove-console',
                    'react-native-paper/babel'
                ]
            }
        }
    };
};