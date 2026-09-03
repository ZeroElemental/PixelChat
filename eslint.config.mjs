import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Nested git worktrees carry their own build output, and `eslint .` walks
    // into it -- 30k phantom problems from generated chunks that bury the real
    // ones. The globs above are root-anchored, so they do not cover it.
    "**/.next/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
