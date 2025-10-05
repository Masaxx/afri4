import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts", // adjust path if needed
  out: "./drizzle",
  driver: "pg",
  dialect: "postgresql",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
});
