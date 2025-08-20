import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsNumber,
  IsUUID,
  MaxLength,
  MinLength,
  Min,
  Max,
  ArrayMaxSize,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { SkillCategory } from '../../entities/skill.entity';
import {
  ProficiencyLevel,
  SkillSource,
} from '../../entities/student-skill.entity';

// Skill Management DTOs
export class CreateSkillDto {
  @ApiProperty({
    description: 'Skill name',
    example: 'JavaScript',
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug for the skill',
    example: 'javascript',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiProperty({
    description: 'Skill category',
    enum: SkillCategory,
    example: SkillCategory.PROGRAMMING,
  })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @ApiPropertyOptional({
    description: 'Detailed description of the skill',
    example: 'A high-level programming language for web development',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to skill icon or logo',
    example: 'https://cdn.example.com/icons/javascript.svg',
  })
  @IsOptional()
  @IsUrl()
  icon_url?: string;

  @ApiPropertyOptional({
    description: 'Alternative names for the skill',
    example: ['JS', 'ECMAScript'],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  aliases?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata for the skill',
    example: {
      difficulty_level: 'intermediate',
      learning_resources: [
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      ],
      related_skills: ['TypeScript', 'React'],
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateSkillDto {
  @ApiPropertyOptional({
    description: 'Skill name',
    example: 'JavaScript',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug for the skill',
    example: 'javascript',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({
    description: 'Skill category',
    enum: SkillCategory,
    example: SkillCategory.PROGRAMMING,
  })
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiPropertyOptional({
    description: 'Detailed description of the skill',
    example: 'A high-level programming language for web development',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to skill icon or logo',
    example: 'https://cdn.example.com/icons/javascript.svg',
  })
  @IsOptional()
  @IsUrl()
  icon_url?: string;

  @ApiPropertyOptional({
    description: 'Alternative names for the skill',
    example: ['JS', 'ECMAScript'],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  aliases?: string[];

  @ApiPropertyOptional({
    description: 'Whether the skill is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata for the skill',
    example: {
      difficulty_level: 'intermediate',
      learning_resources: [
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      ],
    },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class SkillSearchDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of skills per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for skill name or aliases',
    example: 'Java',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by skill category',
    enum: SkillCategory,
    example: SkillCategory.PROGRAMMING,
  })
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'category', 'usage_count', 'created_at'],
    example: 'name',
  })
  @IsOptional()
  @IsString()
  sort_by?: 'name' | 'category' | 'usage_count' | 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    example: 'ASC',
  })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC';
}

export class SkillResponseDto {
  @ApiProperty({
    description: 'Skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Skill name',
    example: 'JavaScript',
  })
  name: string;

  @ApiProperty({
    description: 'URL-friendly slug',
    example: 'javascript',
  })
  slug: string;

  @ApiProperty({
    description: 'Skill category',
    enum: SkillCategory,
    example: SkillCategory.PROGRAMMING,
  })
  category: SkillCategory;

  @ApiPropertyOptional({
    description: 'Skill description',
    example: 'A high-level programming language for web development',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'URL to skill icon',
    example: 'https://cdn.example.com/icons/javascript.svg',
  })
  icon_url?: string;

  @ApiProperty({
    description: 'Alternative names for the skill',
    example: ['JS', 'ECMAScript'],
  })
  aliases: string[];

  @ApiProperty({
    description: 'Whether the skill is active',
    example: true,
  })
  is_active: boolean;

  @ApiProperty({
    description: 'Number of times this skill is used',
    example: 156,
  })
  usage_count: number;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: {
      difficulty_level: 'intermediate',
      learning_resources: [
        'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
      ],
    },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  created_at: Date;
}

// Student Skills DTOs
export class CreateStudentSkillDto {
  @ApiProperty({
    description: 'Skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  skill_id: string;

  @ApiProperty({
    description: 'Proficiency level in the skill',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.INTERMEDIATE,
  })
  @IsEnum(ProficiencyLevel)
  proficiency_level: ProficiencyLevel;

  @ApiPropertyOptional({
    description: 'How the skill was acquired or verified',
    enum: SkillSource,
    example: SkillSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(SkillSource)
  source?: SkillSource = SkillSource.MANUAL;

  @ApiPropertyOptional({
    description: 'Years of experience with this skill',
    example: 2,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  years_of_experience?: number;

  @ApiPropertyOptional({
    description: 'Assessment score (0-100)',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  assessment_score?: number;

  @ApiPropertyOptional({
    description: 'Additional notes about the skill',
    example: 'Used in multiple projects including e-commerce platform',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStudentSkillDto {
  @ApiPropertyOptional({
    description: 'Proficiency level in the skill',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.ADVANCED,
  })
  @IsOptional()
  @IsEnum(ProficiencyLevel)
  proficiency_level?: ProficiencyLevel;

  @ApiPropertyOptional({
    description: 'How the skill was acquired or verified',
    enum: SkillSource,
    example: SkillSource.ASSESSMENT,
  })
  @IsOptional()
  @IsEnum(SkillSource)
  source?: SkillSource;

  @ApiPropertyOptional({
    description: 'Years of experience with this skill',
    example: 3,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  years_of_experience?: number;

  @ApiPropertyOptional({
    description: 'Assessment score (0-100)',
    example: 92,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  assessment_score?: number;

  @ApiPropertyOptional({
    description: 'Whether the skill is verified',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes about the skill',
    example: 'Recently certified, used in production applications',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StudentSkillSearchDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of skills per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by skill category',
    enum: SkillCategory,
    example: SkillCategory.PROGRAMMING,
  })
  @IsOptional()
  @IsEnum(SkillCategory)
  category?: SkillCategory;

  @ApiPropertyOptional({
    description: 'Filter by proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.INTERMEDIATE,
  })
  @IsOptional()
  @IsEnum(ProficiencyLevel)
  proficiency_level?: ProficiencyLevel;

  @ApiPropertyOptional({
    description: 'Filter by skill source',
    enum: SkillSource,
    example: SkillSource.MANUAL,
  })
  @IsOptional()
  @IsEnum(SkillSource)
  source?: SkillSource;

  @ApiPropertyOptional({
    description: 'Filter by verified status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  is_verified?: boolean;

  @ApiPropertyOptional({
    description: 'Search term for skill name',
    example: 'React',
  })
  @IsOptional()
  @IsString()
  search?: string;
}

export class StudentSkillResponseDto {
  @ApiProperty({
    description: 'Student skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  user_id: string;

  @ApiProperty({
    description: 'Skill information',
    type: SkillResponseDto,
  })
  skill: SkillResponseDto;

  @ApiProperty({
    description: 'Proficiency level',
    enum: ProficiencyLevel,
    example: ProficiencyLevel.INTERMEDIATE,
  })
  proficiency_level: ProficiencyLevel;

  @ApiProperty({
    description: 'How the skill was acquired',
    enum: SkillSource,
    example: SkillSource.MANUAL,
  })
  source: SkillSource;

  @ApiPropertyOptional({
    description: 'Years of experience',
    example: 2,
  })
  years_of_experience?: number;

  @ApiPropertyOptional({
    description: 'Assessment score',
    example: 85,
  })
  assessment_score?: number;

  @ApiProperty({
    description: 'Whether the skill is verified',
    example: true,
  })
  is_verified: boolean;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Used in multiple projects',
  })
  notes?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  created_at: Date;
}

export class BulkSkillsDto {
  @ApiProperty({
    description: 'Array of skills to add',
    type: [CreateStudentSkillDto],
    example: [
      {
        skill_id: '550e8400-e29b-41d4-a716-446655440000',
        proficiency_level: 'intermediate',
        source: 'manual',
        years_of_experience: 2,
      },
      {
        skill_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        proficiency_level: 'advanced',
        source: 'project',
        years_of_experience: 3,
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStudentSkillDto)
  skills: CreateStudentSkillDto[];
}

export class SkillStatsDto {
  @ApiProperty({
    description: 'Total number of skills in catalog',
    example: 1250,
  })
  total_skills: number;

  @ApiProperty({
    description: 'Number of active skills',
    example: 1180,
  })
  active_skills: number;

  @ApiProperty({
    description: 'Skills by category',
    example: {
      programming: 350,
      framework: 180,
      database: 75,
      cloud: 120,
      tool: 200,
      soft_skill: 145,
      domain: 95,
      other: 85,
    },
  })
  by_category: Record<string, number>;

  @ApiProperty({
    description: 'Most popular skills',
    example: [
      { skill_name: 'JavaScript', usage_count: 1250 },
      { skill_name: 'Python', usage_count: 980 },
      { skill_name: 'React', usage_count: 856 },
    ],
  })
  most_popular: Array<{ skill_name: string; usage_count: number }>;

  @ApiProperty({
    description: 'Recently added skills',
    example: [
      { skill_name: 'GPT-4', created_at: '2024-01-15T10:30:00Z' },
      { skill_name: 'Langchain', created_at: '2024-01-14T08:15:00Z' },
    ],
  })
  recently_added: Array<{ skill_name: string; created_at: Date }>;
}

export class StudentSkillStatsDto {
  @ApiProperty({
    description: 'Total number of skills',
    example: 25,
  })
  total_skills: number;

  @ApiProperty({
    description: 'Verified skills count',
    example: 18,
  })
  verified_skills: number;

  @ApiProperty({
    description: 'Skills by proficiency level',
    example: {
      beginner: 5,
      intermediate: 12,
      advanced: 6,
      expert: 2,
    },
  })
  by_proficiency: Record<string, number>;

  @ApiProperty({
    description: 'Skills by category',
    example: {
      programming: 8,
      framework: 5,
      database: 3,
      cloud: 2,
      tool: 4,
      soft_skill: 3,
    },
  })
  by_category: Record<string, number>;

  @ApiProperty({
    description: 'Skills by source',
    example: {
      manual: 15,
      ai_extract: 3,
      assessment: 4,
      project: 2,
      endorsed: 1,
    },
  })
  by_source: Record<string, number>;

  @ApiProperty({
    description: 'Average years of experience',
    example: 2.3,
  })
  avg_experience_years: number;

  @ApiProperty({
    description: 'Skills with assessment scores',
    example: 12,
  })
  assessed_skills_count: number;

  @ApiProperty({
    description: 'Average assessment score',
    example: 78.5,
  })
  avg_assessment_score: number;
}
