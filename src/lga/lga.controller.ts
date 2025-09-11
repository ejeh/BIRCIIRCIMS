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
import { LgaService } from './lga.service';
import { CreateLgaDto } from './dto/create-lga.dto';
import { UpdateLgaDto } from './dto/update-lga.dto';
import { Lga } from './lga.schema';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserRole } from 'src/users/users.role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';

@Controller('api/lgas')
@UseGuards(JwtAuthGuard)
export class LgaController {
  constructor(private readonly lgaService: LgaService) {}

  // ✅ CREATE
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async create(@Body() createLgaDto: CreateLgaDto, @Req() req): Promise<Lga> {
    return this.lgaService.create(createLgaDto, req.user.id);
  }

  // ✅ UPDATE
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateLgaDto: UpdateLgaDto,
    @Req() req,
  ): Promise<Lga> {
    return this.lgaService.update(id, updateLgaDto, req.user.id);
  }

  // ✅ DELETE
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async remove(
    @Param('id') id: string,
    @Req() req,
  ): Promise<{ message: string }> {
    return this.lgaService.remove(id, req.user.id);
  }

  // ✅ GET ALL
  @Get()
  @UseGuards(RolesGuard)
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.lgaService.getPaginatedData(page, limit);
  }
}
