import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "node_modules/**",
      "api/**",
      "mcp_server/**",
      "agent/**",
      ".venv/**"
    ]
  },
  ...nextVitals,
  ...nextTs
];

export default eslintConfig;
