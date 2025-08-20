import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { StudentProfilesService } from './student-profiles.service';
import {
  CreateStudentProfileDto,
  UpdateStudentProfileDto,
  StudentProfileSearchDto,
  StudentProfileResponseDto,
  AvailabilityStatus,
  EducationLevel,
  ExperienceLevel,
} from './dto/student-profile.dto';
import { VerificationStatus } from '../entities/student-profile.entity';

@ApiTags('Student Profiles')
@ApiBearerAuth()
@ApiExtraModels(
  CreateStudentProfileDto,
  UpdateStudentProfileDto,
  StudentProfileSearchDto,
  StudentProfileResponseDto,
)
@Controller('student-profiles')
export class StudentProfilesController {
  constructor(
    private readonly studentProfilesService: StudentProfilesService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Create student profile',
    description:
      'Create a comprehensive student profile with education, experience, and project details',
  })
  @ApiBody({
    type: CreateStudentProfileDto,
    description: 'Student profile creation data',
    examples: {
      'complete-profile': {
        summary: 'Complete Student Profile',
        description: 'A comprehensive student profile with all details',
        value: {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@university.edu',
          phone: '+1-555-123-4567',
          location: 'San Francisco, CA',
          headline:
            'Computer Science Student | Full-Stack Developer | AI Enthusiast',
          summary:
            'Passionate computer science student with 2+ years of experience in full-stack development. Specialized in React, Node.js, and machine learning applications.',
          portfolio_url: 'https://johndoe.dev',
          linkedin_url: 'https://linkedin.com/in/johndoe',
          github_url: 'https://github.com/johndoe',
          availability_status: 'available',
          desired_job_types: ['full-time', 'internship'],
          skills: [
            'JavaScript',
            'Python',
            'React',
            'Node.js',
            'PostgreSQL',
            'Docker',
          ],
          languages: ['English (Native)', 'Spanish (Conversational)'],
          education: [
            {
              institution: 'University of California, Berkeley',
              degree: 'Bachelor of Science in Computer Science',
              field_of_study: 'Computer Science',
              level: 'bachelor',
              start_date: '2020-09-01',
              end_date: '2024-05-15',
              gpa: 3.8,
              description: "Magna Cum Laude, Dean's List 2022-2024",
            },
          ],
          experience: [
            {
              company: 'Google Inc.',
              title: 'Software Engineer Intern',
              level: 'entry',
              start_date: '2023-06-01',
              end_date: '2023-08-31',
              description:
                'Developed microservices using Go and Python, improved system performance by 25%',
              technologies: ['Go', 'Python', 'Kubernetes', 'gRPC'],
            },
          ],
          projects: [
            {
              name: 'AI-Powered Job Matching Platform',
              description:
                'A full-stack web application that uses machine learning to match students with relevant job opportunities',
              technologies: [
                'React',
                'Node.js',
                'Python',
                'TensorFlow',
                'PostgreSQL',
              ],
              repository_url: 'https://github.com/johndoe/ai-job-matching',
              demo_url: 'https://ai-job-matching.vercel.app',
              start_date: '2024-01-15',
              end_date: '2024-03-30',
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student profile created successfully',
    type: StudentProfileResponseDto,
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@university.edu',
      phone: '+1-555-123-4567',
      location: 'San Francisco, CA',
      headline: 'Computer Science Student | Full-Stack Developer',
      summary:
        'Passionate computer science student with experience in full-stack development',
      portfolio_url: 'https://johndoe.dev',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      github_url: 'https://github.com/johndoe',
      availability_status: 'available',
      desired_job_types: ['full-time', 'internship'],
      skills: ['JavaScript', 'Python', 'React', 'Node.js'],
      languages: ['English (Native)', 'Spanish (Conversational)'],
      education: [],
      experience: [],
      projects: [],
      created_at: '2024-01-15T10:30:00Z',
      updated_at: '2024-01-15T10:30:00Z',
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Profile already exists for this user',
    example: {
      statusCode: 409,
      message: 'Profile already exists for this user',
      error: 'Conflict',
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
    example: {
      statusCode: 400,
      message: ['first_name must be longer than or equal to 2 characters'],
      error: 'Bad Request',
    },
  })
  async createProfile(
    @Request() req: any,
    @Body() createDto: CreateStudentProfileDto,
  ): Promise<any> {
    const userId = req.user.id;
    return this.studentProfilesService.createProfile(userId, createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all student profiles',
    description:
      'Retrieve student profiles with advanced filtering, searching, and pagination',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    description: 'Search by student name (first or last)',
    example: 'John',
  })
  @ApiQuery({
    name: 'skills',
    required: false,
    description: 'Filter by skills (comma-separated)',
    example: 'JavaScript,React,Node.js',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    description: 'Filter by location',
    example: 'San Francisco',
  })
  @ApiQuery({
    name: 'availability_status',
    required: false,
    enum: AvailabilityStatus,
    description: 'Filter by availability status',
    example: AvailabilityStatus.AVAILABLE,
  })
  @ApiQuery({
    name: 'education_level',
    required: false,
    enum: EducationLevel,
    description: 'Filter by education level',
    example: EducationLevel.BACHELOR,
  })
  @ApiQuery({
    name: 'experience_level',
    required: false,
    enum: ExperienceLevel,
    description: 'Filter by experience level',
    example: ExperienceLevel.JUNIOR,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of results per page (1-100)',
    example: 20,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort field',
    example: 'created_at',
    enum: ['created_at', 'updated_at', 'first_name', 'last_name'],
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student profiles retrieved successfully',
    example: {
      profiles: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@university.edu',
          location: 'San Francisco, CA',
          headline: 'Computer Science Student',
          availability_status: 'available',
          skills: ['JavaScript', 'Python', 'React'],
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
        },
      ],
      total: 150,
      page: 1,
      limit: 20,
      totalPages: 8,
    },
  })
  async getAllProfiles(@Query() searchDto: StudentProfileSearchDto) {
    return this.studentProfilesService.findAllProfiles(searchDto);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Get current user profile',
    description: "Retrieve the authenticated user's student profile",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: StudentProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found for current user',
    example: {
      statusCode: 404,
      message:
        'Student profile not found for user 550e8400-e29b-41d4-a716-446655440000',
      error: 'Not Found',
    },
  })
  async getCurrentUserProfile(@Request() req: any): Promise<any> {
    const userId = req.user.id;
    return this.studentProfilesService.findProfileByUserId(userId);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get student profiles statistics',
    description: 'Retrieve comprehensive statistics about student profiles',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
    example: {
      total_profiles: 1250,
      by_verification_status: {
        none: 450,
        pending: 150,
        verified: 600,
        rejected: 50,
      },
      by_opportunity_availability: {
        open: 850,
        closed: 400,
      },
      recent_profiles: 25,
    },
  })
  async getProfileStats() {
    return this.studentProfilesService.getProfileStats();
  }

  @Get(':userId')
  @ApiOperation({
    summary: 'Get student profile by user ID',
    description: 'Retrieve a specific student profile by user ID',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student profile retrieved successfully',
    type: StudentProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
    example: {
      statusCode: 404,
      message:
        'Student profile not found for user 550e8400-e29b-41d4-a716-446655440000',
      error: 'Not Found',
    },
  })
  async getProfileByUserId(
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<any> {
    return this.studentProfilesService.findProfileByUserId(userId);
  }

  @Put('me')
  @ApiOperation({
    summary: 'Update current user profile',
    description:
      "Update the authenticated user's student profile with new information",
  })
  @ApiBody({
    type: UpdateStudentProfileDto,
    description: 'Profile update data',
    examples: {
      'partial-update': {
        summary: 'Partial Profile Update',
        description: 'Update specific fields of the profile',
        value: {
          headline: 'Senior Computer Science Student | Full-Stack Developer',
          summary:
            'Experienced computer science student with 3+ years in full-stack development',
          skills: ['JavaScript', 'Python', 'React', 'Node.js', 'AWS', 'Docker'],
          availability_status: 'open_to_offers',
          desired_job_types: ['full-time', 'remote'],
        },
      },
      'experience-update': {
        summary: 'Add New Experience',
        description: 'Update profile with new work experience',
        value: {
          experience: [
            {
              company: 'Meta',
              title: 'Frontend Developer Intern',
              level: 'junior',
              start_date: '2024-06-01',
              end_date: '2024-08-31',
              description:
                'Worked on React components for Instagram web platform',
              technologies: ['React', 'TypeScript', 'GraphQL', 'Jest'],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: StudentProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
    example: {
      statusCode: 404,
      message:
        'Student profile not found for user 550e8400-e29b-41d4-a716-446655440000',
      error: 'Not Found',
    },
  })
  async updateCurrentUserProfile(
    @Request() req: any,
    @Body() updateDto: UpdateStudentProfileDto,
  ): Promise<any> {
    const userId = req.user.id;
    return this.studentProfilesService.updateProfile(userId, updateDto);
  }

  @Delete('me')
  @ApiOperation({
    summary: 'Delete current user profile',
    description: "Delete the authenticated user's student profile permanently",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Profile deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Profile not found',
    example: {
      statusCode: 404,
      message:
        'Student profile not found for user 550e8400-e29b-41d4-a716-446655440000',
      error: 'Not Found',
    },
  })
  async deleteCurrentUserProfile(@Request() req: any): Promise<void> {
    const userId = req.user.id;
    return this.studentProfilesService.deleteProfile(userId);
  }
}
