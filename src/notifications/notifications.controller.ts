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
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/users.role.enum';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { SendNotificationDto } from './dto/send-notification.dto';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Send a notification (admin only)' })
  async sendNotification(@Body() dto: SendNotificationDto) {
    return this.notificationsService.sendNotification(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for the current user' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'type', required: false, example: 'certificate' })
  @ApiQuery({ name: 'read', required: false, example: 'false' })
  async getUserNotifications(
    @Req() req,
    @Query() query: GetNotificationsQueryDto,
  ) {
    return this.notificationsService.getUserNotifications(req.user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(@Req() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  markAllAsRead(@Req() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Delete all notifications' })
  async clearAll(@Req() req) {
    return this.notificationsService.clearAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single notification' })
  @ApiParam({ name: 'id', required: true, description: 'Notification id' })
  async getNotification(@Param('id') id: string, @Req() req) {
    return this.notificationsService.getNotification(id, req.user.id);
  }

  @Patch(':id/mark-read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @ApiParam({ name: 'id', required: true, description: 'Notification id' })
  async markAsRead(@Param('id') id: string, @Req() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a single notification' })
  @ApiParam({ name: 'id', required: true, description: 'Notification id' })
  async deleteNotification(@Param('id') id: string, @Req() req) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }
}
