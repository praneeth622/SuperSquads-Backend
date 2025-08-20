import { z } from 'zod';

export const envSchema = z.object({
  // App Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  
  // Database
  DATABASE_URL: z.string().url(),
  
  // Redis
  REDIS_URL: z.string().url(),
  
  // Supabase Auth
  SUPABASE_PROJECT_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string(),
  SUPABASE_JWT_SECRET: z.string(),
  SUPABASE_JWT_AUDIENCE: z.string().default('authenticated'),
  SUPABASE_JWKS_URL: z.string().url(),
  SUPABASE_WEBHOOK_SECRET: z.string(),
  
  // Storage (S3 Compatible)
  STORAGE_PROVIDER: z.enum(['aws', 'r2', 'supabase']).default('aws'),
  STORAGE_BUCKET: z.string(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  
  // Email
  EMAIL_PROVIDER: z.enum(['postmark', 'ses', 'resend']).default('postmark'),
  EMAIL_FROM: z.string().email(),
  EMAIL_API_KEY: z.string().optional(),
  
  // Security
  JWT_SECRET: z.string().min(32),
  RATE_LIMIT_TTL: z.coerce.number().default(60),
  RATE_LIMIT_LIMIT: z.coerce.number().default(100),
  
  // Features
  ENABLE_SWAGGER: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Environment = z.infer<typeof envSchema>;

export const validateEnv = (config: Record<string, unknown>) => {
  try {
    return envSchema.parse(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map(err => err.path.join('.')).join(', ');
      throw new Error(`Environment validation failed. Missing or invalid: ${missingVars}`);
    }
    throw error;
  }
};
