import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiSecurity,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { AccessGuard } from '../auth/access.guard';
import { ApiErrorDto } from '../common/api-error.dto';
import {
  ConversationUrlResponseDto,
  CreateDeviceDto,
  DeleteDeviceResponseDto,
  DeviceCredentialsDto,
  DeviceResponseDto,
  UpdateDeviceDto,
} from './device.dto';
import { DevicesService } from './devices.service';

@ApiTags('Devices')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @UseGuards(AccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Barcha device’larni olish' })
  @ApiOkResponse({ type: DeviceResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  list() {
    return this.devices.list();
  }

  @Get(':deviceId')
  @UseGuards(AccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Bitta device’ni ID boyicha olish' })
  @ApiParam({ name: 'deviceId', example: 'esp32-01' })
  @ApiOkResponse({ type: DeviceResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  get(@Param('deviceId') deviceId: string) {
    return this.devices.get(deviceId);
  }

  @Post()
  @UseGuards(AccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Yangi device yaratish' })
  @ApiCreatedResponse({ type: DeviceResponseDto })
  @ApiBadRequestResponse({ description: 'Request validatsiyadan otmadi', type: ApiErrorDto })
  @ApiConflictResponse({ description: 'Device ID mavjud', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  create(@Body() body: CreateDeviceDto) {
    return this.devices.create(body);
  }

  @Patch(':deviceId')
  @UseGuards(AccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Device nomi, API key yoki enabled holatini yangilash' })
  @ApiParam({ name: 'deviceId', example: 'esp32-01' })
  @ApiOkResponse({ type: DeviceResponseDto })
  @ApiBadRequestResponse({ description: 'Request validatsiyadan otmadi', type: ApiErrorDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  update(@Param('deviceId') deviceId: string, @Body() body: UpdateDeviceDto) {
    return this.devices.update(deviceId, body);
  }

  @Delete(':deviceId')
  @UseGuards(AccessGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Device’ni ochirish' })
  @ApiParam({ name: 'deviceId', example: 'esp32-01' })
  @ApiOkResponse({ type: DeleteDeviceResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorDto })
  @ApiUnauthorizedResponse({ type: ApiErrorDto })
  remove(@Param('deviceId') deviceId: string) {
    return this.devices.remove(deviceId);
  }

  @Post(':deviceId/conversation-url')
  @ApiSecurity('device-id')
  @ApiOperation({ summary: 'Device credentiallarini tekshirib ElevenLabs URL olish' })
  @ApiParam({ name: 'deviceId', example: 'esp32-01' })
  @ApiCreatedResponse({ type: ConversationUrlResponseDto })
  @ApiBadRequestResponse({ description: 'Request validatsiyadan otmadi', type: ApiErrorDto })
  @ApiUnauthorizedResponse({ description: 'Device credentiallari notogri', type: ApiErrorDto })
  conversation(
    @Param('deviceId') deviceId: string,
    @Headers('x-api-key') headerDeviceId: string | undefined,
    @Body() body: DeviceCredentialsDto,
  ) {
    return this.devices.conversation(deviceId, headerDeviceId, body.deviceApiKey);
  }
}
