import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsArray,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsUrl,
  IsUUID,
  ArrayMaxSize,
  MaxLength,
  MinLength,
} from 'class-validator';

export enum EducationLevel {
  HIGH_SCHOOL = 'high_school',
  ASSOCIATE = 'associate',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  PHD = 'phd',
  BOOTCAMP = 'bootcamp',
  CERTIFICATION = 'certification',
}

export enum ExperienceLevel {
  ENTRY = 'entry',
  JUNIOR = 'junior',
  MID = 'mid',
  SENIOR = 'senior',
  LEAD = 'lead',
  PRINCIPAL = 'principal',
}

export enum AvailabilityStatus {
  AVAILABLE = 'available',
  OPEN_TO_OFFERS = 'open_to_offers',
  NOT_AVAILABLE = 'not_available',
}

export class EducationDto {
  @ApiProperty({
    description: 'Institution name',
    example: 'University of California, Berkeley',
  })
  @IsString()
  @MaxLength(200)
  institution: string;

  @ApiProperty({
    description: 'Degree or certification name',
    example: 'Bachelor of Science in Computer Science',
  })
  @IsString()
  @MaxLength(200)
  degree: string;

  @ApiProperty({
    description: 'Field of study',
    example: 'Computer Science',
  })
  @IsString()
  @MaxLength(100)
  field_of_study: string;

  @ApiProperty({
    description: 'Education level',
    enum: EducationLevel,
    example: EducationLevel.BACHELOR,
  })
  @IsEnum(EducationLevel)
  level: EducationLevel;

  @ApiPropertyOptional({
    description: 'Start date of education',
    example: '2020-09-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of education (null if ongoing)',
    example: '2024-05-15',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'GPA or equivalent score',
    example: 3.8,
    minimum: 0,
    maximum: 4.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(4.0)
  gpa?: number;

  @ApiPropertyOptional({
    description: 'Additional description or achievements',
    example: "Magna Cum Laude, Dean's List 2022-2024",
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class ExperienceDto {
  @ApiProperty({
    description: 'Company name',
    example: 'Google Inc.',
  })
  @IsString()
  @MaxLength(200)
  company: string;

  @ApiProperty({
    description: 'Job title',
    example: 'Software Engineer Intern',
  })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiProperty({
    description: 'Experience level',
    enum: ExperienceLevel,
    example: ExperienceLevel.ENTRY,
  })
  @IsEnum(ExperienceLevel)
  level: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Start date of employment',
    example: '2023-06-01',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'End date of employment (null if current)',
    example: '2023-08-31',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({
    description: 'Job description and achievements',
    example:
      'Developed microservices using Go and Python, improved system performance by 25%',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Technologies and skills used',
    example: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(20)
  technologies?: string[];
}

export class ProjectDto {
  @ApiProperty({
    description: 'Project name',
    example: 'AI-Powered Job Matching Platform',
  })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Project description',
    example:
      'A full-stack web application that uses machine learning to match students with relevant job opportunities',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Technologies used in the project',
    example: ['React', 'Node.js', 'Python', 'TensorFlow', 'PostgreSQL'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(15)
  technologies?: string[];

  @ApiPropertyOptional({
    description: 'Project repository URL',
    example: 'https://github.com/username/ai-job-matching',
  })
  @IsOptional()
  @IsUrl()
  repository_url?: string;

  @ApiPropertyOptional({
    description: 'Live demo URL',
    example: 'https://ai-job-matching.vercel.app',
  })
  @IsOptional()
  @IsUrl()
  demo_url?: string;

  @ApiPropertyOptional({
    description: 'Project start date',
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({
    description: 'Project completion date',
    example: '2024-03-30',
  })
  @IsOptional()
  @IsDateString()
  end_date?: string;
}

export class CreateStudentProfileDto {
  @ApiProperty({
    description: "Student's first name",
    example: 'John',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  first_name: string;

  @ApiProperty({
    description: "Student's last name",
    example: 'Doe',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  last_name: string;

  @ApiProperty({
    description: "Student's email address",
    example: 'john.doe@university.edu',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: "Student's phone number",
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: "Student's location (city, state/country)",
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Professional headline or title',
    example: 'Computer Science Student | Full-Stack Developer | AI Enthusiast',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({
    description: 'Professional summary or bio',
    example:
      'Passionate computer science student with 2+ years of experience in full-stack development. Specialized in React, Node.js, and machine learning applications.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({
    description: 'Portfolio website URL',
    example: 'https://johndoe.dev',
  })
  @IsOptional()
  @IsUrl()
  portfolio_url?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsOptional()
  @IsUrl()
  linkedin_url?: string;

  @ApiPropertyOptional({
    description: 'GitHub profile URL',
    example: 'https://github.com/johndoe',
  })
  @IsOptional()
  @IsUrl()
  github_url?: string;

  @ApiPropertyOptional({
    description: 'Resume file URL or path',
    example: 'https://storage.example.com/resumes/john-doe-resume.pdf',
  })
  @IsOptional()
  @IsUrl()
  resume_url?: string;

  @ApiPropertyOptional({
    description: 'Current availability status',
    enum: AvailabilityStatus,
    example: AvailabilityStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability_status?: AvailabilityStatus;

  @ApiPropertyOptional({
    description: 'Desired job types',
    example: ['full-time', 'internship', 'part-time'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  desired_job_types?: string[];

  @ApiPropertyOptional({
    description: 'Technical skills and competencies',
    example: [
      'JavaScript',
      'Python',
      'React',
      'Node.js',
      'PostgreSQL',
      'Docker',
      'AWS',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Languages spoken',
    example: ['English (Native)', 'Spanish (Conversational)', 'French (Basic)'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Education history',
    type: [EducationDto],
    example: [
      {
        institution: 'University of California, Berkeley',
        degree: 'Bachelor of Science in Computer Science',
        field_of_study: 'Computer Science',
        level: 'bachelor',
        start_date: '2020-09-01',
        end_date: '2024-05-15',
        gpa: 3.8,
      },
    ],
  })
  @IsOptional()
  @IsArray()
  education?: EducationDto[];

  @ApiPropertyOptional({
    description: 'Work experience history',
    type: [ExperienceDto],
    example: [
      {
        company: 'Google Inc.',
        title: 'Software Engineer Intern',
        level: 'entry',
        start_date: '2023-06-01',
        end_date: '2023-08-31',
        description: 'Developed microservices using Go and Python',
        technologies: ['Go', 'Python', 'Kubernetes'],
      },
    ],
  })
  @IsOptional()
  @IsArray()
  experience?: ExperienceDto[];

  @ApiPropertyOptional({
    description: 'Personal projects',
    type: [ProjectDto],
    example: [
      {
        name: 'AI-Powered Job Matching Platform',
        description:
          'A full-stack web application that uses machine learning to match students with relevant job opportunities',
        technologies: ['React', 'Node.js', 'Python', 'TensorFlow'],
        repository_url: 'https://github.com/username/ai-job-matching',
        demo_url: 'https://ai-job-matching.vercel.app',
      },
    ],
  })
  @IsOptional()
  @IsArray()
  projects?: ProjectDto[];
}

export class UpdateStudentProfileDto {
  @ApiPropertyOptional({
    description: "Student's first name",
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  first_name?: string;

  @ApiPropertyOptional({
    description: "Student's last name",
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  last_name?: string;

  @ApiPropertyOptional({
    description: "Student's phone number",
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: "Student's location",
    example: 'San Francisco, CA',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Professional headline',
    example: 'Senior Computer Science Student | Full-Stack Developer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  headline?: string;

  @ApiPropertyOptional({
    description: 'Professional summary',
    example:
      'Experienced computer science student with 3+ years in full-stack development',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  summary?: string;

  @ApiPropertyOptional({
    description: 'Portfolio website URL',
    example: 'https://johndoe.dev',
  })
  @IsOptional()
  @IsUrl()
  portfolio_url?: string;

  @ApiPropertyOptional({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsOptional()
  @IsUrl()
  linkedin_url?: string;

  @ApiPropertyOptional({
    description: 'GitHub profile URL',
    example: 'https://github.com/johndoe',
  })
  @IsOptional()
  @IsUrl()
  github_url?: string;

  @ApiPropertyOptional({
    description: 'Resume file URL',
    example: 'https://storage.example.com/resumes/john-doe-resume-v2.pdf',
  })
  @IsOptional()
  @IsUrl()
  resume_url?: string;

  @ApiPropertyOptional({
    description: 'Availability status',
    enum: AvailabilityStatus,
    example: AvailabilityStatus.OPEN_TO_OFFERS,
  })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability_status?: AvailabilityStatus;

  @ApiPropertyOptional({
    description: 'Desired job types',
    example: ['full-time', 'remote'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  desired_job_types?: string[];

  @ApiPropertyOptional({
    description: 'Technical skills',
    example: ['JavaScript', 'Python', 'React', 'AWS'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(30)
  skills?: string[];

  @ApiPropertyOptional({
    description: 'Languages spoken',
    example: ['English (Native)', 'Spanish (Fluent)'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Education history',
    type: [EducationDto],
  })
  @IsOptional()
  @IsArray()
  education?: EducationDto[];

  @ApiPropertyOptional({
    description: 'Work experience history',
    type: [ExperienceDto],
  })
  @IsOptional()
  @IsArray()
  experience?: ExperienceDto[];

  @ApiPropertyOptional({
    description: 'Personal projects',
    type: [ProjectDto],
  })
  @IsOptional()
  @IsArray()
  projects?: ProjectDto[];
}

export class StudentProfileSearchDto {
  @ApiPropertyOptional({
    description: 'Search by name (first or last)',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Filter by skills (comma-separated)',
    example: 'JavaScript,React,Node.js',
  })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({
    description: 'Filter by location',
    example: 'San Francisco',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiPropertyOptional({
    description: 'Filter by availability status',
    enum: AvailabilityStatus,
    example: AvailabilityStatus.AVAILABLE,
  })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability_status?: AvailabilityStatus;

  @ApiPropertyOptional({
    description: 'Filter by education level',
    enum: EducationLevel,
    example: EducationLevel.BACHELOR,
  })
  @IsOptional()
  @IsEnum(EducationLevel)
  education_level?: EducationLevel;

  @ApiPropertyOptional({
    description: 'Filter by experience level',
    enum: ExperienceLevel,
    example: ExperienceLevel.JUNIOR,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experience_level?: ExperienceLevel;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'created_at',
    enum: ['created_at', 'updated_at', 'first_name', 'last_name'],
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class StudentProfileResponseDto {
  @ApiProperty({
    description: 'Unique profile identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: "Student's first name",
    example: 'John',
  })
  first_name: string;

  @ApiProperty({
    description: "Student's last name",
    example: 'Doe',
  })
  last_name: string;

  @ApiProperty({
    description: "Student's email address",
    example: 'john.doe@university.edu',
  })
  email: string;

  @ApiProperty({
    description: "Student's phone number",
    example: '+1-555-123-4567',
    nullable: true,
  })
  phone: string | null;

  @ApiProperty({
    description: "Student's location",
    example: 'San Francisco, CA',
    nullable: true,
  })
  location: string | null;

  @ApiProperty({
    description: 'Professional headline',
    example: 'Computer Science Student | Full-Stack Developer',
    nullable: true,
  })
  headline: string | null;

  @ApiProperty({
    description: 'Professional summary',
    example:
      'Passionate computer science student with experience in full-stack development',
    nullable: true,
  })
  summary: string | null;

  @ApiProperty({
    description: 'Portfolio website URL',
    example: 'https://johndoe.dev',
    nullable: true,
  })
  portfolio_url: string | null;

  @ApiProperty({
    description: 'LinkedIn profile URL',
    example: 'https://linkedin.com/in/johndoe',
    nullable: true,
  })
  linkedin_url: string | null;

  @ApiProperty({
    description: 'GitHub profile URL',
    example: 'https://github.com/johndoe',
    nullable: true,
  })
  github_url: string | null;

  @ApiProperty({
    description: 'Resume file URL',
    example: 'https://storage.example.com/resumes/john-doe-resume.pdf',
    nullable: true,
  })
  resume_url: string | null;

  @ApiProperty({
    description: 'Current availability status',
    enum: AvailabilityStatus,
    example: AvailabilityStatus.AVAILABLE,
  })
  availability_status: AvailabilityStatus;

  @ApiProperty({
    description: 'Desired job types',
    example: ['full-time', 'internship'],
    type: [String],
  })
  desired_job_types: string[];

  @ApiProperty({
    description: 'Technical skills',
    example: ['JavaScript', 'Python', 'React', 'Node.js'],
    type: [String],
  })
  skills: string[];

  @ApiProperty({
    description: 'Languages spoken',
    example: ['English (Native)', 'Spanish (Conversational)'],
    type: [String],
  })
  languages: string[];

  @ApiProperty({
    description: 'Education history',
    type: [EducationDto],
  })
  education: EducationDto[];

  @ApiProperty({
    description: 'Work experience history',
    type: [ExperienceDto],
  })
  experience: ExperienceDto[];

  @ApiProperty({
    description: 'Personal projects',
    type: [ProjectDto],
  })
  projects: ProjectDto[];

  @ApiProperty({
    description: 'Profile creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  created_at: Date;

  @ApiProperty({
    description: 'Profile last update timestamp',
    example: '2024-03-20T14:45:00Z',
  })
  updated_at: Date;
}
