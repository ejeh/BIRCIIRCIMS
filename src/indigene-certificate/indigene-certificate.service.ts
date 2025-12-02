import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Response } from 'express';
import { Certificate } from './indigene-certicate.schema';
import { UserNotFoundException } from 'src/common/exception';
import PDFDocument from 'pdfkit';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { Kindred } from 'src/kindred/kindred.schema';
import { UserDocument } from 'src/users/users.schema';
import { NotificationsService } from 'src/notifications/notifications.service';
import { ResubmissionService } from '../common/services/resubmission.service';

@Injectable()
export class IndigeneCertificateService {
  constructor(
    @InjectModel(Certificate.name)
    public readonly certificateModel: Model<Certificate>,
    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
    private readonly resubmissionService: ResubmissionService,
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
      await this.notificationsService.createSystemNotification(
        request.userId,
        'Certificate Approved',
        'Congratulations! Your Certificate request has been approved.',
        'idcard',
        '/dashboard/idcard-requests',
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
      await this.notificationsService.createSystemNotification(
        request.userId,
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
    expiry.setMonth(expiry.getMonth() + 3); // +3 months
    // expiry.setMinutes(expiry.getMinutes() + 10); // +10 minutes

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

  async getAttestationTemplate(id: string, res: Response) {
    const applicant = await this.certificateModel.findById(id);
    if (!applicant) throw new NotFoundException('User not found');
    // Generate attestation template as a downloadable file
    // Create a new PDF document
    const doc = new PDFDocument();

    const date = new Date(applicant.DOB);

    // Format as "February 20, 1991"
    const formattedDate = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Set the response headers
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attestation_${id}.pdf`,
    );
    res.setHeader('Content-Type', 'application/pdf');

    // Pipe the PDF document to the response
    doc.pipe(res);

    // Add Title
    doc.fontSize(16).text('ATTESTATION LETTER FOR INDIGENE CERTIFICATE', {
      align: 'center',
    });
    doc.moveDown(2);

    // Sender's Information
    doc.fontSize(12).text(`senderName`);
    doc.text(`senderAddress`);
    doc.text(`senderCity}, senderState`);
    doc.text(`senderPhone`);
    doc.text(`senderEmail`);
    doc.moveDown(1);

    // Date
    doc.text(`${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown(2);

    // Recipient Information
    doc.text(`The Chairman,`);
    doc.text(`${applicant.lgaOfOrigin}`);
    doc.text(`Benue State, Nigeria`).moveDown();

    doc
      .fontSize(14)
      .text(
        `Subject: Attestation of Indigene Certificate for ${applicant.firstname} ${applicant.lastname}`,
        { align: 'left' },
      )
      .moveDown();

    doc.text(`Dear Sir/Madam,`).moveDown();

    doc
      .text(
        `I, "senderFistName" senderLastName, a native of ${applicant.ward}, in ${applicant.lgaOfOrigin} of Benue State, hereby write to formally attest that ${applicant.firstname} ${applicant.lastname}, who is a bona fide indigene of ${applicant.ward}, in ${applicant.lgaOfOrigin}, Benue State.`,
      )
      .moveDown();

    doc
      .text(
        `${applicant.firstname} ${applicant.lastname} was born on ${formattedDate}, to ${applicant.fathersName} and ${applicant.mothersName}, both of whom are recognized natives of ${applicant.ward}. He/She has continuously identified with our community and has actively participated in cultural and communal activities, confirming his/her roots in this locality.`,
      )
      .moveDown();

    doc
      .text(
        `This attestation is made in good faith and to the best of my knowledge, without any form of misrepresentation. I, therefore, request that the necessary indigene certificate be issued to ${applicant.firstname} ${applicant.lastname} for official purposes.`,
      )
      .moveDown();

    doc
      .text(
        `Please do not hesitate to contact me should further clarification be required.`,
      )
      .moveDown();

    doc.text(`Thank you for your cooperation.`).moveDown();

    doc.text(`Yours faithfully,`).moveDown();
    doc.text(`senderFirstName senderLastname`);
    doc
      .text('Authorized Signature: ___________________', { align: 'left' })
      .moveDown(2);
    // doc.text(`[Signature]`).moveDown(2);

    // Finalize and close the PDF
    doc.end();
    return {
      message: 'Download link generated',
      url: `example.com/download/${id}`,
    };
  }

  async uploadAttestation(id: string, file: Express.Multer.File) {
    const applicant = await this.certificateModel.findById(id);
    if (!applicant) throw UserNotFoundException();
    applicant.uploadedAttestationUrl = file.path;
    return applicant.save();
  }

  // Generate Certificate as PDF
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

  async findRequestsByUserId(userId: string): Promise<Certificate[]> {
    return await this.certificateModel
      .find({ userId })
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
}
