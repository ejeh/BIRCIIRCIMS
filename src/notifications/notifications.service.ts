import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from './notications.schema';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async createNotification(data: Partial<Notification>) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const notification = new this.notificationModel({
      ...data,
      expiresAt, // add expiry field correctly
    });
    return notification.save();
  }

  async getUserNotifications(userId: string) {
    return (
      this.notificationModel
        // .find({ userId: new Types.ObjectId(userId) })
        .find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
    );
  }

  async markAsRead(notificationId: string, userId: string) {
    const notif = await this.notificationModel.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true },
    );
    if (!notif) throw new NotFoundException('Notification not found');
    return notif;
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    );
    return { success: true, message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    });
  }

  async clearAll(userId: string) {
    await this.notificationModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
    return { message: 'All notifications cleared' };
  }

  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    type: 'idcard' | 'certificate' | 'system' | 'alert',
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

    return saved;
  }
}
