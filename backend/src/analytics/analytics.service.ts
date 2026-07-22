import { randomUUID } from 'node:crypto';
import path from 'node:path';

import { Injectable } from '@nestjs/common';

import { JsonStore } from '../common/json-store';
import { config } from '../config';

export type AnalyticsEvent = {
  deviceId: string;
  eventId: string;
  latencyMs: number;
  requestedAt: string;
  result: 'success' | 'rejected' | 'error';
};

export type DeviceAnalytics = {
  averageLatencyMs: number;
  connects: number;
  deviceId: string;
  errors: number;
  lastRequestAt: string | null;
  rejected: number;
};

@Injectable()
export class AnalyticsService {
  private readonly store = new JsonStore<AnalyticsEvent[]>(
    path.join(config.dataDir, 'analytics.json'),
    [],
  );

  async record(
    deviceId: string,
    result: AnalyticsEvent['result'],
    latencyMs: number,
  ): Promise<void> {
    await this.store.update((events) => {
      events.push({
        deviceId,
        eventId: randomUUID(),
        latencyMs,
        requestedAt: new Date().toISOString(),
        result,
      });
    });
  }

  async overview() {
    const events = await this.store.read();
    const devices = this.summarizeDevices(events);

    return {
      devices: Object.fromEntries(devices.map((device) => [device.deviceId, device])),
      errors: events.filter((event) => event.result === 'error').length,
      rejected: events.filter((event) => event.result === 'rejected').length,
      successful: events.filter((event) => event.result === 'success').length,
      total: events.length,
    };
  }

  async devices(): Promise<DeviceAnalytics[]> {
    return this.summarizeDevices(await this.store.read());
  }

  async byDevice(deviceId: string): Promise<{ deviceId: string; events: AnalyticsEvent[] }> {
    const events = (await this.store.read()).filter((event) => event.deviceId === deviceId);
    return { deviceId, events };
  }

  private summarizeDevices(events: AnalyticsEvent[]): DeviceAnalytics[] {
    const grouped = new Map<string, AnalyticsEvent[]>();

    for (const event of events) {
      const deviceEvents = grouped.get(event.deviceId);

      if (deviceEvents) {
        deviceEvents.push(event);
      } else {
        grouped.set(event.deviceId, [event]);
      }
    }

    return [...grouped.entries()]
      .map(([deviceId, deviceEvents]) => ({
        averageLatencyMs: Math.round(
          deviceEvents.reduce((sum, event) => sum + event.latencyMs, 0) / deviceEvents.length,
        ),
        connects: deviceEvents.filter((event) => event.result === 'success').length,
        deviceId,
        errors: deviceEvents.filter((event) => event.result === 'error').length,
        lastRequestAt: deviceEvents.at(-1)?.requestedAt ?? null,
        rejected: deviceEvents.filter((event) => event.result === 'rejected').length,
      }))
      .sort((left, right) => left.deviceId.localeCompare(right.deviceId));
  }
}
