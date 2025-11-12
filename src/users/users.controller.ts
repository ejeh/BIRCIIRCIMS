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

@ApiTags('users-controller')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(User.name) private readonly usersModel: Model<User>,
  ) {}

  // @Put(':id')
  // @UseInterceptors(
  //   FileInterceptor('passportPhoto', {
  //     limits: { fileSize: 1024 * 1024 * 5 }, // 5MB
  //     fileFilter: (req, file, cb) => {
  //       const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  //       if (allowedTypes.includes(file.mimetype)) {
  //         cb(null, true);
  //       } else {
  //         cb(
  //           new HttpException('Invalid file type', HttpStatus.BAD_REQUEST),
  //           false,
  //         );
  //       }
  //     },
  //   }),
  // )
  // async updateUserProfile(
  //   @Param('id') id: string,
  //   @Body(new ParseJSONPipe()) body: UpdateProfileDto,
  //   @UploadedFile() file: Express.Multer.File,
  // ) {
  //   function isEducationalHistoryComplete(edu: any): boolean {
  //     if (!edu) return false;

  //     const checkSchool = (school) =>
  //       school &&
  //       school.name?.trim() &&
  //       school.address?.trim() &&
  //       school.yearOfAttendance?.trim();

  //     const primary = checkSchool(edu.primarySchool);
  //     const secondary = checkSchool(edu.secondarySchool);

  //     const tertiaryComplete =
  //       Array.isArray(edu.tertiaryInstitutions) &&
  //       edu.tertiaryInstitutions.length > 0;

  //     return primary && secondary && tertiaryComplete;
  //   }

  //   function isEmploymentHistoryComplete(history: any[]): boolean {
  //     if (!Array.isArray(history) || history.length === 0) return false;

  //     return history.every(
  //       (job) =>
  //         job.companyName?.trim() &&
  //         job.address?.trim() &&
  //         job.designation?.trim() &&
  //         job.startYear !== null &&
  //         job.startYear !== undefined &&
  //         job.endYear !== null &&
  //         job.endYear !== undefined,
  //     );
  //   }

  //   function isFamilyComplete(family: any[]): boolean {
  //     if (!Array.isArray(family)) return false;

  //     const verifiedFamily = family.filter(
  //       (f) =>
  //         f.name?.trim() &&
  //         f.relationship?.trim() &&
  //         f.phone?.trim() &&
  //         f.address?.trim() &&
  //         f.status === 'verified',
  //     );

  //     return verifiedFamily.length >= 3; // Require at least 3 verified entries
  //   }

  //   function isNeighborComplete(neighbors: any[]): boolean {
  //     if (!Array.isArray(neighbors)) return false;

  //     const verifiedNeighbors = neighbors.filter(
  //       (n) =>
  //         n.name?.trim() &&
  //         n.address?.trim() &&
  //         n.phone?.trim() &&
  //         n.status === 'verified',
  //     );

  //     return verifiedNeighbors.length >= 3; // Require at least 3 verified entries
  //   }
  //   /**
  //    * Calculate the profile completion percentage based on the provided user data.
  //    * Essential fields contribute 60%, background checks contribute 30%, and optional fields contribute 10%.
  //    * @param user - Partial user object containing profile data.
  //    * @returns {number} - The calculated profile completion percentage.
  //    */
  //   function calculateProfileCompletion(user: Partial<User>): number {
  //     let score = 0;
  //     let totalWeight = 0;

  //     // --- ESSENTIAL (60%) ---
  //     const essentialFields = [
  //       user.firstname,
  //       user.lastname,
  //       user.phone,
  //       user.NIN,
  //       user.DOB,
  //       user.gender,
  //       user.passportPhoto,
  //       user.stateOfOrigin,
  //       user.lgaOfOrigin,
  //       user.nationality,
  //     ];
  //     const essentialFilled = essentialFields.filter(
  //       (val) => val !== undefined && val !== null && String(val).trim() !== '',
  //     ).length;

  //     score += (essentialFilled / essentialFields.length) * 60;
  //     totalWeight += 60;

  //     // --- BACKGROUND INFO (30%) ---
  //     const backgroundChecks = [
  //       isEducationalHistoryComplete(user.educationalHistory) ? 1 : 0,
  //       isEmploymentHistoryComplete(user.employmentHistory) ? 1 : 0,
  //       isFamilyComplete(user.family) ? 1 : 0,
  //       isNeighborComplete(user.neighbor) ? 1 : 0,
  //     ];
  //     const backgroundScore =
  //       (backgroundChecks.reduce((a, b) => a + b, 0) /
  //         backgroundChecks.length) *
  //       30;
  //     score += backgroundScore;
  //     totalWeight += 30;

  //     // --- OPTIONAL INFO (10%) ---
  //     const optionalFields = [
  //       user.religion,
  //       user.community,
  //       user.business?.length ? 'filled' : '',
  //       user.healthInfo ? 'filled' : '',
  //     ];
  //     const optionalFilled = optionalFields.filter(
  //       (val) => val !== undefined && val !== null && String(val).trim() !== '',
  //     ).length;

  //     score += (optionalFilled / optionalFields.length) * 10;
  //     totalWeight += 10;

  //     // Final percentage
  //     return Math.round(score);
  //   }

  //   // Parse educationalHistory if it's a string
  //   if (typeof body.educationalHistory === 'string') {
  //     try {
  //       const parsedEducationalHistory = JSON.parse(body.educationalHistory);
  //       body = { ...body, educationalHistory: parsedEducationalHistory };
  //     } catch (error) {
  //       throw new BadRequestException('Invalid educationalHistory format.');
  //     }
  //   }

  //   // Parse educationalHistory if it's a string
  //   if (typeof body.employmentHistory === 'string') {
  //     try {
  //       const parsedEmploymentHistory = JSON.parse(body.employmentHistory);
  //       body = { ...body, employmentHistory: parsedEmploymentHistory };
  //     } catch (error) {
  //       throw new BadRequestException('Invalid employmentHistory format.');
  //     }
  //   }
  //   try {
  //     const updatedData: any = { ...body };
  //     const currentUser = await this.userService.userModel.findById(id);

  //     if (!currentUser) {
  //       throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //     }

  //     // Preserve verification data for neighbors
  //     if (updatedData.neighbor && Array.isArray(updatedData.neighbor)) {
  //       updatedData.neighbor = updatedData.neighbor.map((newNeighbor) => {
  //         const existingNeighbor = currentUser.neighbor.find(
  //           (n) => n.phone === newNeighbor.phone,
  //         );

  //         return existingNeighbor
  //           ? {
  //               ...newNeighbor,
  //               verificationLink: existingNeighbor.verificationLink,
  //               verificationToken: existingNeighbor.verificationToken,
  //               status: existingNeighbor.status,
  //               isFollowUpSent: existingNeighbor.isFollowUpSent,
  //               verificationExpiresAt: existingNeighbor.verificationExpiresAt,
  //               isResident: existingNeighbor.isResident,
  //               knownDuration: existingNeighbor.knownDuration,
  //               knowsApplicant: existingNeighbor.knowsApplicant,
  //               verifiedAt: existingNeighbor.verifiedAt,
  //             }
  //           : newNeighbor;
  //       });
  //     }

  //     // Preserve verification data for family members
  //     if (updatedData.family && Array.isArray(updatedData.family)) {
  //       updatedData.family = updatedData.family.map((newFamily) => {
  //         const existingFamily = currentUser.family.find(
  //           (f) => f.phone === newFamily.phone,
  //         );

  //         return existingFamily
  //           ? {
  //               ...newFamily,
  //               verificationLink: existingFamily.verificationLink,
  //               verificationToken: existingFamily.verificationToken,
  //               status: existingFamily.status,
  //               isFollowUpSent: existingFamily.isFollowUpSent,
  //               verificationExpiresAt: existingFamily.verificationExpiresAt,
  //               isResident: existingFamily.isResident,
  //               knownDuration: existingFamily.knownDuration,
  //               knowsApplicant: existingFamily.knowsApplicant,
  //               verifiedAt: existingFamily.verifiedAt,
  //             }
  //           : newFamily;
  //       });
  //     }

  //     const userDoc = await this.userService.findById(id); // get current user
  //     const oldPassportUrl = userDoc.passportPhoto;

  //     if (file) {
  //       if (oldPassportUrl) {
  //         const publicId =
  //           this.cloudinaryService.getFullPublicIdFromUrl(oldPassportUrl);
  //         if (publicId) {
  //           try {
  //             await this.cloudinaryService.deleteFile(publicId);
  //           } catch (err) {
  //             console.warn(`Failed to delete old passport: ${err.message}`);
  //           }
  //         }
  //       }
  //       try {
  //         const passportUrl = await this.cloudinaryService.uploadFile(
  //           file,
  //           'users/passports',
  //           ['image/jpeg', 'image/png', 'image/jpg'],
  //           5,
  //         );
  //         updatedData.passportPhoto = passportUrl;
  //       } catch (error) {
  //         throw new HttpException(
  //           `Passport upload failed: ${error.message}`,
  //           HttpStatus.BAD_REQUEST,
  //         );
  //       }
  //     }

  //     const merged = { ...currentUser.toObject(), ...updatedData };
  //     const completion = calculateProfileCompletion(merged);

  //     updatedData.isProfileCompleted = completion >= 90;
  //     updatedData.profileCompletionPercentage = completion;

  //     const user = await this.userService.userModel.findByIdAndUpdate(
  //       id,
  //       updatedData,
  //       { new: true },
  //     );
  //     if (!user) {
  //       throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //     }

  //     return user;
  //   } catch (error) {
  //     // throw EmailAlreadyUsedException();
  //     throw new HttpException(
  //       error.message || 'An error occurred while updating the profile',
  //       HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

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

    // function isEducationalHistoryComplete(edu: any): boolean {
    //   if (!edu) return false;

    //   const checkSchool = (school) =>
    //     school &&
    //     school.institution?.trim() &&
    //     school.qualification?.trim() &&
    //     school.startDate?.trim() &&
    //     school.endDate?.trim();
    //   // school.name?.trim() &&
    //   // school.address?.trim() &&
    //   // school.yearOfAttendance?.trim();

    //   const primary = checkSchool(edu.primarySchool);
    //   const secondary = checkSchool(edu.secondarySchool);

    //   // const education = checkSchool(edu.educationalHistory);
    //   // const secondary = checkSchool(edu.secondarySchool);

    //   const tertiaryComplete =
    //     Array.isArray(edu.tertiaryInstitutions) &&
    //     edu.tertiaryInstitutions.length > 0;

    //   return primary && secondary && tertiaryComplete;

    //   // return education;
    // }

    function isEducationalHistoryComplete(education: any[]): boolean {
      console.log('education', education);
      if (!Array.isArray(education) || education.length === 0) return false;

      return education.every(
        (edu) =>
          edu.institution?.trim() &&
          edu.qualification?.trim() &&
          edu.startDate?.trim() &&
          edu.endDate?.trim(),
        // job.startYear !== null &&
        // job.startYear !== undefined &&
        // job.endYear !== null &&
        // job.endYear !== undefined,
      );
    }

    function isEmploymentHistoryComplete(history: any[]): boolean {
      if (!Array.isArray(history) || history.length === 0) return false;

      return history.every(
        (job) =>
          job.companyName?.trim() &&
          job.address?.trim() &&
          job.designation?.trim() &&
          job.startDate?.trim() &&
          job.endDate?.trim(),
        // job.startYear !== null &&
        // job.startYear !== undefined &&
        // job.endYear !== null &&
        // job.endYear !== undefined,
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
      // throw EmailAlreadyUsedException();
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

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.GLOBAL_ADMIN, UserRole.SUPPORT_ADMIN)
  @ApiResponse({ type: User, isArray: false })
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @Req() req,
  ) {
    // if (body.role === 'support_admin' && !body.lgaId) {
    //   throw new BadRequestException('Support Admin must be assigned to an LGA');
    // }
    return this.userService.updateUserRole(id, body, req.user);
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
  // async getDashboardStats() {
  //   return this.userService.getDashboardStats();
  // }
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
