import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const API_ROOT = resolve(__dirname, '..', '..');
const ENV_FILE = join(API_ROOT, '.env');
const TMP_DIR = join(tmpdir(), 'pataspace-prisma-bootstrap');

export type PostgresConnection = {
  username: string;
  password: string;
  database: string;
  host: string;
  port: string;
};

export function loadLocalEnv() {
  if (!existsSync(ENV_FILE)) {
    return;
  }

  const lines = readFileSync(ENV_FILE, 'utf8').split(/\r?\n/u);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();

    if (!key || process.env[key] !== undefined) {
      continue;
    }

    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

export function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for this operation.`);
  }

  return value;
}

export function parsePostgresConnection(urlValue: string): PostgresConnection {
  let parsedUrl: URL;

  try {
    parsedUrl = new URL(urlValue);
  } catch {
    throw new Error(`Invalid PostgreSQL connection string: ${urlValue}`);
  }

  if (!['postgresql:', 'postgres:'].includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported database protocol in connection string: ${parsedUrl.protocol}`);
  }

  const database = parsedUrl.pathname.replace(/^\/+/u, '');

  if (!database) {
    throw new Error('Connection string must include a database name.');
  }

  return {
    username: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database,
    host: parsedUrl.hostname,
    port: parsedUrl.port || '5432',
  };
}

export function toSqlLiteral(value: string) {
  return `'${value.replace(/'/gu, "''")}'`;
}

export function writeTemporarySqlFile(filename: string, contents: string) {
  mkdirSync(TMP_DIR, { recursive: true });

  const filePath = join(TMP_DIR, filename);
  writeFileSync(filePath, contents, 'utf8');

  return filePath;
}

export function removeTemporarySqlFile(filePath: string) {
  if (!existsSync(filePath)) {
    return;
  }

  rmSync(filePath, { force: true });
}

export function runPrismaCommand(args: string[], envOverrides: Record<string, string>) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'pnpm';
  const commandArgs =
    process.platform === 'win32' ? ['/c', 'pnpm', 'exec', 'prisma', ...args] : ['exec', 'prisma', ...args];

  const result = spawnSync(command, commandArgs, {
    cwd: API_ROOT,
    env: {
      ...process.env,
      ...envOverrides,
    },
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Prisma command failed with exit code ${result.status ?? 'unknown'}.`);
  }
}
