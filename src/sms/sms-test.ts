// // sms/sms.service.ts
// import { Injectable, Logger } from '@nestjs/common';
// // import twilio, { Twilio } from 'twilio';
// // import * as twilio from 'twilio';
// import { ConfigService } from '@nestjs/config';
// import twilio from 'twilio';
// import type { Twilio } from 'twilio';

// export enum SmsProvider {
//   TWILIO = 'twilio',
//   TERMII = 'termii',
//   AFRICAS_TALKING = 'africas_talking',
//   // Add other providers as needed
// }

// @Injectable()
// export class SmsService {
//   private readonly logger = new Logger(SmsService.name);
//   private provider: SmsProvider;
//   private twilioClient: Twilio;

//   constructor(private configService: ConfigService) {
//     this.provider =
//       this.configService.get<SmsProvider>('SMS_PROVIDER') || SmsProvider.TERMII;

//     if (this.provider === SmsProvider.TWILIO) {
//       const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
//       const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');

//       this.logger.debug(`Twilio SID: ${accountSid}`); // Add this line
//       this.logger.debug(`Twilio Auth Token: ${authToken ? '***' : 'not set'}`); // Add this line
//       if (!accountSid || !authToken) {
//         throw new Error('Twilio credentials not configured');
//       }

//       this.twilioClient = twilio(accountSid, authToken);
//       this.logger.debug('Twilio client initialized'); // Add this line
//       this.twilioClient = twilio(
//         this.configService.get<string>('TWILIO_ACCOUNT_SID'),
//         this.configService.get<string>('TWILIO_AUTH_TOKEN'),
//       );
//     }
//   }

//   async sendSms(to: string, message: string): Promise<boolean> {
//     try {
//       // Clean phone number (remove + and any non-digit characters)
//       const phoneNumber = to.replace(/\D/g, '');

//       switch (this.provider) {
//         case SmsProvider.TWILIO:
//           return this.sendViaTwilio(phoneNumber, message);
//         // case SmsProvider.TERMII:
//         //   return this.sendViaTermii(phoneNumber, message);
//         // case SmsProvider.AFRICAS_TALKING:
//         //   return this.sendViaAfricasTalking(phoneNumber, message);
//         default:
//           return this.sendViaTwilio(phoneNumber, message);
//       }
//     } catch (error) {
//       this.logger.error(`Failed to send SMS: ${error.message}`);
//       return false;
//     }
//   }

//   private async sendViaTwilio(to: string, message: string): Promise<boolean> {
//     try {
//       await this.twilioClient.messages.create({
//         body: message,
//         from: this.configService.get<string>('TWILIO_PHONE_NUMBER'),
//         to: `+${to}`,
//       });
//       return true;
//     } catch (error) {
//       this.logger.error(`Twilio SMS error: ${error.message}`);
//       return false;
//     }
//   }

//   //   private async sendViaTermii(to: string, message: string): Promise<boolean> {
//   //     try {
//   //       const apiKey = this.configService.get<string>('TERMII_API_KEY');
//   //       const senderId = this.configService.get<string>('TERMII_SENDER_ID') || 'BenueID';

//   //       const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
//   //         to,
//   //         from: senderId,
//   //         sms: message,
//   //         type: 'plain',
//   //         channel: 'generic',
//   //         api_key: apiKey,
//   //       });

//   //       return response.data.code === 'ok';
//   //     } catch (error) {
//   //       this.logger.error(`Termii SMS error: ${error.response?.data?.message || error.message}`);
//   //       return false;
//   //     }
//   //   }

//   //   private async sendViaAfricasTalking(to: string, message: string): Promise<boolean> {
//   //     try {
//   //       const username = this.configService.get<string>('AFRICASTALKING_USERNAME');
//   //       const apiKey = this.configService.get<string>('AFRICASTALKING_API_KEY');
//   //       const senderId = this.configService.get<string>('AFRICASTALKING_SENDER_ID') || 'BenueID';

//   //       const response = await axios.post(
//   //         'https://api.africastalking.com/version1/messaging',
//   //         {
//   //           username,
//   //           to: `+${to}`,
//   //           message,
//   //           from: senderId,
//   //         },
//   //         {
//   //           headers: {
//   //             apiKey,
//   //             'Content-Type': 'application/x-www-form-urlencoded',
//   //             Accept: 'application/json',
//   //           },
//   //         }
//   //       );

//   //       return response.data.SMSMessageData.Recipients[0].status === 'Success';
//   //     } catch (error) {
//   //       this.logger.error(`Africa's Talking SMS error: ${error.response?.data?.message || error.message}`);
//   //       return false;
//   //     }
//   //   }
// }
