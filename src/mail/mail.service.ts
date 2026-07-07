// src/mail/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import config from 'src/config';

@Injectable()
export class MailService {
  private mg;
  private domain: string;
  private from: string;

  private readonly logger = new Logger(MailService.name);

  constructor(private configService: ConfigService) {
    const mailgun = new Mailgun(formData);
    this.mg = mailgun.client({
      username: 'api',
      key: this.configService.get<string>('MAILGUN_API_KEY'),
    });

    this.domain = this.configService.get<string>('MAILGUN_DOMAIN');
    this.from = this.configService.get<string>('MAILGUN_FROM');
  }

  async sendActivationMail(
    to: string,
    userId: string,
    activationToken: string,
    templateName: string,
  ) {
    const getBaseUrl = (): string =>
      config.isDev
        ? process.env.BASE_URL || 'http://localhost:5000'
        : 'https://api.citizenship.benuestate.gov.ng';

    const activationUrl = `${getBaseUrl()}/api/auth/activate/${userId}/${activationToken}`;

    const context = { link: activationUrl };

    // Skip sending in test mode
    if (config.isTest) {
      console.log(
        `[Mailgun] Test mode: Pretending to send activation to ${to}`,
      );
      return { success: true, dev: true };
    }

    try {
      // In dev (sandbox), make sure recipient is authorized
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for ${to}`,
        );
      }

      const templatePath = path.join(
        process.cwd(),
        'templates',
        `${templateName}.hbs`,
      );
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      const source = fs.readFileSync(templatePath, 'utf-8');
      const compiled = handlebars.compile(source);
      const html = compiled(context);

      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <postmaster@${this.domain}>`,
        to,
        subject: 'Welcome to Benue Resident ID',
        html,
      });

      return { success: true, response };
    } catch (error) {
      const err = error as any;
      console.error('Mailgun Error:', err);
      return {
        success: false,
        message:
          err?.details || err?.message || 'Failed to send activation email',
        status: err?.status || 500,
      };
    }
  }

  async sendForgottenPasswordMail(
    to: string,
    passwordResetToken: string,
    origin: string,
  ) {
    const context = {
      baseUrl: origin,
      link: `${origin}/app/auth/reset-password.html?token=${passwordResetToken}`,
    };

    if (config.isTest) {
      console.log(
        `[Mailgun] Test mode: Pretending to send password reset to ${to}`,
      );
      return { success: true, dev: true };
    }

    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for ${to}`,
        );
      }

      const templatePath = path.join(
        process.cwd(),
        'templates',
        `reset-password.hbs`,
      );
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found: ${templatePath}`);
      }

      const source = fs.readFileSync(templatePath, 'utf-8');
      const compiled = handlebars.compile(source);
      const html = compiled(context);

      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <noreply@${this.domain}>`,
        to,
        subject: 'Reset your password',
        html,
      });

      return { success: true, response };
    } catch (error) {
      const err = error as any;
      console.error('Mailgun Error:', err);
      return {
        success: false,
        message:
          err?.details || err?.message || 'Failed to send password reset email',
        status: err?.status || 500,
      };
    }
  }

  async sendResetPasswordMail(email: string) {
    // if (!config.isTest) {
    if (config.isTest) {
      console.log(
        `[Mailgun] Test mode: Pretending to send password reset to ${email}`,
      );
      return { success: true, dev: true };
    }
    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for ${email}`,
        );
      }
      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <noreply@${this.domain}>`,
        to: email,
        subject: 'Your password has been changed',
        text: `Hello,\n\nThis is a confirmation that the password for your account ${email} has just been changed.\n`,
      });

      // return response;
      return { success: true, response };
    } catch (error) {
      const err = error as any;
      console.error('Mailgun Error:', err);
      return {
        success: false,
        message:
          err?.details || err?.message || 'Failed to send password reset email',
        status: err?.status || 500,
      };
    }
    // }
  }

  async sendMailRequest(email: string, subject: string, body: string) {
    console.log('email', email);
    // if (!config.isTest) {
    if (config.isTest) {
      console.log(
        `[Mailgun] Test mode: Pretending to send password reset to ${email}`,
      );
      return { success: true, dev: true };
    }
    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for ${email}`,
        );
      }
      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <noreply@${this.domain}>`,
        to: email,
        subject: subject,
        text: body,
      });

      // return response;
      return { success: true, response };
    } catch (error) {
      const err = error as any;
      console.error('Mailgun Error:', err);
      return {
        success: false,
        message: err?.details || err?.message,
        status: err?.status || 500,
      };
    }
    // }
  }

  async sendReferenceVerificationEmail(
    type: string,
    email: string,
    name: string,
    verificationLink: string,
    applicantName: string,
  ) {
    // Skip sending in test mode
    if (config.isTest) {
      console.log(
        `[Mailgun] Test mode: Pretending to send family verification email to ${email}`,
      );
      return { success: true, dev: true };
    }

    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for ${email}`,
        );
      }

      let htmlBody: string = '';
      let textBody: string = '';
      let subject: string = '';

      if (type === 'family') {
        subject = 'Family Verification Request - Benue Resident ID';

        // const subject = `Please Verify ${applicantName}'s ID Card Application`;

        htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Family Verification Request</h2>
        <p>Dear ${name},</p>
        <p>${applicantName} has listed you as a family member for their Benue Resident ID application.</p>
        <p>Please help us verify their information by clicking the link below:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Application</a>
          <p>This link will expire in 7 days.</p>
          <p>If you did not expect this verification request, you can safely ignore this email.</p>
          <p>Thank you for your cooperation.</p>
          <p>Benue Resident ID Team</p>
          </div>
          `;

        textBody = `
          Family Verification Request
          
          Dear ${name},
          
          ${applicantName} has listed you as a family member for their Benue Resident ID application.
          
          Please help us verify their information by visiting this link:
        ${verificationLink}
        
        This link will expire in 7 days.
        
        If you did not expect this verification request, you can safely ignore this email.
        
        Thank you for your cooperation.
        Benue Resident ID Team
        `;
      } else if (type === 'neighbor') {
        subject = 'Neighbor Verification Request - Benue Resident ID';

        htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Neighbor Verification Request</h2>
        <p>Dear ${name},</p>
        <p>${applicantName} has listed you as a neighbor for their Benue Resident ID application.</p>
        <p>Please help us verify their information by clicking the link below:</p>
        <a href="${verificationLink}" style="display: inline-block; background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Application</a>
          <p>This link will expire in 7 days.</p>
          <p>If you did not expect this verification request, you can safely ignore this email.</p>
          <p>Thank you for your cooperation.</p>
          <p>Benue Resident ID Team</p>
          </div>
          `;
        textBody = `
          Neighbor Verification Request
          
          Dear ${name},
          
          ${applicantName} has listed you as a neighbor for their Benue Resident ID application.
          Please help us verify their information by visiting this link:
        ${verificationLink}
        This link will expire in 7 days.
        
        If you did not expect this verification request, you can safely ignore this email.
        Thank you for your cooperation.
        Benue Resident ID Team
        `;
      }

      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <noreply@${this.domain}>`,
        to: email,
        subject: subject,
        text: textBody,
        html: htmlBody,
      });

      return { success: true, response };
    } catch (error) {
      const err = error as any;
      console.error('Mailgun Error:', err);
      return {
        success: false,
        message: err?.details || err?.message,
        status: err?.status || 500,
      };
    }
  }

  async sendWelcomePasswordEmail(email: string, password: string) {
    // if (!config.isTest) {
    if (config.isTest) {
      console.log(
        `[Mailgun] Test mode: Pretending to send password reset to ${email}`,
      );
      return { success: true, dev: true };
    }
    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for ${email}`,
        );
      }

      const message = `Welcome to Benue Resident ID!\n\nYour account has been created successfully. Here are your login details:\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and change your password immediately for security reasons.\n\nThank you for joining us!\n\nBest regards,\nBenue Resident ID Team`;

      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <noreply@${this.domain}>`,
        to: email,
        subject: 'Your New Account Login Details',
        text: message,
      });
      return { success: true, response };
    } catch (error) {
      const err = error as any;
      console.error('Mailgun Error:', err);
      return {
        success: false,
        message:
          err?.details ||
          err?.message ||
          'Failed to send welcome password email',
        status: err?.status || 500,
      };
    }
  }

  /**
   * Send new request notification to admins
   * @param adminEmails - Array of admin emails retrieved from UserModel
   * @param data - Request details
   */
  async sendNewRequestNotificationToAdmins(
    adminEmails: string[],
    data: {
      requesterName: string;
      requesterEmail: string;
      requestType: string;
      requestId: string;
      submittedAt: Date | string;
    },
  ) {
    if (config.isTest) {
      this.logger.log(
        `[Mailgun] Test mode: Pretending to send new request notification to ${adminEmails.length} admin(s)`,
      );
      return { success: true, dev: true };
    }

    if (!adminEmails || adminEmails.length === 0) {
      this.logger.warn('No admin emails provided. Notification not sent.');
      return { success: false, message: 'No admin emails provided' };
    }

    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for: ${adminEmails.join(', ')}`,
        );
      }

      const formattedDate = new Date(data.submittedAt).toLocaleString();
      const subject = `New ${data.requestType} Request - ${data.requesterName}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f6f9;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">📄 New Request Submitted</h1>
          </div>
          <div style="background: #ffffff; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>A new request has been submitted and requires your attention.</p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057; width: 40%;">Requester:</td>
                  <td style="padding: 12px 0; color: #212529;">${data.requesterName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Email:</td>
                  <td style="padding: 12px 0; color: #212529;">${data.requesterEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Request Type:</td>
                  <td style="padding: 12px 0; color: #212529;">
                    <span style="display: inline-block; background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${data.requestType}</span>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Request ID:</td>
                  <td style="padding: 12px 0; color: #212529; font-family: monospace;">${data.requestId}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Submitted:</td>
                  <td style="padding: 12px 0; color: #212529;">${formattedDate}</td>
                </tr>
              </table>
            </div>
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p>This is an automated notification from Benue Resident ID Portal.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      `;

      const textBody = `
        NEW REQUEST SUBMITTED
        ======================

        A new request has been submitted and requires your attention.

        Requester: ${data.requesterName}
        Email: ${data.requesterEmail}
        Request Type: ${data.requestType}
        Request ID: ${data.requestId}
        Submitted: ${formattedDate}

        ---
        This is an automated notification from Benue Resident ID Portal.
      `;

      const response = await this.mg.messages.create(this.domain, {
        from: `Benue Resident ID <noreply@${this.domain}>`,
        to: adminEmails, // Mailgun accepts array of emails
        subject,
        html,
        text: textBody,
      });

      this.logger.log(
        `New request notification sent to ${adminEmails.length} admin(s) for request: ${data.requestId}`,
      );

      return { success: true, response };
    } catch (error) {
      const err = error as any;
      this.logger.error(
        `Failed to send new request notification: ${err?.message}`,
      );
      return {
        success: false,
        message:
          err?.details || err?.message || 'Failed to send request notification',
        status: err?.status || 500,
      };
    }
  }

  /**
   * Send payment notification to admins
   * @param adminEmails - Array of admin emails retrieved from UserModel
   * @param data - Payment details
   * @param paymentLabel - Label for the payment (e.g., 'Payment', 'Service Fee')
   */
  async sendPaymentNotificationToAdmins(
    adminEmails: string[],
    data: {
      payerName: string;
      payerEmail: string;
      amount: number;
      currency: string;
      reference: string;
      paymentType: string;
      paidAt: Date | string;
    },
    paymentLabel: string = 'Payment',
  ) {
    if (config.isTest) {
      this.logger.log(
        `[Mailgun] Test mode: Pretending to send payment notification to ${adminEmails.length} admin(s)`,
      );
      return { success: true, dev: true };
    }

    if (!adminEmails || adminEmails.length === 0) {
      this.logger.warn('No admin emails provided. Notification not sent.');
      return { success: false, message: 'No admin emails provided' };
    }

    try {
      if (config.isDev) {
        console.warn(
          `[Mailgun Sandbox] Only authorized recipients can receive emails. Check Mailgun dashboard for: ${adminEmails.join(', ')}`,
        );
      }

      const formattedDate = new Date(data.paidAt).toLocaleString();
      const formattedAmount = `${data.currency} ${data.amount.toLocaleString(
        undefined,
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )}`;
      const subject = `${paymentLabel} Received - ${formattedAmount} - ${data.payerName}`;

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f6f9;">
          <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">💰 ${paymentLabel} Received</h1>
          </div>
          <div style="background: #ffffff; padding: 30px;">
            <p>A payment has been successfully processed.</p>
            
            <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; border-radius: 8px; padding: 25px; text-align: center; margin: 20px 0;">
              <div style="font-size: 14px; opacity: 0.9; margin-bottom: 5px;">Amount Paid</div>
              <div style="font-size: 32px; font-weight: 700;">${formattedAmount}</div>
            </div>

            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057; width: 40%;">Payer:</td>
                  <td style="padding: 12px 0; color: #212529;">${data.payerName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Email:</td>
                  <td style="padding: 12px 0; color: #212529;">${data.payerEmail}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Payment Type:</td>
                  <td style="padding: 12px 0; color: #212529;">
                    <span style="display: inline-block; background: #1e3a5f; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${data.paymentType}</span>
                  </td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Reference:</td>
                  <td style="padding: 12px 0; color: #212529; font-family: monospace;">${data.reference}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e9ecef;">
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Status:</td>
                  <td style="padding: 12px 0; color: #212529;">
                    <span style="display: inline-block; background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">Successful</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-weight: 600; color: #495057;">Paid At:</td>
                  <td style="padding: 12px 0; color: #212529;">${formattedDate}</td>
                </tr>
              </table>
            </div>

         
          </div>
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p>This is an automated notification from Benue Resident ID Portal.</p>
            <p>Please do not reply to this email.</p>
          </div>
        </div>
      `;

      const textBody = `
        ${paymentLabel.toUpperCase()} RECEIVED
        ============================

        A payment has been successfully processed.

        Amount: ${formattedAmount}
        Payer: ${data.payerName}
        Email: ${data.payerEmail}
        Payment Type: ${data.paymentType}
        Reference: ${data.reference}
        Status: Successful
        Paid At: ${formattedDate}

        ---
        This is an automated notification from Benue Resident ID Portal.
      `;

      const response = await this.mg.messages.create(this.domain, {
        from: this.from,
        to: adminEmails, // Mailgun accepts array of emails
        subject,
        html,
        text: textBody,
      });

      this.logger.log(
        `Payment notification sent to ${adminEmails.length} admin(s) for reference: ${data.reference}`,
      );

      return { success: true, response };
    } catch (error) {
      const err = error as any;
      this.logger.error(`Failed to send payment notification: ${err?.message}`);
      return {
        success: false,
        message:
          err?.details || err?.message || 'Failed to send payment notification',
        status: err?.status || 500,
      };
    }
  }
}
