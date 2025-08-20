# Student Profiles Module

## Overview
The Student Profiles module provides comprehensive student profile management functionality, allowing students to create detailed professional profiles, manage their academic and career information, and showcase their skills and projects to potential employers.

## Features Implemented

### 1. Student Profile DTOs (`/src/student-profiles/dto/student-profile.dto.ts`)
- **CreateStudentProfileDto**: Complete profile creation with personal, academic, and professional details
- **UpdateStudentProfileDto**: Partial updates for flexible profile management
- **StudentProfileSearchDto**: Advanced search with filters for name, location, skills, availability
- **StudentProfileResponseDto**: Comprehensive profile response with all student information
- **AvailabilityStatus**: Enum for job opportunity availability (AVAILABLE, BUSY, NOT_AVAILABLE)
- **EducationLevel**: Academic level tracking (HIGHSCHOOL, ASSOCIATE, BACHELOR, MASTER, DOCTORATE)
- **ExperienceLevel**: Professional experience classification (ENTRY, MID, SENIOR, LEAD)

### 2. Student Profiles Service (`/src/student-profiles/student-profiles.service.ts`)
- **Profile Management**:
  - `createProfile()`: Create comprehensive student profile with validation
  - `updateProfile()`: Update profile with flexible field updates
  - `findProfileByUserId()`: Get profile by user ID with relations
  - `deleteProfile()`: Remove student profile completely

- **Search & Discovery**:
  - `findAllProfiles()`: Advanced search with multiple filters
  - Filter support: name, location, availability status, skills
  - Sorting options with pagination
  - Full-text search across profile fields

- **Analytics & Statistics**:
  - `getProfileStats()`: System-wide profile analytics
  - Verification status distribution
  - Opportunity availability tracking
  - Recent profile creation trends

- **Data Transformation**:
  - DTO to entity mapping with metadata structure
  - Flexible name handling (first_name + last_name → full_name)
  - Complex metadata storage for education, experience, projects
  - Availability status to boolean conversion

### 3. Student Profiles Controller (`/src/student-profiles/student-profiles.controller.ts`)
- **Student Endpoints** (Authentication required):
  - `POST /student-profiles`: Create student profile
  - `GET /student-profiles/me`: Get current user's profile
  - `PUT /student-profiles/me`: Update current user's profile
  - `DELETE /student-profiles/me`: Delete current user's profile

- **Public/Recruiter Endpoints**:
  - `GET /student-profiles`: Search all student profiles
  - `GET /student-profiles/:id`: Get specific student profile
  - `GET /student-profiles/stats`: Get profile statistics

- **Security Features**:
  - JWT authentication for profile operations
  - User ownership verification
  - Profile uniqueness enforcement
  - Role-based access control for statistics

### 4. Student Profiles Module (`/src/student-profiles/student-profiles.module.ts`)
- Registers StudentProfile and User entities with TypeORM
- Exports StudentProfilesService for use in other modules
- Integrates with user authentication system

## API Documentation

### Profile Search
```http
GET /student-profiles?name=john&location=bangalore&availability_status=AVAILABLE&page=1&limit=20
```

**Query Parameters:**
- `name`: Search by student name
- `location`: Filter by preferred location
- `availability_status`: Filter by job availability (AVAILABLE, BUSY, NOT_AVAILABLE)
- `skills`: Array of skills to match
- `experience_level`: Experience level filter
- `education_level`: Education level filter
- `sort_by`: Sort field (first_name, last_name, created_at, updated_at)
- `sort_order`: Sort direction (asc, desc)
- `page`: Page number for pagination
- `limit`: Results per page

### Create Student Profile
```http
POST /student-profiles
Authorization: Bearer <token>
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "headline": "Full Stack Developer | React & Node.js Expert",
  "summary": "Passionate software developer with 3+ years of experience in building scalable web applications. Expertise in React, Node.js, and cloud technologies.",
  "phone": "+91-9876543210",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "github_url": "https://github.com/johndoe",
  "portfolio_url": "https://johndoe.dev",
  "location": "Bangalore, India",
  "availability_status": "AVAILABLE",
  "desired_job_types": ["FULL_TIME", "INTERNSHIP"],
  "skills": ["JavaScript", "React", "Node.js", "TypeScript", "PostgreSQL"],
  "languages": ["English", "Hindi", "Kannada"],
  "education": [
    {
      "degree": "Bachelor of Engineering",
      "field_of_study": "Computer Science",
      "institution": "ABC University",
      "location": "Bangalore, India",
      "start_date": "2020-08-01",
      "end_date": "2024-05-31",
      "gpa": "8.5/10",
      "activities": ["Programming Club", "Tech Fest Coordinator"]
    }
  ],
  "experience": [
    {
      "title": "Software Developer Intern",
      "company": "TechCorp Solutions",
      "location": "Bangalore, India",
      "start_date": "2023-06-01",
      "end_date": "2023-08-31",
      "description": "Developed and maintained React components for the company's main web application. Collaborated with senior developers to implement new features and fix bugs.",
      "technologies": ["React", "JavaScript", "CSS", "Git"]
    }
  ],
  "projects": [
    {
      "name": "AI-Powered Job Matching Platform",
      "description": "A full-stack web application that uses machine learning to match students with relevant job opportunities",
      "technologies": ["React", "Node.js", "Python", "TensorFlow", "PostgreSQL"],
      "repository_url": "https://github.com/johndoe/ai-job-matching",
      "demo_url": "https://ai-job-matching.vercel.app",
      "start_date": "2024-01-15",
      "end_date": "2024-03-30"
    }
  ]
}
```

### Update Student Profile
```http
PUT /student-profiles/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "headline": "Senior Full Stack Developer | React & Node.js Expert",
  "summary": "Updated summary with more experience...",
  "availability_status": "BUSY",
  "skills": ["JavaScript", "React", "Node.js", "TypeScript", "PostgreSQL", "Docker", "AWS"]
}
```

## Profile Data Structure

### Personal Information
- **Basic Details**: First name, last name, headline, summary, phone
- **Professional Links**: LinkedIn, GitHub, portfolio URLs
- **Location**: Preferred work location
- **Availability**: Current job search status

### Academic Information
- **Education History**: Degrees, institutions, GPAs, activities
- **Academic Level**: High school, bachelor's, master's, doctorate
- **Relevant Coursework**: Technical subjects and projects

### Professional Information
- **Experience**: Internships, jobs, freelance work
- **Skills**: Technical and soft skills
- **Projects**: Personal and academic projects with descriptions
- **Languages**: Spoken languages and proficiency

### Availability Status
- **AVAILABLE**: Actively looking for opportunities
- **BUSY**: Open to opportunities but currently engaged
- **NOT_AVAILABLE**: Not looking for new opportunities

### Experience Levels
- **ENTRY**: 0-2 years of experience
- **MID**: 2-5 years of experience
- **SENIOR**: 5+ years of experience
- **LEAD**: Leadership experience

## Profile Verification System

### Verification Status
- **UNVERIFIED**: New profiles awaiting verification
- **PENDING**: Verification process initiated
- **VERIFIED**: Profile verified by administrators
- **REJECTED**: Profile verification failed

### Verification Process
1. Student creates profile with complete information
2. System validates required fields and data quality
3. Admin reviews profile for accuracy and completeness
4. Profile is marked as verified or rejected with feedback

## Search and Discovery Features

### Advanced Filtering
- **Text Search**: Search across name, headline, and summary
- **Location Filtering**: Filter by preferred work locations
- **Skill Matching**: Match specific technical skills
- **Availability Filter**: Filter by job search status
- **Experience Level**: Filter by professional experience

### Sorting Options
- **Alphabetical**: Sort by first or last name
- **Chronological**: Sort by profile creation or update date
- **Relevance**: Sort by search relevance (when searching)

## Analytics and Statistics

### Profile Metrics
- Total student profiles in system
- Verification status distribution
- Availability status breakdown
- Recent profile creation trends

### Usage Analytics
- Profile view counts
- Search pattern analysis
- Popular skill trends
- Geographic distribution

## Integration with Other Modules

### Applications Module
- Student profile data included in job applications
- Profile completeness affects application quality
- Skills matching for job recommendations

### Skills Module
- Skill validation and suggestions
- Proficiency tracking and endorsements
- Skill trend analysis

### Jobs Module
- Profile-based job recommendations
- Skills matching algorithms
- Location-based job filtering

### Notifications Module
- Profile completion reminders
- Verification status updates
- Job match notifications

## Security Features

### Data Protection
- JWT authentication for all profile operations
- User ownership verification for profile access
- Sensitive data encryption
- Privacy controls for profile visibility

### Input Validation
- Comprehensive DTO validation
- URL validation for professional links
- Phone number format validation
- Date range validation for education/experience

## Usage Examples

### Student Onboarding Flow
1. Student registers and logs in
2. System prompts for profile creation
3. Student fills comprehensive profile form
4. Profile is created and submitted for verification
5. Student receives confirmation and can start applying for jobs

### Recruiter Profile Discovery Flow
1. Recruiter searches for candidates with specific skills
2. System returns filtered results with profile highlights
3. Recruiter views detailed profiles of interested candidates
4. Recruiter can contact students or bookmark profiles
5. Recruitment analytics track profile engagement

### Profile Management Flow
1. Student logs in and accesses profile dashboard
2. Student updates experience, skills, or availability
3. System validates changes and updates profile
4. Updated profile is immediately visible to recruiters
5. Student receives confirmation of successful update

This module provides a comprehensive foundation for student profile management with detailed academic and professional tracking, advanced search capabilities, and seamless integration with the job application ecosystem.
