import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { College } from './college.entity';

export enum VerificationStatus {
  NONE = 'none',
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryColumn('uuid')
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'uuid', nullable: true })
  college_id: string;

  @ManyToOne(() => College, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'college_id' })
  college: College;

  @Column({ type: 'varchar', length: 100, nullable: true })
  degree: string; // "B.Tech", "M.Tech", "MBA", etc.

  @Column({ type: 'varchar', length: 100, nullable: true })
  major: string; // "Computer Science", "Mechanical", etc.

  @Column({ type: 'int', nullable: true })
  graduation_year: number;

  @Column({ type: 'decimal', precision: 4, scale: 2, nullable: true })
  cgpa: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cgpa_scale: string; // "10", "4", etc.

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  linkedin_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  github_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  portfolio_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profile_picture_url: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resume_file_id: string; // Reference to files table

  @Column({
    type: 'enum',
    enum: VerificationStatus,
    default: VerificationStatus.NONE,
  })
  verification_status: VerificationStatus;

  @Column({ type: 'boolean', default: true })
  is_profile_public: boolean;

  @Column({ type: 'boolean', default: true })
  is_open_to_opportunities: boolean;

  @Column({ type: 'text', array: true, default: '{}' })
  preferred_locations: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  preferred_job_types: string[]; // "internship", "fulltime", "gig"

  @Column({ type: 'int', nullable: true })
  expected_salary_min: number;

  @Column({ type: 'int', nullable: true })
  expected_salary_max: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
