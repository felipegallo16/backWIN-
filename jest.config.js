module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**/*.ts'
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  setupFiles: ['<rootDir>/src/tests/env-setup.js']
}; 