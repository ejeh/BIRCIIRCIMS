import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user,decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { FamiliesService } from './families.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { AddDependentDto } from './dto/add-dependent.dto';
import { UpdateDependentDto } from './dto/update-dependent.dto';
import { TransferHeadshipDto } from './dto/transfer-headship.dto';
import { FamilyQueryDto } from './dto/family-query.dto';
import {
  FamilyHead,
  FamilyMember,
  FamilyRoleGuard,
} from './guards/family-role.guard';
import { UserRole } from 'src/users/users.role.enum';

@ApiTags('Families')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new family (creator becomes family head)',
  })
  async create(@Body() dto: CreateFamilyDto, @CurrentUser() user: any) {
    return this.familiesService.create(dto, user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN, UserRole.SUPPORT_ADMIN)
  @ApiOperation({ summary: 'List all families (admin only)' })
  async findAll(@Query() query: FamilyQueryDto) {
    return this.familiesService.findAll(query);
  }

  @Get('my')
  @ApiOperation({ summary: 'Get my family' })
  async getMyFamily(@CurrentUser() user: any) {
    return this.familiesService.getMyFamily(user.id);
  }

  @Get('my-invitations')
  @ApiOperation({ summary: 'Get my pending family invitations' })
  async getMyInvitations(@CurrentUser() user: any) {
    return this.familiesService.getMyInvitations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get family by ID' })
  async findOne(@Param('id') id: string) {
    return this.familiesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Update family details' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateFamilyDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.update(id, dto, user.id);
  }

  @Delete(':id')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Soft delete family' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familiesService.remove(id, user.id);
  }

  @Post(':id/invite')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Invite an adult family member' })
  async inviteMember(
    @Param('id') id: string,
    @Body() dto: InviteMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.inviteMember(id, dto, user.id);
  }

  @Public()
  @Get('invite/accept/:token')
  @ApiOperation({ summary: 'Accept a family invitation' })
  async acceptInvitation(@Param('token') token: string) {
    return this.familiesService.acceptInvitation(token);
  }

  @Public()
  @Get('invite/reject/:token')
  @ApiOperation({ summary: 'Reject a family invitation' })
  async rejectInvitation(@Param('token') token: string) {
    return this.familiesService.rejectInvitation(token);
  }

  @Post(':id/members')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Add an adult member directly' })
  async addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.addMember(id, dto, user.id);
  }

  @Delete(':id/members/:memberId')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Remove a family member' })
  async removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.removeMember(id, memberId, user.id);
  }

  @Patch(':id/members/:memberId')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Update a family member' })
  async updateMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.updateMember(id, memberId, dto, user.id);
  }

  @Patch(':id/transfer-headship')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Transfer family headship' })
  async transferHeadship(
    @Param('id') id: string,
    @Body() dto: TransferHeadshipDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.transferHeadship(id, dto.newHeadId, user.id);
  }

  @Post(':id/dependents')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Add a dependent (child, elderly, ward)' })
  async addDependent(
    @Param('id') id: string,
    @Body() dto: AddDependentDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.addDependent(id, dto, user.id);
  }

  @Patch(':id/dependents/:dependentId')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Update a dependent' })
  async updateDependent(
    @Param('id') id: string,
    @Param('dependentId') dependentId: string,
    @Body() dto: UpdateDependentDto,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.updateDependent(id, dependentId, dto, user.id);
  }

  @Delete(':id/dependents/:dependentId')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Remove a dependent' })
  async removeDependent(
    @Param('id') id: string,
    @Param('dependentId') dependentId: string,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.removeDependent(id, dependentId, user.id);
  }

  @Get(':id/dashboard')
  @UseGuards(FamilyRoleGuard)
  @FamilyMember()
  @ApiOperation({ summary: 'Get family dashboard summary' })
  async getDashboard(@Param('id') id: string, @CurrentUser() user: any) {
    return this.familiesService.getDashboard(id, user.id);
  }

  @Get(':id/applications')
  @UseGuards(FamilyRoleGuard)
  @FamilyMember()
  @ApiOperation({ summary: 'Get family applications' })
  async getApplications(@Param('id') id: string) {
    return this.familiesService.getApplications(id);
  }

  @Get(':id/payments')
  @UseGuards(FamilyRoleGuard)
  @FamilyMember()
  @ApiOperation({ summary: 'Get family payments' })
  async getPayments(@Param('id') id: string) {
    return this.familiesService.getPayments(id);
  }

  @Get(':id/documents')
  @UseGuards(FamilyRoleGuard)
  @FamilyMember()
  @ApiOperation({ summary: 'Get family documents' })
  async getDocuments(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.familiesService.getDocuments(id, page, limit);
  }

  @Post(':id/documents')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a family document' })
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('documentType') documentType: string,
    @Body('description') description: string | undefined,
    @CurrentUser() user: any,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }
    return this.familiesService.uploadDocument(
      id,
      documentType,
      file,
      description,
      user.id,
    );
  }

  @Delete(':id/documents/:documentId')
  @UseGuards(FamilyRoleGuard)
  @FamilyHead()
  @ApiOperation({ summary: 'Delete a family document' })
  async deleteDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.deleteDocument(id, documentId, user.id);
  }

  @Patch(':id/documents/:documentId/verify')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Verify or reject a family document (admin only)' })
  async verifyDocument(
    @Param('id') id: string,
    @Param('documentId') documentId: string,
    @Body('isVerified') isVerified: boolean,
    @CurrentUser() user: any,
  ) {
    return this.familiesService.verifyDocument(
      id,
      documentId,
      user.id,
      isVerified,
    );
  }

  @Get(':id/activity-log')
  @UseGuards(FamilyRoleGuard)
  @FamilyMember()
  @ApiOperation({ summary: 'Get family activity log' })
  async getActivityLog(
    @Param('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.familiesService.getActivityLog(id, page, limit);
  }

  @Patch(':id/suspend')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Suspend a family (admin only)' })
  async suspendFamily(@Param('id') id: string) {
    return this.familiesService.adminSuspendFamily(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Activate a suspended family (admin only)' })
  async activateFamily(@Param('id') id: string) {
    return this.familiesService.adminActivateFamily(id);
  }
}
