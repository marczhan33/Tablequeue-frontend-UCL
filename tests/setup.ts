import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.SESSION_SECRET = 'test-secret-key-for-sessions';
});

afterAll(() => {
  // Cleanup after all tests
});