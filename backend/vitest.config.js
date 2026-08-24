import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    include: ['tests/**/*.test.{js,ts}', 'src/**/*.test.{js,ts}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/config/swagger.js']
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
})
