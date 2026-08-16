/**
 * Build-time constants injected by vite (see vite.config.ts `define`).
 *
 * `__KT_METRICS__` is `false` in every release build, which lets esbuild fold
 * the ternary in shared/metrics.ts and drop the live implementation entirely.
 * It is a constant on purpose rather than a setting: a runtime toggle would
 * still ship the code, and shipped code is what a store reviewer reads.
 */
declare const __KT_METRICS__: boolean;
