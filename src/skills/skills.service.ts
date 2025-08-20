import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike, In, SelectQueryBuilder } from 'typeorm';
import { Skill, SkillCategory } from '../entities/skill.entity';
import {
  StudentSkill,
  ProficiencyLevel,
  SkillSource,
} from '../entities/student-skill.entity';
import { User } from '../entities/user.entity';
import {
  CreateSkillDto,
  UpdateSkillDto,
  SkillSearchDto,
  SkillResponseDto,
  CreateStudentSkillDto,
  UpdateStudentSkillDto,
  StudentSkillSearchDto,
  StudentSkillResponseDto,
  BulkSkillsDto,
  SkillStatsDto,
  StudentSkillStatsDto,
} from './dto/skill.dto';

@Injectable()
export class SkillsService {
  constructor(
    @InjectRepository(Skill)
    private skillRepository: Repository<Skill>,
    @InjectRepository(StudentSkill)
    private studentSkillRepository: Repository<StudentSkill>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Skill Management Methods
  async createSkill(createSkillDto: CreateSkillDto): Promise<SkillResponseDto> {
    // Check if skill with same name already exists
    const existingSkill = await this.skillRepository.findOne({
      where: { name: ILike(createSkillDto.name) },
    });

    if (existingSkill) {
      throw new ConflictException('Skill with this name already exists');
    }

    // Generate slug if not provided
    const slug = createSkillDto.slug || this.generateSlug(createSkillDto.name);

    // Check if slug is unique
    const existingSlug = await this.skillRepository.findOne({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictException('Skill with this slug already exists');
    }

    const skill = this.skillRepository.create({
      ...createSkillDto,
      slug,
      aliases: createSkillDto.aliases || [],
    });

    const savedSkill = await this.skillRepository.save(skill);
    return this.transformSkillToResponse(savedSkill);
  }

  async getSkills(searchDto: SkillSearchDto): Promise<{
    skills: SkillResponseDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      category,
      is_active,
      sort_by = 'name',
      sort_order = 'ASC',
    } = searchDto;

    const queryBuilder = this.skillRepository.createQueryBuilder('skill');

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(skill.name ILIKE :search OR :search = ANY(skill.aliases))',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('skill.category = :category', { category });
    }

    if (is_active !== undefined) {
      queryBuilder.andWhere('skill.is_active = :is_active', { is_active });
    }

    // Apply sorting
    queryBuilder.orderBy(`skill.${sort_by}`, sort_order);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [skills, total] = await queryBuilder.getManyAndCount();

    return {
      skills: skills.map((skill) => this.transformSkillToResponse(skill)),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getSkillById(id: string): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.transformSkillToResponse(skill);
  }

  async getSkillBySlug(slug: string): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: { slug },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    return this.transformSkillToResponse(skill);
  }

  async updateSkill(
    id: string,
    updateSkillDto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    const skill = await this.skillRepository.findOne({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Check for name conflicts if name is being updated
    if (updateSkillDto.name && updateSkillDto.name !== skill.name) {
      const existingSkill = await this.skillRepository.findOne({
        where: { name: ILike(updateSkillDto.name) },
      });

      if (existingSkill) {
        throw new ConflictException('Skill with this name already exists');
      }
    }

    // Check for slug conflicts if slug is being updated
    if (updateSkillDto.slug && updateSkillDto.slug !== skill.slug) {
      const existingSlug = await this.skillRepository.findOne({
        where: { slug: updateSkillDto.slug },
      });

      if (existingSlug) {
        throw new ConflictException('Skill with this slug already exists');
      }
    }

    // Update the skill
    Object.assign(skill, updateSkillDto);

    // Generate new slug if name changed but slug wasn't provided
    if (updateSkillDto.name && !updateSkillDto.slug) {
      skill.slug = this.generateSlug(updateSkillDto.name);
    }

    const updatedSkill = await this.skillRepository.save(skill);
    return this.transformSkillToResponse(updatedSkill);
  }

  async deleteSkill(id: string): Promise<void> {
    const skill = await this.skillRepository.findOne({
      where: { id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Check if skill is being used by students
    const usageCount = await this.studentSkillRepository.count({
      where: { skill_id: id },
    });

    if (usageCount > 0) {
      throw new BadRequestException(
        `Cannot delete skill. It is currently used by ${usageCount} student(s). Consider deactivating instead.`,
      );
    }

    await this.skillRepository.remove(skill);
  }

  async getSkillStats(): Promise<SkillStatsDto> {
    const total_skills = await this.skillRepository.count();
    const active_skills = await this.skillRepository.count({
      where: { is_active: true },
    });

    // Get skills by category
    const categoryStats = await this.skillRepository
      .createQueryBuilder('skill')
      .select('skill.category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('skill.category')
      .getRawMany();

    const by_category = categoryStats.reduce((acc, stat) => {
      acc[stat.skill_category] = parseInt(stat.count);
      return acc;
    }, {});

    // Get most popular skills
    const most_popular = await this.skillRepository
      .createQueryBuilder('skill')
      .select(['skill.name', 'skill.usage_count'])
      .orderBy('skill.usage_count', 'DESC')
      .limit(10)
      .getMany();

    // Get recently added skills
    const recently_added = await this.skillRepository
      .createQueryBuilder('skill')
      .select(['skill.name', 'skill.created_at'])
      .orderBy('skill.created_at', 'DESC')
      .limit(10)
      .getMany();

    return {
      total_skills,
      active_skills,
      by_category,
      most_popular: most_popular.map((skill) => ({
        skill_name: skill.name,
        usage_count: skill.usage_count,
      })),
      recently_added: recently_added.map((skill) => ({
        skill_name: skill.name,
        created_at: skill.created_at,
      })),
    };
  }

  // Student Skills Methods
  async addStudentSkill(
    userId: string,
    createStudentSkillDto: CreateStudentSkillDto,
  ): Promise<StudentSkillResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify skill exists
    const skill = await this.skillRepository.findOne({
      where: { id: createStudentSkillDto.skill_id },
    });

    if (!skill) {
      throw new NotFoundException('Skill not found');
    }

    // Check if user already has this skill
    const existingSkill = await this.studentSkillRepository.findOne({
      where: {
        user_id: userId,
        skill_id: createStudentSkillDto.skill_id,
      },
    });

    if (existingSkill) {
      throw new ConflictException(
        'User already has this skill. Use update instead.',
      );
    }

    const studentSkill = this.studentSkillRepository.create({
      user_id: userId,
      ...createStudentSkillDto,
    });

    const savedStudentSkill =
      await this.studentSkillRepository.save(studentSkill);

    // Update skill usage count
    await this.skillRepository.update(skill.id, {
      usage_count: skill.usage_count + 1,
    });

    return this.transformStudentSkillToResponse(savedStudentSkill, skill);
  }

  async addBulkStudentSkills(
    userId: string,
    bulkSkillsDto: BulkSkillsDto,
  ): Promise<{
    success_count: number;
    failed_count: number;
    skills: StudentSkillResponseDto[];
    errors: Array<{ skill_id: string; error: string }>;
  }> {
    const results = {
      success_count: 0,
      failed_count: 0,
      skills: [] as StudentSkillResponseDto[],
      errors: [] as Array<{ skill_id: string; error: string }>,
    };

    for (const skillDto of bulkSkillsDto.skills) {
      try {
        const studentSkill = await this.addStudentSkill(userId, skillDto);
        results.skills.push(studentSkill);
        results.success_count++;
      } catch (error) {
        results.failed_count++;
        results.errors.push({
          skill_id: skillDto.skill_id,
          error: error.message,
        });
      }
    }

    return results;
  }

  async getStudentSkills(
    userId: string,
    searchDto: StudentSkillSearchDto,
  ): Promise<{
    skills: StudentSkillResponseDto[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      category,
      proficiency_level,
      source,
      is_verified,
      search,
    } = searchDto;

    const queryBuilder = this.studentSkillRepository
      .createQueryBuilder('studentSkill')
      .leftJoinAndSelect('studentSkill.skill', 'skill')
      .where('studentSkill.user_id = :userId', { userId });

    // Apply filters
    if (category) {
      queryBuilder.andWhere('skill.category = :category', { category });
    }

    if (proficiency_level) {
      queryBuilder.andWhere(
        'studentSkill.proficiency_level = :proficiency_level',
        {
          proficiency_level,
        },
      );
    }

    if (source) {
      queryBuilder.andWhere('studentSkill.source = :source', { source });
    }

    if (is_verified !== undefined) {
      queryBuilder.andWhere('studentSkill.is_verified = :is_verified', {
        is_verified,
      });
    }

    if (search) {
      queryBuilder.andWhere('skill.name ILIKE :search', {
        search: `%${search}%`,
      });
    }

    // Apply sorting
    queryBuilder.orderBy('skill.name', 'ASC');

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [studentSkills, total] = await queryBuilder.getManyAndCount();

    return {
      skills: studentSkills.map((ss) =>
        this.transformStudentSkillToResponse(ss, ss.skill),
      ),
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getStudentSkillById(
    userId: string,
    studentSkillId: string,
  ): Promise<StudentSkillResponseDto> {
    const studentSkill = await this.studentSkillRepository.findOne({
      where: {
        id: studentSkillId,
        user_id: userId,
      },
      relations: ['skill'],
    });

    if (!studentSkill) {
      throw new NotFoundException('Student skill not found');
    }

    return this.transformStudentSkillToResponse(
      studentSkill,
      studentSkill.skill,
    );
  }

  async updateStudentSkill(
    userId: string,
    studentSkillId: string,
    updateStudentSkillDto: UpdateStudentSkillDto,
  ): Promise<StudentSkillResponseDto> {
    const studentSkill = await this.studentSkillRepository.findOne({
      where: {
        id: studentSkillId,
        user_id: userId,
      },
      relations: ['skill'],
    });

    if (!studentSkill) {
      throw new NotFoundException('Student skill not found');
    }

    Object.assign(studentSkill, updateStudentSkillDto);
    const updatedStudentSkill =
      await this.studentSkillRepository.save(studentSkill);

    return this.transformStudentSkillToResponse(
      updatedStudentSkill,
      studentSkill.skill,
    );
  }

  async removeStudentSkill(
    userId: string,
    studentSkillId: string,
  ): Promise<void> {
    const studentSkill = await this.studentSkillRepository.findOne({
      where: {
        id: studentSkillId,
        user_id: userId,
      },
      relations: ['skill'],
    });

    if (!studentSkill) {
      throw new NotFoundException('Student skill not found');
    }

    // Update skill usage count
    if (studentSkill.skill) {
      await this.skillRepository.update(studentSkill.skill.id, {
        usage_count: Math.max(0, studentSkill.skill.usage_count - 1),
      });
    }

    await this.studentSkillRepository.remove(studentSkill);
  }

  async getStudentSkillStats(userId: string): Promise<StudentSkillStatsDto> {
    const studentSkills = await this.studentSkillRepository.find({
      where: { user_id: userId },
      relations: ['skill'],
    });

    const total_skills = studentSkills.length;
    const verified_skills = studentSkills.filter((ss) => ss.is_verified).length;

    // Group by proficiency level
    const by_proficiency = studentSkills.reduce(
      (acc, ss) => {
        acc[ss.proficiency_level] = (acc[ss.proficiency_level] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by category
    const by_category = studentSkills.reduce(
      (acc, ss) => {
        if (ss.skill) {
          acc[ss.skill.category] = (acc[ss.skill.category] || 0) + 1;
        }
        return acc;
      },
      {} as Record<string, number>,
    );

    // Group by source
    const by_source = studentSkills.reduce(
      (acc, ss) => {
        acc[ss.source] = (acc[ss.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Calculate average experience years
    const skillsWithExperience = studentSkills.filter(
      (ss) => ss.years_of_experience != null,
    );
    const avg_experience_years =
      skillsWithExperience.length > 0
        ? skillsWithExperience.reduce(
            (sum, ss) => sum + (ss.years_of_experience || 0),
            0,
          ) / skillsWithExperience.length
        : 0;

    // Calculate assessment statistics
    const skillsWithAssessment = studentSkills.filter(
      (ss) => ss.assessment_score != null,
    );
    const assessed_skills_count = skillsWithAssessment.length;
    const avg_assessment_score =
      skillsWithAssessment.length > 0
        ? skillsWithAssessment.reduce(
            (sum, ss) => sum + (ss.assessment_score || 0),
            0,
          ) / skillsWithAssessment.length
        : 0;

    return {
      total_skills,
      verified_skills,
      by_proficiency,
      by_category,
      by_source,
      avg_experience_years: Math.round(avg_experience_years * 10) / 10,
      assessed_skills_count,
      avg_assessment_score: Math.round(avg_assessment_score * 10) / 10,
    };
  }

  // Skill suggestion methods
  async suggestSkills(
    query: string,
    limit: number = 10,
  ): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository
      .createQueryBuilder('skill')
      .where('skill.is_active = true')
      .andWhere('(skill.name ILIKE :query OR :query = ANY(skill.aliases))', {
        query: `%${query}%`,
      })
      .orderBy('skill.usage_count', 'DESC')
      .limit(limit)
      .getMany();

    return skills.map((skill) => this.transformSkillToResponse(skill));
  }

  async getPopularSkills(limit: number = 20): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository.find({
      where: { is_active: true },
      order: { usage_count: 'DESC' },
      take: limit,
    });

    return skills.map((skill) => this.transformSkillToResponse(skill));
  }

  async getSkillsByCategory(
    category: SkillCategory,
    limit: number = 50,
  ): Promise<SkillResponseDto[]> {
    const skills = await this.skillRepository.find({
      where: {
        category,
        is_active: true,
      },
      order: { name: 'ASC' },
      take: limit,
    });

    return skills.map((skill) => this.transformSkillToResponse(skill));
  }

  // Helper methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private transformSkillToResponse(skill: Skill): SkillResponseDto {
    return {
      id: skill.id,
      name: skill.name,
      slug: skill.slug,
      category: skill.category,
      description: skill.description,
      icon_url: skill.icon_url,
      aliases: skill.aliases,
      is_active: skill.is_active,
      usage_count: skill.usage_count,
      metadata: skill.metadata,
      created_at: skill.created_at,
    };
  }

  private transformStudentSkillToResponse(
    studentSkill: StudentSkill,
    skill: Skill,
  ): StudentSkillResponseDto {
    return {
      id: studentSkill.id,
      user_id: studentSkill.user_id,
      skill: this.transformSkillToResponse(skill),
      proficiency_level: studentSkill.proficiency_level,
      source: studentSkill.source,
      years_of_experience: studentSkill.years_of_experience,
      assessment_score: studentSkill.assessment_score,
      is_verified: studentSkill.is_verified,
      notes: studentSkill.notes,
      created_at: studentSkill.created_at,
    };
  }
}
