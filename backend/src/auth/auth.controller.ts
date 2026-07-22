import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { ApiErrorDto } from '../common/api-error.dto';
import { config } from '../config';
import { AccessGuard } from './access.guard';
import { AuthMeDto, LoginDto, LogoutResponseDto, RefreshTokenDto, TokenPairDto } from './auth.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login va access/refresh token olish' })
  @ApiCreatedResponse({ type: TokenPairDto })
  @ApiUnauthorizedResponse({ description: 'Login yoki parol notogri', type: ApiErrorDto })
  login(@Body() body: LoginDto) {
    return this.auth.login(body.username, body.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh tokenni rotatsiya qilib yangi token pair olish' })
  @ApiCreatedResponse({ type: TokenPairDto })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalid yoki revoked', type: ApiErrorDto })
  refresh(@Body() body: RefreshTokenDto) {
    return this.auth.refresh(body.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Refresh tokenni revoke qilib logout qilish' })
  @ApiCreatedResponse({ type: LogoutResponseDto })
  logout(@Body() body: RefreshTokenDto) {
    return this.auth.logout(body.refreshToken);
  }

  @Get('me')
  @UseGuards(AccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Joriy admin access tokenini tekshirish' })
  @ApiOkResponse({ type: AuthMeDto })
  @ApiUnauthorizedResponse({
    description: 'Access token mavjud emas yoki invalid',
    type: ApiErrorDto,
  })
  me(): AuthMeDto {
    return { role: 'admin', username: config.adminUsername };
  }
}
