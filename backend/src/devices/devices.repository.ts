import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { JsonStore } from '../common/json-store';
import { config } from '../config';
import { Device } from './device.types';

@Injectable()
export class DevicesRepository {
  private readonly store = new JsonStore<Device[]>(path.join(config.dataDir, 'devices.json'), []);

  all(): Promise<Device[]> {
    return this.store.read();
  }

  transaction<R>(operation: (devices: Device[]) => R | Promise<R>): Promise<R> {
    return this.store.update(operation);
  }
}
