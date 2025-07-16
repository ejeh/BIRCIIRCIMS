import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [UsersModule, ScheduleModule.forRoot()],
  providers: [TasksService],
})
export class TasksModule {}
