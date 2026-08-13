import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationTarget {
  USER = 'user',
  ALL = 'all',
  ROLE = 'role',
  LGA = 'lga',
}

export class SendNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Certificate approved',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Notification message body',
    example: 'Your certificate of origin has been approved.',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Notification type',
    enum: [
      'general',
      'idcard',
      'certificate',
      'system',
      'alert',
      'auctioneer',
      'payment',
      'receipt',
    ],
    default: 'general',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Link to the related page in the frontend',
    example: '/certificates/64a1b2c3d4e5f6a7b8c9d0e1',
  })
  @IsOptional()
  @IsString()
  link?: string;

  @ApiPropertyOptional({
    description: 'Who the notification should target',
    enum: NotificationTarget,
    default: NotificationTarget.USER,
  })
  @IsOptional()
  @IsEnum(NotificationTarget)
  target?: NotificationTarget;

  @ApiPropertyOptional({
    description: 'Target user id when target is "user"',
    example: '64a1b2c3d4e5f6a7b8c9d0e1',
  })
  @IsOptional()
  @IsMongoId()
  userId?: string;

  @ApiPropertyOptional({
    description: 'LGA to target when target is "lga"',
    example: 'Aba South',
  })
  @IsOptional()
  @IsString()
  lga?: string;

  @ApiPropertyOptional({
    description: 'Roles to target when target is "role"',
    enum: ['global_admin', 'support_admin', 'admin', 'user'],
    isArray: true,
    default: ['user'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}
