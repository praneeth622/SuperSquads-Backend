import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Application Status enum for validation
const ApplicationStatusEnum = z.enum([
  'applied',
  'shortlisted',
  'interviewed',
  'hired',
  'rejected',
  'withdrawn',
]);

// Create Application Schema
const CreateApplicationSchema = z.object({
  job_id: z.string().uuid('Invalid job ID format'),
  cover_letter: z
    .string()
    .max(2000, 'Cover letter must not exceed 2000 characters')
    .optional(),
  resume_file_id: z.string().uuid('Invalid resume file ID format').optional(),
  answers: z
    .record(z.string(), z.any())
    .optional()
    .describe('Answers to job-specific questions'),
});

// Update Application Schema (for recruiters)
const UpdateApplicationSchema = z.object({
  status: ApplicationStatusEnum,
  recruiter_notes: z
    .string()
    .max(1000, 'Recruiter notes must not exceed 1000 characters')
    .optional(),
  score: z
    .number()
    .min(0)
    .max(100)
    .optional()
    .describe('Application score (0-100)'),
});

// Application search/filter schema
const ApplicationSearchSchema = z.object({
  // Filters
  status: z
    .enum([
      'applied',
      'shortlisted',
      'interviewed',
      'rejected',
      'hired',
      'withdrawn',
    ])
    .optional(),
  job_id: z.string().uuid().optional(),
  student_id: z.string().uuid().optional(),

  // Date filters
  submitted_after: z.string().datetime().optional(),
  submitted_before: z.string().datetime().optional(),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),

  // Sorting
  sort_by: z
    .enum(['submitted_at', 'updated_at', 'score'])
    .default('submitted_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Application response schema
const ApplicationResponseSchema = z.object({
  id: z.string().uuid(),
  status: ApplicationStatusEnum,
  cover_letter: z.string().nullable(),
  answers: z.record(z.string(), z.any()).nullable(),
  recruiter_notes: z.string().nullable(),
  score: z.number().nullable(),

  // Job info
  job: z
    .object({
      id: z.string().uuid(),
      title: z.string(),
      kind: z.enum(['internship', 'full_time', 'part_time']),
      company: z
        .object({
          id: z.string().uuid(),
          name: z.string(),
          logo_url: z.string().nullable(),
        })
        .nullable(),
    })
    .nullable(),

  // Student info (for recruiters)
  student: z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      profile: z.object({
        full_name: z.string(),
        college: z
          .object({
            name: z.string(),
            tier: z.number(),
          })
          .nullable(),
        degree: z.string(),
        major: z.string(),
        graduation_year: z.number(),
        cgpa: z.number().nullable(),
      }),
    })
    .optional(),

  // Resume file
  resume_file: z
    .object({
      id: z.string().uuid(),
      original_name: z.string(),
      public_url: z.string(),
    })
    .nullable(),

  // Timestamps
  submitted_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  reviewed_at: z.string().datetime().nullable(),
});

// Application list response
const ApplicationListResponseSchema = z.object({
  applications: z.array(ApplicationResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
});

// Application stats schema (for recruiters)
const ApplicationStatsSchema = z.object({
  total: z.number(),
  by_status: z.record(z.string(), z.number()),
  recent_count: z.number(), // Applications in last 7 days
});

// DTO Classes with Swagger Documentation
export class CreateApplicationDto extends createZodDto(
  CreateApplicationSchema,
) {
  @ApiProperty({
    description: 'Unique identifier of the job to apply for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  job_id: string;

  @ApiPropertyOptional({
    description: 'Cover letter for the job application',
    example:
      'I am very interested in this position because of my strong background in software development and passion for creating innovative solutions. My experience with React, Node.js, and TypeScript aligns perfectly with your requirements.',
    maxLength: 2000,
  })
  cover_letter?: string;

  @ApiPropertyOptional({
    description: 'UUID of the uploaded resume file',
    example: '987fcdeb-51a2-43d1-b456-426614174111',
    format: 'uuid',
  })
  resume_file_id?: string;

  @ApiPropertyOptional({
    description: 'Answers to job-specific questions as key-value pairs',
    example: {
      years_of_experience: '2-3 years',
      preferred_location: 'Remote/Hybrid',
      availability: 'Can start immediately',
      salary_expectation: '12-15 LPA',
      why_interested: 'I am passionate about fintech and your company mission',
    },
    type: 'object',
    additionalProperties: true,
  })
  answers?: Record<string, any>;
}

export class UpdateApplicationDto extends createZodDto(
  UpdateApplicationSchema,
) {
  @ApiProperty({
    description: 'Updated status of the application',
    enum: [
      'applied',
      'shortlisted',
      'interviewed',
      'hired',
      'rejected',
      'withdrawn',
    ],
    example: 'shortlisted',
  })
  status:
    | 'applied'
    | 'shortlisted'
    | 'interviewed'
    | 'hired'
    | 'rejected'
    | 'withdrawn';

  @ApiPropertyOptional({
    description: 'Private notes from the recruiter about the application',
    example:
      'Strong technical background, good cultural fit. Proceed to technical interview.',
    maxLength: 1000,
  })
  recruiter_notes?: string;

  @ApiPropertyOptional({
    description: 'Application score assigned by recruiter (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  score?: number;
}

export class ApplicationSearchDto extends createZodDto(
  ApplicationSearchSchema,
) {
  @ApiPropertyOptional({
    description: 'Filter by application status',
    enum: [
      'applied',
      'shortlisted',
      'interviewed',
      'rejected',
      'hired',
      'withdrawn',
    ],
    example: 'applied',
  })
  status?:
    | 'applied'
    | 'shortlisted'
    | 'interviewed'
    | 'rejected'
    | 'hired'
    | 'withdrawn';

  @ApiPropertyOptional({
    description: 'Filter by specific job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  job_id?: string;

  @ApiPropertyOptional({
    description: 'Filter by specific student ID (recruiter/admin only)',
    example: '456e7890-e89b-12d3-a456-426614174001',
    format: 'uuid',
  })
  student_id?: string;

  @ApiPropertyOptional({
    description: 'Filter applications submitted after this date',
    example: '2024-01-01T00:00:00.000Z',
    format: 'date-time',
  })
  submitted_after?: string;

  @ApiPropertyOptional({
    description: 'Filter applications submitted before this date',
    example: '2024-12-31T23:59:59.999Z',
    format: 'date-time',
  })
  submitted_before?: string;

  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
    default: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Field to sort by',
    enum: ['submitted_at', 'updated_at', 'score'],
    example: 'submitted_at',
    default: 'submitted_at',
  })
  sort_by: 'submitted_at' | 'updated_at' | 'score';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc',
    default: 'desc',
  })
  sort_order: 'asc' | 'desc';
}

export class ApplicationResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the application',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Current status of the application',
    enum: [
      'applied',
      'shortlisted',
      'interviewed',
      'hired',
      'rejected',
      'withdrawn',
    ],
    example: 'shortlisted',
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Cover letter submitted by the student',
    example: 'I am very interested in this position...',
  })
  cover_letter?: string;

  @ApiPropertyOptional({
    description: 'Answers to job-specific questions',
    example: {
      years_of_experience: '2-3 years',
      preferred_location: 'Remote',
    },
  })
  answers?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Private notes from the recruiter',
    example: 'Strong candidate, proceed to next round',
  })
  recruiter_notes?: string;

  @ApiPropertyOptional({
    description: 'Application score (0-100)',
    example: 85,
  })
  score?: number;

  @ApiPropertyOptional({
    description: 'Job information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Software Engineer Intern',
      kind: 'internship',
      company: {
        id: '456e7890-e89b-12d3-a456-426614174001',
        name: 'Tech Solutions Inc',
        logo_url: 'https://example.com/logo.png',
      },
    },
  })
  job?: {
    id: string;
    title: string;
    kind: string;
    company?: {
      id: string;
      name: string;
      logo_url?: string;
    };
  };

  @ApiPropertyOptional({
    description: 'Student information (visible to recruiters only)',
    example: {
      id: '789e0123-e89b-12d3-a456-426614174002',
      email: 'student@iitd.ac.in',
      profile: {
        full_name: 'John Doe',
        college: {
          name: 'Indian Institute of Technology Delhi',
          tier: 1,
        },
        degree: 'B.Tech',
        major: 'Computer Science',
        graduation_year: 2024,
        cgpa: 8.5,
      },
    },
  })
  student?: {
    id: string;
    email: string;
    profile: {
      full_name: string;
      college?: {
        name: string;
        tier: number;
      };
      degree: string;
      major: string;
      graduation_year: number;
      cgpa?: number;
    };
  };

  @ApiPropertyOptional({
    description: 'Resume file information',
    example: {
      id: '987fcdeb-51a2-43d1-b456-426614174111',
      original_name: 'John_Doe_Resume.pdf',
      public_url: 'https://storage.example.com/resumes/john-doe-resume.pdf',
    },
  })
  resume_file?: {
    id: string;
    original_name: string;
    public_url: string;
  };

  @ApiProperty({
    description: 'Application submission timestamp',
    example: '2024-03-15T10:30:00.000Z',
    format: 'date-time',
  })
  submitted_at: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-03-16T14:45:00.000Z',
    format: 'date-time',
  })
  updated_at: string;

  @ApiPropertyOptional({
    description: 'Timestamp when application was reviewed by recruiter',
    example: '2024-03-16T14:45:00.000Z',
    format: 'date-time',
  })
  reviewed_at?: string;
}

export class ApplicationListResponseDto {
  @ApiProperty({
    description: 'Array of applications',
    type: [ApplicationResponseDto],
  })
  applications: ApplicationResponseDto[];

  @ApiProperty({
    description: 'Total number of applications matching the query',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  total_pages: number;
}

export class ApplicationStatsDto {
  @ApiProperty({
    description: 'Total number of applications',
    example: 245,
  })
  total: number;

  @ApiProperty({
    description: 'Applications count by status',
    example: {
      applied: 120,
      shortlisted: 45,
      interviewed: 25,
      hired: 15,
      rejected: 35,
      withdrawn: 5,
    },
  })
  by_status: Record<string, number>;

  @ApiProperty({
    description: 'Number of applications received in the last 7 days',
    example: 23,
  })
  recent_count: number;
}

// Type exports
export type CreateApplicationDtoType = z.infer<typeof CreateApplicationSchema>;
export type UpdateApplicationDtoType = z.infer<typeof UpdateApplicationSchema>;
export type ApplicationSearchDtoType = z.infer<typeof ApplicationSearchSchema>;
export type ApplicationResponseDtoType = z.infer<
  typeof ApplicationResponseSchema
>;
export type ApplicationListResponseDtoType = z.infer<
  typeof ApplicationListResponseSchema
>;
export type ApplicationStatsDtoType = z.infer<typeof ApplicationStatsSchema>;
