import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserRole {
  STUDENT = 'student',
  RECRUITER = 'recruiter',
  ADMIN = 'admin',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DEACTIVATED = 'deactivated',
}

export enum VerificationStatus {
  NONE = 'none',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('users')
@Index(['email'])
@Index(['email_domain'])
@Index(['role'])
@Index(['status'])
export class User {
  @PrimaryColumn('uuid')
  id: string; // Supabase user ID

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email_domain: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password_hash: string; // Nullable since Supabase handles auth

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING_VERIFICATION,
  })
  status: UserStatus;

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.NONE,
  })
  verification_status: VerificationStatus;

  @Column({ type: 'boolean', default: false })
  verified_college_affiliation: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  college_email: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  last_login_at: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  verification_token: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  verification_token_expires_at: Date;
}
