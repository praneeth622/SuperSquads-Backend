import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UsePipes,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CollegeVerifiedGuard } from '../auth/guards/college-verified.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';
import { JobsService } from './jobs.service';
import {
  CreateJobDto,
  CreateJobSchema,
  UpdateJobDto,
  UpdateJobSchema,
  JobSearchDto,
  JobSearchSchema,
  JobResponseDto,
  JobListResponseDto,
} from './dto/job.dto';

@Controller('jobs')
@UseGuards(ThrottlerGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(CreateJobSchema))
  async createJob(
    @Body() createJobDto: CreateJobDto,
    @CurrentUser() user: any,
  ): Promise<JobResponseDto> {
    return this.jobsService.createJob(createJobDto, user.id);
  }

  @Get()
  @UsePipes(new ZodValidationPipe(JobSearchSchema))
  async searchJobs(
    @Query() searchDto: JobSearchDto,
  ): Promise<JobListResponseDto> {
    return this.jobsService.searchJobs(searchDto);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  async getMyJobs(
    @CurrentUser() user: any,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ): Promise<JobListResponseDto> {
    return this.jobsService.getRecruiterJobs(
      user.id,
      Number(page),
      Number(limit),
    );
  }

  @Get(':id')
  async getJobById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JobResponseDto> {
    return this.jobsService.findJobById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  @UsePipes(new ZodValidationPipe(UpdateJobSchema))
  async updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateJobDto: UpdateJobDto,
    @CurrentUser() user: any,
  ): Promise<JobResponseDto> {
    return this.jobsService.updateJob(id, updateJobDto, user.id);
  }

  @Put(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  async toggleJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<JobResponseDto> {
    return this.jobsService.toggleJobStatus(id, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.RECRUITER, UserRole.ADMIN)
  async deleteJob(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<{ message: string }> {
    await this.jobsService.deleteJob(id, user.id);
    return { message: 'Job deleted successfully' };
  }
}
