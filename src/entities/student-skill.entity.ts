import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from './user.entity';
import { Skill } from './skill.entity';

export enum SkillSource {
  MANUAL = 'manual',
  AI_EXTRACT = 'ai_extract',
  ASSESSMENT = 'assessment',
  PROJECT = 'project',
  ENDORSED = 'endorsed',
}

export enum ProficiencyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

@Entity('student_skills')
@Index(['user_id'])
@Index(['skill_id'])
@Index(['proficiency_level'])
@Index(['source'])
export class StudentSkill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  skill_id: string;

  @ManyToOne(() => Skill, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'skill_id' })
  skill: Skill;

  @Column({
    type: 'enum',
    enum: ProficiencyLevel,
    default: ProficiencyLevel.BEGINNER,
  })
  proficiency_level: ProficiencyLevel;

  @Column({
    type: 'enum',
    enum: SkillSource,
    default: SkillSource.MANUAL,
  })
  source: SkillSource;

  @Column({ type: 'int', nullable: true })
  years_of_experience: number;

  @Column({ type: 'int', nullable: true, comment: 'Assessment score 0-100' })
  assessment_score: number;

  @Column({ type: 'boolean', default: true })
  is_verified: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;
}
