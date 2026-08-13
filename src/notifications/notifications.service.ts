import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './notications.schema';
import { User } from '../users/users.schema';
import { NotificationsGateway } from './notifications.gateway';
import {
  NotificationTarget,
  SendNotificationDto,
} from './dto/send-notification.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly gateway: NotificationsGateway,
  ) {}

  private toObjectId(id: string): Types.ObjectId {
    try {
      return new Types.ObjectId(id);
    } catch {
      throw new BadRequestException(`Invalid id: ${id}`);
    }
  }

  async createNotification(data: Partial<Notification>) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const notification = new this.notificationModel({
      ...data,
      expiresAt,
    });
    return notification.save();
  }

  async getUserNotifications(
    userId: string,
    query: GetNotificationsQueryDto = {},
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const objectId = this.toObjectId(userId);

    const filter: Record<string, any> = { userId: objectId };
    if (query.type) filter.type = query.type;
    if (query.read !== undefined && query.read !== '') {
      filter.read = query.read === 'true';
    }

    const [data, total, unreadCount] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({
        userId: objectId,
        read: false,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount,
      },
    };
  }

  async getNotification(notificationId: string, userId: string) {
    const notif = await this.notificationModel.findOne({
      _id: notificationId,
      userId: this.toObjectId(userId),
    });
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async getUnreadCount(userId: string) {
    const unreadCount = await this.notificationModel.countDocuments({
      userId: this.toObjectId(userId),
      read: false,
    });
    return { unreadCount };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notif = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId: this.toObjectId(userId) },
      { read: true },
      { new: true },
    );
    if (!notif) throw new NotFoundException('Notification not found');
    await this.emitUnreadCount(userId);
    return notif;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationModel.updateMany(
      { userId: this.toObjectId(userId), read: false },
      { $set: { read: true } },
    );
    await this.emitUnreadCount(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
      modifiedCount: result.modifiedCount,
    };
  }

  async deleteNotification(notificationId: string, userId: string) {
    const notif = await this.notificationModel.findOneAndDelete({
      _id: notificationId,
      userId: this.toObjectId(userId),
    });
    if (!notif) throw new NotFoundException('Notification not found');
    await this.emitUnreadCount(userId);
    return { message: 'Notification deleted' };
  }

  async clearAll(userId: string) {
    await this.notificationModel.deleteMany({
      userId: this.toObjectId(userId),
    });
    await this.emitUnreadCount(userId);
    return { message: 'All notifications cleared' };
  }

  async sendNotification(dto: SendNotificationDto) {
    const target = dto.target ?? NotificationTarget.USER;
    let recipients: string[] = [];

    switch (target) {
      case NotificationTarget.USER:
        if (!dto.userId)
          throw new BadRequestException(
            'userId is required when target is "user"',
          );
        recipients = [dto.userId];
        break;

      case NotificationTarget.ALL:
        const allUsers = await this.userModel.find({}, { _id: 1 }).lean();
        recipients = allUsers.map((u: any) => u._id.toString());
        break;

      case NotificationTarget.ROLE:
        const roles = dto.roles?.length ? dto.roles : ['user'];
        const roleUsers = await this.userModel
          .find({ role: { $in: roles } }, { _id: 1 })
          .lean();
        recipients = roleUsers.map((u: any) => u._id.toString());
        break;

      case NotificationTarget.LGA:
        if (!dto.lga)
          throw new BadRequestException('lga is required when target is "lga"');
        const lgaUsers = await this.userModel
          .find({ lgaOfResidence: dto.lga }, { _id: 1 })
          .lean();
        recipients = lgaUsers.map((u: any) => u._id.toString());
        break;

      default:
        throw new BadRequestException('Invalid notification target');
    }

    if (recipients.length === 0) {
      return {
        success: true,
        message: 'No recipients matched',
        delivered: 0,
        data: [],
      };
    }

    const notifications = await Promise.all(
      recipients.map((userId) =>
        this.createSystemNotification(
          userId,
          dto.title,
          dto.message,
          dto.type as any,
          dto.link,
          dto.lga,
        ),
      ),
    );

    return {
      success: true,
      message: `Notification sent to ${recipients.length} recipient(s)`,
      delivered: recipients.length,
      data: notifications,
    };
  }

  private async emitUnreadCount(userId: string) {
    const { unreadCount } = await this.getUnreadCount(userId);
    this.gateway.sendUnreadCount(userId, unreadCount);
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type:
      | 'idcard'
      | 'certificate'
      | 'system'
      | 'alert'
      | 'auctioneer'
      | 'payment'
      | 'receipt',
    link?: string,
    lga?: string,
  ) {
    const notification = new this.notificationModel({
      userId,
      title,
      message,
      type,
      link,
      lga,
    });
    const saved = await notification.save();

    // 🚀 Emit to WebSocket listeners
    this.gateway.sendNotificationToUser(userId, saved);
    await this.emitUnreadCount(userId);

    return saved;
  }
}
