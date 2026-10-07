import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Nest, so load .env ourselves (Node >= 21, no dotenv needed).
try {
  process.loadEnvFile('.env');
} catch {
  // no .env – rely on the real environment (e.g. CI)
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
  strict: true,
  verbose: true,
});
