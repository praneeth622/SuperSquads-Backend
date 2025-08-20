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
  Request,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
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
  getSchemaPath,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilesService } from './files.service';
import {
  CreateFileDto,
  UpdateFileDto,
  FileSearchDto,
  FileUploadUrlDto,
  FileResponseDto,
  FileStatsDto,
  FileType,
  FileStatus,
  FileVisibility,
} from './dto/file.dto';

@ApiTags('Files')
@Controller('files')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload-url')
  @ApiOperation({
    summary: 'Generate pre-signed upload URL',
    description: 'Creates a file record and generates a pre-signed URL for direct file upload to cloud storage. The file will be in uploading status until upload is confirmed.',
  })
  @ApiBody({
    type: CreateFileDto,
    description: 'File information for upload preparation',
    examples: {
      resume: {
        summary: 'Resume Upload',
        description: 'Example for uploading a resume PDF',
        value: {
          original_name: 'john_doe_resume.pdf',
          file_type: 'resume',
          mime_type: 'application/pdf',
          file_size: 2048576,
          description: 'Updated resume for software engineering positions',
          tags: ['resume', '2024', 'software-engineer'],
          visibility: 'private',
          entity_type: 'application',
          entity_id: '123e4567-e89b-12d3-a456-426614174000'
        }
      },
      portfolio: {
        summary: 'Portfolio Upload',
        description: 'Example for uploading a portfolio document',
        value: {
          original_name: 'portfolio_showcase.pdf',
          file_type: 'portfolio',
          mime_type: 'application/pdf',
          file_size: 10485760,
          description: 'Design portfolio showcasing recent projects',
          tags: ['portfolio', 'design', 'ui-ux'],
          visibility: 'public'
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Pre-signed upload URL generated successfully',
    type: FileUploadUrlDto,
    example: {
      upload_url: 'https://storage.example.com/upload/2024/01/15/abc123.pdf?token=xyz789',
      file_id: '123e4567-e89b-12d3-a456-426614174000',
      headers: {
        'Content-Type': 'application/pdf',
        'x-upload-token': 'upload_token_123'
      },
      expires_at: '2024-01-15T15:30:00.000Z',
      max_file_size: 104857600
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file data - file too large, unsupported MIME type, or invalid parameters',
    example: {
      statusCode: 400,
      message: 'File size exceeds maximum allowed size of 104857600 bytes',
      error: 'Bad Request'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
    example: {
      statusCode: 404,
      message: 'User not found',
      error: 'Not Found'
    }
  })
  async generateUploadUrl(
    @Request() req: any,
    @Body() createFileDto: CreateFileDto,
  ): Promise<FileUploadUrlDto> {
    return this.filesService.generateUploadUrl(req.user.userId, createFileDto);
  }

  @Post(':fileId/confirm')
  @ApiOperation({
    summary: 'Confirm file upload completion',
    description: 'Confirms that file upload is complete and triggers post-processing like virus scanning and text extraction. Changes file status from uploading to processing.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique identifier of the file to confirm',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'File upload confirmed, processing started',
    type: FileResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      original_name: 'resume.pdf',
      file_type: 'resume',
      mime_type: 'application/pdf',
      file_size: 2048576,
      status: 'processing',
      visibility: 'private',
      description: 'Updated resume for applications',
      tags: ['resume', '2024'],
      scan_status: 'scanning',
      uploaded_by: '456e7890-e89b-12d3-a456-426614174001',
      is_public: false,
      created_at: '2024-01-15T14:30:00.000Z',
      download_url: null,
      preview_url: null
    }
  })
  @ApiResponse({
    status: 400,
    description: 'File not in uploading status or invalid state',
    example: {
      statusCode: 400,
      message: 'File is not in uploading status',
      error: 'Bad Request'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'File not found or access denied',
    example: {
      statusCode: 404,
      message: 'File not found or access denied',
      error: 'Not Found'
    }
  })
  async confirmUpload(
    @Request() req: any,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<any> {
    return this.filesService.confirmUpload(fileId, req.user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get user files with filtering and pagination',
    description: 'Retrieves files belonging to the authenticated user with support for filtering by type, status, name, and other criteria. Includes pagination and sorting options.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (starts from 1)',
    example: 1
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of files per page (max 100)',
    example: 20
  })
  @ApiQuery({
    name: 'filename',
    required: false,
    type: String,
    description: 'Filter by filename (partial match, case-insensitive)',
    example: 'resume'
  })
  @ApiQuery({
    name: 'file_type',
    required: false,
    enum: FileType,
    description: 'Filter by file type',
    example: 'resume'
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: FileStatus,
    description: 'Filter by file status',
    example: 'active'
  })
  @ApiQuery({
    name: 'visibility',
    required: false,
    enum: FileVisibility,
    description: 'Filter by file visibility',
    example: 'private'
  })
  @ApiQuery({
    name: 'mime_type',
    required: false,
    type: String,
    description: 'Filter by MIME type',
    example: 'application/pdf'
  })
  @ApiQuery({
    name: 'min_size',
    required: false,
    type: Number,
    description: 'Minimum file size in bytes',
    example: 1024
  })
  @ApiQuery({
    name: 'max_size',
    required: false,
    type: Number,
    description: 'Maximum file size in bytes',
    example: 10485760
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    type: String,
    description: 'Filter by tags (comma-separated)',
    example: 'resume,2024'
  })
  @ApiQuery({
    name: 'entity_type',
    required: false,
    type: String,
    description: 'Filter by associated entity type',
    example: 'application'
  })
  @ApiQuery({
    name: 'entity_id',
    required: false,
    type: String,
    description: 'Filter by associated entity ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiQuery({
    name: 'created_after',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter files created after this date',
    example: '2024-01-01T00:00:00.000Z'
  })
  @ApiQuery({
    name: 'created_before',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter files created before this date',
    example: '2024-12-31T23:59:59.999Z'
  })
  @ApiQuery({
    name: 'sort_by',
    required: false,
    type: String,
    description: 'Field to sort by',
    enum: ['created_at', 'original_name', 'size_bytes'],
    example: 'created_at'
  })
  @ApiQuery({
    name: 'sort_order',
    required: false,
    type: String,
    description: 'Sort order',
    enum: ['asc', 'desc'],
    example: 'desc'
  })
  @ApiResponse({
    status: 200,
    description: 'Files retrieved successfully',
    example: {
      files: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          original_name: 'resume.pdf',
          file_type: 'resume',
          mime_type: 'application/pdf',
          file_size: 2048576,
          status: 'active',
          visibility: 'private',
          description: 'Updated resume',
          tags: ['resume', '2024'],
          scan_status: 'clean',
          uploaded_by: '456e7890-e89b-12d3-a456-426614174001',
          is_public: false,
          created_at: '2024-01-15T14:30:00.000Z',
          download_url: 'https://storage.example.com/download/file1.pdf?token=abc123',
          preview_url: 'https://storage.example.com/preview/file1.pdf?token=abc123'
        }
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1
    }
  })
  async findUserFiles(
    @Request() req: any,
    @Query() searchDto: FileSearchDto,
  ): Promise<{
    files: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    return this.filesService.findUserFiles(req.user.userId, searchDto);
  }

  @Get(':fileId')
  @ApiOperation({
    summary: 'Get file by ID',
    description: 'Retrieves detailed information about a specific file. User must own the file or it must be publicly accessible.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique identifier of the file',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'File details retrieved successfully',
    type: FileResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      original_name: 'resume.pdf',
      file_type: 'resume',
      mime_type: 'application/pdf',
      file_size: 2048576,
      status: 'active',
      visibility: 'private',
      description: 'Updated resume for software engineering positions',
      tags: ['resume', '2024', 'software-engineer'],
      scan_status: 'clean',
      uploaded_by: '456e7890-e89b-12d3-a456-426614174001',
      is_public: false,
      created_at: '2024-01-15T14:30:00.000Z',
      download_url: 'https://storage.example.com/download/file1.pdf?token=abc123',
      preview_url: 'https://storage.example.com/preview/file1.pdf?token=abc123'
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied to this file',
    example: {
      statusCode: 403,
      message: 'Access denied to this file',
      error: 'Forbidden'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
    example: {
      statusCode: 404,
      message: 'File not found',
      error: 'Not Found'
    }
  })
  async findFileById(
    @Request() req: any,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<any> {
    return this.filesService.findFileById(fileId, req.user.userId);
  }

  @Put(':fileId')
  @ApiOperation({
    summary: 'Update file metadata',
    description: 'Updates file metadata such as name, description, visibility, and tags. File content cannot be modified through this endpoint.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique identifier of the file to update',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiBody({
    type: UpdateFileDto,
    description: 'Updated file metadata',
    examples: {
      'update-visibility': {
        summary: 'Update File Visibility',
        description: 'Make a private file public',
        value: {
          visibility: 'public',
          description: 'Portfolio showcasing recent design work - now public'
        }
      },
      'update-tags': {
        summary: 'Update Tags and Description',
        description: 'Add new tags and update description',
        value: {
          tags: ['resume', '2024', 'senior-developer', 'react'],
          description: 'Updated resume highlighting React expertise'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'File metadata updated successfully',
    type: FileResponseDto,
    example: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      original_name: 'resume.pdf',
      file_type: 'resume',
      mime_type: 'application/pdf',
      file_size: 2048576,
      status: 'active',
      visibility: 'public',
      description: 'Updated resume highlighting React expertise',
      tags: ['resume', '2024', 'senior-developer', 'react'],
      scan_status: 'clean',
      uploaded_by: '456e7890-e89b-12d3-a456-426614174001',
      is_public: true,
      created_at: '2024-01-15T14:30:00.000Z'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'File not found or access denied',
    example: {
      statusCode: 404,
      message: 'File not found or access denied',
      error: 'Not Found'
    }
  })
  async updateFile(
    @Request() req: any,
    @Param('fileId', ParseUUIDPipe) fileId: string,
    @Body() updateFileDto: UpdateFileDto,
  ): Promise<any> {
    return this.filesService.updateFile(fileId, req.user.userId, updateFileDto);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete file',
    description: 'Soft deletes a file by marking it as deleted. The file will be scheduled for permanent removal from storage. This action cannot be undone.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique identifier of the file to delete',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 204,
    description: 'File deleted successfully (no content returned)'
  })
  @ApiResponse({
    status: 404,
    description: 'File not found or access denied',
    example: {
      statusCode: 404,
      message: 'File not found or access denied',
      error: 'Not Found'
    }
  })
  async deleteFile(
    @Request() req: any,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<void> {
    return this.filesService.deleteFile(fileId, req.user.userId);
  }

  @Get(':fileId/download-url')
  @ApiOperation({
    summary: 'Get secure download URL',
    description: 'Generates a temporary download URL for a file. The URL expires after 24 hours and requires the file to have passed security scanning.',
  })
  @ApiParam({
    name: 'fileId',
    description: 'Unique identifier of the file',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
    example: {
      download_url: 'https://storage.example.com/download/2024/01/15/abc123.pdf?token=secure_token_xyz',
      expires_at: '2024-01-16T14:30:00.000Z'
    }
  })
  @ApiResponse({
    status: 400,
    description: 'File not available for download (wrong status or failed security scan)',
    example: {
      statusCode: 400,
      message: 'File has not passed security scan',
      error: 'Bad Request'
    }
  })
  @ApiResponse({
    status: 404,
    description: 'File not found or access denied',
    example: {
      statusCode: 404,
      message: 'File not found',
      error: 'Not Found'
    }
  })
  async getDownloadUrl(
    @Request() req: any,
    @Param('fileId', ParseUUIDPipe) fileId: string,
  ): Promise<{ download_url: string; expires_at: Date }> {
    return this.filesService.getDownloadUrl(fileId, req.user.userId);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({
    summary: 'Get files by entity',
    description: 'Retrieves all files associated with a specific entity (job, application, etc.). Returns public files or files owned by the authenticated user.',
  })
  @ApiParam({
    name: 'entityType',
    description: 'Type of entity (e.g., job, application, company)',
    type: 'string',
    example: 'application'
  })
  @ApiParam({
    name: 'entityId',
    description: 'Unique identifier of the entity',
    type: 'string',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({
    status: 200,
    description: 'Entity files retrieved successfully',
    type: [FileResponseDto],
    example: [
      {
        id: '111e1111-e89b-12d3-a456-426614174000',
        original_name: 'cover_letter.pdf',
        file_type: 'cover_letter',
        mime_type: 'application/pdf',
        file_size: 1048576,
        status: 'active',
        visibility: 'private',
        entity_type: 'application',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        uploaded_by: '456e7890-e89b-12d3-a456-426614174001',
        created_at: '2024-01-15T14:30:00.000Z'
      },
      {
        id: '222e2222-e89b-12d3-a456-426614174000',
        original_name: 'portfolio.pdf',
        file_type: 'portfolio',
        mime_type: 'application/pdf',
        file_size: 5242880,
        status: 'active',
        visibility: 'public',
        entity_type: 'application',
        entity_id: '123e4567-e89b-12d3-a456-426614174000',
        uploaded_by: '456e7890-e89b-12d3-a456-426614174001',
        created_at: '2024-01-15T15:00:00.000Z'
      }
    ]
  })
  async findFilesByEntity(
    @Request() req: any,
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
  ): Promise<any[]> {
    return this.filesService.findFilesByEntity(entityType, entityId, req.user.userId);
  }

  @Get('stats/overview')
  @ApiOperation({
    summary: 'Get file statistics',
    description: 'Retrieves comprehensive statistics about files for the authenticated user, including storage usage, file counts by type and status, and recent activity.',
  })
  @ApiResponse({
    status: 200,
    description: 'File statistics retrieved successfully',
    type: FileStatsDto,
    example: {
      total_files: 25,
      total_storage_bytes: 52428800,
      by_file_type: {
        resume: 3,
        cover_letter: 5,
        portfolio: 2,
        transcript: 1,
        certificate: 4,
        profile_picture: 1,
        document: 8,
        other: 1
      },
      by_status: {
        uploading: 0,
        active: 23,
        processing: 1,
        archived: 1,
        deleted: 0,
        failed: 0
      },
      recent_uploads: 8,
      average_file_size: 2097152,
      top_storage_types: [
        {
          file_type: 'portfolio',
          count: 2,
          total_size: 20971520
        },
        {
          file_type: 'document',
          count: 8,
          total_size: 16777216
        },
        {
          file_type: 'resume',
          count: 3,
          total_size: 6291456
        }
      ]
    }
  })
  async getFileStats(@Request() req: any): Promise<any> {
    return this.filesService.getFileStats(req.user.userId);
  }
}
