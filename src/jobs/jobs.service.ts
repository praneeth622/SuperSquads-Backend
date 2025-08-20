import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { Job, JobKind, WorkMode } from '../entities/job.entity';
import { Company } from '../entities/company.entity';
import { User, UserRole } from '../entities/user.entity';
import {
  CreateJobDto,
  UpdateJobDto,
  JobSearchDto,
  JobResponseDto,
  JobListResponseDto,
} from './dto/job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  async createJob(
    createJobDto: CreateJobDto,
    recruiterId: string,
  ): Promise<JobResponseDto> {
    // Verify company exists and recruiter has access
    const company = await this.companyRepository.findOne({
      where: { id: createJobDto.company_id },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Validate compensation based on job type
    this.validateCompensation(createJobDto);

    const jobData: Partial<Job> = {
      ...createJobDto,
      recruiter_id: recruiterId,
      kind: createJobDto.kind as JobKind,
      work_modes: createJobDto.work_modes as WorkMode[],
      application_deadline: createJobDto.application_deadline
        ? new Date(createJobDto.application_deadline)
        : undefined,
    };

    const job = this.jobRepository.create(jobData);
    const savedJob = await this.jobRepository.save(job);

    // Clear search cache
    await this.clearSearchCache();

    return this.formatJobResponse(savedJob, company);
  }

  async updateJob(
    id: string,
    updateJobDto: UpdateJobDto,
    recruiterId: string,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Check if recruiter owns this job
    if (job.recruiter_id !== recruiterId) {
      throw new ForbiddenException('You can only update your own job postings');
    }

    // Validate compensation if provided
    if (this.hasCompensationFields(updateJobDto)) {
      this.validateCompensation({ ...job, ...updateJobDto });
    }

    const updateData: Partial<Job> = {
      ...updateJobDto,
      kind: updateJobDto.kind as JobKind | undefined,
      work_modes: updateJobDto.work_modes as WorkMode[] | undefined,
      application_deadline: updateJobDto.application_deadline
        ? new Date(updateJobDto.application_deadline)
        : undefined,
      updated_at: new Date(),
    };

    await this.jobRepository.update(id, updateData);

    const updatedJob = await this.jobRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    // Clear cache
    await this.clearSearchCache();
    await this.cacheManager.del(`job:${id}`);

    return this.formatJobResponse(updatedJob!, updatedJob!.company);
  }

  async findJobById(id: string): Promise<JobResponseDto> {
    const cacheKey = `job:${id}`;
    const cached = await this.cacheManager.get<JobResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const job = await this.jobRepository.findOne({
      where: { id, is_active: true },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const response = this.formatJobResponse(job, job.company);

    // Cache for 10 minutes
    await this.cacheManager.set(cacheKey, response, 600);

    return response;
  }

  async searchJobs(searchDto: JobSearchDto): Promise<JobListResponseDto> {
    const cacheKey = `jobs:search:${JSON.stringify(searchDto)}`;
    const cached = await this.cacheManager.get<JobListResponseDto>(cacheKey);

    if (cached) {
      return cached;
    }

    const queryBuilder = this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.company', 'company')
      .where('job.is_active = :isActive', { isActive: true });

    this.applySearchFilters(queryBuilder, searchDto);
    this.applySorting(queryBuilder, searchDto);

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(offset).take(searchDto.limit);

    const jobs = await queryBuilder.getMany();

    const response: JobListResponseDto = {
      jobs: jobs.map((job) => this.formatJobResponse(job, job.company)),
      total,
      page: searchDto.page,
      limit: searchDto.limit,
      total_pages: Math.ceil(total / searchDto.limit),
    };

    // Cache for 5 minutes
    await this.cacheManager.set(cacheKey, response, 300);

    return response;
  }

  async getRecruiterJobs(
    recruiterId: string,
    page = 1,
    limit = 20,
  ): Promise<JobListResponseDto> {
    const offset = (page - 1) * limit;

    const [jobs, total] = await this.jobRepository.findAndCount({
      where: { recruiter_id: recruiterId },
      relations: ['company'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      jobs: jobs.map((job) => this.formatJobResponse(job, job.company)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async toggleJobStatus(
    id: string,
    recruiterId: string,
  ): Promise<JobResponseDto> {
    const job = await this.jobRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.recruiter_id !== recruiterId) {
      throw new ForbiddenException('You can only modify your own job postings');
    }

    await this.jobRepository.update(id, {
      is_active: !job.is_active,
      updated_at: new Date(),
    });

    const updatedJob = await this.jobRepository.findOne({
      where: { id },
      relations: ['company'],
    });

    // Clear cache
    await this.clearSearchCache();
    await this.cacheManager.del(`job:${id}`);

    return this.formatJobResponse(updatedJob!, updatedJob!.company);
  }

  async deleteJob(id: string, recruiterId: string): Promise<void> {
    const job = await this.jobRepository.findOne({ where: { id } });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.recruiter_id !== recruiterId) {
      throw new ForbiddenException('You can only delete your own job postings');
    }

    await this.jobRepository.delete(id);

    // Clear cache
    await this.clearSearchCache();
    await this.cacheManager.del(`job:${id}`);
  }

  private validateCompensation(jobData: any): void {
    const { kind, min_stipend, max_stipend, min_salary, max_salary } = jobData;

    if (kind === JobKind.INTERNSHIP) {
      if (min_salary || max_salary) {
        throw new BadRequestException(
          'Internships should use stipend, not salary',
        );
      }
      if (min_stipend && max_stipend && min_stipend > max_stipend) {
        throw new BadRequestException(
          'Minimum stipend cannot be greater than maximum stipend',
        );
      }
    } else {
      if (min_stipend || max_stipend) {
        throw new BadRequestException(
          'Full-time jobs should use salary, not stipend',
        );
      }
      if (min_salary && max_salary && min_salary > max_salary) {
        throw new BadRequestException(
          'Minimum salary cannot be greater than maximum salary',
        );
      }
    }
  }

  private hasCompensationFields(dto: UpdateJobDto): boolean {
    return !!(
      dto.min_stipend ||
      dto.max_stipend ||
      dto.min_salary ||
      dto.max_salary
    );
  }

  private applySearchFilters(
    queryBuilder: SelectQueryBuilder<Job>,
    searchDto: JobSearchDto,
  ): void {
    if (searchDto.q) {
      queryBuilder.andWhere(
        '(job.title ILIKE :search OR job.description ILIKE :search OR company.name ILIKE :search)',
        { search: `%${searchDto.q}%` },
      );
    }

    if (searchDto.kind) {
      queryBuilder.andWhere('job.kind = :kind', { kind: searchDto.kind });
    }

    if (searchDto.locations && searchDto.locations.length > 0) {
      queryBuilder.andWhere('job.locations && :locations', {
        locations: searchDto.locations,
      });
    }

    if (searchDto.work_modes && searchDto.work_modes.length > 0) {
      queryBuilder.andWhere('job.work_modes && :workModes', {
        workModes: searchDto.work_modes,
      });
    }

    if (searchDto.skills && searchDto.skills.length > 0) {
      queryBuilder.andWhere('job.skills && :skills', {
        skills: searchDto.skills,
      });
    }

    if (searchDto.experience_level) {
      queryBuilder.andWhere('job.experience_level = :experienceLevel', {
        experienceLevel: searchDto.experience_level,
      });
    }

    if (searchDto.company_id) {
      queryBuilder.andWhere('job.company_id = :companyId', {
        companyId: searchDto.company_id,
      });
    }

    // Compensation filters
    if (searchDto.min_stipend) {
      queryBuilder.andWhere('job.max_stipend >= :minStipend', {
        minStipend: searchDto.min_stipend,
      });
    }

    if (searchDto.max_stipend) {
      queryBuilder.andWhere('job.min_stipend <= :maxStipend', {
        maxStipend: searchDto.max_stipend,
      });
    }

    if (searchDto.min_salary) {
      queryBuilder.andWhere('job.max_salary >= :minSalary', {
        minSalary: searchDto.min_salary,
      });
    }

    if (searchDto.max_salary) {
      queryBuilder.andWhere('job.min_salary <= :maxSalary', {
        maxSalary: searchDto.max_salary,
      });
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Job>,
    searchDto: JobSearchDto,
  ): void {
    const { sort_by, sort_order } = searchDto;

    switch (sort_by) {
      case 'title':
        queryBuilder.orderBy(
          'job.title',
          sort_order.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'application_count':
        queryBuilder.orderBy(
          'job.application_count',
          sort_order.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      case 'updated_at':
        queryBuilder.orderBy(
          'job.updated_at',
          sort_order.toUpperCase() as 'ASC' | 'DESC',
        );
        break;
      default:
        queryBuilder.orderBy(
          'job.created_at',
          sort_order.toUpperCase() as 'ASC' | 'DESC',
        );
    }
  }

  private formatJobResponse(
    job: Job,
    company?: Company | null,
  ): JobResponseDto {
    return {
      id: job.id,
      title: job.title,
      kind: job.kind,
      description: job.description,
      requirements: job.requirements,
      responsibilities: job.responsibilities,

      company: company
        ? {
            id: company.id,
            name: company.name,
            logo_url: company.logo_url,
            domain: company.domain,
          }
        : null,

      min_stipend: job.min_stipend,
      max_stipend: job.max_stipend,
      min_salary: job.min_salary,
      max_salary: job.max_salary,

      locations: job.locations,
      work_modes: job.work_modes,
      skills: job.skills,
      benefits: job.benefits,
      experience_level: job.experience_level,
      duration_months: job.duration_months,

      application_deadline: job.application_deadline?.toISOString() || null,
      application_count: job.application_count,
      is_active: job.is_active,
      is_featured: job.is_featured,
      created_at: job.created_at.toISOString(),
      updated_at: job.updated_at.toISOString(),
    };
  }

  private async clearSearchCache(): Promise<void> {
    // This is a simple cache invalidation strategy
    // In production, you might want to use cache tags or a more sophisticated approach
    try {
      // Try to get keys if available, otherwise skip
      const store = (this.cacheManager as any).store;
      if (store && store.keys) {
        const keys = await store.keys('jobs:search:*');
        for (const key of keys) {
          await this.cacheManager.del(key);
        }
      }
    } catch (error) {
      // If keys operation fails, just continue
      console.warn('Could not clear search cache:', error.message);
    }
  }
}
