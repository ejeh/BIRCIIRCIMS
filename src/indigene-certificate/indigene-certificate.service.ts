import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Response } from 'express';
import { Certificate } from './indigene-certicate.schema';
import { UserNotFoundException } from 'src/common/exception';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class IndigeneCertificateService {
  constructor(
    @InjectModel(Certificate.name)
    public readonly certificateModel: Model<Certificate>,
  ) {}

  async createCertificate(data: Partial<Certificate>): Promise<Certificate> {
    return this.certificateModel.create(data);
  }

  async findCertificateById(id: string): Promise<Certificate> {
    return this.certificateModel.findById(id);
  }

  async findOne(id: string): Promise<Certificate> {
    const certicate = await this.certificateModel.findOne({ userId: id });

    return certicate;
  }

  async findById(id: string): Promise<Certificate> {
    const user = await this.certificateModel.findById(id);
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

  async approveCertificate(id: string): Promise<Certificate> {
    return this.certificateModel
      .findByIdAndUpdate(id, { status: 'Approved' }, { new: true })
      .exec();
  }

  async rejectCertificate(
    id: string,
    rejectionReason: string,
  ): Promise<Certificate> {
    return this.certificateModel
      .findByIdAndUpdate(
        id,
        {
          status: 'Rejected',
          rejectionReason: rejectionReason,
          resubmissionAllowed: true,
        },
        { new: true },
      )
      .exec();
  }

  async resubmitRequest(
    id: string,
    updatedData: Partial<Certificate>,
  ): Promise<Certificate> {
    const request = await this.certificateModel.findById(id);
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

    return this.certificateModel.findByIdAndUpdate(
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

  async markAsDownloaded(id: string): Promise<void> {
    await this.certificateModel.updateOne(
      { _id: id },
      { $set: { downloaded: true } },
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
    doc.text(`${applicant.LGA}`);
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
        `I, "senderFistName" senderLastName, a native of ${applicant.ward}, in ${applicant.LGA} of Benue State, hereby write to formally attest that ${applicant.firstname} ${applicant.lastname}, who is a bona fide indigene of ${applicant.ward}, in ${applicant.LGA}, Benue State.`,
      )
      .moveDown();

    doc
      .text(
        `${applicant.firstname} ${applicant.lastname} was born on ${applicant.DOB}, to ${applicant.fathersName} and ${applicant.mothersName}, both of whom are recognized natives of ${applicant.ward}. He/She has continuously identified with our community and has actively participated in cultural and communal activities, confirming his/her roots in this locality.`,
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
}
