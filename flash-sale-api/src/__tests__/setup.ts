import 'reflect-metadata';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.NODE_ENV = 'test';

// Global test setup
beforeEach(() => {
  jest.clearAllMocks();
});

// Add a dummy test to prevent "no tests" error
describe('Setup', () => {
    it('should load test environment', () => {
        expect(process.env.NODE_ENV).toBe('test');
    });
});