import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User, UserStatus, VerificationStatus } from '../entities/user.entity';
import { College } from '../entities/college.entity';
import { Environment } from '../config/env.schema';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(College)
    private collegeRepository: Repository<College>,
    private configService: ConfigService<Environment>,
  ) {}

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async verifyCollegeEmail(
    user: User,
    collegeEmail: string,
  ): Promise<{ token: string; expiresAt: Date }> {
    const emailDomain = collegeEmail.split('@')[1];

    // Check if domain is in allowed colleges
    const college = await this.collegeRepository.findOne({
      where: { domain: emailDomain, is_active: true },
    });

    if (!college) {
      throw new BadRequestException(
        'This email domain is not from an eligible college. Please use your official college email address.',
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Update user with verification token
    await this.userRepository.update(user.id, {
      college_email: collegeEmail,
      verification_token: token,
      verification_token_expires_at: expiresAt,
      verification_status: VerificationStatus.PENDING,
    });

    return { token, expiresAt };
  }

  async verifyCollegeCallback(token: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { verification_token: token },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    if (
      !user.verification_token_expires_at ||
      user.verification_token_expires_at < new Date()
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new verification email.',
      );
    }

    // Mark user as verified
    await this.userRepository.update(user.id, {
      verified_college_affiliation: true,
      verification_status: VerificationStatus.VERIFIED,
      status: UserStatus.ACTIVE,
      verification_token: undefined,
      verification_token_expires_at: undefined,
    });

    // Fetch updated user
    const updatedUser = await this.userRepository.findOne({
      where: { id: user.id },
    });
    return updatedUser!;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      last_login_at: new Date(),
    });
  }

  async getAllowedColleges(): Promise<College[]> {
    return this.collegeRepository.find({
      where: { is_active: true },
      order: { name: 'ASC' },
    });
  }

  async isCollegeEmailAllowed(email: string): Promise<boolean> {
    const domain = email.split('@')[1];
    const college = await this.collegeRepository.findOne({
      where: { domain, is_active: true },
    });
    return !!college;
  }
}
