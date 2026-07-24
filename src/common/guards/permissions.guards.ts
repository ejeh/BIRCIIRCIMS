import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UsersService } from '../../users/users.service';
import { Permission } from '../../users/permissions.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    const userWithPermissions = await this.userService.findUserWithPermissions(
      user.id,
    );

    const hasAll = requiredPermissions.every((permission) =>
      userWithPermissions.permissions.includes(permission),
    );

    if (!hasAll) {
      const missing = requiredPermissions.filter(
        (p) => !userWithPermissions.permissions.includes(p),
      );
      throw new ForbiddenException(
        `Missing required permissions: ${missing.join(', ')}`,
      );
    }

    return true;
  }
}
