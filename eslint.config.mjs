import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", ".scratch/", "_to_delete/", "coverage/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  {
    files: ["**/*.vue"],
    languageOptions: { parserOptions: { parser: tseslint.parser } },
  },
  { languageOptions: { globals: { ...globals.browser } } },
  { files: ["vite.config.ts"], languageOptions: { globals: { ...globals.node } } },
  // TS-aware rules supersede no-undef in .ts/.vue (typescript-eslint recommendation)
  { files: ["**/*.ts", "**/*.vue"], rules: { "no-undef": "off" } },
  // Page components are single-word by routing convention (Connect, Lighting, ...)
  { files: ["src/pages/**/*.vue"], rules: { "vue/multi-word-component-names": "off" } },
  {
    rules: {
      // window.location.href = window.location.href is the intentional force-reload idiom
      "no-self-assign": "off",
      // Swallowing SDK errors in retry/teardown paths is the established pattern here
      "no-empty": ["error", { allowEmptyCatch: true }],
      // Ratcheted 221 → 0 warnings in sprint-11; promoted to error:
      "@typescript-eslint/no-explicit-any": "error",
      // rest-sibling strips (`const { a, ...rest }`) are intentional
      "@typescript-eslint/no-unused-vars": ["error", {
        ignoreRestSiblings: true,
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      "preserve-caught-error": "error", // missing { cause } on rethrow
    },
  },
  // Standard Vue SFC shim boilerplate (DefineComponent<{}, {}, any>)
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);
