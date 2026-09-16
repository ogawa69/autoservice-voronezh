import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".tmp/**",
      "data/**",
      "dist/**",
      "node_modules/**",
      "public/**",
      "scripts/**"
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{js,jsx,ts,tsx}", "tests/**/*.{js,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
      react,
      "react-hooks": reactHooks,
    },
    settings: {
      react: {
        version: "detect",
      },
      "import/resolver": {
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"],
        },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "import/no-cycle": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_"
        }
      ],
      "@typescript-eslint/no-explicit-any": "off"
    }
  },
  {
    files: ["src/sections/hero/hooks/useHeroMediaSequence.ts"],
    rules: {
      "react-hooks/exhaustive-deps": "off"
    }
  },
  {
    files: ["src/**/*.{jsx,tsx}"],
    rules: {
      "react/no-multi-comp": ["error", { "ignoreStateless": false }],
      "max-lines": [
        "error",
        {
          "max": 300,
          "skipBlankLines": true,
          "skipComments": true
        }
      ]
    }
  },
  {
    files: ["vite.config.js", "eslint.config.js", "tools/**/*.mjs"],
    languageOptions: {
      globals: globals.node
    },
    rules: {
      "max-lines": "off"
    }
  }
);
