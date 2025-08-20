import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupabaseService } from './supabase.service';
import { User } from '../entities/user.entity';
import { Environment } from '../config/env.schema';

export interface JwtPayload {
  sub: string; // Supabase user ID
  email: string;
  aud: string;
  role?: string;
  iat: number;
  exp: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService<Environment>,
    private supabaseService: SupabaseService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('SUPABASE_JWT_SECRET')!,
      audience: configService.get('SUPABASE_JWT_AUDIENCE')!,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    try {
      // Find user in our database
      let user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      // If user doesn't exist in our DB, create them (lazy user creation)
      if (!user) {
        user = await this.createUserFromJwt(payload);
      }

      // Update last login
      await this.userRepository.update(
        { id: user.id },
        { last_login_at: new Date() }
      );

      return user;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async createUserFromJwt(payload: JwtPayload): Promise<User> {
    const emailDomain = payload.email.split('@')[1];
    
    const userData = {
      id: payload.sub,
      email: payload.email,
      email_domain: emailDomain,
      role: (payload.role as any) || 'student',
      status: 'pending_verification' as any,
      verification_status: 'none' as any,
      verified_college_affiliation: false,
    };

    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }
}
