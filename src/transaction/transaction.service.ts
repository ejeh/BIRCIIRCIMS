import { Injectable } from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
import { Transaction } from './transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { IndigeneCertificateService } from 'src/indigene-certificate/indigene-certificate.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private readonly indigeneCertificateService: IndigeneCertificateService,
  ) {}
  private readonly baseUrl = 'https://api.credodemo.com'; // Update if needed
  private readonly secretKey = process.env.CREDO_SECRET_KEY; // Store in .env

  async initializePayment(data: {
    certificateId: string;
    cardId: string;
    userId: string;
    amount: number;
    email: string;
    currency?: string;
    reference?: string;
    paymentType: 'card' | 'certificate';
  }) {
    const bearer = 0;
    const userObjectId = new mongoose.Types.ObjectId(data.userId);
    let paymentReference: any = null;

    // Dynamically set the appropriate reference field
    if (data.paymentType === 'card' && data.cardId) {
      paymentReference = { cardId: new mongoose.Types.ObjectId(data.cardId) };
    } else if (data.paymentType === 'certificate' && data.certificateId) {
      paymentReference = {
        certificateId: new mongoose.Types.ObjectId(data.certificateId),
      };
    } else {
      throw new Error('Invalid payment type or missing identifier');
    }

    // 🔁 Check for existing pending transaction for this user and the specific item (card or certificate)
    const existing = await this.transactionModel.findOne({
      userId: userObjectId,
      ...(data.paymentType === 'card' &&
        paymentReference.cardId && { cardId: paymentReference.cardId }),
      ...(data.paymentType === 'certificate' &&
        paymentReference.certificateId && {
          certificateId: paymentReference.certificateId,
        }),
      status: 'pending',
    });

    if (existing) {
      return {
        status: 200,
        message: 'Existing transaction found',
        data: { reference: existing.reference },
      };
    }

    // ✅ Generate a fresh unique reference if not provided
    const reference =
      data.reference ||
      `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // 🧾 Create new transaction entry in your DB
    const newTransaction = new this.transactionModel({
      userId: userObjectId,
      reference,
      amount: data.amount,
      email: data.email,
      status: 'pending',
      currency: data.currency || 'NGN',
      paymentType: data.paymentType,
      ...paymentReference,
    });

    await newTransaction.save();

    // 🌍 Call Credo to initialize the transaction
    try {
      const payload = {
        amount: data.amount,
        reference,
        bearer: 0,
        currency: data.currency || 'NGN',
        email: data.email,
        customer: {
          email: data.email,
        },
      };

      const headers = {
        Authorization: this.secretKey,
        'Content-Type': 'application/json',
      };

      const url = `${this.baseUrl}/transaction/initialize`;
      const credoResponse = await axios.post(url, payload, { headers });

      return {
        status: 200,
        message: 'Transaction initialized',
        data: {
          reference,
          // Optional: add checkoutUrl if you need it for client redirect
          // checkoutUrl: credoResponse.data?.data?.checkoutUrl
        },
      };
    } catch (err) {
      console.error('Credo init error:', err?.response?.data || err.message);
      throw new Error('Credo payment initialization failed');
    }
  }

  async verifyPayment(reference: string) {
    const url = `${this.baseUrl}/transaction/${reference}/verify`;
    const headers = { Authorization: `${this.secretKey}` };

    const transaction = await this.transactionModel.findOne({
      reference,
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status !== 'pending') {
      throw new Error('Transaction already processed');
    }

    const response = await axios.get(url, { headers });

    if (response.data.status === 200) {
      await this.transactionModel.findOneAndUpdate(
        { reference },
        { status: 'successful' },
      );
    } else {
      await this.transactionModel.findOneAndUpdate(
        { reference },
        { status: 'failed' },
      );
    }

    return response.data;
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
      .find({ status: 'successful' })
      .populate('certificateId') // Populate item details
      // .populate('userId') // Populate user details
      .exec();

    console.log('Completed Payments:', completedPayments);

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
    console.log('Credo Webhook Payload:', payload);

    const { reference, amount, status, customer } = payload;

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
          firstname: data.customer.firstName,
          lastname: data.customer.lastName,
          email: data.customer.customerEmail,
          phoneNo: data.customer.phoneNo,
        };
        await transaction.save();
        return { status: 'verified', reference };
      } else {
        return { status: 'already verified', reference };
      }
    }

    return { status: 'no action taken', event };
  }
}
