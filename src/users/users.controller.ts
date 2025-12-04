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
  BadRequestException,
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
  UpdateUserRoleDto,
  VerifyReferenceDto,
} from './users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ParseJSONPipe } from './parse-json.pipe'; // Create a custom pipe to handle JSON parsing.
import { Public } from 'src/common/decorators/public.decorator';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FileSizeValidationPipe } from '../common/pipes/file-size-validation.pipe';
import { PassportPhotoQualityPipe } from '../common/pipes/passport-photo-quality.pipes';
import { VerificationLimitsService } from 'src/verification-limits/verification-limits.service';
import { PermissionsGuard } from '../common/guards/permissions.guards';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { Permission } from './permissions.enum';
import { RoleAssignmentService } from 'src/roles/role-assignment.service';

@ApiTags('users-controller')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly verificationLimitsService: VerificationLimitsService,
    private readonly roleAssignmentService: RoleAssignmentService,
    @InjectModel(User.name) private readonly usersModel: Model<User>,
  ) {}

  @Put(':id')
  @UseInterceptors(
    FileInterceptor('passportPhoto', {
      limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
      fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new HttpException('Invalid file type', HttpStatus.BAD_REQUEST),
            false,
          );
        }
      },
    }),
  )
  async updateUserProfile(
    @Param('id') id: string,
    @Body(new ParseJSONPipe()) body: UpdateProfileDto,
    @UploadedFile(
      new PassportPhotoQualityPipe(),
      new FileSizeValidationPipe({
        passportPhoto: { maxSize: 2 * 1024 * 1024 }, // 2MB
      }),
    )
    file: Express.Multer.File,
  ) {
    // Get the dynamic verification limits
    const verificationLimits =
      await this.verificationLimitsService.getVerificationLimits();

    // Helper function to check for duplicates in an array of objects
    function hasDuplicates(arr: any[], key: string): boolean {
      if (!Array.isArray(arr) || arr.length === 0) return false;

      const values = arr.map((item) => item[key]).filter((val) => val);
      const uniqueValues = new Set(values);
      return values.length !== uniqueValues.size;
    }

    // Helper function to check for duplicates across family and neighbors
    function hasCrossDuplicates(
      family: any[],
      neighbors: any[],
      key: string,
    ): boolean {
      if (!Array.isArray(family) || !Array.isArray(neighbors)) return false;

      const familyValues = family.map((item) => item[key]).filter((val) => val);
      const neighborValues = neighbors
        .map((item) => item[key])
        .filter((val) => val);

      const allValues = [...familyValues, ...neighborValues];
      const uniqueValues = new Set(allValues);

      return allValues.length !== uniqueValues.size;
    }

    function isEducationalHistoryComplete(education: any[]): boolean {
      if (!Array.isArray(education) || education.length === 0) return false;

      return education.every((edu) => {
        const institutionFilled =
          typeof edu.institution === 'string' && edu.institution.trim() !== '';

        const qualificationFilled =
          typeof edu.qualification === 'string' &&
          edu.qualification.trim() !== '';

        const startDateFilled =
          edu.startDate instanceof Date ||
          (typeof edu.startDate === 'string' && edu.startDate.trim() !== '');

        const endDateFilled =
          edu.endDate instanceof Date ||
          (typeof edu.endDate === 'string' && edu.endDate.trim() !== '');

        return (
          institutionFilled &&
          qualificationFilled &&
          startDateFilled &&
          endDateFilled
        );
      });
    }

    function isEmploymentHistoryComplete(history: any[]): boolean {
      if (!Array.isArray(history) || history.length === 0) return false;

      return history.every((job) => {
        const companyNameFilled =
          typeof job.companyName === 'string' && job.companyName.trim() !== '';

        const addressFilled =
          typeof job.address === 'string' && job.address.trim() !== '';

        const designationFilled =
          typeof job.designation === 'string' && job.designation.trim() !== '';

        const startDateFilled =
          job.startDate instanceof Date ||
          (typeof job.startDate === 'string' && job.startDate.trim() !== '');

        const endDateFilled =
          job.endDate instanceof Date ||
          (typeof job.endDate === 'string' && job.endDate.trim() !== '');

        return (
          companyNameFilled &&
          addressFilled &&
          designationFilled &&
          startDateFilled &&
          endDateFilled
        );
      });
    }

    function isFamilyComplete(family: any[]): boolean {
      if (!Array.isArray(family)) return false;

      const verifiedFamily = family.filter(
        (f) =>
          f.name?.trim() &&
          f.relationship?.trim() &&
          f.phone?.trim() &&
          f.address?.trim() &&
          f.status === 'verified',
      );

      // return verifiedFamily.length >= 3; // Require at least 3 verified entries
      return (
        verifiedFamily.length >= verificationLimits.familyVerificationLimit
      );
    }

    function isNeighborComplete(neighbors: any[]): boolean {
      if (!Array.isArray(neighbors)) return false;

      const verifiedNeighbors = neighbors.filter(
        (n) =>
          n.name?.trim() &&
          n.address?.trim() &&
          n.phone?.trim() &&
          n.status === 'verified',
      );

      // return verifiedNeighbors.length >= 3; // Require at least 3 verified entries
      return (
        verifiedNeighbors.length >= verificationLimits.neighborVerificationLimit
      );
    }
    /**
     * Calculate the profile completion percentage based on the provided user data.
     * Essential fields contribute 60%, background checks contribute 30%, and optional fields contribute 10%.
     * @param user - Partial user object containing profile data.
     * @returns {number} - The calculated profile completion percentage.
     */
    function calculateProfileCompletion(user: Partial<User>): number {
      let score = 0;
      let totalWeight = 0;

      // --- ESSENTIAL (60%) ---
      const essentialFields = [
        user.firstname,
        user.lastname,
        user.phone,
        user.NIN,
        user.DOB,
        user.gender,
        user.passportPhoto,
        user.stateOfOrigin,
        user.lgaOfOrigin,
        user.nationality,
      ];
      const essentialFilled = essentialFields.filter(
        (val) => val !== undefined && val !== null && String(val).trim() !== '',
      ).length;

      score += (essentialFilled / essentialFields.length) * 60;
      totalWeight += 60;

      // --- BACKGROUND INFO (30%) ---
      const backgroundChecks = [
        isEducationalHistoryComplete(user.educationalHistory) ? 1 : 0,
        isEmploymentHistoryComplete(user.employmentHistory) ? 1 : 0,
        isFamilyComplete(user.family) ? 1 : 0,
        isNeighborComplete(user.neighbor) ? 1 : 0,
      ];
      const backgroundScore =
        (backgroundChecks.reduce((a, b) => a + b, 0) /
          backgroundChecks.length) *
        30;
      score += backgroundScore;
      totalWeight += 30;

      // --- OPTIONAL INFO (10%) ---
      const optionalFields = [
        user.religion,
        user.community,
        user.business?.length ? 'filled' : '',
        user.healthInfo ? 'filled' : '',
      ];
      const optionalFilled = optionalFields.filter(
        (val) => val !== undefined && val !== null && String(val).trim() !== '',
      ).length;

      score += (optionalFilled / optionalFields.length) * 10;
      totalWeight += 10;

      // Final percentage
      return Math.round(score);
    }

    // Parse educationalHistory if it's a string
    if (typeof body.educationalHistory === 'string') {
      try {
        const parsedEducationalHistory = JSON.parse(body.educationalHistory);
        body = { ...body, educationalHistory: parsedEducationalHistory };
      } catch (error) {
        throw new BadRequestException('Invalid educationalHistory format.');
      }
    }

    // Parse employmentHistory if it's a string
    if (typeof body.employmentHistory === 'string') {
      try {
        const parsedEmploymentHistory = JSON.parse(body.employmentHistory);
        body = { ...body, employmentHistory: parsedEmploymentHistory };
      } catch (error) {
        throw new BadRequestException('Invalid employmentHistory format.');
      }
    }
    try {
      const updatedData: any = { ...body };
      const currentUser = await this.userService.userModel.findById(id);

      if (!currentUser) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // NEW: Check for duplicates in phone numbers and emails within family and neighbors
      // Check for duplicates within family
      if (updatedData.family && Array.isArray(updatedData.family)) {
        if (hasDuplicates(updatedData.family, 'phone')) {
          throw new HttpException(
            'Duplicate phone numbers found in family references.',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (hasDuplicates(updatedData.family, 'email')) {
          throw new HttpException(
            'Duplicate emails found in family references.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Check for duplicates within neighbors
      if (updatedData.neighbor && Array.isArray(updatedData.neighbor)) {
        if (hasDuplicates(updatedData.neighbor, 'phone')) {
          throw new HttpException(
            'Duplicate phone numbers found in neighbor references.',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (hasDuplicates(updatedData.neighbor, 'email')) {
          throw new HttpException(
            'Duplicate emails found in neighbor references.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Check for cross-duplicates between family and neighbors
      if (updatedData.family && updatedData.neighbor) {
        if (
          hasCrossDuplicates(updatedData.family, updatedData.neighbor, 'phone')
        ) {
          throw new HttpException(
            'Phone numbers must be unique across all family and neighbor references.',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (
          hasCrossDuplicates(updatedData.family, updatedData.neighbor, 'email')
        ) {
          throw new HttpException(
            'Emails must be unique across all family and neighbor references.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      // Preserve verification data for neighbors
      if (updatedData.neighbor && Array.isArray(updatedData.neighbor)) {
        updatedData.neighbor = updatedData.neighbor.map((newNeighbor) => {
          const existingNeighbor = currentUser.neighbor.find(
            (n) => n.phone === newNeighbor.phone,
          );

          return existingNeighbor
            ? {
                ...newNeighbor,
                verificationLink: existingNeighbor.verificationLink,
                verificationToken: existingNeighbor.verificationToken,
                status: existingNeighbor.status,
                isFollowUpSent: existingNeighbor.isFollowUpSent,
                verificationExpiresAt: existingNeighbor.verificationExpiresAt,
                isResident: existingNeighbor.isResident,
                knownDuration: existingNeighbor.knownDuration,
                knowsApplicant: existingNeighbor.knowsApplicant,
                verifiedAt: existingNeighbor.verifiedAt,
              }
            : newNeighbor;
        });
      }

      // Preserve verification data for family members
      if (updatedData.family && Array.isArray(updatedData.family)) {
        updatedData.family = updatedData.family.map((newFamily) => {
          const existingFamily = currentUser.family.find(
            (f) => f.phone === newFamily.phone,
          );

          return existingFamily
            ? {
                ...newFamily,
                verificationLink: existingFamily.verificationLink,
                verificationToken: existingFamily.verificationToken,
                status: existingFamily.status,
                isFollowUpSent: existingFamily.isFollowUpSent,
                verificationExpiresAt: existingFamily.verificationExpiresAt,
                isResident: existingFamily.isResident,
                knownDuration: existingFamily.knownDuration,
                knowsApplicant: existingFamily.knowsApplicant,
                verifiedAt: existingFamily.verifiedAt,
              }
            : newFamily;
        });
      }

      const userDoc = await this.userService.findById(id); // get current user
      const oldPassportUrl = userDoc.passportPhoto;

      if (file) {
        if (oldPassportUrl) {
          const publicId =
            this.cloudinaryService.getFullPublicIdFromUrl(oldPassportUrl);
          if (publicId) {
            try {
              await this.cloudinaryService.deleteFile(publicId);
            } catch (err) {
              console.warn(`Failed to delete old passport: ${err.message}`);
            }
          }
        }
        try {
          const passportUrl = await this.cloudinaryService.uploadFile(
            file,
            'users/passports',
            ['image/jpeg', 'image/png', 'image/jpg'],
            5,
          );
          updatedData.passportPhoto = passportUrl;
        } catch (error) {
          throw new HttpException(
            `Passport upload failed: ${error.message}`,
            HttpStatus.BAD_REQUEST,
          );
        }
      }

      const merged = { ...currentUser.toObject(), ...updatedData };
      const completion = calculateProfileCompletion(merged);

      updatedData.isProfileCompleted = completion >= 90;
      updatedData.profileCompletionPercentage = completion;

      const user = await this.userService.userModel.findByIdAndUpdate(
        id,
        updatedData,
        { new: true },
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (error) {
      throw new HttpException(
        error.message || 'An error occurred while updating the profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
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

  // @Patch(':id/role')
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.GLOBAL_ADMIN, UserRole.SUPPORT_ADMIN)
  // @ApiResponse({ type: User, isArray: false })
  // async updateUserRole(
  //   @Param('id') id: string,
  //   @Body() body: UpdateUserRoleDto,
  //   @Req() req,
  // ) {
  //   return this.userService.updateUserRole(id, body, req.user);
  // }

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
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.getPaginatedData(page, limit);
  }
}
