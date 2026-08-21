import { defineConfig } from 'eslint/config'
import prettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
    {
        ignores: ['build/**', 'node_modules/**'],
    },
    ...tseslint.configs.recommended,
    {
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
                Bun: 'readonly',
            },
        },
    },
    prettierRecommended,
])
