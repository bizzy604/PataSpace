/**
 * Purpose: Gate-test config for contract schemas under src __tests__ dirs.
 * Why important: Schema changes are the cross-service contract; these tests
 *   are the only automated check that a bump doesn't silently change what
 *   both sides accept.
 * Used by: `pnpm --filter @pataspace/contracts test`.
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
