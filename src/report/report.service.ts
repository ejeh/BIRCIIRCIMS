import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Report, ReportSchema } from './schemas/report.schema';
import { ScheduledReport } from './schemas/scheduled-report.schema';
import PDFDocument from 'pdfkit';
import { UsersService } from '../users/users.service'; // To get stats
import { IdCard } from 'src/idcard/idcard.schema';
import { Certificate } from 'src/indigene-certificate/indigene-certicate.schema';

@Injectable()
export class ReportService {
  constructor(
    @InjectModel(Report.name) private reportModel: Model<Report>,
    @InjectModel(ScheduledReport.name)
    private scheduledReportModel: Model<ScheduledReport>,
    private usersService: UsersService,
    @InjectModel(IdCard.name) private idCardModel: Model<IdCard>,
    @InjectModel(Certificate.name) private certModel: Model<Certificate>,
  ) {}

  /**
   * Generates a report for a specific frequency and saves it to the database.
   */
  async generateReport(
    type: 'monthly' | 'quarterly' | 'annual',
    generatedBy: string,
  ): Promise<Report> {
    // 1. Get the data from the UsersService
    const stats = await this.usersService.getDashboardStats();

    // 2. Generate the PDF content
    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    this.addReportContent(doc, stats, type);

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', async () => {
        const pdfBuffer = Buffer.concat(buffers);

        // 3. Save the report to the database
        const newReport = new this.reportModel({
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ${new Date().toLocaleDateString()}`,
          type,
          generatedBy,
          fileData: pdfBuffer,
        });

        const savedReport = await newReport.save();
        resolve(savedReport);
      });
    });
  }

  /**
   * Retrieves all generated reports.
   */
  async findAllReports(): Promise<Report[]> {
    return this.reportModel.find().sort({ generatedAt: -1 }).exec();
  }

  /**
   * Streams a specific report file.
   */
  async streamReportFile(id: string) {
    const report = await this.reportModel.findById(id);
    if (!report) {
      throw new NotFoundException('Report not found.');
    }
    return report;
  }

  /**
   * Creates a new scheduled report.
   */
  async scheduleReport(createDto: {
    name: string;
    frequency: string;
    lga: string;
    createdBy: string;
  }) {
    const newSchedule = new this.scheduledReportModel(createDto);
    return newSchedule.save();
  }

  /**
   * Finds all scheduled reports.
   */
  async findAllScheduledReports() {
    return this.scheduledReportModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Helper to add content to the PDF.
   */
  private addReportContent(
    doc: PDFDocument.PDFDocument,
    stats: any,
    type: string,
  ) {
    doc
      .fontSize(20)
      .text(`${type.charAt(0).toUpperCase() + type.slice(1)} Report`, {
        align: 'center',
      });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`);
    doc.moveDown(2);

    doc.fontSize(14).text('Key Performance Indicators', { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(
        `Total Registered Users: ${stats.totals.certificates + stats.totals.idcards}`,
      );
    doc.text(`Total Transactions: ${stats.payments.total}`);
    doc.text(
      `Total Revenue: ₦${(stats.payments.totalAmount / 100).toLocaleString()}`,
    );
    doc.moveDown(2);

    doc.fontSize(14).text('Request Status', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Approved: ${stats.requestStatus.Approved}`);
    doc.text(`Pending: ${stats.requestStatus.Pending}`);
    doc.text(`Rejected: ${stats.requestStatus.Rejected}`);
    // ... add more content as needed
  }

  // ... other existing methods ...

  /**
   * Generates a PDF report of the current dashboard view.
   */
  async generateDashboardPdfReport(
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const stats = await this.usersService.getDashboardStats(startDate, endDate);

    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // --- Add Content to PDF ---
    doc.fontSize(20).text('Dashboard Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`);
    if (startDate || endDate) {
      doc.text(
        `For period: ${startDate || 'the beginning'} to ${endDate || 'now'}`,
      );
    }
    doc.moveDown(2);

    // --- KPIs ---
    doc.fontSize(14).text('Key Performance Indicators', { underline: true });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .text(
        `Total Registered Users: ${stats.totals.certificates + stats.totals.idcards}`,
      );
    doc.text(
      `Total Requests: ${stats.totals.certificates + stats.totals.idcards}`,
    ); // Adjust based on your stats
    doc.text(
      `Total Revenue: ₦${(stats.payments.totalAmount / 100).toLocaleString()}`,
    );
    doc.moveDown(2);

    // --- Request Status ---
    doc.fontSize(14).text('Request Status Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Approved: ${stats.requestStatus.Approved}`);
    doc.text(`Pending: ${stats.requestStatus.Pending}`);
    doc.text(`Rejected: ${stats.requestStatus.Rejected}`);
    doc.moveDown(2);

    // --- Top LGAs ---
    doc.fontSize(14).text('Top LGAs by Requests', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    stats.topLGAs.forEach((lga) => {
      doc.text(`${lga.name}: ${lga.count}`);
    });

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  /**
   * Generates a PDF report of all certificate and ID card requests.
   */
  async generateRequestsPdfReport(
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const dateMatch: any = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {};
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }

    const [certificates, idcards] = await Promise.all([
      this.certModel
        .find(dateMatch)
        .populate(
          'userId',
          'firstname lastname email stateOfOrigin lgaOfOrigin',
        )
        .lean(),
      this.idCardModel
        .find(dateMatch)
        .populate(
          'userId',
          'firstname lastname email stateOfOrigin lgaOfOrigin',
        )
        .lean(),
    ]);

    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // --- Add Content to PDF ---
    doc.fontSize(20).text('Requests Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`);
    if (startDate || endDate) {
      doc.text(
        `For period: ${startDate || 'the beginning'} to ${endDate || 'now'}`,
      );
    }
    doc.moveDown(2);

    // --- Certificate Requests ---
    doc
      .fontSize(14)
      .text('Certificate of Origin Requests', { underline: true });
    doc.moveDown(1);
    doc.fontSize(10);
    certificates.forEach((cert) => {
      const user = cert.userId as any;
      doc.text(`Name: ${user.firstname} ${user.lastname}`);
      doc.text(`State/LGA: ${user.stateOfOrigin} / ${user.lgaOfOrigin}`);
      doc.text(`Kindred: ${cert.kindred}`);
      doc.text(`Status: ${cert.status}`);
      doc.text(
        `Request Date: ${new Date(cert.created_at).toLocaleDateString()}`,
      );
      doc.moveDown(0.5);
    });

    doc.addPage();

    // --- ID Card Requests ---
    doc.fontSize(14).text('Identity Card Requests', { underline: true });
    doc.moveDown(1);
    doc.fontSize(10);
    idcards.forEach((card) => {
      const user = card.userId as any;
      doc.text(`Name: ${user.firstname} ${user.lastname}`);
      doc.text(`State/LGA: ${user.stateOfOrigin} / ${user.lgaOfOrigin}`);
      doc.text(`Status: ${card.status}`);
      doc.text(
        `Request Date: ${new Date(card.created_at).toLocaleDateString()}`,
      );
      doc.moveDown(0.5);
    });

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }
}
