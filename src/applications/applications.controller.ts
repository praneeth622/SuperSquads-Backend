import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiExtraModels,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { ApplicationsService } from './applications.service';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationSearchDto,
  ApplicationResponseDto,
  ApplicationListResponseDto,
  ApplicationStatsDto,
} from './dto/application.dto';

@ApiTags('applications')
@ApiBearerAuth()
@ApiExtraModels(
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationResponseDto,
  ApplicationListResponseDto,
  ApplicationStatsDto,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.STUDENT)
  @ApiOperation({
    summary: 'Submit a job application',
    description:
      'Students can submit applications for jobs with optional cover letter, resume, and answers to job-specific questions.',
  })
  @ApiBody({
    type: CreateApplicationDto,
    description: 'Application data',
    examples: {
      basic: {
        summary: 'Basic application',
        description: 'Minimal application with just job ID',
        value: {
          job_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
      complete: {
        summary: 'Complete application',
        description: 'Application with all optional fields',
        value: {
          job_id: '123e4567-e89b-12d3-a456-426614174000',
          cover_letter:
            "I am very interested in this Software Engineer position because of my strong background in full-stack development. My experience with React, Node.js, and TypeScript aligns perfectly with your requirements. I am particularly excited about your company's mission to democratize financial services.",
          resume_file_id: '987fcdeb-51a2-43d1-b456-426614174111',
          answers: {
            years_of_experience: '2-3 years',
            preferred_location: 'Remote/Hybrid',
            availability: 'Can start immediately',
            salary_expectation: '12-15 LPA',
            tech_stack_experience:
              'React, Node.js, TypeScript, PostgreSQL, AWS',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Application submitted successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: 'applied',
        cover_letter: 'I am very interested in this position...',
        answers: {
          years_of_experience: '2-3 years',
          preferred_location: 'Remote/Hybrid',
        },
        job: {
          id: '456e7890-e89b-12d3-a456-426614174001',
          title: 'Software Engineer Intern',
          kind: 'internship',
          company: {
            id: '789e0123-e89b-12d3-a456-426614174002',
            name: 'TechCorp Solutions',
            logo_url: 'https://example.com/logo.png',
          },
        },
        resume_file: {
          id: '987fcdeb-51a2-43d1-b456-426614174111',
          original_name: 'john_doe_resume.pdf',
          public_url: 'https://storage.example.com/resumes/john-doe-resume.pdf',
        },
        submitted_at: '2024-03-15T10:30:00.000Z',
        updated_at: '2024-03-15T10:30:00.000Z',
        reviewed_at: null,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid application data or deadline passed',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Already applied for this job',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found or inactive',
  })
  async create(
    @Body() createApplicationDto: CreateApplicationDto,
    @Request() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.createApplication(
      createApplicationDto,
      req.user.sub,
    );
  }

  @Get('my-applications')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Get current student applications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student applications retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'job_id',
    required: false,
    description: 'Filter by job ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort field (default: submitted_at)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order (asc/desc, default: desc)',
  })
  async getMyApplications(
    @Query() searchDto: ApplicationSearchDto,
    @Request() req: any,
  ): Promise<ApplicationListResponseDto> {
    return this.applicationsService.getStudentApplications(
      req.user.sub,
      searchDto,
    );
  }

  @Get('recruiter-dashboard')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get applications for recruiter jobs' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recruiter applications retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'job_id',
    required: false,
    description: 'Filter by job ID',
  })
  @ApiQuery({
    name: 'student_id',
    required: false,
    description: 'Filter by student ID',
  })
  @ApiQuery({
    name: 'submitted_after',
    required: false,
    description: 'Filter applications submitted after date',
  })
  @ApiQuery({
    name: 'submitted_before',
    required: false,
    description: 'Filter applications submitted before date',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort field (default: submitted_at)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order (asc/desc, default: desc)',
  })
  async getRecruiterApplications(
    @Query() searchDto: ApplicationSearchDto,
    @Request() req: any,
  ): Promise<ApplicationListResponseDto> {
    return this.applicationsService.getRecruiterApplications(
      req.user.sub,
      searchDto,
    );
  }

  @Get('stats')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Get application statistics for recruiter' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application statistics retrieved successfully',
  })
  async getApplicationStats(@Request() req: any): Promise<ApplicationStatsDto> {
    return this.applicationsService.getApplicationStats(req.user.sub);
  }

  @Get(':id')
  @Roles(UserRole.STUDENT, UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get application by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No permission to view this application',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.getApplicationById(
      id,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id')
  @Roles(UserRole.RECRUITER)
  @ApiOperation({ summary: 'Update application status and notes' })
  @ApiParam({ name: 'id', type: 'string', description: 'Application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No permission to update this application',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateApplicationDto: UpdateApplicationDto,
    @Request() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.updateApplication(
      id,
      updateApplicationDto,
      req.user.sub,
    );
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Withdraw job application' })
  @ApiParam({ name: 'id', type: 'string', description: 'Application ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application withdrawn successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Application not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot withdraw this application',
  })
  async withdrawApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
  ): Promise<ApplicationResponseDto> {
    return this.applicationsService.withdrawApplication(id, req.user.sub);
  }

  // Admin endpoints

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all applications (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All applications retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by application status',
  })
  @ApiQuery({
    name: 'job_id',
    required: false,
    description: 'Filter by job ID',
  })
  @ApiQuery({
    name: 'student_id',
    required: false,
    description: 'Filter by student ID',
  })
  @ApiQuery({
    name: 'submitted_after',
    required: false,
    description: 'Filter applications submitted after date',
  })
  @ApiQuery({
    name: 'submitted_before',
    required: false,
    description: 'Filter applications submitted before date',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort field (default: submitted_at)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order (asc/desc, default: desc)',
  })
  async findAll(
    @Query() searchDto: ApplicationSearchDto,
  ): Promise<ApplicationListResponseDto> {
    // For admin, use recruiter method but without recruiter filter
    // You might want to create a separate admin method
    throw new Error('Admin getAllApplications method not implemented yet');
  }
}
