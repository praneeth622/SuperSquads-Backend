# Jobs Module

## Overview
The Jobs module provides comprehensive job posting and management functionality for recruiters and job discovery features for students. It handles job creation, updates, search, and application management with advanced filtering and caching capabilities.

## Features Implemented

### 1. Jobs DTOs (`/src/jobs/dto/job.dto.ts`)
- **CreateJobDto**: Complete job creation with company association, compensation validation, skills, locations, work modes
- **UpdateJobDto**: Partial updates with same validation as creation
- **JobSearchDto**: Advanced search with filters for location, skills, experience level, compensation, work modes
- **JobResponseDto**: Comprehensive job response with company details, compensation, requirements
- **JobListResponseDto**: Paginated job listings with metadata

### 2. Jobs Service (`/src/jobs/jobs.service.ts`)
- **Job Management**:
  - `createJob()`: Create job with company validation and compensation rules
  - `updateJob()`: Update job with ownership verification
  - `findJobById()`: Get job details with caching
  - `deleteJob()`: Soft delete with ownership verification
  - `toggleJobStatus()`: Activate/deactivate job postings

- **Search & Discovery**:
  - `searchJobs()`: Advanced search with caching (5-minute cache)
  - Multiple filter support: location, skills, experience, compensation, work modes
  - Full-text search across title, description, and company name
  - Sorting options with pagination

- **Recruiter Features**:
  - `getRecruiterJobs()`: Get all jobs posted by a recruiter
  - Ownership verification for all job operations
  - Application count tracking

- **Business Logic**:
  - Compensation validation (internships use stipend, full-time use salary)
  - Min/max compensation range validation
  - Company association verification
  - Cache management for search performance

### 3. Jobs Controller (`/src/jobs/jobs.controller.ts`)
- **Public Endpoints**:
  - `GET /jobs`: Search jobs with advanced filtering
  - `GET /jobs/:id`: Get job details by ID

- **Recruiter Endpoints** (Authentication + RECRUITER/ADMIN role):
  - `POST /jobs`: Create new job posting
  - `PUT /jobs/:id`: Update job details
  - `PUT /jobs/:id/toggle-status`: Activate/deactivate job
  - `DELETE /jobs/:id`: Delete job posting
  - `GET /jobs/my`: Get recruiter's job postings

- **Security Features**:
  - JWT authentication for protected endpoints
  - Role-based access control
  - Throttling protection
  - Ownership verification for job operations

### 4. Jobs Module (`/src/jobs/jobs.module.ts`)
- Registers Job and Company entities with TypeORM
- Exports JobsService for use in other modules (Applications)
- Integrates with caching system

## API Documentation

### Job Search
```http
GET /jobs?q=software&kind=FULL_TIME&locations=Remote&skills=JavaScript,React&page=1&limit=20
```

**Query Parameters:**
- `q`: Search query (title, description, company name)
- `kind`: Job type (INTERNSHIP, FULL_TIME, CONTRACT, FREELANCE)
- `locations`: Array of location strings
- `work_modes`: Array of work modes (REMOTE, HYBRID, ON_SITE)
- `skills`: Array of required skills
- `experience_level`: Experience level filter
- `company_id`: Filter by specific company
- `min_stipend/max_stipend`: Stipend range for internships
- `min_salary/max_salary`: Salary range for full-time jobs
- `sort_by`: Sorting field (created_at, application_deadline)
- `sort_order`: Sort direction (ASC, DESC)
- `page`: Page number for pagination
- `limit`: Results per page

### Create Job
```http
POST /jobs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Senior Full Stack Developer",
  "kind": "FULL_TIME",
  "description": "Join our team to build scalable web applications...",
  "requirements": ["5+ years experience", "React expertise", "Node.js proficiency"],
  "responsibilities": ["Lead development team", "Architect solutions", "Code review"],
  "company_id": "123e4567-e89b-12d3-a456-426614174000",
  "min_salary": 1500000,
  "max_salary": 2000000,
  "locations": ["Bangalore", "Remote"],
  "work_modes": ["HYBRID", "REMOTE"],
  "skills": ["React", "Node.js", "TypeScript", "PostgreSQL"],
  "benefits": ["Health Insurance", "Stock Options", "Flexible Hours"],
  "experience_level": "SENIOR",
  "application_deadline": "2024-12-31T23:59:59.000Z"
}
```

### Update Job
```http
PUT /jobs/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Job Title",
  "max_salary": 2200000,
  "skills": ["React", "Node.js", "TypeScript", "GraphQL"]
}
```

## Job Types & Compensation

### Job Kinds
- **INTERNSHIP**: Uses stipend-based compensation
- **FULL_TIME**: Uses salary-based compensation  
- **CONTRACT**: Uses salary-based compensation
- **FREELANCE**: Uses salary-based compensation

### Work Modes
- **REMOTE**: Fully remote work
- **HYBRID**: Mix of remote and office work
- **ON_SITE**: Fully office-based work

### Experience Levels
- **ENTRY**: 0-2 years experience
- **MID**: 2-5 years experience
- **SENIOR**: 5+ years experience
- **LEAD**: Leadership role with extensive experience

## Caching Strategy

### Search Results Caching
- **Cache Key**: `jobs:search:${JSON.stringify(searchDto)}`
- **Duration**: 5 minutes
- **Purpose**: Improve search performance for repeated queries

### Individual Job Caching
- **Cache Key**: `job:${jobId}`
- **Duration**: Variable based on access patterns
- **Purpose**: Reduce database load for frequently accessed jobs

### Cache Invalidation
- Automatic invalidation on job creation, updates, and status changes
- Bulk cache clearing for search results when any job is modified

## Security Features

### Authentication & Authorization
- JWT token-based authentication for protected endpoints
- Role-based access control (RECRUITER, ADMIN roles for job management)
- Ownership verification (recruiters can only modify their own jobs)

### Input Validation
- Comprehensive DTO validation with class-validator
- Compensation validation based on job type
- Required field validation with custom error messages

### Rate Limiting
- Throttling protection on all endpoints
- Prevents abuse and ensures fair usage

## Integration with Other Modules

### Applications Module
- Jobs service is exported and used by Applications module
- Job details included in application responses
- Application count tracking on job entities

### Companies Module
- Company validation during job creation
- Company details included in job responses
- Company-based job filtering in search

### Files Module
- Support for file attachments in job descriptions
- Integration with file storage for company logos

## Performance Optimizations

### Database Optimization
- Efficient query building with TypeORM query builder
- Proper indexing on frequently searched fields
- Pagination to handle large datasets

### Caching Strategy
- Redis-based caching for search results
- Intelligent cache invalidation
- Reduced database load for repeated queries

### Search Performance
- Full-text search with ILIKE queries
- Efficient filtering with array operations
- Optimized sorting and pagination

## Usage Examples

### Student Job Search Flow
1. Student visits job board
2. Applies filters (location, skills, job type)
3. System returns cached results if available
4. Student clicks on job for detailed view
5. Cached job details served instantly

### Recruiter Job Management Flow
1. Recruiter logs in and navigates to job management
2. Creates new job with company association
3. System validates compensation rules
4. Job is created and search cache is cleared
5. Recruiter can update, activate/deactivate, or delete job
6. All operations include ownership verification

### Search Performance Flow
1. Search query is hashed and checked in cache
2. If cache hit, results returned immediately
3. If cache miss, database query executed
4. Results cached for 5 minutes
5. Subsequent identical searches served from cache

This module provides a robust foundation for job management with excellent performance, security, and user experience for both recruiters and job seekers.
