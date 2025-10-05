import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",   // your schema file
  out: "./drizzle",               // output folder for migrations
  dialect: "postgresql", 
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
  verbose: true,  // show detailed logs during push
  strict: true    // enforce schema consistency
});
