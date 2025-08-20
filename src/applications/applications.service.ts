import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, In } from 'typeorm';
import { Application, ApplicationStatus } from '../entities/application.entity';
import { Job } from '../entities/job.entity';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import { StudentProfile } from '../entities/student-profile.entity';
import { College } from '../entities/college.entity';
import { Company } from '../entities/company.entity';
import {
  CreateApplicationDto,
  UpdateApplicationDto,
  ApplicationSearchDto,
  ApplicationResponseDto,
  ApplicationListResponseDto,
  ApplicationStatsDto,
} from './dto/application.dto';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
  ) {}

  async createApplication(createApplicationDto: CreateApplicationDto, studentId: string): Promise<ApplicationResponseDto> {
    // Check if job exists and is active
    const job = await this.jobRepository.findOne({
      where: { id: createApplicationDto.job_id, is_active: true },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found or is no longer active');
    }

    // Check if application deadline has passed
    if (job.application_deadline && job.application_deadline < new Date()) {
      throw new BadRequestException('Application deadline has passed');
    }

    // Check if student has already applied
    const existingApplication = await this.applicationRepository.findOne({
      where: {
        job_id: createApplicationDto.job_id,
        student_id: studentId,
      },
    });

    if (existingApplication) {
      throw new ConflictException('You have already applied for this job');
    }

    // Validate resume file if provided
    let resumeFile: File | null = null;
    if (createApplicationDto.resume_file_id) {
      resumeFile = await this.fileRepository.findOne({
        where: { id: createApplicationDto.resume_file_id, uploaded_by: studentId },
      });

      if (!resumeFile) {
        throw new NotFoundException('Resume file not found');
      }
    }

    // Create application
    const application = this.applicationRepository.create({
      ...createApplicationDto,
      student_id: studentId,
      status: ApplicationStatus.APPLIED,
    });

    const savedApplication = await this.applicationRepository.save(application);

    // Update job application count
    await this.jobRepository.update(job.id, {
      application_count: job.application_count + 1,
    });

    return this.formatApplicationResponse(savedApplication, job, null, resumeFile);
  }

  async updateApplication(
    id: string,
    updateApplicationDto: UpdateApplicationDto,
    recruiterId: string,
  ): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job', 'job.company'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check if recruiter owns this job
    if (application.job.recruiter_id !== recruiterId) {
      throw new ForbiddenException('You can only update applications for your job postings');
    }

    // Update application
    await this.applicationRepository.update(id, {
      ...updateApplicationDto,
      status: updateApplicationDto.status as ApplicationStatus,
      reviewed_at: new Date(),
      reviewed_by: recruiterId,
      updated_at: new Date(),
    });

    const updatedApplication = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job', 'job.company'],
    });

    return this.formatApplicationResponse(updatedApplication!, updatedApplication!.job);
  }

  async getApplicationById(id: string, userId: string, userRole: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job', 'job.company', 'student'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Check permissions
    const canAccess = userRole === 'admin' ||
      application.student_id === userId ||
      application.job.recruiter_id === userId;

    if (!canAccess) {
      throw new ForbiddenException('You do not have permission to view this application');
    }

    // Load additional data based on user role
    let studentProfile: StudentProfile | null = null;
    let resumeFile: File | null = null;

    if (userRole === 'recruiter' || userRole === 'admin') {
      studentProfile = await this.studentProfileRepository.findOne({
        where: { user_id: application.student_id },
        relations: ['college'],
      });
    }

    if (application.resume_file_id) {
      resumeFile = await this.fileRepository.findOne({
        where: { id: application.resume_file_id },
      });
    }

    return this.formatApplicationResponse(application, application.job, studentProfile, resumeFile);
  }

  async getStudentApplications(studentId: string, searchDto: ApplicationSearchDto): Promise<ApplicationListResponseDto> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .where('application.student_id = :studentId', { studentId });

    this.applySearchFilters(queryBuilder, searchDto);
    this.applySorting(queryBuilder, searchDto);

    const total = await queryBuilder.getCount();
    const offset = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(offset).take(searchDto.limit);

    const applications = await queryBuilder.getMany();

    return {
      applications: applications.map(app => this.formatApplicationResponse(app, app.job)),
      total,
      page: searchDto.page,
      limit: searchDto.limit,
      total_pages: Math.ceil(total / searchDto.limit),
    };
  }

  async getRecruiterApplications(recruiterId: string, searchDto: ApplicationSearchDto): Promise<ApplicationListResponseDto> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.job', 'job')
      .leftJoinAndSelect('job.company', 'company')
      .leftJoinAndSelect('application.student', 'student')
      .where('job.recruiter_id = :recruiterId', { recruiterId });

    this.applySearchFilters(queryBuilder, searchDto);
    this.applySorting(queryBuilder, searchDto);

    const total = await queryBuilder.getCount();
    const offset = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(offset).take(searchDto.limit);

    const applications = await queryBuilder.getMany();

    // Load student profiles
    const applicationIds = applications.map(app => app.id);
    const studentIds = applications.map(app => app.student_id);
    const studentProfiles = await this.studentProfileRepository.find({
      where: { user_id: In(studentIds) },
      relations: ['college'],
    });

    const profileMap = new Map(studentProfiles.map(profile => [profile.user_id, profile]));

    return {
      applications: applications.map(app => {
        const studentProfile = profileMap.get(app.student_id);
        return this.formatApplicationResponse(app, app.job, studentProfile);
      }),
      total,
      page: searchDto.page,
      limit: searchDto.limit,
      total_pages: Math.ceil(total / searchDto.limit),
    };
  }

  async getApplicationStats(recruiterId: string): Promise<ApplicationStatsDto> {
    const queryBuilder = this.applicationRepository
      .createQueryBuilder('application')
      .leftJoin('application.job', 'job')
      .where('job.recruiter_id = :recruiterId', { recruiterId });

    const total = await queryBuilder.getCount();

    // Get applications by status
    const statusCounts = await queryBuilder
      .select('application.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('application.status')
      .getRawMany();

    const byStatus = statusCounts.reduce((acc, { status, count }) => {
      acc[status] = parseInt(count);
      return acc;
    }, {});

    // Get recent applications (last 7 days)
    const recentCount = await queryBuilder
      .andWhere('application.submitted_at >= :weekAgo', {
        weekAgo: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .getCount();

    return {
      total,
      by_status: byStatus,
      recent_count: recentCount,
    };
  }

  async withdrawApplication(id: string, studentId: string): Promise<ApplicationResponseDto> {
    const application = await this.applicationRepository.findOne({
      where: { id, student_id: studentId },
      relations: ['job', 'job.company'],
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (application.status === ApplicationStatus.WITHDRAWN) {
      throw new BadRequestException('Application is already withdrawn');
    }

    if ([ApplicationStatus.HIRED, ApplicationStatus.REJECTED].includes(application.status)) {
      throw new BadRequestException('Cannot withdraw application that has been processed');
    }

    await this.applicationRepository.update(id, {
      status: ApplicationStatus.WITHDRAWN,
      updated_at: new Date(),
    });

    const updatedApplication = await this.applicationRepository.findOne({
      where: { id },
      relations: ['job', 'job.company'],
    });

    return this.formatApplicationResponse(updatedApplication!, updatedApplication!.job);
  }

  private applySearchFilters(queryBuilder: SelectQueryBuilder<Application>, searchDto: ApplicationSearchDto): void {
    if (searchDto.status) {
      queryBuilder.andWhere('application.status = :status', { status: searchDto.status });
    }

    if (searchDto.job_id) {
      queryBuilder.andWhere('application.job_id = :jobId', { jobId: searchDto.job_id });
    }

    if (searchDto.student_id) {
      queryBuilder.andWhere('application.student_id = :studentId', { studentId: searchDto.student_id });
    }

    if (searchDto.submitted_after) {
      queryBuilder.andWhere('application.submitted_at >= :submittedAfter', {
        submittedAfter: new Date(searchDto.submitted_after),
      });
    }

    if (searchDto.submitted_before) {
      queryBuilder.andWhere('application.submitted_at <= :submittedBefore', {
        submittedBefore: new Date(searchDto.submitted_before),
      });
    }
  }

  private applySorting(queryBuilder: SelectQueryBuilder<Application>, searchDto: ApplicationSearchDto): void {
    const { sort_by, sort_order } = searchDto;
    
    switch (sort_by) {
      case 'updated_at':
        queryBuilder.orderBy('application.updated_at', sort_order.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'score':
        queryBuilder.orderBy('application.score', sort_order.toUpperCase() as 'ASC' | 'DESC');
        break;
      default:
        queryBuilder.orderBy('application.submitted_at', sort_order.toUpperCase() as 'ASC' | 'DESC');
    }
  }

  private formatApplicationResponse(
    application: Application,
    job?: Job,
    studentProfile?: StudentProfile | null,
    resumeFile?: File | null,
  ): ApplicationResponseDto {
    const response: any = {
      id: application.id,
      status: application.status,
      cover_letter: application.cover_letter,
      answers: application.answers,
      recruiter_notes: application.recruiter_notes,
      score: application.score,
      
      job: job ? {
        id: job.id,
        title: job.title,
        kind: job.kind,
        company: job.company ? {
          id: job.company.id,
          name: job.company.name,
          logo_url: job.company.logo_url,
        } : null,
      } : null,
      
      resume_file: resumeFile ? {
        id: resumeFile.id,
        original_name: resumeFile.original_name,
        public_url: resumeFile.public_url,
      } : null,
      
      submitted_at: application.submitted_at.toISOString(),
      updated_at: application.updated_at.toISOString(),
      reviewed_at: application.reviewed_at?.toISOString() || null,
    };

    // Add student info for recruiters
    if (studentProfile) {
      response.student = {
        id: application.student_id,
        email: application.student?.email,
        profile: {
          full_name: studentProfile.full_name,
          college: studentProfile.college ? {
            name: studentProfile.college.name,
            tier: studentProfile.college.tier,
          } : null,
          degree: studentProfile.degree,
          major: studentProfile.major,
          graduation_year: studentProfile.graduation_year,
          cgpa: studentProfile.cgpa,
        },
      };
    }

    return response;
  }
}
