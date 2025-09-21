module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    transform: {
        '^.+\.ts$': 'ts-jest',
    },
    collectCoverageFrom: [
        'src/**/*.{ts,js}',
        '!src/**/*.d.ts',
        '!src/__tests__/**',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    testMatch: [
        '<rootDir>/src/**/__tests__/**/*.{ts,js}',
        '<rootDir>/src/**/*.(test|spec).{ts,js}',
    ],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
};