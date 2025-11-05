// sms/sms.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio, { Twilio } from 'twilio';

export enum SmsProvider {
  TWILIO = 'twilio',
  TERMII = 'termii',
  AFRICAS_TALKING = 'africas_talking',
  // Add other providers as needed
}

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly provider: SmsProvider;
  private twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    this.provider =
      this.configService.get<SmsProvider>('SMS_PROVIDER') || SmsProvider.TERMII;

    if (this.provider === SmsProvider.TWILIO) {
      this.initializeTwilio();
    }
  }

  private initializeTwilio(): void {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

    this.logger.debug(`Initializing Twilio with SID: ${accountSid}`);
    this.logger.debug(`Auth Token: ${authToken ? '***' : 'not set'}`);

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials are missing in configuration.');
    }

    this.twilioClient = twilio(accountSid, authToken);
    this.logger.debug('Twilio client initialized.');
  }

  private normalizePhoneNumber(nigerianNumber: string): string {
    // Remove non-digit characters
    const digits = nigerianNumber.replace(/\D/g, '');

    // Convert starting 0 to +234
    if (digits.startsWith('0')) {
      return '+234' + digits.slice(1);
    }

    // Already starts with country code (234 or +234)
    if (digits.startsWith('234')) {
      return '+' + digits;
    }

    return '+' + digits; // fallback (for manually entered 806... without 0)
  }

  async sendSms(to: string, message: string): Promise<boolean> {
    const phoneNumber = this.normalizePhoneNumber(to);
    console.log(`Sending SMS to: ${phoneNumber}`);

    try {
      switch (this.provider) {
        case SmsProvider.TWILIO:
          // Ensure Twilio client is initialized before sending
          if (!this.twilioClient) {
            this.initializeTwilio();
          }
          return await this.sendViaTwilio(phoneNumber, message);

        default:
          this.logger.warn(`Unsupported SMS provider: ${this.provider}`);
          return false;
      }
    } catch (error) {
      this.logger.error(`Failed to send SMS: ${error.message}`, error.stack);
      return false;
    }
  }

  private async sendViaTwilio(to: string, message: string): Promise<boolean> {
    const from = this.configService.get<string>('TWILIO_PHONE_NUMBER');

    if (!from) {
      this.logger.error('TWILIO_PHONE_NUMBER is not configured.');
      return false;
    }

    try {
      await this.twilioClient.messages.create({
        body: message,
        from,
        to,
      });
      this.logger.debug(`SMS sent successfully to ${to}`);
      this.logger.debug(`Message: ${message}`);
      this.logger.debug(`From: ${from}`);
      return true;
    } catch (error) {
      this.logger.error(
        `Twilio SMS sending failed: ${error.message}`,
        error.stack,
      );
      return false;
    }
  }

  /**
  //  * Sends neighbor verification SMS
  //  * @param to Phone number of the neighbor
  //  * @param neighborName Name of the neighbor
  //  * @param verificationLink Verification link for the neighbor
  //  * @param applicantName Name of the applicant who listed this neighbor
  //  * @returns Promise<boolean> indicating if the SMS was sent successfully
  //  */
  // async sendNeighborVerificationSms(
  //   to: string,
  //   neighborName: string,
  //   verificationLink: string,
  //   applicantName: string,
  // ): Promise<boolean> {
  //   const message = `Hi ${neighborName}, ${applicantName} has applied for a Benue Resident ID and listed you as their neighbor. Please verify their information by clicking this link: ${verificationLink}. This link expires in 7 days. If you don't know ${applicantName}, please ignore this message.`;

  //   return this.sendSms(to, message);
  // }
}
