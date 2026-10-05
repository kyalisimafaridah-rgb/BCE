import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  // Public by design (it is what browsers use to log in). Never put the service-role key here.
  SUPABASE_ANON_KEY: z.string().min(20),
  // Comma-separated exact origins. Empty = same-origin only (the UI is served by this app).
  CORS_ORIGIN: z.string().default("")
}).refine(e => !e.CORS_ORIGIN.includes("*"), { message: "CORS_ORIGIN must be an explicit origin list, never '*'" });

export const env = envSchema.parse(process.env);