import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IdCard } from './idcard.schema';
import { UserNotFoundException } from 'src/common/exception';
import puppeteer from 'puppeteer';
import path from 'path';
import * as fs from 'fs';
import { Types } from 'mongoose';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserDocument } from 'src/users/users.schema';
import { ResubmissionService } from '../common/services/resubmission.service';
import { ReprintResponseDto } from 'src/indigene-certificate/dto/request-reprint.dto';
import { CurrentUser } from 'src/common/decorators/current-user,decorator';
import { TransactionService } from 'src/transaction/transaction.service';
import { Logger } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as crypto from 'crypto';
import QRCode from 'qrcode';
import config from 'src/config';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Transaction } from 'src/transaction/transaction.schema';

@Injectable()
export class IdcardService {
  private readonly logger = new Logger(IdcardService.name);
  constructor(
    @InjectModel(IdCard.name)
    public readonly idCardModel: Model<IdCard>,
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,

    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private resubmissionService: ResubmissionService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @InjectModel('Transaction') private transactionModel: Model<Transaction>,
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

  // Inside IdCardService

  async findOneCard(id: string, userId: string) {
    return this.idCardModel.findOne({ _id: id, userId: userId }).exec();
  }

  async updateIdCard(id: string, updateData: any, userId: string) {
    // Optionally verify ownership again inside transaction
    const updated = await this.idCardModel
      .findOneAndUpdate(
        { _id: id, userId: userId },
        updateData,
        { new: true }, // Return updated doc
      )
      .exec();

    if (!updated) {
      throw new NotFoundException(
        'Failed to update request or request not found.',
      );
    }
    return updated;
  }

  async findCardById(id: string): Promise<IdCard> {
    return this.idCardModel.findById(id);
  }

  async findRequestsByUserId(userId: string): Promise<IdCard[]> {
    return await this.idCardModel
      .find({ userId })
      .sort({ created_at: -1 })
      .populate('userId')
      .exec();
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
    if (!reason || reason.trim() === '') {
      throw new BadRequestException(
        'Rejection reason is required. Please provide a reason for rejecting this ID card request.',
      );
    }
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

  async findCertificateById(id: string): Promise<IdCard> {
    return this.idCardModel.findById(id);
  }

  async markAsDownloadedForThreeMonths(id: string): Promise<void> {
    const expiry = new Date();
    // expiry.setMonth(expiry.getMonth() + 3); // +3 months
    expiry.setMinutes(expiry.getMinutes() + 10); // +10 minutes

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

  async validateDownloadCount(id: string): Promise<IdCard> {
    // 3. ATOMIC INCREMENT WITH LIMIT CHECK
    // We try to increment. The query condition ensures we only increment if under the limit.
    const MAX_DOWNLOADS = 3;
    const result = await this.idCardModel.findOneAndUpdate(
      {
        _id: id,
        downloadCount: { $lt: MAX_DOWNLOADS }, // Only update if count < 3
      },
      { $inc: { downloadCount: 1 } },
      { new: true }, // Return the updated document
    );

    // 4. If result is null, it means the condition failed (Limit reached)
    if (!result) {
      throw new HttpException(
        `Download limit of ${MAX_DOWNLOADS} reached for this window. Please request a reprint.`,
        HttpStatus.FORBIDDEN,
      );
    }
    return result;
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

  private async initializePayment(data: {
    documentId: string;
    userId: string;
    amount: number;
    email: string;
    currency?: string;
    reference?: string;
    documentAmount: number;
    documentType: 'idcard';
  }) {
    try {
      return await this.transactionService.initializeReprintPayment({
        ...data,
      });
    } catch (error) {
      this.logger.error('Reprint payment initialization failed', error?.stack);
      throw new InternalServerErrorException(
        'Failed to initialize payment. Try again later.',
      );
    }
  }

  private buildResponse(paymentResult: any): ReprintResponseDto {
    return {
      success: true,
      message: 'Reprint request received. Complete payment to proceed.',
      data: {
        paymentReference: paymentResult.data.reference,
        amount: paymentResult.data.amount,
        skipCredo: paymentResult.data.skipCredo,
      },
    };
  }
  async updateReprintPaymentStatus(
    id: string,
    status: 'Pending' | 'Paid' | 'NotRequired',
  ): Promise<IdCard> {
    return this.idCardModel
      .findByIdAndUpdate(
        id,
        {
          reprintPaymentStatus: status,
          requiresReprintPayment: status !== 'NotRequired',
        },
        { new: true },
      )
      .exec();
  }

  async confirmReprintPayment(
    id: string,
    paymentReference: string,
    rrr: string,
  ): Promise<IdCard> {
    const now = new Date();
    // const thirtyDaysFromNow = new Date(
    //   now.getTime() + 30 * 24 * 60 * 60 * 1000,
    // );
    const thirtyDaysFromNow = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for testing

    const updatedIdcard = await this.idCardModel
      .findByIdAndUpdate(
        id,
        {
          reprintPaymentStatus: 'Paid',
          $inc: { reprintCount: 1 },
          lastReprintDate: now,
          reprintDownloadExpiryDate: thirtyDaysFromNow,
          requiresReprintPayment: false,
          downloadCount: 0,
        },
        { new: true },
      )
      .exec();

    if (!updatedIdcard) {
      throw new NotFoundException('Auctioneer request not found.');
    }
    // This ensures the transaction record moves from 'service_paid' to 'success'
    if (paymentReference) {
      await this.transactionModel
        .updateOne(
          { reference: paymentReference },
          {
            $set: {
              status: 'success',
              rrr: rrr,
              verified: true,
              verifiedAt: new Date(),
            },
          },
        )
        .exec();
    }

    return updatedIdcard;
  }
  async incrementReprintCount(cardId: string): Promise<void> {
    await this.idCardModel.findByIdAndUpdate(cardId, {
      $inc: { reprintCount: 1 },
    });
  }

  private async getAndAuthorizeIdCard(id: string, userId: string) {
    const idCard = await this.idCardModel.findById(id);

    if (!idCard) {
      throw new NotFoundException('Id Card not found');
    }

    const ownerId = this.extractOwnerId(idCard);
    if (ownerId !== userId) {
      this.logger.warn(`User ${userId} unauthorized access to idCard ${id}`);
      throw new ForbiddenException(
        'Not authorized to request reprint for this idCard',
      );
    }

    return idCard;
  }

  private extractOwnerId(idcard: any): string {
    return typeof idcard.userId === 'string'
      ? idcard.userId
      : idcard.userId._id.toString();
  }

  private validateDownloadWindowExpired(auctioneer: any): void {
    const MAX_DOWNLOADS = 3;
    const now = new Date();

    // 1. Check Time Window
    const isTimeExpired =
      auctioneer.downloadExpiryDate &&
      new Date(auctioneer.downloadExpiryDate) < now;

    // 2. Check Download Limit
    const isLimitReached = (auctioneer.downloadCount || 0) >= MAX_DOWNLOADS;

    // 3. Decision Logic
    // If time is NOT expired AND limit is NOT reached -> Block request
    if (!isTimeExpired && !isLimitReached) {
      throw new BadRequestException(
        'Download window is still active and you have downloads remaining. Please download from your dashboard.',
      );
    }

    // If we reach here: Time is expired OR Limit is reached -> Allow Reprint
  }

  async requestReprint(
    cardId: string,
    data: {
      documentId: string;
      userId: string;
      amount: number;
      email: string;
      currency?: string;
      reference?: string;
      documentAmount: number;
      documentType: 'idcard';
    },
  ): Promise<ReprintResponseDto> {
    const idcard = await this.getAndAuthorizeIdCard(cardId, data.userId);
    this.validateDownloadWindowExpired(idcard);

    const paymentResult = await this.initializePayment(data);
    await this.updateReprintPaymentStatus(cardId, 'Pending');

    return this.buildResponse(paymentResult);
  }

  private validatePaymentStatus(idcard: any): void {
    if (idcard.reprintPaymentStatus !== 'Paid') {
      throw new HttpException(
        'Reprint payment is required to download this ID Card.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private validateDownloadWindow(idcard: any): void {
    if (
      !idcard.reprintDownloadExpiryDate ||
      idcard.reprintDownloadExpiryDate < new Date()
    ) {
      throw new HttpException(
        'The reprint download window has expired. Please request a new reprint.',
        HttpStatus.GONE,
      );
    }
  }

  private generateSecureHash(
    id: string,
    firstname: string,
    lastname: string,
    dateOfIssue: Date,
  ): string {
    const secret = process.env.HASH_SECRET; // Store in .env
    const data = `${id}:${firstname}:${lastname}:${dateOfIssue.toISOString()}`;
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')
      .substring(0, 12); // First 12 chars for QR code
  }

  private async generateVerificationData(idcard: any, owner: any) {
    const dateOfReprint = new Date();
    const hash = this.generateSecureHash(
      idcard.id,
      owner.firstname,
      owner.lastname,
      dateOfReprint,
    );

    const baseUrl = this.getBaseUrl();
    const qrCodeData = `${baseUrl}/api/idard/view/${idcard.id}`;
    const qrCodeUrl = await this.generateQrCode(qrCodeData);

    return { hash, qrCodeUrl };
  }

  private async generateQrCode(data: string): Promise<string> {
    try {
      if (!data) {
        throw new Error('Input data is required');
      }
      const qrCodeUrl = await QRCode.toDataURL(data);
      return qrCodeUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  private getBaseUrl(): string {
    return config.isDev
      ? process.env.BASE_URL || 'http://localhost:5000'
      : 'https://api.citizenship.benuestate.gov.ng';
  }

  private async generatePdf(auctioneer: any, owner: any): Promise<Buffer> {
    const htmlTemplate = await this.loadHtmlTemplate('card-template.html');
    const populatedHtml = this.populateHtmlTemplate(
      htmlTemplate,
      auctioneer,
      owner,
    );

    const filePath = await this.generateIdCardPDF(
      `reprint-${auctioneer.id}`,
      populatedHtml,
    );
    return fs.promises.readFile(filePath);
  }

  private async loadHtmlTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '..',
      '..',
      'templates',
      templateName,
    );
    return fs.promises.readFile(templatePath, 'utf8');
  }

  private populateHtmlTemplate(html: string, data: any, user: any): string {
    console.log('Populating HTML template with data:', data, user);
    const dob = new Date(user.DOB);

    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';

    const formattedDOB = dob
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(',', '');

    const dateOfIssue = new Date();
    const formattedDateOfIssue = dateOfIssue
      .toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .replace(',', '');

    return html
      .replace(/{{baseUrl}}/g, getBaseUrl())
      .replace(/{{name}}/g, user.firstname + ' ' + user.middlename)
      .replace(/{{surname}}/g, data.lastname)
      .replace(/{{dob}}/g, formattedDOB)
      .replace(/{{bin}}/g, data.bin)
      .replace(/{{passportPhoto}}/g, data.passportPhoto)
      .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
      .replace(/{{issueDate}}/g, formattedDateOfIssue)
      .replace(/{{gender}}/g, user.gender);
  }

  async generateIdCardPDF(id: string, html: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      timeout: 60000, // Increase the timeout to 60 seconds
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

  async prepareReprintDownload(
    cardId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const idcard = await this.getAndAuthorizeIdCard(cardId, userId);

    this.validatePaymentStatus(idcard);
    this.validateDownloadWindow(idcard);

    const owner = await this.userService.findById(this.extractOwnerId(idcard));
    const { hash, qrCodeUrl } = await this.generateVerificationData(
      idcard,
      owner,
    );

    await this.incrementReprintCount(cardId);

    await this.saveVerificationHash(cardId, hash);

    // 3. ATOMIC INCREMENT WITH LIMIT CHECK
    // We try to increment. The query condition ensures we only increment if under the limit.
    const MAX_DOWNLOADS = 3;
    const result = await this.idCardModel.findOneAndUpdate(
      {
        _id: cardId,
        downloadCount: { $lt: MAX_DOWNLOADS }, // Only update if count < 3
      },
      { $inc: { downloadCount: 1 } },
      { new: true }, // Return the updated document
    );

    // 4. If result is null, it means the condition failed (Limit reached)
    if (!result) {
      throw new HttpException(
        `Download limit of ${MAX_DOWNLOADS} reached for this window. Please request a reprint.`,
        HttpStatus.FORBIDDEN,
      );
    }
    // Attach qrCodeUrl to idcard object for PDF generation
    idcard.qrCodeUrl = qrCodeUrl;

    const pdfBuffer = await this.generatePdf(idcard, owner);

    return {
      buffer: pdfBuffer,
      filename: 'auctioneer-lincence-reprint.pdf',
    };
  }

  deleteItem = async (item_id: string): Promise<any> => {
    // 1️⃣ Find record first
    const record = await this.idCardModel.findById(item_id);

    if (!record) {
      throw new NotFoundException('ID Card record not found');
    }

    // Helper function to safely delete from Cloudinary
    const deleteFromCloudinary = async (url: string) => {
      if (url) {
        const publicId = this.cloudinaryService.getFullPublicIdFromUrl(url);
        if (publicId) {
          try {
            await this.cloudinaryService.deleteFile(publicId);
          } catch (err) {
            console.error(`Failed to delete file ${publicId}:`, err);
            // We usually continue even if file deletion fails to ensure the DB record is removed
          }
        }
      }
    };

    // 2️⃣ Delete all associated files from Cloudinary
    // Delete Passport Photo
    if (record.passportPhoto) {
      await deleteFromCloudinary(record.passportPhoto);
    }

    // Delete Reference Letter
    if (record.ref_letter) {
      await deleteFromCloudinary(record.ref_letter);
    }

    // Delete Utility Bill
    if (record.utilityBill) {
      await deleteFromCloudinary(record.utilityBill);
    }

    // 3️⃣ Delete from database
    await this.idCardModel.deleteOne({ _id: item_id });

    return {
      success: true,
      message: 'ID Card request deleted successfully',
    };
  };
}
