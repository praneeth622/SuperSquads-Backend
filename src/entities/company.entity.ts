import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('companies')
@Index(['domain'], { unique: true })
@Index(['name'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 255, nullable: true, unique: true })
  domain: string; // e.g., "google.com"

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logo_url: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  company_size: string; // e.g., "1-10", "11-50", "51-200", etc.

  @Column({ type: 'varchar', length: 255, nullable: true })
  headquarters: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
