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
import {
  CreateAuctioneerDto,
  ReprintResponseDto,
  UpdateAuctioneerDto,
} from './dto/autioneer.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Auctioneer } from './auctioneer.schema';
import { UsersService } from 'src/users/users.service';
import {
  Counter,
  CounterDocument,
} from 'src/indigene-certificate/counter.schema';
import { NotificationsService } from 'src/notifications/notifications.service';
import { UserNotFoundException } from 'src/common/exception';
import { ResubmissionService } from 'src/common/services/resubmission.service';
import { fileUploadConfig } from 'src/config/file-upload.config';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { TransactionService } from 'src/transaction/transaction.service';
import { Logger } from '@nestjs/common';
import config from 'src/config';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import QRCode from 'qrcode';
import * as puppeteer from 'puppeteer';
import { Readable } from 'stream';
import { Transaction } from 'src/transaction/transaction.schema';

@Injectable()
export class AuctioneerService {
  private readonly logger = new Logger(AuctioneerService.name);
  constructor(
    @InjectModel(Auctioneer.name)
    private readonly auctioneerModel: Model<Auctioneer>,
    private readonly userService: UsersService,
    @InjectModel(Counter.name)
    public readonly counterModel: Model<CounterDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly resubmissionService: ResubmissionService,
    private readonly cloudinaryService: CloudinaryService,
    @Inject(forwardRef(() => TransactionService))
    private readonly transactionService: TransactionService,
    @InjectModel('Transaction') private transactionModel: Model<Transaction>,
  ) {}
  /**
   * Validates if a user is eligible to create a new auctioneer request.
   * Throws an exception if the user is not eligible.
   * @param userId The ID of the user to validate.
   */
  async canUserCreateAuctioneer(userId: string): Promise<void> {
    // 1. Check for existing pending requests
    const existingRequest = await this.auctioneerModel
      .exists({ userId, status: 'Pending' })
      .exec();
    if (existingRequest) {
      throw new ConflictException(
        'A pending Auctioneer request already exists for this user.',
      );
    }

    // 2. Check for pending payments on an approved request
    const isApprovedWithPendingPayment = await this.auctioneerModel
      .exists({ userId, status: 'Approved', paymentStatus: 'pending' })
      .exec();
    if (isApprovedWithPendingPayment) {
      throw new ConflictException('You have a pending payment to make.');
    }
  }

  async createAuctioneerWithDocument(
    dto: CreateAuctioneerDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    const taxClearanceUrl = await this.uploadDocument(file);
    const licenseData = await this.generateLicenseData();

    const dataToSave = {
      ...dto,
      ...licenseData,
      taxClearance: taxClearanceUrl,
    };

    return this.createAuctioneer(dataToSave, userId);
  }

  private async uploadDocument(
    file?: Express.Multer.File,
  ): Promise<string | undefined> {
    if (!file) return undefined;

    try {
      return await this.cloudinaryService.uploadFile(
        file,
        fileUploadConfig.folders.taxClearance,
        fileUploadConfig.allowedMimeTypes,
        5,
      );
    } catch (error) {
      const err = error as Error; // Assert type
      throw new BadRequestException(
        `Tax Clearance upload failed: ${err.message}`,
      );
    }
  }

  private async generateLicenseData() {
    const licence = await this.generateLicenseNumber();
    const { sequence, formatted } = await this.generateFourDigitNumber();

    return {
      licenceRefSequence: licence.sequence,
      licenceRefNumber: licence.formatted,
      sequenceNumber: sequence,
      formattedNumber: formatted,
    };
  }

  // Existing methods remain unchanged
  async createAuctioneer(data: CreateAuctioneerDto, userId: string) {
    try {
      const auctioneer = await this.auctioneerModel.create({ ...data });

      await this.notificationsService.createSystemNotification(
        userId,
        'Auctioneer licence Request Submitted',
        'Your auctioneer licence request has been submitted for processing.',
        'auctioneer',
        '/dashboard/auctioneer licence-requests',
        data.LGA,
      );

      return auctioneer;
    } catch (error) {
      const err = error as any; // Assert type
      if (err.code === 11000) {
        // This is a final safeguard for race conditions.
        throw new ConflictException(
          'Auctioneer licence request already exists.',
        );
      }
      throw new BadRequestException(
        err.message || 'Failed to Auctioneer licence.',
      );
    }
  }

  async generateLicenseNumber(): Promise<{
    sequence: number;
    formatted: string;
  }> {
    const counter = await this.counterModel.findOneAndUpdate(
      { key: 'auctioneerLicenceRef' },
      { $inc: { value: 1 } },
      { new: true, upsert: true },
    );

    const sequence = counter.value;

    return {
      sequence,
      formatted: `BNT ${sequence}`,
    };
  }

  async generateFourDigitNumber(): Promise<{
    sequence: number;
    formatted: string;
  }> {
    const counter = await this.counterModel.findOneAndUpdate(
      { key: 'auctioneerLicenceNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true },
    );

    const sequence = counter.value;

    return {
      sequence,
      formatted: sequence.toString().padStart(4, '0'),
    };
  }

  async updateAuctioneer(
    id: string,
    dto: UpdateAuctioneerDto,
    userId: string,
    file?: Express.Multer.File,
  ) {
    // 1. Find existing record and verify ownership
    const auctioneer = await this.auctioneerModel.findOne({ _id: id, userId });

    if (!auctioneer) {
      throw new NotFoundException('Auctioneer request not found.');
    }

    // 2. Validate Status (Only Pending or Rejected can be edited)
    if (!['Pending', 'Rejected'].includes(auctioneer.status)) {
      throw new BadRequestException(
        'Cannot edit a request that is already approved or processed.',
      );
    }

    // 3. Handle File Upload
    // If a new file is provided, upload it. Otherwise, keep the existing URL.
    let taxClearanceUrl = auctioneer.taxClearance;
    if (file) {
      taxClearanceUrl = await this.uploadDocument(file);
    }

    // 4. Prepare Update Data
    // We merge the DTO.
    // NOTE: We specifically DO NOT call generateLicenseData() here.
    // License numbers are generated once on creation. Updating details (address, etc.)
    // should not change the generated reference number.
    const updateData = {
      ...dto,
      taxClearance: taxClearanceUrl,
    };

    // 5. Persist Changes
    Object.assign(auctioneer, updateData);
    return auctioneer.save();
  }

  async findAuctioneerById(id: string): Promise<Auctioneer> {
    return this.auctioneerModel.findById(id);
  }

  async findTransactionByAuctioneerId(
    auctioneerId: string,
  ): Promise<Transaction | null> {
    return this.transactionModel
      .findOne({ auctioneerId, status: 'success' })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getAuctRequest() {
    return await this.auctioneerModel
      .find({})
      .sort({ created_at: -1 })
      .populate('approvedBy', 'firstname lastname email')
      .populate(
        'userId',
        'firstname lastname email stateOfOrigin lgaOfOrigin isProfileCompleted ',
      )
      .exec();
  }

  // async approveLincence(id: string, approvedBy: string): Promise<Auctioneer> {
  //   const request = await this.auctioneerModel
  //     .findByIdAndUpdate(
  //       id,
  //       {
  //         status: 'Approved',
  //         approvalDate: new Date(),
  //         approvedBy: new Types.ObjectId(approvedBy),
  //       },
  //       { new: true },
  //     )
  //     .exec();

  //   if (request) {
  //     // Extract the user ID as a string
  //     const userId =
  //       typeof request.userId === 'string'
  //         ? request.userId
  //         : (request.userId as any)._id.toString();

  //     await this.notificationsService.createSystemNotification(
  //       userId,
  //       'Auctioneer Approved',
  //       'Congratulations! Your auctioneer request has been approved.',
  //       'auctioneer',
  //       '/dashboard/auctioneer-requests',
  //     );
  //   }

  //   return request;
  // }

  async approveLincence(id: string, approvedBy: string): Promise<Auctioneer> {
    const now = new Date();

    // Calculate exactly 1 year from now
    const oneYearFromNow = new Date(now);
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const request = await this.auctioneerModel
      .findByIdAndUpdate(
        id,
        {
          status: 'Approved',
          approvalDate: now,
          issueDate: now, // Set issue date
          expiryDate: oneYearFromNow, // Set 1-year expiry
          approvedBy: new Types.ObjectId(approvedBy),
        },
        { new: true },
      )
      .exec();

    if (request) {
      const userId =
        typeof request.userId === 'string'
          ? request.userId
          : (request.userId as any)._id.toString();

      await this.notificationsService.createSystemNotification(
        userId,
        'Auctioneer Approved',
        'Congratulations! Your auctioneer request has been approved.',
        'auctioneer',
        '/dashboard/auctioneer-requests',
      );
    }

    return request;
  }

  async rejectAuctioneerRequest(
    id: string,
    rejectionReason: string,
    rejectedBy: string,
  ): Promise<Auctioneer> {
    // Notify user
    const auctioneer = await this.auctioneerModel
      .findById(id)
      .populate('userId');
    if (!auctioneer) {
      throw UserNotFoundException();
    }

    // Use a type guard to check if userId is a User object
    if (
      typeof auctioneer.userId !== 'string' &&
      auctioneer.userId &&
      typeof (auctioneer.userId as any).email === 'string'
    ) {
      await this.userService.sendRequest(
        (auctioneer.userId as any).email,
        ' Request rejected',
        `Rejection Reason: ${rejectionReason}
           `,
      );
    }
    const request = await this.auctioneerModel
      .findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          rejectionReason: rejectionReason,
          resubmissionAllowed: true,
          approvalDate: new Date(),
          approvedBy: new Types.ObjectId(rejectedBy),
        },
        { new: true },
      )
      .exec();

    if (request) {
      // Extract the user ID as a string
      const userId =
        typeof request.userId === 'string'
          ? request.userId
          : (request.userId as any)._id.toString();
      await this.notificationsService.createSystemNotification(
        userId,
        'Auctioneer Lincence Request Rejected',
        `Your Lincence request was rejected. Reason: ${rejectionReason}`,
        'auctioneer',
        '/dashboard/auctioneer-requests',
      );
    }
    return request;
  }

  async resubmitWithDocument(
    id: string,
    updatedData: UpdateAuctioneerDto,
    file: Express.Multer.File | undefined,
    documentType: keyof typeof fileUploadConfig.folders,
  ): Promise<Auctioneer> {
    const existing = await this.auctioneerModel.findById(id);
    if (!existing) throw new NotFoundException('Record not found');

    let dataToSave = { ...updatedData };

    // ✅ Only process file if it exists
    if (file) {
      const oldUrl = existing[documentType];
      if (oldUrl) await this.cloudinaryService.deleteFile(oldUrl);

      const folder = fileUploadConfig.folders[documentType];
      const newUrl = await this.cloudinaryService.uploadFile(file, folder);

      dataToSave = { ...dataToSave, [documentType]: newUrl };
    }

    return this.resubmissionService.resubmitRequest(
      this.auctioneerModel,
      id,
      dataToSave,
      'Auctioneer license request resubmitted successfully.',
    );
  }

  async saveVerificationHash(auctioneerId: string, hash: string) {
    try {
      const result = await this.auctioneerModel.updateOne(
        { _id: new Types.ObjectId(auctioneerId) },
        { $set: { verificationHash: hash } },
      );
      return result;
    } catch (error) {
      console.error('Error updating verification hash:', error);
      throw error;
    }
  }

  async requestReprint(data: {
    documentId: string;
    userId: string;
    amount: number;
    email: string;
    currency?: string;
    reference?: string;
    documentAmount: number;
    documentType: 'auctioneer';
  }): Promise<ReprintResponseDto> {
    const auctioneer = await this.getAndAuthorizeAuctioneerLincence(
      data.documentId,
      data.userId,
    );

    this.validateDownloadWindowExpired(auctioneer);

    const paymentResult = await this.initializePayment(data);

    await this.updateReprintPaymentStatus(data.documentId, 'Pending');

    return this.buildResponse(paymentResult);
  }

  private async getAndAuthorizeAuctioneerLincence(id: string, userId: string) {
    const auctioneer = await this.auctioneerModel.findById(id);

    if (!auctioneer) {
      throw new NotFoundException('Auctioneer not found');
    }

    const ownerId = this.extractOwnerId(auctioneer);
    if (ownerId !== userId) {
      this.logger.warn(
        `User ${userId} unauthorized access to auctioneer ${id}`,
      );
      throw new ForbiddenException(
        'Not authorized to request reprint for this auctioneer',
      );
    }

    return auctioneer;
  }

  private extractOwnerId(auctioneer: any): string {
    return typeof auctioneer.userId === 'string'
      ? auctioneer.userId
      : auctioneer.userId._id.toString();
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
  private async initializePayment(data: {
    documentId: string;
    userId: string;
    amount: number;
    email: string;
    currency?: string;
    reference?: string;
    documentAmount: number;
    documentType: 'auctioneer';
  }) {
    try {
      return await this.transactionService.initializeReprintPayment({
        ...data,
      });
    } catch (error) {
      const err = error as Error; // Assert type
      this.logger.error('Reprint payment initialization failed', err?.stack);
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
    autioneerId: string,
    status: 'Pending' | 'Paid' | 'NotRequired',
  ): Promise<Auctioneer> {
    return this.auctioneerModel
      .findByIdAndUpdate(
        autioneerId,
        {
          reprintPaymentStatus: status,
          requiresReprintPayment: status !== 'NotRequired',
        },
        { new: true },
      )
      .exec();
  }

  // async confirmReprintPayment(
  //   autioneerId: string,
  //   paymentReference: string,
  //   rrr: string,
  // ): Promise<Auctioneer> {
  //   const now = new Date();
  //   // const thirtyDaysFromNow = new Date(
  //   //   now.getTime() + 30 * 24 * 60 * 60 * 1000,
  //   // );
  //   const thirtyDaysFromNow = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for testing

  //   const updatedAuctioneer = await this.auctioneerModel
  //     .findByIdAndUpdate(
  //       autioneerId,
  //       {
  //         reprintPaymentStatus: 'Paid',
  //         $inc: { reprintCount: 1 },
  //         lastReprintDate: now,
  //         reprintDownloadExpiryDate: thirtyDaysFromNow,
  //         requiresReprintPayment: false,
  //         downloadCount: 0,
  //       },
  //       { new: true },
  //     )
  //     .exec();

  //   if (!updatedAuctioneer) {
  //     throw new NotFoundException('Auctioneer request not found.');
  //   }

  //   // This ensures the transaction record moves from 'service_paid' to 'success'
  //   if (paymentReference) {
  //     await this.transactionModel
  //       .updateOne(
  //         { reference: paymentReference },
  //         {
  //           $set: {
  //             status: 'success',
  //             rrr: rrr,
  //             verified: true,
  //             verifiedAt: new Date(),
  //           },
  //         },
  //       )
  //       .exec();
  //   }

  //   return updatedAuctioneer;
  // }

  // ============================================
  // NEW LOGIC: GRANT DOWNLOAD ACCESS
  // ============================================
  async grantReprintDownloadAccess(auctioneerId: string): Promise<Auctioneer> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(Date.now() + 10 * 60 * 1000); // 10 mins for testing (change to 30 days for prod)

    const updatedAuctioneer = await this.auctioneerModel
      .findByIdAndUpdate(
        auctioneerId,
        {
          reprintPaymentStatus: 'Paid',
          $inc: { reprintCount: 1 },
          lastReprintDate: now,
          reprintDownloadExpiryDate: thirtyDaysFromNow,
          requiresReprintPayment: false,
          downloadCount: 0, // Reset download count for the new window
        },
        { new: true },
      )
      .exec();

    if (!updatedAuctioneer) {
      throw new NotFoundException('Auctioneer request not found.');
    }

    return updatedAuctioneer;
  }

  async prepareReprintDownload(
    auctioneerId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const auctionerr = await this.getAndAuthorizeAuctioneerLincence(
      auctioneerId,
      userId,
    );

    this.validatePaymentStatus(auctionerr);
    this.validateDownloadWindow(auctionerr);

    const owner = await this.userService.findById(
      this.extractOwnerId(auctionerr),
    );
    const { hash, qrCodeUrl } = await this.generateVerificationData(
      auctionerr,
      owner,
    );

    await this.incrementReprintCount(auctioneerId);

    await this.saveVerificationHash(auctioneerId, hash);

    // 3. ATOMIC INCREMENT WITH LIMIT CHECK
    // We try to increment. The query condition ensures we only increment if under the limit.
    const MAX_DOWNLOADS = 3;
    const result = await this.auctioneerModel.findOneAndUpdate(
      {
        _id: auctioneerId,
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

    // Attach qrCodeUrl to auctionerr object for PDF generation
    auctionerr.qrCodeUrl = qrCodeUrl;

    const pdfBuffer = await this.generatePdf(auctionerr, owner);

    return {
      buffer: pdfBuffer,
      filename: 'auctioneer-lincence-reprint.pdf',
    };
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

  private validatePaymentStatus(auctioneer: any): void {
    if (auctioneer.reprintPaymentStatus !== 'Paid') {
      throw new HttpException(
        'Reprint payment is required to download this auctioneer.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  private validateDownloadWindow(auctioneer: any): void {
    const now = new Date();

    // 1. Check if the initial 10-minute window is active
    const isInitialActive =
      auctioneer.downloadExpiryDate &&
      new Date(auctioneer.downloadExpiryDate) > now;

    // 2. Check if the 30-day reprint window is active
    const isReprintActive =
      auctioneer.reprintDownloadExpiryDate &&
      new Date(auctioneer.reprintDownloadExpiryDate) > now;

    // 3. LOGIC GATE: If NEITHER are active, block the download.
    if (!isInitialActive && !isReprintActive) {
      throw new HttpException(
        'The download window has expired. Please request a reprint to generate a new link.',
        HttpStatus.GONE, // 410 error
      );
    }
  }

  private async generateVerificationData(auctioneer: any, owner: any) {
    const dateOfReprint = new Date();
    const hash = this.generateSecureHash(
      auctioneer.id,
      owner.firstname,
      owner.lastname,
      dateOfReprint,
    );

    const baseUrl = this.getBaseUrl();
    const qrCodeData = `${baseUrl}/api/auctioneer/view/${auctioneer.id}`;
    const qrCodeUrl = await this.generateQrCode(qrCodeData);

    return { hash, qrCodeUrl };
  }

  private getBaseUrl(): string {
    return config.isDev
      ? process.env.BASE_URL || 'http://localhost:5000'
      : 'https://api.citizenship.benuestate.gov.ng';
  }

  // private async generatePdf(auctioneer: any, owner: any): Promise<Buffer> {
  //   const htmlTemplate = await this.loadHtmlTemplate(
  //     'auctioneer-template.html',
  //   );
  //   const populatedHtml = this.populateHtmlTemplate(
  //     htmlTemplate,
  //     auctioneer,
  //     owner,
  //   );

  //   const filePath = await this.generateAuctioneerPDF(
  //     `reprint-${auctioneer.id}`,
  //     populatedHtml,
  //   );
  //   return fs.promises.readFile(filePath);
  // }

  private async generatePdf(auctioneer: any, owner: any): Promise<Buffer> {
    const htmlTemplate = await this.loadHtmlTemplate(
      'auctioneer-template.html',
    );

    // Fetch the transaction for this auctioneer
    const transaction = await this.findTransactionByAuctioneerId(auctioneer.id);

    const populatedHtml = this.populateHtmlTemplate(
      htmlTemplate,
      auctioneer,
      owner,
      transaction,
    );

    const filePath = await this.generateAuctioneerPDF(
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

  private populateHtmlTemplate(
    html: string,
    data: any,
    user: any,
    transaction?: Transaction | null,
  ): string {
    const date = new Date(data.DOB);

    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';

    // Helper: Convert to Title Case
    const toTitleCase = (value: string): string => {
      if (!value) return '';
      return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    };

    // Helper: Uppercase safely
    const toUpper = (value: string): string => {
      return value ? value.toUpperCase() : '';
    };

    // Helper: Format currency from kobo to Naira (₦)
    const formatCurrency = (amount: number): string => {
      if (amount === null || amount === undefined) return 'N/A';

      // Convert from kobo to Naira
      const nairaAmount = amount / 100;

      // Format with commas and the Naira sign
      return `₦${nairaAmount.toLocaleString('en-NG')}`;
    };

    const fullName = `${toTitleCase(user.firstname)} ${toTitleCase(
      user.middlename || '',
    )} ${toTitleCase(user.lastname)}`.trim();

    // Formats day with ordinal suffix (e.g., 1st, 2nd, 3rd, 15th, 31st)
    const formatOrdinal = (day: number): string => {
      const j = day % 10;
      const k = day % 100;
      if (j === 1 && k !== 11) return `${day}st`;
      if (j === 2 && k !== 12) return `${day}nd`;
      if (j === 3 && k !== 13) return `${day}rd`;
      return `${day}th`;
    };

    // Gets the full month name (e.g., "January")
    const getMonthName = (date: Date): string => {
      return date.toLocaleString('en-US', { month: 'long' });
    };

    // Gets the last two digits of the year (e.g., "26" for 2026)
    const getShortYear = (date: Date): string => {
      return date.getFullYear().toString().slice(-2);
    };

    // Determine dates (fallback to current date if missing)
    const issueDate = new Date(
      data.issueDate || data.approvalDate || Date.now(),
    );
    const expiryDate = new Date(data.expiryDate || issueDate);

    // Extract transaction amounts with safe defaults
    const documentFee = transaction?.documentAmount ?? 0;

    return (
      html
        .replace(/{{baseUrl}}/g, getBaseUrl())

        // Italic + Proper Case
        .replace(/{{name}}/g, `<i>${fullName}</i>`)
        .replace(/{{address}}/g, `<i>${toTitleCase(data.address)}</i>`)

        .replace(/{{licenceRefNumber}}/g, data.licenceRefNumber)

        .replace(/{{formattedNumber}}/g, data.formattedNumber)

        .replace(/{{issueDay}}/g, formatOrdinal(issueDate.getDate()))
        .replace(/{{issueMonth}}/g, getMonthName(issueDate))
        .replace(/{{issueYear}}/g, getShortYear(issueDate))

        .replace(/{{expiryDay}}/g, formatOrdinal(expiryDate.getDate()))
        .replace(/{{expiryMonth}}/g, getMonthName(expiryDate))
        .replace(/{{expiryYear}}/g, getShortYear(expiryDate))

        // Transaction fees
        .replace(/{{documentAmount}}/g, formatCurrency(documentFee))

        // Images (no italics needed)
        .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
    );
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

  async incrementReprintCount(auctioneerId: string): Promise<void> {
    await this.auctioneerModel.findByIdAndUpdate(auctioneerId, {
      $inc: { reprintCount: 1 },
    });
  }

  async generateAuctioneerPDF(id: string, html: string): Promise<string> {
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

  async findRequestsByUserId(userId: string): Promise<Auctioneer[]> {
    return await this.auctioneerModel
      .find({ userId })
      .sort({ created_at: -1 })
      .populate('userId')
      .exec();
  }

  async getAuctioneerViewPage(auctioneerId: string): Promise<string> {
    await this.validateAuctioneerExists(auctioneerId);
    return this.loadViewTemplate();
  }

  private async validateAuctioneerExists(auctioneerId: string): Promise<void> {
    const auctioneer = await this.findAuctioneerById(auctioneerId);
    if (!auctioneer) {
      throw new NotFoundException('auctioneer not found');
    }
  }

  private async loadViewTemplate(): Promise<string> {
    const templatePath = this.getTemplatePath('auctioneer-view.html');

    try {
      return await fs.promises.readFile(templatePath, 'utf8');
    } catch (error) {
      this.logger.error('Error reading auctioneer template:', error);
      throw new InternalServerErrorException('Template not found');
    }
  }

  private getTemplatePath(filename: string): string {
    return path.join(__dirname, '..', '..', 'templates', filename);
  }

  async prepareAuctioneerDownload(
    auctioneerId: string,
  ): Promise<{ stream: Readable; filename: string }> {
    const auctioneer = await this.findAuctioneerById(auctioneerId);

    if (!auctioneer) {
      throw new NotFoundException('Auctioneer not found');
    }

    const user = await this.getUserForAuctioneer(auctioneer);

    await this.validateAndActivateDownload(auctioneer);

    // 3. ATOMIC INCREMENT WITH LIMIT CHECK
    // We try to increment. The query condition ensures we only increment if under the limit.
    const MAX_DOWNLOADS = 3;
    const result = await this.auctioneerModel.findOneAndUpdate(
      {
        _id: auctioneerId,
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

    const { hash, qrCodeUrl } = await this.generateVerificationData(
      auctioneer,
      user,
    );

    await this.markAuctioneerAsDownloaded(auctioneerId);
    await this.saveVerificationHash(auctioneerId, hash);

    auctioneer.qrCodeUrl = qrCodeUrl;

    const pdfPath = await this.generateAutioneerPdf(auctioneer, user);

    return {
      stream: fs.createReadStream(pdfPath),
      filename: 'auctioneer.pdf',
    };
  }

  private async getUserForAuctioneer(auctioneer: any) {
    const userId = this.extractUserId(auctioneer);
    return this.userService.findById(userId);
  }

  private extractUserId(auctioneer: any): string {
    return typeof auctioneer.userId === 'string'
      ? auctioneer.userId
      : auctioneer.userId._id.toString();
  }

  private async validateAndActivateDownload(auctioneer: any): Promise<void> {
    if (auctioneer.downloaded) {
      this.validateDownloadWindow(auctioneer);
    }
  }

  // private async generateAutioneerPdf(
  //   auctioneer: any,
  //   user: any,
  // ): Promise<string> {
  //   const htmlTemplate = await this.loadHtmlTemplate(
  //     'auctioneer-template.html',
  //   );
  //   const populatedHtml = this.populateHtmlTemplate(
  //     htmlTemplate,
  //     auctioneer,
  //     user,
  //   );

  //   return this.generateAuctioneerPDF(auctioneer.id, populatedHtml);
  // }
  private async generateAutioneerPdf(
    auctioneer: any,
    user: any,
  ): Promise<string> {
    const htmlTemplate = await this.loadHtmlTemplate(
      'auctioneer-template.html',
    );

    // Fetch the transaction for this auctioneer
    const transaction = await this.findTransactionByAuctioneerId(auctioneer.id);

    const populatedHtml = this.populateHtmlTemplate(
      htmlTemplate,
      auctioneer,
      user,
      transaction,
    );

    return this.generateAuctioneerPDF(auctioneer.id, populatedHtml);
  }

  async markAsDownloadedForThreeMonths(id: string): Promise<void> {
    const expiry = new Date();
    // expiry.setMonth(expiry.getMonth() + 3); // +3 months
    expiry.setMinutes(expiry.getMinutes() + 10); // +10 minutes

    await this.auctioneerModel.updateOne(
      { _id: id },
      {
        $set: {
          downloaded: true,
          downloadExpiryDate: expiry,
        },
      },
    );
  }

  private async markAuctioneerAsDownloaded(id: string): Promise<void> {
    try {
      await this.markAsDownloadedForThreeMonths(id);
    } catch (error) {
      this.logger.error('Error marking certificate as downloaded:', error);
    }
  }

  async findById(id: string): Promise<Auctioneer> {
    const user = await this.auctioneerModel
      .findById(id)
      .populate(
        'userId',
        'firstname lastname email passportPhoto isProfileCompleted',
      )
      .exec();
    if (!user) {
      throw UserNotFoundException();
    }
    return user;
  }

  /**
   * Updates the payment status of a auctioneer request.
   * @param id The ID of the auctioneer request.
   * @param status The new payment status ('paid', 'failed', etc.).
   * @returns The updated auctioneer document.
   */
  async updatePaymentStatus(id: string, status: string): Promise<Auctioneer> {
    const updatedAuctioneer = await this.auctioneerModel
      .findByIdAndUpdate(
        id,
        { paymentStatus: status },
        { new: true }, // Return the updated document
      )
      .exec();

    if (!updatedAuctioneer) {
      throw new NotFoundException(
        `Auctioneer request with ID ${id} not found.`,
      );
    }
    return updatedAuctioneer;
  }

  // Delete Auctioneer Lincence
  deleteItem = async (item_id: string): Promise<any> => {
    // 1️⃣ Find record first
    const record = await this.auctioneerModel.findById(item_id);

    if (!record) {
      throw new NotFoundException('Auctioneer record not found');
    }

    // 2️⃣ Delete tax clearance from Cloudinary (if exists)
    if (record.taxClearance) {
      const publicId = this.cloudinaryService.getFullPublicIdFromUrl(
        record.taxClearance,
      );

      if (publicId) {
        await this.cloudinaryService.deleteFile(publicId);
      }
    }

    // 3️⃣ Delete from database
    await this.auctioneerModel.deleteOne({ _id: item_id });

    return {
      success: true,
      message: 'Auctioneer deleted successfully',
    };
  };
}
