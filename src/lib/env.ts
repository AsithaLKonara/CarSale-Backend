import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Dynamically load .env.test if running under testing modes
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.join(__dirname, '../../', envFile) });

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is a required environment variable'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required to sign tokens'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required to sign refresh tokens'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  
  // Optional Cloud/SaaS Services keys
  CLOUDINARY_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ CRITICAL ENVIRONMENT VALIDATION ERROR:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type EnvType = z.infer<typeof envSchema>;
