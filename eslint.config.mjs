import cypress from "eslint-plugin-cypress";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      ".*",
      ".*/",
      "_debug/*",
      "cypress.config.js",
      "assets/*/_debug/*",
      "assets/fontawesome/*",
      "cypress/*",
      "**/vendor/*",
    ],
  },
  ...compat.extends("eslint:recommended", "plugin:prettier/recommended"),
  {
    plugins: {
      cypress,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
      },

      parser: babelParser,
      ecmaVersion: "latest",
      sourceType: "module",

      parserOptions: {
        requireConfigFile: false,

        babelOptions: {
          plugins: [
            [
              "@babel/plugin-proposal-decorators",
              {
                decoratorsBeforeExport: true,
              },
            ],
          ],
        },
      },
    },

    rules: {
      "no-duplicate-imports": "error",
      "no-undef": "warn",
      "no-unused-vars": "warn",
    },
  },
  ...compat.extends("plugin:n/recommended").map((config) => ({
    ...config,

    files: [
      "./.eslintrc.js",
      "./.prettierrc.js",
      "./.stylelintrc.js",
      "./.template-lintrc.js",
    ],
  })),
  {
    files: [
      "./.eslintrc.js",
      "./.prettierrc.js",
      "./.stylelintrc.js",
      "./.template-lintrc.js",
    ],

    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.entries(globals.browser).map(([key]) => [key, "off"]),
        ),
        ...globals.node,
      },

      ecmaVersion: 5,
      sourceType: "commonjs",
    },
  },
  ...compat.extends("plugin:cypress/recommended").map((config) => ({
    ...config,
    files: ["tests/**/*-test.{js,ts}"],
  })),
];
