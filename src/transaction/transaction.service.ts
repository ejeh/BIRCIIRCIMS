import { Injectable } from '@nestjs/common';
import mongoose, { Model, Types } from 'mongoose';
import { Transaction } from './transaction.schema';
import { InjectModel } from '@nestjs/mongoose';
import axios from 'axios';
import { IndigeneCertificateService } from 'src/indigene-certificate/indigene-certificate.service';
import { IdcardService } from 'src/idcard/idcard.service';
import PDFDocument from 'pdfkit'; // Import pdfkit
import { GetTransactionsReportDto } from './src/transaction/dto/get-transactions-report.dto';

@Injectable()
export class TransactionService {
  constructor(
    @InjectModel('Transaction')
    private readonly transactionModel: Model<Transaction>,
    private readonly indigeneCertificateService: IndigeneCertificateService,
    private readonly idcardService: IdcardService, // <-- INJECT IT
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

  /**
   * Helper method to update the payment status of the associated request.
   * @param transaction The successful transaction document.
   */
  private async updateRequestPaymentStatus(transaction: Transaction) {
    try {
      if (transaction.paymentType === 'card' && transaction.cardId) {
        await this.idcardService.updatePaymentStatus(
          transaction.cardId.toString(),
          'paid',
        );
        console.log(
          `Updated payment status for ID Card: ${transaction.cardId}`,
        );
      } else if (
        transaction.paymentType === 'certificate' &&
        transaction.certificateId
      ) {
        await this.indigeneCertificateService.updatePaymentStatus(
          transaction.certificateId.toString(),
          'paid',
        );
        console.log(
          `Updated payment status for Certificate: ${transaction.certificateId}`,
        );
      }
    } catch (error) {
      console.error(
        `Failed to update payment status for transaction ${transaction._id}:`,
        error,
      );
      // Depending on your requirements, you might want to throw the error
      // or just log it. For now, we'll log it.
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
      // await this.transactionModel.findOneAndUpdate(
      //   { reference },
      //   { status: 'successful' },
      // );

      const updatedTransaction = await this.transactionModel
        .findOneAndUpdate(
          { reference },
          { status: 'success' },
          { new: true }, // <-- Important: return the updated doc
        )
        .exec();

      // Update the corresponding request (ID card or Certificate)
      await this.updateRequestPaymentStatus(updatedTransaction);
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
      .populate('cardId');
    const totalTransactions = await this.transactionModel.countDocuments();
    const allTransactions = await this.transactionModel.find({
      status: { $in: ['success', 'pending', 'failed'] },
    });

    const successfulTransactions = allTransactions.filter(
      (tx) => tx.status === 'success',
    );
    const totalAmountKobo = successfulTransactions.reduce(
      (sum, tx) => sum + (tx.amount || 0),
      0,
    );

    const totalRevenue = totalAmountKobo / 100; // convert from kobo to naira
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
        const amountInNaira = (t.amount || 0) / 100;
        monthlyTrend[month] = (monthlyTrend[month] || 0) + amountInNaira;
      });

    //   // 🔹 Revenue by State (if user has address or LGA)
    //   const revenueByState: Record<string, number> = {};
    //   transactions.forEach(t => {
    //     const state = (typeof t.userId === 'object' && 'lgaOfOrigin' in t.userId)
    //       ? (t.userId as any).lgaOfOrigin
    //       : 'Unknown';
    //     // 🔹 Convert from kobo to naira
    //   const amountInNaira = (t.amount || 0) / 100;
    //   revenueByState[state] = (revenueByState[state] || 0) + amountInNaira;

    // });

    // 🔹 Revenue by state (for pie chart)
    const revenueByLGA: Record<string, number> = {};
    transactions
      .filter((t) => t.status === 'success')
      .forEach((t) => {
        let lga = 'Unknown';

        if (t.paymentType === 'certificate' && t.certificateId) {
          lga = (t.certificateId as any)?.lgaOfOrigin || 'Unknown';
        } else if (t.paymentType === 'card' && t.userId) {
          lga =
            (t.userId as any)?.lgaOfOrigin ||
            // (t.userId as any)?.residentialState ||
            'Unknown';
        }
        // 🔹 Convert from kobo to naira
        const amountInNaira = (t.amount || 0) / 100;
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
}
