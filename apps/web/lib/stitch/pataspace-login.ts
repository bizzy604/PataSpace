import 'server-only';

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export type StitchScreenRecord = {
  order: number;
  id: string;
  slug: string;
  title: string;
  name: string;
  deviceType: string;
  width: number;
  height: number;
  screenshot: {
    hostedUrl: string;
    relativePath: string;
  };
  htmlCode: {
    hostedUrl: string;
    relativePath: string;
    mimeType: string;
  };
};

type StitchManifest = {
  exportedAt: string;
  project: {
    id: string;
    title: string;
    deviceType: string;
    projectType: string;
    visibility: string;
    origin: string;
    updateTime: string;
  };
  designSystems: Array<{
    requestedId: string;
    assetName: string;
    slug: string;
    displayName: string;
    version: string;
    jsonRelativePath: string;
    markdownRelativePath: string | null;
  }>;
  screens: StitchScreenRecord[];
};

const currentFilePath = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFilePath), '..', '..', '..', '..');
const docsRoot = path.join(repoRoot, 'Docs', 'Stitch', 'PataSpace-Login');
export const pataspaceLoginManifestPath = path.join(docsRoot, 'manifest.json');

let hasWarnedMissingManifest = false;
let hasWarnedInvalidManifest = false;

function readManifest() {
  if (!existsSync(pataspaceLoginManifestPath)) {
    if (!hasWarnedMissingManifest) {
      console.warn(
        `[stitch] Missing PataSpace Login export manifest at ${pataspaceLoginManifestPath}. Stitch-backed routes will render a fallback until the export is restored.`,
      );
      hasWarnedMissingManifest = true;
    }

    return null;
  }

  try {
    return JSON.parse(readFileSync(pataspaceLoginManifestPath, 'utf8')) as StitchManifest;
  } catch (error) {
    if (!hasWarnedInvalidManifest) {
      console.warn(
        `[stitch] Could not read PataSpace Login export manifest at ${pataspaceLoginManifestPath}. Stitch-backed routes will render a fallback.`,
        error,
      );
      hasWarnedInvalidManifest = true;
    }

    return null;
  }
}

function resolveDocsPath(relativePath: string) {
  return path.join(docsRoot, ...relativePath.split('/'));
}

export function getPataSpaceLoginManifest() {
  return readManifest();
}

export function getPataSpaceLoginScreens() {
  return readManifest()?.screens ?? [];
}

export function getPataSpaceLoginScreen(slug: string) {
  return readManifest()?.screens.find((screen) => screen.slug === slug) ?? null;
}

export function getPataSpaceLoginScreenByOrder(order: number) {
  return readManifest()?.screens.find((screen) => screen.order === order) ?? null;
}

export function readPataSpaceLoginHtml(slug: string) {
  const screen = getPataSpaceLoginScreen(slug);

  if (!screen) {
    return null;
  }

  const htmlPath = resolveDocsPath(screen.htmlCode.relativePath);

  if (!existsSync(htmlPath)) {
    return null;
  }

  return readFileSync(htmlPath, 'utf8');
}

export function readPataSpaceLoginScreenshot(slug: string) {
  const screen = getPataSpaceLoginScreen(slug);

  if (!screen) {
    return null;
  }

  const screenshotPath = resolveDocsPath(screen.screenshot.relativePath);

  if (!existsSync(screenshotPath)) {
    return null;
  }

  return readFileSync(screenshotPath);
}
