import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
  ValidationPipe,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { SkillsService } from './skills.service';
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
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  // Skill Catalog Management Endpoints
  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new skill (Admin only)',
    description: 'Creates a new skill in the skills catalog',
  })
  @ApiBody({
    type: CreateSkillDto,
    description: 'Skill creation data',
    examples: {
      'Programming Skill': {
        summary: 'Create a programming skill',
        value: {
          name: 'JavaScript',
          slug: 'javascript',
          category: 'programming',
          description: 'A high-level programming language for web development',
          icon_url: 'https://cdn.example.com/icons/javascript.svg',
          aliases: ['JS', 'ECMAScript'],
          metadata: {
            difficulty_level: 'intermediate',
            learning_resources: [
              'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
            ],
            related_skills: ['TypeScript', 'React', 'Node.js'],
          },
        },
      },
      'Framework Skill': {
        summary: 'Create a framework skill',
        value: {
          name: 'React',
          category: 'framework',
          description: 'A JavaScript library for building user interfaces',
          aliases: ['React.js', 'ReactJS'],
          metadata: {
            type: 'frontend',
            created_by: 'Facebook',
            first_release: '2013',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Skill created successfully',
    type: SkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Skill with this name already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async create(
    @Body(ValidationPipe) createSkillDto: CreateSkillDto,
  ): Promise<SkillResponseDto> {
    return this.skillsService.createSkill(createSkillDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get skills catalog',
    description:
      'Retrieves skills from the catalog with filtering and search capabilities',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of skills per page',
    example: 20,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for skill name or aliases',
    example: 'JavaScript',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: [
      'programming',
      'framework',
      'database',
      'cloud',
      'tool',
      'soft_skill',
      'domain',
      'other',
    ],
    description: 'Filter by skill category',
    example: 'programming',
  })
  @ApiQuery({
    name: 'is_active',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
    example: true,
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    enum: ['name', 'category', 'usage_count', 'created_at'],
    description: 'Sort by field',
    example: 'name',
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    enum: ['ASC', 'DESC'],
    description: 'Sort order',
    example: 'ASC',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skills retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { $ref: '#/components/schemas/SkillResponseDto' },
        },
        total: { type: 'number', example: 1250 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        total_pages: { type: 'number', example: 63 },
      },
    },
  })
  @ApiProduces('application/json')
  async findAll(@Query() searchDto: SkillSearchDto) {
    return this.skillsService.getSkills(searchDto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Get skills statistics',
    description: 'Retrieves comprehensive statistics about the skills catalog',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skills statistics retrieved successfully',
    type: SkillStatsDto,
  })
  @ApiProduces('application/json')
  async getStats(): Promise<SkillStatsDto> {
    return this.skillsService.getSkillStats();
  }

  @Get('suggest')
  @ApiOperation({
    summary: 'Get skill suggestions',
    description: 'Get skill suggestions based on search query',
  })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'Search query for skill suggestions',
    example: 'Java',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of suggestions',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skill suggestions retrieved successfully',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/SkillResponseDto' },
    },
  })
  @ApiProduces('application/json')
  async suggest(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<SkillResponseDto[]> {
    return this.skillsService.suggestSkills(query, limit);
  }

  @Get('popular')
  @ApiOperation({
    summary: 'Get popular skills',
    description: 'Retrieves the most popular skills based on usage count',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of skills to return',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Popular skills retrieved successfully',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/SkillResponseDto' },
    },
  })
  @ApiProduces('application/json')
  async getPopular(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<SkillResponseDto[]> {
    return this.skillsService.getPopularSkills(limit);
  }

  @Get('by-category/:category')
  @ApiOperation({
    summary: 'Get skills by category',
    description: 'Retrieves skills filtered by specific category',
  })
  @ApiParam({
    name: 'category',
    enum: [
      'programming',
      'framework',
      'database',
      'cloud',
      'tool',
      'soft_skill',
      'domain',
      'other',
    ],
    description: 'Skill category',
    example: 'programming',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of skills to return',
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skills by category retrieved successfully',
    schema: {
      type: 'array',
      items: { $ref: '#/components/schemas/SkillResponseDto' },
    },
  })
  @ApiProduces('application/json')
  async getByCategory(
    @Param('category') category: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<SkillResponseDto[]> {
    return this.skillsService.getSkillsByCategory(category as any, limit);
  }

  @Get('slug/:slug')
  @ApiOperation({
    summary: 'Get skill by slug',
    description: 'Retrieves a specific skill by its URL-friendly slug',
  })
  @ApiParam({
    name: 'slug',
    type: String,
    description: 'Skill slug',
    example: 'javascript',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skill found and retrieved successfully',
    type: SkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found',
  })
  @ApiProduces('application/json')
  async findBySlug(@Param('slug') slug: string): Promise<SkillResponseDto> {
    return this.skillsService.getSkillBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get skill by ID',
    description: 'Retrieves a specific skill by its UUID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skill found and retrieved successfully',
    type: SkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found',
  })
  @ApiProduces('application/json')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SkillResponseDto> {
    return this.skillsService.getSkillById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update skill (Admin only)',
    description: 'Updates an existing skill in the catalog',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateSkillDto,
    description: 'Skill update data',
    examples: {
      'Update Description': {
        summary: 'Update skill description',
        value: {
          description: 'Updated description with more details about the skill',
          metadata: {
            last_updated: '2024-01-15',
            updated_by: 'admin',
          },
        },
      },
      'Deactivate Skill': {
        summary: 'Deactivate a skill',
        value: {
          is_active: false,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skill updated successfully',
    type: SkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Skill name or slug conflict',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateSkillDto: UpdateSkillDto,
  ): Promise<SkillResponseDto> {
    return this.skillsService.updateSkill(id, updateSkillDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete skill (Admin only)',
    description: 'Deletes a skill from the catalog (only if not in use)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skill deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Skill deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete skill that is in use',
  })
  @ApiProduces('application/json')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.skillsService.deleteSkill(id);
    return {
      success: true,
      message: 'Skill deleted successfully',
    };
  }

  // Student Skills Management Endpoints
  @Post('my-skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add skill to profile',
    description: "Adds a skill to the current user's profile",
  })
  @ApiBody({
    type: CreateStudentSkillDto,
    description: 'Student skill data',
    examples: {
      'Programming Skill': {
        summary: 'Add programming skill',
        value: {
          skill_id: '550e8400-e29b-41d4-a716-446655440000',
          proficiency_level: 'intermediate',
          source: 'manual',
          years_of_experience: 2,
          notes: 'Used in multiple web development projects',
        },
      },
      'Assessed Skill': {
        summary: 'Add skill with assessment',
        value: {
          skill_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          proficiency_level: 'advanced',
          source: 'assessment',
          assessment_score: 92,
          years_of_experience: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Skill added to profile successfully',
    type: StudentSkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already has this skill',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async addStudentSkill(
    @Body(ValidationPipe) createStudentSkillDto: CreateStudentSkillDto,
    @Req() request: Request,
  ): Promise<StudentSkillResponseDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.skillsService.addStudentSkill(userId, createStudentSkillDto);
  }

  @Post('my-skills/bulk')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add multiple skills to profile',
    description: "Adds multiple skills to the current user's profile in bulk",
  })
  @ApiBody({
    type: BulkSkillsDto,
    description: 'Bulk skills data',
    examples: {
      'Multiple Skills': {
        summary: 'Add multiple skills',
        value: {
          skills: [
            {
              skill_id: '550e8400-e29b-41d4-a716-446655440000',
              proficiency_level: 'intermediate',
              source: 'manual',
              years_of_experience: 2,
            },
            {
              skill_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
              proficiency_level: 'advanced',
              source: 'project',
              years_of_experience: 3,
            },
            {
              skill_id: '12345678-1234-1234-1234-123456789abc',
              proficiency_level: 'beginner',
              source: 'manual',
              years_of_experience: 1,
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Bulk skills operation completed',
    schema: {
      type: 'object',
      properties: {
        success_count: { type: 'number', example: 2 },
        failed_count: { type: 'number', example: 1 },
        skills: {
          type: 'array',
          items: { $ref: '#/components/schemas/StudentSkillResponseDto' },
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              skill_id: { type: 'string' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async addBulkStudentSkills(
    @Body(ValidationPipe) bulkSkillsDto: BulkSkillsDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.skillsService.addBulkStudentSkills(userId, bulkSkillsDto);
  }

  @Get('my-skills')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user skills',
    description: 'Retrieves skills for the current user with filtering options',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of skills per page',
    example: 20,
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: [
      'programming',
      'framework',
      'database',
      'cloud',
      'tool',
      'soft_skill',
      'domain',
      'other',
    ],
    description: 'Filter by skill category',
    example: 'programming',
  })
  @ApiQuery({
    name: 'proficiency_level',
    required: false,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    description: 'Filter by proficiency level',
    example: 'intermediate',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: ['manual', 'ai_extract', 'assessment', 'project', 'endorsed'],
    description: 'Filter by skill source',
    example: 'manual',
  })
  @ApiQuery({
    name: 'is_verified',
    required: false,
    type: Boolean,
    description: 'Filter by verified status',
    example: true,
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by skill name',
    example: 'React',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User skills retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { $ref: '#/components/schemas/StudentSkillResponseDto' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 20 },
        total_pages: { type: 'number', example: 2 },
      },
    },
  })
  @ApiProduces('application/json')
  async getUserSkills(
    @Query() searchDto: StudentSkillSearchDto,
    @Req() request: Request,
  ) {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.skillsService.getStudentSkills(userId, searchDto);
  }

  @Get('my-skills/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user skills statistics',
    description:
      "Retrieves comprehensive statistics about the current user's skills",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User skills statistics retrieved successfully',
    type: StudentSkillStatsDto,
  })
  @ApiProduces('application/json')
  async getUserSkillStats(
    @Req() request: Request,
  ): Promise<StudentSkillStatsDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.skillsService.getStudentSkillStats(userId);
  }

  @Get('my-skills/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get specific user skill',
    description: "Retrieves a specific skill from the current user's profile",
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Student skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User skill retrieved successfully',
    type: StudentSkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found in user profile',
  })
  @ApiProduces('application/json')
  async getUserSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ): Promise<StudentSkillResponseDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.skillsService.getStudentSkillById(userId, id);
  }

  @Patch('my-skills/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update user skill',
    description: "Updates a skill in the current user's profile",
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Student skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({
    type: UpdateStudentSkillDto,
    description: 'Student skill update data',
    examples: {
      'Update Proficiency': {
        summary: 'Update skill proficiency',
        value: {
          proficiency_level: 'advanced',
          years_of_experience: 4,
          notes:
            'Recently completed advanced course and worked on enterprise project',
        },
      },
      'Add Assessment Score': {
        summary: 'Add assessment score',
        value: {
          assessment_score: 88,
          source: 'assessment',
          is_verified: true,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User skill updated successfully',
    type: StudentSkillResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found in user profile',
  })
  @ApiConsumes('application/json')
  @ApiProduces('application/json')
  async updateUserSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) updateStudentSkillDto: UpdateStudentSkillDto,
    @Req() request: Request,
  ): Promise<StudentSkillResponseDto> {
    const userId = request.user?.['sub'] || request.user?.['id'];
    return this.skillsService.updateStudentSkill(
      userId,
      id,
      updateStudentSkillDto,
    );
  }

  @Delete('my-skills/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove skill from profile',
    description: "Removes a skill from the current user's profile",
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Student skill UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Skill removed from profile successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: {
          type: 'string',
          example: 'Skill removed from profile successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Skill not found in user profile',
  })
  @ApiProduces('application/json')
  async removeUserSkill(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() request: Request,
  ) {
    const userId = request.user?.['sub'] || request.user?.['id'];
    await this.skillsService.removeStudentSkill(userId, id);
    return {
      success: true,
      message: 'Skill removed from profile successfully',
    };
  }
}
