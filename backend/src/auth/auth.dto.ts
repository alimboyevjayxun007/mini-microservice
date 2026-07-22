import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  @MinLength(1)
  username!: string;

  @ApiProperty({ example: 'admin!@#', format: 'password' })
  @IsString()
  @MinLength(1)
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Login yoki refresh responsedan olingan refresh token' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}

export class TokenPairDto {
  @ApiProperty({ description: 'Admin API endpointlari uchun JWT access token' })
  accessToken!: string;

  @ApiProperty({ example: 900 })
  accessTokenExpiresIn!: number;

  @ApiProperty({ description: 'Yangi token pair olish uchun bir martalik refresh token' })
  refreshToken!: string;

  @ApiProperty({ example: 604800 })
  refreshTokenExpiresIn!: number;
}

export class AuthMeDto {
  @ApiProperty({ example: 'admin' })
  username!: string;

  @ApiProperty({ example: 'admin' })
  role!: 'admin';
}

export class LogoutResponseDto {
  @ApiProperty({ example: true })
  loggedOut!: true;
}
