// src/users/permissions.enum.ts
export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Role Management
  ROLE_CREATE = 'role:create',
  ROLE_READ = 'role:read',
  ROLE_UPDATE = 'role:update',
  ROLE_DELETE = 'role:delete',
  ROLE_ASSIGN = 'role:assign',

  // Kindred Management
  KINDRED_CREATE = 'kindred:create',
  KINDRED_READ = 'kindred:read',
  KINDRED_UPDATE = 'kindred:update',
  KINDRED_DELETE = 'kindred:delete',

  // System Management
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_LOGS = 'system:logs',

  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_GENERATE = 'reports:generate',

  // Support
  SUPPORT_TICKETS = 'support:tickets',
  SUPPORT_RESPONSE = 'support:response',
}
