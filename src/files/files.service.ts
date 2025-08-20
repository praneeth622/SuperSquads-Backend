import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  File,
  FileType as EntityFileType,
  FileStatus as EntityFileStatus,
} from '../entities/file.entity';
import { User } from '../entities/user.entity';
import {
  CreateFileDto,
  UpdateFileDto,
  FileSearchDto,
  FileUploadUrlDto,
  FileType,
  FileStatus,
  FileVisibility,
  ScanStatus,
} from './dto/file.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Generate pre-signed upload URL
   */
  async generateUploadUrl(
    userId: string,
    createDto: CreateFileDto,
  ): Promise<FileUploadUrlDto> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate file size
    const maxSize = this.configService.get<number>('MAX_FILE_SIZE', 104857600); // 100MB default
    if (createDto.file_size > maxSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${maxSize} bytes`,
      );
    }

    // Validate MIME type
    const allowedMimeTypes = this.getAllowedMimeTypes();
    if (!allowedMimeTypes.includes(createDto.mime_type)) {
      throw new BadRequestException(
        `MIME type ${createDto.mime_type} is not allowed`,
      );
    }

    // Create file record with pending status
    const file = new File();
    file.uploaded_by = userId;
    file.original_name = createDto.original_name;
    file.file_type = this.mapFileType(createDto.file_type);
    file.mime_type = createDto.mime_type;
    file.size_bytes = createDto.file_size;
    file.status = EntityFileStatus.UPLOADING;
    file.is_public = createDto.visibility === FileVisibility.PUBLIC;
    file.metadata = {
      description: createDto.description || null,
      tags: createDto.tags || [],
      entity_id: createDto.entity_id || null,
      entity_type: createDto.entity_type || null,
      scan_status: ScanStatus.PENDING,
      visibility: createDto.visibility || FileVisibility.PRIVATE,
    };

    const savedFile = await this.fileRepository.save(file);

    // Generate storage path
    const datePath = new Date().toISOString().split('T')[0].replace(/-/g, '/');
    const fileName = `${savedFile.id}.${this.getFileExtension(createDto.original_name)}`;
    const storageKey = `${datePath}/${fileName}`;

    // Update file with storage key
    savedFile.storage_key = storageKey;
    await this.fileRepository.save(savedFile);

    // Generate pre-signed URL (mock implementation)
    const baseUrl = this.configService.get<string>(
      'STORAGE_BASE_URL',
      'https://storage.example.com',
    );
    const uploadUrl = `${baseUrl}/upload/${storageKey}?token=${this.generateUploadToken()}`;

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    return {
      upload_url: uploadUrl,
      file_id: savedFile.id,
      headers: {
        'Content-Type': createDto.mime_type,
        'x-upload-token': this.generateUploadToken(),
      },
      expires_at: expiresAt,
      max_file_size: maxSize,
    };
  }

  /**
   * Confirm file upload completion
   */
  async confirmUpload(fileId: string, userId: string): Promise<any> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, uploaded_by: userId },
    });

    if (!file) {
      throw new NotFoundException('File not found or access denied');
    }

    if (file.status !== EntityFileStatus.UPLOADING) {
      throw new BadRequestException('File is not in uploading status');
    }

    // Update status to processing for virus scan
    file.status = EntityFileStatus.PROCESSING;
    file.metadata = {
      ...file.metadata,
      scan_status: ScanStatus.SCANNING,
    };

    const updatedFile = await this.fileRepository.save(file);

    // Trigger async processing (virus scan, text extraction, etc.)
    this.processFileAsync(updatedFile.id);

    return this.transformFileToDto(updatedFile);
  }

  /**
   * Get all files for a user with filtering and pagination
   */
  async findUserFiles(
    userId: string,
    searchDto: FileSearchDto,
  ): Promise<{
    files: any[];
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

    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.uploaded_by = :userId', { userId })
      .andWhere('file.deleted_at IS NULL');

    // Apply filters
    this.applySearchFilters(queryBuilder, searchDto);

    // Apply sorting
    const sortField = this.validateSortField(sort_by);
    queryBuilder.orderBy(
      `file.${sortField}`,
      sort_order.toUpperCase() as 'ASC' | 'DESC',
    );

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const [files, total] = await queryBuilder.getManyAndCount();

    // Add download URLs for accessible files
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        download_url: await this.generateDownloadUrl(file),
        preview_url: await this.generatePreviewUrl(file),
      })),
    );

    return {
      files: filesWithUrls,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get file by ID
   */
  async findFileById(fileId: string, userId: string): Promise<any> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId },
    });

    if (!file || file.deleted_at) {
      throw new NotFoundException('File not found');
    }

    // Check access permissions
    if (!this.canAccessFile(file, userId)) {
      throw new ForbiddenException('Access denied to this file');
    }

    // Add URLs
    return {
      ...file,
      download_url: await this.generateDownloadUrl(file),
      preview_url: await this.generatePreviewUrl(file),
    };
  }

  /**
   * Update file metadata
   */
  async updateFile(
    fileId: string,
    userId: string,
    updateDto: UpdateFileDto,
  ): Promise<any> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, uploaded_by: userId },
    });

    if (!file || file.deleted_at) {
      throw new NotFoundException('File not found or access denied');
    }

    // Update allowed fields
    if (updateDto.original_name !== undefined)
      file.original_name = updateDto.original_name;
    if (updateDto.file_type !== undefined)
      file.file_type = this.mapFileType(updateDto.file_type);
    if (updateDto.status !== undefined)
      file.status = this.mapFileStatus(updateDto.status);

    // Update metadata
    const updatedMetadata = { ...file.metadata };
    if (updateDto.description !== undefined)
      updatedMetadata.description = updateDto.description;
    if (updateDto.visibility !== undefined) {
      updatedMetadata.visibility = updateDto.visibility;
      file.is_public = updateDto.visibility === FileVisibility.PUBLIC;
    }
    if (updateDto.tags !== undefined) updatedMetadata.tags = updateDto.tags;
    if (updateDto.entity_id !== undefined)
      updatedMetadata.entity_id = updateDto.entity_id;
    if (updateDto.entity_type !== undefined)
      updatedMetadata.entity_type = updateDto.entity_type;

    file.metadata = updatedMetadata;

    const savedFile = await this.fileRepository.save(file);
    return this.transformFileToDto(savedFile);
  }

  /**
   * Delete file (soft delete)
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, uploaded_by: userId },
    });

    if (!file || file.deleted_at) {
      throw new NotFoundException('File not found or access denied');
    }

    // Soft delete by setting deleted_at timestamp
    file.deleted_at = new Date();
    await this.fileRepository.save(file);

    // Schedule actual file deletion from storage
    this.scheduleFileCleanup(file.id);
  }

  /**
   * Get download URL for a file
   */
  async getDownloadUrl(
    fileId: string,
    userId: string,
  ): Promise<{ download_url: string; expires_at: Date }> {
    const file = await this.findFileById(fileId, userId);

    if (file.status !== EntityFileStatus.PROCESSED) {
      throw new BadRequestException('File is not available for download');
    }

    const scanStatus = file.metadata?.scan_status;
    if (scanStatus !== ScanStatus.CLEAN) {
      throw new BadRequestException('File has not passed security scan');
    }

    const downloadUrl = await this.generateDownloadUrl(file);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

    return {
      download_url: downloadUrl,
      expires_at: expiresAt,
    };
  }

  /**
   * Get files by entity (job, application, etc.)
   */
  async findFilesByEntity(
    entityType: string,
    entityId: string,
    userId?: string,
  ): Promise<any[]> {
    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deleted_at IS NULL')
      .andWhere('file.metadata ->> :entityTypeKey = :entityType', {
        entityTypeKey: 'entity_type',
        entityType,
      })
      .andWhere('file.metadata ->> :entityIdKey = :entityId', {
        entityIdKey: 'entity_id',
        entityId,
      })
      .andWhere('file.status = :status', {
        status: EntityFileStatus.PROCESSED,
      });

    // If userId is provided, check ownership or public visibility
    if (userId) {
      queryBuilder.andWhere(
        '(file.uploaded_by = :userId OR file.is_public = true)',
        { userId },
      );
    } else {
      queryBuilder.andWhere('file.is_public = true');
    }

    const files = await queryBuilder.getMany();
    return files.map((file) => this.transformFileToDto(file));
  }

  /**
   * Get file statistics
   */
  async getFileStats(userId?: string): Promise<{
    total_files: number;
    total_storage_bytes: number;
    by_file_type: Record<string, number>;
    by_status: Record<string, number>;
    recent_uploads: number;
    average_file_size: number;
    top_storage_types: Array<{
      file_type: string;
      count: number;
      total_size: number;
    }>;
  }> {
    const baseQuery = this.fileRepository
      .createQueryBuilder('file')
      .where('file.deleted_at IS NULL');

    if (userId) {
      baseQuery.andWhere('file.uploaded_by = :userId', { userId });
    }

    // Total files and storage
    const totalResult = await baseQuery
      .select('COUNT(*)', 'total_files')
      .addSelect('SUM(file.size_bytes)', 'total_storage_bytes')
      .addSelect('AVG(file.size_bytes)', 'average_file_size')
      .getRawOne();

    const total_files = parseInt(totalResult.total_files) || 0;
    const total_storage_bytes = parseInt(totalResult.total_storage_bytes) || 0;
    const average_file_size = parseInt(totalResult.average_file_size) || 0;

    // Files by type
    const typeStats = await this.fileRepository
      .createQueryBuilder('file')
      .select('file.file_type', 'file_type')
      .addSelect('COUNT(*)', 'count')
      .where('file.deleted_at IS NULL')
      .andWhere(userId ? 'file.uploaded_by = :userId' : '1=1', { userId })
      .groupBy('file.file_type')
      .getRawMany();

    const by_file_type = typeStats.reduce(
      (acc, stat) => {
        acc[stat.file_type] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Files by status
    const statusStats = await this.fileRepository
      .createQueryBuilder('file')
      .select('file.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('file.deleted_at IS NULL')
      .andWhere(userId ? 'file.uploaded_by = :userId' : '1=1', { userId })
      .groupBy('file.status')
      .getRawMany();

    const by_status = statusStats.reduce(
      (acc, stat) => {
        acc[stat.status] = parseInt(stat.count);
        return acc;
      },
      {} as Record<string, number>,
    );

    // Recent uploads (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recent_uploads = await this.fileRepository
      .createQueryBuilder('file')
      .where('file.created_at >= :date', { date: thirtyDaysAgo })
      .andWhere('file.deleted_at IS NULL')
      .andWhere(userId ? 'file.uploaded_by = :userId' : '1=1', { userId })
      .getCount();

    // Top storage types
    const storageStats = await this.fileRepository
      .createQueryBuilder('file')
      .select('file.file_type', 'file_type')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(file.size_bytes)', 'total_size')
      .where('file.deleted_at IS NULL')
      .andWhere(userId ? 'file.uploaded_by = :userId' : '1=1', { userId })
      .groupBy('file.file_type')
      .orderBy('SUM(file.size_bytes)', 'DESC')
      .limit(5)
      .getRawMany();

    const top_storage_types = storageStats.map((stat) => ({
      file_type: stat.file_type,
      count: parseInt(stat.count),
      total_size: parseInt(stat.total_size),
    }));

    return {
      total_files,
      total_storage_bytes,
      by_file_type,
      by_status,
      recent_uploads,
      average_file_size,
      top_storage_types,
    };
  }

  /**
   * Private helper methods
   */
  private mapFileType(dtoFileType: FileType): EntityFileType {
    const mapping: Record<FileType, EntityFileType> = {
      [FileType.RESUME]: EntityFileType.RESUME,
      [FileType.COVER_LETTER]: EntityFileType.COVER_LETTER,
      [FileType.PORTFOLIO]: EntityFileType.PORTFOLIO,
      [FileType.TRANSCRIPT]: EntityFileType.DOCUMENT, // Map to closest equivalent
      [FileType.CERTIFICATE]: EntityFileType.DOCUMENT,
      [FileType.PROFILE_PICTURE]: EntityFileType.PROFILE_PICTURE,
      [FileType.DOCUMENT]: EntityFileType.DOCUMENT,
      [FileType.OTHER]: EntityFileType.OTHER,
    };
    return mapping[dtoFileType] || EntityFileType.DOCUMENT;
  }

  private mapFileStatus(dtoStatus: FileStatus): EntityFileStatus {
    const mapping: Record<FileStatus, EntityFileStatus> = {
      [FileStatus.UPLOADING]: EntityFileStatus.UPLOADING,
      [FileStatus.ACTIVE]: EntityFileStatus.PROCESSED, // Map to closest equivalent
      [FileStatus.PROCESSING]: EntityFileStatus.PROCESSING,
      [FileStatus.ARCHIVED]: EntityFileStatus.PROCESSED,
      [FileStatus.DELETED]: EntityFileStatus.DELETED,
      [FileStatus.FAILED]: EntityFileStatus.ERROR,
    };
    return mapping[dtoStatus] || EntityFileStatus.UPLOADED;
  }

  private applySearchFilters(
    queryBuilder: SelectQueryBuilder<File>,
    searchDto: FileSearchDto,
  ): void {
    const {
      filename,
      file_type,
      status,
      visibility,
      mime_type,
      min_size,
      max_size,
      tags,
      entity_type,
      entity_id,
      created_after,
      created_before,
    } = searchDto;

    if (filename) {
      queryBuilder.andWhere('LOWER(file.original_name) LIKE LOWER(:filename)', {
        filename: `%${filename}%`,
      });
    }

    if (file_type) {
      const mappedType = this.mapFileType(file_type);
      queryBuilder.andWhere('file.file_type = :file_type', {
        file_type: mappedType,
      });
    }

    if (status) {
      const mappedStatus = this.mapFileStatus(status);
      queryBuilder.andWhere('file.status = :status', { status: mappedStatus });
    }

    if (visibility) {
      if (visibility === FileVisibility.PUBLIC) {
        queryBuilder.andWhere('file.is_public = true');
      } else {
        queryBuilder.andWhere('file.is_public = false');
      }
    }

    if (mime_type) {
      queryBuilder.andWhere('file.mime_type = :mime_type', { mime_type });
    }

    if (min_size !== undefined) {
      queryBuilder.andWhere('file.size_bytes >= :min_size', { min_size });
    }

    if (max_size !== undefined) {
      queryBuilder.andWhere('file.size_bytes <= :max_size', { max_size });
    }

    if (tags) {
      const tagArray = tags.split(',').map((t) => t.trim());
      const tagConditions = tagArray.map((tag, index) => {
        queryBuilder.setParameter(`tag_${index}`, `%${tag}%`);
        return `file.metadata ->> 'tags' LIKE :tag_${index}`;
      });

      if (tagConditions.length > 0) {
        queryBuilder.andWhere(`(${tagConditions.join(' OR ')})`);
      }
    }

    if (entity_type) {
      queryBuilder.andWhere('file.metadata ->> :entityTypeKey = :entity_type', {
        entityTypeKey: 'entity_type',
        entity_type,
      });
    }

    if (entity_id) {
      queryBuilder.andWhere('file.metadata ->> :entityIdKey = :entity_id', {
        entityIdKey: 'entity_id',
        entity_id,
      });
    }

    if (created_after) {
      queryBuilder.andWhere('file.created_at >= :created_after', {
        created_after,
      });
    }

    if (created_before) {
      queryBuilder.andWhere('file.created_at <= :created_before', {
        created_before,
      });
    }
  }

  private validateSortField(sortBy: string): string {
    const allowedFields = ['created_at', 'original_name', 'size_bytes'];
    if (!allowedFields.includes(sortBy)) {
      throw new BadRequestException(`Invalid sort field: ${sortBy}`);
    }
    return sortBy;
  }

  private getAllowedMimeTypes(): string[] {
    return [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/zip',
      'application/x-zip-compressed',
    ];
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'bin';
  }

  private generateUploadToken(): string {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }

  private async generateDownloadUrl(file: File): Promise<string> {
    const baseUrl = this.configService.get<string>(
      'STORAGE_BASE_URL',
      'https://storage.example.com',
    );
    const token = this.generateUploadToken();
    return `${baseUrl}/download/${file.storage_key}?token=${token}`;
  }

  private async generatePreviewUrl(file: File): Promise<string | null> {
    if (!this.isPreviewable(file.mime_type)) {
      return null;
    }

    const baseUrl = this.configService.get<string>(
      'STORAGE_BASE_URL',
      'https://storage.example.com',
    );
    const token = this.generateUploadToken();
    return `${baseUrl}/preview/${file.storage_key}?token=${token}`;
  }

  private isPreviewable(mimeType: string): boolean {
    const previewableMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'text/plain',
    ];
    return previewableMimes.includes(mimeType);
  }

  private canAccessFile(file: File, userId: string): boolean {
    // Owner can always access
    if (file.uploaded_by === userId) {
      return true;
    }

    // Public files can be accessed by anyone
    if (file.is_public) {
      return true;
    }

    // Add more complex permission logic here if needed
    return false;
  }

  private async processFileAsync(fileId: string): Promise<void> {
    // Mock async processing - in real implementation, this would trigger
    // virus scanning, text extraction, thumbnail generation, etc.
    setTimeout(async () => {
      const file = await this.fileRepository.findOne({ where: { id: fileId } });
      if (file) {
        file.status = EntityFileStatus.PROCESSED;
        file.metadata = {
          ...file.metadata,
          scan_status: ScanStatus.CLEAN,
        };
        await this.fileRepository.save(file);
      }
    }, 5000); // 5 seconds for demo
  }

  private scheduleFileCleanup(fileId: string): void {
    // Mock cleanup scheduling - in real implementation, this would add
    // the file to a cleanup queue for physical deletion from storage
    console.log(`Scheduled cleanup for file: ${fileId}`);
  }

  /**
   * Transform File entity to DTO format
   */
  private transformFileToDto(file: File): any {
    const metadata = file.metadata || {};

    return {
      id: file.id,
      user_id: file.uploaded_by,
      original_name: file.original_name,
      file_path: file.storage_key,
      file_type: this.mapEntityFileTypeToDto(file.file_type),
      mime_type: file.mime_type,
      file_size: file.size_bytes,
      status: this.mapEntityFileStatusToDto(file.status),
      visibility:
        metadata.visibility ||
        (file.is_public ? FileVisibility.PUBLIC : FileVisibility.PRIVATE),
      description: metadata.description || null,
      tags: metadata.tags || [],
      entity_id: metadata.entity_id || null,
      entity_type: metadata.entity_type || null,
      scan_status: metadata.scan_status || ScanStatus.PENDING,
      uploaded_by: file.uploaded_by,
      is_public: file.is_public,
      created_at: file.created_at,
      updated_at: file.created_at, // Entity doesn't have updated_at
      download_url: null, // Will be populated separately if needed
      preview_url: null, // Will be populated separately if needed
    };
  }

  /**
   * Map entity FileType to DTO FileType
   */
  private mapEntityFileTypeToDto(entityType: EntityFileType): FileType {
    const mapping: Record<EntityFileType, FileType> = {
      [EntityFileType.RESUME]: FileType.RESUME,
      [EntityFileType.COVER_LETTER]: FileType.COVER_LETTER,
      [EntityFileType.PORTFOLIO]: FileType.PORTFOLIO,
      [EntityFileType.PROFILE_PICTURE]: FileType.PROFILE_PICTURE,
      [EntityFileType.COMPANY_LOGO]: FileType.OTHER, // Map to closest equivalent
      [EntityFileType.DOCUMENT]: FileType.DOCUMENT,
      [EntityFileType.IMAGE]: FileType.OTHER,
      [EntityFileType.OTHER]: FileType.OTHER,
    };
    return mapping[entityType] || FileType.OTHER;
  }

  /**
   * Map entity FileStatus to DTO FileStatus
   */
  private mapEntityFileStatusToDto(entityStatus: EntityFileStatus): FileStatus {
    const mapping: Record<EntityFileStatus, FileStatus> = {
      [EntityFileStatus.UPLOADING]: FileStatus.UPLOADING,
      [EntityFileStatus.UPLOADED]: FileStatus.ACTIVE,
      [EntityFileStatus.PROCESSING]: FileStatus.PROCESSING,
      [EntityFileStatus.PROCESSED]: FileStatus.ACTIVE,
      [EntityFileStatus.ERROR]: FileStatus.FAILED,
      [EntityFileStatus.DELETED]: FileStatus.DELETED,
    };
    return mapping[entityStatus] || FileStatus.ACTIVE;
  }
}
