import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Family } from '../schemas/family.schema';
import { FamilyMember as FamilyMemberModelSchema } from '../schemas/family-member.schema';
import { MemberStatus } from '../enums/family.enum';
import { UserRole } from 'src/users/users.role.enum';

export const FAMILY_HEAD_KEY = 'family_head';
export const FAMILY_MEMBER_KEY = 'family_member';

export const FamilyHead = () => SetMetadata(FAMILY_HEAD_KEY, true);
export const FamilyMember = () => SetMetadata(FAMILY_MEMBER_KEY, true);

@Injectable()
export class FamilyRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(Family.name) private familyModel: Model<Family>,
    @InjectModel(FamilyMemberModelSchema.name)
    private familyMemberModel: Model<FamilyMemberModelSchema>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireHead = this.reflector.getAllAndOverride<boolean>(
      FAMILY_HEAD_KEY,
      [context.getHandler(), context.getClass()],
    );
    const requireMember = this.reflector.getAllAndOverride<boolean>(
      FAMILY_MEMBER_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requireHead && !requireMember) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const familyId =
      request.params.id || request.body.familyId || request.query.familyId;

    if (!user || !user.sub)
      throw new ForbiddenException('User not authenticated');
    if (!familyId) throw new ForbiddenException('Family ID required');

    const family = await this.familyModel.findById(familyId);
    if (!family) throw new NotFoundException('Family not found');

    if (requireHead) {
      const isAdmin =
        user.role === UserRole.GLOBAL_ADMIN ||
        user.role === UserRole.ADMIN ||
        user.role === UserRole.SUPPORT_ADMIN;
      const isHead = family.headId.toString() === user.sub;
      if (!isHead && !isAdmin)
        throw new ForbiddenException(
          'Only family head can perform this action',
        );
      request.family = family;
      return true;
    }

    if (requireMember) {
      const isAdmin =
        user.role === UserRole.GLOBAL_ADMIN ||
        user.role === UserRole.ADMIN ||
        user.role === UserRole.SUPPORT_ADMIN;
      if (isAdmin) {
        request.family = family;
        return true;
      }
      const member = await this.familyMemberModel.findOne({
        familyId: family._id,
        userId: new Types.ObjectId(user.sub),
        status: MemberStatus.ACTIVE,
        isDeleted: false,
      });
      if (!member)
        throw new ForbiddenException(
          'You are not an active member of this family',
        );
      request.family = family;
      request.familyMember = member;
      return true;
    }

    return true;
  }
}
