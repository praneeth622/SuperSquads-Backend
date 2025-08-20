import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserStatus } from '../../entities/user.entity';

@Injectable()
export class CollegeVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Allow admins to bypass college verification
    if (user.role === 'admin') {
      return true;
    }

    // For students, check college verification
    if (user.role === 'student') {
      if (
        !user.verified_college_affiliation ||
        user.status !== UserStatus.ACTIVE
      ) {
        throw new ForbiddenException('College verification required');
      }
    }

    return true;
  }
}
