import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { Application } from '../entities/application.entity';
import { Job } from '../entities/job.entity';
import { User } from '../entities/user.entity';
import { File } from '../entities/file.entity';
import { StudentProfile } from '../entities/student-profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Job, User, File, StudentProfile]),
  ],
  controllers: [ApplicationsController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
