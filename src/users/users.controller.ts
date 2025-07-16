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

@ApiTags('users-controller')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Put(':id')
  @ApiResponse({ type: User, isArray: false })
  @UseInterceptors(
    FileInterceptor('passportPhoto', {
      dest: './uploads',
      limits: { fileSize: 1024 * 1024 * 5 },
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const fileExt = extname(file.originalname);
          cb(null, `${randomName}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/jpg',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
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
      // const updatedData: any = { ...body };
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

      const getBaseUrl = () => {
        return config.isDev
          ? process.env.BASE_URL || 'http://localhost:5000'
          : 'api.citizenship.benuestate.gov.ng';
      };

      if (file) {
        updatedData.passportPhoto = `${getBaseUrl()}/uploads/${file.filename}`;
      }

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
