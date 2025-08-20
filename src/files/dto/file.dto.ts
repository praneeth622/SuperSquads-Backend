import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber, 
  Min, 
  Max, 
  MaxLength,
  IsUUID,
  IsBoolean,
  IsDateString,
  IsUrl
} from 'class-validator';

export enum FileType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  PORTFOLIO = 'portfolio',
  TRANSCRIPT = 'transcript',
  CERTIFICATE = 'certificate',
  PROFILE_PICTURE = 'profile_picture',
  DOCUMENT = 'document',
  OTHER = 'other'
}

export enum FileStatus {
  UPLOADING = 'uploading',
  ACTIVE = 'active',
  PROCESSING = 'processing',
  ARCHIVED = 'archived',
  DELETED = 'deleted',
  FAILED = 'failed'
}

export enum FileVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
  SHARED = 'shared'
}

export enum ScanStatus {
  PENDING = 'pending',
  SCANNING = 'scanning',
  CLEAN = 'clean',
  INFECTED = 'infected',
  QUARANTINED = 'quarantined',
  FAILED = 'failed'
}

export class CreateFileDto {
  @ApiProperty({
    description: 'Original filename as uploaded by user',
    example: 'john_doe_resume_2024.pdf'
  })
  @IsString()
  @MaxLength(255)
  original_name: string;

  @ApiProperty({
    description: 'File type category',
    enum: FileType,
    example: FileType.RESUME
  })
  @IsEnum(FileType)
  file_type: FileType;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'application/pdf'
  })
  @IsString()
  @MaxLength(100)
  mime_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576,
    minimum: 1,
    maximum: 104857600
  })
  @IsNumber()
  @Min(1)
  @Max(104857600) // 100MB max
  file_size: number;

  @ApiPropertyOptional({
    description: 'File description or notes',
    example: 'Updated resume with latest experience'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'File visibility setting',
    enum: FileVisibility,
    example: FileVisibility.PRIVATE
  })
  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @ApiPropertyOptional({
    description: 'Tags for file organization',
    example: ['resume', '2024', 'software-engineer']
  })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Associated entity ID (job_id, application_id, etc.)',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({
    description: 'Associated entity type',
    example: 'application'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity_type?: string;
}

export class UpdateFileDto {
  @ApiPropertyOptional({
    description: 'Original filename',
    example: 'john_doe_resume_v2_2024.pdf'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  original_name?: string;

  @ApiPropertyOptional({
    description: 'File type category',
    enum: FileType,
    example: FileType.RESUME
  })
  @IsOptional()
  @IsEnum(FileType)
  file_type?: FileType;

  @ApiPropertyOptional({
    description: 'File description',
    example: 'Latest resume with new certifications'
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'File visibility setting',
    enum: FileVisibility,
    example: FileVisibility.PUBLIC
  })
  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @ApiPropertyOptional({
    description: 'File status',
    enum: FileStatus,
    example: FileStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({
    description: 'Tags for file organization',
    example: ['resume', '2024', 'updated']
  })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Associated entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({
    description: 'Associated entity type',
    example: 'job_application'
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  entity_type?: string;
}

export class FileSearchDto {
  @ApiPropertyOptional({
    description: 'Search by filename',
    example: 'resume'
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  filename?: string;

  @ApiPropertyOptional({
    description: 'Filter by file type',
    enum: FileType,
    example: FileType.RESUME
  })
  @IsOptional()
  @IsEnum(FileType)
  file_type?: FileType;

  @ApiPropertyOptional({
    description: 'Filter by file status',
    enum: FileStatus,
    example: FileStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(FileStatus)
  status?: FileStatus;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: FileVisibility,
    example: FileVisibility.PRIVATE
  })
  @IsOptional()
  @IsEnum(FileVisibility)
  visibility?: FileVisibility;

  @ApiPropertyOptional({
    description: 'Filter by MIME type',
    example: 'application/pdf'
  })
  @IsOptional()
  @IsString()
  mime_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum file size (bytes)',
    example: 1024
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  min_size?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum file size (bytes)',
    example: 10485760
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  max_size?: number;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'resume,2024'
  })
  @IsOptional()
  @IsString()
  tags?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    example: 'application'
  })
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @ApiPropertyOptional({
    description: 'Filter files created after this date',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  created_after?: string;

  @ApiPropertyOptional({
    description: 'Filter files created before this date',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  created_before?: string;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    example: 20,
    minimum: 1,
    maximum: 100
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort field',
    example: 'created_at',
    enum: ['created_at', 'updated_at', 'original_name', 'file_size']
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc' = 'desc';
}

export class FileUploadUrlDto {
  @ApiProperty({
    description: 'Pre-signed upload URL',
    example: 'https://storage.googleapis.com/bucket/upload?token=abc123'
  })
  upload_url: string;

  @ApiProperty({
    description: 'File ID for tracking',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  file_id: string;

  @ApiProperty({
    description: 'Required headers for upload',
    example: {
      'Content-Type': 'application/pdf',
      'x-goog-resumable': 'start'
    }
  })
  headers: Record<string, string>;

  @ApiProperty({
    description: 'URL expiration time',
    example: '2024-01-15T11:30:00Z'
  })
  expires_at: Date;

  @ApiProperty({
    description: 'Maximum file size allowed',
    example: 10485760
  })
  max_file_size: number;
}

export class FileResponseDto {
  @ApiProperty({
    description: 'Unique file identifier',
    example: '550e8400-e29b-41d4-a716-446655440000'
  })
  id: string;

  @ApiProperty({
    description: 'File owner user ID',
    example: '550e8400-e29b-41d4-a716-446655440001'
  })
  user_id: string;

  @ApiProperty({
    description: 'Original filename',
    example: 'john_doe_resume_2024.pdf'
  })
  original_name: string;

  @ApiProperty({
    description: 'System-generated filename',
    example: '2024/01/15/550e8400-e29b-41d4-a716-446655440000.pdf'
  })
  file_path: string;

  @ApiProperty({
    description: 'File type category',
    enum: FileType,
    example: FileType.RESUME
  })
  file_type: FileType;

  @ApiProperty({
    description: 'MIME type',
    example: 'application/pdf'
  })
  mime_type: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 2048576
  })
  file_size: number;

  @ApiProperty({
    description: 'File status',
    enum: FileStatus,
    example: FileStatus.ACTIVE
  })
  status: FileStatus;

  @ApiProperty({
    description: 'File visibility',
    enum: FileVisibility,
    example: FileVisibility.PRIVATE
  })
  visibility: FileVisibility;

  @ApiProperty({
    description: 'File description',
    example: 'Updated resume with latest experience',
    nullable: true
  })
  description: string | null;

  @ApiProperty({
    description: 'File tags',
    example: ['resume', '2024', 'software-engineer'],
    type: [String]
  })
  tags: string[];

  @ApiProperty({
    description: 'Download URL (if accessible)',
    example: 'https://storage.googleapis.com/bucket/files/resume.pdf?token=xyz789',
    nullable: true
  })
  download_url: string | null;

  @ApiProperty({
    description: 'Preview URL (if supported)',
    example: 'https://storage.googleapis.com/bucket/previews/resume.jpg',
    nullable: true
  })
  preview_url: string | null;

  @ApiProperty({
    description: 'Security scan status',
    enum: ScanStatus,
    example: ScanStatus.CLEAN
  })
  scan_status: ScanStatus;

  @ApiProperty({
    description: 'Associated entity ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
    nullable: true
  })
  entity_id: string | null;

  @ApiProperty({
    description: 'Associated entity type',
    example: 'application',
    nullable: true
  })
  entity_type: string | null;

  @ApiProperty({
    description: 'File metadata',
    example: {
      extracted_text: 'Software Engineer...',
      page_count: 2,
      language: 'en'
    },
    nullable: true
  })
  metadata: Record<string, any> | null;

  @ApiProperty({
    description: 'Upload completion timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  created_at: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z'
  })
  updated_at: Date;
}

export class FileStatsDto {
  @ApiProperty({
    description: 'Total number of files',
    example: 1250
  })
  total_files: number;

  @ApiProperty({
    description: 'Total storage used in bytes',
    example: 5368709120
  })
  total_storage_bytes: number;

  @ApiProperty({
    description: 'Files by type',
    example: {
      resume: 450,
      cover_letter: 300,
      portfolio: 150,
      document: 350
    }
  })
  by_file_type: Record<FileType, number>;

  @ApiProperty({
    description: 'Files by status',
    example: {
      active: 1100,
      processing: 50,
      archived: 80,
      deleted: 20
    }
  })
  by_status: Record<FileStatus, number>;

  @ApiProperty({
    description: 'Upload activity (last 30 days)',
    example: 125
  })
  recent_uploads: number;

  @ApiProperty({
    description: 'Average file size in bytes',
    example: 4294967
  })
  average_file_size: number;

  @ApiProperty({
    description: 'Top file types by storage usage',
    example: [
      { file_type: 'resume', count: 450, total_size: 2147483648 },
      { file_type: 'portfolio', count: 150, total_size: 1073741824 }
    ]
  })
  top_storage_types: Array<{
    file_type: FileType;
    count: number;
    total_size: number;
  }>;
}
