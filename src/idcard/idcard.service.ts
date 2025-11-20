import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdCard } from './idcard.schema';
import { UserNotFoundException } from 'src/common/exception';
import puppeteer from 'puppeteer';
import path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserDocument } from 'src/users/users.schema';
import { ResubmissionService } from '../common/services/resubmission.service';

@Injectable()
export class IdcardService {
  constructor(
    @InjectModel(IdCard.name)
    public readonly idCardModel: Model<IdCard>,
    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private resubmissionService: ResubmissionService,
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

  /**
   * Validates if a user is eligible to create a new certificate request.
   * Throws an exception if the user is not eligible.
   * @param userId The ID of the user to validate.
   */
  async canUserCreateIdcard(userId: string): Promise<void> {
    // 1. Check for existing pending requests
    const existingRequest = await this.idCardModel
      .exists({ userId, status: 'Pending' })
      .exec();
    if (existingRequest) {
      throw new ConflictException(
        'A pending card request already exists for this user.',
      );
    }

    // 2. Check for pending payments on an approved request
    const isApprovedWithPendingPayment = await this.idCardModel
      .exists({ userId, status: 'Approved', paymentStatus: 'pending' })
      .exec();
    if (isApprovedWithPendingPayment) {
      throw new ConflictException('You have a pending payment to make.');
    }

    // 3. Fetch the user to check their state of origin
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found.');
    }
  }

  async createIdCard(data: Partial<IdCard>, userId: any): Promise<IdCard> {
    try {
      const newRequest = await this.idCardModel.create(data);
      // 🔔 Send notification
      await this.notificationsService.createSystemNotification(
        userId,
        'ID Card Request Submitted',
        'Your ID card request has been successfully submitted and is pending review.',
        'idcard',
        '/dashboard/idcard-requests',
      );
      return newRequest;
    } catch (error: any) {
      if (error.code === 11000) {
        // This is a final safeguard for race conditions.
        throw new ConflictException('Identity card request already exists.');
      }
      throw new BadRequestException(
        error.message || 'Failed to create certificate.',
      );
    }
  }

  async findCardById(id: string): Promise<IdCard> {
    return this.idCardModel.findById(id);
  }

  async findRequestsByUserId(userId: string): Promise<IdCard[]> {
    return await this.idCardModel.find({ userId }).populate('userId').exec();
  }

  async getLocationStats() {
    // 1️⃣ Aggregate number of requests per location (e.g., LGA)
    const stats = await this.idCardModel.aggregate([
      {
        $group: {
          _id: '$lga', // or 'location' depending on your schema
          totalRequests: { $sum: 1 },
        },
      },
      { $sort: { totalRequests: -1 } },
    ]);

    // 2️⃣ Add coordinates manually (or from a Location model if you have one)
    const coordinates: Record<string, { lat: number; lng: number }> = {
      Ado: { lat: 7.25, lng: 7.85 },
      Agatu: { lat: 7.833, lng: 7.883 },
      Apa: { lat: 7.767, lng: 7.967 },
      Buruku: { lat: 7.45, lng: 9.2 },
      Gboko: { lat: 7.321, lng: 9.002 },
      Guma: { lat: 7.967, lng: 8.717 },
      'Gwer East': { lat: 7.433, lng: 8.75 },
      'Gwer West': { lat: 7.583, lng: 8.417 },
      'Katsina-Ala': { lat: 7.166, lng: 9.283 },
      Konshisha: { lat: 7.167, lng: 8.667 },
      Kwande: { lat: 6.833, lng: 9.5 },
      Logo: { lat: 7.483, lng: 9.133 },
      Makurdi: { lat: 7.733, lng: 8.536 },
      Obi: { lat: 7.85, lng: 8.367 },
      Ogbadibo: { lat: 7.067, lng: 7.75 },
      Ohimini: { lat: 7.25, lng: 7.933 },
      Oju: { lat: 6.85, lng: 8.417 },
      Okpokwu: { lat: 7.05, lng: 7.817 },
      Otukpo: { lat: 7.192, lng: 8.129 },
      Tarka: { lat: 7.5, lng: 9.0 },
      Ukum: { lat: 7.133, lng: 9.767 },
      Ushongo: { lat: 7.083, lng: 9.017 },
      Vandeikya: { lat: 6.783, lng: 9.067 },
    };

    // 3️⃣ Map results into frontend-friendly format
    return stats.map((item) => ({
      name: item._id || 'Unknown',
      totalRequests: item.totalRequests,
      lat: coordinates[item._id]?.lat || 7.5, // fallback center
      lng: coordinates[item._id]?.lng || 8.8,
    }));
  }

  async findById(id: string): Promise<IdCard> {
    const user = await this.idCardModel
      .findById(id)
      .populate('approvedBy', 'firstname lastname email')
      .populate(
        'userId',
        'firstname lastname email isProfileCompleted stateOfOrigin lgaOfOrigin',
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

  async approveIdCard(id: string, approvedBy: string): Promise<IdCard> {
    const request = await this.idCardModel
      .findByIdAndUpdate(
        id,
        {
          status: 'Approved',
          approvalDate: new Date(),
          approvedBy: new Types.ObjectId(approvedBy),
        },
        { new: true },
      )
      .exec();
    if (request) {
      await this.notificationsService.createSystemNotification(
        request.userId,
        'ID Card Approved',
        'Congratulations! Your ID card request has been approved.',
        'idcard',
        '/dashboard/idcard-requests',
      );
    }
    return request;
  }

  async rejectCard(
    id: string,
    reason: string,
    rejectedBy: string,
  ): Promise<IdCard> {
    const request = await this.idCardModel
      .findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          rejectionReason: reason,
          resubmissionAllowed: true,
          approvedBy: new Types.ObjectId(rejectedBy),
          approvalDate: new Date(),
        },
        { new: true },
      )
      .exec();
    if (request) {
      await this.notificationsService.createSystemNotification(
        request.userId,
        'ID Card Request Rejected',
        `Your ID card request was rejected. Reason: ${reason}`,
        'idcard',
        '/dashboard/idcard-requests',
      );
    }

    return request;
  }

  // Delete Certificate
  deleteItem = async (item_id: string): Promise<any> => {
    return await this.idCardModel.deleteOne({ _id: item_id });
  };

  async findCertificateById(id: string): Promise<IdCard> {
    return this.idCardModel.findById(id);
  }

  // async markAsDownloaded(id: string): Promise<void> {
  //   await this.idCardModel.updateOne(
  //     { _id: id },
  //     { $set: { downloaded: true } },
  //   );
  // }

  async markAsDownloadedForThreeMonths(id: string): Promise<void> {
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 3); // +3 months
    // expiry.setMinutes(expiry.getMinutes() + 10); // +10 minutes

    await this.idCardModel.updateOne(
      { _id: id },
      {
        $set: {
          downloaded: true,
          downloadExpiryDate: expiry,
        },
      },
    );
  }

  async generateIDCardPDF(id: string, html: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Debugging
    page.on('requestfailed', (request) => {
      console.error('❌ Request failed:', request.url(), request.failure());
    });

    page.on('console', (msg) => {
      console.log('📄 PAGE LOG:', msg.text());
    });

    // More lenient wait
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 60000,
    });

    const pdfBuffer = await page.pdf({
      printBackground: true,
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
      preferCSSPageSize: true,
      scale: 1,
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

  /**
   * Resubmit a rejected ID card request
   * @param id The ID card ID
   * @param updatedData The updated ID card data
   * @returns The updated ID card
   */
  async resubmitRequest(
    id: string,
    updatedData: Partial<IdCard>,
  ): Promise<IdCard> {
    return this.resubmissionService.resubmitRequest(
      this.idCardModel,
      id,
      updatedData,
      'ID Card',
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

  /**
   * Updates the payment status of an ID card request.
   * @param id The ID of the ID card request.
   * @param status The new payment status ('paid', 'failed', etc.).
   * @returns The updated ID card document.
   */
  async updatePaymentStatus(id: string, status: string): Promise<IdCard> {
    const updatedCard = await this.idCardModel
      .findByIdAndUpdate(
        id,
        { paymentStatus: status },
        { new: true }, // Return the updated document
      )
      .exec();

    if (!updatedCard) {
      throw new NotFoundException(`ID Card request with ID ${id} not found.`);
    }
    return updatedCard;
  }
}
