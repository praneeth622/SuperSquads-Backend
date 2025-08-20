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
import { CompaniesService } from './companies.service';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanySearchDto,
  CompanyResponseDto,
  CompanyListResponseDto,
  CompanyStatsDto,
} from './dto/company.dto';

@ApiTags('companies')
@ApiBearerAuth()
@ApiExtraModels(
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanyResponseDto,
  CompanyListResponseDto,
  CompanyStatsDto,
)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new company',
    description:
      'Recruiters can create company profiles. New companies require admin verification before being fully active.',
  })
  @ApiBody({
    type: CreateCompanyDto,
    description: 'Company creation data',
    examples: {
      basic: {
        summary: 'Basic company',
        description: 'Minimal company profile with required fields',
        value: {
          name: 'TechCorp Solutions',
          website: 'https://techcorp.com',
          domain: 'techcorp.com',
        },
      },
      complete: {
        summary: 'Complete company profile',
        description: 'Company profile with all optional fields',
        value: {
          name: 'TechCorp Solutions',
          website: 'https://techcorp.com',
          domain: 'techcorp.com',
          description:
            'Leading technology company focused on innovative software solutions for enterprises. We specialize in cloud infrastructure, AI/ML solutions, and fintech applications.',
          logo_url: 'https://techcorp.com/logo.png',
          industry: 'Technology',
          company_size: '51-200',
          headquarters: 'San Francisco, CA, USA',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Company created successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'TechCorp Solutions',
        website: 'https://techcorp.com',
        domain: 'techcorp.com',
        description:
          'Leading technology company focused on innovative software solutions',
        logo_url: 'https://techcorp.com/logo.png',
        industry: 'Technology',
        company_size: '51-200',
        headquarters: 'San Francisco, CA, USA',
        is_verified: false,
        created_at: '2024-03-15T10:30:00.000Z',
        updated_at: '2024-03-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Company with this name or domain already exists',
  })
  async create(
    @Body() createCompanyDto: CreateCompanyDto,
    @Request() req: any,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.createCompany(createCompanyDto, req.user.sub);
  }

  @Get()
  @ApiOperation({
    summary: 'Search and list companies',
    description:
      'Get a paginated list of companies with optional search and filtering',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in company name and description',
  })
  @ApiQuery({
    name: 'industry',
    required: false,
    description: 'Filter by industry',
  })
  @ApiQuery({
    name: 'company_size',
    required: false,
    description: 'Filter by company size',
  })
  @ApiQuery({
    name: 'is_verified',
    required: false,
    type: Boolean,
    description: 'Filter by verification status',
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
    description: 'Items per page (default: 20)',
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    description: 'Sort field (default: name)',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    description: 'Sort order (asc/desc, default: asc)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Companies retrieved successfully',
    schema: {
      example: {
        companies: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'TechCorp Solutions',
            website: 'https://techcorp.com',
            domain: 'techcorp.com',
            description: 'Leading technology company',
            logo_url: 'https://techcorp.com/logo.png',
            industry: 'Technology',
            company_size: '51-200',
            headquarters: 'San Francisco, CA, USA',
            is_verified: true,
            created_at: '2024-03-15T10:30:00.000Z',
            updated_at: '2024-03-15T10:30:00.000Z',
          },
        ],
        total: 150,
        page: 1,
        limit: 20,
        total_pages: 8,
      },
    },
  })
  async findAll(
    @Query() searchDto: CompanySearchDto,
  ): Promise<CompanyListResponseDto> {
    return this.companiesService.searchCompanies(searchDto);
  }

  @Get('verified')
  @ApiOperation({
    summary: 'Get verified companies only',
    description: 'List all verified companies available for job postings',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verified companies retrieved successfully',
  })
  async getVerified(
    @Query() searchDto: CompanySearchDto,
  ): Promise<CompanyListResponseDto> {
    return this.companiesService.getVerifiedCompanies(searchDto);
  }

  @Get('stats')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get company statistics (admin only)',
    description:
      'Get comprehensive statistics about companies, industries, and verification status',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company statistics retrieved successfully',
    schema: {
      example: {
        total_companies: 150,
        verified_companies: 120,
        pending_verification: 30,
        top_industries: [
          { industry: 'Technology', count: 45 },
          { industry: 'Finance', count: 30 },
          { industry: 'Healthcare', count: 20 },
        ],
        by_company_size: {
          '1-10': 20,
          '11-50': 35,
          '51-200': 40,
          '201-500': 25,
          '501-1000': 15,
          '1001-5000': 10,
          '5000+': 5,
        },
      },
    },
  })
  async getStats(): Promise<CompanyStatsDto> {
    return this.companiesService.getCompanyStats();
  }

  @Get('pending-verification')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get companies pending verification (admin only)',
    description: 'Get list of companies awaiting admin verification',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Pending companies retrieved successfully',
  })
  async getPendingVerification(): Promise<CompanyListResponseDto> {
    return this.companiesService.getPendingVerification();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get company by ID',
    description:
      'Get detailed information about a specific company including job statistics',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
  @ApiQuery({
    name: 'include_stats',
    required: false,
    type: Boolean,
    description: 'Include job and application statistics',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company retrieved successfully',
    schema: {
      example: {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'TechCorp Solutions',
        website: 'https://techcorp.com',
        domain: 'techcorp.com',
        description:
          'Leading technology company focused on innovative solutions',
        logo_url: 'https://techcorp.com/logo.png',
        industry: 'Technology',
        company_size: '51-200',
        headquarters: 'San Francisco, CA, USA',
        is_verified: true,
        total_jobs: 25,
        active_jobs: 8,
        total_applications: 150,
        created_at: '2024-03-15T10:30:00.000Z',
        updated_at: '2024-03-15T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('include_stats') includeStats?: boolean,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.getCompanyById(id, includeStats);
  }

  @Patch(':id')
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Update company information',
    description:
      'Update company profile. Only admins can change verification status.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
  @ApiBody({
    type: UpdateCompanyDto,
    description: 'Company update data',
    examples: {
      basic_update: {
        summary: 'Basic update',
        description: 'Update basic company information',
        value: {
          description:
            'Updated company description with more details about our services',
          website: 'https://techcorp.com',
          headquarters: 'New York, NY, USA',
        },
      },
      admin_verification: {
        summary: 'Admin verification (admin only)',
        description: 'Admin updating verification status',
        value: {
          is_verified: true,
          name: 'TechCorp Solutions Inc',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'No permission to update this company',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCompanyDto: UpdateCompanyDto,
    @Request() req: any,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.updateCompany(
      id,
      updateCompanyDto,
      req.user.sub,
      req.user.role,
    );
  }

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Verify company (admin only)',
    description: 'Mark a company as verified, allowing it to post jobs',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company verified successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  async verify(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CompanyResponseDto> {
    return this.companiesService.verifyCompany(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reject company verification (admin only)',
    description: 'Mark a company as rejected for verification',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
  @ApiBody({
    description: 'Rejection reason (optional)',
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          description: 'Reason for rejection',
          example: 'Insufficient company information provided',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company rejected successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  async reject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
  ): Promise<void> {
    return this.companiesService.rejectCompany(id, body.reason);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Delete company (admin only)',
    description:
      'Permanently delete a company. Cannot delete companies with active job postings.',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'Company ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Company deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Company not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete company with active jobs',
  })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.companiesService.deleteCompany(id);
  }
}
