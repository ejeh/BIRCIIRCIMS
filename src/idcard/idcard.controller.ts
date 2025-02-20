import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IdcardService } from './idcard.service';
import { UsersService } from 'src/users/users.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';

import path, { extname } from 'path';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { IdCard } from './idcard.schema';
import { UserRole } from 'src/users/users.role.enum';
import { UserNotFoundException } from 'src/common/exception';
import * as fs from 'fs';
import QRCode from 'qrcode';

@ApiTags('idCard.controller')
@UseGuards(JwtAuthGuard)
@Controller('api/idcard')
export class IdcardController {
  constructor(
    private readonly idcardService: IdcardService,
    private readonly userService: UsersService,
  ) {}

  @Post('create')
  @UseInterceptors(
    FilesInterceptor('files', 2, {
      dest: './uploads',
      limits: { fileSize: 1024 * 1024 * 5 },
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async createIdCard(
    @Body() body: any,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    const data = {
      ...body,
      bin: await this.idcardService.generateUniqueBIN(),
      ref_letter: files[0]?.path,
      utilityBill: files[1]?.path,
    };

    // Notify admin
    const adminEmail = 'ejehgodfrey@gmail.com';
    const adminPhone = '+1234567890';

    await this.userService.sendRequest(
      adminEmail,
      'New Request',
      `Request for identity card 
          from ${body.lastname}
          `,
    );

    return this.idcardService.createIdCard(data);
  }
  @Get('request')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: IdCard, isArray: true })
  @Roles(UserRole.SUPPORT_ADMIN, UserRole.SUPER_ADMIN)
  async getRequestsByStatuses(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('statuses') statuses: string = 'Pending,Rejected',
  ) {
    const statusArray = statuses.split(',');

    return this.idcardService.findCardRequestsByStatuses(
      page,
      limit,
      statusArray,
    );
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: IdCard, isArray: false })
  async approveCert(@Param('id') id: string, @Body() Body: any) {
    return await this.idcardService.approveIdCard(id);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: IdCard, isArray: false })
  async rejectCert(
    @Param('id') id: string,
    @Body('rejectionReason') rejectionReason: string,
  ) {
    console.log(rejectionReason);
    // Notify user
    const user = await this.idcardService.findCardById(id);
    if (!user) {
      throw UserNotFoundException();
    }

    await this.userService.sendRequest(
      user.email,
      ' Request rejected',
      `Rejection Reason: ${rejectionReason}
           `,
    );

    return await this.idcardService.rejectCard(id, rejectionReason);
  }

  @Get(':id/request')
  @ApiResponse({ type: IdCard, isArray: false })
  async getUserProfile(@Param('id') id: string, @Body() body: any) {
    return await this.idcardService.findById(id);
  }

  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.idcardService.deleteItem(item);
  }

  @Get('download/:id')
  @ApiResponse({ type: IdCard, isArray: false })
  async downloadCertificate(@Param('id') id: string, @Res() res: Response) {
    try {
      const card = await this.idcardService.findCertificateById(id);

      const user = await this.userService.findById(card.userId);

      if (!card) {
        return res.status(404).json({ message: 'Card not found' });
      }

      if (card.downloaded) {
        return res
          .status(400)
          .json({ message: 'Card has already been downloaded.' });
      }

      const date = new Date(user.DOB);
      const formattedDOB = date.toISOString().split('T')[0]; // Extracts YYYY-MM-DD

      const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | BIN: ${card.bin} | DOB: ${formattedDOB} | Sex: ${user.gender}`;

      const qrCodeUrl = await this.generateQrCode(qrCodeData); // Generate QR code URL
      card.qrCodeUrl = qrCodeUrl; // Save the QR code URL in the card

      const htmlTemplate = await this.loadHtmlTemplate('card-template.html');
      const populatedHtml = this.populateHtmlTemplate(htmlTemplate, card, user);

      const pdfPath = await this.idcardService.generateIDCardPDF(
        id,
        populatedHtml,
      );

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=certificate.pdf',
      );

      // Stream the file instead of reading it fully into memory
      res.download(pdfPath, 'certificate.pdf', async (err) => {
        if (err) {
          console.error('Error sending file:', err);
          return res.status(500).json({ message: 'Error downloading file' });
        }

        // Mark as downloaded and delete temp file after sending
        await this.markCertificateAsDownloaded(id);
        // this.cleanupTempFile(pdfPath);
      });
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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
    const dob = new Date(user.DOB);
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
      .replace(/{{name}}/g, user.firstname + ' ' + user.middlename)
      .replace(/{{surname}}/g, data.lastname)
      .replace(/{{dob}}/g, formattedDOB)
      .replace(/{{bin}}/g, data.bin)
      .replace(/{{passportPhoto}}/g, user.passportPhoto)
      .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
      .replace(/{{issueDate}}/g, formattedDateOfIssue)
      .replace(/{{gender}}/g, user.gender);
  }

  private async markCertificateAsDownloaded(id: string): Promise<void> {
    try {
      await this.idcardService.markAsDownloaded(id);
    } catch (updateErr) {
      console.error('Error marking certificate as downloaded:', updateErr);
    }
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

  @Get(':id')
  @ApiResponse({ type: IdCard, isArray: false })
  async getProfile(@Param('id') id: string, @Body() body: any) {
    console.log(id);
    return await this.idcardService.findOne(id);
  }

  @Post(':id/resubmit')
  @ApiResponse({ type: IdCard, isArray: false })
  resubmitRequest(@Param('id') id: string, @Body() updatedData: any) {
    return this.idcardService.resubmitRequest(id, updatedData);
  }

  @Get(':id/get')
  @ApiResponse({ type: IdCard, isArray: false })
  async getCert(@Param('id') id: string, @Body() body: any) {
    return await this.idcardService.findById(id);
  }
}
