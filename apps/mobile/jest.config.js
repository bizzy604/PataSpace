/**
 * Purpose: Gate-test config for pure mobile logic under src __tests__ dirs.
 * Why important: Lets deterministic rules (capture-location) run in the root
 *   `pnpm test` lane without pulling in native modules or jest-expo.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 *
 * Note: uses testRegex, not testMatch. testMatch is glob-based, and Jest's
 * glob-to-regex normalization treats a literal `\.` in the resolved rootDir
 * as an escape sequence rather than a path separator + dot. Any checkout
 * living under a dot-prefixed directory segment (e.g. this repo's
 * `.claude/worktrees/<name>/` parallel-session worktrees) then silently
 * matches zero test files — `testMatch: 0 matches` with no error. testRegex
 * is a plain regex applied to the resolved absolute path, so it isn't
 * subject to glob escaping and works the same whether or not the checkout
 * path has a dot segment. Found and fixed 2026-07-14 (Clerk-removal Phase 2)
 * when `pnpm --filter @pataspace/mobile test` found "0 matches" for the
 * entire suite inside a worktree.
 */
module.exports = {
  testEnvironment: 'node',
  testRegex: '__tests__[\\\\/].*\\.test\\.ts$',
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          types: ['jest'],
        },
      },
    ],
  },
};
