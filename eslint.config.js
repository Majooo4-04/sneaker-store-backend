const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: { sourceType: "commonjs", globals: { ...globals.node } },
    rules: { "no-console": "warn", "no-unused-vars": "warn", eqeqeq: "warn" }
  }
];