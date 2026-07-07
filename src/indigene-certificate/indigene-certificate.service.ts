import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Certificate } from './indigene-certicate.schema';
import { UserNotFoundException } from 'src/common/exception';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { UserDocument } from 'src/users/users.schema';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ResubmissionService } from '../common/services/resubmission.service';
import { Counter, CounterDocument } from './counter.schema';
import { UsersService } from 'src/users/users.service';
import { CurrentUser } from 'src/common/decorators/current-user,decorator';
import { ReprintResponseDto } from './dto/request-reprint.dto';
import { TransactionService } from 'src/transaction/transaction.service';
import { Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import config from 'src/config';
import QRCode from 'qrcode';
import { Readable } from 'stream';
import { Transaction } from 'src/transaction/transaction.schema';
import { MailService } from '../mail/mail.service';

@Injectable()
export class IndigeneCertificateService {
  private readonly logger = new Logger(IndigeneCertificateService.name);

  constructor(
    @InjectModel(Certificate.name)
    public readonly certificateModel: Model<Certificate>,
    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly resubmissionService: ResubmissionService,
    @InjectModel(Counter.name)
    public readonly counterModel: Model<CounterDocument>,
    private readonly userService: UsersService,
    private readonly transactionService: TransactionService,
    @InjectModel('Transaction') private transactionModel: Model<Transaction>,
    private readonly mailService: MailService,
  ) {}

  /**
   * Validates if a user is eligible to create a new certificate request.
   * Throws an exception if the user is not eligible.
   * @param userId The ID of the user to validate.
   */
  async canUserCreateCertificate(userId: string): Promise<void> {
    // 1. Check for existing pending requests
    const existingRequest = await this.certificateModel
      .exists({ userId, status: 'Pending' })
      .exec();
    if (existingRequest) {
      throw new ConflictException(
        'A pending Certificate request already exists for this user.',
      );
    }

    // 2. Check for pending payments on an approved request
    const isApprovedWithPendingPayment = await this.certificateModel
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

    // 4. Enforce the business rule for state of origin
    if (user.stateOfOrigin?.toLowerCase() !== 'benue') {
      throw new ForbiddenException(
        'Access Denied: You are not eligible to create a Certificate of Origin request as you are not an indigene of Benue State.',
      );
    }

    // If we reach here, the user is eligible to proceed.
    // The method returns void (implicitly).
  }

  /**
   * Creates the certificate record in the database.
   * Assumes all pre-flight validation has already passed.
   */
  async createCertificate(data: any, userId: string): Promise<Certificate> {
    try {
      const newRequest = await this.certificateModel.create({
        ...data,
      });

      // Send admin notification (fire and forget)
      this.sendNewRequestNotification(newRequest, userId).catch((err) => {
        this.logger.error(
          `Failed to send new request notification: ${err.message}`,
        );
      });

      // 🔔 Send notification
      await this.notificationsService.createSystemNotification(
        userId,
        'Certificate Request Submitted',
        'Your certificate request has been submitted for processing.',
        'certificate',
        '/dashboard/certificate-requests',
        data.lgaOfOrigin,
      );

      return newRequest;
    } catch (error: any) {
      if (error.code === 11000) {
        // This is a final safeguard for race conditions.
        throw new ConflictException('Certificate request already exists.');
      }
      throw new BadRequestException(
        error.message || 'Failed to create certificate.',
      );
    }
  }

  private async sendNewRequestNotification(
    certificateRequest: any,
    userId: string,
  ): Promise<void> {
    try {
      const user = await this.userService.findById(userId);

      if (!user) {
        this.logger.warn(`User not found for notification: ${userId}`);
        return;
      }

      // Get admin emails from UserModel
      const adminEmails = await this.userService.getAdminEmails();

      if (adminEmails.length === 0) {
        this.logger.warn('No admin emails found. Notification not sent.');
        return;
      }

      await this.mailService.sendNewRequestNotificationToAdmins(adminEmails, {
        requesterName: user.firstname + ' ' + user.lastname || 'Unknown User',
        requesterEmail: user.email || 'Unknown Email',
        requestType: 'Certificate of Origin Request',
        requestId: certificateRequest._id.toString(),
        submittedAt: certificateRequest.createdAt || new Date(),
      });

      this.logger.log(
        `Admin notification sent for request: ${certificateRequest._id} to ${adminEmails.length} admin(s)`,
      );
    } catch (error) {
      const err = error as Error; // Assert type
      this.logger.error(
        `Error sending new request notification: ${err.message}`,
      );
    }
  }

  /**
   * Updates an existing certificate request.
   * Allows updates only if status is Pending or Rejected.
   */
  async updateCertificate(
    id: string,
    updateData: any,
    userId: string,
  ): Promise<Certificate> {
    // 1. Find the existing certificate
    const certificate = await this.certificateModel.findById(id);
    if (!certificate) {
      throw new NotFoundException('Certificate request not found.');
    }

    // 2. Authorization Check
    if (certificate.userId.toString() !== userId) {
      throw new ForbiddenException(
        'You are not authorized to update this request.',
      );
    }

    // 3. Status Validation
    if (certificate.status === 'Approved') {
      throw new BadRequestException(
        'Approved certificates cannot be modified.',
      );
    }

    // 5. Handle Resubmission Logic
    // If the request was rejected, updating it should reset status to Pending
    if (certificate.status === 'Rejected') {
      updateData.status = 'Pending';
      updateData.rejectionReason = null; // Clear previous rejection reason
    }

    // 6. Apply updates and save
    Object.assign(certificate, updateData);

    return certificate.save();
  }

  async generateCertificateNumber(): Promise<number> {
    const counter = await this.counterModel.findOneAndUpdate(
      { key: 'certificateNumber' }, // unique key
      { $inc: { value: 1 } }, // atomic increment
      { new: true, upsert: true }, // create if not exists
    );

    return counter.value;
  }

  async findCertificateById(id: string): Promise<Certificate> {
    return this.certificateModel.findById(id);
  }

  async findOne(id: string): Promise<Certificate> {
    const certificate = await this.certificateModel
      .findOne({ userId: id })
      .populate(
        'userId',
        'firstname lastname email passportPhoto isProfileCompleted',
      );

    return certificate;
  }

  async findById(id: string): Promise<Certificate> {
    const user = await this.certificateModel
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
  async findApprovedRequest(page: number, limit: number, status: string) {
    const skip = (page - 1) * limit;
    const data = await this.certificateModel
      .find({ status })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalCount = await this.certificateModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async findRequestsByStatuses(
    page: number,
    limit: number,
    statuses: string[],
  ) {
    const skip = (page - 1) * limit;
    const data = await this.certificateModel
      .find({ status: { $in: statuses } })
      .skip(skip)
      .limit(limit)
      .exec();
    const totalCount = await this.certificateModel
      .countDocuments({ status: { $in: statuses } })
      .exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async approveCertificate(
    id: string,
    approvedBy: string,
  ): Promise<Certificate> {
    const request = await this.certificateModel
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
      // Extract the user ID as a string
      const userId =
        typeof request.userId === 'string'
          ? request.userId
          : request.userId.id.toString();

      await this.notificationsService.createSystemNotification(
        userId,
        'Certificate Approved',
        'Congratulations! Your Certificate request has been approved.',
        'certificate',
        '/dashboard/certificate-requests',
      );
    }

    return request;
  }

  async verifyRequest(id: string): Promise<Certificate> {
    return this.certificateModel
      .findByIdAndUpdate(id, { isVerified: true }, { new: true })
      .exec();
  }

  async rejectCertificate(
    id: string,
    rejectionReason: string,
    rejectedBy: string,
  ): Promise<Certificate> {
    // Notify user
    const certificate = await this.certificateModel.findById(id);
    if (!certificate) {
      throw UserNotFoundException();
    }

    // Use a type guard to check if userId is a User object
    if (typeof certificate.userId !== 'string') {
      await this.userService.sendRequest(
        certificate.userId.email,
        ' Request rejected',
        `Rejection Reason: ${rejectionReason}
           `,
      );
    }
    const request = await this.certificateModel
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
          : request.userId.id.toString();
      await this.notificationsService.createSystemNotification(
        userId,
        'Certificate Request Rejected',
        `Your Certificate request was rejected. Reason: ${rejectionReason}`,
        'idcard',
        '/dashboard/idcard-requests',
      );
    }
    return request;
  }

  /**
   * Resubmit a rejected certificate request
   * @param id The certificate ID
   * @param updatedData The updated certificate data
   * @returns The updated certificate
   */
  async resubmitRequest(
    id: string,
    updatedData: Partial<Certificate>,
  ): Promise<Certificate> {
    return this.resubmissionService.resubmitRequest(
      this.certificateModel,
      id,
      updatedData,
      'Certificate',
    );
  }

  async getPaginatedData(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.certificateModel
      .find()
      .skip(skip)
      .limit(limit)
      .exec();
    const totalCount = await this.certificateModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async findByLga(lgaOfOrigin: string) {
    const query = lgaOfOrigin ? { lgaOfOrigin } : {};
    const certificates = await this.certificateModel
      .find(query)
      .populate('userId', 'firstname lastname email phone lgaOfOrigin')
      .populate('approvedBy', 'firstname lastname email phone lgaOfOrigin')

      .sort({ created_at: -1 })
      .lean()
      .exec();
    return certificates;
  }

  async getLatestCertificate() {
    return this.certificateModel
      .findOne()
      .sort({ created_at: -1 }) // Sort by createdAt descending (newest first)
      .exec();
  }

  async getLatestApprovedCertificate() {
    return this.certificateModel
      .findOne({ status: 'Approved' }) // Only approved requests
      .sort({ created_at: -1 }) // Newest first
      .exec();
  }

  async markAsDownloaded(id: string): Promise<void> {
    await this.certificateModel.updateOne(
      { _id: id },
      { $set: { downloaded: true } },
    );
  }

  async markAsDownloadedForThreeMonths(id: string): Promise<void> {
    const expiry = new Date();
    // expiry.setMonth(expiry.getMonth() + 3); // +3 months
    expiry.setMinutes(expiry.getMinutes() + 10); // +10 minutes

    await this.certificateModel.updateOne(
      { _id: id },
      {
        $set: {
          downloaded: true,
          downloadExpiryDate: expiry,
        },
      },
    );
  }

  async reverseMarkAsDownloaded(id: string): Promise<void> {
    await this.certificateModel.updateOne(
      { _id: id },
      { $set: { downloaded: false } },
    );
  }

  async generateCertificatePDF(id: string, html: string): Promise<string> {
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

  async incrementReprintCount(certificateId: string): Promise<void> {
    await this.certificateModel.findByIdAndUpdate(certificateId, {
      $inc: { reprintCount: 1 },
    });
  }

  async findRequestsByUserId(userId: string): Promise<Certificate[]> {
    return await this.certificateModel
      .find({ userId })
      .sort({ created_at: -1 })
      .populate('userId')
      .exec();
  }

  // Delete Certificate
  deleteItem = async (item_id: string): Promise<any> => {
    return await this.certificateModel.deleteOne({ _id: item_id });
  };

  // fetch items by their IDs
  async findByIds(ids: string[]): Promise<any[]> {
    const objectIds = ids.map((id) => new Types.ObjectId(id));
    return this.certificateModel.find({ _id: { $in: objectIds } }).exec();
  }

  async verifyCertificate(certificateId: string, hash: string): Promise<any> {
    const certificate = await this.certificateModel.findOne({
      _id: new Types.ObjectId(certificateId),
      verificationHash: hash,
    });

    if (!certificate) {
      return { valid: false, message: 'Certificate not found' };
    }

    if (!certificate.isValid) {
      return { valid: false, message: 'Certificate has been revoked' };
    }

    // Return limited information for privacy
    return {
      valid: true,
      data: {
        certificateId: certificateId,
        firstname: certificate.firstname,
        lastname: certificate.lastname,
        kindred: certificate.kindred,
        issuingAuthority: 'Benue State citizenship/residency management system',
      },
    };
  }

  async saveVerificationHash(certificateId: string, hash: string) {
    try {
      const result = await this.certificateModel.updateOne(
        { _id: new Types.ObjectId(certificateId) },
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
    documentType: 'certificate';
  }): Promise<ReprintResponseDto> {
    // await this.validateNoPendingPayment(data.documentId, data.userId);

    const certificate = await this.getAndAuthorizeCertificate(
      data.documentId,
      data.userId,
    );
    this.validateDownloadWindowExpired(certificate);

    const paymentResult = await this.initializePayment(data);
    await this.updateReprintPaymentStatus(data.documentId, 'Pending');

    return this.buildResponse(paymentResult);
  }

  private async getAndAuthorizeCertificate(id: string, userId: string) {
    const certificate = await this.certificateModel.findById(id);

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const ownerId = this.extractOwnerId(certificate);
    if (ownerId !== userId) {
      this.logger.warn(
        `User ${userId} unauthorized access to certificate ${id}`,
      );
      throw new ForbiddenException(
        'Not authorized to request reprint for this certificate',
      );
    }

    return certificate;
  }

  private extractOwnerId(certificate: any): string {
    return typeof certificate.userId === 'string'
      ? certificate.userId
      : certificate.userId._id.toString();
  }

  private validateDownloadWindowExpired(certicate: any): void {
    const MAX_DOWNLOADS = 3;
    const now = new Date();

    // 1. Check Time Window
    const isTimeExpired =
      certicate.downloadExpiryDate &&
      new Date(certicate.downloadExpiryDate) < now;

    // 2. Check Download Limit
    const isLimitReached = (certicate.downloadCount || 0) >= MAX_DOWNLOADS;

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
    documentType: 'certificate';
  }) {
    try {
      return await this.transactionService.initializeReprintPayment({
        ...data,
      });
    } catch (error) {
      const err = error as Error; // Assert type
      this.logger.error('Reprint payment initialization failed', err?.message);
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

  /**
   * Updates the payment status of a certificate request.
   * @param id The ID of the certificate request.
   * @param status The new payment status ('paid', 'failed', etc.).
   * @returns The updated certificate document.
   */
  async updatePaymentStatus(id: string, status: string): Promise<Certificate> {
    const updatedCertificate = await this.certificateModel
      .findByIdAndUpdate(
        id,
        { paymentStatus: status },
        { new: true }, // Return the updated document
      )
      .exec();

    if (!updatedCertificate) {
      throw new NotFoundException(
        `Certificate request with ID ${id} not found.`,
      );
    }
    return updatedCertificate;
  }

  // async confirmReprintPayment(
  //   autioneerId: string,
  //   paymentReference: string,
  //   rrr: string,
  // ): Promise<Certificate> {
  //   const now = new Date();
  //   // const thirtyDaysFromNow = new Date(
  //   //   now.getTime() + 30 * 24 * 60 * 60 * 1000,
  //   // );
  //   const thirtyDaysFromNow = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes for testing

  //   const updatedAuctioneer = await this.certificateModel
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
  //     throw new NotFoundException('Certificate request not found.');
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
  async updateReprintPaymentStatus(
    certificateId: string,
    status: 'Pending' | 'Paid' | 'NotRequired',
  ): Promise<Certificate> {
    return this.certificateModel
      .findByIdAndUpdate(
        certificateId,
        {
          reprintPaymentStatus: status,
          requiresReprintPayment: status !== 'NotRequired',
        },
        { new: true },
      )
      .exec();
  }

  async prepareReprintDownload(
    certificateId: string,
    userId: string,
  ): Promise<{ buffer: Buffer; filename: string }> {
    const certificate = await this.getAndAuthorizeCertificate(
      certificateId,
      userId,
    );

    this.validatePaymentStatus(certificate);
    this.validateDownloadWindow(certificate);

    const owner = await this.userService.findById(
      this.extractOwnerId(certificate),
    );
    const { hash, qrCodeUrl } = await this.generateVerificationData(
      certificate,
      owner,
    );

    await this.incrementReprintCount(certificateId);

    await this.saveVerificationHash(certificateId, hash);
    // Attach qrCodeUrl to certificate object for PDF generation
    certificate.qrCodeUrl = qrCodeUrl;

    const pdfBuffer = await this.generatePdf(certificate, owner);

    return {
      buffer: pdfBuffer,
      filename: 'benue-indigene-certificate-reprint.pdf',
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

  private validatePaymentStatus(certificate: any): void {
    if (certificate.reprintPaymentStatus !== 'Paid') {
      throw new HttpException(
        'Reprint payment is required to download this certificate.',
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  // private validateDownloadWindow(certificate: any): void {
  //   if (
  //     !certificate.reprintDownloadExpiryDate ||
  //     certificate.reprintDownloadExpiryDate < new Date()
  //   ) {
  //     throw new HttpException(
  //       'The reprint download window has expired. Please request a new reprint.',
  //       HttpStatus.GONE,
  //     );
  //   }
  // }

  private validateDownloadWindow(certificate: any): void {
    const now = new Date();

    // 1. Check if the initial 10-minute window is active
    const isInitialActive =
      certificate.downloadExpiryDate &&
      new Date(certificate.downloadExpiryDate) > now;

    // 2. Check if the 30-day reprint window is active
    const isReprintActive =
      certificate.reprintDownloadExpiryDate &&
      new Date(certificate.reprintDownloadExpiryDate) > now;

    // 3. LOGIC GATE: If NEITHER are active, block the download.
    if (!isInitialActive && !isReprintActive) {
      throw new HttpException(
        'The download window has expired. Please request a reprint to generate a new link.',
        HttpStatus.GONE, // 410 error
      );
    }
  }

  private async generateVerificationData(certificate: any, owner: any) {
    const dateOfReprint = new Date();
    const hash = this.generateSecureHash(
      certificate.id,
      owner.firstname,
      owner.lastname,
      dateOfReprint,
    );

    const baseUrl = this.getBaseUrl();
    const qrCodeData = `${baseUrl}/api/indigene/certificate/view/${certificate.id}`;
    const qrCodeUrl = await this.generateQrCode(qrCodeData);

    return { hash, qrCodeUrl };
  }

  private getBaseUrl(): string {
    return config.isDev
      ? process.env.BASE_URL || 'http://localhost:5000'
      : 'https://api.citizenship.benuestate.gov.ng';
  }

  // private async saveVerificationData(
  //   certificateId: string,
  //   hash: string,
  //   qrCodeUrl: string,
  // ): Promise<void> {
  //   await this.updateVerificationData(certificateId, {
  //     verificationHash: hash,
  //     qrCodeUrl: qrCodeUrl,
  //   });
  //   await this.incrementReprintCount(certificateId);
  // }

  // async updateVerificationData(
  //   certificateId: string,
  //   data: { verificationHash: string; qrCodeUrl: string },
  // ): Promise<Certificate> {
  //   return this.certificateModel
  //     .findByIdAndUpdate(
  //       certificateId,
  //       {
  //         verificationHash: data.verificationHash,
  //         qrCodeUrl: data.qrCodeUrl,
  //       },
  //       { new: true },
  //     )
  //     .exec();
  // }

  private async generatePdf(certificate: any, owner: any): Promise<Buffer> {
    const htmlTemplate = await this.loadHtmlTemplate(
      'certificate-template.html',
    );
    const populatedHtml = this.populateHtmlTemplate(
      htmlTemplate,
      certificate,
      owner,
    );

    const filePath = await this.generateCertificatePDF(
      `reprint-${certificate.id}`,
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

    // Format DOB
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Format Issue Date
    const dateOfIssue = new Date();
    const formattedDateOfIssue = dateOfIssue.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const certNumber = data.certificateNumber.toString().padStart(6, '0');

    const fullName = `${toTitleCase(user.firstname)} ${toTitleCase(
      user.middlename || '',
    )} ${toTitleCase(user.lastname)}`.trim();

    return (
      html
        .replace(/{{baseUrl}}/g, getBaseUrl())

        // Italic + Proper Case
        .replace(/{{name}}/g, `<i>${fullName}</i>`)
        .replace(/{{lga}}/g, `<i>${toTitleCase(data.lgaOfOrigin)}</i>`)
        .replace(/{{family}}/g, `<i>${toTitleCase(data.fathersName)}</i>`)
        .replace(/{{ward}}/g, `<i>${toTitleCase(data.ward)}</i>`)
        .replace(/{{kindred}}/g, `<i>${toTitleCase(data.kindred)}</i>`)
        .replace(/{{village}}/g, `<i>${toTitleCase(data.village)}</i>`)

        // Official values in uppercase
        .replace(/{{refNumber}}/g, data.refNumber)

        // Dates italicized
        .replace(/{{dob}}/g, `<i>${formattedDate}</i>`)
        .replace(/{{issueDate}}/g, formattedDateOfIssue)

        // Images (no italics needed)
        .replace(/{{passportPhoto}}/g, data.passportPhoto)
        .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
        .replace(/{{certificateNumber}}/g, certNumber)
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

  async prepareCertificateDownload(
    certificateId: string,
  ): Promise<{ stream: Readable; filename: string }> {
    const certificate = await this.findCertificateById(certificateId);

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    const user = await this.getUserForCertificate(certificate);

    await this.validateAndActivateDownload(certificate);

    // 3. ATOMIC INCREMENT WITH LIMIT CHECK
    // We try to increment. The query condition ensures we only increment if under the limit.
    const MAX_DOWNLOADS = 3;
    const result = await this.certificateModel.findOneAndUpdate(
      {
        _id: certificateId,
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
      certificate,
      user,
    );

    await this.markCertificateAsDownloaded(certificateId);
    await this.saveVerificationHash(certificateId, hash);

    certificate.qrCodeUrl = qrCodeUrl;

    const pdfPath = await this.generateCertPdf(certificate, user);

    return {
      stream: fs.createReadStream(pdfPath),
      filename: 'certificate.pdf',
    };
  }

  private async getUserForCertificate(certificate: any) {
    const userId = this.extractUserId(certificate);
    return this.userService.findById(userId);
  }

  private extractUserId(certificate: any): string {
    return typeof certificate.userId === 'string'
      ? certificate.userId
      : certificate.userId._id.toString();
  }

  private async validateAndActivateDownload(certificate: any): Promise<void> {
    if (certificate.downloaded) {
      this.validateDownloadWindow(certificate);
    }
  }

  private async generateCertPdf(certificate: any, user: any): Promise<string> {
    const htmlTemplate = await this.loadHtmlTemplate(
      'certificate-template.html',
    );
    const populatedHtml = this.populateHtmlTemplate(
      htmlTemplate,
      certificate,
      user,
    );

    return this.generateCertificatePDF(certificate.id, populatedHtml);
  }

  private async markCertificateAsDownloaded(id: string): Promise<void> {
    try {
      await this.markAsDownloadedForThreeMonths(id);
    } catch (error) {
      this.logger.error('Error marking certificate as downloaded:', error);
    }
  }

  async prepareCertificatePdf(
    certificateId: string,
  ): Promise<{ stream: Readable; filename: string }> {
    const certificate = await this.getAndValidateCertificate(certificateId);
    const user = await this.getUserForCertificate(certificate);
    const pdfPath = await this.generateCertificatePdf(certificate, user);

    return {
      stream: fs.createReadStream(pdfPath),
      filename: 'certificate.pdf',
    };
  }

  private async getAndValidateCertificate(
    certificateId: string,
  ): Promise<Certificate> {
    const certificate = await this.findCertificateById(certificateId);

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
    }

    return certificate;
  }

  private async generateCertificatePdf(
    certificate: any,
    user: any,
  ): Promise<string> {
    const htmlTemplate = await this.loadHtmlTemplate('certificate-view.html');
    const populatedHtml = this.populateHtmlTemplate(
      htmlTemplate,
      certificate,
      user,
    );

    return this.generateCertificatePDF(certificate.id, populatedHtml);
  }

  async grantReprintDownloadAccess(auctioneerId: string): Promise<Certificate> {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000,
    );
    // const thirtyDaysFromNow = new Date(Date.now() + 10 * 60 * 1000); // 10 mins for testing (change to 30 days for prod)

    const updatedCertificate = await this.certificateModel
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

    if (!updatedCertificate) {
      throw new NotFoundException('Auctioneer request not found.');
    }

    return updatedCertificate;
  }
}
