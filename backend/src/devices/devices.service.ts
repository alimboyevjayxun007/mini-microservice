import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { AnalyticsService } from '../analytics/analytics.service';
import { equal } from '../common/crypto';
import { ElevenLabsService } from '../elevenlabs/elevenlabs.service';
import { Device, PublicDevice } from './device.types';
import { DevicesRepository } from './devices.repository';

type CreateDeviceInput = Pick<Device, 'deviceId' | 'name' | 'deviceApiKey'> & {
  enabled?: boolean;
};

type UpdateDeviceInput = Partial<Pick<Device, 'name' | 'deviceApiKey' | 'enabled'>>;

@Injectable()
export class DevicesService {
  constructor(
    private readonly repository: DevicesRepository,
    private readonly analytics: AnalyticsService,
    private readonly elevenLabs: ElevenLabsService,
  ) {}

  async list(): Promise<PublicDevice[]> {
    return (await this.repository.all()).map((device) => this.publicDevice(device));
  }

  async get(deviceId: string): Promise<PublicDevice> {
    const device = (await this.repository.all()).find((item) => item.deviceId === deviceId);

    if (!device) {
      throw new NotFoundException('Device topilmadi');
    }

    return this.publicDevice(device);
  }

  create(input: CreateDeviceInput): Promise<PublicDevice> {
    return this.repository.transaction((devices) => {
      if (devices.some((device) => device.deviceId === input.deviceId)) {
        throw new ConflictException('Bunday ID bilan device mavjud');
      }

      const now = new Date().toISOString();
      const device: Device = {
        ...input,
        createdAt: now,
        enabled: input.enabled ?? true,
        updatedAt: now,
      };

      devices.push(device);
      return this.publicDevice(device);
    });
  }

  update(deviceId: string, input: UpdateDeviceInput): Promise<PublicDevice> {
    return this.repository.transaction((devices) => {
      const device = devices.find((item) => item.deviceId === deviceId);

      if (!device) {
        throw new NotFoundException('Device topilmadi');
      }

      if (input.name !== undefined) {
        device.name = input.name;
      }
      if (input.deviceApiKey !== undefined) {
        device.deviceApiKey = input.deviceApiKey;
      }
      if (input.enabled !== undefined) {
        device.enabled = input.enabled;
      }
      device.updatedAt = new Date().toISOString();
      return this.publicDevice(device);
    });
  }

  remove(deviceId: string): Promise<{ deleted: true; deviceId: string }> {
    return this.repository.transaction((devices) => {
      const index = devices.findIndex((device) => device.deviceId === deviceId);

      if (index === -1) {
        throw new NotFoundException('Device topilmadi');
      }

      devices.splice(index, 1);
      return { deleted: true, deviceId };
    });
  }

  async conversation(
    deviceId: string,
    headerDeviceId: string | undefined,
    deviceApiKey: string,
  ): Promise<{ conversationUrl: string; deviceId: string }> {
    const startedAt = Date.now();

    try {
      const device = (await this.repository.all()).find((item) => item.deviceId === deviceId);
      const credentialsValid =
        device?.enabled === true &&
        typeof headerDeviceId === 'string' &&
        equal(headerDeviceId, deviceId) &&
        equal(deviceApiKey, device.deviceApiKey);

      if (!credentialsValid) {
        await this.analytics.record(deviceId, 'rejected', Date.now() - startedAt);
        throw new UnauthorizedException('Device credentials invalid');
      }

      const response = this.elevenLabs.conversationUrl();
      await this.analytics.record(deviceId, 'success', Date.now() - startedAt);

      return { deviceId, ...response };
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) {
        await this.analytics.record(deviceId, 'error', Date.now() - startedAt);
      }

      throw error;
    }
  }

  private publicDevice(device: Device): PublicDevice {
    const { deviceApiKey: _deviceApiKey, ...publicDevice } = device;
    return publicDevice;
  }
}
