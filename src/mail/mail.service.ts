// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import formData from 'form-data';
import Mailgun from 'mailgun.js';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { ConfigService } from '@nestjs/config';
import config from 'src/config';
import e from 'express';

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

  //   async sendEmail(to: string, subject: string, html: string) {
  // async sendActivationMail(
  //   to: string,
  //   userId: string,
  //   activationToken: string,
  //   templateName: string,
  // ) {
  //   const getBaseUrl = (): string =>
  //     config.isDev
  //       ? process.env.BASE_URL || 'http://localhost:5000'
  //       : 'https://api.citizenship.benuestate.gov.ng';
  //   const activationUrl = `${getBaseUrl()}/api/auth/activate/${userId}/${activationToken}\n`;

  //   const context = {
  //     link: activationUrl,
  //   };
  //   if (!config.isTest) {
  //     try {
  //       const templatePath = path.join(
  //         process.cwd(), // This points to the root of your project
  //         'templates',
  //         `${templateName}.hbs`,
  //       );
  //       if (!fs.existsSync(templatePath)) {
  //         throw new Error(`Template file not found: ${templatePath}`);
  //       }

  //       const source = fs.readFileSync(templatePath, 'utf-8').toString();
  //       const compiled = handlebars.compile(source);
  //       const html = compiled(context);

  //       const response = await this.mg.messages.create(this.domain, {
  //         from: `Benue Resident ID <noreply@${this.domain}>`,
  //         to,
  //         subject: 'Welcome to Benue Resident ID',
  //         html,
  //       });

  //       return response;
  //     } catch (error) {
  //       console.error('Mailgun Error:', error);
  //       throw error;
  //     }
  //   }
  // }

  // async sendForgottenPasswordMail(
  //   to: string,
  //   passwordResetToken: string,
  //   origin: string,
  // ) {
  //   const context = {
  //     baseUrl: origin,
  //     link: `${origin}/app/auth/reset-password.html?token=${passwordResetToken}`,
  //   };
  //   if (!config.isTest) {
  //     try {
  //       const templatePath = path.join(
  //         process.cwd(), // This points to the root of your project
  //         'templates',
  //         `reset-password.hbs`,
  //       );
  //       if (!fs.existsSync(templatePath)) {
  //         throw new Error(`Template file not found: ${templatePath}`);
  //       }

  //       const source = fs.readFileSync(templatePath, 'utf-8').toString();
  //       const compiled = handlebars.compile(source);
  //       const html = compiled(context);

  //       const response = await this.mg.messages.create(this.domain, {
  //         from: `Benue Resident ID <noreply@${this.domain}>`,
  //         to,
  //         subject: 'Reset your password',
  //         html,
  //       });

  //       return response;
  //     } catch (error) {
  //       console.error('Mailgun Error:', error);
  //       throw error;
  //     }
  //   }
  // }

  // src/mail/mail.service.ts
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
        from: `Benue Resident ID <noreply@${this.domain}>`,
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
      link: `${origin}/auth/reset-password.html?token=${passwordResetToken}`,
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
}
