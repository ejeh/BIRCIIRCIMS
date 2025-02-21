import { Injectable } from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';
import config from 'src/config';
import { error } from 'console';

@Injectable()
export class UserMailerService {
  constructor(private readonly mailerService: MailerService) {}

  sendActivationMail(
    email: string,
    userId: string,
    activationToken: string,
    origin: string,
  ) {
    const activationUrl = `http://localhost:5000/api/auth/activate/${userId}/${activationToken}\n`;
    if (!config.isTest()) {
      console.log(origin);
      this.mailerService
        .sendMail({
          to: email,
          subject: 'Activate your account',
          template: 'activate-account', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
          context: {
            link: `${origin}/auth/activate/${userId}/${activationToken}\n`,
            // link: activationUrl,
          },
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
  }
  sendForgottenPasswordMail(
    email: string,
    passwordResetToken: string,
    origin: string,
  ) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          subject: 'Reset your password',
          template: 'reset-password', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
          text: `You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n
Please click on the following link, or paste this into your browser to complete the process:\n
${origin}/auth/reset-password/${passwordResetToken}\n
If you did not request this, please ignore this email and your password will remain unchanged.\n`,
          context: {
            link: `${origin}/auth/reset-password.html?token=${passwordResetToken}`,
          },
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
  }

  sendResetPasswordMail(email: string) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          subject: 'Your password has been changed',
          text: `Hello,\n\nThis is a confirmation that the password for your account ${email} has just been changed.\n`,
        })
        .catch((error) => {
          console.log(error.message);
        });
    }
  }
  sendMailRequest(email: string, subject: string, body: string) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          subject: subject,
          template: 'request-certificate', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
          context: { text: body },
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }
}
