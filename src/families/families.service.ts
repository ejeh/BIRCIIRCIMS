import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import { Family } from './schemas/family.schema';
import { FamilyMember } from './schemas/family-member.schema';
import { Dependent } from './schemas/dependent.schema';
import { FamilyInvitation } from './schemas/family-invitation.schema';
import { FamilyDocument } from './schemas/family-document.schema';
import { FamilyAuditLog } from './schemas/family-audit-log.schema';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AddDependentDto } from './dto/add-dependent.dto';
import { UpdateDependentDto } from './dto/update-dependent.dto';
import { FamilyQueryDto } from './dto/family-query.dto';
import {
  FamilyStatus,
  MemberType,
  MemberStatus,
  InvitationStatus,
  AuditAction,
  DependentStatus,
  DocumentType,
} from './enums/family.enum';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UsersService } from 'src/users/users.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Certificate } from 'src/indigene-certificate/indigene-certicate.schema';
import { IdCard } from 'src/idcard/idcard.schema';
import { Transaction } from 'src/transaction/transaction.schema';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectModel(Family.name) private familyModel: Model<Family>,
    @InjectModel(FamilyMember.name)
    private familyMemberModel: Model<FamilyMember>,
    @InjectModel(Dependent.name) private dependentModel: Model<Dependent>,
    @InjectModel(FamilyInvitation.name)
    private invitationModel: Model<FamilyInvitation>,
    @InjectModel(FamilyDocument.name)
    private familyDocumentModel: Model<FamilyDocument>,
    @InjectModel(FamilyAuditLog.name)
    private auditLogModel: Model<FamilyAuditLog>,
    @InjectModel(Certificate.name)
    private certificateModel: Model<Certificate>,
    @InjectModel(IdCard.name)
    private idCardModel: Model<IdCard>,
    @InjectModel('Transaction')
    private transactionModel: Model<Transaction>,
    private readonly notificationsService: NotificationsService,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    private readonly mailService: MailService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async generateFamilyNumber(): Promise<string> {
    const count = await this.familyModel.countDocuments();
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(6, '0');
    return `BEN-FAM-${year}-${seq}`;
  }

  private async logAudit(
    familyId: string,
    actorId: string,
    action: AuditAction,
    metadata?: Record<string, any>,
    description?: string,
  ) {
    return this.auditLogModel.create({
      familyId: new Types.ObjectId(familyId),
      actorId: new Types.ObjectId(actorId),
      action,
      description,
      metadata,
    });
  }

  async create(createFamilyDto: CreateFamilyDto, userId: string) {
    const existing = await this.familyModel.findOne({
      headId: new Types.ObjectId(userId),
      isDeleted: false,
      status: { $ne: FamilyStatus.MERGED },
    });

    if (existing) {
      throw new ConflictException(
        'You already head a family. A user can only head one family.',
      );
    }

    const familyNumber = await this.generateFamilyNumber();

    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      const [family] = await this.familyModel.create(
        [
          {
            ...createFamilyDto,
            familyNumber,
            headId: new Types.ObjectId(userId),
            createdBy: new Types.ObjectId(userId),
          },
        ],
        // { session },
      );

      await this.familyMemberModel.create(
        [
          {
            familyId: family._id,
            userId: new Types.ObjectId(userId),
            memberType: MemberType.HEAD,
            relationship: 'husband' as any,
            status: MemberStatus.ACTIVE,
            joinedAt: new Date(),
            addedBy: new Types.ObjectId(userId),
            permissions: ['*'],
          },
        ],
        // { session },
      );

      await this.logAudit(
        family._id.toString(),
        userId,
        AuditAction.MEMBER_ADDED,
        { memberType: MemberType.HEAD },
        'Family created and member added as head',
      );

      // await session.commitTransaction();

      return family;
    } catch (error) {
      //  await session.abortTransaction();
      throw error;
    } finally {
      // session.endSession();
    }
  }

  async findAll(query: FamilyQueryDto) {
    const { page, limit, search, status, lga, ward, sortBy, sortOrder } = query;
    const filter: any = { isDeleted: false };

    if (status) filter.status = status;
    if (lga) filter.lga = lga;
    if (ward) filter.ward = ward;

    if (search) {
      filter.$or = [
        { familyName: { $regex: search, $options: 'i' } },
        { familyNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortField = sortBy || 'created_at';
    const sortDir = sortOrder === 'asc' ? 1 : -1;

    const [data, total] = await Promise.all([
      this.familyModel
        .find(filter)
        .sort({ [sortField]: sortDir })
        .skip(skip)
        .limit(limit)
        .populate('headId', 'firstname lastname email phone')
        .exec(),
      this.familyModel.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: skip + limit < total,
        hasPrevPage: page > 1,
      },
    };
  }

  async findById(id: string) {
    const family = await this.familyModel
      .findById(id)
      .populate('headId', 'firstname lastname email phone')
      .exec();

    if (!family || family.isDeleted) {
      throw new NotFoundException('Family not found');
    }

    const members = await this.familyMemberModel
      .find({ familyId: family._id, isDeleted: false })
      .populate('userId', 'firstname lastname email phone passportPhoto')
      .populate('dependentId')
      .exec();

    const dependents = await this.dependentModel
      .find({ familyId: family._id, isDeleted: false })
      .exec();

    return { family, members, dependents };
  }

  async update(id: string, updateDto: UpdateFamilyDto, userId: string) {
    const family = await this.familyModel.findById(id);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can update family');

    const updated = await this.familyModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    );

    await this.logAudit(id, userId, AuditAction.FAMILY_UPDATED, {
      changes: updateDto,
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const family = await this.familyModel.findById(id);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can delete family');

    await this.familyModel.findByIdAndUpdate(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });
    await this.familyMemberModel.updateMany(
      { familyId: new Types.ObjectId(id) },
      { isDeleted: true, status: MemberStatus.REMOVED },
    );

    return { message: 'Family deleted successfully' };
  }

  async getMyFamily(userId: string) {
    const member = await this.familyMemberModel
      .findOne({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        status: MemberStatus.ACTIVE,
      })
      .populate('familyId');
    // .populate({
    //   path: 'familyId', // 1. Populate the Family document
    //   populate: {
    //     path: 'headId', // 2. Populate the User inside the Family
    //     select: 'firstname lastname email phone', // 3. Select User fields
    //   },
    // });

    if (!member)
      throw new NotFoundException('You are not a member of any family');
    // Step 2: Manually populate the User inside the Family document
    // We use this.familyModel.populate() to guarantee it uses the correct connection/schema
    const populatedFamily = await this.familyModel.populate(member.familyId, {
      path: 'headId',
      select: 'firstname lastname email phone',
    });

    const family = populatedFamily;

    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');

    const members = await this.familyMemberModel
      .find({
        familyId: family._id,
        isDeleted: false,
        status: { $ne: MemberStatus.REMOVED },
      })
      .populate('userId', 'firstname lastname email phone passportPhoto')
      .populate('dependentId')
      .exec();

    const dependents = await this.dependentModel
      .find({ familyId: family._id, isDeleted: false })
      .exec();

    return {
      family,
      members,
      dependents,
      myMemberType: member.memberType,
    };
  }

  async inviteMember(
    familyId: string,
    inviteDto: InviteMemberDto,
    senderId: string,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== senderId)
      throw new ForbiddenException('Only family head can invite members');

    const receiver = await this.usersService.findByEmail(
      inviteDto.receiverEmail,
    );
    if (!receiver)
      throw new NotFoundException('User with this email not found');

    const existingMember = await this.familyMemberModel.findOne({
      familyId: family._id,
      userId: receiver._id,
      isDeleted: false,
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this family');
    }

    const existingInvitation = await this.invitationModel.findOne({
      familyId: family._id,
      receiverId: receiver._id,
      status: InvitationStatus.PENDING,
    });

    if (existingInvitation) {
      throw new ConflictException(
        'An invitation has already been sent to this user',
      );
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invitation = await this.invitationModel.create({
      familyId: family._id,
      senderId: new Types.ObjectId(senderId),
      receiverId: receiver._id,
      token,
      expiresAt,
      relationship: inviteDto.relationship,
      message: inviteDto.message,
    });

    await this.logAudit(
      familyId,
      senderId,
      AuditAction.INVITATION_SENT,
      { receiverId: receiver._id.toString(), email: inviteDto.receiverEmail },
      `Invitation sent to ${inviteDto.receiverEmail}`,
    );

    await this.notificationsService.createSystemNotification(
      receiver._id.toString(),
      'Family Invitation',
      `You have been invited to join ${family.familyName} family.`,
      'system',
    );

    const sender = await this.usersService.findById(senderId);

    await this.mailService.sendInvitationMail(inviteDto.receiverEmail, {
      senderName: sender
        ? `${sender.firstname} ${sender.lastname}`
        : 'A family member',
      familyName: family.familyName,
      relationship: inviteDto.relationship,
      message: inviteDto.message,
      acceptToken: token,
      declineToken: token,
      expiresAt,
    });

    return { invitation, token };
  }

  async acceptInvitation(token: string, userId?: string) {
    const invitation = await this.invitationModel.findOne({
      token,
      status: InvitationStatus.PENDING,
    });
    if (!invitation)
      throw new NotFoundException(
        'Invitation not found or already responded to',
      );

    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await invitation.save();
      throw new BadRequestException('Invitation has expired');
    }

    const resolvedUserId = userId || invitation.receiverId.toString();

    // const session = await mongoose.startSession();
    // session.startTransaction();

    try {
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.respondedAt = new Date();
      await invitation.save();

      await this.familyMemberModel.create([
        {
          familyId: invitation.familyId,
          userId: new Types.ObjectId(resolvedUserId),
          memberType: MemberType.ADULT,
          relationship: invitation.relationship,
          status: MemberStatus.ACTIVE,
          joinedAt: new Date(),
          addedBy: invitation.senderId,
          permissions: [],
        },
      ]),
        // { session },);

        await this.logAudit(
          invitation.familyId.toString(),
          resolvedUserId,
          AuditAction.INVITATION_ACCEPTED,
          { invitationId: invitation._id.toString() },
          'Invitation accepted',
        );

      // await session.commitTransaction();

      const senderId = invitation.senderId.toString();
      await this.notificationsService.createSystemNotification(
        senderId,
        'Invitation Accepted',
        'Your family invitation has been accepted.',
        'system',
      );

      return { message: 'Invitation accepted successfully' };
    } catch (error) {
      // await session.abortTransaction();
      throw error;
    } finally {
      // session.endSession();
    }
  }

  async rejectInvitation(token: string, userId?: string, reason?: string) {
    const invitation = await this.invitationModel.findOne({
      token,
      status: InvitationStatus.PENDING,
    });
    if (!invitation)
      throw new NotFoundException(
        'Invitation not found or already responded to',
      );

    const resolvedUserId = userId || invitation.receiverId.toString();

    invitation.status = InvitationStatus.REJECTED;
    invitation.respondedAt = new Date();
    await invitation.save();

    await this.logAudit(
      invitation.familyId.toString(),
      resolvedUserId,
      AuditAction.INVITATION_REJECTED,
      { invitationId: invitation._id.toString(), reason },
    );

    return { message: 'Invitation rejected' };
  }

  async getMyInvitations(userId: string) {
    const invitations = await this.invitationModel
      .find({
        receiverId: new Types.ObjectId(userId),
        status: InvitationStatus.PENDING,
        isDeleted: false,
      })
      .populate('familyId', 'familyName familyNumber')
      .populate('senderId', 'firstname lastname email')
      .sort({ created_at: -1 })
      .exec();

    return invitations.map((inv) => ({
      _id: inv._id,
      token: inv.token,
      family: {
        familyName: (inv.familyId as any)?.familyName,
        familyNumber: (inv.familyId as any)?.familyNumber,
      },
      familyName: (inv.familyId as any)?.familyName,
      sender: inv.senderId as any,
      relationship: inv.relationship,
      message: inv.message,
      createdAt: (inv as any).created_at,
      expiresAt: inv.expiresAt,
      status: inv.status,
    }));
  }

  async addMember(familyId: string, addDto: AddMemberDto, userId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can add members');

    const existingMember = await this.familyMemberModel.findOne({
      familyId: family._id,
      userId: new Types.ObjectId(addDto.userId),
      isDeleted: false,
    });

    if (existingMember)
      throw new ConflictException('User is already a family member');

    const member = await this.familyMemberModel.create({
      familyId: family._id,
      userId: new Types.ObjectId(addDto.userId),
      memberType: MemberType.ADULT,
      relationship: addDto.relationship,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
      addedBy: new Types.ObjectId(userId),
    });

    await this.logAudit(familyId, userId, AuditAction.MEMBER_ADDED, {
      newMemberId: addDto.userId,
      relationship: addDto.relationship,
    });

    return member;
  }

  async removeMember(familyId: string, memberId: string, userId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can remove members');

    const member = await this.familyMemberModel.findById(memberId);
    if (!member) throw new NotFoundException('Member not found');
    if (member.memberType === MemberType.HEAD)
      throw new BadRequestException('Cannot remove family head');

    await this.familyMemberModel.findByIdAndUpdate(memberId, {
      isDeleted: true,
      status: MemberStatus.REMOVED,
    });

    await this.logAudit(familyId, userId, AuditAction.MEMBER_REMOVED, {
      removedMemberId: memberId,
    });

    return { message: 'Member removed successfully' };
  }

  async updateMember(
    familyId: string,
    memberId: string,
    updateDto: UpdateMemberDto,
    userId: string,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can update members');

    const updated = await this.familyMemberModel.findByIdAndUpdate(
      memberId,
      { $set: updateDto },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Member not found');

    const updateFields = Object.keys(updateDto);
    if (updateFields.length > 0) {
      await this.logAudit(familyId, userId, AuditAction.ROLE_CHANGED, {
        memberId,
        changes: updateDto,
      });
    }

    return updated;
  }

  async transferHeadship(
    familyId: string,
    newHeadId: string,
    currentUserId: string,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== currentUserId)
      throw new ForbiddenException(
        'Only the current head can transfer headship',
      );

    const newHeadMember = await this.familyMemberModel.findOne({
      familyId: family._id,
      userId: new Types.ObjectId(newHeadId),
      isDeleted: false,
      status: MemberStatus.ACTIVE,
    });

    if (!newHeadMember)
      throw new NotFoundException('New head must be an active family member');

    await this.familyMemberModel.findOneAndUpdate(
      { familyId: family._id, memberType: MemberType.HEAD },
      { memberType: MemberType.ADULT },
    );

    await this.familyMemberModel.findByIdAndUpdate(newHeadMember._id, {
      memberType: MemberType.HEAD,
      permissions: ['*'],
    });

    family.previousHeadId = family.headId;
    family.headId = new Types.ObjectId(newHeadId);
    await family.save();

    await this.logAudit(
      familyId,
      currentUserId,
      AuditAction.HEADSHIP_TRANSFERRED,
      { previousHeadId: currentUserId, newHeadId },
    );

    await this.notificationsService.createSystemNotification(
      newHeadId,
      'Family Headship Transferred',
      `You are now the head of ${family.familyName} family.`,
      'system',
    );

    return { message: 'Headship transferred successfully' };
  }

  async addDependent(
    familyId: string,
    addDto: AddDependentDto,
    userId: string,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can add dependents');

    const dependent = await this.dependentModel.create({
      ...addDto,
      dob: new Date(addDto.dob),
      familyId: family._id,
      parentId: new Types.ObjectId(userId),
    });

    await this.familyMemberModel.create({
      familyId: family._id,
      dependentId: dependent._id,
      memberType: MemberType.DEPENDENT,
      relationship: addDto.relationship,
      status: MemberStatus.ACTIVE,
      addedBy: new Types.ObjectId(userId),
    });

    await this.logAudit(familyId, userId, AuditAction.DEPENDENT_ADDED, {
      dependentId: dependent._id.toString(),
      name: `${addDto.firstName} ${addDto.lastName}`,
    });

    return dependent;
  }

  async updateDependent(
    familyId: string,
    dependentId: string,
    updateDto: UpdateDependentDto,
    userId: string,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can update dependents');

    const updateData: any = { ...updateDto };
    if (updateDto.dob) updateData.dob = new Date(updateDto.dob);

    const updated = await this.dependentModel.findByIdAndUpdate(
      dependentId,
      { $set: updateData },
      { new: true },
    );

    if (!updated) throw new NotFoundException('Dependent not found');

    await this.logAudit(familyId, userId, AuditAction.DEPENDENT_UPDATED, {
      dependentId,
    });

    return updated;
  }

  async removeDependent(familyId: string, dependentId: string, userId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can remove dependents');

    await this.dependentModel.findByIdAndUpdate(dependentId, {
      isDeleted: true,
      status: DependentStatus.REMOVED,
    });
    await this.familyMemberModel.updateMany(
      { dependentId: new Types.ObjectId(dependentId) },
      { isDeleted: true, status: MemberStatus.REMOVED },
    );

    await this.logAudit(familyId, userId, AuditAction.DEPENDENT_REMOVED, {
      dependentId,
    });

    return { message: 'Dependent removed successfully' };
  }

  async getDashboard(familyId: string, userId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');

    const membersship = await this.familyMemberModel
      .find({
        familyId: family._id,
        isDeleted: false,
        status: MemberStatus.ACTIVE,
      })
      .lean();

    const [
      totalMembers,
      adultCount,
      dependentCount,
      recentActivities,
      members,
      dependents,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      pendingPayments,
      completedPayments,
    ] = await Promise.all([
      this.familyMemberModel.countDocuments({
        familyId: family._id,
        isDeleted: false,
        status: MemberStatus.ACTIVE,
      }),
      this.familyMemberModel.countDocuments({
        familyId: family._id,
        isDeleted: false,
        status: MemberStatus.ACTIVE,
        memberType: { $in: [MemberType.HEAD, MemberType.ADULT] },
      }),
      this.familyMemberModel.countDocuments({
        familyId: family._id,
        isDeleted: false,
        status: MemberStatus.ACTIVE,
        memberType: MemberType.DEPENDENT,
      }),

      this.auditLogModel
        .find({ familyId: family._id })
        .sort({ created_at: -1 })
        .limit(10)
        .populate('actorId', 'firstname lastname')
        .exec(),

      this.familyMemberModel
        .find({
          familyId: family._id,
          isDeleted: false,
          status: { $ne: MemberStatus.REMOVED },
        })
        .populate('userId', 'firstname lastname email phone passportPhoto')
        .populate(
          'dependentId',
          'firstName lastName middleName passportPhoto dob gender',
        )
        .exec(),

      this.familyMemberModel
        .find({
          addedBy: new Types.ObjectId(userId),
          familyId: family._id,
          isDeleted: false,
          memberType: MemberType.DEPENDENT,
          status: { $ne: MemberStatus.REMOVED },
        })
        .sort({ created_at: -1 })
        .limit(10)
        .populate(
          'dependentId',
          'firstName lastName middleName email phone passportPhoto',
        )
        .exec(),

      this.certificateModel.countDocuments({
        userId: { $in: membersship.map((m) => m.userId) },
        status: 'pending',
      }),

      this.certificateModel.countDocuments({
        userId: { $in: membersship.map((m) => m.userId) },
        status: 'approved',
      }),

      this.certificateModel.countDocuments({
        userId: { $in: membersship.map((m) => m.userId) },
        status: 'rejected',
      }),

      this.transactionModel.countDocuments({
        userId: { $in: membersship.map((m) => m.userId) }, // Assuming payments are tied to users
        status: 'pending',
      }),

      this.transactionModel.countDocuments({
        userId: { $in: membersship.map((m) => m.userId) },
        status: 'completed',
      }),
    ]);

    const invitations = await this.invitationModel
      .find({
        senderId: new Types.ObjectId(userId),
        familyId: family._id,
        isDeleted: false,
      })
      .populate('receiverId', 'firstname lastname email')
      .sort({ created_at: -1 })
      .exec();

    const sentInvitations = invitations.map((inv) => ({
      _id: inv._id,
      email: (inv.receiverId as any)?.email,
      receiver: inv.receiverId as any,
      createdAt: (inv as any).created_at,
      expiresAt: inv.expiresAt,
      status: inv.status,
    }));

    return {
      familyNumber: family.familyNumber,
      familyName: family.familyName,
      headId: family.headId,
      summary: {
        totalMembers,
        adults: adultCount,
        dependents: dependentCount,
        pendingInvitations: invitations.filter(
          (inv) => inv.status === InvitationStatus.PENDING,
        ).length,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        pendingPayments,
        completedPayments,
      },
      recentActivities,
      members,
      dependents,
      sentInvitations,
    };
  }

  async getApplications(familyId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');

    const members = await this.familyMemberModel
      .find({
        familyId: family._id,
        isDeleted: false,
        status: MemberStatus.ACTIVE,
      })
      .lean();

    const userIds = members
      .filter((m) => m.userId)
      .map((m) => m.userId.toString());

    const [certificates, idCards] = await Promise.all([
      this.certificateModel
        .find({ userId: { $in: userIds } })
        .sort({ created_at: -1 })
        .lean(),
      this.idCardModel
        .find({ userId: { $in: userIds } })
        .sort({ created_at: -1 })
        .lean(),
    ]);

    const normalizedCerts = certificates.map((c) => ({
      ...c,
      type: 'certificate',
      reference: c.refNumber || '-',
      createdAt: c.created_at,
    }));

    const normalizedCards = idCards.map((card) => ({
      ...card,
      type: 'idcard',
      // reference: card.ref_letter || '-',
      createdAt: card.created_at,
    }));

    return [...normalizedCerts, ...normalizedCards].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async getPayments(familyId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');

    const members = await this.familyMemberModel
      .find({
        familyId: family._id,
        isDeleted: false,
        status: MemberStatus.ACTIVE,
      })
      .lean();

    const userIds = members
      .filter((m) => m.userId)
      .map((m) => m.userId.toString());

    const payments = await this.transactionModel
      .find({ userId: { $in: userIds } })
      .sort({ createdAt: -1 })
      .lean();

    return payments.map((p) => ({
      ...p,
      description: `${p.paymentType} payment`,
    }));
  }

  async getDocuments(familyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.familyDocumentModel
        .find({ familyId: new Types.ObjectId(familyId), isDeleted: false })
        .populate('uploadedBy', 'firstname lastname')
        .populate('verifiedBy', 'firstname lastname')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.familyDocumentModel.countDocuments({
        familyId: new Types.ObjectId(familyId),
        isDeleted: false,
      }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async uploadDocument(
    familyId: string,
    documentType: string,
    file: Express.Multer.File,
    description: string | undefined,
    userId: string,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can upload documents');

    const normalizedDocType = this.normalizeDocumentType(documentType);

    const fileUrl = await this.cloudinaryService.uploadFile(
      file,
      'family-documents',
      ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
      10,
    );

    const doc = await this.familyDocumentModel.create({
      familyId: family._id,
      documentType: normalizedDocType,
      fileName: file.originalname,
      fileUrl,
      mimeType: file.mimetype,
      fileSize: file.size,
      description,
      uploadedBy: new Types.ObjectId(userId),
    });

    await this.logAudit(familyId, userId, AuditAction.DOCUMENT_UPLOADED, {
      documentId: doc._id.toString(),
      documentType,
    });

    return doc;
  }

  async deleteDocument(familyId: string, documentId: string, userId: string) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');
    if (family.headId.toString() !== userId)
      throw new ForbiddenException('Only family head can delete documents');

    const doc = await this.familyDocumentModel.findById(documentId);
    if (!doc || doc.isDeleted)
      throw new NotFoundException('Document not found');

    await this.familyDocumentModel.findByIdAndUpdate(documentId, {
      isDeleted: true,
    });

    if (doc.fileUrl) {
      const publicId = this.cloudinaryService.getFullPublicIdFromUrl(
        doc.fileUrl,
      );
      if (publicId) {
        const resourceType =
          doc.mimeType === 'application/pdf' ? 'raw' : 'image';
        await this.cloudinaryService
          .deleteFile(publicId, resourceType)
          .catch(() => {});
      }
    }

    await this.logAudit(familyId, userId, AuditAction.DOCUMENT_DELETED, {
      documentId,
    });

    return { message: 'Document deleted successfully' };
  }

  async verifyDocument(
    familyId: string,
    documentId: string,
    userId: string,
    isVerified: boolean,
  ) {
    const family = await this.familyModel.findById(familyId);
    if (!family || family.isDeleted)
      throw new NotFoundException('Family not found');

    const doc = await this.familyDocumentModel.findById(documentId);
    if (!doc || doc.isDeleted)
      throw new NotFoundException('Document not found');
    if (doc.familyId.toString() !== familyId)
      throw new NotFoundException('Document does not belong to this family');

    const update: Record<string, any> = {
      isVerified,
      verifiedBy: isVerified ? new Types.ObjectId(userId) : null,
      verifiedAt: isVerified ? new Date() : null,
    };

    const updated = await this.familyDocumentModel.findByIdAndUpdate(
      documentId,
      update,
      { new: true },
    );

    await this.logAudit(familyId, userId, AuditAction.DOCUMENT_VERIFIED, {
      documentId,
      isVerified,
    });

    return updated;
  }

  async getActivityLog(familyId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.auditLogModel
        .find({ familyId: new Types.ObjectId(familyId) })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate('actorId', 'firstname lastname email')
        .exec(),
      this.auditLogModel.countDocuments({
        familyId: new Types.ObjectId(familyId),
      }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserFamilies(userId: string) {
    return this.familyMemberModel
      .find({
        userId: new Types.ObjectId(userId),
        isDeleted: false,
        status: MemberStatus.ACTIVE,
      })
      .populate('familyId')
      .exec();
  }

  async adminSuspendFamily(familyId: string) {
    const family = await this.familyModel.findByIdAndUpdate(
      familyId,
      { status: FamilyStatus.SUSPENDED },
      { new: true },
    );
    if (!family) throw new NotFoundException('Family not found');
    return family;
  }

  async adminActivateFamily(familyId: string) {
    const family = await this.familyModel.findByIdAndUpdate(
      familyId,
      { status: FamilyStatus.ACTIVE },
      { new: true },
    );
    if (!family) throw new NotFoundException('Family not found');
    return family;
  }

  private normalizeDocumentType(value: string): DocumentType {
    const trimmed = value.trim();
    if (Object.values(DocumentType).includes(trimmed as DocumentType)) {
      return trimmed as DocumentType;
    }
    const normalized = trimmed
      .toLowerCase()
      .replace(/[\s-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
    if (Object.values(DocumentType).includes(normalized as DocumentType)) {
      return normalized as DocumentType;
    }
    throw new BadRequestException(
      `Invalid documentType: '${value}'. Valid values: ${Object.values(DocumentType).join(', ')}`,
    );
  }
}
