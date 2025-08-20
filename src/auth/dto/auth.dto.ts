import { z } from 'zod';

// Supabase webhook payload schema
export const SupabaseWebhookSchema = z.object({
  type: z.enum(['user.created', 'user.updated', 'user.deleted']),
  table: z.literal('auth.users'),
  record: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    email_confirmed_at: z.string().datetime().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
    user_metadata: z.record(z.string(), z.any()).optional(),
    app_metadata: z.record(z.string(), z.any()).optional(),
  }),
  old_record: z.object({}).optional(),
});

export type SupabaseWebhookDto = z.infer<typeof SupabaseWebhookSchema>;

// College email verification
export const VerifyCollegeEmailSchema = z.object({
  college_email: z.string().email(),
});

export type VerifyCollegeEmailDto = z.infer<typeof VerifyCollegeEmailSchema>;

// College email callback
export const VerifyCollegeCallbackSchema = z.object({
  token: z.string().min(1),
});

export type VerifyCollegeCallbackDto = z.infer<
  typeof VerifyCollegeCallbackSchema
>;

// User response DTO
export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['student', 'recruiter', 'admin']),
  status: z.enum([
    'pending_verification',
    'active',
    'suspended',
    'deactivated',
  ]),
  verification_status: z.enum(['none', 'pending', 'verified', 'rejected']),
  verified_college_affiliation: z.boolean(),
  college_email: z.string().email().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type UserResponseDto = z.infer<typeof UserResponseSchema>;
