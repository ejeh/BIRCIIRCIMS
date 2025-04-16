import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { KindredService } from './kindred.service';
import { SigUpKindredDto, UpdateKindredDto } from './kindredDto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { ApiResponse } from '@nestjs/swagger';

@Controller('api/kindred')
@UseGuards(JwtAuthGuard)
export class KindredController {
  constructor(private readonly kindredService: KindredService) {}

  // @Post('create')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  // async createKindred(@Body() body: SigUpKindredDto) {
  //   return this.kindredService.createKindred(body);
  // }

  @Get()
  @ApiResponse({ type: 'Kindred', isArray: true })
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.kindredService.getPaginatedData(page, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN)
  @Get(':userId')
  async getkindredHeads(
    @Param('userId') userId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.kindredService.getkindredHeads(userId, page, limit);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN)
  @Put(':id')
  async updateKindred(@Param('id') id: string, @Body() body: UpdateKindredDto) {
    return this.kindredService.updateKindred(id, body);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN)
  @Delete(':item')
  async deleteItem(@Param('item') item: string): Promise<any> {
    return this.kindredService.deleteItem(item);
  }
}
