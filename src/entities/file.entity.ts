import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum FileType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  PORTFOLIO = 'portfolio',
  PROFILE_PICTURE = 'profile_picture',
  COMPANY_LOGO = 'company_logo',
  DOCUMENT = 'document',
  IMAGE = 'image',
  OTHER = 'other',
}

export enum FileStatus {
  UPLOADING = 'uploading',
  UPLOADED = 'uploaded',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
  DELETED = 'deleted',
}

@Entity('files')
@Index(['uploaded_by'])
@Index(['file_type'])
@Index(['status'])
@Index(['created_at'])
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  original_name: string;

  @Column({ type: 'varchar', length: 255 })
  storage_key: string; // Key in S3/R2/Supabase Storage

  @Column({ type: 'varchar', length: 100 })
  mime_type: string;

  @Column({ type: 'bigint' })
  size_bytes: number;

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.DOCUMENT,
  })
  file_type: FileType;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADING,
  })
  status: FileStatus;

  @Column({ type: 'uuid', nullable: true })
  uploaded_by: string; // User ID

  @Column({ type: 'varchar', length: 500, nullable: true })
  public_url: string;

  @Column({ type: 'boolean', default: false })
  is_public: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>; // Dimensions, processing results, etc.

  @Column({ type: 'text', nullable: true })
  processing_error: string;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  deleted_at: Date;
}
