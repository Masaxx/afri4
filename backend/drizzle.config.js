import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts", // adjust path if needed
  out: "./drizzle",
  dialect: "postgresql",
  driver: "pg",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,  // 🧠 shows detailed logs
  strict: true,   // 🧱 enforces schema consistency
};
