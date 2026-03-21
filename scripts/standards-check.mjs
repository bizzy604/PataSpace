/**
 * Purpose: Checks repository engineering standards that can be validated automatically.
 * Why important: Gives the team a repeatable way to detect missing app READMEs and oversized source files.
 * Used by: Root workspace scripts, future CI hooks, and contributors validating repo hygiene.
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const appRoots = ['apps/api', 'apps/web', 'apps/admin', 'apps/mobile'];
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
const ignoredSegments = new Set([
  '.git',
  '.next',
  '.expo',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

function walk(directory, results = []) {
  const entries = readdirSync(directory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      if (!ignoredSegments.has(entry.name)) {
        walk(fullPath, results);
      }

      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    const extension = path.extname(entry.name);

    if (sourceExtensions.has(extension)) {
      results.push(fullPath);
    }
  }

  return results;
}

function countPhysicalLines(filePath) {
  const contents = readFileSync(filePath, 'utf8');

  if (contents.length === 0) {
    return 0;
  }

  return contents.split(/\r?\n/).length;
}

function relative(filePath) {
  return path.relative(repoRoot, filePath).replaceAll('\\', '/');
}

const missingReadmes = appRoots
  .map((appRoot) => path.join(repoRoot, appRoot, 'README.md'))
  .filter((readmePath) => !existsSync(readmePath))
  .map(relative);

const candidates = ['apps', 'packages']
  .map((folder) => path.join(repoRoot, folder))
  .filter((folder) => existsSync(folder) && statSync(folder).isDirectory())
  .flatMap((folder) => walk(folder));

const oversizedFiles = candidates
  .map((filePath) => ({
    lines: countPhysicalLines(filePath),
    path: relative(filePath),
  }))
  .filter((entry) => entry.lines > 200)
  .sort((left, right) => right.lines - left.lines);

if (missingReadmes.length === 0 && oversizedFiles.length === 0) {
  console.log('Engineering standards check passed.');
  process.exit(0);
}

if (missingReadmes.length > 0) {
  console.log('Missing app README files:');

  for (const readme of missingReadmes) {
    console.log(`- ${readme}`);
  }
}

if (oversizedFiles.length > 0) {
  console.log('Source files over the 200-line limit:');

  for (const violation of oversizedFiles) {
    console.log(`- ${violation.path}: ${violation.lines} lines`);
  }
}

process.exit(1);
