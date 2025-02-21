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
import { UpdateProfileDto, UpdateUserRoleDto } from './users.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from 'src/users/users.role.enum';
import { RolesGuard } from '../common/guards/roles.guard';
import { EmailAlreadyUsedException } from 'src/common/exception';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ParseJSONPipe } from './parse-json.pipe'; // Create a custom pipe to handle JSON parsing.

@ApiTags('users-controller')
@ApiBearerAuth()
@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Get('get-system-users')
  @UseGuards(RolesGuard)
  @ApiResponse({ type: User, isArray: true })
  @Roles(UserRole.SUPER_ADMIN, UserRole.SUPPORT_ADMIN)
  async getSystemUsers(@Req() req: Request) {
    return await this.userService.userModel.find({});
  }

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
      const updatedData: any = { ...body };
      if (file) {
        // updatedData.passportPhoto = `http://localhost:5000/uploads/${file.filename}`;
        updatedData.passportPhoto = `https://identity-management-af43.onrender.com/uploads/${file.filename}`;
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
  @Roles(UserRole.SUPER_ADMIN)
  async getPaginatedData(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.userService.getPaginatedData(page, limit);
  }
}
