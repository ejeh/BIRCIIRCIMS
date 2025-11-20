// src/roles/role-permission.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RolePermission,
  RolePermissionDocument,
} from './role-permission.schema';
import { Permission } from '../users/permissions.enum';
import { UserRole } from '../users/users.role.enum';
import { getDefaultPermissions } from './roles-permission.default';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermissionDocument>,
  ) {}

  async getAllRoles() {
    const roles = Object.values(UserRole);
    const rolePermissions = await this.rolePermissionModel.find().exec();

    return roles.map((role) => {
      console.log(role);
      const rolePermission = rolePermissions.find((rp) => rp.role === role);
      return {
        value: role,
        label: role
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        permissions: rolePermission
          ? rolePermission.permissions
          : this.getDefaultPermissions(role),
      };
    });
  }

  async getRolePermissions(role: string) {
    const rolePermission = await this.rolePermissionModel
      .findOne({ role })
      .exec();

    if (!rolePermission) {
      return {
        role,
        permissions: this.getDefaultPermissions(role),
      };
    }

    return rolePermission;
  }

  async updateRolePermissions(role: string, permissions: Permission[]) {
    const rolePermission = await this.rolePermissionModel
      .findOneAndUpdate({ role }, { permissions }, { upsert: true, new: true })
      .exec();

    return rolePermission;
  }

  // UPDATE THIS METHOD TO USE THE UTILITY
  private getDefaultPermissions(role: string): Permission[] {
    return getDefaultPermissions(role);
  }
}
