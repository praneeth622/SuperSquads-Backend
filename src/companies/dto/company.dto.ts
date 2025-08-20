import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Company status enum
const CompanyStatusEnum = z.enum(['pending', 'verified', 'rejected']);

// Create Company Schema
const CreateCompanySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name too long'),
  website: z
    .string()
    .url('Invalid website URL')
    .max(500, 'Website URL too long')
    .optional(),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .max(255, 'Domain too long')
    .optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  logo_url: z
    .string()
    .url('Invalid logo URL')
    .max(255, 'Logo URL too long')
    .optional(),
  industry: z.string().max(100, 'Industry name too long').optional(),
  company_size: z
    .enum([
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ])
    .optional(),
  headquarters: z
    .string()
    .max(255, 'Headquarters location too long')
    .optional(),
});

// Update Company Schema
const UpdateCompanySchema = z.object({
  name: z
    .string()
    .min(1, 'Company name is required')
    .max(255, 'Company name too long')
    .optional(),
  website: z
    .string()
    .url('Invalid website URL')
    .max(500, 'Website URL too long')
    .optional(),
  domain: z
    .string()
    .regex(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Invalid domain format')
    .max(255, 'Domain too long')
    .optional(),
  description: z.string().max(2000, 'Description too long').optional(),
  logo_url: z
    .string()
    .url('Invalid logo URL')
    .max(255, 'Logo URL too long')
    .optional(),
  industry: z.string().max(100, 'Industry name too long').optional(),
  company_size: z
    .enum([
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ])
    .optional(),
  headquarters: z
    .string()
    .max(255, 'Headquarters location too long')
    .optional(),
  is_verified: z.boolean().optional(),
});

// Company search/filter schema
const CompanySearchSchema = z.object({
  // Search
  search: z.string().max(255, 'Search query too long').optional(),

  // Filters
  industry: z.string().max(100, 'Industry filter too long').optional(),
  company_size: z
    .enum([
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ])
    .optional(),
  is_verified: z.boolean().optional(),

  // Pagination
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),

  // Sorting
  sort_by: z.enum(['name', 'created_at', 'updated_at']).default('name'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Company response schema
const CompanyResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  website: z.string().nullable(),
  domain: z.string().nullable(),
  description: z.string().nullable(),
  logo_url: z.string().nullable(),
  industry: z.string().nullable(),
  company_size: z.string().nullable(),
  headquarters: z.string().nullable(),
  is_verified: z.boolean(),

  // Aggregated data
  total_jobs: z.number().optional(),
  active_jobs: z.number().optional(),
  total_applications: z.number().optional(),

  // Timestamps
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Company list response
const CompanyListResponseSchema = z.object({
  companies: z.array(CompanyResponseSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  total_pages: z.number(),
});

// Company stats schema
const CompanyStatsSchema = z.object({
  total_companies: z.number(),
  verified_companies: z.number(),
  pending_verification: z.number(),
  top_industries: z.array(
    z.object({
      industry: z.string(),
      count: z.number(),
    }),
  ),
  by_company_size: z.record(z.string(), z.number()),
});

// DTO Classes with Swagger Documentation
export class CreateCompanyDto extends createZodDto(CreateCompanySchema) {
  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Solutions',
    maxLength: 255,
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techcorp.com',
    maxLength: 500,
    format: 'url',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Company email domain (for recruiter verification)',
    example: 'techcorp.com',
    maxLength: 255,
  })
  domain?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example:
      'We are a leading technology company focused on innovative software solutions for enterprises.',
    maxLength: 2000,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://techcorp.com/logo.png',
    maxLength: 255,
    format: 'url',
  })
  logo_url?: string;

  @ApiPropertyOptional({
    description: 'Industry sector',
    example: 'Technology',
    maxLength: 100,
  })
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company size range',
    enum: [
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ],
    example: '51-200',
  })
  company_size?:
    | '1-10'
    | '11-50'
    | '51-200'
    | '201-500'
    | '501-1000'
    | '1001-5000'
    | '5000+';

  @ApiPropertyOptional({
    description: 'Company headquarters location',
    example: 'San Francisco, CA, USA',
    maxLength: 255,
  })
  headquarters?: string;
}

export class UpdateCompanyDto extends createZodDto(UpdateCompanySchema) {
  @ApiPropertyOptional({
    description: 'Company name',
    example: 'TechCorp Solutions Inc',
    maxLength: 255,
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techcorp.com',
    maxLength: 500,
    format: 'url',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Company email domain',
    example: 'techcorp.com',
    maxLength: 255,
  })
  domain?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example:
      'We are a leading technology company focused on innovative software solutions.',
    maxLength: 2000,
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://techcorp.com/logo.png',
    maxLength: 255,
    format: 'url',
  })
  logo_url?: string;

  @ApiPropertyOptional({
    description: 'Industry sector',
    example: 'Technology',
    maxLength: 100,
  })
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company size range',
    enum: [
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ],
    example: '201-500',
  })
  company_size?:
    | '1-10'
    | '11-50'
    | '51-200'
    | '201-500'
    | '501-1000'
    | '1001-5000'
    | '5000+';

  @ApiPropertyOptional({
    description: 'Company headquarters location',
    example: 'New York, NY, USA',
    maxLength: 255,
  })
  headquarters?: string;

  @ApiPropertyOptional({
    description: 'Company verification status (admin only)',
    example: true,
  })
  is_verified?: boolean;
}

export class CompanySearchDto extends createZodDto(CompanySearchSchema) {
  @ApiPropertyOptional({
    description: 'Search query for company name or description',
    example: 'technology software',
    maxLength: 255,
  })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by industry',
    example: 'Technology',
    maxLength: 100,
  })
  industry?: string;

  @ApiPropertyOptional({
    description: 'Filter by company size',
    enum: [
      '1-10',
      '11-50',
      '51-200',
      '201-500',
      '501-1000',
      '1001-5000',
      '5000+',
    ],
    example: '51-200',
  })
  company_size?:
    | '1-10'
    | '11-50'
    | '51-200'
    | '201-500'
    | '501-1000'
    | '1001-5000'
    | '5000+';

  @ApiPropertyOptional({
    description: 'Filter by verification status',
    example: true,
  })
  is_verified?: boolean;

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
    enum: ['name', 'created_at', 'updated_at'],
    example: 'name',
    default: 'name',
  })
  sort_by: 'name' | 'created_at' | 'updated_at';

  @ApiProperty({
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'asc',
    default: 'asc',
  })
  sort_order: 'asc' | 'desc';
}

export class CompanyResponseDto {
  @ApiProperty({
    description: 'Unique identifier of the company',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Company name',
    example: 'TechCorp Solutions',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://techcorp.com',
  })
  website?: string;

  @ApiPropertyOptional({
    description: 'Company email domain',
    example: 'techcorp.com',
  })
  domain?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Leading technology company focused on innovative solutions',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Company logo URL',
    example: 'https://techcorp.com/logo.png',
  })
  logo_url?: string;

  @ApiPropertyOptional({
    description: 'Industry sector',
    example: 'Technology',
  })
  industry?: string;

  @ApiPropertyOptional({
    description: 'Company size range',
    example: '51-200',
  })
  company_size?: string;

  @ApiPropertyOptional({
    description: 'Company headquarters location',
    example: 'San Francisco, CA, USA',
  })
  headquarters?: string;

  @ApiProperty({
    description: 'Company verification status',
    example: true,
  })
  is_verified: boolean;

  @ApiPropertyOptional({
    description: 'Total number of jobs posted',
    example: 25,
  })
  total_jobs?: number;

  @ApiPropertyOptional({
    description: 'Number of active job postings',
    example: 8,
  })
  active_jobs?: number;

  @ApiPropertyOptional({
    description: 'Total applications received',
    example: 150,
  })
  total_applications?: number;

  @ApiProperty({
    description: 'Company creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  created_at: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-03-16T14:45:00.000Z',
    format: 'date-time',
  })
  updated_at: string;
}

export class CompanyListResponseDto {
  @ApiProperty({
    description: 'Array of companies',
    type: [CompanyResponseDto],
  })
  companies: CompanyResponseDto[];

  @ApiProperty({
    description: 'Total number of companies matching the query',
    example: 75,
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
    example: 4,
  })
  total_pages: number;
}

export class CompanyStatsDto {
  @ApiProperty({
    description: 'Total number of companies',
    example: 150,
  })
  total_companies: number;

  @ApiProperty({
    description: 'Number of verified companies',
    example: 120,
  })
  verified_companies: number;

  @ApiProperty({
    description: 'Number of companies pending verification',
    example: 25,
  })
  pending_verification: number;

  @ApiProperty({
    description: 'Top industries by company count',
    example: [
      { industry: 'Technology', count: 45 },
      { industry: 'Finance', count: 30 },
      { industry: 'Healthcare', count: 20 },
    ],
  })
  top_industries: Array<{ industry: string; count: number }>;

  @ApiProperty({
    description: 'Companies grouped by size',
    example: {
      '1-10': 20,
      '11-50': 35,
      '51-200': 40,
      '201-500': 25,
      '501-1000': 15,
      '1001-5000': 10,
      '5000+': 5,
    },
  })
  by_company_size: Record<string, number>;
}

// Type exports
export type CreateCompanyDtoType = z.infer<typeof CreateCompanySchema>;
export type UpdateCompanyDtoType = z.infer<typeof UpdateCompanySchema>;
export type CompanySearchDtoType = z.infer<typeof CompanySearchSchema>;
export type CompanyResponseDtoType = z.infer<typeof CompanyResponseSchema>;
export type CompanyListResponseDtoType = z.infer<
  typeof CompanyListResponseSchema
>;
export type CompanyStatsDtoType = z.infer<typeof CompanyStatsSchema>;
