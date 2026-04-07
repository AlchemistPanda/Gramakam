import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { moduleResolution: 'node' } }],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
  clearMocks: true,
};

export default createJestConfig(config);
