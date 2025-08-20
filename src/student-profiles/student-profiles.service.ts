import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from '../entities/student-profile.entity';
import { User } from '../entities/user.entity';
import {
  CreateStudentProfileDto,
  UpdateStudentProfileDto,
  StudentProfileSearchDto,
  AvailabilityStatus,
} from './dto/student-profile.dto';

@Injectable()
export class StudentProfilesService {
  constructor(
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new student profile
   */
  async createProfile(
    userId: string,
    createDto: CreateStudentProfileDto,
  ): Promise<StudentProfile> {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists for this user
    const existingProfile = await this.studentProfileRepository.findOne({
      where: { user_id: userId },
    });

    if (existingProfile) {
      throw new ConflictException('Profile already exists for this user');
    }

    // Map DTO to entity fields
    const profile = new StudentProfile();
    profile.user_id = userId;
    profile.full_name = `${createDto.first_name} ${createDto.last_name}`;
    if (createDto.phone) profile.phone = createDto.phone;
    if (createDto.summary) profile.bio = createDto.summary;
    if (createDto.linkedin_url) profile.linkedin_url = createDto.linkedin_url;
    if (createDto.github_url) profile.github_url = createDto.github_url;
    if (createDto.portfolio_url)
      profile.portfolio_url = createDto.portfolio_url;
    profile.is_open_to_opportunities =
      createDto.availability_status !== AvailabilityStatus.NOT_AVAILABLE;
    profile.preferred_job_types = createDto.desired_job_types || [];
    profile.preferred_locations = createDto.location
      ? [createDto.location]
      : [];
    profile.metadata = {
      headline: createDto.headline,
      skills: createDto.skills || [],
      languages: createDto.languages || [],
      education: createDto.education || [],
      experience: createDto.experience || [],
      projects: createDto.projects || [],
      availability_status:
        createDto.availability_status || AvailabilityStatus.AVAILABLE,
    };

    return await this.studentProfileRepository.save(profile);
  }

  /**
   * Get all student profiles with filtering and pagination
   */
  async findAllProfiles(searchDto: StudentProfileSearchDto): Promise<{
    profiles: StudentProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = searchDto;

    const queryBuilder = this.studentProfileRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .leftJoinAndSelect('profile.college', 'college');

    // Apply basic filters
    if (searchDto.name) {
      queryBuilder.andWhere('LOWER(profile.full_name) LIKE LOWER(:name)', {
        name: `%${searchDto.name}%`,
      });
    }

    if (searchDto.location) {
      queryBuilder.andWhere(
        `profile.preferred_locations::text LIKE :location`,
        { location: `%${searchDto.location}%` },
      );
    }

    if (searchDto.availability_status) {
      if (searchDto.availability_status === AvailabilityStatus.NOT_AVAILABLE) {
        queryBuilder.andWhere('profile.is_open_to_opportunities = false');
      } else {
        queryBuilder.andWhere('profile.is_open_to_opportunities = true');
      }
    }

    // Apply sorting
    const sortColumn =
      sort_by === 'first_name' || sort_by === 'last_name'
        ? `profile.full_name`
        : `profile.${sort_by}`;

    queryBuilder.orderBy(
      sortColumn,
      sort_order.toUpperCase() as 'ASC' | 'DESC',
    );

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [profiles, total] = await queryBuilder.getManyAndCount();

    return {
      profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get student profile by user ID
   */
  async findProfileByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.studentProfileRepository.findOne({
      where: { user_id: userId },
      relations: ['user', 'college'],
    });

    if (!profile) {
      throw new NotFoundException(
        `Student profile not found for user ${userId}`,
      );
    }

    return profile;
  }

  /**
   * Update student profile
   */
  async updateProfile(
    userId: string,
    updateDto: UpdateStudentProfileDto,
  ): Promise<StudentProfile> {
    const profile = await this.findProfileByUserId(userId);

    // Update basic fields
    if (updateDto.first_name || updateDto.last_name) {
      const firstName = updateDto.first_name || profile.full_name.split(' ')[0];
      const lastName =
        updateDto.last_name || profile.full_name.split(' ').slice(1).join(' ');
      profile.full_name = `${firstName} ${lastName}`;
    }

    if (updateDto.phone !== undefined) profile.phone = updateDto.phone;
    if (updateDto.summary !== undefined) profile.bio = updateDto.summary;
    if (updateDto.linkedin_url !== undefined)
      profile.linkedin_url = updateDto.linkedin_url;
    if (updateDto.github_url !== undefined)
      profile.github_url = updateDto.github_url;
    if (updateDto.portfolio_url !== undefined)
      profile.portfolio_url = updateDto.portfolio_url;

    if (updateDto.availability_status !== undefined) {
      profile.is_open_to_opportunities =
        updateDto.availability_status !== AvailabilityStatus.NOT_AVAILABLE;
    }

    if (updateDto.desired_job_types !== undefined) {
      profile.preferred_job_types = updateDto.desired_job_types;
    }

    if (updateDto.location !== undefined) {
      profile.preferred_locations = updateDto.location
        ? [updateDto.location]
        : [];
    }

    // Update metadata
    const metadata = profile.metadata || {};
    if (updateDto.headline !== undefined)
      metadata.headline = updateDto.headline;
    if (updateDto.skills !== undefined) metadata.skills = updateDto.skills;
    if (updateDto.languages !== undefined)
      metadata.languages = updateDto.languages;
    if (updateDto.education !== undefined)
      metadata.education = updateDto.education;
    if (updateDto.experience !== undefined)
      metadata.experience = updateDto.experience;
    if (updateDto.projects !== undefined)
      metadata.projects = updateDto.projects;
    if (updateDto.availability_status !== undefined)
      metadata.availability_status = updateDto.availability_status;

    profile.metadata = metadata;

    return await this.studentProfileRepository.save(profile);
  }

  /**
   * Delete student profile
   */
  async deleteProfile(userId: string): Promise<void> {
    const profile = await this.findProfileByUserId(userId);
    await this.studentProfileRepository.remove(profile);
  }

  /**
   * Get student profiles statistics
   */
  async getProfileStats(): Promise<{
    total_profiles: number;
    by_verification_status: Record<string, number>;
    by_opportunity_availability: { open: number; closed: number };
    recent_profiles: number;
  }> {
    const total_profiles = await this.studentProfileRepository.count();

    // Get verification status distribution
    const verificationStats = await this.studentProfileRepository
      .createQueryBuilder('profile')
      .select('profile.verification_status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('profile.verification_status')
      .getRawMany();

    const by_verification_status = verificationStats.reduce(
      (acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Get opportunity availability stats
    const opportunityStats = await this.studentProfileRepository
      .createQueryBuilder('profile')
      .select('profile.is_open_to_opportunities', 'is_open')
      .addSelect('COUNT(*)', 'count')
      .groupBy('profile.is_open_to_opportunities')
      .getRawMany();

    const by_opportunity_availability = {
      open: parseInt(
        opportunityStats.find((s) => s.is_open === true)?.count || '0',
      ),
      closed: parseInt(
        opportunityStats.find((s) => s.is_open === false)?.count || '0',
      ),
    };

    // Get recent profiles (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent_profiles = await this.studentProfileRepository
      .createQueryBuilder('profile')
      .where('profile.created_at >= :date', { date: thirtyDaysAgo })
      .getCount();

    return {
      total_profiles,
      by_verification_status,
      by_opportunity_availability,
      recent_profiles,
    };
  }
}
