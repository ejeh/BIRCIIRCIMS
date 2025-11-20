import { Permission } from '../users/permissions.enum';
import { UserRole } from '../users/users.role.enum';

/**
 * Returns the default permissions for a given role.
 * This is the single source of truth for default permissions.
 * @param role The user role.
 * @returns An array of Permission enums.
 */
export function getDefaultPermissions(role: string): Permission[] {
  switch (role) {
    case UserRole.GLOBAL_ADMIN:
      return Object.values(Permission);

    // case UserRole.SUPER_ADMIN:
    //   return [
    //     Permission.USER_CREATE,
    //     Permission.USER_READ,
    //     Permission.USER_UPDATE,
    //     Permission.USER_DELETE,
    //     Permission.ROLE_CREATE,
    //     Permission.ROLE_READ,
    //     Permission.ROLE_UPDATE,
    //     Permission.ROLE_ASSIGN,
    //     Permission.KINDRED_CREATE,
    //     Permission.KINDRED_READ,
    //     Permission.KINDRED_UPDATE,
    //     Permission.KINDRED_DELETE,
    //     Permission.SYSTEM_CONFIG,
    //     Permission.SYSTEM_LOGS,
    //     Permission.REPORTS_VIEW,
    //     Permission.REPORTS_GENERATE,
    //   ];

    case UserRole.SUPPORT_ADMIN:
      return [
        Permission.USER_READ,
        Permission.USER_UPDATE,
        Permission.KINDRED_READ,
        Permission.SUPPORT_TICKETS,
        Permission.SUPPORT_RESPONSE,
        Permission.REPORTS_VIEW,
        Permission.ROLE_READ,
      ];
    case UserRole.KINDRED_HEAD:
      return [
        Permission.USER_READ,
        Permission.KINDRED_READ,
        Permission.KINDRED_UPDATE,
        Permission.REPORTS_VIEW,
        Permission.ROLE_READ,
      ];
    case UserRole.USER:
      return [Permission.USER_READ];
    default:
      return [];
  }
}
