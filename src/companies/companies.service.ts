import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder, Like, In } from 'typeorm';
import { Company } from '../entities/company.entity';
import { Job } from '../entities/job.entity';
import { Application } from '../entities/application.entity';
import {
  CreateCompanyDto,
  UpdateCompanyDto,
  CompanySearchDto,
  CompanyResponseDto,
  CompanyListResponseDto,
  CompanyStatsDto,
} from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Job)
    private jobRepository: Repository<Job>,
    @InjectRepository(Application)
    private applicationRepository: Repository<Application>,
  ) {}

  async createCompany(createCompanyDto: CreateCompanyDto, recruiterId?: string): Promise<CompanyResponseDto> {
    // Check if company with same name or domain already exists
    const existingCompany = await this.companyRepository.findOne({
      where: [
        { name: createCompanyDto.name },
        ...(createCompanyDto.domain ? [{ domain: createCompanyDto.domain }] : []),
      ],
    });

    if (existingCompany) {
      if (existingCompany.name === createCompanyDto.name) {
        throw new ConflictException('Company with this name already exists');
      }
      if (existingCompany.domain === createCompanyDto.domain) {
        throw new ConflictException('Company with this domain already exists');
      }
    }

    // Create company
    const company = this.companyRepository.create({
      ...createCompanyDto,
      is_verified: false, // New companies start unverified
    });

    const savedCompany = await this.companyRepository.save(company);
    return this.formatCompanyResponse(savedCompany);
  }

  async updateCompany(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    userId: string,
    userRole: string,
  ): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if updating domain and it conflicts with another company
    if (updateCompanyDto.domain && updateCompanyDto.domain !== company.domain) {
      const existingCompany = await this.companyRepository.findOne({
        where: { domain: updateCompanyDto.domain },
      });

      if (existingCompany && existingCompany.id !== id) {
        throw new ConflictException('Company with this domain already exists');
      }
    }

    // Only admins can verify companies
    if (updateCompanyDto.is_verified !== undefined && userRole !== 'admin') {
      throw new ForbiddenException('Only admins can change verification status');
    }

    // Update company
    await this.companyRepository.update(id, updateCompanyDto);

    const updatedCompany = await this.companyRepository.findOne({ where: { id } });
    return this.formatCompanyResponse(updatedCompany!);
  }

  async getCompanyById(id: string, includeStats: boolean = false): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return this.formatCompanyResponse(company, includeStats);
  }

  async getCompanyByDomain(domain: string): Promise<CompanyResponseDto | null> {
    const company = await this.companyRepository.findOne({ where: { domain } });
    return company ? this.formatCompanyResponse(company) : null;
  }

  async searchCompanies(searchDto: CompanySearchDto): Promise<CompanyListResponseDto> {
    const queryBuilder = this.companyRepository.createQueryBuilder('company');

    this.applySearchFilters(queryBuilder, searchDto);
    this.applySorting(queryBuilder, searchDto);

    const total = await queryBuilder.getCount();
    const offset = (searchDto.page - 1) * searchDto.limit;
    queryBuilder.skip(offset).take(searchDto.limit);

    const companies = await queryBuilder.getMany();

    const companiesWithFormatting = await Promise.all(
      companies.map(company => this.formatCompanyResponse(company))
    );

    return {
      companies: companiesWithFormatting,
      total,
      page: searchDto.page,
      limit: searchDto.limit,
      total_pages: Math.ceil(total / searchDto.limit),
    };
  }

  async getVerifiedCompanies(searchDto: CompanySearchDto): Promise<CompanyListResponseDto> {
    const modifiedSearch = { ...searchDto, is_verified: true };
    return this.searchCompanies(modifiedSearch);
  }

  async getPendingVerification(): Promise<CompanyListResponseDto> {
    const searchDto: CompanySearchDto = {
      is_verified: false,
      page: 1,
      limit: 100,
      sort_by: 'created_at',
      sort_order: 'desc',
    };
    return this.searchCompanies(searchDto);
  }

  async getCompanyStats(): Promise<CompanyStatsDto> {
    const totalCompanies = await this.companyRepository.count();
    const verifiedCompanies = await this.companyRepository.count({ where: { is_verified: true } });
    const pendingVerification = totalCompanies - verifiedCompanies;

    // Get top industries
    const industryStats = await this.companyRepository
      .createQueryBuilder('company')
      .select('company.industry', 'industry')
      .addSelect('COUNT(*)', 'count')
      .where('company.industry IS NOT NULL')
      .groupBy('company.industry')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    const topIndustries = industryStats.map(stat => ({
      industry: stat.industry,
      count: parseInt(stat.count),
    }));

    // Get company size distribution
    const sizeStats = await this.companyRepository
      .createQueryBuilder('company')
      .select('company.company_size', 'size')
      .addSelect('COUNT(*)', 'count')
      .where('company.company_size IS NOT NULL')
      .groupBy('company.company_size')
      .getRawMany();

    const byCompanySize = sizeStats.reduce((acc, stat) => {
      acc[stat.size] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total_companies: totalCompanies,
      verified_companies: verifiedCompanies,
      pending_verification: pendingVerification,
      top_industries: topIndustries,
      by_company_size: byCompanySize,
    };
  }

  async verifyCompany(id: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    await this.companyRepository.update(id, {
      is_verified: true,
    });

    const updatedCompany = await this.companyRepository.findOne({ where: { id } });
    return this.formatCompanyResponse(updatedCompany!);
  }

  async rejectCompany(id: string, reason?: string): Promise<void> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // For now, we just mark as unverified. In future, could add rejection reason field
    await this.companyRepository.update(id, {
      is_verified: false,
    });
  }

  async deleteCompany(id: string): Promise<void> {
    const company = await this.companyRepository.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check if company has active jobs
    const activeJobs = await this.jobRepository.count({
      where: { company_id: id, is_active: true },
    });

    if (activeJobs > 0) {
      throw new BadRequestException('Cannot delete company with active job postings');
    }

    await this.companyRepository.delete(id);
  }

  private applySearchFilters(queryBuilder: SelectQueryBuilder<Company>, searchDto: CompanySearchDto): void {
    if (searchDto.search) {
      queryBuilder.andWhere(
        '(LOWER(company.name) LIKE LOWER(:search) OR LOWER(company.description) LIKE LOWER(:search))',
        { search: `%${searchDto.search}%` }
      );
    }

    if (searchDto.industry) {
      queryBuilder.andWhere('company.industry = :industry', { industry: searchDto.industry });
    }

    if (searchDto.company_size) {
      queryBuilder.andWhere('company.company_size = :companySize', { companySize: searchDto.company_size });
    }

    if (searchDto.is_verified !== undefined) {
      queryBuilder.andWhere('company.is_verified = :isVerified', { isVerified: searchDto.is_verified });
    }
  }

  private applySorting(queryBuilder: SelectQueryBuilder<Company>, searchDto: CompanySearchDto): void {
    const { sort_by, sort_order } = searchDto;
    
    switch (sort_by) {
      case 'created_at':
        queryBuilder.orderBy('company.created_at', sort_order.toUpperCase() as 'ASC' | 'DESC');
        break;
      case 'updated_at':
        queryBuilder.orderBy('company.updated_at', sort_order.toUpperCase() as 'ASC' | 'DESC');
        break;
      default:
        queryBuilder.orderBy('company.name', sort_order.toUpperCase() as 'ASC' | 'DESC');
    }
  }

  private async formatCompanyResponse(company: Company, includeStats: boolean = false): Promise<CompanyResponseDto> {
    const response: any = {
      id: company.id,
      name: company.name,
      website: company.website,
      domain: company.domain,
      description: company.description,
      logo_url: company.logo_url,
      industry: company.industry,
      company_size: company.company_size,
      headquarters: company.headquarters,
      is_verified: company.is_verified,
      created_at: company.created_at.toISOString(),
      updated_at: company.created_at.toISOString(), // Use created_at as fallback since no updated_at
    };

    if (includeStats) {
      // Get job and application statistics
      const totalJobs = await this.jobRepository.count({ where: { company_id: company.id } });
      const activeJobs = await this.jobRepository.count({ where: { company_id: company.id, is_active: true } });
      
      // Get total applications for this company's jobs
      const jobIds = await this.jobRepository.find({
        where: { company_id: company.id },
        select: ['id'],
      });

      let totalApplications = 0;
      if (jobIds.length > 0) {
        totalApplications = await this.applicationRepository.count({
          where: { job_id: In(jobIds.map(job => job.id)) },
        });
      }

      response.total_jobs = totalJobs;
      response.active_jobs = activeJobs;
      response.total_applications = totalApplications;
    }

    return response;
  }
}
