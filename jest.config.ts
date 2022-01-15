import { defaults } from 'jest-config';

export default {
  moduleFileExtensions: [...defaults.moduleFileExtensions, "ts", "tsx"],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  testMatch: [
    "**/tests/**/*.spec.ts",
    "**/tests/**/*.test.ts",
  ],
  testEnvironment: "node",
};