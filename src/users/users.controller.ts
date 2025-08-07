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
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  ApiBasicAuth,
  ApiBearerAuth,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from './users.schema';
import {
  UpdateProfileDto,
  UpdateUserRoleDto,
  VerifyReferenceDto,
} from './users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmailAlreadyUsedException } from 'src/common/exception';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ParseJSONPipe } from './parse-json.pipe'; // Create a custom pipe to handle JSON parsing.
import config from 'src/config';
import { Public } from 'src/common/decorators/public.decorator';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@ApiTags('users-controller')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
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
    @UploadedFile() file: Express.Multer.File,
  ) {
    function isEducationalHistoryComplete(edu: any): boolean {
      if (!edu) return false;

      const checkSchool = (school) =>
        school &&
        school.name?.trim() &&
        school.address?.trim() &&
        school.yearOfAttendance?.trim();

      const primary = checkSchool(edu.primarySchool);
      const secondary = checkSchool(edu.secondarySchool);

      const tertiaryComplete =
        Array.isArray(edu.tertiaryInstitutions) &&
        edu.tertiaryInstitutions.length > 0;

      return primary && secondary && tertiaryComplete;
    }

    function isEmploymentHistoryComplete(history: any[]): boolean {
      if (!Array.isArray(history) || history.length === 0) return false;

      return history.every(
        (job) =>
          job.companyName?.trim() &&
          job.address?.trim() &&
          job.designation?.trim() &&
          job.startYear !== null &&
          job.startYear !== undefined &&
          job.endYear !== null &&
          job.endYear !== undefined,
      );
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

      return verifiedFamily.length >= 3; // Require at least 3 verified entries
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

      return verifiedNeighbors.length >= 3; // Require at least 3 verified entries
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
        user.healthInfo?.length ? 'filled' : '',
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

    // Parse educationalHistory if it's a string
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
      // throw EmailAlreadyUsedException();
      throw new HttpException(
        error.message || 'An error occurred while updating the profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
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
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiResponse({ type: User, isArray: false })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return await this.userService.userModel.findByIdAndUpdate(
      id,
      { ...body },
      { new: true },
    );
  }

  @Get(':id')
  @ApiResponse({ type: User, isArray: false })
  async getProfile(@Param('id') id: string, @Body() body: any) {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new NotFoundException('User not found'); // Handle missing user
    }

    return {
      ...user.toObject(),
      DOB: user.DOB ? user.DOB.toISOString().split('T')[0] : '', // Check for null
    };
  }

  @Get()
  @UseGuards(RolesGuard)
  @ApiResponse({ type: User, isArray: true })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN, UserRole.KINDRED_HEAD)
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.getPaginatedData(page, limit);
  }
}
