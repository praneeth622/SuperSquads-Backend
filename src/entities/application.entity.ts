import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Job } from './job.entity';
import { User } from './user.entity';

export enum ApplicationStatus {
  APPLIED = 'applied',
  SHORTLISTED = 'shortlisted',
  INTERVIEWED = 'interviewed',
  REJECTED = 'rejected',
  HIRED = 'hired',
  WITHDRAWN = 'withdrawn',
}

@Entity('applications')
@Unique(['job_id', 'student_id']) // Prevent duplicate applications
@Index(['job_id'])
@Index(['student_id'])
@Index(['status'])
@Index(['submitted_at'])
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  job_id: string;

  @ManyToOne(() => Job, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @Column({ type: 'uuid' })
  student_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: User;

  @Column({
    type: 'enum',
    enum: ApplicationStatus,
    default: ApplicationStatus.APPLIED,
  })
  status: ApplicationStatus;

  @Column({ type: 'text', nullable: true })
  cover_letter: string;

  @Column({ type: 'jsonb', nullable: true })
  answers: Record<string, any>; // For custom application questions

  @Column({ type: 'varchar', length: 255, nullable: true })
  resume_file_id: string; // Reference to files table

  @Column({ type: 'text', nullable: true })
  recruiter_notes: string;

  @Column({ type: 'int', nullable: true })
  score: number; // 0-100 rating by recruiter

  @CreateDateColumn()
  submitted_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  reviewed_at: Date;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by: string; // Recruiter user ID
}
