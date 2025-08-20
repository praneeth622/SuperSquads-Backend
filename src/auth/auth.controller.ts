import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  UsePipes,
  Query,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import {
  User,
  UserStatus,
  VerificationStatus,
  UserRole,
} from '../entities/user.entity';
import { College } from '../entities/college.entity';
import {
  SupabaseWebhookDto,
  SupabaseWebhookSchema,
  VerifyCollegeEmailDto,
  VerifyCollegeEmailSchema,
  VerifyCollegeCallbackDto,
  VerifyCollegeCallbackSchema,
  UserResponseDto,
} from './dto/auth.dto';
import * as crypto from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(College)
    private collegeRepository: Repository<College>,
    private configService: ConfigService,
  ) {}

  @Post('webhooks/supabase')
  @UsePipes(new ZodValidationPipe(SupabaseWebhookSchema))
  async handleSupabaseWebhook(@Body() payload: SupabaseWebhookDto) {
    // Verify webhook signature in production
    // TODO: Implement HMAC verification

    const { type, record } = payload;
    const emailDomain = record.email.split('@')[1];

    switch (type) {
      case 'user.created':
        await this.handleUserCreated(record, emailDomain);
        break;
      case 'user.updated':
        await this.handleUserUpdated(record, emailDomain);
        break;
      case 'user.deleted':
        await this.handleUserDeleted(record.id);
        break;
    }

    return { success: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: User): Promise<UserResponseDto> {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      verification_status: user.verification_status,
      verified_college_affiliation: user.verified_college_affiliation,
      college_email: user.college_email,
      created_at: user.created_at.toISOString(),
      updated_at: user.updated_at.toISOString(),
    };
  }

  @Post('verify-college')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(VerifyCollegeEmailSchema))
  async verifyCollegeEmail(
    @CurrentUser() user: User,
    @Body() dto: VerifyCollegeEmailDto,
  ) {
    const { college_email } = dto;
    const emailDomain = college_email.split('@')[1];

    // Check if domain is in allowed colleges
    const college = await this.collegeRepository.findOne({
      where: { domain: emailDomain, is_active: true },
    });

    if (!college) {
      throw new BadRequestException(
        'This email domain is not from an eligible college',
      );
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Update user with verification token
    await this.userRepository.update(user.id, {
      college_email,
      verification_token: token,
      verification_token_expires_at: expiresAt,
      verification_status: VerificationStatus.PENDING,
    });

    // TODO: Send verification email
    // await this.emailService.sendCollegeVerificationEmail(college_email, token);

    return {
      message: 'Verification email sent to your college email',
      expires_at: expiresAt.toISOString(),
    };
  }

  @Post('verify-college/callback')
  @UsePipes(new ZodValidationPipe(VerifyCollegeCallbackSchema))
  async verifyCollegeCallback(@Query() dto: VerifyCollegeCallbackDto) {
    const { token } = dto;

    const user = await this.userRepository.findOne({
      where: {
        verification_token: token,
      },
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    if (user.verification_token_expires_at < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    // Mark user as verified
    await this.userRepository.update(user.id, {
      verified_college_affiliation: true,
      verification_status: VerificationStatus.VERIFIED,
      status: UserStatus.ACTIVE,
      verification_token: undefined,
      verification_token_expires_at: undefined,
    });

    return {
      message: 'College email verified successfully',
      verified: true,
    };
  }

  private async handleUserCreated(record: any, emailDomain: string) {
    const existingUser = await this.userRepository.findOne({
      where: { id: record.id },
    });

    if (existingUser) {
      return; // User already exists
    }

    const userData = {
      id: record.id,
      email: record.email,
      email_domain: emailDomain,
      role: UserRole.STUDENT,
      status: UserStatus.PENDING_VERIFICATION,
      verification_status: VerificationStatus.NONE,
      verified_college_affiliation: false,
    };

    const user = this.userRepository.create(userData);
    await this.userRepository.save(user);
  }

  private async handleUserUpdated(record: any, emailDomain: string) {
    await this.userRepository.update(
      { id: record.id },
      {
        email: record.email,
        email_domain: emailDomain,
        updated_at: new Date(),
      },
    );
  }

  private async handleUserDeleted(userId: string) {
    await this.userRepository.update(
      { id: userId },
      {
        status: UserStatus.DEACTIVATED,
        updated_at: new Date(),
      },
    );
  }
}
