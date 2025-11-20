// src/roles/roles.controller.ts
import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guards';
import { Permissions } from '../common/decorators/permissions.decorator';
import { RolePermissionService } from './role-permission.service';
import { RoleAssignmentService } from './role-assignment.service';
import { Permission } from '../users/permissions.enum';

@ApiTags('roles')
@Controller('api/roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(
    private readonly rolePermissionService: RolePermissionService,
    private readonly roleAssignmentService: RoleAssignmentService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all available user roles' })
  @ApiResponse({ status: 200, description: 'List of available roles' })
  @Permissions(Permission.ROLE_READ)
  async getRoles() {
    return await this.rolePermissionService.getAllRoles();
  }

  @Get(':role/permissions')
  @ApiOperation({ summary: 'Get permissions for a specific role' })
  @ApiResponse({ status: 200, description: 'Permissions for the role' })
  @Permissions(Permission.ROLE_READ)
  async getRolePermissions(@Param('role') role: string) {
    return await this.rolePermissionService.getRolePermissions(role);
  }

  @Put(':role/permissions')
  @ApiOperation({ summary: 'Update permissions for a specific role' })
  @ApiResponse({ status: 200, description: 'Updated permissions' })
  @Permissions(Permission.ROLE_UPDATE)
  async updateRolePermissions(
    @Param('role') role: string,
    @Body('permissions') permissions: Permission[],
  ) {
    return await this.rolePermissionService.updateRolePermissions(
      role,
      permissions,
    );
  }

  @Get('assignments')
  @ApiOperation({ summary: 'Get role assignment history' })
  @ApiResponse({ status: 200, description: 'Role assignment history' })
  @Permissions(Permission.ROLE_READ)
  async getRoleAssignments() {
    return await this.roleAssignmentService.getAllAssignments();
  }
}
