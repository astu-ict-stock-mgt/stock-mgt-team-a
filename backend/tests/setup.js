/**
 * Test Setup
 *
 * Runs before all tests. Sets up the test environment.
 */

// Set test environment
process.env.NODE_ENV = 'test'
process.env.PORT = '0' // random port
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://stockuser:stockpass@localhost:5432/stock_management_test'

console.log('🧪 Test environment initialized')
