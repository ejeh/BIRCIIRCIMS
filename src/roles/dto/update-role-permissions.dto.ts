import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '../../users/permissions.enum';

export class UpdateRolePermissionsDto {
  @ApiProperty({
    enum: Permission,
    isArray: true,
    example: [Permission.USER_READ, Permission.USER_UPDATE],
  })
  @IsNotEmpty()
  @IsArray()
  @IsEnum(Permission, { each: true })
  permissions: Permission[];
}
