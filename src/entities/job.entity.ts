import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Company } from './company.entity';
import { User } from './user.entity';

export enum JobKind {
  INTERNSHIP = 'internship',
  FULLTIME = 'fulltime',
  GIG = 'gig',
}

export enum WorkMode {
  REMOTE = 'remote',
  HYBRID = 'hybrid',
  ONSITE = 'onsite',
}

@Entity('jobs')
@Index(['kind'])
@Index(['is_active'])
@Index(['created_at'])
@Index(['company_id'])
@Index(['recruiter_id'])
// GIN indexes for arrays - will be created via migration
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  company_id: string;

  @ManyToOne(() => Company, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ type: 'uuid', nullable: true })
  recruiter_id: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'recruiter_id' })
  recruiter: User;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({
    type: 'enum',
    enum: JobKind,
  })
  kind: JobKind;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  requirements: string;

  @Column({ type: 'text', nullable: true })
  responsibilities: string;

  @Column({ type: 'int', nullable: true })
  min_stipend: number; // For internships

  @Column({ type: 'int', nullable: true })
  max_stipend: number;

  @Column({ type: 'int', nullable: true })
  min_salary: number; // For full-time

  @Column({ type: 'int', nullable: true })
  max_salary: number;

  @Column({ type: 'text', array: true, default: '{}' })
  locations: string[]; // ["Mumbai", "Bangalore", "Remote"]

  @Column({ 
    type: 'enum', 
    enum: WorkMode,
    array: true, 
    default: [WorkMode.REMOTE] 
  })
  work_modes: WorkMode[];

  @Column({ type: 'text', array: true, default: '{}' })
  skills: string[]; // ["JavaScript", "React", "Node.js"]

  @Column({ type: 'text', array: true, default: '{}' })
  benefits: string[]; // ["Health Insurance", "Flexible Hours"]

  @Column({ type: 'varchar', length: 50, nullable: true })
  experience_level: string; // "Entry", "Mid", "Senior"

  @Column({ type: 'int', nullable: true })
  duration_months: number; // For internships

  @Column({ type: 'timestamp with time zone', nullable: true })
  application_deadline: Date;

  @Column({ type: 'int', default: 0 })
  application_count: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
