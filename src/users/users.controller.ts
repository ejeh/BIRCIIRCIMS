import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  HttpCode,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from './users.schema';
import {
  UpdateProfileDto,
  UpdateUserAdminDto,
  VerifyReferenceDto,
} from './users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { ParseJSONPipe } from './parse-json.pipe'; // Create a custom pipe to handle JSON parsing.
import { Public } from 'src/common/decorators/public.decorator';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileSizeValidationPipe } from '../common/pipes/file-size-validation.pipe';
import { PassportPhotoQualityPipe } from '../common/pipes/passport-photo-quality.pipes';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Permission } from './permissions.enum';
import { RoleAssignmentService } from 'src/roles/role-assignment.service';
import { createFileUploadInterceptor } from 'src/interceptors/file-upload.interceptor';

@ApiTags('users-controller')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly roleAssignmentService: RoleAssignmentService,
    @InjectModel(User.name) private readonly usersModel: Model<User>,
  ) {}

  @Put(':id')
  @UseInterceptors(createFileUploadInterceptor('passportPhoto'))
  async updateUserProfile(
    @Param('id') id: string,
    @Body(new ParseJSONPipe()) body: UpdateProfileDto,
    @UploadedFile(
      new PassportPhotoQualityPipe(),
      new FileSizeValidationPipe({
        passportPhoto: { maxSize: 1024 * 1024 }, // 1MB
      }),
    )
    file?: Express.Multer.File,
  ) {
    try {
      return await this.userService.updateUserProfile(id, body, file);
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while updating the profile',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id/verification-history/:refId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get verification history for a specific reference',
  })
  @ApiParam({ name: 'id', description: 'The User ID' })
  @ApiParam({
    name: 'refId',
    description: 'The ID of the neighbor or family reference',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification history retrieved successfully.',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          date: { type: 'string', format: 'date-time' },
          status: { type: 'string' },
          comments: { type: 'string' },
          deviceInfo: { type: 'string' },
          verifiedBy: { type: 'string' },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'User or Reference not found.' })
  async getVerificationHistory(
    @Param('id') userId: string,
    @Param('refId') refId: string,
  ) {
    const history = await this.userService.getVerificationHistory(
      userId,
      refId,
    );
    return {
      success: true,
      message: 'Verification history retrieved successfully.',
      data: history,
    };
  }

  @Get(':id/verification-tokens')
  async getVerificationTokens(@Param('id') id: string) {
    const user = await this.userService.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      neighbor: user.neighbor?.map((n) => ({
        id: n._id,
        verificationToken: n.verificationToken,
        verificationLink: n.verificationLink,
        status: n.status,
      })),
      family: user.family?.map((f) => ({
        id: f._id,
        verificationToken: f.verificationToken,
        verificationLink: f.verificationLink,
        status: f.status,
      })),
    };
  }

  @Public()
  @Get('verify-reference/:token')
  @ApiResponse({ type: Object, isArray: false })
  async getVerificationDetails(@Param('token') token: string) {
    return this.userService.getVerificationDetails(token);
  }

  @Public()
  @Post('verify-reference/:token')
  @ApiResponse({ type: Object, isArray: false })
  async verifyReference(
    @Param('token') token: string,
    @Body() verificationData: VerifyReferenceDto,
  ) {
    return this.userService.verifyReference(token, verificationData);
  }

  @Post(':id/initiate-verification')
  @ApiResponse({ type: Object, isArray: false })
  async initiateVerification(@Param('id') id: string) {
    return this.userService.initiateVerification(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Change user role' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @UseGuards(JwtAuthGuard)
  // @Permissions(Permission.ROLE_ASSIGN)
  async changeUserRole(
    @Param('id') id: string,
    @Body('role') newRole: string,
    @Body('reason') reason: string,
    @Req() req,
  ) {
    return await this.userService.updateUserRole(
      id,
      newRole as UserRole,
      req.user.id,
      reason || 'Role updated by admin',
    );
  }

  @Get(':id/role-history')
  @ApiOperation({ summary: 'Get user role change history' })
  @ApiResponse({
    status: 200,
    description: 'User role history retrieved successfully',
  })
  @UseGuards(JwtAuthGuard)
  @Permissions(Permission.ROLE_READ)
  async getUserRoleHistory(@Param('id') id: string) {
    return await this.roleAssignmentService.getAssignmentsByUserId(id);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all available user roles' })
  @ApiResponse({ status: 200, description: 'List of available roles' })
  getRoles() {
    // Get all enum values
    const allRoles = Object.values(UserRole);

    // Filter out roles that shouldn't be assignable
    const assignableRoles = allRoles.filter(
      (role) => role !== UserRole.GLOBAL_ADMIN,
    );

    // Format the roles for the frontend
    const formattedRoles = assignableRoles.map((role) => ({
      value: role,
      label: role
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
    }));

    return {
      status: 'success',
      data: formattedRoles,
    };
  }

  // 📝 Update user details
  @Put(':id/user-details')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserAdminDto,
  ) {
    return this.userService.updateUser(id, updateUserDto);
  }

  // 🚫 Toggle user active/inactive
  @Patch(':id/toggle-status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.SUPPORT_ADMIN)
  async toggleUserStatus(@Param('id') id: string) {
    return this.userService.toggleUserStatus(id);
  }

  @Get('role-stats')
  async getRoleStats() {
    // const globalAdminCount = 0; // Assuming there's always one global admin for simplicity
    const globalAdminCount = await this.usersModel.countDocuments({
      role: 'global_admin',
    });
    const superAdminCount = await this.usersModel.countDocuments({
      role: 'super_admin',
    });
    const supportAdminCount = await this.usersModel.countDocuments({
      role: 'support_admin',
    });
    const kindredHeadCount = await this.usersModel.countDocuments({
      role: 'kindred_head',
    });
    const userCount = await this.usersModel.countDocuments({ role: 'user' });

    return {
      global_admin: {
        count: globalAdminCount,
        permissions: 'Full system access',
      },
      super_admin: {
        count: superAdminCount,
        permissions: 'Manage admins and system settings',
      },
      support_admin: {
        count: supportAdminCount,
        permissions: 'Manage requests, moderate users',
      },
      kindred_head: {
        count: kindredHeadCount,
        permissions: 'LGA/Kindred certificate requests',
      },
      user: { count: userCount, permissions: 'Submit requests only' },
    };
  }

  @Get('analytics-stats')
  @Roles(UserRole.GLOBAL_ADMIN)
  async getAnalytics() {
    return this.userService.getAnalytics();
  }

  @Get('stats')
  @ApiResponse({
    status: 200,
    description:
      'Returns membership statistics (age, gender, state distributions)',
    isArray: false,
  })
  @Roles(UserRole.GLOBAL_ADMIN)
  async getStats() {
    return this.userService.getMemberStats();
  }

  @Get('dashboard-stats')
  @ApiResponse({
    status: 200,
    description: 'Returns dashboard statistics for users',
  })
  @Roles(UserRole.GLOBAL_ADMIN)
  async getDashboardStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userService.getDashboardStats(startDate, endDate);
  }

  @Get('dashboard/export/pdf')
  async exportDashboardPdf(
    @Res() res,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    try {
      const pdfBuffer = await this.userService.generateDashboardPdfReport(
        startDate,
        endDate,
      );

      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="dashboard_report_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });

      res.end(pdfBuffer);
    } catch (error) {
      console.error('Error generating dashboard PDF:', error);
      res.status(500).send('Error generating PDF report');
    }
  }

  @Get('me')
  async getCurrentUser(@Req() req) {
    return this.userService.findById(req.user.id);
  }

  @Get('by-lga')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPPORT_ADMIN)
  @ApiResponse({ type: User, isArray: true })
  @ApiQuery({
    name: 'lga',
    required: false,
    description: 'Filter users by LGA',
  })
  async getUsersByLGA(@Query('lga') lga?: string) {
    if (lga) {
      return this.userService.findByLGA(lga);
    }
    return this.userService.findAll();
  }

  @Get('trends')
  getTrends(
    @Query('lga') lga: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userService.getTrends(lga, startDate, endDate);
  }

  @Get('demographics')
  getDemographics(
    @Query('lga') lga: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userService.getDemographics(lga, startDate, endDate);
  }

  @Get('kindred-activity')
  getKindredActivity(@Query('lga') lga: string) {
    return this.userService.getKindredActivity(lga);
  }

  @Get('recent-activities')
  getRecentActivities(@Query('lga') lga: string) {
    return this.userService.getRecentActivities(lga);
  }

  @Get('lga-trends')
  getLgaTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.userService.getLgaRequestTrends(startDate, endDate);
  }

  @Get('initialize')
  async initializeDashboard(@Req() req) {
    const user = req.user as any;
    return this.userService.getDashboardData(user);
  }

  @Get('refresh-analytics')
  async getFullAnalyticsData(@Query('lga') lga?: string) {
    // This single endpoint will return all the data needed for the analytics page
    return this.userService.getFullAnalyticsData(lga);
  }

  @Get(':id')
  @ApiResponse({ type: User, isArray: false })
  async getProfile(@Param('id') id: string, @Body() body: any) {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found'); // Handle missing user
    }

    return {
      user,
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiResponse({ type: User, isArray: true })
  @Roles(UserRole.GLOBAL_ADMIN)
  async getPaginatedData() {
    return this.userService.getPaginatedData();
  }
}
