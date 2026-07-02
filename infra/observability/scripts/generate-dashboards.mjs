/**
 * Purpose: Writes the provisioned Grafana dashboard JSON files from their
 *   definitions in scripts/dashboards/, or verifies them with --check.
 * Why important: Keeps dashboards deterministic and reviewable in git; --check
 *   runs in CI so a hand-edited JSON or stale regeneration fails the build.
 * Used by: scripts/validate.sh, the observability CI job, and operators after
 *   editing a dashboard definition (node scripts/generate-dashboards.mjs).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiDashboard } from './dashboards/api-dashboard.mjs';
import { infraDashboard } from './dashboards/infra-dashboard.mjs';

const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), '..', 'grafana', 'dashboards');
const dashboards = [
  ['pataspace-api.json', apiDashboard],
  ['pataspace-infrastructure.json', infraDashboard],
];

const checkMode = process.argv.includes('--check');
let stale = false;

for (const [fileName, definition] of dashboards) {
  const filePath = join(outputDirectory, fileName);
  const rendered = `${JSON.stringify(definition, null, 2)}\n`;

  if (checkMode) {
    let existing = null;

    try {
      existing = readFileSync(filePath, 'utf8');
    } catch {
      // Missing file counts as stale.
    }

    if (existing !== rendered) {
      console.error(`STALE: ${filePath} does not match its definition. Run: node infra/observability/scripts/generate-dashboards.mjs`);
      stale = true;
    } else {
      console.log(`OK: ${fileName}`);
    }
  } else {
    mkdirSync(outputDirectory, { recursive: true });
    writeFileSync(filePath, rendered);
    console.log(`Wrote ${filePath}`);
  }
}

if (stale) {
  process.exit(1);
}
