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

  //   async sendEmail(to: string, subject: string, html: string) {
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
    const activationUrl = `${getBaseUrl()}/api/auth/activate/${userId}/${activationToken}\n`;

    const context = {
      link: activationUrl,
    };
    if (!config.isTest) {
      try {
        const templatePath = path.join(
          process.cwd(), // This points to the root of your project
          'templates',
          `${templateName}.hbs`,
        );
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template file not found: ${templatePath}`);
        }

        const source = fs.readFileSync(templatePath, 'utf-8').toString();
        const compiled = handlebars.compile(source);
        const html = compiled(context);

        const response = await this.mg.messages.create(this.domain, {
          from: `Benue Resident ID <noreply@${this.domain}>`,
          to,
          subject: 'Welcome to Benue Resident ID',
          html,
        });

        return response;
      } catch (error) {
        console.error('Mailgun Error:', error);
        throw error;
      }
    }
  }

  async sendForgottenPasswordMail(
    to: string,
    passwordResetToken: string,
    origin: string,
  ) {
    const context = {
      baseUrl: origin,
      link: `${origin}/source/auth/reset-password.html?token=${passwordResetToken}`,
    };
    if (!config.isTest) {
      try {
        const templatePath = path.join(
          process.cwd(), // This points to the root of your project
          'templates',
          `reset-password.hbs`,
        );
        if (!fs.existsSync(templatePath)) {
          throw new Error(`Template file not found: ${templatePath}`);
        }

        const source = fs.readFileSync(templatePath, 'utf-8').toString();
        const compiled = handlebars.compile(source);
        const html = compiled(context);

        const response = await this.mg.messages.create(this.domain, {
          from: `Benue Resident ID <noreply@${this.domain}>`,
          to,
          subject: 'Reset your password',
          html,
        });

        return response;
      } catch (error) {
        console.error('Mailgun Error:', error);
        throw error;
      }
    }
  }
}
