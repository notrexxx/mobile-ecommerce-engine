import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // The JwtAuthGuard runs first and attaches the user to the request.
    // We simply check if that user has the ADMIN role.
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied. Administrative privileges required.');
    }
    
    return true;
  }
}