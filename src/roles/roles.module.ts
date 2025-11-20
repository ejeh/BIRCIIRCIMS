import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RolesController } from './roles.controller';
import { RolePermissionService } from './role-permission.service';
import { RoleAssignmentService } from './role-assignment.service';
import { PermissionsGuard } from '../common/guards/permissions.guards';
import { RolePermission, RolePermissionSchema } from './role-permission.schema';
import {
  RoleAssignment,
  RoleAssignmentSchema,
} from '../users/users.role-assiggnment.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: RoleAssignment.name, schema: RoleAssignmentSchema },
    ]),
    forwardRef(() => UsersModule), // Inject UsersModule to access UsersService
  ],
  controllers: [RolesController],
  providers: [
    RolePermissionService,
    RoleAssignmentService,
    PermissionsGuard, // Provide the guard so it can be injected elsewhere
  ],
  exports: [
    RolePermissionService,
    RoleAssignmentService,
    PermissionsGuard, // Export the guard for use in other modules (e.g., UsersModule)

    MongooseModule.forFeature([
      { name: RolePermission.name, schema: RolePermissionSchema },
      { name: RoleAssignment.name, schema: RoleAssignmentSchema },
    ]),
  ],
})
export class RolesModule {}
