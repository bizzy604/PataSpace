/** @type {import('next').NextConfig} */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  // Emit a self-contained server bundle for a lean production image.
  output: 'standalone',
  // The workspace root, so file tracing pulls in the pnpm-linked dependencies
  // (e.g. @pataspace/contracts) that live outside apps/web.
  outputFileTracingRoot: path.join(currentDir, '../../'),
};

export default nextConfig;
