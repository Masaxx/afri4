const { defineConfig } = require('drizzle-kit');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

module.exports = defineConfig({
  dialect: 'postgresql',
  schema: '../shared/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});
