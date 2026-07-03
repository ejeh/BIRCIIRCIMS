import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
import { Transaction } from './transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { IndigeneCertificateService } from 'src/indigene-certificate/indigene-certificate.service';
import { IdcardService } from 'src/idcard/idcard.service';
import PDFDocument from 'pdfkit'; // Import pdfkit
import { GetTransactionsReportDto } from './src/transaction/dto/get-transactions-report.dto';
import { AuctioneerService } from 'src/auctioneer/auctioneer.service';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { NotificationsService } from 'src/notifications/notifications.service';
import { fileUploadConfig } from 'src/config/file-upload.config';

@Injectable()
export class TransactionService {
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly apiToken: string;
  private readonly remitaBaseUrl: string;
  private readonly serviceTypeId: string;
  private readonly httpService: HttpService;
  constructor(
    private configService: ConfigService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly notificationsService: NotificationsService,
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    @Inject(forwardRef(() => IndigeneCertificateService))
    private readonly indigeneCertificateService: IndigeneCertificateService,
    @Inject(forwardRef(() => IdcardService))
    private readonly idcardService: IdcardService,
    @Inject(forwardRef(() => AuctioneerService))
    private readonly auctioneerService: AuctioneerService,
  ) {
    this.merchantId = this.configService.get<string>('REMITA_MERCHANT_ID');
    this.apiKey = this.configService.get<string>('REMITA_API_KEY');
    this.apiToken = this.configService.get<string>('REMITA_API_TOKEN');
    this.remitaBaseUrl =
      this.configService.get<string>('REMITA_BASE_URL') ||
      'https://demo.remita.net/remita/exapp/api/v1/send/api';
    this.serviceTypeId = this.configService.get<string>(
      'REMITA_SERVICE_TYPE_ID',
    );
  }
  private readonly baseUrl = 'https://api.credodemo.com'; // Update if needed
  private readonly secretKey = process.env.CREDO_SECRET_KEY; // Store in .env
  private readonly publicKey = process.env.CREDO_PUBLIC_KEY; // Store in .env

  async initializePayment(data: {
    auctioneerId?: string;
    certificateId?: string;
    cardId?: string;
    userId: string;
    amount: number;
    documentAmount: number;
    email: string;
    currency?: string;
    reference?: string;
    paymentType: 'card' | 'certificate' | 'auctioneer';
  }) {
    const serviceFee = data.amount;
    const documentFee = data.documentAmount;
    const totalAmount = serviceFee + documentFee;

    const userObjectId = new mongoose.Types.ObjectId(data.userId);

    const typeMap = {
      card: { field: 'cardId', value: data.cardId },
      certificate: { field: 'certificateId', value: data.certificateId },
      auctioneer: { field: 'auctioneerId', value: data.auctioneerId },
    };

    const mapping = typeMap[data.paymentType];

    if (!mapping || !mapping.value) {
      throw new Error(
        `Missing identifier for payment type: ${data.paymentType}`,
      );
    }

    const paymentReferenceCriteria = {
      [mapping.field]: new mongoose.Types.ObjectId(mapping.value),
    };

    const EXPIRATION_TIME_MS = 30 * 60 * 1000;

    const existing = await this.transactionModel.findOne({
      userId: userObjectId,
      status: { $in: ['pending', 'service_paid'] },
      ...paymentReferenceCriteria,
    });

    if (existing) {
      // Service fee already paid → skip Credo
      if (existing.status === 'service_paid') {
        return {
          status: 200,
          message: 'Service fee already paid. Continue document payment.',
          data: {
            reference: existing.reference,
            skipCredo: true,
          },
        };
      }

      const isExpired =
        Date.now() - new Date(existing.createdAt).getTime() >
        EXPIRATION_TIME_MS;

      if (!isExpired) {
        return {
          status: 200,
          message: 'Resuming existing payment session.',
          data: {
            reference: existing.reference,
            skipCredo: false,
          },
        };
      }

      await this.transactionModel.updateOne(
        { _id: existing._id },
        { $set: { status: 'expired' } },
      );
    }

    // Generate new unique reference
    const reference =
      data.reference ||
      `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const payload = {
        amount: serviceFee,
        reference,
        bearer: 0,
        currency: data.currency || 'NGN',
        email: data.email,
        customer: { email: data.email },
        channels: ['card', 'bank'],
        initializeAccount: 0,
      };

      const url = `${this.baseUrl}/transaction/initialize`;

      await axios.post(url, payload, {
        headers: {
          Authorization: this.secretKey,
          'Content-Type': 'application/json',
        },
      });

      const newTransaction = await this.transactionModel.create({
        userId: userObjectId,
        reference,
        amount: serviceFee,
        documentAmount: documentFee,
        totalAmount: totalAmount,
        email: data.email,
        status: 'pending',
        currency: data.currency || 'NGN',
        paymentType: data.paymentType,
        ...paymentReferenceCriteria,
      });

      return {
        status: 200,
        message: 'Transaction initialized',
        data: {
          reference: newTransaction.reference,
        },
      };
    } catch (err) {
      const errorData = (err as any)?.response?.data || (err as Error)?.message;

      console.error('Credo initialization error:', errorData);

      throw new Error('Payment initialization failed. Please try again.');
    }
  }

  // // NEW: Initialize reprint payment
  async initializeReprintPayment(data: {
    documentId: string;
    userId: string;
    amount?: number;
    documentAmount: number;
    email: string;
    currency?: string;
    reference?: string;
    documentType: 'certificate' | 'auctioneer' | 'idcard';
  }) {
    const serviceFee = data.amount ?? 0;
    const documentFee = data.documentAmount ?? 0;
    const totalAmount = serviceFee + documentFee;

    if (!data.documentId) {
      throw new Error('Document ID is required.');
    }

    const userObjectId = new mongoose.Types.ObjectId(data.userId);
    const documentObjectId = new mongoose.Types.ObjectId(data.documentId);

    /*
  --------------------------------
  MAP DOCUMENT TYPE
  --------------------------------
  */

    const typeMap = {
      certificate: { field: 'certificateId', value: documentObjectId },
      auctioneer: { field: 'auctioneerId', value: documentObjectId },
      idcard: { field: 'cardId', value: documentObjectId },
    };

    const mapping = typeMap[data.documentType];

    if (!mapping) {
      throw new Error('Invalid document type.');
    }

    const paymentReferenceCriteria = {
      [mapping.field]: new mongoose.Types.ObjectId(mapping.value),
    };

    /*
  --------------------------------
  CHECK EXISTING TRANSACTION
  --------------------------------
  */

    const EXPIRATION_TIME_MS = 30 * 60 * 1000;

    const existing = await this.transactionModel
      .findOne({
        userId: userObjectId,
        paymentType: 'reprint',
        status: { $in: ['pending', 'service_paid'] },
        ...paymentReferenceCriteria,
      })
      .sort({ createdAt: -1 });

    if (existing) {
      /*
    SERVICE FEE ALREADY PAID
    */
      if (existing.status === 'service_paid') {
        return {
          status: 200,
          message: 'Service fee already paid. Continue document payment.',
          data: {
            reference: existing.reference,
            amount: existing.amount,
            skipCredo: true,
          },
        };
      }

      /*
    SESSION STILL VALID
    */

      const isExpired =
        Date.now() - new Date(existing.createdAt).getTime() >
        EXPIRATION_TIME_MS;

      if (!isExpired) {
        return {
          status: 200,
          message: 'Resuming existing payment session.',
          data: {
            reference: existing.reference,
            amount: existing.amount,
            skipCredo: false,
          },
        };
      }

      /*
    EXPIRE OLD SESSION
    */

      await this.transactionModel.updateOne(
        { _id: existing._id },
        { $set: { status: 'expired' } },
      );
    }

    /*
  --------------------------------
  CREATE NEW TRANSACTION
  --------------------------------
  */

    const reference =
      data.reference ||
      `reprint-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    try {
      const payload = {
        amount: serviceFee,
        reference,
        bearer: 0,
        currency: data.currency || 'NGN',
        email: data.email,
        customer: { email: data.email },
        channels: ['card', 'bank'],
        initializeAccount: 0,
        metadata: {
          paymentType: 'reprint',
          documentType: data.documentType,
          documentId: data.documentId,
        },
      };

      const url = `${this.baseUrl}/transaction/initialize`;

      await axios.post(url, payload, {
        headers: {
          Authorization: this.secretKey,
          'Content-Type': 'application/json',
        },
      });

      /*
    SAVE TRANSACTION
    */

      const newTransaction = await this.transactionModel.create({
        userId: userObjectId,
        reference,
        amount: serviceFee,
        documentAmount: documentFee,
        totalAmount: totalAmount,
        email: data.email,
        status: 'pending',
        currency: data.currency || 'NGN',
        paymentType: 'reprint',
        ...paymentReferenceCriteria,
      });

      return {
        status: 200,
        message: 'Reprint payment initialized',
        data: {
          reference: newTransaction.reference,
          skipCredo: false,
        },
      };
    } catch (err) {
      const error = err as any;
      const errorData =
        error?.response?.data ||
        (err instanceof Error ? err.message : String(err));

      console.error('Credo reprint initialization error:', errorData);

      throw new Error(
        'Reprint payment initialization failed. Please try again.',
      );
    }
  }

  async getCertificateReprintTransactions(certificateId: string) {
    return this.transactionModel
      .find({
        certificateId: new mongoose.Types.ObjectId(certificateId),
        paymentType: 'reprint',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  // async verifyReprintPayment(reference: string, rrr: string) {
  //   /*
  // --------------------------------
  // FIND TRANSACTION
  // --------------------------------
  // */

  //   const transaction = await this.transactionModel.findOne({
  //     reference,
  //     paymentType: 'reprint',
  //   });

  //   if (!transaction) {
  //     throw new NotFoundException('Reprint transaction not found');
  //   }

  //   /*
  // --------------------------------
  // IDEMPOTENCY CHECK
  // --------------------------------
  // */

  //   if (transaction.status !== 'pending') {
  //     return {
  //       success: true,
  //       message: `Reprint payment already ${transaction.status}`,
  //       data: {
  //         status: transaction.status,
  //         documentId:
  //           transaction.certificateId ||
  //           transaction.cardId ||
  //           transaction.auctioneerId,
  //       },
  //     };
  //   }

  //   /*
  // --------------------------------
  // VERIFY SERVICE FEE (CREDO)
  // --------------------------------
  // */

  //   const credoUrl = `${this.baseUrl}/transaction/${reference}/verify`;

  //   const credoResponse = await axios.get(credoUrl, {
  //     headers: {
  //       Authorization: this.secretKey,
  //     },
  //   });

  //   const isCredoSuccessful = credoResponse.data?.data?.status === 0;

  //   if (!isCredoSuccessful) {
  //     return {
  //       success: false,
  //       message: 'Service fee (Credo) not confirmed.',
  //       data: { status: 'pending' },
  //     };
  //   }

  //   /*
  // --------------------------------
  // VERIFY DOCUMENT FEE (REMITA)
  // --------------------------------
  // */

  //   const remitaResult = await this.verifyRrr(rrr);
  //   console.log('remitaResult.success', remitaResult.success);

  //   if (!remitaResult.success) {
  //     return {
  //       success: false,
  //       message: 'Document fee (Remita) not confirmed.',
  //       data: { status: 'pending' },
  //     };
  //   }

  //   /*
  // --------------------------------
  // BOTH PAYMENTS SUCCESSFUL
  // --------------------------------
  // */

  //   const updatedTransaction = await this.transactionModel
  //     .findOneAndUpdate(
  //       { reference },
  //       {
  //         $set: {
  //           status: 'success',
  //           rrr,
  //           verified: true,
  //           verifiedAt: new Date(),
  //         },
  //       },
  //       { new: true },
  //     )
  //     .exec();

  //   /*
  // --------------------------------
  // UPDATE DOCUMENT STATUS
  // --------------------------------
  // */

  //   return {
  //     success: true,
  //     message: 'Reprint payment verified successfully',
  //     data: {
  //       status: 'success',
  //       paymentType: updatedTransaction.paymentType,
  //       documentId:
  //         transaction.certificateId ||
  //         transaction.cardId ||
  //         transaction.auctioneerId,
  //     },
  //   };
  // }

  async hasPendingReprintPayment(
    documentId: string,
    userId: string,
    documentType: 'certificate' | 'auctioneer' | 'card',
  ) {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const documentObjectId = new mongoose.Types.ObjectId(documentId);

    // Build the query filter dynamically based on document type
    const filter: any = {
      userId: userObjectId,
      paymentType: 'reprint',
      status: 'pending',
    };

    if (documentType === 'certificate') {
      filter.certificateId = documentObjectId;
    } else if (documentType === 'auctioneer') {
      filter.auctioneerId = documentObjectId;
    } else if (documentType === 'card') {
      filter.cardId = documentObjectId;
    } else {
      // Handle invalid type or throw error
      return false;
    }

    const pendingTransaction = await this.transactionModel.findOne(filter);

    return !!pendingTransaction;
  }

  /**
   * Helper method to update the payment status of the associated request.
   * @param transaction The successful transaction document.
   */
  // private async updateRequestPaymentStatus(transaction: Transaction) {
  //   try {
  //     if (transaction.paymentType === 'card' && transaction.cardId) {
  //       await this.idcardService.updatePaymentStatus(
  //         transaction.cardId.toString(),
  //         'paid',
  //       );
  //       console.log(
  //         `Updated payment status for ID Card: ${transaction.cardId}`,
  //       );
  //     } else if (
  //       transaction.paymentType === 'certificate' &&
  //       transaction.certificateId
  //     ) {
  //       await this.indigeneCertificateService.updatePaymentStatus(
  //         transaction.certificateId.toString(),
  //         'paid',
  //       );
  //       console.log(
  //         `Updated payment status for Certificate: ${transaction.certificateId}`,
  //       );
  //     } else if (
  //       transaction.paymentType === 'auctioneer' &&
  //       transaction.auctioneerId
  //     ) {
  //       await this.auctioneerService.updatePaymentStatus(
  //         transaction.auctioneerId.toString(),
  //         'paid',
  //       );
  //       console.log(
  //         `Updated payment status for Auctioneer: ${transaction.auctioneerId}`,
  //       );
  //     }
  //   } catch (error) {
  //     console.error(
  //       `Failed to update payment status for transaction ${transaction._id}:`,
  //       error,
  //     );
  //     // Depending on your requirements, you might want to throw the error
  //     // or just log it. For now, we'll log it.
  //   }
  // }
  // Inside transaction.service.ts
  private async updateRequestPaymentStatus(transaction: Transaction) {
    try {
      if (transaction.paymentType === 'card' && transaction.cardId) {
        await this.idcardService.updatePaymentStatus(
          transaction.cardId.toString(),
          'paid',
        );
      } else if (
        transaction.paymentType === 'certificate' &&
        transaction.certificateId
      ) {
        await this.indigeneCertificateService.updatePaymentStatus(
          transaction.certificateId.toString(),
          'paid',
        );
      } else if (
        transaction.paymentType === 'auctioneer' &&
        transaction.auctioneerId
      ) {
        await this.auctioneerService.updatePaymentStatus(
          transaction.auctioneerId.toString(),
          'paid',
        );
      }
      // ============================================
      // NEW: HANDLE REPRINT APPROVALS
      // ============================================
      else if (transaction.paymentType === 'reprint') {
        if (transaction.auctioneerId) {
          // Trigger the download window for Auctioneer
          await this.auctioneerService.grantReprintDownloadAccess(
            transaction.auctioneerId.toString(),
          );
        }
        // Add blocks for certificate/card here later if needed:
        else if (transaction.certificateId) {
          await this.indigeneCertificateService.grantReprintDownloadAccess(
            transaction.certificateId.toString(),
          );
        } else if (transaction.cardId) {
          await this.idcardService.grantReprintDownloadAccess(
            transaction.cardId.toString(),
          );
        }
      }
    } catch (error) {
      console.error(
        `Failed to update payment status for transaction ${transaction._id}:`,
        error,
      );
    }
  }

  async verifyPayment(reference: string, rrr: string) {
    const transaction = await this.transactionModel.findOne({ reference });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    /*
  --------------------------------
  VERIFY SERVICE FEE (CREDO)
  --------------------------------
  */

    const credoUrl = `${this.baseUrl}/transaction/${reference}/verify`;

    const credoResponse = await axios.get(credoUrl, {
      headers: {
        Authorization: this.secretKey,
      },
    });

    const isCredoSuccessful = credoResponse.data?.data?.status === 0;

    if (!isCredoSuccessful) {
      return {
        success: false,
        message: 'Service fee (Credo) not confirmed.',
        data: { status: 'pending' },
      };
    }

    /*
  --------------------------------
  VERIFY DOCUMENT FEE (REMITA)
  --------------------------------
  */

    const remitaResult = await this.verifyRrr(rrr);

    if (!remitaResult.success) {
      return {
        success: false,
        message: 'Document fee (Remita) not confirmed.',
        data: { status: 'pending' },
      };
    }

    /*
  --------------------------------
  BOTH PAYMENTS SUCCESSFUL
  --------------------------------
  */

    const updatedTransaction = await this.transactionModel
      .findOneAndUpdate(
        { reference },
        {
          $set: {
            status: 'success',
            rrr,
            verified: true,
            verifiedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    await this.updateRequestPaymentStatus(updatedTransaction);

    return {
      success: true,
      message: 'Both Service and Document fees verified successfully',
      data: {
        status: 'success',
        paymentType: updatedTransaction.paymentType,
      },
    };
  }

  async getUserTransactions(userId: string) {
    return this.transactionModel.find({ userId }).sort({ createdAt: -1 });
  }

  async getPaginatedData(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.transactionModel
      .find()
      .skip(skip)
      .limit(limit)
      .exec();
    const totalCount = await this.transactionModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async getApprovedItems(): Promise<any[]> {
    // Fetch payments with status 'successful'
    const completedPayments = await this.transactionModel
      .find({ status: 'success' })
      .populate('certificateId') // Populate item details
      // .populate('userId') // Populate user details
      .exec();

    // Extract item IDs from completed payments
    const itemIds = completedPayments.map((payment) => {
      if (!Types.ObjectId.isValid(payment.certificateId)) {
        throw new Error(`Invalid ObjectId: ${payment.certificateId}`);
      }
      return payment.certificateId.toString();
    });

    // Fetch items corresponding to the item IDs
    const approvedItems =
      await this.indigeneCertificateService.findByIds(itemIds);
    return approvedItems;
  }

  // transaction.service.ts
  async handleCredoWebhook(payload: any) {
    const { reference } = payload;

    // Check if this transaction already exists
    const existing = await this.transactionModel.findOne({ reference });

    if (existing) {
      console.log(
        `Transaction with reference ${reference} already exists. Skipping...`,
      );
      return;
    }

    const event = payload?.event;
    const data = payload?.data;

    if (!event || !data) {
      return { status: 'ignored', reason: 'No event or data in payload' };
    }

    if (event === 'TRANSACTION.SUCCESSFUL' && data.status === 0) {
      const reference = data.businessRef;
      const amount = data.transAmount; // Convert from Kobo

      const transaction = await this.transactionModel.findOne({ reference });

      if (!transaction.verified) {
        transaction.status = 'success';
        transaction.verified = true;
        transaction.amount = amount;
        transaction.customer = {
          firstname: data.customer?.firstName,
          lastname: data.customer?.lastName,
          email: data.customer?.customerEmail,
          phoneNo: data.customer?.phoneNo,
        };
        await transaction.save();

        // Update the corresponding request after a successful webhook
        await this.updateRequestPaymentStatus(transaction);
        return { status: 'verified', reference };
      } else {
        return { status: 'already verified', reference };
      }
    }

    return { status: 'no action taken', event };
  }

  async getTransactionStats() {
    const transactions = await this.transactionModel
      .find()
      .populate('userId', 'lgaOfOrigin firstname lastname email')
      .populate('certificateId', 'lgaOfOrigin stateOfOrigin')
      .populate('cardId')
      .populate('auctioneerId');
    const totalTransactions = await this.transactionModel.countDocuments();
    const allTransactions = await this.transactionModel.find({
      status: { $in: ['success', 'pending', 'failed'] },
    });

    const successfulTransactions = allTransactions.filter(
      (tx) => tx.status === 'success',
    );
    const totalAmountKobo = successfulTransactions.reduce(
      (sum, tx) => sum + (tx.documentAmount || 0),
      0,
    );

    const totalRevenue = totalAmountKobo; // convert from kobo to naira
    const avgTransaction =
      totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const successRate =
      allTransactions.length > 0
        ? (successfulTransactions.length / allTransactions.length) * 100
        : 0;

    // 🔹 Monthly Trend (group by createdAt month)
    const monthlyTrend: Record<string, number> = {};
    transactions
      .filter((t) => t.status === 'success')
      .forEach((t) => {
        const date = new Date(t.createdAt);
        const month = date.toLocaleString('default', { month: 'short' }); // e.g., "Jan"
        const amountInNaira = t.documentAmount || 0;
        monthlyTrend[month] = (monthlyTrend[month] || 0) + amountInNaira;
      });

    // 🔹 Revenue by state (for pie chart)
    const revenueByLGA: Record<string, number> = {};
    transactions
      .filter((t) => t.status === 'success')
      .forEach((t) => {
        let lga = 'Unknown';

        if (t.paymentType === 'certificate' && t.certificateId) {
          lga = (t.certificateId as any)?.lgaOfOrigin || 'Unknown';
        } else if (t.paymentType === 'card' && t.userId) {
          lga = (t.userId as any)?.lgaOfOrigin || 'Unknown';
        } else if (t.paymentType === 'auctioneer' && t.userId) {
          lga = (t.userId as any)?.lgaOfOrigin || 'Unknown';
        }

        // 🔹 Convert from kobo to naira
        const amountInNaira = t.documentAmount || 0;
        revenueByLGA[lga] = (revenueByLGA[lga] || 0) + amountInNaira;
      });

    return {
      totalTransactions,
      totalRevenue,
      avgTransaction,
      successRate: parseFloat(successRate.toFixed(1)),
      monthlyTrend,
      revenueByLGA,
    };
  }

  async findAll() {
    return this.transactionModel
      .find({})
      .sort({ createdAt: -1 })
      .populate('userId', 'firstname lastname email')
      .exec();
  }
  /**
   * Retrieves all successful transactions made by users from a specific Local Government Area (LGA).
   * @param lga The LGA to filter users by.
   * @returns A promise that resolves to an array of transactions.
   */
  async getTransactionsByLga(
    lga: string,
    startDate: string,
    endDate: string,
  ): Promise<Transaction[]> {
    if (!lga) {
      throw new Error('LGA query parameter is required.');
    }

    // ====== START: ADD DATE FILTERING LOGIC ======
    // Create a filter object to be used in the database queries.
    const dateMatch: any = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {}; // Assuming you have a `createdAt` field
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }
    // ====== END: DATE FILTERING LOGIC ======

    const pipeline = [
      // Stage 1: Filter for successful transactions first for efficiency
      {
        $match: {
          status: 'success',
          ...dateMatch,
        },
      },
      // Stage 2: Join with the 'users' collection to get user details
      {
        $lookup: {
          from: 'users', // The name of the User collection in MongoDB
          localField: 'userId', // Field from the Transaction collection
          foreignField: '_id', // Field from the User collection
          as: 'user', // Output array field name
        },
      },
      // Stage 3: Deconstruct the 'user' array field to a single object
      {
        $unwind: {
          path: '$user',
          // If a transaction has no matching user, it will be discarded
          preserveNullAndEmptyArrays: false,
        },
      },
      // Stage 4: Filter the results by the user's LGA of origin
      {
        $match: {
          'user.lgaOfOrigin': lga,
        },
      },
      // Stage 5 (Optional): Clean up the output document
      // This removes the 'user' object and other fields you might not need on the frontend
      {
        $project: {
          user: 0, // Exclude the entire user object
          __v: 0, // Exclude the version key
        },
      },
    ];

    return this.transactionModel.aggregate(pipeline).exec();
  }

  /**
   * Generates a PDF report of all transactions.
   * @param query Optional query parameters for filtering.
   * @returns A Buffer containing the PDF data.
   */
  async generatePdfReport(query: GetTransactionsReportDto): Promise<Buffer> {
    // 1. Build the query filter
    const filter: any = {};
    if (query.status) filter.status = query.status;
    if (query.startDate || query.endDate) {
      filter.createdAt = {};
      if (query.startDate) filter.createdAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.createdAt.$lte = new Date(query.endDate);
    }

    // 2. Fetch transactions from the database
    const transactions = await this.transactionModel
      .find(filter)
      .populate('userId', 'firstname lastname email')
      .sort({ createdAt: -1 })
      .exec();

    // 3. Create a new PDF document
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', buffers.push.bind(buffers));

    // 4. Add content to the PDF
    await this.addPdfContent(doc, transactions);

    // 5. Finalize the PDF and return as a Buffer
    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  /**
   * Helper function to add all content to the PDF document.
   */
  private async addPdfContent(
    doc: PDFDocument.PDFDocument,
    transactions: any[],
  ) {
    // --- Title and Metadata ---
    doc.fontSize(20).text('Transaction Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, {
      align: 'center',
    });
    doc.moveDown(2);

    // --- Summary Statistics ---
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(
      (t) => t.status === 'success',
    ).length;
    const totalRevenue =
      transactions
        .filter((t) => t.status === 'success')
        .reduce((sum, t) => sum + (t.amount || 0), 0) / 100; // Convert from kobo

    doc.fontSize(14).text('Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Total Transactions: ${totalTransactions}`);
    doc.text(`Successful Transactions: ${successfulTransactions}`);
    doc.text(
      `Total Revenue: ₦${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    );
    doc.moveDown(2);

    // --- Transactions Table ---
    doc.fontSize(14).text('Transaction Details', { underline: true });
    doc.moveDown(1);

    const tableTop = doc.y;
    const itemHeight = 30;
    const headers = ['ID', 'User', 'Type', 'Amount (₦)', 'Status', 'Date'];
    const columnWidths = [80, 100, 70, 70, 70, 90];
    let yPosition = tableTop;

    // Draw table headers
    headers.forEach((header, i) => {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(
          header,
          50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
          yPosition,
          { width: columnWidths[i] },
        );
    });

    // Draw a line under headers
    doc
      .moveTo(50, yPosition + 15)
      .lineTo(550, yPosition + 15)
      .stroke();
    yPosition += itemHeight;

    // Draw table rows
    doc.font('Helvetica').fontSize(10);
    transactions.forEach((transaction) => {
      // Check if we need a new page
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const row = [
        transaction._id.toString().slice(-6), // Shorten ID
        transaction.userId
          ? `${transaction.userId.firstname} ${transaction.userId.lastname}`
          : 'N/A',
        transaction.paymentType || 'N/A',
        `₦${(transaction.amount / 100).toLocaleString()}`,
        transaction.status,
        new Date(transaction.createdAt).toLocaleDateString(),
      ];

      row.forEach((text, i) => {
        doc.text(
          text,
          50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
          yPosition,
          { width: columnWidths[i] },
        );
      });
      yPosition += itemHeight;
    });
  }

  // Generate
  async generateRRR(paymentDetails: {
    amount: string | number;
    payerName: string;
    payerEmail: string;
    payerPhone: string;
    description?: string;
    orderId?: string;
  }) {
    try {
      const amount = String(paymentDetails.amount);
      const orderId = paymentDetails.orderId || `ORD_${Date.now()}`;

      const hashString =
        this.merchantId + this.serviceTypeId + orderId + amount + this.apiKey;

      const apiHash = crypto
        .createHash('sha512')
        .update(hashString)
        .digest('hex');

      const payload = {
        serviceTypeId: this.serviceTypeId,
        amount,
        orderId,
        payerName: paymentDetails.payerName,
        payerEmail: paymentDetails.payerEmail,
        payerPhone: paymentDetails.payerPhone,
        description: paymentDetails.description || 'Payment',
      };

      const url = `${this.remitaBaseUrl}/echannelsvc/merchant/api/paymentinit`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'My-Commerce-App/1.0', // Replace with your app name and version
          Authorization: `remitaConsumerKey=${this.merchantId},remitaConsumerToken=${apiHash}`,
        },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();

      // / --- DEBUGGING LOG START ---
      console.log('--- Remita Raw Response ---');
      console.log(raw);
      console.log('--- End Raw Response ---');
      // --- DEBUGGING LOG END ---

      let data: any = {};

      try {
        data = JSON.parse(raw);
      } catch {
        const cleaned = raw.replace(/^\(|\)$/g, '');

        try {
          data = JSON.parse(cleaned);
        } catch {
          cleaned.split('&').forEach((item) => {
            const [key, value] = item.split('=');
            data[key] = value;
          });
        }
      }

      console.log('Remita RRR Response:', data);

      const rrr = data.RRR;

      if (!rrr) {
        throw new Error(data.statusMessage || 'RRR not found in response');
      }

      const redirectHash = crypto
        .createHash('sha512')
        .update(this.merchantId + rrr + this.apiKey)
        .digest('hex');

      return {
        success: true,
        rrr,
        orderId,
        merchantId: this.merchantId,
        hash: redirectHash,
        message: 'RRR generated successfully',
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to generate RRR';
      throw new InternalServerErrorException(message);
    }
  }

  async verifyRrr(rrr: string) {
    // 1. Generate the hash exactly as documented: rrr + apiKey + merchantId
    const hashString = `${rrr}${this.apiKey}${this.merchantId}`;
    const apiHash = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex');

    // 2. Build the URL using the echannelsvc path from your doc
    // Make sure your remitaBaseUrl is "https://demo.remita.net/remita"
    const url = `${this.remitaBaseUrl}/echannelsvc/${this.merchantId}/${rrr}/${apiHash}/status.reg`;

    // 3. Set the specific Authorization header format required
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `remitaConsumerKey=${this.merchantId},remitaConsumerToken=${apiHash}`,
    };

    try {
      const response = await axios.get(url, { headers });
      const data = response.data;

      // 4. Check for success codes '00' or '01'
      const isSuccessful = data.status === '00' || data.status === '01';
      return {
        success: isSuccessful,
        rrr: rrr,
        transactionStatus: data.message,
        rawData: data,
      };
    } catch (error: any) {
      console.error(
        'Remita Verification Error Details:',
        error.response?.data || error.message,
      );

      throw new InternalServerErrorException(
        error.response?.data?.message || 'Payment verification failed',
      );
    }
  }

  async verifyCredo(reference: string) {
    const transaction = await this.transactionModel.findOne({ reference });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    const url = `${this.baseUrl}/transaction/${reference}/verify`;

    const response = await axios.get(url, {
      headers: { Authorization: this.secretKey },
    });

    const success = response.data?.data?.status === 0;

    if (!success) {
      throw new BadRequestException('Credo payment not successful');
    }

    await this.transactionModel.updateOne(
      { reference },
      {
        $set: {
          status: 'service_paid',
        },
      },
    );

    return {
      success: true,
      message: 'Service fee verified',
    };
  }

  async processReceiptUpload(
    file: Express.Multer.File,
    reference: string,
    userId: string | any, // Accept string or object just in case
  ) {
    // Safely convert to ObjectId
    let userObjectId;
    try {
      userObjectId =
        typeof userId === 'string'
          ? new mongoose.Types.ObjectId(userId)
          : userId;
    } catch (error) {
      throw new BadRequestException('Invalid User ID format.');
    }

    const transaction = await this.transactionModel.findOne({
      reference: reference.trim(), // Trim to remove accidental whitespace
      userId: userObjectId,
    });

    if (!transaction) {
      // LOG THE EXACT VALUES BEING SEARCHED SO YOU CAN SEE WHY IT FAILED
      console.error('Receipt Upload Failed. Searching for:', {
        reference: reference.trim(),
        userId: userObjectId,
      });
      throw new NotFoundException(
        'Transaction not found. Ensure you are logged into the account that initiated the payment.',
      );
    }

    if (transaction.status !== 'service_paid') {
      throw new BadRequestException(
        `Receipt can only be uploaded after service fee is paid. Current status: ${transaction.status}`,
      );
    }

    // Upload receipt to Cloudinary (using your existing service)
    const receiptUrl = await this.cloudinaryService.uploadFile(
      file,
      fileUploadConfig.folders.paymentReceipts,
      fileUploadConfig.allowedMimeTypes,
      5,
    );

    // Update transaction
    transaction.receiptUrl = receiptUrl;
    transaction.receiptUploadedAt = new Date();
    transaction.status = 'receipt_uploaded'; // New status for admins to review
    await transaction.save();

    return {
      success: true,
      message: 'Receipt uploaded successfully. Awaiting admin verification.',
    };
  }

  // In your TransactionService
  async adminApproveReceipt(transactionId: string) {
    const transaction = await this.transactionModel.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== 'receipt_uploaded') {
      throw new BadRequestException(
        `Cannot approve. Current status is '${transaction.status}'.`,
      );
    }

    // Mark as successful
    transaction.status = 'success';
    transaction.verified = true;
    transaction.verifiedAt = new Date();
    await transaction.save();

    // Trigger whatever happens when payment is successful (e.g., update the Certificate/ID card status)
    await this.updateRequestPaymentStatus(transaction);

    return {
      success: true,
      message: 'Receipt approved and payment marked as successful.',
    };
  }

  async adminRejectReceipt(transactionId: string, reason: string) {
    const transaction = await this.transactionModel.findById(transactionId);

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Can only reject if a receipt is currently pending review
    if (transaction.status !== 'receipt_uploaded') {
      throw new BadRequestException(
        `Cannot reject. Current status is '${transaction.status}', expected 'receipt_uploaded'.`,
      );
    }

    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Please provide a reason for rejection.');
    }

    // 1. Revert status back to service_paid so the user can upload again
    transaction.status = 'service_paid';

    // 2. Clear the bad receipt data
    transaction.receiptUrl = null;
    transaction.receiptUploadedAt = null;

    await transaction.save();

    // 3. Notify the user (Assuming you have access to NotificationsService)
    try {
      await this.notificationsService.createSystemNotification(
        transaction.userId.toString(),
        'Payment Receipt Rejected',
        `The receipt you uploaded for your ${transaction.paymentType} fee was rejected. Reason: ${reason}. Please upload a valid receipt.`,
        'payment',
        '/dashboard/requests',
      );
    } catch (notifError) {
      console.error('Failed to send rejection notification:', notifError);
      // Don't throw here, the main rejection was successful
    }

    return {
      success: true,
      message: 'Receipt rejected. User has been notified to re-upload.',
    };
  }
}
