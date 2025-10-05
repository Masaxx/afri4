// File: backend/drizzle.config.js

// NOTE: We remove the 'import { defineConfig } from "drizzle-kit"'
// and the 'defineConfig()' wrapper to prevent the "Cannot find module 'drizzle-kit'" error
// that occurs during npx execution in the Render environment.

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Export the configuration object directly using CommonJS for maximum compatibility.
module.exports = {
  dialect: 'postgresql',
  schema: '../shared/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
};
