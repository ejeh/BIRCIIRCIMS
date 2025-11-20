// src/roles/role-assignment.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  RoleAssignment,
  RoleAssignmentDocument,
} from '../users/users.role-assiggnment.schema';

@Injectable()
export class RoleAssignmentService {
  constructor(
    @InjectModel(RoleAssignment.name)
    private roleAssignmentModel: Model<RoleAssignmentDocument>,
  ) {}

  async createAssignment(
    userId: string,
    previousRole: string,
    newRole: string,
    assignedBy: string,
    reason: string,
  ) {
    const newAssignment = new this.roleAssignmentModel({
      userId,
      previousRole,
      newRole,
      assignedBy,
      reason,
    });

    return await newAssignment.save();
  }

  async getAllAssignments() {
    return await this.roleAssignmentModel
      .find()
      .populate('userId', 'firstname lastname email')
      .populate('assignedBy', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAssignmentsByUserId(userId: string) {
    return await this.roleAssignmentModel
      .find({ userId })
      .populate('assignedBy', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();
  }
}
