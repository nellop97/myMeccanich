// babel.config.js
module.exports = function(api) {
    api.cache(true);

    return {
        presets: [
            'babel-preset-expo'
        ],
        plugins: [
            // Plugin per module resolver (se lo usi)
            [
                'module-resolver',
                {
                    root: ['./'],
                    alias: {
                        '@': './',
                    },
                },
            ],
        ],
        env: {
            production: {
                plugins: [
                    // Rimuovi console.log in production
                    'transform-remove-console',
                ].filter(Boolean),
            },
        },
    };
};