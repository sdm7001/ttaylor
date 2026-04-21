module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleNameMapper: {
    '^@ttaylor/(.*)$': '<rootDir>/packages/$1/src',
  },
  testPathPattern: undefined,
};
