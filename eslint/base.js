export default [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: "@typescript-eslint/parser",
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": "@typescript-eslint/eslint-plugin",
    },
    rules: {
      // Basic rules
      "no-console": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-undef": "off",
      "no-var": "error",
      "prefer-const": "warn",
      
      // Formatting
      "semi": ["warn", "always"],
      "quotes": ["warn", "double", { "avoidEscape": true }],
      "indent": ["warn", 2, { "SwitchCase": 1 }],
      "comma-dangle": ["warn", "always-multiline"],
      
      // TypeScript specific
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  },
];
