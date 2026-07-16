import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const incompatibleReactRules = [
  "react/display-name",
  "react/jsx-key",
  "react/jsx-no-comment-textnodes",
  "react/jsx-no-duplicate-props",
  "react/jsx-no-target-blank",
  "react/jsx-no-undef",
  "react/jsx-uses-react",
  "react/jsx-uses-vars",
  "react/no-children-prop",
  "react/no-danger-with-children",
  "react/no-deprecated",
  "react/no-direct-mutation-state",
  "react/no-find-dom-node",
  "react/no-is-mounted",
  "react/no-render-return-value",
  "react/no-string-refs",
  "react/no-unescaped-entities",
  "react/no-unknown-property",
  "react/no-unsafe",
  "react/prop-types",
  "react/react-in-jsx-scope",
  "react/require-render-return"
];

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: Object.fromEntries(incompatibleReactRules.map((ruleName) => [ruleName, "off"]))
  },
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "coverage/**"
    ]
  }
];

export default eslintConfig;
