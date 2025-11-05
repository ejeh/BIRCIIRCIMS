import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

@Schema()
export class Settings {
  @Prop({ required: true, default: 'BICRIRMS Admin Dashboard' })
  systemName: string;

  @Prop({ required: true, default: 'bdic@bdic.ng' })
  systemEmail: string;

  @Prop({ required: true, default: 'NGN' })
  currency: string;

  @Prop({ required: true, default: 'West Africa Time (WAT)' })
  timezone: string;

  @Prop({ required: true, default: 'DD/MM/YYYY' })
  dateFormat: string;

  @Prop({ default: true })
  emailNotifications: boolean;

  @Prop({ default: false })
  smsNotifications: boolean;

  @Prop({ default: true })
  pushNotifications: boolean;

  @Prop({ default: true })
  newUserAlerts: boolean;

  @Prop({ default: true })
  requestAlerts: boolean;

  @Prop({ default: true })
  systemAlerts: boolean;

  @Prop({ required: true, default: 30 })
  sessionTimeout: number;

  @Prop({ default: true })
  twoFactorAuth: boolean;

  @Prop({ default: true })
  passwordComplexity: boolean;

  @Prop({ default: true })
  limitLoginAttempts: boolean;

  @Prop({ required: true, default: 5 })
  maxLoginAttempts: number;

  @Prop({ required: true, default: 15 })
  lockoutDuration: number;

  @Prop({ required: true, default: 'https://api.citizenship.benuestate.gov.ng/api' })
  apiBaseUrl: string;

  @Prop({ required: true, default: 'sk_test_4242424242424242' })
  apiKey: string;

  @Prop({ required: true, default: 'https://api.citizenship.benuestate.gov.ng/webhooks' })
  webhookUrl: string;

  @Prop({ required: true, default: 'whsec_4242424242424242' })
  webhookSecret: string;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);