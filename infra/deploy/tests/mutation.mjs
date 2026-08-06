#!/usr/bin/env node
// Purpose: Prove the gate suite actually catches the failures it claims to.
// Why important: A passing test suite proves nothing on its own — a test that
//   asserts against a comment, or a regex that never matches, is green forever
//   and catches nothing. This reintroduces each real failure mode one at a time
//   and requires the gate to go red. A mutant that survives is a hole in the
//   gate, reported as a failure here.
// Used by: pnpm test:deploy:mutation, before shipping a change to the gate.
//
// Every mutation is applied to a real file, verified to have actually changed
// the bytes, then reverted from an in-memory backup in a finally block. The tree
// is checksummed before and after; a mismatch aborts loudly.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEPLOY_DIR = join(HERE, '..');
const REPO_ROOT = join(DEPLOY_DIR, '..', '..');
const COMPOSE_DIR = join(REPO_ROOT, 'infra', 'docker');
const GATE = join(HERE, 'gate.test.mjs');

const f = {
  deploy: join(DEPLOY_DIR, 'deploy.sh'),
  lib: join(DEPLOY_DIR, 'lib.sh'),
  reset: join(DEPLOY_DIR, 'reset-db.sh'),
  webhook: join(DEPLOY_DIR, 'webhook.mjs'),
  vps: join(COMPOSE_DIR, 'docker-compose.vps.yml'),
  prod: join(COMPOSE_DIR, 'docker-compose.prod.yml'),
  dev: join(COMPOSE_DIR, 'docker-compose.yml'),
  timer: join(DEPLOY_DIR, 'systemd', 'pataspace-deploy.timer'),
  gitattributes: join(REPO_ROOT, '.gitattributes'),
};

// ---- Mutations ---------------------------------------------------------------
// Each `find` is written against LF text. Files in this repo are a mix of LF and
// CRLF (the compose files predate .gitattributes), so patch() normalizes to LF,
// applies, then restores the file's original ending. Without that, a pattern
// spanning a newline silently never matches and the mutant reports a false pass.

const MUTATIONS = [
  {
    id: 'volume-inline',
    why: 'postgres volume made inline again — `down -v` would delete it',
    file: f.vps,
    find: 'postgres_data:\n    external: true',
    replace: 'postgres_data:\n    external: false',
  },
  {
    id: 'volume-name-unpinned',
    why: 'volume name unpinned — a different project name attaches an empty DB',
    file: f.vps,
    find: '    name: ${POSTGRES_VOLUME:-pataspace_postgres_data}',
    replace: '',
  },
  {
    id: 'redis-volume-inline',
    why: 'redis volume made inline again',
    file: f.vps,
    find: 'redis_data:\n    external: true',
    replace: 'redis_data:\n    external: false',
  },
  {
    id: 'prod-service-dedented',
    why: 'the original bug: `api` dedented out of `services:`, so it never ran',
    file: f.prod,
    find: '\n  api:\n    build:',
    replace: '\napi:\n  build:',
  },
  {
    id: 'dev-project-name-dropped',
    why: 'compose project name unpinned — volume namespace follows the directory',
    file: f.dev,
    find: 'name: docker\n',
    replace: '',
  },
  {
    id: 'teardown-with-volumes',
    why: 'a volume-destroying teardown added to the deploy path',
    file: f.deploy,
    find: 'log "ensuring postgres + redis are up"',
    replace: 'dc_safe down -v\nlog "ensuring postgres + redis are up"',
  },
  {
    id: 'teardown-raw-compose',
    why: 'the same teardown, bypassing the wrapper with a raw docker compose call',
    file: f.deploy,
    find: 'log "ensuring postgres + redis are up"',
    replace: 'docker compose down --volumes\nlog "ensuring postgres + redis are up"',
  },
  {
    id: 'teardown-hidden-in-string',
    why: 'a teardown smuggled past the literal-stripper via eval',
    file: f.deploy,
    find: 'log "ensuring postgres + redis are up"',
    replace: 'eval "dc_safe down -v"\nlog "ensuring postgres + redis are up"',
  },
  {
    id: 'dc-safe-guard-removed',
    why: 'dc_safe stops rejecting -v, so the runtime guard is gone',
    file: f.lib,
    find: '    -v|--volumes)',
    replace: '    --this-flag-does-not-exist)',
  },
  {
    id: 'dc-safe-warns-not-dies',
    why: 'dc_safe warns instead of aborting, so the command still runs',
    file: f.lib,
    find: 'die "refusing compose command',
    replace: 'warn "refusing compose command',
  },
  {
    id: 'prune-volumes',
    why: '`docker system prune --volumes` added to cleanup',
    file: f.deploy,
    find: 'docker image prune -f',
    replace: 'docker system prune -f --volumes',
  },
  {
    id: 'prune-all-images',
    why: '`image prune -a` deletes the SHA-tagged image rollback depends on',
    file: f.deploy,
    find: 'docker image prune -f',
    replace: 'docker image prune -f -a',
  },
  {
    id: 'backup-after-migrate',
    why: 'backup moved after migrations — the dump captures the migrated schema',
    file: f.deploy,
    find: '    if ! dc exec -T postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists \\\n           | gzip -9 > "$BACKUP_FILE"; then',
    replace: '    if false; then # pg_dump moved below, after migrations',
  },
  {
    id: 'backup-failure-ignored',
    why: 'a failed pg_dump warns instead of aborting — deploy runs with no backup',
    file: f.deploy,
    find: 'die "pg_dump failed',
    replace: 'warn "pg_dump failed',
  },
  {
    id: 'gzip-integrity-check-dropped',
    why: 'a truncated or corrupt archive is accepted as a valid backup',
    file: f.deploy,
    find: '    if ! gzip -t "$BACKUP_FILE" 2>/dev/null; then',
    replace: '    if false; then',
  },
  {
    id: 'dump-header-check-dropped',
    why: 'a gzipped error message passes as a backup (pg_dump can exit 0 and write junk)',
    file: f.deploy,
    find: "head -40 | grep -q 'PostgreSQL database dump'",
    replace: "head -40 | grep -qv 'PostgreSQL database dump'",
  },
  {
    id: 'rollback-trap-commented',
    why: 'the rollback trap commented out — a failed deploy leaves a broken stack',
    file: f.deploy,
    find: '\ntrap rollback ERR\n',
    replace: '\n# trap rollback ERR\n',
  },
  {
    id: 'build-after-recreate',
    why: 'containers recreated before the build, so a build failure means downtime',
    file: f.deploy,
    find: 'API_IMAGE="$NEW_API_IMAGE" WEB_IMAGE="$NEW_WEB_IMAGE" dc_safe build api web \\\n  || die "image build failed',
    replace: 'API_IMAGE="$NEW_API_IMAGE" WEB_IMAGE="$NEW_WEB_IMAGE" dc_safe up -d --no-build api web \\\n  || die "image build failed',
  },
  {
    id: 'postgres-in-app-recreate',
    why: 'postgres folded into the app recreate — needless container churn on the DB',
    file: f.deploy,
    find: 'dc_safe up -d --no-build api web',
    replace: 'dc_safe up -d --no-build api web postgres',
  },
  {
    id: 'reset-confirmation-removed',
    why: 'reset-db.sh stops requiring a typed confirmation before wiping',
    file: f.reset,
    find: 'read -r reply',
    replace: 'reply=DELETE',
  },
  {
    id: 'signature-check-removed',
    why: 'the webhook accepts any request — anyone on the internet triggers a deploy',
    file: f.webhook,
    find: '  return timingSafeEqual(a, b);',
    replace: '  return true;',
  },
  {
    id: 'signature-not-constant-time',
    why: 'constant-time compare replaced with ===, leaking the signature by timing',
    file: f.webhook,
    find: '  return timingSafeEqual(a, b);',
    replace: '  return a.toString() === b.toString();',
  },
  {
    id: 'any-branch-deploys',
    why: 'a push to any branch deploys, so an unreviewed branch reaches production',
    file: f.webhook,
    find: '  return payload?.ref === `refs/heads/${branch}`;',
    replace: '  return typeof payload?.ref === \'string\';',
  },
  {
    id: 'timer-disabled',
    why: 'the poll timer never repeats, so the guaranteed CD path stops working',
    file: f.timer,
    find: 'OnUnitInactiveSec=',
    replace: '#OnUnitInactiveSec=',
  },
  {
    id: 'gitattributes-lf-dropped',
    why: 'scripts no longer pinned to LF — CRLF checkout breaks the shebang on Linux',
    file: f.gitattributes,
    find: '*.sh        text eol=lf',
    replace: '*.sh        text',
  },
];

// ---- Harness -----------------------------------------------------------------

const rel = (p) => relative(REPO_ROOT, p).replace(/\\/g, '/');

/** Hash of every file a mutation can touch — the proof we restored the tree. */
function treeHash() {
  const h = createHash('sha256');
  for (const p of Object.values(f).sort()) h.update(p).update(readFileSync(p));
  return h.digest('hex').slice(0, 12);
}

/**
 * Applies `find` -> `replace` on LF-normalized text, then restores the file's
 * original line endings. Returns false if the pattern did not match, so a stale
 * mutation reports SKIP instead of masquerading as a caught mutant.
 */
function patch(file, find, replace) {
  const original = readFileSync(file, 'utf8');
  const wasCRLF = original.includes('\r\n');
  const lf = original.replace(/\r\n/g, '\n');
  if (!lf.includes(find)) return false;

  const mutated = lf.replace(find, replace);
  writeFileSync(file, wasCRLF ? mutated.replace(/\n/g, '\r\n') : mutated);
  return true;
}

/** Runs the gate. Returns true when it passes (i.e. the mutant escaped). */
function gatePasses() {
  try {
    execFileSync(process.execPath, ['--test', GATE], { stdio: 'pipe', cwd: REPO_ROOT });
    return true;
  } catch {
    return false;
  }
}

const before = treeHash();
console.log(`mutation testing the deploy gate  (tree ${before})\n`);

if (!gatePasses()) {
  console.error('FAIL: the gate is already red on a clean tree. Fix that first.');
  process.exit(1);
}
console.log('  baseline: gate is green on a clean tree\n');

const backups = new Map(Object.values(f).map((p) => [p, readFileSync(p)]));
const results = [];

try {
  for (const m of MUTATIONS) {
    let status;
    if (!patch(m.file, m.find, m.replace)) {
      status = 'SKIP';
    } else {
      status = gatePasses() ? 'ESCAPED' : 'caught';
      writeFileSync(m.file, backups.get(m.file)); // revert before the next mutant
    }

    results.push({ ...m, status });
    const mark = { caught: '  ✔', ESCAPED: '  ✖', SKIP: '  ~' }[status];
    console.log(`${mark} ${status.padEnd(8)} ${m.id.padEnd(28)} ${rel(m.file)}`);
    if (status !== 'caught') console.log(`      ${m.why}`);
  }
} finally {
  for (const [p, buf] of backups) writeFileSync(p, buf);
}

const after = treeHash();
if (after !== before) {
  console.error(`\nFATAL: tree not restored (${before} -> ${after}). Check 'git status'.`);
  process.exit(1);
}

const caught = results.filter((r) => r.status === 'caught').length;
const escaped = results.filter((r) => r.status === 'ESCAPED');
const skipped = results.filter((r) => r.status === 'SKIP');

console.log(`\n  ${caught}/${MUTATIONS.length} mutations caught   (tree restored, ${after})`);

if (skipped.length) {
  console.error(`\n  ${skipped.length} mutation(s) never applied — the pattern no longer matches:`);
  for (const s of skipped) console.error(`    - ${s.id}: pattern not found in ${rel(s.file)}`);
  console.error('  A stale mutation tests nothing. Update the pattern.');
}

if (escaped.length) {
  console.error(`\n  ${escaped.length} mutation(s) ESCAPED — the gate does not cover:`);
  for (const e of escaped) console.error(`    - ${e.id}: ${e.why}`);
}

if (escaped.length || skipped.length) {
  console.error('\nFAIL: the gate does not cover every failure mode.');
  process.exit(1);
}

console.log('  PASS: every failure mode is covered by the gate.\n');
