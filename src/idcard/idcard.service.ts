import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { IdCard } from './idcard.schema';
import { UserNotFoundException } from 'src/common/exception';
import puppeteer from 'puppeteer';
import path from 'path';
import * as fs from 'fs';
import { Types } from 'mongoose';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Injectable()
export class IdcardService {
  constructor(
    @InjectModel(IdCard.name)
    public readonly idCardModel: Model<IdCard>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async generateUniqueNumber(): Promise<string> {
    const part1 = Math.floor(1000 + Math.random() * 9000); // 4 digits
    const part2 = Math.floor(100 + Math.random() * 900); // 3 digits
    const part3 = Math.floor(1000 + Math.random() * 9000); // 4 digits

    return `${part1} ${part2} ${part3}`;
  }

  async generateUniqueBIN(): Promise<string> {
    let bin: string;
    let exists: IdCard | null;

    do {
      bin = await this.generateUniqueNumber(); // Generate a random number
      exists = await this.idCardModel.findOne({ bin }); // Check uniqueness in DB
    } while (exists); // Repeat until a unique number is found

    return bin;
  }

  async createIdCard(data: Partial<IdCard>): Promise<IdCard> {
    return this.idCardModel.create(data);
  }

  async findCardById(id: string): Promise<IdCard> {
    return this.idCardModel.findById(id);
  }

  async findById(id: string): Promise<IdCard> {
    const user = await this.idCardModel
      .findById(id)
      .populate(
        'userId',
        'firstname lastname email passportPhoto isProfileCompleted stateOfOrigin lgaOfOrigin',
      )
      .exec();
    if (!user) {
      throw UserNotFoundException();
    }
    return user;
  }

  async findOne(id: string): Promise<IdCard> {
    const idCard = await this.idCardModel.findOne({ userId: id });

    return idCard;
  }

  async findCardRequestsByStatuses(
    page: number,
    limit: number,
    statuses: string[],
  ) {
    const skip = (page - 1) * limit;
    const data = await this.idCardModel
      .find({ status: { $in: statuses } })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalCount = await this.idCardModel
      .countDocuments({ status: { $in: statuses } })
      .exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async getLatestIdCard() {
    return this.idCardModel
      .findOne()
      .sort({ createdAt: -1 }) // Sort by createdAt descending (newest first)
      .exec();
  }

  async getLatestApprovedCard() {
    return this.idCardModel
      .findOne({ status: 'Approved' }) // Only approved requests
      .sort({ created_at: -1 }) // Newest first
      .exec();
  }

  async approveIdCard(id: string): Promise<IdCard> {
    const updatedCard = await this.idCardModel
      .findByIdAndUpdate(id, { status: 'Approved' }, { new: true })
      .exec();
    // Emit WebSocket notification
    this.notificationsGateway.emitStatusUpdate(id, 'Approved', '');

    if ((updatedCard && updatedCard.userId, toString())) {
      // 2. Emit WebSocket notification with **userId** instead of card id
      this.notificationsGateway.emitStatusUpdate(
        updatedCard.userId.toString(),
        'Approved',
        '',
      );
    }
    return updatedCard;
  }

  async rejectCard(id: string, reason: string): Promise<IdCard> {
    const updatedCard = await this.idCardModel
      .findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          rejectionReason: reason,
          resubmissionAllowed: true,
        },
        { new: true },
      )
      .exec();
    // Emit WebSocket notification
    if ((updatedCard && updatedCard.userId, toString())) {
      // 2. Emit WebSocket notification with **userId** instead of card id
      this.notificationsGateway.emitStatusUpdate(
        updatedCard.userId.toString(),
        'Rejected',
        reason,
      );
    }

    return updatedCard;
  }

  // Delete Certificate
  deleteItem = async (item_id: string): Promise<any> => {
    return await this.idCardModel.deleteOne({ _id: item_id });
  };

  async findCertificateById(id: string): Promise<IdCard> {
    return this.idCardModel.findById(id);
  }

  async markAsDownloaded(id: string): Promise<void> {
    await this.idCardModel.updateOne(
      { _id: id },
      { $set: { downloaded: true } },
    );
  }

  async generateIDCardPDF(id: string, html: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true, // Uses CSS width and height
      scale: 1, // Prevents automatic scaling
    });

    await browser.close();

    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const tempFilePath = path.join(tempDir, `id_card_${id}.pdf`);
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    return tempFilePath;
  }

  async resubmitRequest(
    id: string,
    updatedData: Partial<IdCard>,
  ): Promise<IdCard> {
    const request = await this.idCardModel.findById(id);
    if (
      !request ||
      request.status !== 'Rejected' ||
      !request.resubmissionAllowed
    ) {
      throw new Error('Request cannot be resubmitted.');
    }

    const MAX_RESUBMISSIONS = 3; // Set your limit here
    if (request.resubmissionAttempts >= MAX_RESUBMISSIONS) {
      throw new Error('Maximum resubmission attempts reached.');
    }

    return this.idCardModel.findByIdAndUpdate(
      id,
      {
        ...updatedData,
        status: 'Pending',
        rejectionReason: null,
        resubmissionAllowed: false,
        $inc: { resubmissionAttempts: 1 },
      },
      { new: true },
    );
  }

  async verifyCertificate(cardId: string, hash: string): Promise<any> {
    const card = await this.idCardModel.findOne({
      _id: new Types.ObjectId(cardId),
      verificationHash: hash,
    });

    if (!card) {
      return { valid: false, message: 'Certificate not found' };
    }

    if (!card.isValid) {
      return { valid: false, message: 'Certificate has been revoked' };
    }

    // Return limited information for privacy
    return {
      valid: true,
      data: {
        bin: card.bin,
        firstname: card.firstname,
        lastname: card.lastname,
        issuingAuthority: 'Benue State citizenship/residency management system',
      },
    };
  }

  async saveVerificationHash(cardId: string, hash: string) {
    try {
      const result = await this.idCardModel.updateOne(
        { _id: new Types.ObjectId(cardId) },
        { $set: { verificationHash: hash } },
      );
      return result;
    } catch (error) {
      console.error('Error updating verification hash:', error);
      throw error;
    }
  }
}
