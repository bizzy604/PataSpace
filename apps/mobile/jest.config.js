/**
 * Purpose: Gate-test config for pure mobile logic under src __tests__ dirs.
 * Why important: Lets deterministic rules (capture-location) run in the root
 *   `pnpm test` lane without pulling in native modules or jest-expo.
 * Used by: `pnpm --filter @pataspace/mobile test`.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
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
