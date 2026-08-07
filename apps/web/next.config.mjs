/** @type {import('next').NextConfig} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const workspaceRoot = path.join(currentDir, '../../');

const nextConfig = {
  reactStrictMode: true,
  // Next 16 holds a per-build-directory dev lock, so a second `next dev` in
  // apps/web is refused while a developer's own server is up. The e2e suite
  // sets NEXT_DIST_DIR so its throwaway server locks its own directory and
  // the gate tests stay runnable without killing anyone's dev server.
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  // Emit a self-contained server bundle for a lean production image.
  output: 'standalone',
  // The workspace root, so file tracing pulls in the pnpm-linked dependencies
  // (e.g. @pataspace/contracts) that live outside apps/web.
  outputFileTracingRoot: workspaceRoot,
  // Pin Turbopack's root to the same workspace root. Without it, Turbopack's
  // auto-inference walks up and fails to locate `next/package.json` when the
  // checkout is a nested git worktree (node_modules is symlinked from the
  // workspace root, not present directly under apps/web).
  turbopack: {
    root: workspaceRoot,
  },
};

export default nextConfig;
