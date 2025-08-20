import { z } from 'zod';

// Job creation schema
export const CreateJobSchema = z.object({
  title: z.string().min(3).max(255),
  kind: z.enum(['internship', 'fulltime', 'gig']),
  description: z.string().min(50),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  company_id: z.string().uuid(),

  // Compensation
  min_stipend: z.number().int().positive().optional(),
  max_stipend: z.number().int().positive().optional(),
  min_salary: z.number().int().positive().optional(),
  max_salary: z.number().int().positive().optional(),

  // Location and work mode
  locations: z.array(z.string().min(1)).default([]),
  work_modes: z
    .array(z.enum(['remote', 'hybrid', 'onsite']))
    .default(['remote']),

  // Skills and requirements
  skills: z.array(z.string().min(1)).default([]),
  benefits: z.array(z.string().min(1)).default([]),
  experience_level: z.enum(['entry', 'mid', 'senior', 'expert']).optional(),

  // Duration and deadline
  duration_months: z.number().int().positive().optional(),
  application_deadline: z.string().datetime().optional(),
});

export type CreateJobDto = z.infer<typeof CreateJobSchema>;

// Job update schema
export const UpdateJobSchema = CreateJobSchema.partial().omit({
  company_id: true,
});
export type UpdateJobDto = z.infer<typeof UpdateJobSchema>;

// Job search/filter schema
export const JobSearchSchema = z.object({
  // Search query
  q: z.string().optional(),

  // Filters
  kind: z.enum(['internship', 'fulltime', 'gig']).optional(),
  locations: z.array(z.string()).optional(),
  work_modes: z.array(z.enum(['remote', 'hybrid', 'onsite'])).optional(),
  skills: z.array(z.string()).optional(),
  experience_level: z.enum(['entry', 'mid', 'senior', 'expert']).optional(),

  // Compensation filters
  min_stipend: z.number().int().positive().optional(),
  max_stipend: z.number().int().positive().optional(),
  min_salary: z.number().int().positive().optional(),
  max_salary: z.number().int().positive().optional(),

  // Company filter
  company_id: z.string().uuid().optional(),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),

  // Sorting
  sort_by: z
    .enum(['created_at', 'updated_at', 'title', 'application_count'])
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

export type JobSearchDto = z.infer<typeof JobSearchSchema>;

// Job response schema
export const JobResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  kind: z.enum(['internship', 'fulltime', 'gig']),
  description: z.string(),
  requirements: z.string().nullable(),
  responsibilities: z.string().nullable(),

  // Company info
  company: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      logo_url: z.string().nullable(),
      domain: z.string().nullable(),
    })
    .nullable(),

  // Compensation
  min_stipend: z.number().nullable(),
  max_stipend: z.number().nullable(),
  min_salary: z.number().nullable(),
  max_salary: z.number().nullable(),

  // Details
  locations: z.array(z.string()),
  work_modes: z.array(z.enum(['remote', 'hybrid', 'onsite'])),
  skills: z.array(z.string()),
  benefits: z.array(z.string()),
  experience_level: z.string().nullable(),
  duration_months: z.number().nullable(),

  // Metadata
  application_deadline: z.string().datetime().nullable(),
  application_count: z.number(),
  is_active: z.boolean(),
  is_featured: z.boolean(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type JobResponseDto = z.infer<typeof JobResponseSchema>;

// Job list response
export const JobListResponseSchema = z.object({
  jobs: z.array(JobResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
});

export type JobListResponseDto = z.infer<typeof JobListResponseSchema>;
