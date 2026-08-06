// Purpose: Gate tests for the deploy tooling and the data-durability guarantees.
// Why important: The database wipe was a structural bug. These tests make the
//   structure that prevents it non-removable — anything that reintroduces an
//   inline volume or a destructive flag fails here before it can reach the VPS.
// Used by: `pnpm test:deploy`, pre-commit, and before any VPS deploy.
//
// Constraints: deterministic, no network, no Docker, no secrets, well under 2s.
// The slow behavioural proof lives in tests/persistence.eval.sh instead.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHmac } from 'node:crypto';
import { parse as parseYaml } from 'yaml';

const HERE = dirname(fileURLToPath(import.meta.url));
const DEPLOY_DIR = join(HERE, '..');
const REPO_ROOT = join(DEPLOY_DIR, '..', '..');
const DOCKER_DIR = join(REPO_ROOT, 'infra', 'docker');

const read = (p) => readFileSync(p, 'utf8');
// Normalize CRLF: this repo is developed on Windows with core.autocrlf=true, so
// working-tree files carry \r\n. Every pattern below is written against \n.
const readLF = (p) => read(p).replace(/\r\n/g, '\n');
const loadCompose = (f) => parseYaml(readLF(join(DOCKER_DIR, f)));

/** Source lines with comments and blank lines stripped — what actually executes. */
const codeLines = (body) =>
  body.split('\n').map((line, i) => ({ n: i + 1, raw: line, code: line.split('#')[0] }))
    .filter(({ code }) => code.trim().length > 0);

/**
 * Blanks out quoted string literals so a command named inside a log message is
 * not mistaken for an invocation — `err "run: docker compose logs"` runs
 * nothing. A span containing a command substitution is kept verbatim, because
 * `"$(docker compose ...)"` genuinely does execute. The premise that a quoted
 * string is inert is enforced by the `eval` ban below.
 */
const stripLiterals = (code) =>
  code.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, (span) => (/\$\(|`/.test(span) ? span : '""'));

/** Argument tokens from a command line: drops flags, redirections, env prefixes. */
const argTokens = (s) =>
  s.split(/\s+/).filter((t) => t && t !== '\\' && !t.startsWith('-') && !/[<>=]/.test(t));

// Every compose file that defines a postgres service must protect its data.
const STATEFUL_COMPOSE = ['docker-compose.yml', 'docker-compose.vps.yml', 'docker-compose.prod.yml'];

const SHELL_SCRIPTS = readdirSync(DEPLOY_DIR)
  .filter((f) => f.endsWith('.sh'))
  .map((f) => join(DEPLOY_DIR, f));

describe('compose: database volumes cannot be destroyed by a rebuild', () => {
  for (const file of STATEFUL_COMPOSE) {
    test(`${file} declares postgres_data external with a pinned name`, () => {
      const doc = loadCompose(file);
      const vol = doc.volumes?.postgres_data;

      assert.ok(vol, `${file} must define a postgres_data volume`);
      assert.equal(
        vol.external, true,
        `${file}: postgres_data must be external:true, otherwise 'docker compose down -v' deletes the database`,
      );
      assert.ok(
        typeof vol.name === 'string' && vol.name.length > 0,
        `${file}: postgres_data needs an explicit name, otherwise the volume is namespaced by project/directory and a rebuild elsewhere silently attaches an empty database`,
      );
    });

    test(`${file} declares redis_data external with a pinned name`, () => {
      const doc = loadCompose(file);
      const vol = doc.volumes?.redis_data;
      assert.ok(vol, `${file} must define a redis_data volume`);
      assert.equal(vol.external, true, `${file}: redis_data must be external:true`);
      assert.ok(vol.name, `${file}: redis_data needs an explicit name`);
    });
  }

  // Guards the zero-migration promise: these defaults are the volume names the
  // running stacks already use. Changing them orphans live data.
  test('pinned names keep pointing at the already-live volumes', () => {
    const vps = loadCompose('docker-compose.vps.yml');
    assert.match(vps.volumes.postgres_data.name, /pataspace_postgres_data/);
    assert.match(vps.volumes.redis_data.name, /pataspace_redis_data/);

    const dev = loadCompose('docker-compose.yml');
    assert.match(dev.volumes.postgres_data.name, /docker_postgres_data/);
    assert.match(dev.volumes.redis_data.name, /docker_redis_data/);
  });

  test('project name is pinned so it never derives from the directory', () => {
    for (const file of STATEFUL_COMPOSE) {
      const doc = loadCompose(file);
      assert.ok(
        typeof doc.name === 'string' && doc.name.length > 0,
        `${file}: needs a top-level 'name:' — without it Compose uses the parent directory name, so the same stack in a different path gets a different volume namespace`,
      );
    }
  });
});

describe('compose: structural validity', () => {
  // docker-compose.prod.yml previously had `api:` dedented to the top level,
  // which silently removed the api and web services from the stack.
  test('every stateful compose file defines the full service set', () => {
    for (const file of ['docker-compose.vps.yml', 'docker-compose.prod.yml']) {
      const doc = loadCompose(file);
      const services = Object.keys(doc.services ?? {});
      for (const required of ['postgres', 'redis', 'api', 'api-migrate', 'web']) {
        assert.ok(services.includes(required), `${file}: missing service '${required}' (got: ${services.join(', ') || 'none'})`);
      }
    }
  });

  test('no service key leaked to the top level of the document', () => {
    const allowed = new Set(['name', 'version', 'services', 'volumes', 'networks', 'configs', 'secrets', 'include', 'x-']);
    for (const file of STATEFUL_COMPOSE) {
      const doc = loadCompose(file);
      for (const key of Object.keys(doc)) {
        assert.ok(
          allowed.has(key) || key.startsWith('x-'),
          `${file}: unexpected top-level key '${key}' — a service is probably indented wrong`,
        );
      }
    }
  });

  test('api healthcheck targets the route the API actually serves', () => {
    // AppController declares @Get('health') under the api/v1 global prefix.
    const controller = read(join(REPO_ROOT, 'apps', 'api', 'src', 'app.controller.ts'));
    assert.match(controller, /@Get\('health'\)/, 'app.controller.ts no longer defines a health route');

    for (const file of ['docker-compose.vps.yml', 'docker-compose.prod.yml']) {
      const doc = loadCompose(file);
      const probe = JSON.stringify(doc.services.api.healthcheck.test);
      assert.match(probe, /\/api\/v1\/health/, `${file}: healthcheck must probe /api/v1/health`);
    }
  });
});

describe('deploy scripts: no path can destroy data', () => {
  // The whole point of the rewrite. A teardown carrying a volume flag is the
  // single command that wipes the database, so no script may issue one —
  // whether via `docker compose`, the `dc` wrapper, or `dc_safe`.
  test('no script issues a volume-destroying teardown', () => {
    for (const path of SHELL_SCRIPTS) {
      for (const { n, raw, code } of codeLines(readLF(path))) {
        assert.ok(
          !/(^|[;&|]|\s)(dc_safe|dc|docker\s+compose)\s+[^;&|]*\bdown\b[^;&|]*(\s-v\b|--volumes\b)/
            .test(stripLiterals(code)),
          `${path}:${n} issues a volume-destroying teardown: ${raw.trim()}`,
        );
      }
    }
  });

  // stripLiterals() assumes a quoted string cannot execute. `eval` breaks that
  // assumption, so it is banned outright — which is good practice regardless.
  test('no script uses eval', () => {
    for (const path of SHELL_SCRIPTS) {
      for (const { n, raw, code } of codeLines(readLF(path))) {
        assert.ok(
          !/(^|[;&|(]|\s)eval\s/.test(code),
          `${path}:${n} uses eval, which would let a quoted command string execute: ${raw.trim()}`,
        );
      }
    }
  });

  // dc_safe is the enforcement point: it must reject -v before Docker sees it.
  test('dc_safe rejects volume flags at runtime, not just by convention', () => {
    const lib = readLF(join(DEPLOY_DIR, 'lib.sh'));
    assert.match(lib, /dc_safe\(\)/, 'lib.sh must define dc_safe');
    assert.match(lib, /-v\|--volumes\)/, 'dc_safe must match both -v and --volumes');
    assert.match(lib, /die "refusing compose command/, 'dc_safe must abort, not warn');
  });

  test('deploy.sh routes every compose call through the guarded wrapper', () => {
    // A raw `docker compose` call bypasses dc_safe entirely. Log messages that
    // *mention* the command for the operator are fine — stripLiterals drops them.
    for (const { n, raw, code } of codeLines(readLF(join(DEPLOY_DIR, 'deploy.sh')))) {
      assert.ok(
        !/(^|[;&|(]|\s)docker\s+compose\s/.test(stripLiterals(code)),
        `deploy.sh:${n} calls 'docker compose' directly instead of dc/dc_safe: ${raw.trim()}`,
      );
    }
  });

  test('no script prunes volumes or runs a blanket image prune', () => {
    for (const path of SHELL_SCRIPTS) {
      for (const { n, raw, code } of codeLines(readLF(path))) {
        assert.ok(
          !/docker\s+system\s+prune[^;&|]*--volumes/.test(code),
          `${path}:${n} runs 'docker system prune --volumes': ${raw.trim()}`,
        );
        assert.ok(
          !/docker\s+volume\s+prune/.test(code),
          `${path}:${n} runs 'docker volume prune': ${raw.trim()}`,
        );
        // `image prune -a` would delete the previous SHA-tagged image that
        // rollback depends on.
        assert.ok(
          !/docker\s+image\s+prune[^;&|]*\s-a\b/.test(code),
          `${path}:${n} runs 'docker image prune -a', which deletes the rollback image: ${raw.trim()}`,
        );
      }
    }
  });

  test('only reset-db.sh may remove a volume, and only behind a confirmation', () => {
    for (const path of SHELL_SCRIPTS) {
      const body = readLF(path);
      const removesVolume = codeLines(body).some(({ code }) => /docker\s+volume\s+rm/.test(code));

      if (!removesVolume) continue;
      assert.ok(path.endsWith('reset-db.sh'), `${path} removes a volume but is not reset-db.sh`);
      assert.match(body, /read -r reply/, 'reset-db.sh must prompt before removing a volume');
      assert.match(body, /DELETE/, 'reset-db.sh must require typing DELETE');
    }
  });

  test('deploy.sh takes a real backup, and takes it before migrating', () => {
    const lines = codeLines(readLF(join(DEPLOY_DIR, 'deploy.sh')));

    // Anchor on the executing line, not any mention of the word: a commented-out
    // `# pg_dump` placed after the migration must not satisfy this.
    const backupLine = lines.find(({ code }) => /\bpg_dump\b/.test(code));
    const migrateLine = lines.find(({ code }) => /run --rm --no-deps api-migrate/.test(code));

    assert.ok(backupLine, 'deploy.sh must run pg_dump (found no executing pg_dump line)');
    assert.ok(migrateLine, 'deploy.sh must run the api-migrate step');

    // The dump is a multi-line pipeline, so look at the statement, not the line:
    // `pg_dump ... \n | gzip -9 > "$BACKUP_FILE"`.
    const statement = lines
      .filter(({ n }) => n >= backupLine.n && n <= backupLine.n + 2)
      .map(({ code }) => code)
      .join(' ');
    assert.match(statement, /\|\s*gzip/, 'the dump must be piped into gzip, not left uncompressed');
    assert.match(statement, />\s*"\$BACKUP_FILE"/, 'the dump must be written to $BACKUP_FILE');

    assert.ok(
      backupLine.n < migrateLine.n,
      `the backup (line ${backupLine.n}) must run BEFORE migrations (line ${migrateLine.n})`,
    );
  });

  test('deploy.sh aborts the deploy when the backup fails', () => {
    const body = readLF(join(DEPLOY_DIR, 'deploy.sh'));
    assert.match(
      body, /die "pg_dump failed/,
      'a failed backup must abort the deploy, not warn and continue',
    );
    // The validation moved from a size floor to a content check: gzip integrity,
    // presence of the pg_dump header, and a floor low enough to pass a small DB.
    assert.match(body, /gzip -t/, 'deploy.sh must validate the backup is a real gzip archive');
    // The header check must use grep -q (success when found), not grep -qv (success when absent).
    assert.match(
      body, /grep -q ['"]PostgreSQL database dump['"]/,
      'deploy.sh must check the dump carries a pg_dump header with grep -q (not -qv)',
    );
  });

  test('deploy.sh builds images before recreating containers (zero-downtime on build failure)', () => {
    const body = readLF(join(DEPLOY_DIR, 'deploy.sh'));
    const buildAt = body.indexOf('dc_safe build api web');
    // Match the forward-path recreate specifically. rollback() also calls
    // `up -d --no-build` but with the PREV_* images, and it is defined earlier
    // in the file, so a looser match would compare against the wrong call.
    const upAt = body.indexOf('WEB_IMAGE="$NEW_WEB_IMAGE" dc_safe up -d --no-build api web');
    assert.ok(buildAt > 0, 'deploy.sh must build the images');
    assert.ok(upAt > 0, 'deploy.sh must recreate api/web with the new images');
    assert.ok(buildAt < upAt, 'build must precede container recreation');
  });

  test('deploy.sh arms a rollback trap on the executing path', () => {
    const body = readLF(join(DEPLOY_DIR, 'deploy.sh'));
    const lines = codeLines(body);

    // Must be a live line, not a commented-out one.
    const trapLine = lines.find(({ code }) => /^\s*trap\s+rollback\s+ERR\s*$/.test(code));
    assert.ok(trapLine, "deploy.sh must arm 'trap rollback ERR' as executing code (not commented out)");

    // And it must be armed before the first mutating step (the checkout).
    const checkoutLine = lines.find(({ code }) => /git checkout --quiet --detach "\$TARGET_SHA"/.test(code));
    assert.ok(checkoutLine, 'deploy.sh must check out the target commit');
    assert.ok(
      trapLine.n > checkoutLine.n,
      'the rollback trap must be armed immediately after the checkout that made the tree mutable',
    );

    assert.match(body, /git checkout --quiet --detach "\$CURRENT_SHA"/, 'rollback must restore the previous commit');
  });

  test('deploy.sh only brings up service sets that have been reviewed', () => {
    // Two legitimate targets exist: the infra pair and the app pair. Anything
    // else — a bare `up -d` (every service), or postgres bundled into the app
    // recreate — is an unreviewed change to what gets torn down and rebuilt.
    const REVIEWED = new Set(['postgres redis', 'api web']);

    let found = 0;
    for (const { n, raw, code } of codeLines(readLF(join(DEPLOY_DIR, 'deploy.sh')))) {
      const call = code.match(/dc_safe\s+up\s([^|&;]*)/);
      if (!call) continue;
      found++;
      const services = argTokens(call[1]).join(' ');
      assert.ok(
        REVIEWED.has(services),
        `deploy.sh:${n} brings up an unreviewed service set '${services}': ${raw.trim()}`,
      );
    }
    assert.ok(found >= 2, `expected at least the infra and app 'up' calls, found ${found}`);
  });

  test('every script is syntactically valid bash', () => {
    for (const path of SHELL_SCRIPTS) {
      assert.doesNotThrow(
        () => execFileSync('bash', ['-n', path], { stdio: 'pipe' }),
        `${path} has a bash syntax error`,
      );
    }
  });

  // A CRLF shebang line makes Linux report "bad interpreter: bash^M". This repo
  // is developed on Windows with core.autocrlf=true, so it is a live risk; the
  // .gitattributes rule is what keeps checkouts on the VPS clean.
  test('shell scripts and units are LF-only in the working tree', () => {
    const UNIT_DIR = join(DEPLOY_DIR, 'systemd');
    const files = [
      ...SHELL_SCRIPTS,
      join(DEPLOY_DIR, 'webhook.mjs'),
      ...readdirSync(UNIT_DIR).map((f) => join(UNIT_DIR, f)),
    ];
    for (const path of files) {
      assert.ok(
        !read(path).includes('\r\n'),
        `${path} has CRLF line endings; on Linux this breaks the shebang and systemd parsing`,
      );
    }
  });

  test('.gitattributes forces LF for scripts and units', () => {
    const ga = readLF(join(REPO_ROOT, '.gitattributes'));
    for (const pattern of ['*.sh', '*.mjs']) {
      assert.match(ga, new RegExp(`${pattern.replace('.', '\\.').replace('*', '\\*')}\\s+text\\s+eol=lf`),
        `.gitattributes must pin ${pattern} to eol=lf`);
    }
    assert.match(ga, /\*\.service\s+text\s+eol=lf/, '.gitattributes must pin systemd units to eol=lf');
  });

  test('every script sets strict mode', () => {
    for (const path of SHELL_SCRIPTS) {
      const body = read(path);
      if (body.includes('Sourced, never executed')) continue; // lib.sh inherits it
      assert.match(body, /set -Eeuo pipefail/, `${path} must use 'set -Eeuo pipefail'`);
    }
  });
});

describe('systemd units', () => {
  const UNIT_DIR = join(DEPLOY_DIR, 'systemd');
  const units = readdirSync(UNIT_DIR).filter((f) => statSync(join(UNIT_DIR, f)).isFile());

  test('units exist for both the timer and the webhook', () => {
    for (const expected of ['pataspace-deploy.service', 'pataspace-deploy.timer', 'pataspace-webhook.service']) {
      assert.ok(units.includes(expected), `missing systemd unit ${expected}`);
    }
  });

  test('each unit has the sections systemd requires', () => {
    for (const unit of units) {
      const body = read(join(UNIT_DIR, unit));
      assert.match(body, /^\[Unit\]$/m, `${unit} missing [Unit]`);
      assert.match(body, /^\[Install\]$/m, `${unit} missing [Install]`);
      assert.match(body, unit.endsWith('.timer') ? /^\[Timer\]$/m : /^\[Service\]$/m, `${unit} missing its main section`);
    }
  });

  test('the deploy service never auto-restarts a failed deploy', () => {
    const body = read(join(UNIT_DIR, 'pataspace-deploy.service'));
    assert.match(body, /Restart=no/, 'a retry loop on a broken commit burns CPU and spams logs');
  });

  test('the poll timer actually repeats', () => {
    // The timer is the guaranteed CD path (the webhook is only an accelerator),
    // so a timer that fires once at boot and never again silently ends CD.
    // Assert on live directives: a commented-out OnUnitInactiveSec does nothing.
    const live = codeLines(readLF(join(UNIT_DIR, 'pataspace-deploy.timer'))).map(({ code }) => code.trim());

    const repeats = live.some((l) => /^(OnUnitInactiveSec|OnUnitActiveSec|OnCalendar)=\S/.test(l));
    assert.ok(repeats, 'the timer needs a repeating trigger (OnUnitInactiveSec / OnUnitActiveSec / OnCalendar)');

    assert.ok(
      live.some((l) => /^Persistent=true$/.test(l)),
      'Persistent=true is what runs a check missed while the VPS was down',
    );
    assert.ok(
      live.some((l) => /^Unit=pataspace-deploy\.service$/.test(l)),
      'the timer must name the service it triggers',
    );
  });

  test('no unit hardcodes a secret', () => {
    for (const unit of units) {
      const body = read(join(UNIT_DIR, unit));
      const assignments = body.match(/^Environment=PATA_WEBHOOK_SECRET=.+$/m);
      assert.equal(assignments, null, `${unit} hardcodes the webhook secret; use EnvironmentFile instead`);
    }
  });
});

describe('webhook: signature verification is the only thing guarding a shell command', async () => {
  const { verifySignature, shouldDeploy } = await import('../webhook.mjs');

  const SECRET = 'it-is-a-test-secret-0123456789';
  const BODY = Buffer.from(JSON.stringify({ ref: 'refs/heads/main', after: 'abc123' }));
  // Signature GitHub would send for this body+secret pair.
  const sign = (body, secret) =>
    'sha256=' + createHmac('sha256', secret).update(body).digest('hex');

  test('accepts a correctly signed payload', () => {
    assert.equal(verifySignature(BODY, sign(BODY, SECRET), SECRET), true);
  });

  test('rejects a wrong secret', () => {
    assert.equal(verifySignature(BODY, sign(BODY, 'wrong-secret'), SECRET), false);
  });

  test('rejects a tampered body', () => {
    const good = sign(BODY, SECRET);
    const tampered = Buffer.from(JSON.stringify({ ref: 'refs/heads/main', after: 'deadbeef' }));
    assert.equal(verifySignature(tampered, good, SECRET), false);
  });

  test('rejects a missing or malformed signature header', () => {
    assert.equal(verifySignature(BODY, undefined, SECRET), false);
    assert.equal(verifySignature(BODY, '', SECRET), false);
    assert.equal(verifySignature(BODY, 'sha1=abc', SECRET), false);
    assert.equal(verifySignature(BODY, 'garbage', SECRET), false);
  });

  test('rejects everything when no secret is configured', () => {
    assert.equal(verifySignature(BODY, sign(BODY, ''), ''), false);
  });

  test('a length-mismatched signature is rejected without throwing', () => {
    // timingSafeEqual throws on unequal lengths; verifySignature must not.
    assert.doesNotThrow(() => verifySignature(BODY, 'sha256=short', SECRET));
    assert.equal(verifySignature(BODY, 'sha256=short', SECRET), false);
  });

  test('only a push to the deploy branch triggers a deploy', () => {
    assert.equal(shouldDeploy('push', { ref: 'refs/heads/main' }, 'main'), true);
    assert.equal(shouldDeploy('push', { ref: 'refs/heads/dev' }, 'main'), false);
    assert.equal(shouldDeploy('push', { ref: 'refs/tags/v1.0.0' }, 'main'), false);
    assert.equal(shouldDeploy('ping', { ref: 'refs/heads/main' }, 'main'), false);
    assert.equal(shouldDeploy('pull_request', { ref: 'refs/heads/main' }, 'main'), false);
    assert.equal(shouldDeploy('push', {}, 'main'), false);
    assert.equal(shouldDeploy('push', null, 'main'), false);
  });

  test('webhook.mjs never passes request data through a shell', () => {
    const body = read(join(DEPLOY_DIR, 'webhook.mjs'));
    assert.match(body, /shell:\s*false/, 'spawn must run without a shell');
    assert.ok(!/exec\(/.test(body), 'child_process.exec interpolates into a shell; use spawn with an argv array');
  });

  test('the comparison itself is constant-time', () => {
    // A behavioural test cannot see this: `===` returns the same booleans as
    // timingSafeEqual for every input, it just leaks the signature by timing.
    // So it is asserted structurally.
    const body = readLF(join(DEPLOY_DIR, 'webhook.mjs'));
    assert.match(body, /timingSafeEqual/, 'verifySignature must use crypto.timingSafeEqual');

    const verify = body.slice(body.indexOf('export function verifySignature'));
    const fnBody = verify.slice(0, verify.indexOf('\n}'));
    assert.match(fnBody, /return\s+timingSafeEqual\(/, 'the verdict must come from timingSafeEqual');

    // The digests are the secret-dependent values. Comparing them with an
    // operator (directly, or via toString()/hex round-trips) short-circuits on
    // the first differing byte and leaks the signature. Length checks are fine —
    // a signature's length is public.
    const digestVars = String.raw`(?:a|b)(?:\.toString\(\)|\.toString\('\w+'\))?`;
    assert.ok(
      !new RegExp(`${digestVars}\\s*[=!]==?\\s*${digestVars}\\b`).test(fnBody),
      'verifySignature compares digests with an equality operator instead of timingSafeEqual',
    );
  });

});
