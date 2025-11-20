// src/verification-limits/verification-limits.controller.ts
import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { VerificationLimitsService } from './verification-limits.service';

@ApiTags('verification-limits')
@ApiBearerAuth()
@Controller('api/verification-limits')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationLimitsController {
  constructor(
    private readonly verificationLimitsService: VerificationLimitsService,
  ) {}

  @Get()
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Get current verification limits' })
  @ApiResponse({
    status: 200,
    description: 'Returns current verification limits',
  })
  async getVerificationLimits() {
    return this.verificationLimitsService.getVerificationLimits();
  }

  @Put()
  @Roles(UserRole.GLOBAL_ADMIN)
  @ApiOperation({ summary: 'Update verification limits' })
  @ApiResponse({
    status: 200,
    description: 'Updates and returns new verification limits',
  })
  async updateVerificationLimits(
    @Body() body: { familyLimit: number; neighborLimit: number },
    @Req() req,
  ) {
    return this.verificationLimitsService.updateVerificationLimits(
      body.familyLimit,
      body.neighborLimit,
      req.user.id,
    );
  }
}
