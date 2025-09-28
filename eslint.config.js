import { defineConfig } from 'eslint-define-config';

export default defineConfig([
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
        },
    },
]);