// tasks.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UsersService } from '../users/users.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(private usersService: UsersService) {
    this.logger.log('TasksService initialized'); // Verify injection
  }

  // @Cron(CronExpression.EVERY_DAY_AT_10AM)
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async handlePendingVerifications() {
    this.logger.debug('CRON JOB EXECUTED AT: ' + new Date().toISOString());
    try {
      await this.usersService.checkPendingVerifications();
      this.logger.debug('CRON JOB COMPLETED SUCCESSFULLY');
    } catch (error) {
      this.logger.error('CRON JOB FAILED:', error);
    }
  }
}
