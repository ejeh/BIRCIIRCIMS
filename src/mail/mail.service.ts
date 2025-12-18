// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
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
      console.error('Mailgun Error:', error);
      return {
        success: false,
        message:
          error?.details || error?.message || 'Failed to send activation email',
        status: error?.status || 500,
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
      console.error('Mailgun Error:', error);
      return {
        success: false,
        message:
          error?.details ||
          error?.message ||
          'Failed to send password reset email',
        status: error?.status || 500,
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
      console.error('Mailgun Error:', error);
      return {
        success: false,
        message:
          error?.details ||
          error?.message ||
          'Failed to send password reset email',
        status: error?.status || 500,
      };
    }
    // }
  }

  async sendMailRequest(email: string, subject: string, body: string) {
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
      console.error('Mailgun Error:', error);
      return {
        success: false,
        message: error?.details || error?.message,
        status: error?.status || 500,
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
      console.error('Mailgun Error:', error);
      return {
        success: false,
        message: error?.details || error?.message,
        status: error?.status || 500,
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
      console.error('Mailgun Error:', error);
      return {
        success: false,
        message:
          error?.details ||
          error?.message ||
          'Failed to send welcome password email',
        status: error?.status || 500,
      };
    }
  }
}
